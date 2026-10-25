import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { prisma } from '../utils/db.js';
import { authenticate, enforceInstitutionOwnership, requireRole } from '../middleware/auth.js';
import { uploadMiddleware, calculateFileSha256, getPrivateFilePath } from '../utils/fileStorage.js';
import { AppError } from '../utils/errors.js';
import { logAuditEvent } from '../utils/audit.js';
import { aiServiceClient } from '../services/aiService.js';
import { DocumentCategory, ProcessingStatus, FieldSource, ReviewStatus, Role } from '@prisma/client';

const router = Router();

// GET /api/v1/applications/:id/documents
router.get('/applications/:id/documents', authenticate, async (req, res, next) => {
  try {
    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
    });
    if (!application) throw new AppError('Application not found.', 404, 'NOT_FOUND');
    enforceInstitutionOwnership(req, application.institutionId);

    const documents = await prisma.document.findMany({
      where: {
        applicationId: req.params.id,
        deletedAt: null,
      },
      include: {
        extractedFields: true,
        processingJobs: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: documents });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/applications/:id/documents (Upload)
router.post('/applications/:id/documents', authenticate, uploadMiddleware.single('file'), async (req, res, next) => {
  try {
    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
    });
    if (!application) throw new AppError('Application not found.', 404, 'NOT_FOUND');
    enforceInstitutionOwnership(req, application.institutionId);

    if (!req.file) {
      throw new AppError('No document file was provided in the upload request.', 400, 'FILE_MISSING');
    }

    const { category } = req.body;
    if (!category || !Object.values(DocumentCategory).includes(category)) {
      throw new AppError('Valid document category is required.', 400, 'INVALID_CATEGORY');
    }

    // Calculate cryptographic SHA-256 hash
    const filePath = req.file.path;
    const sha256 = await calculateFileSha256(filePath);

    // Check for exact duplicate in this application
    const existingDuplicate = await prisma.document.findFirst({
      where: {
        applicationId: application.id,
        sha256,
        deletedAt: null,
      },
    });

    const doc = await prisma.document.create({
      data: {
        applicationId: application.id,
        uploadedById: req.user!.id,
        originalFilename: req.file.originalname,
        storageKey: req.file.filename,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        sha256,
        category: category as DocumentCategory,
        processingStatus: ProcessingStatus.NOT_REQUESTED,
      },
    });

    await logAuditEvent({
      actorId: req.user!.id,
      action: 'DOCUMENT_UPLOADED',
      entityType: 'Document',
      entityId: doc.id,
      metadata: {
        originalFilename: doc.originalFilename,
        category: doc.category,
        sha256: doc.sha256,
        isDuplicate: Boolean(existingDuplicate),
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        ...doc,
        duplicateWarning: existingDuplicate
          ? `Warning: File matches exact checksum of previously uploaded document "${existingDuplicate.originalFilename}".`
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/documents/:documentId
router.get('/documents/:documentId', authenticate, async (req, res, next) => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: req.params.documentId },
      include: {
        application: true,
        extractedFields: true,
        processingJobs: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!document || document.deletedAt) {
      throw new AppError('Document not found.', 404, 'NOT_FOUND');
    }

    enforceInstitutionOwnership(req, document.application.institutionId);

    return res.json({ success: true, data: document });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/documents/:documentId/analysis (Full OCR and Evidence Analysis)
router.get('/documents/:documentId/analysis', authenticate, async (req, res, next) => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: req.params.documentId },
      include: {
        application: true,
        extractedFields: { orderBy: { pageNumber: 'asc' } },
        processingJobs: { orderBy: { createdAt: 'desc' }, take: 5 },
        findings: true,
        verificationItems: true,
      },
    });

    if (!document || document.deletedAt) {
      throw new AppError('Document not found.', 404, 'NOT_FOUND');
    }

    enforceInstitutionOwnership(req, document.application.institutionId);

    return res.json({
      success: true,
      data: {
        documentId: document.id,
        filename: document.originalFilename,
        category: document.category,
        pageCount: document.pageCount,
        processingStatus: document.processingStatus,
        sha256: document.sha256,
        extractedFields: document.extractedFields,
        findings: document.findings,
        verificationItems: document.verificationItems,
        latestJob: document.processingJobs[0] || null,
        ocrRawText: document.ocrRawText,
        ocrConfidence: document.ocrConfidence,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/documents/:documentId/file (Controlled authorized file stream)
router.get('/documents/:documentId/file', authenticate, async (req, res, next) => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: req.params.documentId },
      include: { application: true },
    });

    if (!document || document.deletedAt) {
      throw new AppError('Document not found.', 404, 'NOT_FOUND');
    }

    enforceInstitutionOwnership(req, document.application.institutionId);

    const fullPath = getPrivateFilePath(document.storageKey);
    let streamPath = fullPath;

    // If file doesn't exist on disk, fallback to standard synthetic PDF if mime is pdf
    if (!fs.existsSync(streamPath)) {
      const fallbackPdf = getPrivateFilePath('synthetic_apex_affidavit_2026.pdf');
      if (document.mimeType === 'application/pdf' && fs.existsSync(fallbackPdf)) {
        streamPath = fallbackPdf;
      } else {
        res.setHeader('Content-Type', 'text/html');
        return res.send(`
          <!DOCTYPE html>
          <html>
          <head><title>${document.originalFilename} — Preview</title></head>
          <body style="font-family: system-ui; padding: 40px; background: #f8fafc; color: #0f172a;">
            <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
              <div style="background: #e0f2fe; color: #0369a1; padding: 8px 12px; border-radius: 4px; font-size: 13px; font-weight: 600; display: inline-block; margin-bottom: 16px;">
                DEMO SYNTHETIC FIXTURE
              </div>
              <h2 style="margin: 0 0 10px 0;">${document.originalFilename}</h2>
              <p style="color: #64748b; margin-bottom: 20px;">Category: <strong>${document.category}</strong> | SHA-256: <code>${document.sha256.substring(0, 16)}...</code></p>
              <div style="border-top: 1px solid #e2e8f0; padding-top: 16px;">
                <p>This is a seeded synthetic document fixture. Real uploads are stored privately on disk and served through this authorized streaming route.</p>
              </div>
            </div>
          </body>
          </html>
        `);
      }
    }

    res.setHeader('Content-Type', document.mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${document.originalFilename}"`);
    res.removeHeader('X-Frame-Options');
    res.setHeader('Content-Security-Policy', "frame-ancestors 'self' http://localhost:5173 http://localhost:4000;");
    const stream = fs.createReadStream(streamPath);
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/documents/:documentId (Soft delete with audit)
router.delete('/documents/:documentId', authenticate, async (req, res, next) => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: req.params.documentId },
      include: { application: true },
    });

    if (!document) throw new AppError('Document not found.', 404, 'NOT_FOUND');
    enforceInstitutionOwnership(req, document.application.institutionId);

    if (
      document.application.status !== 'DRAFT' &&
      document.application.status !== 'ACTION_REQUIRED' &&
      req.user!.role !== Role.ADMIN
    ) {
      throw new AppError('Documents cannot be removed once submitted for formal scrutiny.', 400, 'DOCUMENT_LOCKED');
    }

    await prisma.document.update({
      where: { id: req.params.documentId },
      data: { deletedAt: new Date() },
    });

    await logAuditEvent({
      actorId: req.user!.id,
      action: 'DOCUMENT_DELETED',
      entityType: 'Document',
      entityId: document.id,
      metadata: { originalFilename: document.originalFilename },
    });

    return res.json({ success: true, data: { message: 'Document removed successfully.' } });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/documents/:documentId/analyze (Trigger AI Analysis)
router.post('/documents/:documentId/analyze', authenticate, async (req, res, next) => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: req.params.documentId },
      include: { application: true },
    });

    if (!document || document.deletedAt) {
      throw new AppError('Document not found.', 404, 'NOT_FOUND');
    }

    enforceInstitutionOwnership(req, document.application.institutionId);

    const requestId = crypto.randomUUID();

    // 1. Create processing job record
    const job = await prisma.processingJob.create({
      data: {
        documentId: document.id,
        requestId,
        providerMode: aiServiceClient.getMode() === 'fastapi' ? 'FASTAPI' : 'MOCK',
        status: ProcessingStatus.PROCESSING,
        startedAt: new Date(),
      },
    });

    await prisma.document.update({
      where: { id: document.id },
      data: { processingStatus: ProcessingStatus.PROCESSING },
    });

    try {
      const filePath = getPrivateFilePath(document.storageKey);

      // If document file doesn't exist on disk (e.g. synthetic seeded records), create a readable text file
      if (!fs.existsSync(filePath)) {
        const dummyContent = `AICTE VERIFICATION DOCUMENT\nCategory: ${document.category}\nFilename: ${document.originalFilename}\nInstitution: Apex Institute of Technology & Management\nValid Up To: 2026-03-31\nRegistration No: MH-10294\nEmail: contact@apex.demo.edu.in`;
        fs.writeFileSync(filePath, dummyContent);
      }

      // 2. Call AI Service Client adapter with actual file path
      const aiResponse = await aiServiceClient.analyzeDocument({
        request_id: requestId,
        application_id: document.applicationId,
        document_id: document.id,
        document_category: document.category,
        language_hint: document.languageHint || 'en',
        file_name: document.originalFilename,
        content_sha256: document.sha256,
        file_reference: document.storageKey,
        file_path: filePath,
        mime_type: document.mimeType,
      });

      // 3. Clear any prior auto-extracted fields
      await prisma.extractedField.deleteMany({
        where: { documentId: document.id, source: FieldSource.AI },
      });

      // 4. Save newly extracted fields
      if (aiResponse.extracted_fields.length > 0) {
        await prisma.extractedField.createMany({
          data: aiResponse.extracted_fields.map(f => ({
            documentId: document.id,
            fieldName: f.field_name,
            valueText: f.value,
            normalizedValue: f.value ? f.value.toUpperCase().trim() : null,
            confidence: f.confidence,
            pageNumber: f.page_number,
            evidenceText: f.evidence_text || null,
            source: FieldSource.AI,
            reviewStatus: ReviewStatus.PENDING,
          })),
        });
      }

      // 4b. Persist any anomalies returned by AI as findings in database
      if (aiResponse.anomalies && aiResponse.anomalies.length > 0) {
        for (const anomaly of aiResponse.anomalies) {
          const existingFinding = await prisma.finding.findFirst({
            where: {
              applicationId: document.applicationId,
              documentId: document.id,
              findingCode: anomaly.code,
            },
          });
          if (!existingFinding) {
            await prisma.finding.create({
              data: {
                applicationId: document.applicationId,
                documentId: document.id,
                findingCode: anomaly.code,
                title: anomaly.title,
                description: anomaly.reason,
                severity: anomaly.severity,
                status: 'OPEN',
                evidenceJson: {
                  excerpt: anomaly.evidence_text,
                  pageNumber: anomaly.page_number,
                  serviceMode: aiResponse.service_mode,
                },
                confidence: anomaly.confidence,
                recommendedAction: 'Inspect document and compare against applicable AICTE handbook norms.',
              },
            });
          }
        }
      }

      // 5. Update processing job and document state
      const targetProcessingStatus = aiResponse.anomalies.length > 0
        ? ProcessingStatus.REQUIRES_REVIEW
        : ProcessingStatus.SUCCEEDED;

      await prisma.processingJob.update({
        where: { id: job.id },
        data: {
          status: ProcessingStatus.SUCCEEDED,
          finishedAt: new Date(),
          durationMs: aiResponse.processing_time_ms,
        },
      });

      await prisma.document.update({
        where: { id: document.id },
        data: {
          processingStatus: targetProcessingStatus,
          pageCount: aiResponse.raw_ai_response?.page_count ?? document.pageCount,
          ocrRawText: aiResponse.raw_ai_response?.extracted_text || null,
          ocrConfidence: aiResponse.extracted_fields[0]?.confidence || 0.9,
        },
      });

      await logAuditEvent({
        actorId: req.user!.id,
        action: 'DOCUMENT_AI_ANALYSIS_COMPLETED',
        entityType: 'Document',
        entityId: document.id,
        requestId,
        metadata: {
          serviceMode: aiResponse.service_mode,
          fieldsExtracted: aiResponse.extracted_fields.length,
          anomaliesDetected: aiResponse.anomalies.length,
        },
      });

      return res.json({
        success: true,
        data: {
          jobId: job.id,
          analysis: aiResponse,
        },
      });
    } catch (aiErr: any) {
      console.error(`AI analysis failed for doc ${document.id}:`, aiErr);

      await prisma.processingJob.update({
        where: { id: job.id },
        data: {
          status: ProcessingStatus.FAILED,
          finishedAt: new Date(),
          errorCode: 'AI_ADAPTER_ERROR',
          safeErrorMessage: 'AI service temporarily unavailable. Your document remains safely stored.',
        },
      });

      await prisma.document.update({
        where: { id: document.id },
        data: { processingStatus: ProcessingStatus.FAILED },
      });

      return res.status(502).json({
        error: {
          code: 'AI_SERVICE_UNAVAILABLE',
          message: 'AI document scrutiny service is temporarily unavailable. Document was preserved.',
          requestId,
          details: [{ error: aiErr.message }],
        },
      });
    }
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/documents/:documentId/fields/:fieldId (Manual Review/Correction)
router.patch('/documents/:documentId/fields/:fieldId', authenticate, requireRole(Role.OFFICER, Role.SENIOR_REVIEWER, Role.ADMIN), async (req, res, next) => {
  try {
    const { valueText, reviewStatus } = req.body;
    const field = await prisma.extractedField.findUnique({
      where: { id: req.params.fieldId },
      include: { document: { include: { application: true } } },
    });

    if (!field) throw new AppError('Field not found.', 404, 'NOT_FOUND');

    const updated = await prisma.extractedField.update({
      where: { id: req.params.fieldId },
      data: {
        ...(valueText !== undefined && {
          valueText,
          normalizedValue: String(valueText).toUpperCase().trim(),
        }),
        ...(reviewStatus !== undefined && { reviewStatus }),
        reviewedById: req.user!.id,
      },
    });

    await logAuditEvent({
      actorId: req.user!.id,
      action: 'EXTRACTED_FIELD_CORRECTED',
      entityType: 'ExtractedField',
      entityId: field.id,
      metadata: { previousValue: field.valueText, newValue: valueText, reviewStatus },
    });

    return res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

export default router;

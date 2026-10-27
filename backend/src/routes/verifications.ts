import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/db.js';
import { authenticate, requireRole, enforceInstitutionOwnership } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { AppError } from '../utils/errors.js';
import { logAuditEvent } from '../utils/audit.js';
import { VerificationStatus, ProviderMode, Role } from '@prisma/client';

const router = Router();

const createVerificationSchema = z.object({
  issuerName: z.string().min(2),
  verificationMethod: z.string().min(2),
  referenceNumber: z.string().optional(),
});

// GET /api/v1/verifications (All verifications for reviewers)
router.get('/verifications', authenticate, async (req, res, next) => {
  try {
    const user = req.user!;
    const filter = (user.role === Role.APPLICANT && user.institutionId)
      ? { application: { institutionId: user.institutionId } }
      : {};

    const verifications = await prisma.sourceVerification.findMany({
      where: filter,
      include: {
        application: { include: { institution: true } },
        document: { select: { id: true, originalFilename: true, category: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: verifications });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/documents/:documentId/verifications
router.post('/documents/:documentId/verifications', authenticate, requireRole(Role.OFFICER, Role.SENIOR_REVIEWER, Role.ADMIN), validateRequest(createVerificationSchema), async (req, res, next) => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: req.params.documentId },
      include: { application: true },
    });

    if (!document) throw new AppError('Document not found.', 404, 'NOT_FOUND');

    const { issuerName, verificationMethod, referenceNumber } = req.body;

    // Simulated check execution
    const isSuccess = Math.random() > 0.15; // 85% match simulation
    const verification = await prisma.sourceVerification.create({
      data: {
        applicationId: document.applicationId,
        documentId: document.id,
        issuerName,
        verificationMethod,
        referenceNumber,
        status: isSuccess ? VerificationStatus.SIMULATED : VerificationStatus.MANUAL_REVIEW_REQUIRED,
        requestTimestamp: new Date(),
        responseTimestamp: new Date(),
        submittedDataJson: {
          originalFilename: document.originalFilename,
          referenceNumber: referenceNumber || 'AUTO_EXTRACTED',
          category: document.category,
        },
        returnedDataJson: {
          simulated: true,
          matchStatus: isSuccess ? 'MATCH_FOUND' : 'REQUIRES_PHYSICAL_SCRUTINY',
          note: 'Simulated check: Not an independent live portal query.',
        },
        resultSummary: isSuccess
          ? 'SIMULATED: Document attributes consistent with synthetic issuer registry.'
          : 'MANUAL REVIEW REQUIRED: Record not automatically resolved. Physical officer verification advised.',
        providerMode: ProviderMode.MOCK,
        createdById: req.user!.id,
      },
    });

    await prisma.document.update({
      where: { id: document.id },
      data: {
        verificationStatus: verification.status,
      },
    });

    await logAuditEvent({
      actorId: req.user!.id,
      action: 'SOURCE_VERIFICATION_PERFORMED',
      entityType: 'SourceVerification',
      entityId: verification.id,
      metadata: {
        documentId: document.id,
        issuerName,
        status: verification.status,
      },
    });

    return res.status(201).json({ success: true, data: verification });
  } catch (error) {
    next(error);
  }
});

export default router;

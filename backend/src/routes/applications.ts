import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/db.js';
import { authenticate, requireRole, enforceInstitutionOwnership } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { AppError } from '../utils/errors.js';
import { logAuditEvent } from '../utils/audit.js';
import { runApplicationValidation } from '../services/complianceEngine.js';
import { comparePreviousEoa } from '../services/eoaComparisonEngine.js';
import { ApplicationStatus, ApplicationCategory, Role, Severity, RunType } from '@prisma/client';

const router = Router();

// Allowed state transitions
const ALLOWED_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  [ApplicationStatus.DRAFT]: [ApplicationStatus.SUBMITTED],
  [ApplicationStatus.SUBMITTED]: [ApplicationStatus.PROCESSING, ApplicationStatus.UNDER_SCRUTINY],
  [ApplicationStatus.PROCESSING]: [ApplicationStatus.UNDER_SCRUTINY, ApplicationStatus.ACTION_REQUIRED],
  [ApplicationStatus.UNDER_SCRUTINY]: [ApplicationStatus.ACTION_REQUIRED, ApplicationStatus.ESCALATED, ApplicationStatus.COMPLETED_IN_PROTOTYPE],
  [ApplicationStatus.ACTION_REQUIRED]: [ApplicationStatus.RESUBMITTED],
  [ApplicationStatus.RESUBMITTED]: [ApplicationStatus.UNDER_SCRUTINY, ApplicationStatus.PROCESSING],
  [ApplicationStatus.ESCALATED]: [ApplicationStatus.UNDER_SCRUTINY, ApplicationStatus.COMPLETED_IN_PROTOTYPE],
  [ApplicationStatus.COMPLETED_IN_PROTOTYPE]: [], // Terminal state in prototype
};

const createApplicationSchema = z.object({
  institutionId: z.string().uuid(),
  category: z.nativeEnum(ApplicationCategory),
  academicYear: z.string().default('2026-2027'),
  submissionNotes: z.string().optional(),
});

const transitionSchema = z.object({
  targetStatus: z.nativeEnum(ApplicationStatus),
  reason: z.string().min(3, 'A clear reason for the state transition is required'),
});

const assignOfficerSchema = z.object({
  officerId: z.string().uuid(),
});

// GET /api/v1/applications
router.get('/', authenticate, async (req, res, next) => {
  try {
    const user = req.user!;
    const {
      search,
      category,
      status,
      severity,
      page = '1',
      limit = '10',
      sortBy = 'updatedAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    // Multi-tenant isolation: Applicants only see their own institution's applications
    if (user.role === Role.APPLICANT && user.institutionId) {
      where.institutionId = user.institutionId;
    }

    if (category) {
      where.category = category;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      const searchStr = String(search).trim();
      where.OR = [
        { referenceNumber: { contains: searchStr, mode: 'insensitive' } },
        { institution: { name: { contains: searchStr, mode: 'insensitive' } } },
        { institution: { institutionCode: { contains: searchStr, mode: 'insensitive' } } },
      ];
    }

    if (severity) {
      where.findings = {
        some: {
          severity: severity as Severity,
          status: 'OPEN',
        },
      };
    }

    // Whitelist allowed sort keys to prevent injection
    const allowedSortFields = ['createdAt', 'updatedAt', 'referenceNumber', 'status', 'submittedAt'];
    const safeSortBy = allowedSortFields.includes(sortBy as string) ? (sortBy as string) : 'updatedAt';
    const safeSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

    const [total, applications] = await Promise.all([
      prisma.application.count({ where }),
      prisma.application.findMany({
        where,
        include: {
          institution: true,
          assignedOfficer: { select: { id: true, name: true, email: true } },
          _count: {
            select: {
              documents: { where: { deletedAt: null } },
              findings: { where: { status: 'OPEN' } },
            },
          },
        },
        orderBy: { [safeSortBy]: safeSortOrder },
        skip,
        take: limitNum,
      }),
    ]);

    return res.json({
      success: true,
      data: {
        items: applications,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/applications
router.post('/', authenticate, validateRequest(createApplicationSchema), async (req, res, next) => {
  try {
    const user = req.user!;
    enforceInstitutionOwnership(req, req.body.institutionId);

    // Generate human readable reference e.g. "AICTE/2026-27/1-XXXXXXXX"
    const randomSuffix = Math.floor(10000000 + Math.random() * 90000000);
    const referenceNumber = `AICTE/2026-27/1-${randomSuffix}`;

    const application = await prisma.application.create({
      data: {
        referenceNumber,
        institutionId: req.body.institutionId,
        createdById: user.id,
        category: req.body.category,
        academicYear: req.body.academicYear,
        submissionNotes: req.body.submissionNotes,
        status: ApplicationStatus.DRAFT,
      },
      include: {
        institution: true,
      },
    });

    await logAuditEvent({
      actorId: user.id,
      action: 'APPLICATION_CREATED',
      entityType: 'Application',
      entityId: application.id,
      metadata: { referenceNumber, category: application.category },
    });

    return res.status(201).json({ success: true, data: application });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/applications/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
      include: {
        institution: true,
        createdBy: { select: { id: true, name: true, email: true } },
        assignedOfficer: { select: { id: true, name: true, email: true } },
        documents: {
          where: { deletedAt: null },
          include: {
            extractedFields: true,
            processingJobs: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
        findings: {
          include: {
            document: { select: { id: true, originalFilename: true, category: true } },
            reviewer: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        sourceVerifications: {
          include: {
            document: { select: { id: true, originalFilename: true } },
            createdBy: { select: { id: true, name: true } },
          },
        },
        validationRuns: {
          orderBy: { startedAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!application) {
      throw new AppError('Application not found.', 404, 'NOT_FOUND');
    }

    enforceInstitutionOwnership(req, application.institutionId);

    return res.json({ success: true, data: application });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/applications/:id
router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
    });
    if (!application) throw new AppError('Application not found.', 404, 'NOT_FOUND');
    enforceInstitutionOwnership(req, application.institutionId);

    if (application.status !== ApplicationStatus.DRAFT && application.status !== ApplicationStatus.ACTION_REQUIRED) {
      throw new AppError('Applications can only be modified in Draft or Action Required state.', 400, 'STATE_LOCKED');
    }

    const { submissionNotes, academicYear, category } = req.body;
    const updated = await prisma.application.update({
      where: { id: req.params.id },
      data: {
        ...(submissionNotes !== undefined && { submissionNotes }),
        ...(academicYear !== undefined && { academicYear }),
        ...(category !== undefined && { category }),
      },
      include: { institution: true },
    });

    return res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/applications/:id/submit
router.post('/:id/submit', authenticate, async (req, res, next) => {
  try {
    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
      include: { documents: { where: { deletedAt: null } } },
    });

    if (!application) throw new AppError('Application not found.', 404, 'NOT_FOUND');
    enforceInstitutionOwnership(req, application.institutionId);

    if (application.status !== ApplicationStatus.DRAFT && application.status !== ApplicationStatus.ACTION_REQUIRED) {
      throw new AppError('Only applications in DRAFT or ACTION_REQUIRED status can be submitted.', 400, 'INVALID_TRANSITION');
    }

    if (application.documents.length === 0) {
      throw new AppError('Please upload at least one mandatory compliance document before submitting.', 400, 'NO_DOCUMENTS');
    }

    const targetStatus = application.status === ApplicationStatus.ACTION_REQUIRED
      ? ApplicationStatus.RESUBMITTED
      : ApplicationStatus.SUBMITTED;

    const updated = await prisma.application.update({
      where: { id: req.params.id },
      data: {
        status: targetStatus,
        submittedAt: new Date(),
      },
    });

    await logAuditEvent({
      actorId: req.user!.id,
      action: targetStatus === ApplicationStatus.RESUBMITTED ? 'APPLICATION_RESUBMITTED' : 'APPLICATION_SUBMITTED',
      entityType: 'Application',
      entityId: application.id,
      metadata: { previousStatus: application.status, targetStatus },
    });

    // Automatically trigger preliminary validation run
    await runApplicationValidation(application.id, req.user!.id, targetStatus === ApplicationStatus.RESUBMITTED ? RunType.RESUBMISSION : RunType.AUTOMATIC);

    return res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/applications/:id/assign
router.post('/:id/assign', authenticate, requireRole(Role.OFFICER, Role.SENIOR_REVIEWER, Role.ADMIN), validateRequest(assignOfficerSchema), async (req, res, next) => {
  try {
    const officer = await prisma.user.findUnique({
      where: { id: req.body.officerId },
    });

    if (!officer || (officer.role !== Role.OFFICER && officer.role !== Role.SENIOR_REVIEWER)) {
      throw new AppError('Selected user is not an authorized Scrutiny Officer.', 400, 'INVALID_OFFICER');
    }

    const application = await prisma.application.update({
      where: { id: req.params.id },
      data: { assignedOfficerId: req.body.officerId },
      include: { assignedOfficer: { select: { id: true, name: true, email: true } } },
    });

    await logAuditEvent({
      actorId: req.user!.id,
      action: 'OFFICER_ASSIGNED',
      entityType: 'Application',
      entityId: application.id,
      metadata: { officerName: officer.name, officerId: officer.id },
    });

    return res.json({ success: true, data: application });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/applications/:id/transition
router.post('/:id/transition', authenticate, requireRole(Role.OFFICER, Role.SENIOR_REVIEWER, Role.ADMIN), validateRequest(transitionSchema), async (req, res, next) => {
  try {
    const { targetStatus, reason } = req.body;
    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
    });

    if (!application) throw new AppError('Application not found.', 404, 'NOT_FOUND');

    const allowed = ALLOWED_TRANSITIONS[application.status] || [];
    if (!allowed.includes(targetStatus)) {
      throw new AppError(
        `Invalid status transition from ${application.status} to ${targetStatus}. Allowed: ${allowed.join(', ') || 'None'}`,
        400,
        'INVALID_STATUS_TRANSITION'
      );
    }

    const updated = await prisma.application.update({
      where: { id: req.params.id },
      data: { status: targetStatus },
    });

    await logAuditEvent({
      actorId: req.user!.id,
      action: 'WORKFLOW_STATE_TRANSITION',
      entityType: 'Application',
      entityId: application.id,
      metadata: { fromStatus: application.status, toStatus: targetStatus, reason },
    });

    return res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/applications/:id/validate
router.post('/:id/validate', authenticate, async (req, res, next) => {
  try {
    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
    });

    if (!application) throw new AppError('Application not found.', 404, 'NOT_FOUND');
    enforceInstitutionOwnership(req, application.institutionId);

    const result = await runApplicationValidation(application.id, req.user!.id, RunType.MANUAL);
    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/applications/:id/activity
router.get('/:id/activity', authenticate, async (req, res, next) => {
  try {
    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
    });
    if (!application) throw new AppError('Application not found.', 404, 'NOT_FOUND');
    enforceInstitutionOwnership(req, application.institutionId);

    const events = await prisma.auditEvent.findMany({
      where: {
        OR: [
          { entityId: application.id },
          { metadataJson: { path: ['applicationId'], equals: application.id } },
        ],
      },
      include: {
        actor: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return res.json({ success: true, data: events });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/applications/:id/report
router.get('/:id/report', authenticate, async (req, res, next) => {
  try {
    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
      include: {
        institution: true,
        assignedOfficer: { select: { name: true, email: true } },
        documents: {
          where: { deletedAt: null },
          include: { extractedFields: true },
        },
        findings: {
          include: { reviewer: { select: { name: true } } },
        },
        sourceVerifications: true,
        validationRuns: { orderBy: { startedAt: 'desc' }, take: 1 },
      },
    });

    if (!application) throw new AppError('Application not found.', 404, 'NOT_FOUND');
    enforceInstitutionOwnership(req, application.institutionId);

    const report = {
      generatedAt: new Date(),
      disclaimer: 'This consolidated scrutiny report was generated by AICTE 90*. Findings are preliminary and advisory. Final regulatory decisions rest with authorized AICTE committees.',
      application: {
        referenceNumber: application.referenceNumber,
        category: application.category,
        academicYear: application.academicYear,
        status: application.status,
        submittedAt: application.submittedAt,
        institution: application.institution,
        assignedOfficer: application.assignedOfficer,
      },
      documentSummary: {
        totalUploaded: application.documents.length,
        categories: application.documents.map(d => ({
          filename: d.originalFilename,
          category: d.category,
          status: d.processingStatus,
          sha256: d.sha256,
        })),
      },
      complianceSummary: {
        totalFindings: application.findings.length,
        openFindings: application.findings.filter(f => f.status === 'OPEN').length,
        confirmedFindings: application.findings.filter(f => f.status === 'CONFIRMED').length,
        dismissedFindings: application.findings.filter(f => f.status === 'DISMISSED').length,
        findings: application.findings,
      },
      sourceVerifications: application.sourceVerifications,
    };

    return res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/applications/:id/compare-previous-eoa (Trigger Previous EoA Comparison)
router.post('/:id/compare-previous-eoa', authenticate, async (req, res, next) => {
  try {
    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
    });
    if (!application) throw new AppError('Application not found.', 404, 'NOT_FOUND');
    enforceInstitutionOwnership(req, application.institutionId);

    const report = await comparePreviousEoa(application.id, req.user!.id);
    return res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/applications/:id/comparison (Fetch Structured Previous EoA Comparison Report)
router.get('/:id/comparison', authenticate, async (req, res, next) => {
  try {
    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
    });
    if (!application) throw new AppError('Application not found.', 404, 'NOT_FOUND');
    enforceInstitutionOwnership(req, application.institutionId);

    const report = await comparePreviousEoa(application.id, req.user!.id);
    return res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/applications/:id/verification-checklist (Fetch Officer Verification Checklist)
router.get('/:id/verification-checklist', authenticate, async (req, res, next) => {
  try {
    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
    });
    if (!application) throw new AppError('Application not found.', 404, 'NOT_FOUND');
    enforceInstitutionOwnership(req, application.institutionId);

    const { category, reviewStatus, comparisonResult } = req.query;
    const where: any = { applicationId: application.id };

    if (category) where.category = String(category);
    if (reviewStatus) where.reviewStatus = String(reviewStatus);
    if (comparisonResult) where.comparisonResult = String(comparisonResult);

    let items = await prisma.verificationItem.findMany({
      where,
      include: {
        document: true,
        reviewedBy: { select: { id: true, name: true, role: true, email: true } },
        clarificationRequests: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // If checklist is empty, run comparison to generate checklist
    if (items.length === 0) {
      await comparePreviousEoa(application.id, req.user!.id);
      items = await prisma.verificationItem.findMany({
        where,
        include: {
          document: true,
          reviewedBy: { select: { id: true, name: true, role: true, email: true } },
          clarificationRequests: { orderBy: { createdAt: 'desc' } },
        },
        orderBy: { createdAt: 'asc' },
      });
    }

    return res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/verification-items/:itemId/review (Officer Records Verification Decision & Comments)
router.patch('/verification-items/:itemId/review', authenticate, requireRole(Role.OFFICER, Role.SENIOR_REVIEWER, Role.ADMIN), async (req, res, next) => {
  try {
    const { reviewStatus, officerComments } = req.body;
    if (!reviewStatus) {
      throw new AppError('Review status is required.', 400, 'STATUS_REQUIRED');
    }

    const item = await prisma.verificationItem.findUnique({
      where: { id: req.params.itemId },
      include: { application: true },
    });

    if (!item) throw new AppError('Verification item not found.', 404, 'NOT_FOUND');

    const updated = await prisma.verificationItem.update({
      where: { id: req.params.itemId },
      data: {
        reviewStatus,
        officerComments: officerComments !== undefined ? officerComments : item.officerComments,
        reviewedById: req.user!.id,
        reviewedAt: new Date(),
      },
      include: {
        reviewedBy: { select: { id: true, name: true, role: true } },
        document: true,
      },
    });

    await logAuditEvent({
      actorId: req.user!.id,
      action: 'VERIFICATION_ITEM_REVIEWED',
      entityType: 'VerificationItem',
      entityId: item.id,
      metadata: {
        applicationId: item.applicationId,
        previousStatus: item.reviewStatus,
        newStatus: reviewStatus,
        comments: officerComments,
      },
    });

    return res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/applications/:id/clarification-requests (Officer Raises Clarification Request)
router.post('/:id/clarification-requests', authenticate, requireRole(Role.OFFICER, Role.SENIOR_REVIEWER, Role.ADMIN), async (req, res, next) => {
  try {
    const { verificationItemId, subject, queryText, deadline } = req.body;
    if (!subject || !queryText) {
      throw new AppError('Subject and clarification query details are required.', 400, 'FIELDS_REQUIRED');
    }

    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
      include: { createdBy: true },
    });
    if (!application) throw new AppError('Application not found.', 404, 'NOT_FOUND');

    const clarification = await prisma.clarificationRequest.create({
      data: {
        applicationId: application.id,
        verificationItemId: verificationItemId || null,
        requestedById: req.user!.id,
        subject,
        queryText,
        deadline: deadline ? new Date(deadline) : null,
        status: 'OPEN',
      },
      include: {
        requestedBy: { select: { id: true, name: true, role: true } },
        verificationItem: true,
      },
    });

    // Update item status if linked
    if (verificationItemId) {
      await prisma.verificationItem.update({
        where: { id: verificationItemId },
        data: { reviewStatus: 'CLARIFICATION_REQUESTED' },
      });
    }

    // Send in-app notification to applicant
    await prisma.notification.create({
      data: {
        userId: application.createdById,
        type: 'CLARIFICATION_REQUESTED',
        title: `Clarification Requested: ${subject}`,
        message: `An AICTE scrutiny officer has requested clarification on application ${application.referenceNumber}: "${queryText.substring(0, 100)}..."`,
        entityType: 'Application',
        entityId: application.id,
      },
    });

    await logAuditEvent({
      actorId: req.user!.id,
      action: 'CLARIFICATION_REQUESTED',
      entityType: 'ClarificationRequest',
      entityId: clarification.id,
      metadata: {
        applicationId: application.id,
        subject,
        verificationItemId,
      },
    });

    return res.status(201).json({ success: true, data: clarification });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/applications/:id/clarification-requests (List Clarification Requests)
router.get('/:id/clarification-requests', authenticate, async (req, res, next) => {
  try {
    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
    });
    if (!application) throw new AppError('Application not found.', 404, 'NOT_FOUND');
    enforceInstitutionOwnership(req, application.institutionId);

    const clarifications = await prisma.clarificationRequest.findMany({
      where: { applicationId: application.id },
      include: {
        requestedBy: { select: { id: true, name: true, role: true } },
        verificationItem: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: clarifications });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/clarification-requests/:reqId/respond (Applicant Responds to Clarification)
router.patch('/clarification-requests/:reqId/respond', authenticate, async (req, res, next) => {
  try {
    const { responseNotes, responseDocumentId } = req.body;
    if (!responseNotes) {
      throw new AppError('Response explanation is required.', 400, 'RESPONSE_REQUIRED');
    }

    const clarification = await prisma.clarificationRequest.findUnique({
      where: { id: req.params.reqId },
      include: { application: true },
    });

    if (!clarification) throw new AppError('Clarification request not found.', 404, 'NOT_FOUND');
    enforceInstitutionOwnership(req, clarification.application.institutionId);

    const updated = await prisma.clarificationRequest.update({
      where: { id: req.params.reqId },
      data: {
        responseNotes,
        responseDocumentId: responseDocumentId || null,
        status: 'RESPONDED',
        respondedAt: new Date(),
      },
      include: {
        requestedBy: { select: { id: true, name: true, role: true } },
        verificationItem: true,
      },
    });

    // Notify assigned officer
    if (clarification.application.assignedOfficerId) {
      await prisma.notification.create({
        data: {
          userId: clarification.application.assignedOfficerId,
          type: 'CLARIFICATION_RESPONDED',
          title: `Applicant Responded to Clarification`,
          message: `Institution replied to clarification request "${clarification.subject}" on application ${clarification.application.referenceNumber}.`,
          entityType: 'Application',
          entityId: clarification.application.id,
        },
      });
    }

    await logAuditEvent({
      actorId: req.user!.id,
      action: 'CLARIFICATION_RESPONDED',
      entityType: 'ClarificationRequest',
      entityId: clarification.id,
      metadata: {
        applicationId: clarification.applicationId,
        responseNotes,
      },
    });

    return res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/applications/:id/audit-trail (Traceable Provenance & Review History)
router.get('/:id/audit-trail', authenticate, async (req, res, next) => {
  try {
    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
    });
    if (!application) throw new AppError('Application not found.', 404, 'NOT_FOUND');
    enforceInstitutionOwnership(req, application.institutionId);

    // Fetch audit events related to this application
    const events = await prisma.auditEvent.findMany({
      where: {
        OR: [
          { entityId: application.id },
          { entityType: 'Application', entityId: application.id },
        ],
      },
      include: {
        actor: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return res.json({ success: true, data: events });
  } catch (error) {
    next(error);
  }
});

export default router;

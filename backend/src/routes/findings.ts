import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/db.js';
import { authenticate, requireRole, enforceInstitutionOwnership } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { AppError } from '../utils/errors.js';
import { logAuditEvent } from '../utils/audit.js';
import { FindingStatus, Role } from '@prisma/client';

const router = Router();

const reviewFindingSchema = z.object({
  status: z.enum(['CONFIRMED', 'DISMISSED', 'NEEDS_MORE_EVIDENCE', 'UNDER_REVIEW']),
  reviewReason: z.string().min(5, 'A clear documented reason is required for review actions.'),
});

// GET /api/v1/applications/:id/findings
router.get('/applications/:id/findings', authenticate, async (req, res, next) => {
  try {
    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
    });

    if (!application) throw new AppError('Application not found.', 404, 'NOT_FOUND');
    enforceInstitutionOwnership(req, application.institutionId);

    const findings = await prisma.finding.findMany({
      where: { applicationId: req.params.id },
      include: {
        document: {
          select: { id: true, originalFilename: true, category: true, storageKey: true },
        },
        reviewer: { select: { id: true, name: true, role: true } },
        rule: true,
      },
      orderBy: { severity: 'desc' },
    });

    return res.json({ success: true, data: findings });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/findings/:findingId
router.get('/findings/:findingId', authenticate, async (req, res, next) => {
  try {
    const finding = await prisma.finding.findUnique({
      where: { id: req.params.findingId },
      include: {
        application: true,
        document: true,
        rule: true,
        reviewer: { select: { id: true, name: true } },
      },
    });

    if (!finding) throw new AppError('Finding not found.', 404, 'NOT_FOUND');
    enforceInstitutionOwnership(req, finding.application.institutionId);

    return res.json({ success: true, data: finding });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/findings/:findingId/review (Confirm or Dismiss with mandatory reason)
router.post('/findings/:findingId/review', authenticate, requireRole(Role.OFFICER, Role.SENIOR_REVIEWER, Role.ADMIN), validateRequest(reviewFindingSchema), async (req, res, next) => {
  try {
    const { status, reviewReason } = req.body;
    const finding = await prisma.finding.findUnique({
      where: { id: req.params.findingId },
      include: { application: true },
    });

    if (!finding) throw new AppError('Finding not found.', 404, 'NOT_FOUND');

    const updated = await prisma.finding.update({
      where: { id: req.params.findingId },
      data: {
        status: status as FindingStatus,
        reviewReason,
        reviewerId: req.user!.id,
      },
    });

    await logAuditEvent({
      actorId: req.user!.id,
      action: `FINDING_${status}`,
      entityType: 'Finding',
      entityId: finding.id,
      metadata: {
        findingCode: finding.findingCode,
        applicationId: finding.applicationId,
        reviewReason,
        previousStatus: finding.status,
      },
    });

    return res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/findings/:findingId/resolve
router.post('/findings/:findingId/resolve', authenticate, requireRole(Role.OFFICER, Role.SENIOR_REVIEWER, Role.ADMIN), async (req, res, next) => {
  try {
    const { resolutionNotes } = req.body;
    const finding = await prisma.finding.findUnique({
      where: { id: req.params.findingId },
    });

    if (!finding) throw new AppError('Finding not found.', 404, 'NOT_FOUND');

    const updated = await prisma.finding.update({
      where: { id: req.params.findingId },
      data: {
        status: FindingStatus.RESOLVED,
        resolvedAt: new Date(),
        reviewReason: resolutionNotes || 'Resolved after verified resubmission or officer override.',
        reviewerId: req.user!.id,
      },
    });

    await logAuditEvent({
      actorId: req.user!.id,
      action: 'FINDING_RESOLVED',
      entityType: 'Finding',
      entityId: finding.id,
      metadata: { findingCode: finding.findingCode, notes: resolutionNotes },
    });

    return res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

export default router;

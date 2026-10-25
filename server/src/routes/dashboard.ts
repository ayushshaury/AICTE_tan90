import { Router } from 'express';
import { prisma } from '../utils/db.js';
import { authenticate } from '../middleware/auth.js';
import { ApplicationStatus, Severity, Role } from '@prisma/client';

const router = Router();

router.get('/summary', authenticate, async (req, res, next) => {
  try {
    const user = req.user!;
    const filter = (user.role === Role.APPLICANT && user.institutionId)
      ? { institutionId: user.institutionId }
      : {};

    const [
      totalApplications,
      draftCount,
      submittedCount,
      scrutinyCount,
      actionRequiredCount,
      completedCount,
      escalatedCount,
      totalFindings,
      criticalFindingsCount,
      highFindingsCount,
      totalDocuments,
      pendingVerificationsCount,
    ] = await Promise.all([
      prisma.application.count({ where: filter }),
      prisma.application.count({ where: { ...filter, status: ApplicationStatus.DRAFT } }),
      prisma.application.count({ where: { ...filter, status: ApplicationStatus.SUBMITTED } }),
      prisma.application.count({ where: { ...filter, status: ApplicationStatus.UNDER_SCRUTINY } }),
      prisma.application.count({ where: { ...filter, status: ApplicationStatus.ACTION_REQUIRED } }),
      prisma.application.count({ where: { ...filter, status: ApplicationStatus.COMPLETED_IN_PROTOTYPE } }),
      prisma.application.count({ where: { ...filter, status: ApplicationStatus.ESCALATED } }),
      prisma.finding.count({ where: user.role === Role.APPLICANT ? { application: filter } : {} }),
      prisma.finding.count({ where: { ...(user.role === Role.APPLICANT ? { application: filter } : {}), severity: Severity.CRITICAL, status: 'OPEN' } }),
      prisma.finding.count({ where: { ...(user.role === Role.APPLICANT ? { application: filter } : {}), severity: Severity.HIGH, status: 'OPEN' } }),
      prisma.document.count({ where: { ...(user.role === Role.APPLICANT ? { application: filter } : {}), deletedAt: null } }),
      prisma.sourceVerification.count({ where: { ...(user.role === Role.APPLICANT ? { application: filter } : {}), status: 'PENDING' } }),
    ]);

    return res.json({
      success: true,
      data: {
        totalApplications,
        draftCount,
        submittedCount,
        scrutinyCount,
        actionRequiredCount,
        completedCount,
        escalatedCount,
        totalFindings,
        criticalFindingsCount,
        highFindingsCount,
        totalDocuments,
        pendingVerificationsCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/trends', authenticate, async (req, res, next) => {
  try {
    const user = req.user!;
    const filter = (user.role === Role.APPLICANT && user.institutionId)
      ? { institutionId: user.institutionId }
      : {};

    // Group findings by severity
    const findingsBySeverity = await prisma.finding.groupBy({
      by: ['severity'],
      where: user.role === Role.APPLICANT ? { application: filter } : {},
      _count: { _all: true },
    });

    // Group applications by status
    const applicationsByStatus = await prisma.application.groupBy({
      by: ['status'],
      where: filter,
      _count: { _all: true },
    });

    // Group applications by category
    const applicationsByCategory = await prisma.application.groupBy({
      by: ['category'],
      where: filter,
      _count: { _all: true },
    });

    return res.json({
      success: true,
      data: {
        findingsBySeverity: findingsBySeverity.map(f => ({
          severity: f.severity,
          count: f._count._all,
        })),
        applicationsByStatus: applicationsByStatus.map(a => ({
          status: a.status,
          count: a._count._all,
        })),
        applicationsByCategory: applicationsByCategory.map(a => ({
          category: a.category,
          count: a._count._all,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/attention-queue', authenticate, async (req, res, next) => {
  try {
    const user = req.user!;
    const filter = (user.role === Role.APPLICANT && user.institutionId)
      ? { institutionId: user.institutionId }
      : {};

    // Applications that have OPEN high/critical findings or ACTION_REQUIRED status
    const queue = await prisma.application.findMany({
      where: {
        ...filter,
        OR: [
          { status: ApplicationStatus.ACTION_REQUIRED },
          { status: ApplicationStatus.ESCALATED },
          { status: ApplicationStatus.UNDER_SCRUTINY },
          {
            findings: {
              some: {
                status: 'OPEN',
                severity: { in: [Severity.HIGH, Severity.CRITICAL] },
              },
            },
          },
        ],
      },
      include: {
        institution: true,
        assignedOfficer: { select: { id: true, name: true, email: true } },
        _count: {
          select: {
            findings: { where: { status: 'OPEN' } },
            documents: { where: { deletedAt: null } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });

    return res.json({
      success: true,
      data: queue,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

import { Router } from 'express';
import { prisma } from '../utils/db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { Role } from '@prisma/client';
import { logAuditEvent } from '../utils/audit.js';

const router = Router();

// Protect against CSV formula injection
function sanitizeCsvValue(value: any): string {
  if (value === null || value === undefined) return '""';
  let str = String(value).replace(/"/g, '""');
  // If string starts with formula characters (=, +, -, @), prefix with a single quote
  if (/^[=+\-@]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str}"`;
}

// GET /api/v1/reports/applications.csv
router.get('/applications.csv', authenticate, requireRole(Role.OFFICER, Role.SENIOR_REVIEWER, Role.ADMIN), async (req, res, next) => {
  try {
    const applications = await prisma.application.findMany({
      include: {
        institution: true,
        assignedOfficer: { select: { name: true } },
        _count: {
          select: {
            documents: { where: { deletedAt: null } },
            findings: { where: { status: 'OPEN' } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'Reference Number',
      'Institution Name',
      'Institution Code',
      'Category',
      'Academic Year',
      'Status',
      'Assigned Officer',
      'Documents Count',
      'Open Findings Count',
      'Created At',
    ];

    const rows = applications.map(app => [
      sanitizeCsvValue(app.referenceNumber),
      sanitizeCsvValue(app.institution.name),
      sanitizeCsvValue(app.institution.institutionCode),
      sanitizeCsvValue(app.category),
      sanitizeCsvValue(app.academicYear),
      sanitizeCsvValue(app.status),
      sanitizeCsvValue(app.assignedOfficer?.name || 'Unassigned'),
      sanitizeCsvValue(app._count.documents),
      sanitizeCsvValue(app._count.findings),
      sanitizeCsvValue(app.createdAt.toISOString()),
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    await logAuditEvent({
      actorId: req.user!.id,
      action: 'CSV_REPORT_EXPORTED',
      entityType: 'Report',
      entityId: 'applications.csv',
      metadata: { rowCount: applications.length },
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="aicte_applications_export.csv"');
    return res.send(csvContent);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/reports/findings.csv
router.get('/findings.csv', authenticate, requireRole(Role.OFFICER, Role.SENIOR_REVIEWER, Role.ADMIN), async (req, res, next) => {
  try {
    const findings = await prisma.finding.findMany({
      include: {
        application: { include: { institution: true } },
        document: { select: { originalFilename: true, category: true } },
        reviewer: { select: { name: true } },
      },
      orderBy: { severity: 'desc' },
    });

    const headers = [
      'Finding Code',
      'Title',
      'Severity',
      'Status',
      'Application Reference',
      'Institution Code',
      'Institution Name',
      'Document Name',
      'Recommended Action',
      'Reviewer',
      'Review Reason',
      'Created At',
    ];

    const rows = findings.map(f => [
      sanitizeCsvValue(f.findingCode),
      sanitizeCsvValue(f.title),
      sanitizeCsvValue(f.severity),
      sanitizeCsvValue(f.status),
      sanitizeCsvValue(f.application.referenceNumber),
      sanitizeCsvValue(f.application.institution.institutionCode),
      sanitizeCsvValue(f.application.institution.name),
      sanitizeCsvValue(f.document?.originalFilename || 'Application Level'),
      sanitizeCsvValue(f.recommendedAction),
      sanitizeCsvValue(f.reviewer?.name || 'Unreviewed'),
      sanitizeCsvValue(f.reviewReason || ''),
      sanitizeCsvValue(f.createdAt.toISOString()),
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    await logAuditEvent({
      actorId: req.user!.id,
      action: 'CSV_REPORT_EXPORTED',
      entityType: 'Report',
      entityId: 'findings.csv',
      metadata: { rowCount: findings.length },
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="aicte_findings_export.csv"');
    return res.send(csvContent);
  } catch (error) {
    next(error);
  }
});

export default router;

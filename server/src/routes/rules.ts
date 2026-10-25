import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { AppError } from '../utils/errors.js';
import { logAuditEvent } from '../utils/audit.js';
import { Role, Severity } from '@prisma/client';

const router = Router();

const ruleSchema = z.object({
  ruleCode: z.string().min(3),
  name: z.string().min(3),
  description: z.string().min(5),
  applicationCategories: z.array(z.string()),
  severity: z.nativeEnum(Severity),
  enabled: z.boolean().default(true),
  configurationJson: z.record(z.any()),
  remediationText: z.string().min(5),
});

// GET /api/v1/rules
router.get('/', authenticate, async (_req, res, next) => {
  try {
    const rules = await prisma.validationRule.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return res.json({ success: true, data: rules });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/rules (Admin only)
router.post('/', authenticate, requireRole(Role.ADMIN), validateRequest(ruleSchema), async (req, res, next) => {
  try {
    const existing = await prisma.validationRule.findUnique({
      where: { ruleCode: req.body.ruleCode },
    });
    if (existing) throw new AppError('Rule code already exists.', 409, 'DUPLICATE_RULE_CODE');

    const rule = await prisma.validationRule.create({
      data: {
        ...req.body,
        version: 1,
        createdById: req.user!.id,
      },
    });

    await logAuditEvent({
      actorId: req.user!.id,
      action: 'VALIDATION_RULE_CREATED',
      entityType: 'ValidationRule',
      entityId: rule.id,
      metadata: { ruleCode: rule.ruleCode },
    });

    return res.status(201).json({ success: true, data: rule });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/rules/:ruleId (Admin only - bumps rule version)
router.patch('/:ruleId', authenticate, requireRole(Role.ADMIN), async (req, res, next) => {
  try {
    const rule = await prisma.validationRule.findUnique({
      where: { id: req.params.ruleId },
    });
    if (!rule) throw new AppError('Rule not found.', 404, 'NOT_FOUND');

    const { name, description, severity, enabled, configurationJson, remediationText } = req.body;

    const updated = await prisma.validationRule.update({
      where: { id: req.params.ruleId },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(severity && { severity }),
        ...(enabled !== undefined && { enabled }),
        ...(configurationJson && { configurationJson }),
        ...(remediationText && { remediationText }),
        version: rule.version + 1, // Automatic version increment to preserve rule auditability
      },
    });

    await logAuditEvent({
      actorId: req.user!.id,
      action: 'VALIDATION_RULE_UPDATED',
      entityType: 'ValidationRule',
      entityId: rule.id,
      metadata: { ruleCode: rule.ruleCode, oldVersion: rule.version, newVersion: updated.version },
    });

    return res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

export default router;

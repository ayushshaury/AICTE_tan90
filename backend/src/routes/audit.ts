import { Router } from 'express';
import { prisma } from '../utils/db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { Role } from '@prisma/client';

const router = Router();

// GET /api/v1/audit
router.get('/', authenticate, requireRole(Role.OFFICER, Role.SENIOR_REVIEWER, Role.ADMIN), async (req, res, next) => {
  try {
    const { action, entityType, limit = '50', page = '1' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (action) where.action = String(action);
    if (entityType) where.entityType = String(entityType);

    const [total, events] = await Promise.all([
      prisma.auditEvent.count({ where }),
      prisma.auditEvent.findMany({
        where,
        include: {
          actor: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
    ]);

    return res.json({
      success: true,
      data: {
        items: events,
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

export default router;

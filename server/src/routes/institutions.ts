import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/db.js';
import { authenticate, requireRole, enforceInstitutionOwnership } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { AppError } from '../utils/errors.js';
import { Role } from '@prisma/client';

const router = Router();

const createInstitutionSchema = z.object({
  institutionCode: z.string().min(3),
  name: z.string().min(3),
  institutionType: z.string().min(2),
  address: z.string().min(5),
  state: z.string().min(2),
});

router.get('/', authenticate, async (req, res, next) => {
  try {
    const user = req.user!;
    if (user.role === Role.APPLICANT && user.institutionId) {
      const inst = await prisma.institution.findUnique({
        where: { id: user.institutionId },
      });
      return res.json({ success: true, data: inst ? [inst] : [] });
    }

    const institutions = await prisma.institution.findMany({
      orderBy: { name: 'asc' },
    });
    return res.json({ success: true, data: institutions });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    enforceInstitutionOwnership(req, req.params.id);
    const institution = await prisma.institution.findUnique({
      where: { id: req.params.id },
      include: {
        _count: { select: { applications: true, users: true } },
      },
    });

    if (!institution) {
      throw new AppError('Institution not found.', 404, 'NOT_FOUND');
    }

    return res.json({ success: true, data: institution });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, requireRole(Role.ADMIN), validateRequest(createInstitutionSchema), async (req, res, next) => {
  try {
    const existing = await prisma.institution.findUnique({
      where: { institutionCode: req.body.institutionCode },
    });
    if (existing) {
      throw new AppError('Institution code already exists in registry.', 409, 'DUPLICATE_CODE');
    }

    const institution = await prisma.institution.create({
      data: req.body,
    });

    return res.status(201).json({ success: true, data: institution });
  } catch (error) {
    next(error);
  }
});

export default router;

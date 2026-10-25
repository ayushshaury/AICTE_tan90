import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../utils/db.js';
import { generateToken, authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { AppError } from '../utils/errors.js';
import { logAuditEvent } from '../utils/audit.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

router.post('/login', validateRequest(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { email },
      include: { institution: true },
    });

    if (!user || !user.isActive) {
      throw new AppError('Invalid credentials or account is deactivated.', 401, 'INVALID_CREDENTIALS');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid credentials.', 401, 'INVALID_CREDENTIALS');
    }

    const authUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      institutionId: user.institutionId,
    };

    const token = generateToken(authUser);

    await logAuditEvent({
      actorId: user.id,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user.id,
      metadata: { role: user.role },
    });

    res.setHeader('Set-Cookie', `aicte_token=${token}; Path=/; SameSite=Lax; Max-Age=28800`);

    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          institutionId: user.institutionId,
          institution: user.institution ? {
            id: user.institution.id,
            name: user.institution.name,
            code: user.institution.institutionCode,
          } : null,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', authenticate, async (req, res, next) => {
  try {
    if (req.user) {
      await logAuditEvent({
        actorId: req.user.id,
        action: 'USER_LOGOUT',
        entityType: 'User',
        entityId: req.user.id,
      });
    }
    return res.json({
      success: true,
      data: { message: 'Logged out successfully.' },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { institution: true },
    });

    if (!user) {
      throw new AppError('User session not found.', 404, 'USER_NOT_FOUND');
    }

    return res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        institutionId: user.institutionId,
        institution: user.institution ? {
          id: user.institution.id,
          name: user.institution.name,
          code: user.institution.institutionCode,
        } : null,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { AppError } from '../utils/errors.js';
import { AuthUser } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'aicte_verifyai_jwt_secret_default_key_2026';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      institutionId: user.institutionId,
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token && typeof req.query.token === 'string') {
    token = req.query.token;
  } else if (req.headers.cookie) {
    const match = req.headers.cookie.match(/aicte_token=([^;]+)/);
    if (match) token = match[1];
  }

  if (!token) {
    return next(new AppError('Authentication required. Missing or malformed authorization header.', 401, 'UNAUTHORIZED'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    return next();
  } catch (err) {
    return next(new AppError('Invalid or expired authentication session.', 401, 'INVALID_TOKEN'));
  }
}

export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401, 'UNAUTHORIZED'));
    }

    if (req.user.role === Role.ADMIN) {
      return next(); // Admins have oversight across system administration
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this regulatory action.', 403, 'FORBIDDEN'));
    }

    return next();
  };
}

export function enforceInstitutionOwnership(req: Request, targetInstitutionId: string) {
  if (!req.user) {
    throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
  }

  // AICTE Officers, Senior Reviewers, and System Admins have cross-institution authority
  if (
    req.user.role === Role.OFFICER ||
    req.user.role === Role.SENIOR_REVIEWER ||
    req.user.role === Role.ADMIN ||
    req.user.role === Role.DEMO_VIEWER
  ) {
    return;
  }

  // Institution Applicants can ONLY access their own institution records
  if (req.user.role === Role.APPLICANT && req.user.institutionId !== targetInstitutionId) {
    throw new AppError('Access forbidden. You cannot access or modify records of another institution.', 403, 'TENANT_FORBIDDEN');
  }
}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';

import { prisma } from './utils/db.js';
import { errorHandler } from './utils/errors.js';
import authRouter from './routes/auth.js';
import dashboardRouter from './routes/dashboard.js';
import institutionsRouter from './routes/institutions.js';
import applicationsRouter from './routes/applications.js';
import documentsRouter from './routes/documents.js';
import findingsRouter from './routes/findings.js';
import verificationsRouter from './routes/verifications.js';
import rulesRouter from './routes/rules.js';
import notificationsRouter from './routes/notifications.js';
import reportsRouter from './routes/reports.js';
import auditRouter from './routes/audit.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

// 1. Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
  frameguard: false, // Allow frontend application on FRONTEND_ORIGIN to frame document previews
}));

// 2. Strict CORS Configuration
app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));

// 3. Request Correlation ID Middleware
app.use((req, res, next) => {
  const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
});

// 4. Body Parsers with strict size limits
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// 5. Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests, please try again later.' } },
});
app.use('/api/v1/auth/login', authLimiter);

// 6. Health check endpoint (as specified in Phase 3)
app.get('/api/v1/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({
      status: 'UP',
      service: 'AICTE 90* Express Backend',
      timestamp: new Date().toISOString(),
      database: 'CONNECTED',
      aiServiceMode: process.env.AI_SERVICE_MODE || 'mock',
    });
  } catch (err: any) {
    return res.status(503).json({
      status: 'DEGRADED',
      database: 'DISCONNECTED',
      error: err.message,
    });
  }
});

// 7. Mount Module Routers under /api/v1
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/institutions', institutionsRouter);
app.use('/api/v1/applications', applicationsRouter);
app.use('/api/v1', applicationsRouter);
app.use('/api/v1', documentsRouter);
app.use('/api/v1', findingsRouter);
app.use('/api/v1', verificationsRouter);
app.use('/api/v1/rules', rulesRouter);
app.use('/api/v1/notifications', notificationsRouter);
app.use('/api/v1/reports', reportsRouter);
app.use('/api/v1/audit', auditRouter);

// 8. 404 Handler for unknown API routes
app.use('/api/*', (_req, res) => {
  res.status(404).json({
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: 'The requested API endpoint was not found on this server.',
    },
  });
});

// 9. Centralized Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(` AICTE 90* Server Running on port ${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/api/v1/health`);
  console.log(` Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(` AI Adapter: ${process.env.AI_SERVICE_MODE || 'mock'}`);
  console.log(`=========================================`);
});

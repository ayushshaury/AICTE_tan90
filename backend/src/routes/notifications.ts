import { Router } from 'express';
import { prisma } from '../utils/db.js';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../utils/errors.js';

const router = Router();

// GET /api/v1/notifications
router.get('/', authenticate, async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    return res.json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/notifications/:id/read
router.post('/:id/read', authenticate, async (req, res, next) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id },
    });

    if (!notification || notification.userId !== req.user!.id) {
      throw new AppError('Notification not found.', 404, 'NOT_FOUND');
    }

    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { readAt: new Date() },
    });

    return res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/notifications/read-all
router.post('/read-all', authenticate, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, readAt: null },
      data: { readAt: new Date() },
    });

    return res.json({ success: true, data: { message: 'All notifications marked as read.' } });
  } catch (error) {
    next(error);
  }
});

export default router;

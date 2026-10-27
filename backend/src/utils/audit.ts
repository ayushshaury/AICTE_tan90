import { prisma } from './db.js';

export interface AuditParams {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

export async function logAuditEvent({
  actorId,
  action,
  entityType,
  entityId,
  requestId,
  metadata
}: AuditParams) {
  try {
    return await prisma.auditEvent.create({
      data: {
        actorId: actorId || null,
        action,
        entityType,
        entityId,
        requestId: requestId || null,
        metadataJson: metadata || {},
      },
    });
  } catch (err) {
    console.error('[AUDIT LOG ERROR] Failed to record audit event:', err);
    // Never crash the primary business transaction if audit logging encounters a secondary issue
    return null;
  }
}

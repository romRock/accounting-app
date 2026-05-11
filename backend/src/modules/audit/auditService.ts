import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function generateAuditLog({
  entity,
  entityId,
  action,
  oldValues,
  newValues,
  ipAddress,
  userAgent,
  createdBy
}: {
  entity: string;
  entityId: string;
  action: string;
  oldValues?: string;
  newValues?: string;
  ipAddress?: string;
  userAgent?: string;
  createdBy: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        entity,
        entityId,
        action,
        oldValues,
        newValues,
        ipAddress,
        userAgent,
        createdBy
      }
    });
  } catch (error) {
    console.error('Error generating audit log:', error);
    throw error;
  }
}

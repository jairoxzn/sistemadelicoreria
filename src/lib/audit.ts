import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export async function logAudit(params: {
  userId: string;
  action: string;
  module: string;
  entityId?: string;
  oldData?: Prisma.InputJsonValue;
  newData?: Prisma.InputJsonValue;
  description?: string;
}) {
  await prisma.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      module: params.module,
      entityId: params.entityId,
      oldData: params.oldData,
      newData: params.newData,
      description: params.description,
    },
  });
}

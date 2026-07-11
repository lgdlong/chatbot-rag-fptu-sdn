import { prisma } from "../services/db.service.js";
import { Prisma } from "@prisma/client";

/**
 * AuditLogRepository -- Phase 0.4 layer-refactor (Track C)
 *
 * Sole purpose: wrap prisma.auditLog operations behind a static-method
 * interface so that services (e.g. audit.service.ts) never import prisma
 * directly. Accepts an optional `tx` for use inside a prisma.$transaction
 * block; falls back to the global prisma client otherwise.
 */
export class AuditLogRepository {
  static async create(
    input: {
      userId: string;
      action: string;
      entityType: string;
      entityId: string;
      details?: Record<string, unknown>;
    },
    options?: { tx?: Prisma.TransactionClient }
  ) {
    const client = (options?.tx as unknown as typeof prisma) || prisma;
    return client.auditLog.create({
      data: {
        ...input,
        details: input.details as Prisma.InputJsonValue | undefined,
      },
    });
  }
}

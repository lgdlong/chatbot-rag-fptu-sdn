import { prisma } from "../../auth/services/db.service.js";
import { Prisma } from "@prisma/client";

/**
 * CallbackEventRepository -- pure data-access wrapper for the
 * `callback_events` table.
 *
 * Track H surface. All methods are static and accept an optional
 * `tx?: Prisma.TransactionClient` (Phase 0.4 transaction pattern) so
 * `ingestion-callback.service.ts` can compose the create + document
 * status update + job update into a single `prisma.$transaction`
 * block without re-importing prisma in the service layer.
 */
export class CallbackEventRepository {
  static async create(
    data: Prisma.CallbackEventCreateInput,
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.callbackEvent.create({ data });
  }
}

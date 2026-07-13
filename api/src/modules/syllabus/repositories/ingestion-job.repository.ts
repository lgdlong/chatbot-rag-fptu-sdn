import { prisma } from "../../auth/services/db.service.js";
import { Prisma } from "@prisma/client";

/**
 * IngestionJobRepository -- pure data-access wrapper for the
 * `ingestion_jobs` table. Consumed by `SyllabusService.uploadDocument`
 * (which creates the row inside a `prisma.$transaction`) and by Track H
 * (which will update it during the callback contract). Track G owns
 * the read + create + update surfaces.
 *
 * All methods are static and accept an optional
 * `tx?: Prisma.TransactionClient` (Phase 0.4 transaction pattern).
 */
export class IngestionJobRepository {
  /**
   * The schema declares `documentId @unique` per IngestionJob, so this
   * returns at most one row. Used by the ingestion-callback service to
   * find the job that owns a given document.
   */
  static async findByDocumentId(
    documentId: string,
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.ingestionJob.findUnique({ where: { documentId } });
  }

  static async findById(
    id: string,
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.ingestionJob.findUnique({ where: { id } });
  }

  static async create(
    data: Prisma.IngestionJobCreateInput,
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.ingestionJob.create({ data });
  }

  static async update(
    id: string,
    data: Prisma.IngestionJobUpdateInput,
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.ingestionJob.update({ where: { id }, data });
  }
}

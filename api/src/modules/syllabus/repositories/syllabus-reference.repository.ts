import { prisma } from "../../auth/services/db.service.js";
import { Prisma } from "@prisma/client";

/**
 * SyllabusReferenceRepository -- pure data-access wrapper for the
 * `syllabus_references` table (citation rows).
 *
 * Track G surface. All methods static, accept optional
 * `tx?: Prisma.TransactionClient` (Phase 0.4 transaction pattern).
 */
export class SyllabusReferenceRepository {
  static async deleteBySyllabus(
    syllabusId: number,
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.syllabusReference.deleteMany({ where: { syllabusId } });
  }

  static async create(
    data: Prisma.SyllabusReferenceCreateInput,
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.syllabusReference.create({ data });
  }
}

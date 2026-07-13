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

  /**
   * All citation rows attached to a syllabus. Used by Track H
   * (rag.service.ts) to load the reference list for the "Materials &
   * References" query branch. Mirrors the pre-refactor
   * `prisma.syllabusReference.findMany({ where: { syllabusId } })`
   * call site.
   */
  static async findManyBySyllabus(
    syllabusId: number,
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.syllabusReference.findMany({ where: { syllabusId } });
  }
}

import { prisma } from "../../auth/services/db.service.js";
import { Prisma } from "@prisma/client";

/**
 * SyllabusCloRepository -- pure data-access wrapper for the
 * `syllabus_clos` table (Course Learning Outcomes).
 *
 * Track G surface. All methods static, accept optional
 * `tx?: Prisma.TransactionClient` (Phase 0.4 transaction pattern).
 */
export class SyllabusCloRepository {
  static async deleteBySyllabus(
    syllabusId: number,
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.syllabusClo.deleteMany({ where: { syllabusId } });
  }

  static async create(
    data: Prisma.SyllabusCloCreateInput,
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.syllabusClo.create({ data });
  }

  static async findManyBySyllabus(
    syllabusId: number,
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.syllabusClo.findMany({ where: { syllabusId } });
  }
}

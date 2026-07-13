import { prisma } from "../../auth/services/db.service.js";
import { Prisma } from "@prisma/client";

/**
 * SyllabusMaterialRepository -- pure data-access wrapper for the
 * `syllabus_materials` table (textbook / main materials list).
 *
 * Track G surface. All methods static, accept optional
 * `tx?: Prisma.TransactionClient` (Phase 0.4 transaction pattern).
 */
export class SyllabusMaterialRepository {
  static async deleteBySyllabus(
    syllabusId: number,
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.syllabusMaterial.deleteMany({ where: { syllabusId } });
  }

  static async create(
    data: Prisma.SyllabusMaterialCreateInput,
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.syllabusMaterial.create({ data });
  }

  static async findManyBySyllabus(
    syllabusId: number,
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.syllabusMaterial.findMany({ where: { syllabusId } });
  }
}

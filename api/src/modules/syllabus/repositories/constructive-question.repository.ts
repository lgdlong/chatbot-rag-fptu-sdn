import { prisma } from "../../auth/services/db.service.js";
import { Prisma } from "@prisma/client";

/**
 * ConstructiveQuestionRepository -- pure data-access wrapper for the
 * `constructive_questions` table (Edunext-style constructive question rows).
 *
 * Track G surface. All methods static, accept optional
 * `tx?: Prisma.TransactionClient` (Phase 0.4 transaction pattern).
 */
export class ConstructiveQuestionRepository {
  static async deleteBySyllabus(
    syllabusId: number,
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.constructiveQuestion.deleteMany({ where: { syllabusId } });
  }

  static async create(
    data: Prisma.ConstructiveQuestionCreateInput,
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.constructiveQuestion.create({ data });
  }
}

import { prisma } from "../../auth/services/db.service.js";
import { Prisma } from "@prisma/client";

/**
 * CurriculumSubjectRepository -- pure data-access wrapper for the
 * `curriculum_subjects` join table.
 *
 * All methods are static and accept an optional `tx?: Prisma.TransactionClient`
 * (Phase 0.4 transaction pattern).
 */
export class CurriculumSubjectRepository {
  static async create(
    data: {
      curriculumId: string;
      courseId: string;
      semesterNo: number;
      isSpecializationSpecific: boolean;
    },
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.curriculumSubject.create({ data });
  }

  /**
   * Delete a single curriculum<->course link by its compound unique key.
   * Maps to Prisma's `where: { curriculumId_courseId: { ... } }`.
   */
  static async deleteByCompoundKey(
    curriculumId: string,
    courseId: string,
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.curriculumSubject.delete({
      where: {
        curriculumId_courseId: { curriculumId, courseId },
      },
    });
  }
}

import { prisma } from "../../auth/services/db.service.js";
import { Prisma } from "@prisma/client";

/**
 * AssessmentSchemeRepository -- pure data-access wrapper for the
 * `assessment_schemes` table (12-column assessment scheme rows).
 *
 * Track G surface. All methods static, accept optional
 * `tx?: Prisma.TransactionClient` (Phase 0.4 transaction pattern) so the
 * multi-entity `updateSyllabus` write in SyllabusService can mutate
 * parent + 7 child tables atomically.
 */
export class AssessmentSchemeRepository {
  /**
   * Drop every assessment row attached to a syllabus. Used by the
   * "clear and re-create" pattern in `updateSyllabus` so the new payload
   * always reflects the latest assessment weights.
   */
  static async deleteBySyllabus(
    syllabusId: number,
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.assessmentScheme.deleteMany({ where: { syllabusId } });
  }

  static async create(
    data: Prisma.AssessmentSchemeCreateInput,
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.assessmentScheme.create({ data });
  }

  static async findManyBySyllabus(
    syllabusId: number,
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.assessmentScheme.findMany({ where: { syllabusId } });
  }
}

import { prisma } from "../../auth/services/db.service.js";
import { Prisma } from "@prisma/client";

/**
 * CurriculumRepository -- pure data-access wrapper for `prisma.curriculum`.
 *
 * All methods are static and accept an optional `tx?: Prisma.TransactionClient`
 * (Phase 0.4 transaction pattern).
 */
export class CurriculumRepository {
  static async findByCurriculumId(
    curriculumId: string,
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.curriculum.findUnique({ where: { curriculumId } });
  }

  /**
   * Find a curriculum by its internal id. If `options.includeSubjects` is true,
   * returns the full detail payload (with major, specialization, ordered
   * subjects, and each course's active+approved syllabus id) used by the
   * `GET /curriculums/:curriculumId` detail endpoint.
   */
  static async findById(
    id: string,
    options?: { includeSubjects?: boolean; tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    if (options?.includeSubjects) {
      return client.curriculum.findUnique({
        where: { id },
        include: {
          major: true,
          specialization: true,
          subjects: {
            orderBy: [
              { semesterNo: "asc" },
              { course: { code: "asc" } },
            ],
            include: {
              course: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  syllabuses: {
                    where: { isActive: true, isApproved: true },
                    select: { id: true },
                  },
                },
              },
            },
          },
        },
      });
    }
    return client.curriculum.findUnique({ where: { id } });
  }

  static async findMany(options?: { tx?: Prisma.TransactionClient }) {
    const client = options?.tx || prisma;
    return client.curriculum.findMany({
      orderBy: { curriculumId: "asc" },
      include: {
        major: { select: { code: true, name: true } },
        specialization: { select: { code: true, name: true } },
        _count: { select: { subjects: true } },
      },
    });
  }

  /**
   * Match by internal id OR by the user-facing `curriculumId` code.
   * Used by GET/POST/DELETE subject routes where the URL param may be either.
   */
  static async findFirstByCurriculumIdOrId(
    identifier: string,
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.curriculum.findFirst({
      where: {
        OR: [{ id: identifier }, { curriculumId: identifier }],
      },
    });
  }

  /**
   * Same identifier OR-match as `findFirstByCurriculumIdOrId`, but hydrated
   * with the full detail payload (major + specialization + ordered subjects +
   * each course's active+approved syllabus id). Used by the detail endpoint.
   */
  static async findFirstByCurriculumIdOrIdWithDetails(
    identifier: string,
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.curriculum.findFirst({
      where: {
        OR: [{ id: identifier }, { curriculumId: identifier }],
      },
      include: {
        major: true,
        specialization: true,
        subjects: {
          orderBy: [
            { semesterNo: "asc" },
            { course: { code: "asc" } },
          ],
          include: {
            course: {
              select: {
                id: true,
                code: true,
                name: true,
                syllabuses: {
                  where: { isActive: true, isApproved: true },
                  select: { id: true },
                },
              },
            },
          },
        },
      },
    });
  }

  static async findFirstBySpecialization(
    specializationId: string,
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.curriculum.findFirst({ where: { specializationId } });
  }

  static async create(
    data: {
      curriculumId: string;
      majorId: string;
      specializationId: string | null;
      batchCode: string;
    },
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.curriculum.create({ data });
  }

  static async update(
    id: string,
    data: {
      majorId?: string;
      specializationId?: string | null;
      batchCode?: string;
    },
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.curriculum.update({ where: { id }, data });
  }

  static async delete(
    id: string,
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.curriculum.delete({ where: { id } });
  }
}

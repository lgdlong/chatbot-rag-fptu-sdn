import { prisma } from "../../auth/services/db.service.js";
import { Prisma } from "@prisma/client";

/**
 * SyllabusRepository -- pure data-access wrapper for `prisma.syllabus`.
 *
 * Track G surface. The Phase 0.3 stub body has been filled with the exact
 * prisma calls the pre-refactor controller used, so the service layer can
 * replace every `prisma.syllabus.*` in `syllabus.controller.ts` without
 * changing the response shape. Each method accepts an optional
 * `tx?: Prisma.TransactionClient` (Phase 0.4 pattern) so the multi-entity
 * `updateSyllabus` + `uploadDocument` + `activateSyllabus` writes in
 * `SyllabusService` stay atomic.
 *
 * Static-method pattern (no DI), matching the rest of the module.
 */
export class SyllabusRepository {
  /**
   * Search syllabuses with role-based filtering. The `STUDENT` role only
   * sees `isActive && isApproved` rows. LECTURER and ADMIN see everything.
   * Mirrors the pre-refactor `whereClause` build in the GET / handler.
   */
  static async findMany(
    filter: { subjectCode?: string; role?: string | null },
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    const where: Prisma.SyllabusWhereInput = {};

    if (filter.subjectCode) {
      where.course = {
        code: { contains: filter.subjectCode, mode: "insensitive" },
      };
    }

    if (filter.role === "STUDENT") {
      where.isActive = true;
      where.isApproved = true;
    }

    return client.syllabus.findMany({
      where,
      include: { course: { select: { code: true, name: true } } },
      orderBy: { id: "desc" },
    });
  }

  /**
   * Fetch a syllabus with its parent course + 8 child relations
   * (materials, clos, schedules, questions, assessments, references,
   * videoLinks, documents). Pass `deep: false` (default) for a bare
   * `findUnique` without the include tree.
   */
  static async findById(
    id: number,
    options?: { tx?: Prisma.TransactionClient; deep?: boolean },
  ) {
    const client = options?.tx || prisma;
    if (options?.deep) {
      return client.syllabus.findUnique({
        where: { id },
        include: {
          course: true,
          materials: true,
          clos: true,
          schedules: { orderBy: { session: "asc" } },
          questions: { orderBy: { sessionNo: "asc" } },
          assessments: true,
          references: true,
          videoLinks: true,
          documents: true,
        },
      });
    }
    return client.syllabus.findUnique({ where: { id } });
  }

  /**
   * Lightweight existence / presence check with optional select. Used
   * by activate, deactivate, approve, update, delete to decide whether
   * the route can proceed (404 otherwise) without dragging the deep
   * include tree down the wire.
   */
  static async findByIdLight(
    id: number,
    options?: { tx?: Prisma.TransactionClient; select?: Prisma.SyllabusSelect },
  ) {
    const client = options?.tx || prisma;
    return client.syllabus.findUnique({
      where: { id },
      ...(options?.select ? { select: options.select } : {}),
    });
  }

  static async findByCourseId(
    courseId: string,
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.syllabus.findMany({
      where: { courseId },
      orderBy: { id: "desc" },
    });
  }

  /**
   * First active syllabus for a given course. Used by the chat-scope
   * resolver and Track H (RAG) flows that need to know which syllabus
   * version is the current published one.
   */
  static async findFirstActiveSyllabus(
    courseId: string,
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.syllabus.findFirst({
      where: { courseId, isActive: true },
    });
  }

  static async create(
    data: Prisma.SyllabusCreateInput,
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.syllabus.create({ data });
  }

  static async update(
    id: number,
    data: Prisma.SyllabusUpdateInput,
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.syllabus.update({ where: { id }, data });
  }

  static async delete(
    id: number,
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.syllabus.delete({ where: { id } });
  }

  /**
   * PATCH isActive only. Used by the deactivate path (also activate,
   * since activate goes through `update` for the parent row).
   */
  static async updateActiveStatus(
    id: number,
    isActive: boolean,
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.syllabus.update({ where: { id }, data: { isActive } });
  }

  /**
   * BR-09 / EC-25: only one syllabus per course may be active at a time.
   * `activateSyllabus` calls this inside the same `$transaction` that
   * flips the new row to `isActive: true`.
   */
  static async deactivateOthersInCourse(
    courseId: string,
    exceptId: number,
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.syllabus.updateMany({
      where: { courseId, id: { not: exceptId } },
      data: { isActive: false },
    });
  }

  static async countByCourseId(
    courseId: string,
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.syllabus.count({ where: { courseId } });
  }

  /**
   * Count every document attached to any syllabus of a given course.
   * Used by the upload flow's 10-doc-per-course ceiling check. Lives
   * here (rather than on `DocumentRepository`) because the cross-table
   * `syllabus.courseId` filter is owned by the syllabus module.
   */
  static async countCourseDocuments(
    courseId: string,
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.document.count({
      where: { syllabus: { courseId } },
    });
  }
}

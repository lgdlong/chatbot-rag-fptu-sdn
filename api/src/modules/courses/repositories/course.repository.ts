import { prisma } from '../../auth/services/db.service.js'
import { Prisma } from '@prisma/client'

/**
 * CourseRepository -- pure data-access wrapper for `prisma.course`.
 *
 * The first four methods were the original Phase 0 surface used by the RAG
 * controller and CurriculumService. The methods added below (Track D) close
 * the gap that CourseService needs in order to fully replace the controller's
 * direct prisma calls without leaking the prisma client into the service
 * layer. All new methods are read-only wrappers around `prisma.course.*` and
 * follow the same single-call-per-method convention as the originals.
 *
 * Static-method pattern (no DI). Optional `tx?: Prisma.TransactionClient` is
 * intentionally omitted on these helpers because the current CourseService
 * surface does not need atomic multi-entity writes; Track G can extend the
 * signature with the same `options?: { tx?: Prisma.TransactionClient }`
 * pattern used in other repositories if a use case arises.
 */
export class CourseRepository {
  static async create(data: Prisma.CourseCreateInput) {
    return prisma.course.create({ data })
  }

  static async findById(id: string) {
    return prisma.course.findUnique({
      where: { id },
    })
  }

  static async update(id: string, data: Prisma.CourseUpdateInput) {
    return prisma.course.update({
      where: { id },
      data,
    })
  }

  static async delete(id: string) {
    return prisma.course.delete({
      where: { id },
    })
  }

  // ---------------------------------------------------------------------
  // Track D additions -- service-side helpers (no behavior change vs. the
  // pre-refactor controller; the controller used these exact prisma calls
  // inline and we move them here verbatim).
  // ---------------------------------------------------------------------

  /**
   * Exact-match lookup by unique `code` column. Used by ChatService in
   * Track F; CourseService itself uses the case-insensitive variant below
   * for the duplicate-check path.
   */
  static async findByCode(code: string) {
    return prisma.course.findUnique({ where: { code } })
  }

  /**
   * Case-insensitive duplicate check (replaces the inline
   * `findFirst({ where: { code: { equals, mode: "insensitive" } } })` calls
   * that the controller used for 409 detection). Caller may pass an
   * `excludeId` to ignore the row being updated (PATCH path).
   */
  static async findFirstByCodeCaseInsensitive(
    code: string,
    options?: { excludeId?: string },
  ) {
    return prisma.course.findFirst({
      where: {
        code: {
          equals: code,
          mode: "insensitive",
        },
        ...(options?.excludeId ? { NOT: { id: options.excludeId } } : {}),
      },
      select: { id: true },
    })
  }

  /**
   * Simple findMany with the ordering used by `listAll`. No includes --
   * callers that need the document count should use
   * `findManyWithDocumentCount` instead.
   */
  static async findMany() {
    return prisma.course.findMany({
      orderBy: { createdAt: "desc" },
    })
  }

  /**
   * Full list used by the GET /api/courses endpoint. Joins each course to
   * its syllabuses and counts documents per syllabus so the controller can
   * flatten it into `documentCount`. Mirrors the pre-refactor prisma
   * `include` exactly.
   */
  static async findManyWithDocumentCount() {
    return prisma.course.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        syllabuses: {
          include: {
            _count: {
              select: { documents: true },
            },
          },
        },
      },
    })
  }

  /**
   * Lightweight include used by the PATCH /:courseId path: just the
   * `id` + `code` of each syllabus, so the service can iterate workspace
   * renames without dragging the full document count down the wire.
   */
  static async findByIdWithSyllabuses(id: string) {
    return prisma.course.findUnique({
      where: { id },
      select: { id: true, code: true, syllabuses: { select: { id: true } } },
    })
  }

  /**
   * Deep include used by the PATCH update path so the response payload can
   * be assembled with the same `documentCount` calculation as the GET
   * endpoint. Returns `null` if the row is gone (service maps to 404).
   */
  static async findByIdWithDocumentCount(id: string) {
    return prisma.course.findUnique({
      where: { id },
      include: {
        syllabuses: {
          include: {
            _count: {
              select: { documents: true },
            },
          },
        },
      },
    })
  }

  /**
   * Lightweight include used by the DELETE /:courseId path: just enough to
   * know whether each syllabus has any documents attached (409 guard) and
   * the course code (for the AnythingLLM workspace slug).
   */
  static async findByIdWithSyllabusDocumentCounts(id: string) {
    return prisma.course.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        name: true,
        syllabuses: {
          select: {
            id: true,
            _count: {
              select: { documents: true },
            },
          },
        },
      },
    })
  }

  // ---------------------------------------------------------------------
  // Track F additions -- chat-scope support
  // ---------------------------------------------------------------------

  /**
   * Lookup the (id, code, name) tuple for an arbitrary set of course ids.
   * Used by the chat-scope resolver to map a list of course ids (from the
   * pre-filtered document query) into the display fields needed by the
   * scope summary. No includes; callers that need documents / syllabuses
   * should pick a heavier `findById*` variant.
   */
  static async findManyByIds(ids: string[]) {
    if (ids.length === 0) {
      return []
    }
    return prisma.course.findMany({
      where: { id: { in: ids } },
      select: { id: true, code: true, name: true },
    })
  }
}

import { prisma } from '../../auth/services/db.service.js'
import { DocumentStatus, Prisma } from '@prisma/client'

export class DocumentRepository {
  static async create(data: Prisma.DocumentCreateInput) {
    return prisma.document.create({ data })
  }

  static async findById(id: string) {
    return prisma.document.findUnique({
      where: { id },
      include: { syllabus: true },
    })
  }

  static async findManyBySyllabus(syllabusId: number) {
    return prisma.document.findMany({
      where: { syllabusId },
    })
  }

  static async update(id: string, data: Prisma.DocumentUpdateInput) {
    return prisma.document.update({
      where: { id },
      data,
    })
  }

  static async delete(id: string) {
    return prisma.document.delete({
      where: { id },
    })
  }

  static async updateStatus(id: string, status: DocumentStatus, error?: string) {
    if (error) {
      console.error(`[DocumentRepository] Ingestion error for document ${id}: ${error}`)
    }
    return prisma.document.update({
      where: { id },
      data: { status },
    })
  }

  // ---------------------------------------------------------------------
  // Track F additions -- chat-scope support
  // ---------------------------------------------------------------------

  /**
   * Distinct course ids that have at least one COMPLETED document under
   * any of their syllabuses. Replaces the inline
   * `prisma.course.findMany({ where: { syllabuses: { some: { documents:
   * { some: { status: 'COMPLETED' } } } } } })` query that the chat
   * accessibility resolver used. We go through `document` (not `course`)
   * because the filter is on a document property; the SQL is shorter and
   * a single pass over documents gives us the course-id set without
   * requiring a join through the syllabuses relation.
   */
  static async findCourseIdsWithCompletedDocuments(): Promise<string[]> {
    const rows = await prisma.document.findMany({
      where: { status: "COMPLETED" },
      select: { syllabus: { select: { courseId: true } } },
    })
    return Array.from(new Set(rows.map((row) => row.syllabus.courseId)))
  }

  /**
   * All COMPLETED documents whose syllabus belongs to one of the given
   * course ids, ordered most-recent-first. Mirrors the pre-refactor
   * `prisma.document.findMany({ where: { status, syllabus: { courseId:
   * { in } } } })` query in chat-scope. The select shape matches the
   * `ScopedDocument` type the chat module already exposes.
   */
  static async findManyCompletedByCourseIds(courseIds: string[]) {
    if (courseIds.length === 0) {
      return []
    }
    return prisma.document.findMany({
      where: {
        status: "COMPLETED",
        syllabus: { courseId: { in: courseIds } },
      },
      select: {
        id: true,
        name: true,
        fileType: true,
        status: true,
        syllabusId: true,
        syllabus: {
          select: {
            courseId: true,
            course: {
              select: { id: true, code: true, name: true },
            },
          },
        },
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })
  }

  /**
   * All documents under any syllabus belonging to a specific course, no
   * status filter. Mirrors the pre-refactor `prisma.document.findMany`
   * call in `GET /api/chat/courses/:courseId/documents`. Returns the full
   * row so the controller can decide which fields to expose.
   */
  static async findManyByCourseId(courseId: string) {
    return prisma.document.findMany({
      where: { syllabus: { courseId } },
      orderBy: { createdAt: "desc" },
    })
  }
}

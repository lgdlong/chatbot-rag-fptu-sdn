import { prisma } from "../../auth/services/db.service.js";
import { Prisma } from "@prisma/client";

/**
 * RagWorkspaceRepository -- pure data-access wrapper for `prisma.ragWorkspace`.
 *
 * Track D filled in the Phase 0.3 stub surface for `CourseService.update`
 * and `CourseService.delete` (the four-course-module service) which both
 * iterate syllabuses while mutating workspace rows. Track G extends every
 * method with the optional `tx?: Prisma.TransactionClient` parameter
 * (Phase 0.4 pattern) so `SyllabusService.uploadDocument` and future
 * Track-H `rag.service.ts` flows can compose workspace writes inside a
 * `prisma.$transaction` block. The body of each existing method is
 * unchanged -- only the signature gained a second arg.
 */
export class RagWorkspaceRepository {
  /**
   * Fetch the workspace row linked to a syllabus (or null). The `syllabusId`
   * column is `@unique` so this is at most one row.
   */
  static async findBySyllabus(
    syllabusId: number,
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.ragWorkspace.findUnique({ where: { syllabusId } });
  }

  /**
   * Create-or-update by syllabus. Mirrors the `upsert` used in
   * `SyllabusService.uploadDocument` so callers can stop importing prisma.
   * Called inside a `prisma.$transaction` block by the upload pipeline --
   * passes `{ tx }` to opt into the same atomic scope as the doc + job
   * creates.
   */
  static async upsertBySyllabus(
    input: {
      syllabusId: number;
      workspaceSlug: string;
      workspaceName: string;
    },
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.ragWorkspace.upsert({
      where: { syllabusId: input.syllabusId },
      create: {
        syllabusId: input.syllabusId,
        workspaceSlug: input.workspaceSlug,
        workspaceName: input.workspaceName,
      },
      update: {
        workspaceSlug: input.workspaceSlug,
        workspaceName: input.workspaceName,
      },
    });
  }

  /**
   * Patch a workspace row by its primary key. `syllabus-sync.service.ts`
   * uses this when a document move changes the AnythingLLM location.
   */
  static async update(
    id: string,
    data: {
      workspaceSlug?: string;
      workspaceName?: string;
      anythingLlmId?: string;
      syncStatus?: string;
      syncError?: string | null;
      lastSyncedAt?: Date;
    },
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.ragWorkspace.update({ where: { id }, data });
  }

  /**
   * Bulk rename all workspace rows attached to a syllabus. Used by
   * `CourseService.update` when the parent course's code changes -- we
   * cannot mutate the unique `workspaceSlug` column in a single update
   * with a where-on-relation filter, so this is a dedicated helper.
   *
   * The schema has `syllabusId @unique` per workspace, so a `where:
   * { syllabusId }` clause touches at most one row in practice; we still
   * use `updateMany` to stay future-proof if that uniqueness is relaxed.
   */
  static async updateManyBySyllabus(
    syllabusId: number,
    data: { workspaceSlug: string; workspaceName: string },
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.ragWorkspace.updateMany({
      where: { syllabusId },
      data: {
        workspaceSlug: data.workspaceSlug,
        workspaceName: data.workspaceName,
      },
    });
  }

  /**
   * Drop the workspace row (if any) attached to a syllabus. Used by
   * `CourseService.delete` after the AnythingLLM workspace has been
   * purged, so the local metadata stays consistent.
   */
  static async deleteManyBySyllabus(
    syllabusId: number,
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.ragWorkspace.deleteMany({ where: { syllabusId } });
  }
}

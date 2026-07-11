import { prisma } from "../../auth/services/db.service.js";
import { Prisma } from "@prisma/client";

/**
 * RagWorkspaceRepository -- pure data-access wrapper for `prisma.ragWorkspace`.
 *
 * Phase 0.3 stubs were filled in during Track D because `CourseService.update`
 * and `CourseService.delete` (the four-course-module service) both need
 * workspace-row mutations while iterating syllabuses. Track G will consume the
 * remaining read-side helpers (`findBySyllabus`, `upsertBySyllabus`, `update`)
 * from `SyllabusService` / `syllabus-sync.service.ts`.
 *
 * Static-method pattern, no DI. No `tx?: Prisma.TransactionClient` for now --
 * Track G can extend these signatures when its multi-entity writes land.
 */
export class RagWorkspaceRepository {
  /**
   * Fetch the workspace row linked to a syllabus (or null). The `syllabusId`
   * column is `@unique` so this is at most one row.
   */
  static async findBySyllabus(syllabusId: number) {
    return prisma.ragWorkspace.findUnique({ where: { syllabusId } });
  }

  /**
   * Create-or-update by syllabus. Mirrors the `upsert` used in
   * `syllabus.controller.ts` so callers can stop importing prisma.
   */
  static async upsertBySyllabus(input: {
    syllabusId: number;
    workspaceSlug: string;
    workspaceName: string;
  }) {
    return prisma.ragWorkspace.upsert({
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
    },
  ) {
    return prisma.ragWorkspace.update({ where: { id }, data });
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
  ) {
    return prisma.ragWorkspace.updateMany({
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
  static async deleteManyBySyllabus(syllabusId: number) {
    return prisma.ragWorkspace.deleteMany({ where: { syllabusId } });
  }
}

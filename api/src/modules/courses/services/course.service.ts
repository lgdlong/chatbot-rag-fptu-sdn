import { CourseRepository } from "../repositories/course.repository.js";
import { RagWorkspaceRepository } from "../../syllabus/repositories/rag-workspace.repository.js";
import { AnythingLlmAdapter } from "../../rag/services/anythingllm.adapter.js";

/**
 * Error class that carries an HTTP status code so the controller layer can
 * map a thrown service error to the correct response status without leaking
 * validation logic into the HTTP boundary. The status code is part of the
 * response contract (400 / 404 / 409) and the message matches the strings
 * the pre-refactor controller returned verbatim, so the HTTP response body
 * shape stays identical.
 */
export class ValidationError extends Error {
  public readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = "ValidationError";
    this.statusCode = statusCode;
  }
}

export type CourseListItem = {
  id: string;
  code: string;
  name: string;
  createdAt: Date;
  documentCount: number;
};

/**
 * CourseService -- all business logic for the Course module.
 *
 * Pure orchestration over the existing `CourseRepository` and the
 * `RagWorkspaceRepository` (Track G pre-work filled both surfaces in).
 * Never imports prisma directly. Throws `ValidationError` for client-facing
 * errors so the controller can map it to the proper HTTP status without
 * re-implementing validation.
 *
 * Workspace sync:
 * - create()    : no workspace work (workspaces are per-Syllabus, created
 *                 by SyllabusService/upload pipeline).
 * - update()    : if the course code changes, every syllabus under the
 *                 course has its AnythingLLM workspace renamed + the local
 *                 `rag_workspaces` row updated. Best-effort: a single
 *                 workspace failure is logged and skipped so the API
 *                 response still reflects the DB write.
 * - delete()    : every syllabus under the course has its AnythingLLM
 *                 workspace purged + the local `rag_workspaces` row
 *                 dropped. Same best-effort semantics. The local
 *                 `course.delete` is the final step and runs only after
 *                 all workspace cleanups are attempted.
 */
export class CourseService {
  // ---------------------------------------------------------------------
  // Reads
  // ---------------------------------------------------------------------

  /**
   * Plain list used by ChatService (Track F) -- no document count, no
   * syllabus include. Order: most recently created first.
   */
  static async listAll() {
    return CourseRepository.findMany();
  }

  /**
   * List with a pre-computed `documentCount` per course, used by the
   * GET /api/courses controller endpoint. Mirrors the pre-refactor
   * `prisma.course.findMany` include + reduce exactly.
   */
  static async listWithDocumentCount(): Promise<CourseListItem[]> {
    const courses = await CourseRepository.findManyWithDocumentCount();
    return courses.map((course) => {
      const documentCount = course.syllabuses.reduce(
        (acc, syl) => acc + syl._count.documents,
        0,
      );
      return {
        id: course.id,
        code: course.code,
        name: course.name,
        createdAt: course.createdAt,
        documentCount,
      };
    });
  }

  /**
   * Lightweight read by primary key. Returns null when the row is gone --
   * callers decide whether to map that to a 404.
   */
  static async findById(id: string) {
    return CourseRepository.findById(id);
  }

  /**
   * Read by unique `code`. Used by chat-side flows that need to resolve a
   * course by its public code (e.g. when seeding a chat session).
   */
  static async findByCode(code: string) {
    return CourseRepository.findByCode(code);
  }

  /**
   * Course with its syllabuses attached. Reserved for the chat scope
   * resolver / syllabus service -- the controller side of the refactor
   * uses `listWithDocumentCount` for response shaping.
   */
  static async getCourseWithSyllabuses(id: string) {
    return CourseRepository.findByIdWithDocumentCount(id);
  }

  // ---------------------------------------------------------------------
  // Writes
  // ---------------------------------------------------------------------

  /**
   * Create a new course. Inputs are trimmed + uppercased so a re-submit
   * with whitespace or wrong case hits the 409 duplicate check on the
   * second attempt.
   */
  static async create(rawCode: string, rawName: string): Promise<CourseListItem> {
    const code = typeof rawCode === "string" ? rawCode.trim().toUpperCase() : "";
    const name = typeof rawName === "string" ? rawName.trim() : "";

    if (!code || !name) {
      throw new ValidationError(400, "Course code and name are required");
    }

    const duplicate = await CourseRepository.findFirstByCodeCaseInsensitive(code);
    if (duplicate) {
      throw new ValidationError(409, "Course code already exists");
    }

    // NOTE: AnythingLLM workspaces are now isolated per Syllabus version: {subject_code}_{syllabus_id}.
    // Hence, no workspace is created upon Course creation itself. Workspaces are created when Syllabuses are created/documents uploaded.
    const course = await CourseRepository.create({ code, name });

    return {
      id: course.id,
      code: course.code,
      name: course.name,
      createdAt: course.createdAt,
      documentCount: 0,
    };
  }

  /**
   * Update an existing course. If the code changes, every syllabus under
   * the course has its AnythingLLM workspace renamed + the local
   * `rag_workspaces` row updated. Workspace sync is best-effort: a
   * failure for one syllabus is logged and the loop continues.
   */
  static async update(
    id: string,
    rawCode: string,
    rawName: string,
  ): Promise<CourseListItem> {
    const code = typeof rawCode === "string" ? rawCode.trim().toUpperCase() : "";
    const name = typeof rawName === "string" ? rawName.trim() : "";

    if (!code || !name) {
      throw new ValidationError(400, "Course code and name are required");
    }

    // Lightweight pre-read: only the syllabus ids + current code are
    // needed for the workspace rename loop. The full count comes from
    // the post-update read below.
    const existing = await CourseRepository.findByIdWithSyllabuses(id);
    if (!existing) {
      throw new ValidationError(404, "Course not found");
    }

    const oldCode = existing.code;
    const duplicate = await CourseRepository.findFirstByCodeCaseInsensitive(code, {
      excludeId: id,
    });
    if (duplicate) {
      throw new ValidationError(409, "Course code already exists");
    }

    await CourseRepository.update(id, { code, name });

    const codeChanged = oldCode.toUpperCase() !== code.toUpperCase();
    if (codeChanged) {
      for (const syllabus of existing.syllabuses) {
        const oldSlug = `${oldCode.toLowerCase()}_${syllabus.id}`;
        const newSlug = `${code.toLowerCase()}_${syllabus.id}`;
        const newName = `${code.toUpperCase()}_${syllabus.id}`;

        try {
          console.log(
            `[Update] Syncing Course Code Change: Renaming AnythingLLM workspace "${oldSlug}" to slug "${newSlug}"...`,
          );
          await AnythingLlmAdapter.renameWorkspace(oldSlug, newSlug, newName);
          await RagWorkspaceRepository.updateManyBySyllabus(syllabus.id, {
            workspaceSlug: newSlug,
            workspaceName: newName,
          });
          console.log(
            `[Update] Successfully renamed AnythingLLM workspace to slug "${newSlug}"`,
          );
        } catch (wsError) {
          console.error(
            `[Update] Failed to sync workspace renaming for syllabus ${syllabus.id}:`,
            wsError,
          );
        }
      }
    }

    // Post-update read with the document count so the response payload
    // matches the GET shape exactly.
    const updated = await CourseRepository.findByIdWithDocumentCount(id);
    if (!updated) {
      // Should be unreachable: we just updated this row. Defensive 404
      // so we never return a half-built payload.
      throw new ValidationError(404, "Course not found");
    }

    const documentCount = updated.syllabuses.reduce(
      (acc, syl) => acc + syl._count.documents,
      0,
    );

    return {
      id: updated.id,
      code: updated.code,
      name: updated.name,
      createdAt: updated.createdAt,
      documentCount,
    };
  }

  /**
   * Delete a course. The cascade guard matches the pre-refactor
   * controller: if any syllabus under the course still has documents
   * attached we abort with a 409 so the caller knows what to clean up
   * first. After the guard passes, every syllabus has its AnythingLLM
   * workspace purged + the local `rag_workspaces` row dropped (best-
   * effort, per-syllabus) before the course row itself is removed.
   */
  static async delete(id: string): Promise<void> {
    const course = await CourseRepository.findByIdWithSyllabusDocumentCounts(id);
    if (!course) {
      throw new ValidationError(404, "Course not found");
    }

    const totalDocs = course.syllabuses.reduce(
      (acc, syl) => acc + syl._count.documents,
      0,
    );
    if (totalDocs > 0) {
      throw new ValidationError(
        409,
        "Course still has documents within its syllabuses. Delete all documents before removing the course.",
      );
    }

    for (const syllabus of course.syllabuses) {
      const workspaceSlug = `${course.code.toLowerCase()}_${syllabus.id}`;
      try {
        console.log(
          `[Deletion] Syncing Course Deletion: Purging AnythingLLM workspace "${workspaceSlug}"...`,
        );
        await AnythingLlmAdapter.deleteWorkspace(workspaceSlug);
        await RagWorkspaceRepository.deleteManyBySyllabus(syllabus.id);
      } catch (wsError) {
        console.error(
          `[Deletion] Failed to delete AnythingLLM workspace "${workspaceSlug}":`,
          wsError,
        );
      }
    }

    await CourseRepository.delete(id);
  }
}

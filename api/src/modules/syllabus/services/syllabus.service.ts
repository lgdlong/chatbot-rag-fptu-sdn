import { Prisma, DocumentStatus, IngestionJobStatus } from "@prisma/client";
import { join } from "node:path";

import { prisma } from "../../auth/services/db.service.js";
import { createAuditLog } from "../../auth/services/audit.service.js";
import { CourseRepository } from "../../courses/repositories/course.repository.js";
import { DocumentRepository } from "../../documents/repositories/document.repository.js";
import { applyIngestionCallback } from "../../documents/services/ingestion-callback.service.js";
import { AnythingLlmAdapter } from "../../rag/services/anythingllm.adapter.js";

import { AssessmentSchemeRepository } from "../repositories/assessment-scheme.repository.js";
import { ConstructiveQuestionRepository } from "../repositories/constructive-question.repository.js";
import { IngestionJobRepository } from "../repositories/ingestion-job.repository.js";
import { RagWorkspaceRepository } from "../repositories/rag-workspace.repository.js";
import { SyllabusCloRepository } from "../repositories/syllabus-clo.repository.js";
import { SyllabusMaterialRepository } from "../repositories/syllabus-material.repository.js";
import { SyllabusReferenceRepository } from "../repositories/syllabus-reference.repository.js";
import { SyllabusRepository } from "../repositories/syllabus.repository.js";
import { SyllabusScheduleRepository } from "../repositories/syllabus-schedule.repository.js";
import { VideoLinkRepository } from "../repositories/video-link.repository.js";

import { ValidationError } from "../../courses/services/course.service.js";
import { SyllabusSyncService } from "./syllabus-sync.service.js";
import { removeChunkFiles, removeFileIfExists } from "../utils/file-system.utils.js";
import {
  uploadPdfBuffer,
  deleteByUrl,
  CloudinaryError,
} from "../utils/cloudinary.service.js";
import { buildPublicId } from "../utils/file-validation.utils.js";
import { logger } from "../../../utils/logger.js";

export type UploadDocumentInput = {
  syllabusId: number;
  file: File;
  filename: string;
  fileType: string;
  userId: string;
};

export type UploadDocumentResult = {
  id: string;
  name: string;
  status: string;
};

export type SearchSyllabusInput = {
  subjectCode?: string;
  role?: string | null;
};

export type UpdateSyllabusInput = {
  id: number;
  syllabusName: string;
  syllabusNameEnglish?: string;
  credits?: number;
  prerequisites?: string;
  description?: string;
  studentTasks?: string;
  tools?: string;
  minAvgMarkToPass?: number;
  decisionNo?: string;
  note?: string;
  materials?: unknown[];
  clos?: unknown[];
  schedules?: unknown[];
  questions?: unknown[];
  assessments?: unknown[];
  references?: unknown[];
  videoLinks?: unknown[];
};

/**
 * Delete the underlying file for a Document row. Dispatches by URL
 * shape:
 *   - `cloudinary.com` URL  -> `deleteByUrl()` (Cloudinary SDK)
 *   - legacy `/uploads/...` -> `removeFileIfExists()` on local disk
 * Errors are logged and swallowed so a missing file never blocks a
 * delete (matches the pre-refactor controller's best-effort stance).
 */
async function deleteDocumentFile(fileUrl: string | null, documentId: string): Promise<void> {
  if (!fileUrl) {
    logger.warn("[Delete] Document has no fileUrl, skipping file deletion", { documentId });
    return;
  }

  // Cloudinary URL
  if (fileUrl.includes("cloudinary.com")) {
    try {
      await deleteByUrl(fileUrl);
    } catch (err) {
      logger.error("[Delete] Cloudinary delete failed", {
        documentId,
        fileUrl: fileUrl.substring(0, 100),
        error: err instanceof Error ? err.message : String(err),
      });
    }
    return;
  }

  // Legacy local path
  try {
    const localPath = join(".", fileUrl.replace(/^\/+/, ""));
    await removeFileIfExists(localPath);
    logger.info("[Delete] Legacy local file removed", { documentId, path: localPath });
  } catch (err) {
    logger.error("[Delete] Legacy local file delete failed", {
      documentId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * SyllabusService -- all business logic for the syllabus module.
 *
 * Pure orchestration over the 10 repositories (`SyllabusRepository`,
 * `RagWorkspaceRepository`, 7 child-table repos, plus
 * `IngestionJobRepository` and the cross-module `CourseRepository` +
 * `DocumentRepository`). Never imports the prisma client directly except
 * to call `prisma.$transaction()` -- the scoped exception from
 * Phase 0.4 -- for the three multi-entity writes (`updateSyllabus`,
 * `activateSyllabus`, `uploadDocument`).
 *
 * Throws `ValidationError` (re-used from `CourseService`) for client-
 * facing errors so the controller can map to the matching HTTP status
 * without re-implementing validation. Every message matches the pre-
 * refactor controller verbatim so the HTTP response body shape stays
 * identical.
 *
 * Fire-and-forget audit + sync (and the upload pipeline's AnythingLLM
 * work) follow the same `Promise.resolve().then(async () => {...})`
 * pattern the pre-refactor controller used, so response timing is
 * unchanged.
 */
export class SyllabusService {
  // ---------------------------------------------------------------------
  // Search / Read
  // ---------------------------------------------------------------------

  /**
   * FR-02.8 & FR-02.9: fuzzy search by subject code. `STUDENT` role is
   * auto-restricted to active + approved syllabuses; LECTURER/ADMIN see
   * every row.
   */
  static async searchSyllabuses(
    input: SearchSyllabusInput,
  ): Promise<unknown[]> {
    return SyllabusRepository.findMany({
      subjectCode: input.subjectCode,
      role: input.role,
    });
  }

  /**
   * FR-02.7 & FR-04.1: full syllabus detail with all child relations.
   * `STUDENT` callers only see rows that are both `isApproved` and
   * `isActive` -- matches the pre-refactor 403 guard.
   */
  static async getSyllabusDetail(
    id: number,
    role: string | null | undefined,
  ): Promise<unknown> {
    const syllabus = await SyllabusRepository.findById(id, { deep: true });
    if (!syllabus) {
      throw new ValidationError(404, "Syllabus not found");
    }

    if (
      role === "STUDENT" &&
      (!(syllabus as { isActive: boolean }).isActive ||
        !(syllabus as { isApproved: boolean }).isApproved)
    ) {
      throw new ValidationError(403, "Forbidden: Syllabus not published yet");
    }

    return syllabus;
  }

  static async getDocuments(syllabusId: number): Promise<unknown[]> {
    return DocumentRepository.findManyBySyllabus(syllabusId);
  }

  // ---------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------

  /**
   * FR-02.1: create a draft (isApproved = false, isActive = false).
   * Syllabus ID is caller-supplied (it mirrors the FLM system), so the
   * service rejects duplicates with a 409.
   *
   * Audit + AnythingLLM sync fire-and-forget so the HTTP response
   * returns before either side-effect completes (matches the pre-
   * refactor controller timing).
   */
  static async createSyllabus(input: {
    syllabusId: number;
    courseId: string;
    syllabusName: string;
    syllabusNameEnglish?: string;
    credits: number;
    prerequisites?: string;
    description?: string;
    studentTasks?: string;
    tools?: string;
    minAvgMarkToPass: number;
    decisionNo?: string;
    note?: string;
    userId: string;
  }): Promise<unknown> {
    if (!input.syllabusId || !input.courseId || !input.syllabusName) {
      throw new ValidationError(
        400,
        "Syllabus ID (number), Course ID, and Syllabus Name are required",
      );
    }

    const courseExists = await CourseRepository.findById(input.courseId);
    if (!courseExists) {
      throw new ValidationError(404, "Course not found");
    }

    const idExists = await SyllabusRepository.findByIdLight(input.syllabusId);
    if (idExists) {
      throw new ValidationError(409, "Syllabus ID already exists");
    }

    const syllabus = await SyllabusRepository.create({
      id: input.syllabusId,
      course: { connect: { id: input.courseId } },
      syllabusName: input.syllabusName,
      syllabusNameEnglish: input.syllabusNameEnglish ?? null,
      credits: input.credits,
      prerequisites: input.prerequisites ?? null,
      description: input.description ?? null,
      studentTasks: input.studentTasks ?? null,
      tools: input.tools ?? null,
      minAvgMarkToPass: new Prisma.Decimal(input.minAvgMarkToPass),
      decisionNo: input.decisionNo ?? null,
      note: input.note ?? null,
      isApproved: false,
      isActive: false,
    });

    Promise.resolve().then(async () => {
      try {
        await createAuditLog({
          userId: input.userId,
          action: "CREATE_SYLLABUS",
          entityType: "Syllabus",
          entityId: String(syllabus.id),
          details: { courseId: input.courseId, syllabusName: input.syllabusName },
        });
      } catch (auditErr) {
        console.error("[AuditLog] Failed to write:", auditErr);
      }
    });

    Promise.resolve().then(async () => {
      try {
        await SyllabusSyncService.syncSyllabusToAnythingLlm(syllabus.id);
      } catch (syncErr) {
        console.error(
          `[Syllabus Sync Error] Failed to sync syllabus ${syllabus.id} to AnythingLLM:`,
          syncErr,
        );
      }
    });

    return syllabus;
  }

  /**
   * FR-02.4 & BR-05 & EC-28: full syllabus update. The whole
   * parent-row + 7 child tables is wrapped in a single
   * `prisma.$transaction` so the document never sees a half-applied
   * state. Assessment weight totals are validated BEFORE the
   * transaction so we never open a tx we're about to roll back.
   */
  static async updateSyllabus(
    input: UpdateSyllabusInput,
    userId: string,
  ): Promise<unknown> {
    const assessments = input.assessments ?? [];

    if (assessments.length > 0) {
      let totalWeight = 0;
      for (const item of assessments) {
        const w = parseFloat(String((item as { weight?: unknown }).weight));
        if (!isNaN(w)) {
          totalWeight += w;
        }
      }
      if (Math.abs(totalWeight - 100.0) > 0.01) {
        throw new ValidationError(
          400,
          `Tổng trọng số đánh giá phải bằng đúng 100%. Hiện tại: ${totalWeight.toFixed(2)}%`,
        );
      }
    }

    const existing = await SyllabusRepository.findByIdLight(input.id);
    if (!existing) {
      throw new ValidationError(404, "Syllabus not found");
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedSyl = await SyllabusRepository.update(
        input.id,
        {
          syllabusName: input.syllabusName,
          syllabusNameEnglish: input.syllabusNameEnglish,
          credits: input.credits,
          prerequisites: input.prerequisites,
          description: input.description,
          studentTasks: input.studentTasks,
          tools: input.tools,
          ...(input.minAvgMarkToPass !== undefined
            ? { minAvgMarkToPass: new Prisma.Decimal(input.minAvgMarkToPass) }
            : {}),
          decisionNo: input.decisionNo,
          note: input.note,
        },
        { tx },
      );

      if (input.materials) {
        await SyllabusMaterialRepository.deleteBySyllabus(input.id, { tx });
        for (const m of input.materials as Array<Record<string, unknown>>) {
          await SyllabusMaterialRepository.create(
            {
              syllabus: { connect: { id: input.id } },
              description: String(m.description ?? ""),
              author: (m.author as string | null | undefined) ?? null,
              publisher: (m.publisher as string | null | undefined) ?? null,
              publishedDate: (m.publishedDate as string | null | undefined) ?? null,
              edition: (m.edition as string | null | undefined) ?? null,
              isbn: (m.isbn as string | null | undefined) ?? null,
              isMainMaterial: (m.isMainMaterial as string | null | undefined) ?? null,
              isHardCopy: (m.isHardCopy as string | null | undefined) ?? null,
              isOnline: (m.isOnline as string | null | undefined) ?? null,
              note: (m.note as string | null | undefined) ?? null,
            },
            { tx },
          );
        }
      }

      if (input.clos) {
        await SyllabusCloRepository.deleteBySyllabus(input.id, { tx });
        for (const clo of input.clos as Array<Record<string, unknown>>) {
          await SyllabusCloRepository.create(
            {
              syllabus: { connect: { id: input.id } },
              cloName: String(clo.cloName ?? ""),
              cloDetails: String(clo.cloDetails ?? ""),
              loDetails: (clo.loDetails as string | null | undefined) ?? null,
            },
            { tx },
          );
        }
      }

      if (input.schedules) {
        await SyllabusScheduleRepository.deleteBySyllabus(input.id, { tx });
        for (const s of input.schedules as Array<Record<string, unknown>>) {
          await SyllabusScheduleRepository.create(
            {
              syllabus: { connect: { id: input.id } },
              session: Number(s.session),
              topic: String(s.topic ?? ""),
              learningMethod: (s.learningMethod as string | null | undefined) ?? null,
              lo: (s.lo as string | null | undefined) ?? null,
              itu: (s.itu as string | null | undefined) ?? null,
              studentMaterials: (s.studentMaterials as string | null | undefined) ?? null,
              sDownload: (s.sDownload as string | null | undefined) ?? null,
              studentTasks: (s.studentTasks as string | null | undefined) ?? null,
              urls: (s.urls as string | null | undefined) ?? null,
            },
            { tx },
          );
        }
      }

      if (input.questions) {
        await ConstructiveQuestionRepository.deleteBySyllabus(input.id, { tx });
        for (const q of input.questions as Array<Record<string, unknown>>) {
          await ConstructiveQuestionRepository.create(
            {
              syllabus: { connect: { id: input.id } },
              sessionNo: Number(q.sessionNo),
              name: String(q.name ?? ""),
              details: String(q.details ?? ""),
            },
            { tx },
          );
        }
      }

      if (input.assessments) {
        await AssessmentSchemeRepository.deleteBySyllabus(input.id, { tx });
        for (const a of input.assessments as Array<Record<string, unknown>>) {
          await AssessmentSchemeRepository.create(
            {
              syllabus: { connect: { id: input.id } },
              category: String(a.category ?? ""),
              type: (a.type as string | null | undefined) ?? null,
              part: (a.part as string | null | undefined) ?? null,
              weight: new Prisma.Decimal(parseFloat(String(a.weight))),
              completionCriteria: (a.completionCriteria as string | null | undefined) ?? null,
              duration: (a.duration as string | null | undefined) ?? null,
              clo: (a.clo as string | null | undefined) ?? null,
              questionType: (a.questionType as string | null | undefined) ?? null,
              noQuestion: (a.noQuestion as string | null | undefined) ?? null,
              knowledgeAndSkill: (a.knowledgeAndSkill as string | null | undefined) ?? null,
              gradingGuide: (a.gradingGuide as string | null | undefined) ?? null,
              note: (a.note as string | null | undefined) ?? null,
            },
            { tx },
          );
        }
      }

      if (input.references) {
        await SyllabusReferenceRepository.deleteBySyllabus(input.id, { tx });
        for (const ref of input.references as Array<Record<string, unknown>>) {
          await SyllabusReferenceRepository.create(
            {
              syllabus: { connect: { id: input.id } },
              citation: String(ref.citation ?? ""),
            },
            { tx },
          );
        }
      }

      if (input.videoLinks) {
        await VideoLinkRepository.deleteBySyllabus(input.id, { tx });
        for (const v of input.videoLinks as Array<Record<string, unknown>>) {
          await VideoLinkRepository.create(
            {
              syllabus: { connect: { id: input.id } },
              url: String(v.url ?? ""),
              title: String(v.title ?? ""),
              description: (v.description as string | null | undefined) ?? null,
            },
            { tx },
          );
        }
      }

      return updatedSyl;
    });

    Promise.resolve().then(async () => {
      try {
        await createAuditLog({
          userId,
          action: "UPDATE_SYLLABUS",
          entityType: "Syllabus",
          entityId: String(input.id),
          details: { courseId: existing.courseId },
        });
      } catch (auditErr) {
        console.error("[AuditLog] Failed to write:", auditErr);
      }
    });

    Promise.resolve().then(async () => {
      try {
        await SyllabusSyncService.syncSyllabusToAnythingLlm(input.id);
      } catch (syncErr) {
        console.error(
          `[Syllabus Sync Error] Failed to sync syllabus ${input.id} to AnythingLLM:`,
          syncErr,
        );
      }
    });

    return updated;
  }

  /**
   * FR-02.2: flip isApproved to true. Re-syncs the AnythingLLM snapshot
   * so a freshly approved syllabus is queryable by RAG immediately.
   */
  static async approveSyllabus(id: number, userId: string): Promise<unknown> {
    const exists = await SyllabusRepository.findByIdLight(id);
    if (!exists) {
      throw new ValidationError(404, "Syllabus not found");
    }

    const syllabus = await SyllabusRepository.update(id, { isApproved: true });

    Promise.resolve().then(async () => {
      try {
        await createAuditLog({
          userId,
          action: "APPROVE_SYLLABUS",
          entityType: "Syllabus",
          entityId: String(id),
        });
      } catch (auditErr) {
        console.error("[AuditLog] Failed to write:", auditErr);
      }
    });

    Promise.resolve().then(async () => {
      try {
        await SyllabusSyncService.syncSyllabusToAnythingLlm(id);
      } catch (syncErr) {
        console.error(
          `[Syllabus Sync Error] Failed to sync syllabus ${id} to AnythingLLM:`,
          syncErr,
        );
      }
    });

    return syllabus;
  }

  /**
   * FR-02.3 & BR-09 & BR-10 & EC-25 & EC-26: only-one-active invariant.
   * The whole deactivate-others + activate-this pair runs inside one
   * `prisma.$transaction` so a concurrent request cannot leave the
   * course with two active rows.
   */
  static async activateSyllabus(id: number, userId: string): Promise<unknown> {
    const syllabus = await SyllabusRepository.findByIdLight(id, {
      select: { id: true, isApproved: true, courseId: true },
    });
    if (!syllabus) {
      throw new ValidationError(404, "Syllabus not found");
    }

    if (!syllabus.isApproved) {
      throw new ValidationError(
        400,
        "Syllabus must be approved (is_approved=True) before activation.",
      );
    }

    const activated = await prisma.$transaction(async (tx) => {
      await SyllabusRepository.deactivateOthersInCourse(
        syllabus.courseId,
        id,
        { tx },
      );
      return SyllabusRepository.update(id, { isActive: true }, { tx });
    });

    Promise.resolve().then(async () => {
      try {
        await createAuditLog({
          userId,
          action: "ACTIVATE_SYLLABUS",
          entityType: "Syllabus",
          entityId: String(id),
          details: { courseId: syllabus.courseId },
        });
      } catch (auditErr) {
        console.error("[AuditLog] Failed to write:", auditErr);
      }
    });

    Promise.resolve().then(async () => {
      try {
        await SyllabusSyncService.syncSyllabusToAnythingLlm(id);
      } catch (syncErr) {
        console.error(
          `[Syllabus Sync Error] Failed to sync syllabus ${id} to AnythingLLM:`,
          syncErr,
        );
      }
    });

    return activated;
  }

  /**
   * FR-03.6: flip isActive to false and clean up the AnythingLLM
   * snapshot (best-effort, log-and-continue on failure). The audit
   * log is fire-and-forget so the HTTP response returns before the
   * AnythingLLM HTTP call settles.
   */
  static async deactivateSyllabus(id: number, userId: string): Promise<unknown> {
    const syllabus = await SyllabusRepository.findByIdLight(id, {
      select: {
        id: true,
        isActive: true,
        courseId: true,
        course: { select: { code: true } },
      },
    });
    if (!syllabus) {
      throw new ValidationError(404, "Syllabus not found");
    }

    if (!syllabus.isActive) {
      throw new ValidationError(400, "Syllabus is not currently active.");
    }

    const updated = await SyllabusRepository.update(id, { isActive: false });

    Promise.resolve().then(async () => {
      try {
        const workspaceSlug = `${syllabus.course?.code?.toLowerCase() ?? ""}_${id}`;
        const snapshotLocation = `custom-documents/syllabus-${id}-snapshot.md`;
        await AnythingLlmAdapter.updateWorkspaceEmbeddings(workspaceSlug, {
          deletes: [snapshotLocation],
        });
      } catch (cleanupErr) {
        console.error(
          `[Deactivate] Failed to cleanup AnythingLLM for syllabus ${id}:`,
          cleanupErr,
        );
      }
    });

    Promise.resolve().then(async () => {
      try {
        await createAuditLog({
          userId,
          action: "DEACTIVATE_SYLLABUS",
          entityType: "Syllabus",
          entityId: String(id),
          details: { courseId: syllabus.courseId },
        });
      } catch (auditErr) {
        console.error("[AuditLog] Failed to write:", auditErr);
      }
    });

    return updated;
  }

  /**
   * FR-02.6: hard delete. The cascade on `syllabus.documents` etc. is
   * handled by Prisma's `onDelete: Cascade` foreign keys -- no manual
   * cleanup needed here. Audit log is fire-and-forget.
   */
  static async deleteSyllabus(id: number, userId: string): Promise<void> {
    const exists = await SyllabusRepository.findByIdLight(id);
    if (!exists) {
      throw new ValidationError(404, "Syllabus not found");
    }

    await SyllabusRepository.delete(id);

    Promise.resolve().then(async () => {
      try {
        await createAuditLog({
          userId,
          action: "DELETE_SYLLABUS",
          entityType: "Syllabus",
          entityId: String(id),
          details: { courseId: exists.courseId, syllabusName: exists.syllabusName },
        });
      } catch (auditErr) {
        console.error("[AuditLog] Failed to write:", auditErr);
      }
    });
  }

  // ---------------------------------------------------------------------
  // Document management
  // ---------------------------------------------------------------------

  /**
   * Upload pipeline:
   *  1. Resolve syllabus + course, 404 if missing.
   *  2. Enforce 10-doc-per-course ceiling.
   *  3. Persist the uploaded PDF to `uploads/<ts>_<filename>`.
   *  4. Run a `prisma.$transaction` that creates the Document row,
   *     upserts the RagWorkspace row, creates the IngestionJob row, and
   *     flips both to PROCESSING -- atomic so a partial failure can't
   *     leak orphan rows.
   *  5. Fire-and-forget: audit log + the actual AnythingLLM
   *     ensure/upload/embed sequence + final `applyIngestionCallback`.
   *
   * Returns the `{id, name, status}` triple the pre-refactor controller
   * exposed verbatim.
   */
  static async uploadDocument(
    input: UploadDocumentInput,
  ): Promise<UploadDocumentResult> {
    // Step 0: Resolve syllabus
    const syllabus = await SyllabusRepository.findByIdLight(input.syllabusId, {
      select: { id: true, courseId: true, course: { select: { code: true, name: true } } },
    });
    if (!syllabus) {
      throw new ValidationError(404, "Syllabus not found");
    }

    // Step 1: Check course document limit
    const existingDocsCount = await SyllabusRepository.countCourseDocuments(
      syllabus.courseId,
    );
    if (existingDocsCount >= 10) {
      throw new ValidationError(
        400,
        "Giới hạn upload tối đa 10 tài liệu cho mỗi môn học đã bị vượt quá.",
      );
    }

    // Step 2: Convert file to buffer (needed for both Cloudinary + AnythingLLM)
    let buffer: Buffer;
    try {
      const arrayBuffer = await input.file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } catch (err) {
      logger.error("[Upload] Failed to read file buffer", {
        fileName: input.file.name,
        error: err instanceof Error ? err.message : String(err),
      });
      throw new ValidationError(400, "Failed to read uploaded file");
    }

    // Step 3: Upload to Cloudinary
    const publicId = buildPublicId(syllabus.course.code, input.file.name);
    let secureUrl: string;

    try {
      const result = await uploadPdfBuffer(buffer, publicId);
      secureUrl = result.secureUrl;
    } catch (err) {
      logger.error("[Upload] Cloudinary upload failed", {
        publicId,
        fileName: input.file.name,
        error: err instanceof Error ? err.message : String(err),
      });
      throw new CloudinaryError(
        "Failed to upload document to cloud storage. Please try again.",
        err instanceof Error ? err : undefined,
      );
    }

    // Step 4: DB transaction (atomic: Document + Workspace + IngestionJob)
    const workspaceSlug = `${syllabus.course.code.toLowerCase()}_${input.syllabusId}`;

    let doc: Awaited<ReturnType<typeof prisma.document.create>> & { ingestionJobId: string };

    try {
      doc = await prisma.$transaction(async (tx) => {
        const createdDocument = await tx.document.create({
          data: {
            name: input.filename,
            fileUrl: secureUrl,
            fileType: "pdf",
            status: DocumentStatus.PENDING,
            syllabus: { connect: { id: input.syllabusId } },
          },
        });

        const workspace = await RagWorkspaceRepository.upsertBySyllabus(
          {
            syllabusId: input.syllabusId,
            workspaceSlug,
            workspaceName: workspaceSlug,
          },
          { tx },
        );

        const job = await IngestionJobRepository.create(
          {
            document: { connect: { id: createdDocument.id } },
            workspace: { connect: { id: workspace.id } },
            status: IngestionJobStatus.PENDING,
          },
          { tx },
        );

        await tx.document.update({
          where: { id: createdDocument.id },
          data: { status: DocumentStatus.PROCESSING },
        });

        await IngestionJobRepository.update(
          job.id,
          { status: IngestionJobStatus.PROCESSING },
          { tx },
        );

        return {
          ...createdDocument,
          status: DocumentStatus.PROCESSING,
          ingestionJobId: job.id,
        };
      });
    } catch (dbError) {
      // Transaction failed — clean up orphan Cloudinary upload
      logger.error("[Upload] DB transaction failed after Cloudinary upload", {
        publicId,
        error: dbError instanceof Error ? dbError.message : String(dbError),
      });
      try {
        await deleteByUrl(secureUrl);
        logger.info("[Upload] Cleaned up orphan Cloudinary asset", { publicId });
      } catch (cleanupErr) {
        logger.error("[Upload] Failed to clean up orphan Cloudinary asset", {
          publicId,
          error: cleanupErr instanceof Error ? cleanupErr.message : String(cleanupErr),
        });
      }
      throw dbError;
    }

    // Step 5: Fire-and-forget — audit log
    Promise.resolve().then(async () => {
      try {
        await createAuditLog({
          userId: input.userId,
          action: "UPLOAD_DOCUMENT",
          entityType: "Document",
          entityId: doc.id,
          details: { fileName: input.file.name, syllabusId: input.syllabusId },
        });
      } catch (auditErr) {
        logger.error("[AuditLog] Failed to write", { error: auditErr instanceof Error ? auditErr.message : String(auditErr) });
      }
    });

    // Step 6: Fire-and-forget — AnythingLLM ingestion
    Promise.resolve().then(async () => {
      try {
        logger.info(`[Ingestion] Starting for workspace "${workspaceSlug}"`);
        await AnythingLlmAdapter.ensureWorkspace(workspaceSlug);

        const docLocation = await AnythingLlmAdapter.uploadPdf(
          input.file.name,
          buffer,
        );

        await AnythingLlmAdapter.updateWorkspaceEmbeddings(workspaceSlug, {
          adds: [docLocation],
        });

        await applyIngestionCallback({
          documentId: doc.id,
          jobId: doc.ingestionJobId,
          status: DocumentStatus.COMPLETED,
          payload: { workspaceSlug, sourceLocation: docLocation },
          sourceLocation: docLocation,
        });
        logger.info(`[Ingestion] Completed for document "${input.file.name}"`);
      } catch (error) {
        logger.error(`[Ingestion] Failed for "${input.file.name}"`, { error: error instanceof Error ? error.message : String(error) });
        const errorMessage = error instanceof Error ? error.message : String(error);
        try {
          await applyIngestionCallback({
            documentId: doc.id,
            jobId: doc.ingestionJobId,
            status: DocumentStatus.FAILED,
            error: errorMessage,
            payload: { workspaceSlug },
          });
        } catch (dbErr) {
          logger.error("[Ingestion] Failed to mark FAILED status in DB", { error: dbErr instanceof Error ? dbErr.message : String(dbErr) });
        }
      }
    });

    return {
      id: doc.id,
      name: doc.name,
      status: "PROCESSING",
    };
  }

  /**
   * Delete a document attached to a syllabus. The pre-refactor behavior
   * was: idempotent success if the document is already gone; 409 if the
   * document is still being processed (cannot cancel a running
   * ingestion); anything else tears down the file, the per-page
   * chunks, the DB row, and the AnythingLLM embeddings.
   *
   * AnythingLLM cleanup is wrapped in its own try/catch (best-effort,
   * matches the pre-refactor controller's "log and continue" stance).
   */
  static async deleteDocument(input: {
    syllabusId: number;
    documentId: string;
    userId: string;
  }): Promise<void> {
    const syllabus = await SyllabusRepository.findByIdLight(input.syllabusId, {
      select: { id: true, course: { select: { code: true } } },
    });
    if (!syllabus) {
      throw new ValidationError(404, "Syllabus not found");
    }

    const document = await DocumentRepository.findById(input.documentId);
    if (!document) {
      // Already gone -- idempotent success.
      return;
    }

    if (document.syllabusId !== input.syllabusId) {
      // Foreign-key mismatch -- treat as already gone, matches the
      // pre-refactor controller's silent success on a missing doc.
      return;
    }

    if (
      document.status === DocumentStatus.PENDING ||
      document.status === DocumentStatus.PROCESSING
    ) {
      throw new ValidationError(
        409,
        "Document is still processing and cannot be deleted",
      );
    }

    await deleteDocumentFile(document.fileUrl, document.id);
    await removeChunkFiles(input.documentId);

    try {
      await DocumentRepository.delete(input.documentId);
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      if (code === "P2025") {
        // Row vanished between the read and the delete -- still success.
        return;
      }
      throw error;
    }

    try {
      const fileName = document.fileUrl.split("/").pop();
      const anythingLLMLocation = `custom-documents/${fileName}`;
      const workspaceSlug = `${syllabus.course?.code?.toLowerCase() ?? ""}_${input.syllabusId}`;

      console.log(
        `[Deletion] Syncing Document Deletion: Removing "${anythingLLMLocation}" from AnythingLLM workspace "${workspaceSlug}"...`,
      );
      await AnythingLlmAdapter.updateWorkspaceEmbeddings(workspaceSlug, {
        deletes: [anythingLLMLocation],
      });

      console.log(
        `[Deletion] Syncing Document Deletion: Purging "${anythingLLMLocation}" from AnythingLLM system...`,
      );
      await AnythingLlmAdapter.purgeDocuments([anythingLLMLocation]);
    } catch (llmError) {
      console.error(
        "[Deletion] Failed to sync document deletion with AnythingLLM:",
        llmError,
      );
    }

    Promise.resolve().then(async () => {
      try {
        await createAuditLog({
          userId: input.userId,
          action: "DELETE_DOCUMENT",
          entityType: "Document",
          entityId: input.documentId,
          details: { fileName: document.name, syllabusId: input.syllabusId },
        });
      } catch (auditErr) {
        console.error("[AuditLog] Failed to write:", auditErr);
      }
    });
  }
}

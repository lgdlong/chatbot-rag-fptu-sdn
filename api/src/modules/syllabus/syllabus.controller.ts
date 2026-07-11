import { Hono, type Context } from "hono";

import { auth } from "../auth/auth.js";
import { ValidationError } from "../courses/services/course.service.js";
import { SyllabusService } from "./services/syllabus.service.js";
import { isPdfByContent, sanitizeFilename } from "./utils/file-validation.utils.js";

export const syllabusRouter = new Hono();

type AuthResult =
  | { error: Response; session: null }
  | { error: null; session: typeof auth.$Infer.Session };

async function requireLecturer(c: Context): Promise<AuthResult> {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    return { error: c.json({ error: "Unauthorized" }, 401) as Response, session: null };
  }

  const role = session.user.role;
  if (role !== "LECTURER") {
    return { error: c.json({ error: "Forbidden: Lecturer role required" }, 403) as Response, session: null };
  }

  return { error: null, session };
}

function respondWithServiceError(c: Context, err: unknown) {
  if (err instanceof ValidationError) {
    return c.json({ error: err.message }, err.statusCode as 400 | 403 | 404 | 409);
  }
  const message = err instanceof Error ? err.message : "Unexpected error";
  return c.json({ error: message }, 500);
}

// ==========================================
// 1. API TRA CỨU SYLLABUS (SEARCH)
// ==========================================
// FR-02.8 & FR-02.9: Fuzzy search syllabus bằng Subject Code
syllabusRouter.get("/", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) return c.json({ error: "Unauthorized" }, 401);

  const subjectCode = c.req.query("subject_code")?.trim().toUpperCase() || "";
  const role = session.user.role;

  try {
    const syllabuses = await SyllabusService.searchSyllabuses({
      subjectCode,
      role,
    });
    return c.json({ syllabuses });
  } catch (err: unknown) {
    return respondWithServiceError(c, err);
  }
});

// ==========================================
// 2. API XEM CHI TIẾT SYLLABUS (VIEW DETAILS)
// ==========================================
// FR-02.7 & FR-04.1: Hiển thị đầy đủ thông tin syllabus có cấu trúc
syllabusRouter.get("/:id", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) return c.json({ error: "Unauthorized" }, 401);

  const id = parseInt(c.req.param("id"));
  if (isNaN(id)) return c.json({ error: "Invalid Syllabus ID" }, 400);

  try {
    const syllabus = await SyllabusService.getSyllabusDetail(
      id,
      session.user.role,
    );
    return c.json({ syllabus });
  } catch (err: unknown) {
    return respondWithServiceError(c, err);
  }
});

// ==========================================
// 3. API TẠO MỚI SYLLABUS (DRAFT)
// ==========================================
// FR-02.1: Tạo mới mặc định là Draft (isApproved = false, isActive = false)
syllabusRouter.post("/", async (c) => {
  const authResult = await requireLecturer(c);
  if (authResult.error) return authResult.error;

  try {
    const body = await c.req.json();
    const syllabus = await SyllabusService.createSyllabus({
      syllabusId: typeof body.id === "number" ? body.id : 0,
      courseId: typeof body.courseId === "string" ? body.courseId : "",
      syllabusName: typeof body.syllabusName === "string" ? body.syllabusName.trim() : "",
      syllabusNameEnglish: typeof body.syllabusNameEnglish === "string" ? body.syllabusNameEnglish.trim() : undefined,
      credits: typeof body.credits === "number" ? body.credits : 3,
      prerequisites: typeof body.prerequisites === "string" ? body.prerequisites.trim() : undefined,
      description: typeof body.description === "string" ? body.description.trim() : undefined,
      studentTasks: typeof body.studentTasks === "string" ? body.studentTasks.trim() : undefined,
      tools: typeof body.tools === "string" ? body.tools.trim() : undefined,
      minAvgMarkToPass: typeof body.minAvgMarkToPass === "number" ? body.minAvgMarkToPass : 5.0,
      decisionNo: typeof body.decisionNo === "string" ? body.decisionNo.trim() : undefined,
      note: typeof body.note === "string" ? body.note.trim() : undefined,
      userId: authResult.session.user.id,
    });

    return c.json({ syllabus }, 201);
  } catch (err: unknown) {
    return respondWithServiceError(c, err);
  }
});

// ==========================================
// 4. API CẬP NHẬT CHI TIẾT SYLLABUS & VALIDATION WEIGHT
// ==========================================
// FR-02.4 & BR-05 & EC-28: Sửa đổi đề cương và kiểm tra tổng trọng số assessment = 100%
syllabusRouter.put("/:id", async (c) => {
  const authResult = await requireLecturer(c);
  if (authResult.error) return authResult.error;

  const id = parseInt(c.req.param("id"));
  if (isNaN(id)) return c.json({ error: "Invalid Syllabus ID" }, 400);

  try {
    const body = await c.req.json();
    const syllabus = await SyllabusService.updateSyllabus(
      {
        id,
        syllabusName: typeof body.syllabusName === "string" ? body.syllabusName.trim() : "",
        syllabusNameEnglish: typeof body.syllabusNameEnglish === "string" ? body.syllabusNameEnglish.trim() : undefined,
        credits: typeof body.credits === "number" ? body.credits : undefined,
        prerequisites: typeof body.prerequisites === "string" ? body.prerequisites.trim() : undefined,
        description: typeof body.description === "string" ? body.description.trim() : undefined,
        studentTasks: typeof body.studentTasks === "string" ? body.studentTasks.trim() : undefined,
        tools: typeof body.tools === "string" ? body.tools.trim() : undefined,
        minAvgMarkToPass: typeof body.minAvgMarkToPass === "number" ? body.minAvgMarkToPass : undefined,
        decisionNo: typeof body.decisionNo === "string" ? body.decisionNo.trim() : undefined,
        note: typeof body.note === "string" ? body.note.trim() : undefined,
        materials: body.materials,
        clos: body.clos,
        schedules: body.schedules,
        questions: body.questions,
        assessments: body.assessments,
        references: body.references,
        videoLinks: body.videoLinks,
      },
      authResult.session.user.id,
    );

    return c.json({ success: true, syllabus });
  } catch (err: unknown) {
    return respondWithServiceError(c, err);
  }
});

// ==========================================
// 5. API PHÊ DUYỆT SYLLABUS (APPROVE)
// ==========================================
// FR-02.2: Phê duyệt syllabus (Approved = true)
syllabusRouter.patch("/:id/approve", async (c) => {
  const authResult = await requireLecturer(c);
  if (authResult.error) return authResult.error;

  const id = parseInt(c.req.param("id"));
  if (isNaN(id)) return c.json({ error: "Invalid Syllabus ID" }, 400);

  try {
    const syllabus = await SyllabusService.approveSyllabus(
      id,
      authResult.session.user.id,
    );
    return c.json({ success: true, syllabus });
  } catch (err: unknown) {
    return respondWithServiceError(c, err);
  }
});

// ==========================================
// 6. API KÍCH HOẠT SYLLABUS & LIFE CYCLE (ACTIVATE)
// ==========================================
// FR-02.3 & BR-09 & BR-10 & EC-25 & EC-26: Kích hoạt syllabus và tự động deactivate bản cũ
syllabusRouter.patch("/:id/activate", async (c) => {
  const authResult = await requireLecturer(c);
  if (authResult.error) return authResult.error;

  const id = parseInt(c.req.param("id"));
  if (isNaN(id)) return c.json({ error: "Invalid Syllabus ID" }, 400);

  try {
    const syllabus = await SyllabusService.activateSyllabus(
      id,
      authResult.session.user.id,
    );
    return c.json({ success: true, syllabus });
  } catch (err: unknown) {
    return respondWithServiceError(c, err);
  }
});

// ==========================================
// 7. API HUỶ KÍCH HOẠT SYLLABUS (DEACTIVATE)
// ==========================================
// FR-03.6: Deactivate syllabus (set isActive = false)
syllabusRouter.patch("/:id/deactivate", async (c) => {
  const authResult = await requireLecturer(c);
  if (authResult.error) return authResult.error;

  const id = parseInt(c.req.param("id"));
  if (isNaN(id)) return c.json({ error: "Invalid Syllabus ID" }, 400);

  try {
    const syllabus = await SyllabusService.deactivateSyllabus(
      id,
      authResult.session.user.id,
    );
    return c.json({ success: true, syllabus });
  } catch (err: unknown) {
    return respondWithServiceError(c, err);
  }
});

// ==========================================
// 8. API XÓA SYLLABUS (DELETE)
// ==========================================
// FR-02.6: Xóa vật lý (hard delete) khỏi database
syllabusRouter.delete("/:id", async (c) => {
  const authResult = await requireLecturer(c);
  if (authResult.error) return authResult.error;

  const id = parseInt(c.req.param("id"));
  if (isNaN(id)) return c.json({ error: "Invalid Syllabus ID" }, 400);

  try {
    await SyllabusService.deleteSyllabus(id, authResult.session.user.id);
    return c.json({ success: true });
  } catch (err: unknown) {
    return respondWithServiceError(c, err);
  }
});

// ==========================================
// 9. API QUẢN LÝ TÀI LIỆU CỦA SYLLABUS
// ==========================================

// GET /:syllabusId/documents
syllabusRouter.get("/:syllabusId/documents", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const syllabusId = parseInt(c.req.param("syllabusId"));
  if (isNaN(syllabusId)) return c.json({ error: "Invalid Syllabus ID" }, 400);

  try {
    const documents = await SyllabusService.getDocuments(syllabusId);
    return c.json({ documents });
  } catch (err: unknown) {
    return respondWithServiceError(c, err);
  }
});

// POST /:syllabusId/documents (Upload & Index tài liệu)
syllabusRouter.post("/:syllabusId/documents", async (c) => {
  const authResult = await requireLecturer(c);
  if (authResult.error) return authResult.error;

  const syllabusId = parseInt(c.req.param("syllabusId"));
  if (isNaN(syllabusId)) return c.json({ error: "Invalid Syllabus ID" }, 400);

  const body = await c.req.parseBody();
  const file = body.file;

  if (!file || !(file instanceof File)) {
    return c.json({ error: "No file uploaded or invalid file format" }, 400);
  }

  // Edge case: Kiểm tra dung lượng file (dưới 50MB theo yêu cầu SRS)
  if (file.size > 50 * 1024 * 1024) {
    return c.json({ error: "File size exceeds the maximum limit of 50MB" }, 400);
  }

  // Edge case: Kiểm tra định dạng file (chỉ PDF)
  const fileExtension = file.name.split(".").pop()?.toLowerCase();
  if (fileExtension !== "pdf") {
    return c.json({
      error: "Unsupported file format. Please export your slide or document to PDF format before uploading.",
    }, 400);
  }

  // Magic byte check (security: verify actual content is PDF)
  const headerBuffer = Buffer.from(await file.slice(0, 4).arrayBuffer());
  if (!isPdfByContent(headerBuffer)) {
    return c.json({ error: "File content does not appear to be a valid PDF" }, 400);
  }

  try {
    const result = await SyllabusService.uploadDocument({
      syllabusId,
      file,
      filename: sanitizeFilename(file.name),
      fileType: "pdf",
      userId: authResult.session.user.id,
    });

    return c.json({ success: true, document: result });
  } catch (err: unknown) {
    return respondWithServiceError(c, err);
  }
});

// DELETE /:syllabusId/documents/:documentId
syllabusRouter.delete("/:syllabusId/documents/:documentId", async (c) => {
  const authResult = await requireLecturer(c);
  if (authResult.error) return authResult.error;

  const syllabusId = parseInt(c.req.param("syllabusId"));
  const documentId = c.req.param("documentId");
  if (isNaN(syllabusId)) return c.json({ error: "Invalid Syllabus ID" }, 400);

  try {
    await SyllabusService.deleteDocument({
      syllabusId,
      documentId,
      userId: authResult.session.user.id,
    });
    return c.json({ success: true });
  } catch (err: unknown) {
    return respondWithServiceError(c, err);
  }
});

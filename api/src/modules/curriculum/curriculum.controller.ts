import { Hono, type Context } from "hono";
import { auth } from "../auth/auth.js";
import { CurriculumService, CurriculumServiceError } from "./services/curriculum.service.js";
import { prisma } from "../auth/services/db.service.js";

export const curriculumRouter = new Hono();

async function requireAdmin(c: Context) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    return { error: c.json({ error: "Unauthorized" }, 401) as Response, session: null };
  }

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "LECTURER") {
    return { error: c.json({ error: "Forbidden: Admin or Lecturer role required" }, 403) as Response, session: null };
  }

  return { error: null, session };
}

/**
 * Map a service-thrown error onto the right HTTP status. Validation/business
 * errors are 4xx (carried by `CurriculumServiceError.statusCode`); anything
 * else falls through to 500 with the raw error message -- matching the
 * pre-refactor controller's error semantics byte-for-byte.
 */
function respondWithServiceError(c: Context, err: unknown) {
  if (err instanceof CurriculumServiceError) {
    return c.json({ error: err.message }, err.statusCode as 400 | 404 | 409);
  }
  const message = err instanceof Error ? err.message : String(err);
  return c.json({ error: message }, 500);
}

// ==========================================
// 1. API NGÀNH HỌC (MAJOR)
// ==========================================

// Lấy danh sách ngành học
curriculumRouter.get("/majors", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) return c.json({ error: "Unauthorized" }, 401);

  try {
    const majors = await CurriculumService.listMajors();
    return c.json({ majors });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Tạo mới ngành học
curriculumRouter.post("/majors", async (c) => {
  const authResult = await requireAdmin(c);
  if (authResult.error) return authResult.error;

  try {
    const body = await c.req.json();
    const code = body.code;
    const name = body.name;
    const description = body.description;

    const major = await CurriculumService.createMajor(
      typeof code === "string" ? code : "",
      typeof name === "string" ? name : "",
      typeof description === "string" ? description : "",
    );

    return c.json({ major }, 201);
  } catch (err) {
    return respondWithServiceError(c, err);
  }
});

// Sửa ngành học
curriculumRouter.put("/majors/:id", async (c) => {
  const authResult = await requireAdmin(c);
  if (authResult.error) return authResult.error;

  const id = c.req.param("id");
  try {
    const body = await c.req.json();
    const name = body.name;
    const description = body.description;

    const major = await CurriculumService.updateMajor(
      id,
      typeof name === "string" ? name : "",
      typeof description === "string" ? description : "",
    );

    return c.json({ major });
  } catch (err) {
    return respondWithServiceError(c, err);
  }
});

// Xóa ngành học
curriculumRouter.delete("/majors/:id", async (c) => {
  const authResult = await requireAdmin(c);
  if (authResult.error) return authResult.error;

  const id = c.req.param("id");
  try {
    await CurriculumService.deleteMajor(id);
    return c.json({ success: true });
  } catch (err) {
    return respondWithServiceError(c, err);
  }
});

// ==========================================
// 2. API CHUYÊN NGÀNH HẸP (SPECIALIZATION)
// ==========================================

// Lấy danh sách chuyên ngành hẹp
curriculumRouter.get("/specializations", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) return c.json({ error: "Unauthorized" }, 401);

  try {
    const specializations = await CurriculumService.listSpecializations();
    return c.json({ specializations });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Đếm số môn đặc thù của một chuyên ngành hẹp
curriculumRouter.get("/specializations/:specializationId/subject-count", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) return c.json({ error: "Unauthorized" }, 401);

  const specializationId = c.req.param("specializationId");
  try {
    const count = await prisma.curriculumSubject.count({
      where: {
        isSpecializationSpecific: true,
        curriculum: { specializationId },
      },
    });

    return c.json({
      total: 4,
      specializationSpecific: count,
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Tạo chuyên ngành hẹp
curriculumRouter.post("/specializations", async (c) => {
  const authResult = await requireAdmin(c);
  if (authResult.error) return authResult.error;

  try {
    const body = await c.req.json();
    const majorId = body.majorId;
    const code = body.code;
    const name = body.name;
    const description = body.description;

    const spec = await CurriculumService.createSpecialization(
      typeof majorId === "string" ? majorId : "",
      typeof code === "string" ? code : "",
      typeof name === "string" ? name : "",
      typeof description === "string" ? description : "",
    );

    return c.json({ specialization: spec }, 201);
  } catch (err) {
    return respondWithServiceError(c, err);
  }
});

// Sửa chuyên ngành hẹp
curriculumRouter.put("/specializations/:id", async (c) => {
  const authResult = await requireAdmin(c);
  if (authResult.error) return authResult.error;

  const id = c.req.param("id");
  try {
    const body = await c.req.json();
    const name = body.name;
    const description = body.description;

    const spec = await CurriculumService.updateSpecialization(
      id,
      typeof name === "string" ? name : "",
      typeof description === "string" ? description : "",
    );

    return c.json({ specialization: spec });
  } catch (err) {
    return respondWithServiceError(c, err);
  }
});

// Xóa chuyên ngành hẹp
curriculumRouter.delete("/specializations/:id", async (c) => {
  const authResult = await requireAdmin(c);
  if (authResult.error) return authResult.error;

  const id = c.req.param("id");
  try {
    await CurriculumService.deleteSpecialization(id);
    return c.json({ success: true });
  } catch (err) {
    return respondWithServiceError(c, err);
  }
});

// ==========================================
// 3. API KHUNG CHƯƠNG TRÌNH ĐÀO TẠO (CURRICULUM)
// ==========================================

// Lấy danh sách khung chương trình
curriculumRouter.get("/curriculums", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) return c.json({ error: "Unauthorized" }, 401);

  try {
    const curriculums = await CurriculumService.listCurriculums();
    return c.json({ curriculums });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Xem chi tiết khung chương trình kèm danh sách môn học (FR-01.5)
curriculumRouter.get("/curriculums/:curriculumId", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) return c.json({ error: "Unauthorized" }, 401);

  const curriculumId = c.req.param("curriculumId");
  try {
    const curr = await CurriculumService.getCurriculumDetail(curriculumId);
    return c.json({ curriculum: curr });
  } catch (err) {
    return respondWithServiceError(c, err);
  }
});

// Tạo mới khung chương trình (BIT_SE_NJS_19B)
curriculumRouter.post("/curriculums", async (c) => {
  const authResult = await requireAdmin(c);
  if (authResult.error) return authResult.error;

  try {
    const body = await c.req.json();
    const curriculumId = body.curriculumId;
    const majorId = body.majorId;
    const specializationId = body.specializationId;
    const batchCode = body.batchCode;

    const curr = await CurriculumService.createCurriculum(
      typeof curriculumId === "string" ? curriculumId : "",
      typeof majorId === "string" ? majorId : "",
      typeof specializationId === "string" ? specializationId : null,
      typeof batchCode === "string" ? batchCode : "",
    );

    return c.json({ curriculum: curr }, 201);
  } catch (err) {
    return respondWithServiceError(c, err);
  }
});

curriculumRouter.put("/curriculums/:id", async (c) => {
  const authResult = await requireAdmin(c);
  if (authResult.error) return authResult.error;

  const id = c.req.param("id");

  try {
    const body = await c.req.json();
    const majorId = body.majorId;
    const specializationId = body.specializationId;
    const batchCode = body.batchCode;

    const curriculum = await CurriculumService.updateCurriculum(
      id,
      typeof majorId === "string" ? majorId : "",
      typeof specializationId === "string" ? specializationId : null,
      typeof batchCode === "string" ? batchCode : "",
    );

    return c.json({ curriculum });
  } catch (err) {
    return respondWithServiceError(c, err);
  }
});

// Xóa khung chương trình
curriculumRouter.delete("/curriculums/:id", async (c) => {
  const authResult = await requireAdmin(c);
  if (authResult.error) return authResult.error;

  const id = c.req.param("id");
  try {
    await CurriculumService.deleteCurriculum(id);
    return c.json({ success: true });
  } catch (err) {
    return respondWithServiceError(c, err);
  }
});

// ==========================================
// 4. API GÁN/GỠ MÔN HỌC KHUNG CHƯƠNG TRÌNH
// ==========================================

// Gán môn học vào khung chương trình (FR-01.3 & FR-01.4)
curriculumRouter.post("/curriculums/:curriculumId/subjects", async (c) => {
  const authResult = await requireAdmin(c);
  if (authResult.error) return authResult.error;

  const curriculumId = c.req.param("curriculumId");
  try {
    const body = await c.req.json();
    const courseId = body.courseId;
    const semesterNo = body.semesterNo;
    const isSpecializationSpecific = body.isSpecializationSpecific;

    const link = await CurriculumService.assignSubject(
      curriculumId,
      typeof courseId === "string" ? courseId : "",
      typeof semesterNo === "number" ? semesterNo : 1,
      typeof isSpecializationSpecific === "boolean"
        ? isSpecializationSpecific
        : false,
    );

    return c.json({ success: true, link }, 201);
  } catch (err) {
    return respondWithServiceError(c, err);
  }
});

// Quick-fill 44 core subjects into curriculum
curriculumRouter.post("/curriculums/:curriculumId/quick-fill", async (c) => {
  const authResult = await requireAdmin(c);
  if (authResult.error) return authResult.error;

  const curriculumId = c.req.param("curriculumId");
  try {
    const result = await CurriculumService.quickFillCoreSubjects(curriculumId);
    return c.json(result, 201);
  } catch (err) {
    return respondWithServiceError(c, err);
  }
});

// Gỡ môn học khỏi khung chương trình
curriculumRouter.delete("/curriculums/:curriculumId/subjects/:courseId", async (c) => {
  const authResult = await requireAdmin(c);
  if (authResult.error) return authResult.error;

  const curriculumId = c.req.param("curriculumId");
  const courseId = c.req.param("courseId");

  try {
    await CurriculumService.removeSubject(curriculumId, courseId);
    return c.json({ success: true });
  } catch (err) {
    return respondWithServiceError(c, err);
  }
});

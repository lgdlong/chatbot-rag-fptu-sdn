import { Hono, type Context } from "hono";
import { prisma } from "../auth/services/db.service.js";
import { auth } from "../auth/auth.js";

export const curriculumRouter = new Hono();

async function requireAdmin(c: Context) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    return { error: c.json({ error: "Unauthorized" }, 401) as Response, session: null };
  }

  const role = session.user.role;
  if (role !== "ADMIN") {
    return { error: c.json({ error: "Forbidden: Admin role required" }, 403) as Response, session: null };
  }

  return { error: null, session };
}

// ==========================================
// 1. API NGÀNH HỌC (MAJOR)
// ==========================================

// Lấy danh sách ngành học
curriculumRouter.get("/majors", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) return c.json({ error: "Unauthorized" }, 401);

  try {
    const majors = await prisma.major.findMany({
      orderBy: { code: "asc" }
    });
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
    const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";

    if (!code || !name) {
      return c.json({ error: "Major code and name are required" }, 400);
    }

    const exists = await prisma.major.findUnique({ where: { code } });
    if (exists) {
      return c.json({ error: "Major code already exists" }, 409);
    }

    const major = await prisma.major.create({
      data: { code, name, description }
    });

    return c.json({ major }, 201);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Sửa ngành học
curriculumRouter.put("/majors/:id", async (c) => {
  const authResult = await requireAdmin(c);
  if (authResult.error) return authResult.error;

  const id = c.req.param("id");
  try {
    const body = await c.req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";

    if (!name) {
      return c.json({ error: "Major name is required" }, 400);
    }

    const major = await prisma.major.update({
      where: { id },
      data: { name, description }
    });

    return c.json({ major });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Xóa ngành học
curriculumRouter.delete("/majors/:id", async (c) => {
  const authResult = await requireAdmin(c);
  if (authResult.error) return authResult.error;

  const id = c.req.param("id");
  try {
    // Kiểm tra xem có chuyên ngành hẹp nào liên kết không
    const hasSpecs = await prisma.specialization.findFirst({ where: { majorId: id } });
    if (hasSpecs) {
      return c.json({ error: "Cannot delete Major. Please delete all associated Specializations first." }, 409);
    }

    await prisma.major.delete({ where: { id } });
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
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
    const specializations = await prisma.specialization.findMany({
      orderBy: { code: "asc" },
      include: { major: { select: { code: true, name: true } } }
    });
    return c.json({ specializations });
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
    const majorId = typeof body.majorId === "string" ? body.majorId : "";
    const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";

    if (!majorId || !code || !name) {
      return c.json({ error: "Major ID, code, and name are required" }, 400);
    }

    const majorExists = await prisma.major.findUnique({ where: { id: majorId } });
    if (!majorExists) {
      return c.json({ error: "Major not found" }, 404);
    }

    const exists = await prisma.specialization.findUnique({ where: { code } });
    if (exists) {
      return c.json({ error: "Specialization code already exists" }, 409);
    }

    const spec = await prisma.specialization.create({
      data: { majorId, code, name, description }
    });

    return c.json({ specialization: spec }, 201);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Sửa chuyên ngành hẹp
curriculumRouter.put("/specializations/:id", async (c) => {
  const authResult = await requireAdmin(c);
  if (authResult.error) return authResult.error;

  const id = c.req.param("id");
  try {
    const body = await c.req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";

    if (!name) {
      return c.json({ error: "Specialization name is required" }, 400);
    }

    const spec = await prisma.specialization.update({
      where: { id },
      data: { name, description }
    });

    return c.json({ specialization: spec });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Xóa chuyên ngành hẹp
curriculumRouter.delete("/specializations/:id", async (c) => {
  const authResult = await requireAdmin(c);
  if (authResult.error) return authResult.error;

  const id = c.req.param("id");
  try {
    // Kiểm tra khung chương trình liên quan (EC-20)
    const hasCurriculums = await prisma.curriculum.findFirst({ where: { specializationId: id } });
    if (hasCurriculums) {
      return c.json({ error: "Cannot delete Specialization. There are curriculums linked to this specialization." }, 409);
    }

    await prisma.specialization.delete({ where: { id } });
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
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
    const curriculums = await prisma.curriculum.findMany({
      orderBy: { curriculumId: "asc" },
      include: {
        major: { select: { code: true, name: true } },
        specialization: { select: { code: true, name: true } },
        _count: { select: { subjects: true } }
      }
    });
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
    const curr = await prisma.curriculum.findFirst({
      where: {
        OR: [
          { id: curriculumId },
          { curriculumId: curriculumId }
        ]
      },
      include: {
        major: true,
        specialization: true,
        subjects: {
          orderBy: [{ semesterNo: "asc" }, { course: { code: "asc" } }],
          include: {
            course: {
              select: {
                id: true,
                code: true,
                name: true,
                syllabuses: {
                  where: { isActive: true, isApproved: true },
                  select: { id: true }
                }
              }
            }
          }
        }
      }
    });

    if (!curr) {
      return c.json({ error: "Curriculum not found" }, 404);
    }

    return c.json({ curriculum: curr });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Tạo mới khung chương trình (BIT_SE_NJS_19B)
curriculumRouter.post("/curriculums", async (c) => {
  const authResult = await requireAdmin(c);
  if (authResult.error) return authResult.error;

  try {
    const body = await c.req.json();
    const curriculumId = typeof body.curriculumId === "string" ? body.curriculumId.trim().toUpperCase() : "";
    const majorId = typeof body.majorId === "string" ? body.majorId : "";
    const specializationId = typeof body.specializationId === "string" ? body.specializationId : null;
    const batchCode = typeof body.batchCode === "string" ? body.batchCode.trim() : "";

    if (!curriculumId || !majorId || !batchCode) {
      return c.json({ error: "Curriculum ID (BIT_SE_NJS_19B), Major ID, and Batch Code are required" }, 400);
    }

    // Kiểm tra Major
    const majorExists = await prisma.major.findUnique({ where: { id: majorId } });
    if (!majorExists) return c.json({ error: "Major not found" }, 404);

    // Kiểm tra Specialization nếu có
    if (specializationId) {
      const specExists = await prisma.specialization.findUnique({ where: { id: specializationId } });
      if (!specExists) return c.json({ error: "Specialization not found" }, 404);
    }

    const exists = await prisma.curriculum.findUnique({ where: { curriculumId } });
    if (exists) {
      return c.json({ error: "Curriculum ID already exists" }, 409);
    }

    const curr = await prisma.curriculum.create({
      data: {
        curriculumId,
        majorId,
        specializationId,
        batchCode
      }
    });

    return c.json({ curriculum: curr }, 201);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

curriculumRouter.put("/curriculums/:id", async (c) => {
  const authResult = await requireAdmin(c);
  if (authResult.error) return authResult.error;

  const id = c.req.param("id");

  try {
    const body = await c.req.json();
    const majorId = typeof body.majorId === "string" ? body.majorId : "";
    const specializationId = typeof body.specializationId === "string" ? body.specializationId : null;
    const batchCode = typeof body.batchCode === "string" ? body.batchCode.trim() : "";

    if (!majorId || !batchCode) {
      return c.json({ error: "Major ID and Batch Code are required" }, 400);
    }

    const majorExists = await prisma.major.findUnique({ where: { id: majorId } });
    if (!majorExists) return c.json({ error: "Major not found" }, 404);

    if (specializationId) {
      const specExists = await prisma.specialization.findUnique({ where: { id: specializationId } });
      if (!specExists) return c.json({ error: "Specialization not found" }, 404);
    }

    const curriculum = await prisma.curriculum.update({
      where: { id },
      data: {
        majorId,
        specializationId,
        batchCode,
      },
    });

    return c.json({ curriculum });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Xóa khung chương trình
curriculumRouter.delete("/curriculums/:id", async (c) => {
  const authResult = await requireAdmin(c);
  if (authResult.error) return authResult.error;

  const id = c.req.param("id");
  try {
    await prisma.curriculum.delete({ where: { id } });
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
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
    const courseId = typeof body.courseId === "string" ? body.courseId : "";
    const semesterNo = typeof body.semesterNo === "number" ? body.semesterNo : 1;
    const isSpecializationSpecific = typeof body.isSpecializationSpecific === "boolean" ? body.isSpecializationSpecific : false;

    if (!courseId || semesterNo < 1 || semesterNo > 9) {
      return c.json({ error: "Course ID and a valid Semester No (1-9) are required" }, 400);
    }

    // Tìm Khung chương trình
    const curr = await prisma.curriculum.findFirst({
      where: {
        OR: [
          { id: curriculumId },
          { curriculumId: curriculumId }
        ]
      }
    });
    if (!curr) return c.json({ error: "Curriculum not found" }, 404);

    // Tìm Môn học
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return c.json({ error: "Subject/Course not found" }, 404);

    // Gán môn
    const link = await prisma.curriculumSubject.create({
      data: {
        curriculumId: curr.id,
        courseId,
        semesterNo,
        isSpecializationSpecific
      }
    });

    return c.json({ success: true, link }, 201);
  } catch (err: any) {
    if (err?.code === "P2002") {
      return c.json({ error: "This subject is already linked to this curriculum." }, 409);
    }
    return c.json({ error: err.message }, 500);
  }
});

// Gỡ môn học khỏi khung chương trình
curriculumRouter.delete("/curriculums/:curriculumId/subjects/:courseId", async (c) => {
  const authResult = await requireAdmin(c);
  if (authResult.error) return authResult.error;

  const curriculumId = c.req.param("curriculumId");
  const courseId = c.req.param("courseId");

  try {
    const curr = await prisma.curriculum.findFirst({
      where: {
        OR: [
          { id: curriculumId },
          { curriculumId: curriculumId }
        ]
      }
    });
    if (!curr) return c.json({ error: "Curriculum not found" }, 404);

    await prisma.curriculumSubject.delete({
      where: {
        curriculumId_courseId: {
          curriculumId: curr.id,
          courseId
        }
      }
    });

    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

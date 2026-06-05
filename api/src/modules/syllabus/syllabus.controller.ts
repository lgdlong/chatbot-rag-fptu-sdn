import { Hono, type Context } from "hono";
import { prisma } from "../auth/services/db.service.js";
import { auth } from "../auth/auth.js";
import { Prisma } from "@prisma/client";
import { writeFile, mkdir, readdir, unlink } from "node:fs/promises";
import { join } from "node:path";
import { DocumentRepository } from "../documents/repositories/document.repository.js";
import { ENV } from "../../config/env.js";

export const syllabusRouter = new Hono();

// Helper functions for Document Management
async function removeFileIfExists(filePath: string) {
  try {
    await unlink(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}

async function removeChunkFiles(documentId: string) {
  const chunksDir = join(".", "uploads", "chunks");

  try {
    const files = await readdir(chunksDir);
    const chunkFiles = files.filter(
      (fileName) =>
        fileName.startsWith(`${documentId}_page_`) && fileName.endsWith(".pdf"),
    );

    await Promise.all(
      chunkFiles.map((fileName) =>
        removeFileIfExists(join(chunksDir, fileName)),
      ),
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}

async function requireLecturer(c: Context) {
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
    let whereClause: any = {};

    if (subjectCode) {
      whereClause.course = {
        code: {
          contains: subjectCode,
          mode: "insensitive"
        }
      };
    }

    // Nếu là sinh viên -> Chỉ cho xem syllabus Đã APPROVED + ACTIVE
    if (role === "STUDENT") {
      whereClause.isActive = true;
      whereClause.isApproved = true;
    }

    const syllabuses = await prisma.syllabus.findMany({
      where: whereClause,
      include: {
        course: {
          select: { code: true, name: true }
        }
      },
      orderBy: [
        { id: "desc" }
      ]
    });

    return c.json({ syllabuses });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
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
    const syllabus = await prisma.syllabus.findUnique({
      where: { id },
      include: {
        course: true,
        materials: true,
        clos: true,
        schedules: {
          orderBy: { session: "asc" }
        },
        questions: {
          orderBy: { sessionNo: "asc" }
        },
        assessments: true,
        references: true,
        videoLinks: true,
        documents: true
      }
    });

    if (!syllabus) return c.json({ error: "Syllabus not found" }, 404);

    // Quyền Sinh viên -> Chỉ xem được nếu Syllabus đó đã Active + Approved
    const role = session.user.role;
    if (role === "STUDENT" && (!syllabus.isActive || !syllabus.isApproved)) {
      return c.json({ error: "Forbidden: Syllabus not published yet" }, 403);
    }

    return c.json({ syllabus });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
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
    const syllabusId = typeof body.id === "number" ? body.id : null;
    const courseId = typeof body.courseId === "string" ? body.courseId : "";
    const syllabusName = typeof body.syllabusName === "string" ? body.syllabusName.trim() : "";
    const syllabusNameEnglish = typeof body.syllabusNameEnglish === "string" ? body.syllabusNameEnglish.trim() : null;
    const credits = typeof body.credits === "number" ? body.credits : 3;
    const prerequisites = typeof body.prerequisites === "string" ? body.prerequisites.trim() : null;
    const description = typeof body.description === "string" ? body.description.trim() : null;
    const studentTasks = typeof body.studentTasks === "string" ? body.studentTasks.trim() : null;
    const tools = typeof body.tools === "string" ? body.tools.trim() : null;
    const minAvgMarkToPass = typeof body.minAvgMarkToPass === "number" ? body.minAvgMarkToPass : 5.00;
    const decisionNo = typeof body.decisionNo === "string" ? body.decisionNo.trim() : null;
    const note = typeof body.note === "string" ? body.note.trim() : null;

    if (!syllabusId || !courseId || !syllabusName) {
      return c.json({ error: "Syllabus ID (number), Course ID, and Syllabus Name are required" }, 400);
    }

    // Kiểm tra Course
    const courseExists = await prisma.course.findUnique({ where: { id: courseId } });
    if (!courseExists) return c.json({ error: "Course not found" }, 404);

    // Kiểm tra trùng ID
    const idExists = await prisma.syllabus.findUnique({ where: { id: syllabusId } });
    if (idExists) return c.json({ error: "Syllabus ID already exists" }, 409);

    const syllabus = await prisma.syllabus.create({
      data: {
        id: syllabusId,
        courseId,
        syllabusName,
        syllabusNameEnglish,
        credits,
        prerequisites,
        description,
        studentTasks,
        tools,
        minAvgMarkToPass: new Prisma.Decimal(minAvgMarkToPass),
        decisionNo,
        note,
        isApproved: false, // Mặc định Draft
        isActive: false     // Mặc định Draft
      }
    });

    return c.json({ syllabus }, 201);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
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
    const syllabusName = typeof body.syllabusName === "string" ? body.syllabusName.trim() : "";
    const syllabusNameEnglish = typeof body.syllabusNameEnglish === "string" ? body.syllabusNameEnglish.trim() : undefined;
    const credits = typeof body.credits === "number" ? body.credits : undefined;
    const prerequisites = typeof body.prerequisites === "string" ? body.prerequisites.trim() : undefined;
    const description = typeof body.description === "string" ? body.description.trim() : undefined;
    const studentTasks = typeof body.studentTasks === "string" ? body.studentTasks.trim() : undefined;
    const tools = typeof body.tools === "string" ? body.tools.trim() : undefined;
    const minAvgMarkToPass = typeof body.minAvgMarkToPass === "number" ? body.minAvgMarkToPass : undefined;
    const decisionNo = typeof body.decisionNo === "string" ? body.decisionNo.trim() : undefined;
    const note = typeof body.note === "string" ? body.note.trim() : undefined;

    // Các bảng con chi tiết nhận vào
    const assessments = body.assessments || [];
    const clos = body.clos || [];
    const schedules = body.schedules || [];
    const questions = body.questions || [];
    const materials = body.materials || [];
    const references = body.references || [];
    const videoLinks = body.videoLinks || [];

    // [VALIDATION] BR-05 & EC-28: Tổng weight của Assessment Scheme phải bằng 100%
    if (assessments.length > 0) {
      let totalWeight = 0;
      for (const item of assessments) {
        const w = parseFloat(String(item.weight));
        if (!isNaN(w)) {
          totalWeight += w;
        }
      }
      // Dùng epsilon nhỏ để chống sai số float
      if (Math.abs(totalWeight - 100.00) > 0.01) {
        return c.json({ error: `Tổng trọng số đánh giá phải bằng đúng 100%. Hiện tại: ${totalWeight.toFixed(2)}%` }, 400);
      }
    }

    const syllabusExists = await prisma.syllabus.findUnique({ where: { id } });
    if (!syllabusExists) return c.json({ error: "Syllabus not found" }, 404);

    // Chạy transaction để cập nhật đồng bộ toàn bộ Syllabus và 7 bảng con
    const result = await prisma.$transaction(async (tx) => {
      // 1. Cập nhật metadata chính
      const updatedSyl = await tx.syllabus.update({
        where: { id },
        data: {
          syllabusName,
          syllabusNameEnglish,
          credits,
          prerequisites,
          description,
          studentTasks,
          tools,
          minAvgMarkToPass: minAvgMarkToPass !== undefined ? new Prisma.Decimal(minAvgMarkToPass) : undefined,
          decisionNo,
          note
        }
      });

      // 2. Cập nhật Materials
      if (body.materials) {
        await tx.syllabusMaterial.deleteMany({ where: { syllabusId: id } });
        for (const m of materials) {
          await tx.syllabusMaterial.create({
            data: {
              syllabusId: id,
              description: m.description,
              author: m.author,
              publisher: m.publisher,
              publishedDate: m.publishedDate,
              edition: m.edition,
              isbn: m.isbn,
              isMainMaterial: m.isMainMaterial,
              isHardCopy: m.isHardCopy,
              isOnline: m.isOnline,
              note: m.note
            }
          });
        }
      }

      // 3. Cập nhật CLOs
      if (body.clos) {
        await tx.syllabusClo.deleteMany({ where: { syllabusId: id } });
        for (const clo of clos) {
          await tx.syllabusClo.create({
            data: {
              syllabusId: id,
              cloName: clo.cloName,
              cloDetails: clo.cloDetails,
              loDetails: clo.loDetails
            }
          });
        }
      }

      // 4. Cập nhật Weekly Schedules
      if (body.schedules) {
        await tx.syllabusSchedule.deleteMany({ where: { syllabusId: id } });
        for (const s of schedules) {
          await tx.syllabusSchedule.create({
            data: {
              syllabusId: id,
              session: s.session,
              topic: s.topic,
              learningMethod: s.learningMethod,
              lo: s.lo,
              itu: s.itu,
              studentMaterials: s.studentMaterials,
              sDownload: s.sDownload,
              studentTasks: s.studentTasks,
              urls: s.urls
            }
          });
        }
      }

      // 5. Cập nhật Edunext Constructive Questions
      if (body.questions) {
        await tx.constructiveQuestion.deleteMany({ where: { syllabusId: id } });
        for (const q of questions) {
          await tx.constructiveQuestion.create({
            data: {
              syllabusId: id,
              sessionNo: q.sessionNo,
              name: q.name,
              details: q.details
            }
          });
        }
      }

      // 6. Cập nhật Assessment Schemes
      if (body.assessments) {
        await tx.assessmentScheme.deleteMany({ where: { syllabusId: id } });
        for (const a of assessments) {
          await tx.assessmentScheme.create({
            data: {
              syllabusId: id,
              category: a.category,
              type: a.type,
              part: a.part,
              weight: new Prisma.Decimal(parseFloat(String(a.weight))),
              completionCriteria: a.completionCriteria,
              duration: a.duration,
              clo: a.clo,
              questionType: a.questionType,
              noQuestion: a.noQuestion,
              knowledgeAndSkill: a.knowledgeAndSkill,
              gradingGuide: a.gradingGuide,
              note: a.note
            }
          });
        }
      }

      // 7. Cập nhật References
      if (body.references) {
        await tx.syllabusReference.deleteMany({ where: { syllabusId: id } });
        for (const ref of references) {
          await tx.syllabusReference.create({
            data: {
              syllabusId: id,
              citation: ref.citation
            }
          });
        }
      }

      // 8. Cập nhật Video links
      if (body.videoLinks) {
        await tx.videoLink.deleteMany({ where: { syllabusId: id } });
        for (const v of videoLinks) {
          await tx.videoLink.create({
            data: {
              syllabusId: id,
              url: v.url,
              title: v.title,
              description: v.description
            }
          });
        }
      }

      return updatedSyl;
    });

    return c.json({ success: true, syllabus: result });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
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
    const exists = await prisma.syllabus.findUnique({ where: { id } });
    if (!exists) return c.json({ error: "Syllabus not found" }, 404);

    const syllabus = await prisma.syllabus.update({
      where: { id },
      data: { isApproved: true }
    });

    return c.json({ success: true, syllabus });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
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
    const syllabus = await prisma.syllabus.findUnique({
      where: { id },
      select: { id: true, isApproved: true, courseId: true }
    });

    if (!syllabus) return c.json({ error: "Syllabus not found" }, 404);

    // [VALIDATION] BR-09 & EC-25: Chỉ cho phép active khi isApproved = true!
    if (!syllabus.isApproved) {
      return c.json({ error: "Syllabus must be approved (is_approved=True) before activation." }, 400);
    }

    // Chạy transaction để kích hoạt bản mới và deactivate tất cả bản cũ cùng môn học (courseId)
    const result = await prisma.$transaction(async (tx) => {
      // 1. Deactivate toàn bộ bản ghi cũ của môn học đó
      await tx.syllabus.updateMany({
        where: {
          courseId: syllabus.courseId,
          id: { not: id }
        },
        data: { isActive: false }
      });

      // 2. Kích hoạt bản ghi hiện tại
      const activatedSyl = await tx.syllabus.update({
        where: { id },
        data: { isActive: true }
      });

      return activatedSyl;
    });

    return c.json({ success: true, syllabus: result });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ==========================================
// 7. API XÓA SYLLABUS (DELETE)
// ==========================================
// FR-02.6: Xóa vật lý (hard delete) khỏi database
syllabusRouter.delete("/:id", async (c) => {
  const authResult = await requireLecturer(c);
  if (authResult.error) return authResult.error;

  const id = parseInt(c.req.param("id"));
  if (isNaN(id)) return c.json({ error: "Invalid Syllabus ID" }, 400);

  try {
    const exists = await prisma.syllabus.findUnique({ where: { id } });
    if (!exists) return c.json({ error: "Syllabus not found" }, 404);

    await prisma.syllabus.delete({ where: { id } });
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ==========================================
// 8. API QUẢN LÝ TÀI LIỆU CỦA SYLLABUS
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
    const documents = await DocumentRepository.findManyBySyllabus(syllabusId);
    return c.json({ documents });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch documents";
    return c.json({ error: message }, 500);
  }
});

// POST /:syllabusId/documents (Upload & Index tài liệu)
syllabusRouter.post("/:syllabusId/documents", async (c) => {
  const authResult = await requireLecturer(c);
  if (authResult.error) return authResult.error;

  const syllabusId = parseInt(c.req.param("syllabusId"));
  if (isNaN(syllabusId)) return c.json({ error: "Invalid Syllabus ID" }, 400);

  const syllabus = await prisma.syllabus.findUnique({
    where: { id: syllabusId },
    include: { course: true }
  });
  if (!syllabus) return c.json({ error: "Syllabus not found" }, 404);

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
      error: "Unsupported file format. Please export your slide or document to PDF format before uploading." 
    }, 400);
  }

  // Edge case: Kiểm tra tổng số lượng file của môn học (Course/Subject) <= 10 file
  const existingDocsCount = await prisma.document.count({
    where: {
      syllabus: {
        courseId: syllabus.courseId
      }
    }
  });

  if (existingDocsCount >= 10) {
    return c.json({ error: "Giới hạn upload tối đa 10 tài liệu cho mỗi môn học đã bị vượt quá." }, 400);
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Lưu file vào disk
  const fileName = `${Date.now()}_${file.name}`;
  const fileDir = "./uploads";
  await mkdir(fileDir, { recursive: true });

  const filePath = `/uploads/${fileName}`;
  await writeFile(`.${filePath}`, buffer);

  const doc = await DocumentRepository.create({
    name: file.name,
    fileUrl: filePath,
    fileType: "pdf",
    status: "PENDING",
    syllabus: { connect: { id: syllabusId } },
  });

  // Start background non-blocking ingestion task calling AnythingLLM API
  Promise.resolve().then(async () => {
    try {
      // Workspace slug isolated per syllabus version
      const workspaceSlug = `${syllabus.course.code.toLowerCase()}_${syllabusId}`;

      // 1. Auto-create workspace in AnythingLLM (check if exists first)
      console.log(`[Ingestion] Ensuring AnythingLLM workspace exists for: "${workspaceSlug}"`);
      try {
        const listResponse = await fetch(`${ENV.ANYTHING_LLM_URL}/api/v1/workspaces`, {
          headers: {
            "Authorization": `Bearer ${ENV.ANYTHING_LLM_API_KEY}`
          }
        });
        let exists = false;
        if (listResponse.ok) {
          const listResult = await listResponse.json();
          const workspaces = listResult.workspaces || [];
          exists = workspaces.some((ws: any) => ws.slug === workspaceSlug);
        }

        if (!exists) {
          console.log(`[Ingestion] Workspace "${workspaceSlug}" not found. Creating workspace...`);
          const createResponse = await fetch(`${ENV.ANYTHING_LLM_URL}/api/v1/workspace/new`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${ENV.ANYTHING_LLM_API_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ name: workspaceSlug })
          });
          if (!createResponse.ok) {
            const errorText = await createResponse.text().catch(() => "N/A");
            console.warn(`[Ingestion] Workspace creation failed: ${createResponse.status}. Detail: ${errorText}`);
          } else {
            console.log(`[Ingestion] Successfully created AnythingLLM workspace "${workspaceSlug}"`);
          }
        } else {
          console.log(`[Ingestion] Workspace "${workspaceSlug}" already exists. Skipping creation.`);
        }
      } catch (wsError) {
        console.warn("[Ingestion] Failed to verify/create workspace in AnythingLLM:", wsError);
      }

      // 2. Upload document file to AnythingLLM
      console.log(`[Ingestion] Uploading file "${file.name}" to AnythingLLM...`);
      const formData = new FormData();
      const fileBlob = new Blob([buffer], { type: "application/pdf" });
      formData.append("file", fileBlob, file.name);

      const uploadResponse = await fetch(`${ENV.ANYTHING_LLM_URL}/api/v1/document/upload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${ENV.ANYTHING_LLM_API_KEY}`
        },
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error(`AnythingLLM file upload failed with status ${uploadResponse.status}`);
      }

      const uploadResult = await uploadResponse.json();
      const docLocation = uploadResult.documents?.[0]?.location;
      if (!docLocation) {
        throw new Error("AnythingLLM upload did not return a valid document location");
      }

      // 3. Embed document into workspace
      console.log(`[Ingestion] Embedding document into AnythingLLM workspace "${workspaceSlug}"...`);
      const updateResponse = await fetch(`${ENV.ANYTHING_LLM_URL}/api/v1/workspace/${workspaceSlug}/update-embeddings`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${ENV.ANYTHING_LLM_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          adds: [docLocation]
        })
      });

      if (!updateResponse.ok) {
        throw new Error(`AnythingLLM workspace update failed with status ${updateResponse.status}`);
      }

      // 4. Update database status to COMPLETED
      await prisma.document.update({
        where: { id: doc.id },
        data: { status: "COMPLETED" }
      });
      console.log(`[Ingestion] Document "${doc.name}" successfully embedded and marked COMPLETED!`);
    } catch (error) {
      console.error(`[Ingestion] Failed to ingest document "${doc.name}":`, error);
      // Update database status to FAILED
      await prisma.document.update({
        where: { id: doc.id },
        data: { status: "FAILED" }
      }).catch((dbErr) => {
        console.error("[Ingestion] Failed to mark document status as FAILED in DB:", dbErr);
      });
    }
  });

  return c.json({
    success: true,
    document: {
      id: doc.id,
      name: doc.name,
      status: "PROCESSING",
    },
  });
});

// DELETE /:syllabusId/documents/:documentId
syllabusRouter.delete("/:syllabusId/documents/:documentId", async (c) => {
  const authResult = await requireLecturer(c);
  if (authResult.error) return authResult.error;

  const syllabusId = parseInt(c.req.param("syllabusId"));
  const documentId = c.req.param("documentId");
  if (isNaN(syllabusId)) return c.json({ error: "Invalid Syllabus ID" }, 400);

  const syllabus = await prisma.syllabus.findUnique({
    where: { id: syllabusId },
    include: { course: true }
  });
  if (!syllabus) return c.json({ error: "Syllabus not found" }, 404);

  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      syllabusId,
    }
  });

  if (!document) {
    return c.json({ success: true });
  }

  if (document.status === "PENDING" || document.status === "PROCESSING") {
    return c.json(
      { error: "Document is still processing and cannot be deleted" },
      409,
    );
  }

  try {
    const originalFilePath = join(".", document.fileUrl.replace(/^\/+/, ""));
    await removeFileIfExists(originalFilePath);
    await removeChunkFiles(documentId);
    await DocumentRepository.delete(documentId);

    // Sync delete with AnythingLLM
    try {
      const fileName = document.fileUrl.split("/").pop();
      const anythingLLMLocation = `custom-documents/${fileName}`;
      const workspaceSlug = `${syllabus.course.code.toLowerCase()}_${syllabusId}`;

      // 1. Remove from workspace
      console.log(`[Deletion] Syncing Document Deletion: Removing "${anythingLLMLocation}" from AnythingLLM workspace "${workspaceSlug}"...`);
      await fetch(`${ENV.ANYTHING_LLM_URL}/api/v1/workspace/${workspaceSlug}/update-embeddings`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${ENV.ANYTHING_LLM_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          deletes: [anythingLLMLocation]
        })
      });

      // 2. Remove from system completely
      console.log(`[Deletion] Syncing Document Deletion: Purging "${anythingLLMLocation}" from AnythingLLM system...`);
      await fetch(`${ENV.ANYTHING_LLM_URL}/api/v1/system/remove-documents`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${ENV.ANYTHING_LLM_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          names: [anythingLLMLocation]
        })
      });
    } catch (llmError) {
      console.error("[Deletion] Failed to sync document deletion with AnythingLLM:", llmError);
    }

    return c.json({ success: true });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return c.json({ success: true });
    }

    console.error("[SyllabusController] Failed to delete document:", error);
    return c.json({ error: "Failed to delete document" }, 500);
  }
});

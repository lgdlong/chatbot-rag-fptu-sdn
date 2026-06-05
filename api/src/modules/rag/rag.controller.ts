import { Hono, type Context } from "hono";
import { writeFile, mkdir, readdir, unlink } from "node:fs/promises";
import { join } from "node:path";
import { DocumentRepository } from "../documents/repositories/document.repository.js";
import { auth } from "../auth/auth.js";
import { prisma } from "../auth/services/db.service.js";
import { ENV } from "../../config/env.js";

export const ragRouter = new Hono();

type CourseListItem = {
  id: string;
  code: string;
  name: string;
  createdAt: Date;
  documentCount: number;
};

function isLecturerOrAdmin(role: string | null | undefined) {
  return role === "LECTURER" || role === "ADMIN";
}

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

async function requireLecturerOrAdmin(c: Context) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    return { error: c.json({ error: "Unauthorized" }, 401) as Response, session: null };
  }

  if (!isLecturerOrAdmin(session.user.role)) {
    return { error: c.json({ error: "Forbidden: Lecturer access required" }, 403) as Response, session: null };
  }

  return { error: null, session };
}

ragRouter.get("/", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const courses = await prisma.course.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        syllabuses: {
          include: {
            _count: {
              select: { documents: true }
            }
          }
        }
      },
    });

    const payload = courses.map((course) => {
      const documentCount = course.syllabuses.reduce((acc, syl) => acc + syl._count.documents, 0);
      return {
        id: course.id,
        code: course.code,
        name: course.name,
        createdAt: course.createdAt,
        documentCount,
      };
    }) satisfies CourseListItem[];

    return c.json({ courses: payload });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch courses";
    return c.json({ error: message }, 500);
  }
});

ragRouter.post("/", async (c) => {
  const authResult = await requireLecturerOrAdmin(c);
  if (authResult.error) {
    return authResult.error;
  }

  try {
    const body = (await c.req.json().catch(() => ({}))) as { code?: unknown; name?: unknown };
    const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!code || !name) {
      return c.json({ error: "Course code and name are required" }, 400);
    }

    const duplicateCourse = await prisma.course.findFirst({
      where: {
        code: {
          equals: code,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });

    if (duplicateCourse) {
      return c.json({ error: "Course code already exists" }, 409);
    }

    const course = await prisma.course.create({
      data: {
        code,
        name,
      },
    });

    // NOTE: AnythingLLM workspaces are now isolated per Syllabus version: {subject_code}_{syllabus_id}.
    // Hence, no workspace is created upon Course creation itself. Workspaces are created when Syllabuses are created/documents uploaded.

    return c.json(
      {
        course: {
          id: course.id,
          code: course.code,
          name: course.name,
          createdAt: course.createdAt,
          documentCount: 0,
        },
      },
      201,
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create course";
    return c.json({ error: message }, 500);
  }
});

ragRouter.patch("/:courseId", async (c) => {
  const authResult = await requireLecturerOrAdmin(c);
  if (authResult.error) {
    return authResult.error;
  }

  const courseId = c.req.param("courseId");

  try {
    const body = (await c.req.json().catch(() => ({}))) as { code?: unknown; name?: unknown };
    const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!code || !name) {
      return c.json({ error: "Course code and name are required" }, 400);
    }

    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, code: true, syllabuses: { select: { id: true } } },
    });

    if (!existingCourse) {
      return c.json({ error: "Course not found" }, 404);
    }

    const oldCode = existingCourse.code;

    const duplicateCourse = await prisma.course.findFirst({
      where: {
        code: {
          equals: code,
          mode: "insensitive",
        },
        NOT: {
          id: courseId,
        },
      },
      select: { id: true },
    });

    if (duplicateCourse) {
      return c.json({ error: "Course code already exists" }, 409);
    }

    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        code,
        name,
      },
      include: {
        syllabuses: {
          include: {
            _count: {
              select: { documents: true }
            }
          }
        }
      },
    });

    // Sync rename workspaces with AnythingLLM if code changed for all existing syllabuses
    const codeChanged = oldCode.toUpperCase() !== code.toUpperCase();
    if (codeChanged) {
      for (const syllabus of existingCourse.syllabuses) {
        const oldSlug = `${oldCode.toLowerCase()}_${syllabus.id}`;
        const newSlug = `${code.toLowerCase()}_${syllabus.id}`;
        const newName = `${code.toUpperCase()}_${syllabus.id}`;

        try {
          console.log(`[Update] Syncing Course Code Change: Renaming AnythingLLM workspace "${oldSlug}" to slug "${newSlug}"...`);
          const response = await fetch(`${ENV.ANYTHING_LLM_URL}/api/v1/workspace/${oldSlug}/update`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${ENV.ANYTHING_LLM_API_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              name: newName,
              slug: newSlug
            })
          });

          if (!response.ok) {
            const errorBody = await response.text().catch(() => "N/A");
            console.warn(`[Update] Failed to rename workspace ${oldSlug}: ${response.status} ${response.statusText}. Detail: ${errorBody}`);
          } else {
            console.log(`[Update] Successfully renamed AnythingLLM workspace to slug "${newSlug}"`);
          }
        } catch (wsError) {
          console.error(`[Update] Failed to sync workspace renaming for syllabus ${syllabus.id}:`, wsError);
        }
      }
    }

    const totalDocs = updatedCourse.syllabuses.reduce((acc, syl) => acc + syl._count.documents, 0);

    return c.json({
      course: {
        id: updatedCourse.id,
        code: updatedCourse.code,
        name: updatedCourse.name,
        createdAt: updatedCourse.createdAt,
        documentCount: totalDocs,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update course";
    return c.json({ error: message }, 500);
  }
});

ragRouter.delete("/:courseId", async (c) => {
  const authResult = await requireLecturerOrAdmin(c);
  if (authResult.error) {
    return authResult.error;
  }

  const courseId = c.req.param("courseId");

  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        code: true,
        name: true,
        syllabuses: {
          select: {
            id: true,
            _count: {
              select: { documents: true }
            }
          }
        }
      },
    });

    if (!course) {
      return c.json({ error: "Course not found" }, 404);
    }

    const totalDocs = course.syllabuses.reduce((acc, syl) => acc + syl._count.documents, 0);
    if (totalDocs > 0) {
      return c.json(
        {
          error: "Course still has documents within its syllabuses. Delete all documents before removing the course.",
        },
        409,
      );
    }

    // Sync delete workspaces with AnythingLLM for all syllabuses of this course
    for (const syllabus of course.syllabuses) {
      const workspaceSlug = `${course.code.toLowerCase()}_${syllabus.id}`;
      try {
        console.log(`[Deletion] Syncing Course Deletion: Purging AnythingLLM workspace "${workspaceSlug}"...`);
        await fetch(`${ENV.ANYTHING_LLM_URL}/api/v1/workspace/${workspaceSlug}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${ENV.ANYTHING_LLM_API_KEY}`
          }
        });
      } catch (wsError) {
        console.error(`[Deletion] Failed to delete AnythingLLM workspace "${workspaceSlug}":`, wsError);
      }
    }

    await prisma.course.delete({
      where: { id: courseId },
    });

    return c.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete course";
    return c.json({ error: message }, 500);
  }
});

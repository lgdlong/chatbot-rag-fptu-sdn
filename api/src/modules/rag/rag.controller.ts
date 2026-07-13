import { Hono, type Context } from "hono";
import { auth } from "../auth/auth.js";
import {
  CourseService,
  ValidationError,
} from "../courses/services/course.service.js";

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

async function requireLecturerOrAdmin(c: Context) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    return {
      error: c.json({ error: "Unauthorized" }, 401) as Response,
      session: null,
    };
  }

  if (!isLecturerOrAdmin(session.user.role)) {
    return {
      error: c.json(
        { error: "Forbidden: Lecturer access required" },
        403,
      ) as Response,
      session: null,
    };
  }

  return { error: null, session };
}

/**
 * Map a thrown error from the service layer to the controller's JSON
 * envelope. `ValidationError` carries the status code that the service
 * intended (400/404/409) so the response shape stays identical to the
 * pre-refactor controller. Anything else falls through to 500 with the
 * underlying message.
 */
function respondWithServiceError(c: Context, err: unknown, fallbackMessage: string) {
  if (err instanceof ValidationError) {
    return c.json({ error: err.message }, err.statusCode as 400 | 404 | 409);
  }
  const message = err instanceof Error ? err.message : fallbackMessage;
  return c.json({ error: message }, 500);
}

ragRouter.get("/", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const payload: CourseListItem[] = await CourseService.listWithDocumentCount();
    return c.json({ courses: payload });
  } catch (err: unknown) {
    return respondWithServiceError(c, err, "Failed to fetch courses");
  }
});

ragRouter.post("/", async (c) => {
  const authResult = await requireLecturerOrAdmin(c);
  if (authResult.error) {
    return authResult.error;
  }

  try {
    const body = (await c.req.json().catch(() => ({}))) as {
      code?: unknown;
      name?: unknown;
    };
    const code = typeof body.code === "string" ? body.code : "";
    const name = typeof body.name === "string" ? body.name : "";

    const course = await CourseService.create(code, name);
    return c.json({ course }, 201);
  } catch (err: unknown) {
    return respondWithServiceError(c, err, "Failed to create course");
  }
});

ragRouter.patch("/:courseId", async (c) => {
  const authResult = await requireLecturerOrAdmin(c);
  if (authResult.error) {
    return authResult.error;
  }

  const courseId = c.req.param("courseId");

  try {
    const body = (await c.req.json().catch(() => ({}))) as {
      code?: unknown;
      name?: unknown;
    };
    const code = typeof body.code === "string" ? body.code : "";
    const name = typeof body.name === "string" ? body.name : "";

    const course = await CourseService.update(courseId, code, name);
    return c.json({ course });
  } catch (err: unknown) {
    return respondWithServiceError(c, err, "Failed to update course");
  }
});

ragRouter.delete("/:courseId", async (c) => {
  const authResult = await requireLecturerOrAdmin(c);
  if (authResult.error) {
    return authResult.error;
  }

  const courseId = c.req.param("courseId");

  try {
    await CourseService.delete(courseId);
    return c.json({ success: true });
  } catch (err: unknown) {
    return respondWithServiceError(c, err, "Failed to delete course");
  }
});

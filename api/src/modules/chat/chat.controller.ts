import { Hono } from "hono";
import type { Context } from "hono";
import { streamSSE } from "hono/streaming";
import { auth } from "../auth/auth.js";
import { ChatService, ChatServiceError } from "./services/chat.service.js";

export const chatRouter = new Hono();

type CreateChatSessionPayload = {
  scopeMode?: "ALL_COURSES" | "SELECTED_COURSES" | "SELECTED_DOCUMENTS";
  courseIds?: string[];
  courseId?: string | null;
  documentIds?: string[];
};

type AuthedSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

type ChatSessionCourseRelation = {
  course?: {
    id: string;
    code: string;
    name: string;
  } | null;
};

type ChatSessionDocumentRelation = {
  document?: {
    id: string;
    name: string;
    fileType: string;
    status: string;
    syllabusId: number;
    syllabus: {
      courseId: string;
      course: {
        id: string;
        code: string;
        name: string;
      };
    };
  } | null;
};

function isValidString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isScopeMode(value: unknown): value is "ALL_COURSES" | "SELECTED_COURSES" | "SELECTED_DOCUMENTS" {
  return value === "ALL_COURSES" || value === "SELECTED_COURSES" || value === "SELECTED_DOCUMENTS";
}

function normalizeIds(values: unknown) {
  if (!Array.isArray(values)) {
    return [];
  }

  return Array.from(
    new Set(
      values.filter((value): value is string => typeof value === "string" && value.trim().length > 0),
    ),
  );
}

function resolveCreateSessionPayload(body: CreateChatSessionPayload) {
  const legacyCourseId = isValidString(body.courseId) ? body.courseId.trim() : null;
  const requestedCourseIds = normalizeIds(body.courseIds);
  const requestedDocumentIds = normalizeIds(body.documentIds);
  const scopeMode = isScopeMode(body.scopeMode)
    ? body.scopeMode
    : requestedDocumentIds.length > 0
      ? "SELECTED_DOCUMENTS"
      : (requestedCourseIds.length > 0 || legacyCourseId ? "SELECTED_COURSES" : "ALL_COURSES");
  const courseIds = scopeMode === "SELECTED_COURSES"
    ? Array.from(new Set([...requestedCourseIds, ...(legacyCourseId ? [legacyCourseId] : [])]))
    : [];
  const documentIds = scopeMode === "SELECTED_DOCUMENTS"
    ? requestedDocumentIds
    : [];

  return {
    scopeMode,
    courseIds,
    documentIds,
    legacyCourseId:
      scopeMode === "SELECTED_COURSES"
        ? courseIds.length === 1
          ? courseIds[0]
          : null
        : null,
  } as const;
}

function mapScopedCoursesForClient(scopedCourses: ChatSessionCourseRelation[]) {
  return scopedCourses
    .map((item) => item.course)
    .filter((course): course is { id: string; code: string; name: string } => Boolean(course));
}

function mapScopedDocumentsForClient(scopedDocuments: ChatSessionDocumentRelation[]) {
  return scopedDocuments
    .map((item) => item.document)
    .filter((document): document is NonNullable<ChatSessionDocumentRelation["document"]> => Boolean(document));
}

function mapSessionForClient<T extends {
  scopedCourses?: ChatSessionCourseRelation[];
  scopedDocuments?: ChatSessionDocumentRelation[];
}>(session: T) {
  return {
    ...session,
    scopedCourses: mapScopedCoursesForClient(session.scopedCourses ?? []),
    scopedDocuments: mapScopedDocumentsForClient(session.scopedDocuments ?? []),
  };
}

/**
 * Centralized error mapper -- turns a thrown ChatServiceError into a
 * JSON response with the right HTTP status, and falls through to a 500
 * for anything else. The `as any` cast on the status matches the
 * project convention (Hono's c.json second arg is `ContentfulStatusCode`,
 * a literal union).
 */
function respondWithChatServiceError(c: any, err: unknown) {
  if (err instanceof ChatServiceError) {
    return c.json({ error: err.message }, err.status as any);
  }
  const message = err instanceof Error ? err.message : "Internal server error";
  console.error("[ChatController Error]:", err);
  return c.json({ error: message }, 500);
}

async function requireAuthSession(c: Context) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    return { session: null, response: c.json({ error: "Unauthorized" }, 401) };
  }
  return { session: session as AuthedSession, response: null };
}

chatRouter.post("/dev-login", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const role = typeof body?.role === "string" ? body.role : "student";
    const { setCookie, user, token } = await ChatService.devLogin(role);
    c.header("Set-Cookie", setCookie);
    return c.json({ success: true, user, token });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Authentication failed";
    console.error("Dev login failed:", err);
    return c.json({ success: false, error: message }, 500);
  }
});

chatRouter.get("/courses", async (c) => {
  const { session, response } = await requireAuthSession(c);
  if (response) return response;

  try {
    const courses = await ChatService.listCourses();
    return c.json({ courses });
  } catch (err: unknown) {
    return respondWithChatServiceError(c, err);
  }
});

chatRouter.get("/courses/:courseId/documents", async (c) => {
  const { session, response } = await requireAuthSession(c);
  if (response) return response;

  const courseId = c.req.param("courseId");
  try {
    const documents = await ChatService.listCourseDocuments(courseId);
    return c.json({ documents });
  } catch (err: unknown) {
    return respondWithChatServiceError(c, err);
  }
});

chatRouter.get("/document-catalog", async (c) => {
  const { session, response } = await requireAuthSession(c);
  if (response) return response;

  try {
    const catalog = await ChatService.getDocumentCatalog(session.user.id);
    return c.json(catalog);
  } catch (err: unknown) {
    return respondWithChatServiceError(c, err);
  }
});

chatRouter.get("/sessions", async (c) => {
  const { session, response } = await requireAuthSession(c);
  if (response) return response;

  try {
    const chatSessions = await ChatService.getUserSessions(session.user.id);
    return c.json({
      sessions: chatSessions.map((chatSession) => mapSessionForClient(chatSession)),
    });
  } catch (err: unknown) {
    return respondWithChatServiceError(c, err);
  }
});

chatRouter.post("/sessions", async (c) => {
  const { session, response } = await requireAuthSession(c);
  if (response) return response;

  try {
    const body = (await c.req.json().catch(() => ({}))) as CreateChatSessionPayload;
    const resolvedPayload = resolveCreateSessionPayload(body);

    const chatSession = await ChatService.createSession({
      userId: session.user.id,
      scopeMode: resolvedPayload.scopeMode,
      courseIds: resolvedPayload.courseIds,
      documentIds: resolvedPayload.documentIds,
      courseId: resolvedPayload.legacyCourseId,
    });

    return c.json({ session: chatSession });
  } catch (err: unknown) {
    return respondWithChatServiceError(c, err);
  }
});

chatRouter.get("/sessions/:sessionId", async (c) => {
  const { session, response } = await requireAuthSession(c);
  if (response) return response;

  const sessionId = c.req.param("sessionId");
  try {
    const fullSession = await ChatService.getSession(sessionId, session.user.id);
    return c.json({
      session: {
        ...mapSessionForClient(fullSession),
        messages: fullSession.messages,
      },
    });
  } catch (err: unknown) {
    return respondWithChatServiceError(c, err);
  }
});

chatRouter.patch("/sessions/:sessionId", async (c) => {
  const { session, response } = await requireAuthSession(c);
  if (response) return response;

  const sessionId = c.req.param("sessionId");
  try {
    const body = await c.req.json().catch(() => ({}));
    const title = isValidString(body?.title) ? body.title : "";

    const updated = await ChatService.updateSessionTitle({
      sessionId,
      userId: session.user.id,
      title,
    });
    return c.json({ success: true, session: updated });
  } catch (err: unknown) {
    return respondWithChatServiceError(c, err);
  }
});

chatRouter.delete("/sessions/:sessionId", async (c) => {
  const { session, response } = await requireAuthSession(c);
  if (response) return response;

  const sessionId = c.req.param("sessionId");
  try {
    await ChatService.deleteSession(sessionId, session.user.id);
    return c.json({ success: true });
  } catch (err: unknown) {
    return respondWithChatServiceError(c, err);
  }
});

chatRouter.post("/send", async (c) => {
  const { session, response } = await requireAuthSession(c);
  if (response) return response;

  const body = await c.req.json().catch(() => ({}));
  const sessionId = isValidString(body?.sessionId) ? body.sessionId : null;
  const message = isValidString(body?.message) ? body.message.trim() : "";

  if (!sessionId || !message) {
    return c.json({ error: "sessionId and message are required" }, 400);
  }

  return streamSSE(c, async (stream) => {
    try {
      const result = await ChatService.sendMessage(
        { sessionId, message, userId: session.user.id },
        [],
        async (chunk) => {
          await stream.writeSSE({
            data: JSON.stringify({ chunk }),
            event: "message",
          });
        },
      );

      await stream.writeSSE({
        data: JSON.stringify({ citations: result.citations }),
        event: "citations",
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Lỗi xử lý AI RAG";
      console.error("[Chat Stream Error]:", err);
      await stream.writeSSE({
        data: JSON.stringify({ error: errorMessage }),
        event: "error",
      });
    }
  });
});

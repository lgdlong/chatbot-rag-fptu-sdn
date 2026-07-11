import crypto from "node:crypto";
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { auth } from "../auth/auth.js";
import { prisma } from "../auth/services/db.service.js";
import { RagService } from "../rag/services/rag.service.js";
import { ENV } from "../../config/env.js";
import { DEV_LOGIN_ACCOUNTS } from "../../config/dev-login.js";
import { GoogleGenAI } from "@google/genai";
import { Prisma } from "@prisma/client";
import { ChatRepository } from "./repositories/chat.repository.js";
import {
  buildChatScopeLabel,
  resolveAccessibleChatDocuments,
  resolveAccessibleChatCourseIds,
  resolveAccessibleChatDocumentIds,
  resolveChatScope,
} from "./services/chat-scope.service.js";

export const chatRouter = new Hono();

type CreateChatSessionPayload = {
  scopeMode?: "ALL_COURSES" | "SELECTED_COURSES" | "SELECTED_DOCUMENTS";
  courseIds?: string[];
  courseId?: string | null;
  documentIds?: string[];
};

type DocumentCatalogDocument = {
  id: string;
  name: string;
  fileType: string;
  status: string;
  createdAt: Date;
  selectable: boolean;
};

type DocumentCatalogGroup = {
  course: {
    id: string;
    code: string;
    name: string;
  };
  documents: DocumentCatalogDocument[];
};

type ChatHistoryItem = {
  sender: "USER" | "ASSISTANT";
  content: string;
  citations?: unknown;
  createdAt: Date;
};

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

function mapMessagesForClient(messages: Array<ChatHistoryItem & { id: string; sessionId: string }>) {
  return messages.map((message) => ({
    ...message,
    citations: message.citations,
  }));
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
  scopeLabel?: string;
  scopeSummary?: string;
}>(session: T) {
  return {
    ...session,
    scopedCourses: mapScopedCoursesForClient(session.scopedCourses ?? []),
    scopedDocuments: mapScopedDocumentsForClient(session.scopedDocuments ?? []),
  };
}

async function persistAssistantMessage(
  sessionId: string,
  content: string,
  citations: unknown[] = [],
) {
  await ChatRepository.createMessage({
    session: { connect: { id: sessionId } },
    sender: "ASSISTANT",
    content,
    citations: citations as Prisma.InputJsonValue,
  });
}



chatRouter.post("/dev-login", async (c) => {
  try {
    const { role } = await c.req.json().catch(() => ({ role: "student" }));
    const account = DEV_LOGIN_ACCOUNTS[role] ?? DEV_LOGIN_ACCOUNTS.student;

    const user = await prisma.user.upsert({
      where: { email: account.email },
      update: { role: account.role },
      create: {
        id: account.userId,
        name: account.name,
        email: account.email,
        role: account.role,
      },
    });

    const existingAccount = await prisma.account.findFirst({
      where: { userId: user.id },
    });

    if (!existingAccount) {
      await prisma.account.create({
        data: {
          id: account.accountId,
          accountId: user.id,
          providerId: "credential",
          userId: user.id,
          password: account.passwordHash,
        },
      });
    } else {
      await prisma.account.update({
        where: { id: existingAccount.id },
        data: { password: account.passwordHash },
      });
    }

    const signInReq = new Request(`${ENV.BETTER_AUTH_URL}/api/auth/sign-in/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: account.email,
        password: account.password,
      }),
    });

    const authRes = await auth.handler(signInReq);
    const setCookie = authRes.headers.get("set-cookie");

    if (!setCookie) {
      throw new Error("Failed to obtain session cookie from auth handler");
    }

    c.header("Set-Cookie", setCookie);

    const responseBody = await authRes.json();

    return c.json({
      success: true,
      user: responseBody.user,
      token: responseBody.token,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Authentication failed";
    console.error("Dev login failed:", err);
    return c.json({ success: false, error: message }, 500);
  }
});

chatRouter.get("/courses", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const courses = await prisma.course.findMany({
      orderBy: { createdAt: "desc" },
    });
    return c.json({ courses });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch courses";
    return c.json({ error: message }, 500);
  }
});

chatRouter.get("/courses/:courseId/documents", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const courseId = c.req.param("courseId");
  try {
    const documents = await prisma.document.findMany({
      where: {
        syllabus: {
          courseId
        }
      },
      orderBy: { createdAt: "desc" },
    });
    return c.json({ documents });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch documents";
    return c.json({ error: message }, 500);
  }
});

chatRouter.get("/document-catalog", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const documents = await resolveAccessibleChatDocuments(session.user.id);
    const grouped = new Map<string, DocumentCatalogGroup>();

    for (const document of documents) {
      const courseId = document.syllabus.course.id;
      const existingGroup = grouped.get(courseId);
      const catalogDocument: DocumentCatalogDocument = {
        id: document.id,
        name: document.name,
        fileType: document.fileType,
        status: document.status,
        createdAt: document.createdAt,
        selectable: document.status === "COMPLETED",
      };

      if (!existingGroup) {
        grouped.set(courseId, {
          course: {
            id: document.syllabus.course.id,
            code: document.syllabus.course.code,
            name: document.syllabus.course.name,
          },
          documents: [catalogDocument],
        });
        continue;
      }

      existingGroup.documents.push(catalogDocument);
    }

    const groups = Array.from(grouped.values()).map((group) => ({
      ...group,
      documents: group.documents.sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime()),
    }));

    return c.json({
      groups,
      totalCourses: groups.length,
      totalDocuments: documents.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch document catalog";
    return c.json({ error: message }, 500);
  }
});

chatRouter.get("/sessions", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const chatSessions = await ChatRepository.findSessionsByUser(session.user.id);
    return c.json({
      sessions: chatSessions.map((chatSession) => mapSessionForClient(chatSession)),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch sessions";
    return c.json({ error: message }, 500);
  }
});

chatRouter.post("/sessions", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const body = (await c.req.json().catch(() => ({}))) as CreateChatSessionPayload;
    const resolvedPayload = resolveCreateSessionPayload(body);

    if (resolvedPayload.scopeMode === "SELECTED_COURSES" && resolvedPayload.courseIds.length === 0) {
      return c.json({ error: "At least one course must be selected for SELECTED_COURSES" }, 400);
    }

    if (resolvedPayload.scopeMode === "SELECTED_DOCUMENTS" && resolvedPayload.documentIds.length === 0) {
      return c.json({ error: "At least one document must be selected for SELECTED_DOCUMENTS" }, 400);
    }

    const accessibleCourseIds = new Set(await resolveAccessibleChatCourseIds(session.user.id));
    const accessibleDocumentIds = new Set(await resolveAccessibleChatDocumentIds(session.user.id));

    if (
      resolvedPayload.scopeMode === "SELECTED_COURSES" &&
      resolvedPayload.courseIds.some((courseId) => !accessibleCourseIds.has(courseId))
    ) {
      return c.json({ error: "Unauthorized to select one or more courses" }, 403);
    }

    if (
      resolvedPayload.scopeMode === "SELECTED_DOCUMENTS" &&
      resolvedPayload.documentIds.some((documentId) => !accessibleDocumentIds.has(documentId))
    ) {
      return c.json({ error: "Unauthorized to select one or more documents" }, 403);
    }

    const chatSession = await ChatRepository.createSession({
      user: { connect: { id: session.user.id } },
      scopeMode: resolvedPayload.scopeMode,
      ...(resolvedPayload.legacyCourseId ? { course: { connect: { id: resolvedPayload.legacyCourseId } } } : {}),
      ...(resolvedPayload.scopeMode === "SELECTED_COURSES" && resolvedPayload.courseIds.length > 0
        ? {
            scopedCourses: {
              create: resolvedPayload.courseIds.map((courseId) => ({
                course: { connect: { id: courseId } },
              })),
            },
          }
        : {}),
      ...(resolvedPayload.scopeMode === "SELECTED_DOCUMENTS" && resolvedPayload.documentIds.length > 0
        ? {
            scopedDocuments: {
              create: resolvedPayload.documentIds.map((documentId) => ({
                document: { connect: { id: documentId } },
              })),
            },
          }
        : {}),
    });

    return c.json({ session: chatSession });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create session";
    return c.json({ error: message }, 500);
  }
});

chatRouter.get("/sessions/:sessionId", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const sessionId = c.req.param("sessionId");
  try {
    const chatSession = await ChatRepository.findSessionById(sessionId);
    if (!chatSession) {
      return c.json({ error: "Session not found" }, 404);
    }

    if (chatSession.userId !== session.user.id) {
      return c.json({ error: "Unauthorized to view this session" }, 403);
    }

    const scope = await resolveChatScope(chatSession, session.user.id);
    const parsedMessages = mapMessagesForClient(chatSession.messages);
    const scopeLabel = buildChatScopeLabel(scope);

    return c.json({
      session: {
        ...mapSessionForClient(chatSession),
        scopeLabel,
        scopeSummary: scopeLabel,
        messages: parsedMessages,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch session";
    return c.json({ error: message }, 500);
  }
});

chatRouter.patch("/sessions/:sessionId", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const sessionId = c.req.param("sessionId");
  const { title } = await c.req.json();

  if (!isValidString(title)) {
    return c.json({ error: "Title is required" }, 400);
  }

  try {
    const chatSession = await prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!chatSession) {
      return c.json({ error: "Session not found" }, 404);
    }

    if (chatSession.userId !== session.user.id) {
      return c.json({ error: "Unauthorized to update this session" }, 403);
    }

    const updated = await prisma.chatSession.update({
      where: { id: sessionId },
      data: { title: title.trim() },
    });

    return c.json({ success: true, session: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to rename session";
    return c.json({ error: message }, 500);
  }
});

chatRouter.delete("/sessions/:sessionId", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const sessionId = c.req.param("sessionId");

  try {
    const chatSession = await prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!chatSession) {
      return c.json({ error: "Session not found" }, 404);
    }

    if (chatSession.userId !== session.user.id) {
      return c.json({ error: "Unauthorized to delete this session" }, 403);
    }

    await prisma.chatSession.delete({
      where: { id: sessionId },
    });

    return c.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete session";
    return c.json({ error: message }, 500);
  }
});

chatRouter.post("/send", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json().catch(() => ({}));
  const sessionId = isValidString(body.sessionId) ? body.sessionId : null;
  const message = isValidString(body.message) ? body.message.trim() : "";

  if (!sessionId || !message) {
    return c.json({ error: "sessionId and message are required" }, 400);
  }

  const chatSession = await ChatRepository.findSessionById(sessionId);
  if (!chatSession) {
    return c.json({ error: "Chat session not found" }, 404);
  }

  if (chatSession.userId !== session.user.id) {
    return c.json({ error: "Unauthorized to send message to this session" }, 403);
  }

  const messageCount = chatSession.messages.length;
  if (messageCount >= 100) {
    const quotaMessage =
      "Phiên hội thoại này đã đạt giới hạn tối đa 100 tin nhắn (theo giới hạn quy định của SRS). Vui lòng tạo một phiên hội thoại mới để tiếp tục hỏi đáp.";

    return streamSSE(c, async (stream) => {
      await stream.writeSSE({
        data: JSON.stringify({ chunk: quotaMessage }),
        event: "message",
      });
      await stream.writeSSE({
        data: JSON.stringify({ citations: [] }),
        event: "citations",
      });

      await persistAssistantMessage(sessionId, quotaMessage, []);
    });
  }

  const chatHistory = chatSession.messages.map((item) => ({
    role: item.sender === "USER" ? ("user" as const) : ("model" as const),
    parts: [item.content],
  }));

  await ChatRepository.createMessage({
    session: { connect: { id: sessionId } },
    sender: "USER",
    content: message,
  });

  if (chatHistory.length === 0) {
    try {
      const ai = new GoogleGenAI({ apiKey: ENV.GEMINI_API_KEY });
      const summaryResponse = await ai.models.generateContent({
        model: ENV.GEMINI_TEXT_MODEL,
        contents: `Hãy tóm tắt câu hỏi sau thành một tiêu đề hội thoại ngắn gọn (tối đa 5 từ), trả về duy nhất văn bản thuần túy không chứa bất kỳ markdown, dấu ngoặc hay dấu chấm nào:\n\n"${message}"`,
      });
      const generatedTitle = summaryResponse.text?.trim() || "Cuộc hội thoại mới";
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { title: generatedTitle },
      });
    } catch (titleError) {
      console.error("Failed to generate session title via AI, fallback to substring:", titleError);
      const fallbackTitle = message.length > 30 ? `${message.substring(0, 30)}...` : message;
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { title: fallbackTitle },
      });
    }
  }

  const scope = await resolveChatScope(chatSession, session.user.id);

  return streamSSE(c, async (stream) => {
    try {
      let accumulatedAnswer = "";
      const ragResult = await RagService.retrieveAndGenerate(
        message,
        scope,
        chatHistory,
        async (chunk) => {
          accumulatedAnswer += chunk;
          await stream.writeSSE({
            data: JSON.stringify({ chunk }),
            event: "message",
          });
        },
      );

      await stream.writeSSE({
        data: JSON.stringify({ citations: ragResult.citations }),
        event: "citations",
      });

      await persistAssistantMessage(sessionId, accumulatedAnswer || ragResult.fullAnswer, ragResult.citations as unknown[]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Lỗi xử lý AI RAG";
      console.error("[Chat Stream Error]:", err);
      await stream.writeSSE({
        data: JSON.stringify({ error: message }),
        event: "error",
      });
    }
  });
});

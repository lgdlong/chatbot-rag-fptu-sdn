import { GoogleGenAI } from "@google/genai";
import { Prisma } from "@prisma/client";
import { auth } from "../../auth/auth.js";
import { ENV } from "../../../config/env.js";
import { DEV_LOGIN_ACCOUNTS, type DevLoginAccount } from "../../../config/dev-login.js";
import { ChatRepository } from "../repositories/chat.repository.js";
import { UserRepository } from "../../auth/repositories/user.repository.js";
import { CourseService } from "../../courses/services/course.service.js";
import { DocumentRepository } from "../../documents/repositories/document.repository.js";
import { RagService } from "../../rag/services/rag.service.js";
import {
  buildChatScopeLabel,
  resolveAccessibleChatCourseIds,
  resolveAccessibleChatDocumentIds,
  resolveAccessibleChatDocuments,
  resolveChatScope,
  type ScopedDocument,
} from "./chat-scope.service.js";

export type ChatHistoryItem = {
  role: "user" | "model";
  parts: string[];
};

export type ChatCitation = {
  documentId: string;
  documentName: string;
  fileUrl: string | null;
  page: number;
};

export type SendMessageInput = {
  sessionId: string;
  message: string;
  userId: string;
};

export type SendMessageResult = {
  citations: ChatCitation[];
  fullAnswer: string;
};

export type CreateSessionInput = {
  userId: string;
  scopeMode: "ALL_COURSES" | "SELECTED_COURSES" | "SELECTED_DOCUMENTS";
  courseId?: string | null;
  courseIds?: string[];
  documentIds?: string[];
};

export type UpdateSessionTitleInput = {
  sessionId: string;
  userId: string;
  title: string;
};

export type DevLoginResult = {
  setCookie: string;
  user: unknown;
  token: string;
};

export type DocumentCatalogGroup = {
  course: {
    id: string;
    code: string;
    name: string;
  };
  documents: Array<{
    id: string;
    name: string;
    fileType: string;
    status: string;
    createdAt: Date;
    selectable: boolean;
  }>;
};

export type DocumentCatalogResult = {
  groups: DocumentCatalogGroup[];
  totalCourses: number;
  totalDocuments: number;
};

const CHAT_MESSAGE_QUOTA = 100;
const QUOTA_MESSAGE =
  "Phiên hội thoại này đã đạt giới hạn tối đa 100 tin nhắn (theo giới hạn quy định của SRS). Vui lòng tạo một phiên hội thoại mới để tiếp tục hỏi đáp.";

/**
 * ChatServiceError -- service-layer error that carries the HTTP status
 * code the controller should respond with. The controller maps these
 * to JSON responses via `respondWithChatServiceError`. Status codes are
 * kept narrow (400/403/404/409) so the controller can `as any` cast into
 * Hono's ContentfulStatusCode without losing information.
 */
export class ChatServiceError extends Error {
  public readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ChatServiceError";
    this.status = status;
  }
}

function isValidString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeIds(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return [];
  }
  return Array.from(
    new Set(
      values.filter((value): value is string => typeof value === "string" && value.trim().length > 0),
    ),
  );
}

/**
 * ChatService -- business logic for every chat endpoint under
 * `/api/chat/*`. Consolidates what used to live in chat.controller.ts:
 * session CRUD, dev-login account management, RAG-backed message
 * streaming, and the document catalog query.
 *
 * Layer rule: must NOT import prisma.{table} directly. The only
 * exceptions are GoogleGenAI (used only for first-message title
 * generation, which is an AI concern, not a data concern) and
 * `auth.handler` / `Request` for the devLogin sign-in (HTTP boundary
 * that the controller cannot own because we need the response headers
 * to propagate the Set-Cookie to the caller). DB access is fully
 * delegated to ChatRepository / UserRepository / DocumentRepository,
 * and cross-service composition goes through CourseService and
 * RagService. chat-scope functions are used for accessibility checks
 * and the per-send scope resolution.
 */
export class ChatService {
  // ---------------------------------------------------------------------
  // Message pipeline
  // ---------------------------------------------------------------------

  /**
   * Send a user message through the full RAG pipeline. Returns the
   * citations + final answer so the controller can emit the
   * `event:citations` SSE frame after the chunks finish.
   *
   * Flow:
   * 1. Lookup session, assert ownership (404 / 403).
   * 2. 100-message quota check -- on hit, stream the quota reply,
   *    persist it as an assistant message, return early.
   * 3. Persist the user message.
   * 4. On the first message of the session, ask Gemini for a 5-word
   *    Vietnamese title (fallback to a 30-char substring on failure).
   * 5. Resolve the chat scope for this session.
   * 6. Stream the RAG response via `onChunk`; persist the assistant
   *    message when complete.
   *
   * `history` is the Gemini-shaped history the controller would have
   * built pre-refactor; the service currently re-derives it from
   * `chatSession.messages` but accepts the param for the
   * Phase-0.5 contract. If the controller computes a custom history
   * (eg. a windowed slice) we can switch to using it later.
   */
  public static async sendMessage(
    input: SendMessageInput,
    _history: ChatHistoryItem[],
    onChunk: (chunk: string) => Promise<void>,
  ): Promise<SendMessageResult> {
    const chatSession = await ChatRepository.findSessionById(input.sessionId);
    if (!chatSession) {
      throw new ChatServiceError(404, "Chat session not found");
    }
    if (chatSession.userId !== input.userId) {
      throw new ChatServiceError(403, "Unauthorized to send message to this session");
    }

    if (chatSession.messages.length >= CHAT_MESSAGE_QUOTA) {
      await onChunk(QUOTA_MESSAGE);
      await ChatService.persistAssistantMessage(input.sessionId, QUOTA_MESSAGE, []);
      return { citations: [], fullAnswer: QUOTA_MESSAGE };
    }

    await ChatService.persistUserMessage(input.sessionId, input.message);

    if (chatSession.messages.length === 0) {
      try {
        const generatedTitle = await ChatService.generateTitleForFirstMessage(input.message);
        await ChatRepository.updateSession(input.sessionId, { title: generatedTitle });
      } catch (titleError) {
        console.error("Failed to generate session title via AI, fallback to substring:", titleError);
        const fallbackTitle =
          input.message.length > 30 ? `${input.message.substring(0, 30)}...` : input.message;
        try {
          await ChatRepository.updateSession(input.sessionId, { title: fallbackTitle });
        } catch (fallbackError) {
          console.error("Failed to apply fallback session title:", fallbackError);
        }
      }
    }

    const scope = await resolveChatScope(chatSession, input.userId);
    const history = chatSession.messages.map((item) => ({
      role: (item.sender === "USER" ? "user" : "model") as "user" | "model",
      parts: [item.content],
    }));

    const ragResult = await RagService.retrieveAndGenerate(
      input.message,
      scope,
      history,
      async (chunk) => {
        await onChunk(chunk);
      },
    );

    const persistedContent = ragResult.fullAnswer;
    await ChatService.persistAssistantMessage(
      input.sessionId,
      persistedContent,
      ragResult.citations as unknown[],
    );

    return {
      citations: (ragResult.citations ?? []) as ChatCitation[],
      fullAnswer: ragResult.fullAnswer ?? "",
    };
  }

  public static async persistUserMessage(sessionId: string, content: string): Promise<void> {
    await ChatRepository.createMessage({
      session: { connect: { id: sessionId } },
      sender: "USER",
      content,
    });
  }

  public static async persistAssistantMessage(
    sessionId: string,
    content: string,
    citations: unknown[] = [],
  ): Promise<void> {
    await ChatRepository.createMessage({
      session: { connect: { id: sessionId } },
      sender: "ASSISTANT",
      content,
      citations: citations as Prisma.InputJsonValue,
    });
  }

  /**
   * Ask Gemini to summarize the first user message into a <=5 word
   * Vietnamese title. Pure-text prompt with strict "no markdown" rules
   * matches the pre-refactor controller's prompt verbatim. Returns
   * "Cuộc hội thoại mới" when the model yields no text.
   */
  public static async generateTitleForFirstMessage(message: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: ENV.GEMINI_API_KEY });
    const summaryResponse = await ai.models.generateContent({
      model: ENV.GEMINI_TEXT_MODEL,
      contents: `Hãy tóm tắt câu hỏi sau thành một tiêu đề hội thoại ngắn gọn (tối đa 5 từ), trả về duy nhất văn bản thuần túy không chứa bất kỳ markdown, dấu ngoặc hay dấu chấm nào:\n\n"${message}"`,
    });
    return summaryResponse.text?.trim() || "Cuộc hội thoại mới";
  }

  // ---------------------------------------------------------------------
  // Session CRUD
  // ---------------------------------------------------------------------

  /**
   * Create a chat session for the given user. Re-validates the
   * accessibility of the requested course / document ids against the
   * chat-scope resolver so callers can't ask the backend to write a
   * session row that points at resources the user cannot reach.
   */
  public static async createSession(input: CreateSessionInput) {
    if (input.scopeMode === "SELECTED_COURSES" && (!input.courseIds || input.courseIds.length === 0)) {
      throw new ChatServiceError(
        400,
        "At least one course must be selected for SELECTED_COURSES",
      );
    }
    if (input.scopeMode === "SELECTED_DOCUMENTS" && (!input.documentIds || input.documentIds.length === 0)) {
      throw new ChatServiceError(
        400,
        "At least one document must be selected for SELECTED_DOCUMENTS",
      );
    }

    const accessibleCourseIds = new Set(await resolveAccessibleChatCourseIds(input.userId));
    const accessibleDocumentIds = new Set(await resolveAccessibleChatDocumentIds(input.userId));

    if (
      input.scopeMode === "SELECTED_COURSES" &&
      input.courseIds?.some((courseId) => !accessibleCourseIds.has(courseId))
    ) {
      throw new ChatServiceError(403, "Unauthorized to select one or more courses");
    }
    if (
      input.scopeMode === "SELECTED_DOCUMENTS" &&
      input.documentIds?.some((documentId) => !accessibleDocumentIds.has(documentId))
    ) {
      throw new ChatServiceError(403, "Unauthorized to select one or more documents");
    }

    const legacyCourseId =
      input.scopeMode === "SELECTED_COURSES" && input.courseIds && input.courseIds.length === 1
        ? input.courseIds[0]
        : null;

    return ChatRepository.createSession({
      user: { connect: { id: input.userId } },
      scopeMode: input.scopeMode,
      ...(legacyCourseId ? { course: { connect: { id: legacyCourseId } } } : {}),
      ...(input.scopeMode === "SELECTED_COURSES" && input.courseIds && input.courseIds.length > 0
        ? {
            scopedCourses: {
              create: input.courseIds.map((courseId) => ({
                course: { connect: { id: courseId } },
              })),
            },
          }
        : {}),
      ...(input.scopeMode === "SELECTED_DOCUMENTS" && input.documentIds && input.documentIds.length > 0
        ? {
            scopedDocuments: {
              create: input.documentIds.map((documentId) => ({
                document: { connect: { id: documentId } },
              })),
            },
          }
        : {}),
    });
  }

  /**
   * Fetch a single session with messages, scope label, and ownership
   * assertion. Throws ChatServiceError(404) if missing and 403 if the
   * session belongs to a different user. Returned shape matches what
   * the controller used to assemble inline: session fields, the
   * `scopeLabel` / `scopeSummary` strings, and the `messages` array.
   */
  public static async getSession(sessionId: string, userId: string) {
    const chatSession = await ChatRepository.findSessionById(sessionId);
    if (!chatSession) {
      throw new ChatServiceError(404, "Session not found");
    }
    if (chatSession.userId !== userId) {
      throw new ChatServiceError(403, "Unauthorized to view this session");
    }

    const scope = await resolveChatScope(chatSession, userId);
    const scopeLabel = buildChatScopeLabel(scope);

    return {
      ...chatSession,
      scopeLabel,
      scopeSummary: scopeLabel,
      messages: chatSession.messages,
    };
  }

  public static async getUserSessions(userId: string, courseId?: string) {
    return ChatRepository.findSessionsByUser(userId, courseId);
  }

  public static async updateSessionTitle(input: UpdateSessionTitleInput) {
    if (!isValidString(input.title)) {
      throw new ChatServiceError(400, "Title is required");
    }
    const existing = await ChatRepository.findSessionById(input.sessionId);
    if (!existing) {
      throw new ChatServiceError(404, "Session not found");
    }
    if (existing.userId !== input.userId) {
      throw new ChatServiceError(403, "Unauthorized to update this session");
    }
    return ChatRepository.updateSession(input.sessionId, { title: input.title.trim() });
  }

  public static async deleteSession(sessionId: string, userId: string): Promise<void> {
    const existing = await ChatRepository.findSessionById(sessionId);
    if (!existing) {
      throw new ChatServiceError(404, "Session not found");
    }
    if (existing.userId !== userId) {
      throw new ChatServiceError(403, "Unauthorized to delete this session");
    }
    await ChatRepository.deleteSession(sessionId);
  }

  // ---------------------------------------------------------------------
  // Catalog + listings
  // ---------------------------------------------------------------------

  /**
   * Build the per-course document catalog for the picker UI. Re-uses
   * the chat-scope accessibility query to decide which documents are
   * visible, then groups them by course. A document is "selectable"
   * iff its status is COMPLETED (matches the pre-refactor controller).
   */
  public static async getDocumentCatalog(userId: string): Promise<DocumentCatalogResult> {
    const documents: ScopedDocument[] = await resolveAccessibleChatDocuments(userId);
    const grouped = new Map<string, DocumentCatalogGroup>();

    for (const document of documents) {
      const courseId = document.syllabus.course.id;
      const catalogDocument = {
        id: document.id,
        name: document.name,
        fileType: document.fileType,
        status: document.status,
        createdAt: document.createdAt,
        selectable: document.status === "COMPLETED",
      };

      const existing = grouped.get(courseId);
      if (!existing) {
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
      existing.documents.push(catalogDocument);
    }

    const groups = Array.from(grouped.values()).map((group) => ({
      ...group,
      documents: group.documents.sort(
        (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
      ),
    }));

    return {
      groups,
      totalCourses: groups.length,
      totalDocuments: documents.length,
    };
  }

  /**
   * List every course, most-recent first. Thin delegate to
   * CourseService (Track D) so we never bypass the service layer.
   */
  public static async listCourses() {
    return CourseService.listAll();
  }

  /**
   * List every document attached to any syllabus under a specific
   * course. The pre-refactor controller used an inline
   * `prisma.document.findMany`; we route through DocumentRepository.
   */
  public static async listCourseDocuments(courseId: string) {
    return DocumentRepository.findManyByCourseId(courseId);
  }

  // ---------------------------------------------------------------------
  // Dev login
  // ---------------------------------------------------------------------

  /**
   * Dev-login helper. Idempotently upserts a user + its credential
   * account from `DEV_LOGIN_ACCOUNTS`, then performs a real Better
   * Auth sign-in via `auth.handler` so the caller gets a Set-Cookie
   * session. The controller is responsible for forwarding the cookie
   * header to the client; this method just returns the cookie + the
   * sign-in response body.
   */
  public static async devLogin(role: string): Promise<DevLoginResult> {
    const account: DevLoginAccount = DEV_LOGIN_ACCOUNTS[role] ?? DEV_LOGIN_ACCOUNTS.student;

    const user = await UserRepository.upsertByEmail(account.email, {
      id: account.userId,
      name: account.name,
      role: account.role,
    });

    const existingAccount = await UserRepository.findFirstAccountByUserId(user.id);

    if (!existingAccount) {
      await UserRepository.createAccount({
        id: account.accountId,
        accountId: user.id,
        providerId: "credential",
        userId: user.id,
        password: account.passwordHash,
      });
    } else {
      await UserRepository.updateAccount(existingAccount.id, {
        password: account.passwordHash,
      });
    }

    const signInReq = new Request(`${ENV.BETTER_AUTH_URL}/api/auth/sign-in/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

    const responseBody = (await authRes.json()) as { user: unknown; token: string };

    return {
      setCookie,
      user: responseBody.user,
      token: responseBody.token,
    };
  }
}

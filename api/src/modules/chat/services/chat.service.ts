import { ChatRepository } from "../repositories/chat.repository.js";
import type { ResolvedChatScope } from "./chat-scope.service.js";

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

export class ChatService {
  // Phase 0.5 -- fully defined signature, impl in Track F
  public static async sendMessage(
    input: SendMessageInput,
    history: ChatHistoryItem[],
    onChunk: (chunk: string) => Promise<void>,
  ): Promise<SendMessageResult> {
    throw new Error("ChatService.sendMessage not implemented -- Track F");
  }

  // Session CRUD stubs (impl in Track F)
  public static async createSession(input: CreateSessionInput): Promise<unknown> {
    throw new Error("ChatService.createSession not implemented");
  }

  public static async getSession(sessionId: string, userId: string): Promise<unknown> {
    throw new Error("ChatService.getSession not implemented");
  }

  public static async getUserSessions(userId: string, courseId?: string): Promise<unknown[]> {
    throw new Error("ChatService.getUserSessions not implemented");
  }

  public static async updateSessionTitle(sessionId: string, userId: string, title: string): Promise<unknown> {
    throw new Error("ChatService.updateSessionTitle not implemented");
  }

  public static async deleteSession(sessionId: string, userId: string): Promise<void> {
    throw new Error("ChatService.deleteSession not implemented");
  }

  public static async generateTitleForFirstMessage(message: string): Promise<string> {
    throw new Error("ChatService.generateTitleForFirstMessage not implemented");
  }

  // Message helpers
  public static async persistAssistantMessage(sessionId: string, content: string, citations: unknown[]): Promise<void> {
    throw new Error("ChatService.persistAssistantMessage not implemented");
  }

  public static async persistUserMessage(sessionId: string, content: string): Promise<void> {
    throw new Error("ChatService.persistUserMessage not implemented");
  }

  // Document catalog
  public static async getDocumentCatalog(userId: string): Promise<unknown> {
    throw new Error("ChatService.getDocumentCatalog not implemented");
  }

  // Course/Document listing (delegates to CourseService in Track F)
  public static async listCourses(): Promise<unknown[]> {
    throw new Error("ChatService.listCourses not implemented");
  }

  public static async listCourseDocuments(courseId: string): Promise<unknown[]> {
    throw new Error("ChatService.listCourseDocuments not implemented");
  }

  // Dev login (impl in Track F)
  public static async devLogin(role: string): Promise<unknown> {
    throw new Error("ChatService.devLogin not implemented");
  }
}

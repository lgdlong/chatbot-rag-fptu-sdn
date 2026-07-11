import type { Prisma } from "@prisma/client";

export type UploadDocumentInput = {
  syllabusId: number;
  file: File;
  filename: string;
  fileType: string;
  userId: string;
};

export type UploadDocumentResult = {
  id: string;
  name: string;
  status: string;
};

export type SearchSyllabusInput = {
  subjectCode?: string;
  role?: "STUDENT" | "LECTURER" | "ADMIN" | null;
};

export type UpdateSyllabusInput = {
  id: number;
  syllabusName: string;
  syllabusNameEnglish?: string;
  credits?: number;
  prerequisites?: string;
  description?: string;
  studentTasks?: string;
  tools?: string;
  minAvgMarkToPass?: number;
  decisionNo?: string;
  note?: string;
  materials?: unknown[];
  clos?: unknown[];
  schedules?: unknown[];
  questions?: unknown[];
  assessments?: unknown[];
  references?: unknown[];
  videoLinks?: unknown[];
};

export class SyllabusService {
  // Phase 0.6 -- fully defined signature, impl in Track G
  public static async uploadDocument(input: UploadDocumentInput): Promise<UploadDocumentResult> {
    throw new Error("SyllabusService.uploadDocument not implemented -- Track G");
  }

  // Search/Read (impl Track G)
  public static async searchSyllabuses(input: SearchSyllabusInput): Promise<unknown[]> {
    throw new Error("SyllabusService.searchSyllabuses not implemented");
  }

  public static async getSyllabusDetail(id: number, role: string | null): Promise<unknown> {
    throw new Error("SyllabusService.getSyllabusDetail not implemented");
  }

  public static async getDocuments(syllabusId: number): Promise<unknown[]> {
    throw new Error("SyllabusService.getDocuments not implemented");
  }

  // Mutations (impl Track G)
  public static async createSyllabus(input: {
    syllabusId: number;
    courseId: string;
    syllabusName: string;
    syllabusNameEnglish?: string;
    credits: number;
    prerequisites?: string;
    description?: string;
    studentTasks?: string;
    tools?: string;
    minAvgMarkToPass: number;
    decisionNo?: string;
    note?: string;
    userId: string;
  }): Promise<unknown> {
    throw new Error("SyllabusService.createSyllabus not implemented");
  }

  public static async updateSyllabus(input: UpdateSyllabusInput, userId: string): Promise<unknown> {
    throw new Error("SyllabusService.updateSyllabus not implemented");
  }

  public static async approveSyllabus(id: number, userId: string): Promise<unknown> {
    throw new Error("SyllabusService.approveSyllabus not implemented");
  }

  public static async activateSyllabus(id: number, userId: string): Promise<unknown> {
    throw new Error("SyllabusService.activateSyllabus not implemented");
  }

  public static async deactivateSyllabus(id: number, userId: string): Promise<unknown> {
    throw new Error("SyllabusService.deactivateSyllabus not implemented");
  }

  public static async deleteSyllabus(id: number, userId: string): Promise<void> {
    throw new Error("SyllabusService.deleteSyllabus not implemented");
  }

  public static async deleteDocument(input: {
    syllabusId: number;
    documentId: string;
    userId: string;
  }): Promise<void> {
    throw new Error("SyllabusService.deleteDocument not implemented");
  }
}

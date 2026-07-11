import { prisma } from "../../auth/services/db.service.js";
import { Prisma } from "@prisma/client";

// Phase 0.3 stub -- implemented in Track G.

export class RagWorkspaceRepository {
  static async findBySyllabus(syllabusId: number) {
    throw new Error("RagWorkspaceRepository.findBySyllabus not implemented");
  }

  static async upsertBySyllabus(input: { syllabusId: number; workspaceSlug: string; workspaceName: string }) {
    throw new Error("RagWorkspaceRepository.upsertBySyllabus not implemented");
  }

  static async update(id: string, data: { workspaceSlug?: string; workspaceName?: string; anythingLlmId?: string }) {
    throw new Error("RagWorkspaceRepository.update not implemented");
  }

  static async updateManyBySyllabus(syllabusId: number, data: { workspaceSlug: string; workspaceName: string }) {
    throw new Error("RagWorkspaceRepository.updateManyBySyllabus not implemented");
  }

  static async deleteManyBySyllabus(syllabusId: number) {
    throw new Error("RagWorkspaceRepository.deleteManyBySyllabus not implemented");
  }
}

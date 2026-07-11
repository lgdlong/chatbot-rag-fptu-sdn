import { prisma } from "../../auth/services/db.service.js";
import { Prisma } from "@prisma/client";

// Phase 0.3 stub -- implemented in Track G.

export class SyllabusRepository {
  static async findMany(filter: { subjectCode?: string; role?: string }) {
    throw new Error("SyllabusRepository.findMany not implemented");
  }

  static async findById(id: number, options?: { deep?: boolean }) {
    throw new Error("SyllabusRepository.findById not implemented");
  }

  static async findByIdLight(id: number) {
    throw new Error("SyllabusRepository.findByIdLight not implemented");
  }

  static async findByCourseId(courseId: string) {
    throw new Error("SyllabusRepository.findByCourseId not implemented");
  }

  static async findFirstActiveSyllabus(courseId: string) {
    throw new Error("SyllabusRepository.findFirstActiveSyllabus not implemented");
  }

  static async create(data: Prisma.SyllabusCreateInput) {
    throw new Error("SyllabusRepository.create not implemented");
  }

  static async update(id: number, data: Prisma.SyllabusUpdateInput) {
    throw new Error("SyllabusRepository.update not implemented");
  }

  static async delete(id: number) {
    throw new Error("SyllabusRepository.delete not implemented");
  }

  static async updateActiveStatus(id: number, isActive: boolean) {
    throw new Error("SyllabusRepository.updateActiveStatus not implemented");
  }

  static async deactivateOthersInCourse(courseId: string, exceptId: number) {
    throw new Error("SyllabusRepository.deactivateOthersInCourse not implemented");
  }

  static async countByCourseId(courseId: string) {
    throw new Error("SyllabusRepository.countByCourseId not implemented");
  }
}

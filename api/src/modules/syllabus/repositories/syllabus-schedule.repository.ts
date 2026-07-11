import { prisma } from "../../auth/services/db.service.js";
import { Prisma } from "@prisma/client";

/**
 * SyllabusScheduleRepository -- pure data-access wrapper for the
 * `syllabus_schedules` table (per-session learning schedule rows).
 *
 * Track G surface. All methods static, accept optional
 * `tx?: Prisma.TransactionClient` (Phase 0.4 transaction pattern).
 */
export class SyllabusScheduleRepository {
  static async deleteBySyllabus(
    syllabusId: number,
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.syllabusSchedule.deleteMany({ where: { syllabusId } });
  }

  static async create(
    data: Prisma.SyllabusScheduleCreateInput,
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.syllabusSchedule.create({ data });
  }

  static async findManyBySyllabus(
    syllabusId: number,
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.syllabusSchedule.findMany({ where: { syllabusId } });
  }
}

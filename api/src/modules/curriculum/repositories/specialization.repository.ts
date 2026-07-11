import { prisma } from "../../auth/services/db.service.js";
import { Prisma } from "@prisma/client";

/**
 * SpecializationRepository -- pure data-access wrapper for `prisma.specialization`.
 *
 * All methods are static and accept an optional `tx?: Prisma.TransactionClient`
 * (Phase 0.4 transaction pattern).
 */
export class SpecializationRepository {
  static async findByCode(
    code: string,
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.specialization.findUnique({ where: { code } });
  }

  static async findById(
    id: string,
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.specialization.findUnique({ where: { id } });
  }

  static async findMany(options?: { tx?: Prisma.TransactionClient }) {
    const client = options?.tx || prisma;
    return client.specialization.findMany({
      orderBy: { code: "asc" },
      include: { major: { select: { code: true, name: true } } },
    });
  }

  static async findFirstByMajor(
    majorId: string,
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.specialization.findFirst({ where: { majorId } });
  }

  static async create(
    data: {
      majorId: string;
      code: string;
      name: string;
      description?: string;
    },
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.specialization.create({ data });
  }

  static async update(
    id: string,
    data: { name?: string; description?: string },
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.specialization.update({ where: { id }, data });
  }

  static async delete(
    id: string,
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.specialization.delete({ where: { id } });
  }
}

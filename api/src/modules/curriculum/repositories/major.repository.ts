import { prisma } from "../../auth/services/db.service.js";
import { Prisma } from "@prisma/client";

/**
 * MajorRepository -- pure data-access wrapper for `prisma.major`.
 *
 * All methods are static and accept an optional `tx?: Prisma.TransactionClient`
 * (Phase 0.4 transaction pattern) so callers can compose multi-entity writes
 * inside a single `prisma.$transaction(...)` block.
 */
export class MajorRepository {
  static async findByCode(
    code: string,
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.major.findUnique({ where: { code } });
  }

  static async findById(
    id: string,
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.major.findUnique({ where: { id } });
  }

  static async findMany(options?: { tx?: Prisma.TransactionClient }) {
    const client = options?.tx || prisma;
    return client.major.findMany({ orderBy: { code: "asc" } });
  }

  static async create(
    data: { code: string; name: string; description?: string },
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.major.create({ data });
  }

  static async update(
    id: string,
    data: { name?: string; description?: string },
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.major.update({ where: { id }, data });
  }

  static async delete(
    id: string,
    options?: { tx?: Prisma.TransactionClient },
  ) {
    const client = options?.tx || prisma;
    return client.major.delete({ where: { id } });
  }
}

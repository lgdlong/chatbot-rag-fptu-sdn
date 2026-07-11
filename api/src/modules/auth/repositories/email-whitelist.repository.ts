import { prisma } from "../services/db.service.js";

/**
 * EmailWhitelistRepository -- raw Prisma access for the email_whitelist table.
 *
 * Layer rule: this is the ONLY module under auth/ that touches prisma directly
 * for EmailWhitelist. All validation, dedup and business logic lives in
 * EmailWhitelistService. The controller must never import prisma.
 */
export class EmailWhitelistRepository {
  static async findMany(opts: {
    where?: any;
    skip?: number;
    take?: number;
    orderBy?: any;
    select?: any;
  }) {
    return prisma.emailWhitelist.findMany(opts);
  }

  static async count(where: any) {
    return prisma.emailWhitelist.count({ where });
  }

  static async findByEmail(email: string) {
    return prisma.emailWhitelist.findUnique({ where: { email } });
  }

  static async findById(id: string) {
    return prisma.emailWhitelist.findUnique({ where: { id } });
  }

  static async create(data: { email: string }) {
    return prisma.emailWhitelist.create({ data });
  }

  static async createMany(data: Array<{ email: string }>) {
    return prisma.emailWhitelist.createMany({
      data,
      skipDuplicates: true,
    });
  }

  static async delete(id: string) {
    return prisma.emailWhitelist.delete({ where: { id } });
  }
}

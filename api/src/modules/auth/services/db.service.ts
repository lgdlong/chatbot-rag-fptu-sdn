/**
 * ============================================================================
 * TRANSACTION PATTERN (Phase 0.4 -- layer-refactor)
 * ============================================================================
 * Repositories accept an optional `tx?: Prisma.TransactionClient` parameter.
 * Services call `prisma.$transaction(async (tx) => { ... })` and pass the
 * `tx` client into each repository call via `{ tx }`.
 *
 * Repository methods use `tx || prisma` so they work both standalone (with
 * the global prisma client) and inside a transaction (with the tx client).
 *
 * Services MAY import prisma for `$transaction()` calls ONLY -- this is the
 * sole scoped exception to the "only repositories import prisma" rule.
 *
 * Example:
 *
 *   // In a service:
 *   await prisma.$transaction(async (tx) => {
 *     await UserRepository.update(id, data, { tx });
 *     await AuditLogRepository.create({ ... }, { tx });
 *   });
 *
 *   // In a repository:
 *   static async update(id, data, options?: { tx?: Prisma.TransactionClient }) {
 *     const client = options?.tx || prisma;
 *     return client.user.update({ where: { id }, data });
 *   }
 *
 * ============================================================================
 */

import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

// Middleware tự động dọn dẹp triệt để dữ liệu liên quan ở bảng whitelist khi User bị xóa
prisma.$use(async (params, next) => {
  if (params.model === "User" && (params.action === "delete" || params.action === "deleteMany")) {
    const where = params.args?.where;
    if (where) {
      try {
        // Tìm thông tin các người dùng sắp bị xóa để lấy email
        const users = await prisma.user.findMany({ where });
        const emails = users.map((u) => u.email).filter(Boolean);

        if (emails.length > 0) {
          // Xóa email khỏi whitelist sinh viên
          await prisma.emailWhitelist.deleteMany({
            where: { email: { in: emails } },
          });
          console.log(`[Prisma Middleware] Cleaned up whitelist for emails:`, emails);
        }
      } catch (err) {
        console.error("[Prisma Middleware] Error during cascading cleanup of deleted user(s):", err);
      }
    }
  }
  return next(params);
});

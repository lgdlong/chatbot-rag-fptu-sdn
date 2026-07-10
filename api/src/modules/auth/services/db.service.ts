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

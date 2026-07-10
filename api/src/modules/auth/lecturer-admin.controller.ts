import { randomBytes } from "node:crypto";
import { Hono, type Context } from "hono";
import { auth } from "./auth.js";
import { prisma } from "./services/db.service.js";
import { sendEmail, templateLecturerApproved } from "./services/email.service.js";
import { ENV } from "../../config/env.js";
import { createAuditLog } from "./services/audit.service.js";

export const lecturerAdminRouter = new Hono();

type AdminAuthResult = 
  | { error: Response; session: null }
  | { error: null; session: typeof auth.$Infer.Session };

async function requireAdmin(c: Context): Promise<AdminAuthResult> {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    return { error: c.json({ error: "Unauthorized" }, 401) as Response, session: null };
  }

  if (session.user.role !== "ADMIN") {
    return { error: c.json({ error: "Forbidden: Admin role required" }, 403) as Response, session: null };
  }

  return { error: null, session };
}

// POST /api/admin/create-lecturer
// Admin trực tiếp tạo tài khoản Giảng viên (bỏ qua flow yêu cầu đăng ký).
// Trả về credentials + reset link để admin chuyển cho giảng viên mới.
lecturerAdminRouter.post("/create-lecturer", async (c) => {
  const authResult = await requireAdmin(c);
  if (authResult.error) return authResult.error;

  try {
    const body = await c.req.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    // 2. Validate body
    if (!name || !email) {
      return c.json({ error: "Họ tên và email là bắt buộc." }, 400);
    }

    // 3. Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ error: "Invalid email format" }, 400);
    }

    // 4. Check email doesn't already exist in prisma.user
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return c.json({ error: "Email này đã có tài khoản trong hệ thống." }, 409);
    }

    // 5. Generate random password (16 hex chars)
    const temporaryPassword = randomBytes(8).toString("hex");

    // 6. Create the account via Better Auth
    const signUpRes = await auth.api.signUpEmail({
      body: {
        name,
        email,
        password: temporaryPassword,
      },
    });

    if (!signUpRes?.user?.id) {
      throw new Error("Better Auth signUpEmail did not return a user");
    }

    // 7. Promote role to LECTURER
    await prisma.user.update({
      where: { id: signUpRes.user.id },
      data: { role: "LECTURER" },
    });

    // 8. Build reset link (Better Auth's requestPasswordReset sẽ tự append token vào URL)
    const resetLink = `${ENV.BETTER_AUTH_URL.replace("8001", "3000")}/reset-password`;

    // 9. Trigger Better Auth's sendResetPassword hook (email thiết lập mật khẩu)
    try {
      await auth.api.requestPasswordReset({
        body: { email, redirectTo: resetLink },
      });
    } catch (error) {
      console.error(`[Admin Create Lecturer] requestPasswordReset failed for ${email}:`, error);
    }

    // Gửi email thông báo tài khoản + mật khẩu tạm thời cho giảng viên mới (best-effort)
    try {
      await sendEmail({
        to: email,
        subject: "Tài khoản Giảng viên của bạn đã được tạo trên FPTU RAG Chatbot",
        text: `Chào ${name},\n\nTài khoản Giảng viên của bạn đã được tạo thành công trên hệ thống FPTU RAG Chatbot.\n\nThông tin đăng nhập:\n- Email: ${email}\n- Mật khẩu tạm thời: ${temporaryPassword}\n\nVui lòng đổi mật khẩu ngay sau khi đăng nhập lần đầu tại:\n${resetLink}\n\nTrân trọng,\nBan quản trị FPTU RAG Chatbot`,
        html: templateLecturerApproved(name, email, temporaryPassword, resetLink),
      });
    } catch (error) {
      console.error(`[Admin Create Lecturer] sendEmail failed for ${email}:`, error);
    }

    // Audit log
    Promise.resolve().then(async () => {
      try {
        await createAuditLog({
          userId: authResult.session.user.id,
          action: "CREATE_LECTURER",
          entityType: "Lecturer",
          entityId: signUpRes.user.id,
          details: { name, email },
        });
      } catch (auditErr) {
        console.error("[AuditLog] Failed to write:", auditErr);
      }
    });

    // 10. Return credentials + reset link cho admin
    return c.json({
      success: true,
      credentials: {
        email,
        temporaryPassword,
      },
      resetLink,
    });
  } catch (err: any) {
    return c.json({ error: err.message || "Failed to create lecturer" }, 500);
  }
});

// POST /api/admin/disable-lecturer/:userId
// Admin vô hiệu hoá tài khoản giảng viên (set banned = true)
lecturerAdminRouter.post("/disable-lecturer/:userId", async (c) => {
  const authResult = await requireAdmin(c);
  if (authResult.error) return authResult.error;

  const userId = c.req.param("userId");

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return c.json({ error: "User not found" }, 404);
    if (user.role !== "LECTURER") return c.json({ error: "User is not a lecturer" }, 400);

    await prisma.user.update({
      where: { id: userId },
      data: { banned: true, banReason: "Disabled by admin" },
    });

    Promise.resolve().then(async () => {
      try {
        await createAuditLog({
          userId: authResult.session.user.id,
          action: "DISABLE_LECTURER",
          entityType: "Lecturer",
          entityId: userId,
          details: { email: user.email },
        });
      } catch (auditErr) {
        console.error("[AuditLog] Failed to write:", auditErr);
      }
    });

    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message || "Failed to disable lecturer" }, 500);
  }
});

// POST /api/admin/enable-lecturer/:userId
// Admin kích hoạt lại tài khoản giảng viên (set banned = false)
lecturerAdminRouter.post("/enable-lecturer/:userId", async (c) => {
  const authResult = await requireAdmin(c);
  if (authResult.error) return authResult.error;

  const userId = c.req.param("userId");

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return c.json({ error: "User not found" }, 404);
    if (user.role !== "LECTURER") return c.json({ error: "User is not a lecturer" }, 400);

    await prisma.user.update({
      where: { id: userId },
      data: { banned: false, banReason: null },
    });

    Promise.resolve().then(async () => {
      try {
        await createAuditLog({
          userId: authResult.session.user.id,
          action: "ENABLE_LECTURER",
          entityType: "Lecturer",
          entityId: userId,
          details: { email: user.email },
        });
      } catch (auditErr) {
        console.error("[AuditLog] Failed to write:", auditErr);
      }
    });

    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message || "Failed to enable lecturer" }, 500);
  }
});

import { randomBytes, randomUUID } from "node:crypto";
import { Hono, type Context } from "hono";
import { auth } from "./auth.js";
import { prisma } from "./services/db.service.js";
import { sendEmail } from "./services/email.service.js";
import { ENV } from "../../config/env.js";

export const lecturerRequestRouter = new Hono();

async function requireAdmin(c: Context) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    return { error: c.json({ error: "Unauthorized" }, 401) as Response, session: null };
  }

  if (session.user.role !== "ADMIN") {
    return { error: c.json({ error: "Forbidden: Admin role required" }, 403) as Response, session: null };
  }

  return { error: null, session };
}

function generateTemporaryPassword() {
  return `Lecturer@${randomBytes(4).toString("hex")}`;
}

lecturerRequestRouter.post("/lecturer-request", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!name || !email || !reason || !password) {
      return c.json({ error: "Họ tên, email, lý do đăng ký và mật khẩu là bắt buộc." }, 400);
    }
    if (password.length < 8) {
      return c.json({ error: "Mật khẩu đăng ký phải dài tối thiểu 8 ký tự." }, 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ error: "Invalid email format" }, 400);
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return c.json({ error: "Email này đã có tài khoản trong hệ thống." }, 409);
    }

    const existingRequest = await prisma.lecturerRequest.findUnique({ where: { email } });
    if (existingRequest) {
      return c.json({ error: "Email này đã có yêu cầu đăng ký giảng viên trước đó." }, 409);
    }

    const request = await prisma.lecturerRequest.create({
      data: { name, email, reason, password },
    });

    return c.json({ success: true, request }, 201);
  } catch (err: any) {
    return c.json({ error: err.message || "Failed to create lecturer request" }, 500);
  }
});

lecturerRequestRouter.get("/admin/lecturer-requests", async (c) => {
  const authResult = await requireAdmin(c);
  if (authResult.error) return authResult.error;

  try {
    const requests = await prisma.lecturerRequest.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });
    return c.json({ requests });
  } catch (err: any) {
    return c.json({ error: err.message || "Failed to fetch lecturer requests" }, 500);
  }
});

lecturerRequestRouter.post("/admin/lecturer-requests/:requestId/approve", async (c) => {
  const authResult = await requireAdmin(c);
  if (authResult.error) return authResult.error;

  const requestId = c.req.param("requestId");

  try {
    const request = await prisma.lecturerRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      return c.json({ error: "Lecturer request not found" }, 404);
    }

    if (request.status !== "PENDING") {
      return c.json({ error: "Lecturer request has already been processed" }, 409);
    }

    const existingUser = await prisma.user.findUnique({ where: { email: request.email } });
    const registeredPassword = request.password || "FPTU123456@"; // Fallback phòng hờ

    if (!existingUser) {
      const signUpRes = await auth.api.signUpEmail({
        body: {
          name: request.name,
          email: request.email,
          password: registeredPassword,
          plainPassword: registeredPassword,
        },
      });

      if (!signUpRes?.user?.id) {
        throw new Error("Better Auth signUpEmail did not return a user");
      }

      await prisma.user.update({
        where: { id: signUpRes.user.id },
        data: { role: "LECTURER" },
      });
    } else {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { role: "LECTURER" },
      });
    }

    await prisma.lecturerRequest.update({
      where: { id: requestId },
      data: {
        status: "APPROVED",
        reviewedAt: new Date(),
        reviewedById: authResult.session!.user.id,
      },
    });

    // Tạo token và link đổi mật khẩu
    const frontendUrl = ENV.BETTER_AUTH_URL.replace("8001", "3000");
    const tokenValue = randomUUID().replace(/-/g, "");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 giờ

    await prisma.verification.create({
      data: {
        id: tokenValue,
        identifier: `password-reset:${request.email}`,
        value: tokenValue,
        expiresAt,
      }
    });

    const resetLink = `${frontendUrl}/reset-password?token=${tokenValue}`;

    // Gửi email thông báo phê duyệt
    if (!existingUser) {
      await sendEmail({
        to: request.email,
        subject: "Yêu cầu đăng ký Giảng viên của bạn đã được phê duyệt",
        text: `Chào ${request.name},\n\nYêu cầu đăng ký làm Giảng viên của bạn trên hệ thống FPTU RAG Chatbot đã được phê duyệt thành công.\n\nThông tin đăng nhập:\n- Email: ${request.email}\n- Mật khẩu: (Mật khẩu bạn đã nhập lúc đăng ký xét duyệt)\n\nNếu muốn đổi mật khẩu, bạn có thể nhấp vào liên kết sau:\n${resetLink}\n\nTrân trọng,\nBan quản trị FPTU RAG Chatbot`,
        html: `<p>Chào <b>${request.name}</b>,</p>
               <p>Yêu cầu đăng ký làm Giảng viên của bạn trên hệ thống FPTU RAG Chatbot đã được <b>phê duyệt thành công</b>.</p>
               <p><b>Thông tin đăng nhập của bạn:</b></p>
               <ul>
                 <li><b>Email:</b> ${request.email}</li>
                 <li><b>Mật khẩu:</b> (Mật khẩu bạn đã thiết lập lúc gửi yêu cầu đăng ký)</li>
               </ul>
               <p>Nếu bạn muốn thay đổi hoặc thiết lập lại mật khẩu mới, vui lòng click vào nút dưới đây:</p>
               <p><a href="${resetLink}" style="display:inline-block;padding:12px 24px;color:white;background-color:#F26F21;text-decoration:none;font-weight:bold;">Đổi Mật Khẩu</a></p>
               <p>Hoặc truy cập trực tiếp qua liên kết sau:</p>
               <p>${resetLink}</p>
               <br/>
               <p>Trân trọng,<br/>Ban quản trị FPTU RAG Chatbot</p>`
      });
    } else {
      await sendEmail({
        to: request.email,
        subject: "Quyền truy cập Giảng viên của bạn đã được kích hoạt",
        text: `Chào ${request.name},\n\nTài khoản của bạn đã được phân quyền Giảng viên thành công trên hệ thống FPTU RAG Chatbot.\n\nBạn có thể đăng nhập bằng tài khoản hiện tại của mình, hoặc nhấp vào liên kết sau nếu muốn thiết lập lại mật khẩu mới:\n${resetLink}\n\nTrân trọng,\nBan quản trị FPTU RAG Chatbot`,
        html: `<p>Chào <b>${request.name}</b>,</p>
               <p>Tài khoản của bạn đã được phân quyền <b>Giảng viên</b> thành công trên hệ thống FPTU RAG Chatbot.</p>
               <p>Bạn có thể đăng nhập bằng mật khẩu hiện tại của mình.</p>
               <p>Nếu bạn muốn thay đổi hoặc thiết lập lại mật khẩu mới, vui lòng nhấp vào liên kết dưới đây:</p>
               <p><a href="${resetLink}" style="display:inline-block;padding:12px 24px;color:white;background-color:#1A3A5C;text-decoration:none;font-weight:bold;">Đổi Mật Khẩu</a></p>
               <p>Hoặc truy cập trực tiếp qua liên kết sau:</p>
               <p>${resetLink}</p>
               <br/>
               <p>Trân trọng,<br/>Ban quản trị FPTU RAG Chatbot</p>`
      });
    }

    return c.json({
      success: true,
      message: "Lecturer request approved successfully.",
      credentials: {
        email: request.email,
        temporaryPassword: existingUser ? "Tài khoản đã tồn tại, dùng mật khẩu hiện tại." : registeredPassword,
      },
    });
  } catch (err: any) {
    return c.json({ error: err.message || "Failed to approve lecturer request" }, 500);
  }
});

lecturerRequestRouter.post("/admin/lecturer-requests/:requestId/reject", async (c) => {
  const authResult = await requireAdmin(c);
  if (authResult.error) return authResult.error;

  const requestId = c.req.param("requestId");

  try {
    const request = await prisma.lecturerRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      return c.json({ error: "Lecturer request not found" }, 404);
    }

    await prisma.lecturerRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        reviewedAt: new Date(),
        reviewedById: authResult.session!.user.id,
      },
    });

    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message || "Failed to reject lecturer request" }, 500);
  }
});

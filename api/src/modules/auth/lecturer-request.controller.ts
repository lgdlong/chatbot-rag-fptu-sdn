import { randomBytes } from "node:crypto";
import { Hono, type Context } from "hono";
import { auth } from "./auth.js";
import { prisma } from "./services/db.service.js";

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

    if (!name || !email || !reason) {
      return c.json({ error: "Name, email and reason are required" }, 400);
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
      data: { name, email, reason },
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
    let temporaryPassword = "";

    if (!existingUser) {
      temporaryPassword = generateTemporaryPassword();
      const signUpRes = await auth.api.signUpEmail({
        body: {
          name: request.name,
          email: request.email,
          password: temporaryPassword,
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

    return c.json({
      success: true,
      message: "Lecturer request approved successfully.",
      credentials: {
        email: request.email,
        temporaryPassword: temporaryPassword || "Tài khoản đã tồn tại, giữ nguyên mật khẩu hiện tại.",
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

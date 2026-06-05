import { Hono, type Context } from "hono";
import { prisma } from "./services/db.service.js";
import { auth } from "./auth.js";

export const whitelistRouter = new Hono();

async function requireAdmin(c: Context) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    return { error: c.json({ error: "Unauthorized" }, 401) as Response, session: null };
  }

  const role = session.user.role;
  if (role !== "ADMIN") {
    return { error: c.json({ error: "Forbidden: Admin role required" }, 403) as Response, session: null };
  }

  return { error: null, session };
}

// GET /api/whitelist (Phân trang, tìm kiếm)
whitelistRouter.get("/", async (c) => {
  const authResult = await requireAdmin(c);
  if (authResult.error) return authResult.error;

  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "10");
  const q = c.req.query("q")?.trim() || "";

  const skip = (page - 1) * limit;

  try {
    let whereClause: any = {};
    if (q) {
      whereClause.email = {
        contains: q,
        mode: "insensitive",
      };
    }

    const [emails, total] = await Promise.all([
      prisma.emailWhitelist.findMany({
        where: whereClause,
        orderBy: { addedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.emailWhitelist.count({
        where: whereClause,
      }),
    ]);

    return c.json({
      emails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// POST /api/whitelist (Thêm single email)
whitelistRouter.post("/", async (c) => {
  const authResult = await requireAdmin(c);
  if (authResult.error) return authResult.error;

  try {
    const body = await c.req.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }

    // Validate email format basic
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ error: "Invalid email format" }, 400);
    }

    // Check duplicate
    const exists = await prisma.emailWhitelist.findUnique({
      where: { email },
    });

    if (exists) {
      return c.json({ error: "Email already whitelisted" }, 409);
    }

    const newEmail = await prisma.emailWhitelist.create({
      data: { email },
    });

    return c.json({ success: true, email: newEmail }, 201);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// POST /api/whitelist/import (Import nhiều email)
whitelistRouter.post("/import", async (c) => {
  const authResult = await requireAdmin(c);
  if (authResult.error) return authResult.error;

  try {
    const body = await c.req.json();
    const emailsInput = body.emails;

    if (!Array.isArray(emailsInput)) {
      return c.json({ error: "emails must be an array of strings" }, 400);
    }

    const emails = emailsInput
      .map((e) => (typeof e === "string" ? e.trim().toLowerCase() : ""))
      .filter((e) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return e && emailRegex.test(e);
      });

    if (emails.length === 0) {
      return c.json({ error: "No valid emails found in the list" }, 400);
    }

    // Lọc các email đã có trong whitelist
    const existing = await prisma.emailWhitelist.findMany({
      where: { email: { in: emails } },
      select: { email: true },
    });

    const existingSet = new Set(existing.map((e) => e.email));
    const toInsert = emails.filter((e) => !existingSet.has(e));

    if (toInsert.length > 0) {
      await prisma.emailWhitelist.createMany({
        data: toInsert.map((email) => ({ email })),
        skipDuplicates: true,
      });
    }

    return c.json({
      success: true,
      importedCount: toInsert.length,
      skippedCount: emails.length - toInsert.length,
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// DELETE /api/whitelist/:id (Xóa email khỏi whitelist)
whitelistRouter.delete("/:id", async (c) => {
  const authResult = await requireAdmin(c);
  if (authResult.error) return authResult.error;

  const id = c.req.param("id");

  try {
    const exists = await prisma.emailWhitelist.findUnique({
      where: { id },
    });

    if (!exists) {
      return c.json({ error: "Email not found in whitelist" }, 404);
    }

    await prisma.emailWhitelist.delete({
      where: { id },
    });

    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

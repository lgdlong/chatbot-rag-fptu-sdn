import { Hono, type Context } from "hono";
import { auth } from "./auth.js";
import {
  EmailWhitelistService,
  ValidationError,
} from "./services/email-whitelist.service.js";

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

  try {
    const result = await EmailWhitelistService.list({ page, limit, q });
    return c.json(result);
  } catch (err) {
    if (err instanceof ValidationError) {
      return c.json({ error: err.message }, err.status as any);
    }
    return c.json({ error: (err as Error).message }, 500);
  }
});

// POST /api/whitelist (Thêm single email)
whitelistRouter.post("/", async (c) => {
  const authResult = await requireAdmin(c);
  if (authResult.error) return authResult.error;

  try {
    const body = await c.req.json();
    const email = typeof body?.email === "string" ? body.email : "";
    const newEmail = await EmailWhitelistService.add(email);
    return c.json({ success: true, email: newEmail }, 201);
  } catch (err) {
    if (err instanceof ValidationError) {
      return c.json({ error: err.message }, err.status as any);
    }
    return c.json({ error: (err as Error).message }, 500);
  }
});

// POST /api/whitelist/import (Import nhiều email)
whitelistRouter.post("/import", async (c) => {
  const authResult = await requireAdmin(c);
  if (authResult.error) return authResult.error;

  try {
    const body = await c.req.json();
    const result = await EmailWhitelistService.importMany(body?.emails);
    return c.json({ success: true, ...result });
  } catch (err) {
    if (err instanceof ValidationError) {
      return c.json({ error: err.message }, err.status as any);
    }
    return c.json({ error: (err as Error).message }, 500);
  }
});

// DELETE /api/whitelist/:id (Xóa email khỏi whitelist)
whitelistRouter.delete("/:id", async (c) => {
  const authResult = await requireAdmin(c);
  if (authResult.error) return authResult.error;

  const id = c.req.param("id");

  try {
    await EmailWhitelistService.remove(id);
    return c.json({ success: true });
  } catch (err) {
    if (err instanceof ValidationError) {
      return c.json({ error: err.message }, err.status as any);
    }
    return c.json({ error: (err as Error).message }, 500);
  }
});

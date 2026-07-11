/**
 * AdminStatsController — Hono router for admin dashboard statistics endpoints.
 *
 * All routes are mounted at /api/admin/stats and protected by requireAdmin.
 */
import { Hono, type Context } from "hono";
import { auth } from "../auth/auth.js";
import { AdminStatsService } from "./admin.service.js";

export const adminStatsRouter = new Hono();

// ── Auth helper (duplicated from lecturer-admin.controller) ──

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

// ── Routes ──

/**
 * GET /api/admin/stats/dashboard
 * Aggregate counts of all major entity types (users, syllabuses, docs, …).
 */
adminStatsRouter.get("/dashboard", async (c) => {
  const authResult = await requireAdmin(c);
  if (authResult.error) return authResult.error;

  try {
    const stats = await AdminStatsService.getDashboardStats();
    return c.json(stats);
  } catch (err) {
    return c.json({ error: (err as Error).message || "Failed to load dashboard stats" }, 500);
  }
});

/**
 * GET /api/admin/stats/query-trend
 * Monthly RAG query counts from ChatMessage (sender = USER), newest first.
 * Optional query param: ?months=N (default 12).
 */
adminStatsRouter.get("/query-trend", async (c) => {
  const authResult = await requireAdmin(c);
  if (authResult.error) return authResult.error;

  try {
    const months = Math.min(Math.max(Number(c.req.query("months")) || 12, 1), 36);
    const trend = await AdminStatsService.getQueryTrend(months);
    return c.json(trend);
  } catch (err) {
    return c.json({ error: (err as Error).message || "Failed to load query trend" }, 500);
  }
});

/**
 * GET /api/admin/stats/activity
 * Recent audit log entries.
 * Optional query param: ?limit=N (default 20, max 100).
 */
adminStatsRouter.get("/activity", async (c) => {
  const authResult = await requireAdmin(c);
  if (authResult.error) return authResult.error;

  try {
    const limit = Math.min(Math.max(Number(c.req.query("limit")) || 20, 1), 100);
    const activities = await AdminStatsService.getRecentActivity(limit);
    return c.json(activities);
  } catch (err) {
    return c.json({ error: (err as Error).message || "Failed to load activity log" }, 500);
  }
});

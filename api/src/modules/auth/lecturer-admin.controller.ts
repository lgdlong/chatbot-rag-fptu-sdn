import { Hono, type Context } from "hono";
import { auth } from "./auth.js";
import {
  LecturerAdminService,
} from "./services/lecturer-admin.service.js";
import { ValidationError } from "./services/email-whitelist.service.js";

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
    const result = await LecturerAdminService.createLecturer({
      name: typeof body.name === "string" ? body.name : "",
      email: typeof body.email === "string" ? body.email : "",
      adminUserId: authResult.session.user.id,
    });
    return c.json(result);
  } catch (err) {
    if (err instanceof ValidationError) {
      return c.json({ error: err.message }, err.status as any);
    }
    return c.json({ error: (err as Error).message || "Failed to create lecturer" }, 500);
  }
});

// POST /api/admin/disable-lecturer/:userId
// Admin vô hiệu hoá tài khoản giảng viên (set banned = true)
lecturerAdminRouter.post("/disable-lecturer/:userId", async (c) => {
  const authResult = await requireAdmin(c);
  if (authResult.error) return authResult.error;

  const userId = c.req.param("userId");

  try {
    const result = await LecturerAdminService.disableLecturer(
      userId,
      authResult.session.user.id
    );
    return c.json(result);
  } catch (err) {
    if (err instanceof ValidationError) {
      return c.json({ error: err.message }, err.status as any);
    }
    return c.json({ error: (err as Error).message || "Failed to disable lecturer" }, 500);
  }
});

// POST /api/admin/enable-lecturer/:userId
// Admin kích hoạt lại tài khoản giảng viên (set banned = false)
lecturerAdminRouter.post("/enable-lecturer/:userId", async (c) => {
  const authResult = await requireAdmin(c);
  if (authResult.error) return authResult.error;

  const userId = c.req.param("userId");

  try {
    const result = await LecturerAdminService.enableLecturer(
      userId,
      authResult.session.user.id
    );
    return c.json(result);
  } catch (err) {
    if (err instanceof ValidationError) {
      return c.json({ error: err.message }, err.status as any);
    }
    return c.json({ error: (err as Error).message || "Failed to enable lecturer" }, 500);
  }
});

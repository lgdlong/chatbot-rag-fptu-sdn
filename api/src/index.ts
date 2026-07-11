import "./config/env.js"; // Load environment variables first!
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./modules/auth/auth.js";
import { ENV } from "./config/env.js";
import { swaggerUI } from "@hono/swagger-ui";
import { openApiDoc } from "./config/openapi.js";

import { prisma } from "./modules/auth/services/db.service.js";
import { checkDatabaseConnection } from "./utils/db-health.js";
import { logger } from "./utils/logger.js";
import { loggerMiddleware } from "./middlewares/logger.middleware.js";
import { AnythingLlmAdapter } from "./modules/rag/services/anythingllm.adapter.js";

import {
  ragRouter,
} from "./modules/rag/rag.controller.js";
import { internalRouter } from "./modules/documents/document.internal.controller.js";
import { chatRouter } from "./modules/chat/chat.controller.js";
import { curriculumRouter } from "./modules/curriculum/curriculum.controller.js";
import { syllabusRouter } from "./modules/syllabus/syllabus.controller.js";
import { whitelistRouter } from "./modules/auth/whitelist.controller.js";
import { lecturerAdminRouter } from "./modules/auth/lecturer-admin.controller.js";
import { adminStatsRouter } from "./modules/admin/admin.controller.js";

export const app = new Hono();

// Apply global request/response logger middleware first
app.use("*", loggerMiddleware);

// Basic CORS setup for local development
app.use(
  "*",
  cors({
    origin: (origin) => origin, // Reflect origin
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length", "X-Kuma-Revision"],
    credentials: true,
  }),
);

// Serve uploaded documents statically from ./uploads directory
app.use("/uploads/*", serveStatic({ root: "./" }));

// Mount API modules
app.route("/api/courses", ragRouter);
app.route("/api/internal", internalRouter);
app.route("/api/chat", chatRouter);
app.route("/api/curriculum", curriculumRouter);
app.route("/api/syllabus", syllabusRouter);
app.route("/api/whitelist", whitelistRouter);
app.route("/api/admin", lecturerAdminRouter);
app.route("/api/admin/stats", adminStatsRouter);



// Serve OpenAPI document & Swagger UI
app.get("/api/doc", (c) => c.json(openApiDoc));
app.get("/api/docs", swaggerUI({ url: "/api/doc" }));

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

// Detailed Health Check API
app.get("/api/health", async (c) => {
  const start = performance.now();
  let dbStatus = "UP";
  let dbLatency = 0;
  let dbError: string | null = null;
  let anythingLlmStatus = "UP";
  let anythingLlmLatency = 0;
  let anythingLlmError: string | null = null;

  try {
    // Run simple SELECT 1 query to check DB availability and measure latency
    const dbStart = performance.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatency = Math.round(performance.now() - dbStart);
  } catch (err: any) {
    dbStatus = "DOWN";
    dbError = err.message || String(err);
  }

  try {
    const llmStart = performance.now();
    await AnythingLlmAdapter.listWorkspaceSlugs();
    anythingLlmLatency = Math.round(performance.now() - llmStart);
  } catch (err: any) {
    anythingLlmStatus = "DOWN";
    anythingLlmError = err.message || String(err);
  }

  const uptime = process.uptime();
  const memory = process.memoryUsage();
  const status = dbStatus === "UP" && anythingLlmStatus === "UP" ? "UP" : "DOWN";
  const statusCode = status === "UP" ? 200 : 503;

  return c.json(
    {
      status,
      timestamp: new Date().toISOString(),
      latencyMs: Math.round(performance.now() - start),
      services: {
        database: {
          status: dbStatus,
          latencyMs: dbStatus === "UP" ? dbLatency : undefined,
          error: dbError || undefined,
        },
        anythingllm: {
          status: anythingLlmStatus,
          latencyMs: anythingLlmStatus === "UP" ? anythingLlmLatency : undefined,
          error: anythingLlmError || undefined,
        },
      },
      system: {
        uptimeSeconds: Math.round(uptime * 100) / 100,
        memoryUsage: {
          rss: `${Math.round((memory.rss / 1024 / 1024) * 100) / 100} MB`,
          heapTotal: `${Math.round((memory.heapTotal / 1024 / 1024) * 100) / 100} MB`,
          heapUsed: `${Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100} MB`,
          external: `${Math.round((memory.external / 1024 / 1024) * 100) / 100} MB`,
        },
        nodeVersion: process.version,
        platform: process.platform,
      },
    },
    statusCode,
  );
});

// Mount Better Auth endpoints (SignUp, SignIn, Org management, Admin, OpenAPI UI etc.)
app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

// Khởi chạy server sau khi kiểm tra sức khỏe cơ sở dữ liệu thành công
async function startServer() {
  await checkDatabaseConnection();

  serve(
    {
      fetch: app.fetch,
      port: ENV.PORT,
    },
    (info) => {
      logger.info(`Server is running on http://localhost:${info.port}`);
    },
  );
}

startServer().catch((err) => {
  logger.error("Lỗi nghiêm trọng khi khởi chạy server: %O", err);
  process.exit(1);
});

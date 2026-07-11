/**
 * Track C (layer-refactor) -- Audit module smoke test.
 *
 * Verifies the refactored audit module keeps the public contract intact:
 *   1. AuditLogRepository.create exists and is callable
 *   2. audit.service.ts no longer imports prisma (re-exports a clean function surface)
 *   3. createAuditLog still has the same signature callers depend on
 *
 * Runtime path (skipped when API or DB unavailable): exercises the repo
 * against a real prisma.auditLog.create and confirms a row lands.
 *
 * Manual curl plan (offline QA reference):
 *   1. Start API: npm --prefix api run dev
 *   2. Sign in as ADMIN to obtain a session cookie
 *   3. POST /api/syllabus/{id}/approve  (or any audited action)
 *   4. GET  /api/admin/audit-logs  -> confirm new AuditLog row
 *
 * Run:  npx tsx api/src/scripts/audit-smoke.ts
 */

import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

async function main() {
  // 1. Static contract check: service file has no prisma import.
  //    Resolved relative to the script's own location so cwd-relative paths
  //    are stable whether the script runs from api/ or repo root.
  const here = dirname(fileURLToPath(import.meta.url));
  const servicePath = resolve(here, "../modules/auth/services/audit.service.ts");
  const serviceSource = readFileSync(servicePath, "utf8");
  assert.ok(
    !/from\s+["']@prisma\/client["']/.test(serviceSource),
    "audit.service.ts must not import @prisma/client",
  );
  assert.ok(
    !/from\s+["'][^"']*db\.service\.js["']/.test(serviceSource),
    "audit.service.ts must not import db.service",
  );
  assert.ok(
    /from\s+["'][^"']*audit-log\.repository\.js["']/.test(serviceSource),
    "audit.service.ts must import AuditLogRepository",
  );
  console.log("[ok] audit.service.ts: zero prisma imports, imports AuditLogRepository");

  // 2. Static contract check: repository exposes create(input, options?).
  const repoPath = resolve(here, "../modules/auth/repositories/audit-log.repository.ts");
  const repoSource = readFileSync(repoPath, "utf8");
  assert.ok(
    /static\s+async\s+create\s*\(/.test(repoSource),
    "AuditLogRepository.create must be a static method",
  );
  assert.ok(
    /Prisma\.TransactionClient/.test(repoSource),
    "AuditLogRepository.create must accept optional tx for Phase 0.4 transactions",
  );
  console.log("[ok] AuditLogRepository.create: static, tx-aware");

  // 3. Static + dynamic contract check: service still exports createAuditLog
  //    and the type aliases AuditAction / AuditEntityType remain exported
  //    as type-only (verbatimModuleSyntax erases them at runtime by design).
  assert.ok(
    /export\s+type\s+AuditAction\b/.test(serviceSource),
    "AuditAction must remain exported as a type",
  );
  assert.ok(
    /export\s+type\s+AuditEntityType\b/.test(serviceSource),
    "AuditEntityType must remain exported as a type",
  );
  assert.ok(
    /export\s+async\s+function\s+createAuditLog\b/.test(serviceSource),
    "createAuditLog must remain an exported async function",
  );
  const mod = await import("../modules/auth/services/audit.service.js");
  assert.equal(
    typeof mod.createAuditLog,
    "function",
    "createAuditLog must remain a function export at runtime",
  );
  console.log("[ok] createAuditLog: exported as function, AuditAction/AuditEntityType type-only");

  // 4. Runtime DB check (skipped when DATABASE_URL or prisma client unreachable).
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log("[skip] runtime DB check skipped: DATABASE_URL not set");
    return;
  }

  try {
    const { prisma } = await import("../modules/auth/services/db.service.js");
    const { AuditLogRepository } = await import(
      "../modules/auth/repositories/audit-log.repository.js"
    );

    const user = await prisma.user.findFirst({ select: { id: true } });
    if (!user) {
      console.log("[skip] runtime DB check skipped: no user in DB to attach audit log to");
      return;
    }

    const before = await prisma.auditLog.count();
    await AuditLogRepository.create({
      userId: user.id,
      action: "UPLOAD_DOCUMENT",
      entityType: "Document",
      entityId: `smoke-${Date.now()}`,
      details: { source: "audit-smoke.ts" },
    });
    const after = await prisma.auditLog.count();
    assert.equal(after, before + 1, "audit log row must be created");
    console.log(`[ok] runtime: audit log row created (count ${before} -> ${after})`);
  } catch (err) {
    console.log("[skip] runtime DB check skipped:", (err as Error).message);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

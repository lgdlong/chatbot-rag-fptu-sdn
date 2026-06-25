import { strict as assert } from "node:assert";
import { prisma } from "../modules/auth/services/db.service.js";
import { applyIngestionCallback } from "../modules/documents/services/ingestion-callback.service.js";
import { DocumentStatus } from "@prisma/client";

const ORPHAN_AFTER_MINUTES = Number(process.env.ORPHAN_AFTER_MINUTES || 30);

async function main() {
  assert.ok(Number.isFinite(ORPHAN_AFTER_MINUTES) && ORPHAN_AFTER_MINUTES > 0, "ORPHAN_AFTER_MINUTES invalid");

  const threshold = new Date(Date.now() - ORPHAN_AFTER_MINUTES * 60 * 1000);
  const staleDocuments = await prisma.document.findMany({
    where: {
      status: DocumentStatus.PROCESSING,
      createdAt: {
        lt: threshold,
      },
    },
    include: {
      ingestionJob: true,
    },
  });

  let fixedCount = 0;

  for (const document of staleDocuments) {
    await applyIngestionCallback({
      documentId: document.id,
      jobId: document.ingestionJob?.id ?? null,
      status: DocumentStatus.FAILED,
      error: `Orphan cleanup after ${ORPHAN_AFTER_MINUTES} minutes`,
      payload: {
        reason: "orphan-cleanup",
        thresholdMinutes: ORPHAN_AFTER_MINUTES,
      },
    });
    fixedCount += 1;
  }

  console.log(`orphan cleanup done: ${fixedCount} document(s)`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

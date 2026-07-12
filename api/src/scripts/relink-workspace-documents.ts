import "../config/env.js";
import { prisma } from "../modules/auth/services/db.service.js";
import { AnythingLlmAdapter } from "../modules/rag/services/anythingllm.adapter.js";

async function main() {
  const workspaces = await prisma.ragWorkspace.findMany({
    where: {
      anythingLlmId: { not: null },
    },
    include: {
      syllabus: { select: { syllabusName: true, course: { select: { code: true } } } },
    },
    orderBy: { syllabusId: "asc" },
  });

  console.log(`Found ${workspaces.length} RagWorkspace records with anythingLlmId\n`);

  let linked = 0;
  let failed = 0;
  let skipped = 0;

  for (const ws of workspaces) {
    const location = ws.anythingLlmId!;
    const slug = ws.workspaceSlug;
    const label = `${ws.syllabus.course.code}_${ws.syllabusId} (${ws.syllabus.syllabusName})`;

    // Skip if location is empty/whitespace
    if (!location.trim()) {
      console.log(`  ⏭️  [${slug}] ${label} — empty anythingLlmId, skipping`);
      skipped++;
      continue;
    }

    process.stdout.write(`  🔗 [${slug}] ${label}... `);

    try {
      await AnythingLlmAdapter.updateWorkspaceEmbeddings(slug, { adds: [location] });
      console.log(`✅ linked`);
      linked++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`❌ FAILED: ${msg}`);
      failed++;
    }
  }

  console.log(`\nDone. Linked: ${linked}, Failed: ${failed}, Skipped: ${skipped}`);
}

main().catch((error: unknown) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

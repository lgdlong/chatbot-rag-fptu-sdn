import "../config/env.js";
import { prisma } from "../modules/auth/services/db.service.js";
import { SyllabusSyncService } from "../modules/syllabus/services/syllabus-sync.service.js";
import { AnythingLlmAdapter } from "../modules/rag/services/anythingllm.adapter.js";

const ANYTHING_LLM_URL = process.env.ANYTHING_LLM_URL || "http://localhost:3003";
const ANYTHING_LLM_API_KEY = process.env.ANYTHING_LLM_API_KEY || "";

async function getWorkspaceDocCount(slug: string): Promise<number> {
  try {
    const res = await fetch(`${ANYTHING_LLM_URL}/api/v1/workspace/${slug}`, {
      headers: { Authorization: `Bearer ${ANYTHING_LLM_API_KEY}` },
    });
    if (!res.ok) return -1;
    const payload = (await res.json()) as {
      workspace?: { documents?: unknown[] } | { documents?: unknown[] }[];
    };
    const workspaceData = Array.isArray(payload.workspace)
      ? payload.workspace[0]
      : payload.workspace;
    const docs = workspaceData?.documents;
    return Array.isArray(docs) ? docs.length : 0;
  } catch {
    return -1;
  }
}

async function main() {
  const force = process.argv.includes("--force");

  const syllabuses = await prisma.syllabus.findMany({
    where: { isActive: true },
    include: {
      course: { select: { code: true, name: true } },
      ragWorkspace: true,
    },
    orderBy: { id: "asc" },
  });

  console.log(`Found ${syllabuses.length} active syllabuses.`);
  if (force) {
    console.log("Force sync enabled: will sync all syllabuses.");
  } else {
    console.log("Incremental sync: will skip already synced syllabuses.");
  }

  let ok = 0;
  let fail = 0;
  let skipped = 0;

  for (const syllabus of syllabuses) {
    const slug = `${syllabus.course.code.toLowerCase()}_${syllabus.id}`;
    const label = `${syllabus.course.code}_${syllabus.id} (${syllabus.syllabusName})`;

    // Check if already synced
    if (!force && syllabus.ragWorkspace?.syncStatus === "SYNCED") {
      const count = await getWorkspaceDocCount(slug);
      if (count > 0) {
        console.log(`  [${syllabus.id}] ${label}... ⏭️  Skipped (already synced, doc count: ${count})`);
        skipped++;
        ok++;
        continue;
      }
    }

    process.stdout.write(`  [${syllabus.id}] ${label}... `);

    try {
      // Step 1: Do full sync (generate markdown → upload → link)
      await SyllabusSyncService.syncSyllabusToAnythingLlm(syllabus.id);

      // Step 2: Verify and handle rate-limiting/embedding latency
      let synced = false;
      for (let attempt = 0; attempt < 5; attempt++) {
        // Sleep 4 seconds to give embedding time to register
        await new Promise((r) => setTimeout(r, 4000));
        const count = await getWorkspaceDocCount(slug);

        if (count > 0) {
          console.log(`✅ (${count} doc)`);
          ok++;
          synced = true;
          break;
        }
        process.stdout.write(`check[${attempt + 1}]... `);
      }

      if (!synced) {
        process.stdout.write(`rate-limit recovery (waiting 35s)... `);
        await new Promise((r) => setTimeout(r, 35000));
        try {
          // Re-sync after clearing rate limits
          await SyllabusSyncService.syncSyllabusToAnythingLlm(syllabus.id);
          // Wait 5 seconds and check one last time
          await new Promise((r) => setTimeout(r, 5000));
          const count = await getWorkspaceDocCount(slug);
          if (count > 0) {
            console.log(`✅ (${count} doc)`);
            ok++;
            synced = true;
          }
        } catch {
          // Ignore temporary error
        }
      }

      if (!synced) {
        console.log(`❌ still 0 docs after attempts`);
        fail++;
      }

      // Be gentle to the API to stay under 15 RPM
      await new Promise((r) => setTimeout(r, 4000));

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`❌ ${msg}`);
      fail++;
      // If we hit a rate limit error inside AnythingLlmAdapter, wait 45 seconds
      if (msg.includes("429") || msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("rate limit")) {
        console.log("    [Rate Limit Detected] Sleeping for 45s to clear...");
        await new Promise((r) => setTimeout(r, 45000));
      }
    }
  }

  console.log(`\nDone. OK: ${ok} (including skipped: ${skipped}), Failed: ${fail}`);
}

main().catch((error: unknown) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

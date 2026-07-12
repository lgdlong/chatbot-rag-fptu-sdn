import "../config/env.js";
import { SyllabusSyncService } from "../modules/syllabus/services/syllabus-sync.service.js";
import { AnythingLlmAdapter } from "../modules/rag/services/anythingllm.adapter.js";

const LLM_URL = process.env.ANYTHING_LLM_URL || "http://localhost:3003";
const LLM_KEY = process.env.ANYTHING_LLM_API_KEY || "";

async function main() {
  const ids = [12580, 12588]; // fer202, prn232

  for (const id of ids) {
    console.log(`\n=== Syncing syllabus ${id} ===`);
    try {
      await SyllabusSyncService.syncSyllabusToAnythingLlm(id);
      console.log(`syncSyllabusToAnythingLlm(${id}) completed`);

      // Verify: get workspace slug
      const { prisma } = await import("../modules/auth/services/db.service.js");
      const rw = await prisma.ragWorkspace.findUnique({
        where: { syllabusId: id },
        select: { workspaceSlug: true, anythingLlmId: true },
      });
      const slug = rw?.workspaceSlug;
      if (!slug) { console.log(`  No workspace slug for ${id}`); continue; }

      // Poll workspace for docs (handle array response)
      for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const res = await fetch(`${LLM_URL}/api/v1/workspace/${slug}`, {
          headers: { Authorization: `Bearer ${LLM_KEY}` },
        });
        if (!res.ok) { console.log(`  API error ${res.status}`); continue; }
        const payload = await res.json() as { workspace?: unknown[] | { documents?: unknown[] } };
        const ws = payload.workspace;
        const docs = Array.isArray(ws) ? (ws[0] as any)?.documents : (ws as any)?.documents;
        const count = Array.isArray(docs) ? docs.length : 0;
        console.log(`  Attempt ${i + 1}: ${count} doc(s)`);
        if (count > 0) break;
      }

      await prisma.$disconnect();
    } catch (err) {
      console.error(`  FAILED: ${err instanceof Error ? err.message : err}`);
    }
  }
}

main().catch(console.error);

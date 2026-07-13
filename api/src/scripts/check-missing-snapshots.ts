import fs from "node:fs";
import { prisma } from "../modules/auth/services/db.service.js";
import "../config/env.js";

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
  const syllabuses = await prisma.syllabus.findMany({
    where: { isActive: true },
    include: {
      course: { select: { code: true } },
      ragWorkspace: true,
    },
    orderBy: { id: "asc" },
  });

  console.log(`Checking ${syllabuses.length} active syllabuses...\n`);

  const missing: any[] = [];
  const synced: any[] = [];

  for (const syllabus of syllabuses) {
    const slug = `${syllabus.course.code.toLowerCase()}_${syllabus.id}`;
    const label = `${syllabus.course.code}_${syllabus.id}`;

    const dbStatus = syllabus.ragWorkspace?.syncStatus;
    const anythingLlmId = syllabus.ragWorkspace?.anythingLlmId;
    const count = await getWorkspaceDocCount(slug);

    if (dbStatus === "SYNCED" && count > 0) {
      synced.push({ id: syllabus.id, label, count });
    } else {
      missing.push({
        id: syllabus.id,
        label,
        dbStatus: dbStatus || "NO_WORKSPACE_IN_DB",
        count,
      });
    }
  }

  console.log(`--- SYNCED (${synced.length} workspaces) ---`);
  console.log(synced.map(s => `${s.label} (${s.count} docs)`).join(", "));

  console.log(`\n--- MISSING (${missing.length} workspaces) ---`);
  if (missing.length === 0) {
    console.log("None! All workspaces have snapshots.");
  } else {
    console.log(missing.map(m => `${m.label} [DB: ${m.dbStatus}, Docs: ${m.count === -1 ? "API_ERROR" : m.count}]`).join("\n"));
  }
}

main().catch(console.error);

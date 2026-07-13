/**
 * seed-syllabus.ts — Populate syllabuses for NJS curriculum from JSON data.
 *
 * Usage (from api/):
 *   npx tsx src/scripts/seed-syllabus.ts
 *
 * Requires: server running on localhost:8000, lecturer-test@fpt.edu.vn account.
 */

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { CORE_SUBJECTS, SPECIALIZATION_SUBJECTS } from "../../src/constants/core-subjects.js";

// ─── Path helpers ───────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../../..");
const API_BASE = process.env.API_BASE || "http://localhost:8000";

function dataPath(relative: string): string {
  return resolve(ROOT, relative);
}

// ─── Types ──────────────────────────────────────────────────────────────────

interface Metadata {
  syllabusId: number;
  syllabusName: string;
  syllabusNameEnglish: string;
  subjectCode: string;
  credits: number;
  degreeLevel: string;
  timeAllocation: string;
  prerequisites: string;
  description: string;
  studentTasks: string;
  tools: string;
  scoringScale: string;
  decisionNo: string;
  approvedDate: string;
  minAvgMarkToPass: number;
  isApproved: boolean;
  isActive: boolean;
  note: string;
}

interface CloItem {
  cloName: string;
  cloDetails: string;
  loDetails: string;
}

interface ScheduleItem {
  session: number;
  topic: string;
  learningMethod: string;
  lo: string;
  itu: string;
  studentMaterials: string;
  sDownload: string;
  studentTasks: string;
  urls: string;
}

interface AssessmentItem {
  category: string;
  type: string;
  part: string;
  weight: number;
  completionCriteria: string;
  duration: string;
  clo: string;
  questionType: string;
  noQuestion: string;
  knowledgeAndSkill: string;
  gradingGuide: string;
  note: string;
}

interface MaterialItem {
  description: string;
  author: string;
  publisher: string;
  publishedDate: string;
  edition: string;
  isbn: string;
  isMainMaterial: string;
  isHardCopy: string;
  isOnline: string;
  note: string;
}

interface ReferenceItem {
  citation: string;
}

interface SeedSubject {
  code: string;
  courseId: string;
  jsonPath: string;
}

interface SeedResult {
  code: string;
  syllabusId?: number;
  status: "ok" | "skipped" | "failed";
  syncStatus?: string;
  error?: string;
}

// ─── A. loginAsLecturer ─────────────────────────────────────────────────────

async function loginAsLecturer(): Promise<string> {
  const res = await fetch(`${API_BASE}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
    body: JSON.stringify({
      email: "lecturer-test@fpt.edu.vn",
      password: "StudentPassword123!",
    }),
  });

  if (!res.ok) {
    throw new Error(
      `Login failed: HTTP ${res.status} — ${await res.text()}`
    );
  }

  const setCookie = res.headers.getSetCookie?.() ?? [];
  if (setCookie.length === 0) {
    // Fallback: try the older headers.get('set-cookie')
    const fallback = res.headers.get("set-cookie");
    if (!fallback) throw new Error("Login: no Set-Cookie header returned");
    const cookie = fallback.split(";")[0];
    return await verifySession(cookie);
  }

  const cookie = setCookie[0].split(";")[0];
  return await verifySession(cookie);
}

async function verifySession(cookie: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/auth/get-session`, {
    headers: { Cookie: cookie },
  });

  if (!res.ok) {
    throw new Error(`Session verification failed: HTTP ${res.status}`);
  }

  const data = (await res.json()) as { user?: { role?: string } };
  if (data.user?.role !== "LECTURER") {
    throw new Error(
      `Session role is "${data.user?.role ?? "unknown"}", expected "LECTURER"`
    );
  }

  console.log(`  ✅ Logged in as LECTURER (${data.user?.role})`);
  return cookie;
}

// ─── B. parseMetadata ───────────────────────────────────────────────────────

function parseMetadata(raw: Record<string, unknown>): Metadata {
  const credits = raw.credits != null ? parseInt(String(raw.credits), 10) || 3 : 3;
  const minAvg = raw.min_avg_mark_to_pass != null
    ? parseFloat(String(raw.min_avg_mark_to_pass)) || 5.0
    : 5.0;

  let approvedDate = "";
  if (typeof raw.approved_date === "string" && raw.approved_date) {
    const d = new Date(raw.approved_date);
    if (!isNaN(d.getTime())) {
      approvedDate = d.toISOString();
    }
  }

  return {
    syllabusId: raw.syllabus_id != null ? Number(raw.syllabus_id) : 0,
    syllabusName: String(raw.syllabus_name ?? ""),
    syllabusNameEnglish: String(raw.syllabus_name_english ?? ""),
    subjectCode: String(raw.subject_code ?? ""),
    credits,
    degreeLevel: String(raw.degree_level || "Bachelor"),
    timeAllocation: String(raw.time_allocation ?? ""),
    prerequisites: String(raw.prerequisites ?? ""),
    description: String(raw.description ?? ""),
    studentTasks: String(raw.student_tasks ?? ""),
    tools: String(raw.tools ?? ""),
    scoringScale: String(raw.scoring_scale || "10"),
    decisionNo: String(raw.decision_no ?? ""),
    approvedDate,
    minAvgMarkToPass: minAvg,
    isApproved: String(raw.is_approved ?? "").toLowerCase() === "true",
    isActive: String(raw.is_active ?? "").toLowerCase() === "true",
    note: String(raw.note ?? ""),
  };
}

// ─── C. parseClos ───────────────────────────────────────────────────────────

function parseClos(raw: Array<Record<string, unknown>>): CloItem[] {
  return raw.map((c) => {
    let name = String(c.clo_name ?? "");
    // If the clo_name is numeric, format as "CLO{N}"
    if (/^\d+$/.test(name)) {
      name = `CLO${name}`;
    }
    return {
      cloName: name,
      cloDetails: String(c.clo_details ?? ""),
      loDetails: String(c.lo_details ?? ""),
    };
  });
}

// ─── D. parseSchedule ───────────────────────────────────────────────────────

function parseSchedule(raw: Array<Record<string, unknown>>): ScheduleItem[] {
  return raw.map((s) => ({
    session: parseInt(String(s.session ?? "0"), 10) || 0,
    topic: String(s.topic ?? ""),
    learningMethod: String(s.learning_method ?? ""),
    lo: String(s.lo ?? ""),
    itu: String(s.itu ?? ""),
    studentMaterials: String(s.student_materials ?? ""),
    sDownload: String(s.s_download ?? ""),
    studentTasks: String(s.student_tasks ?? ""),
    urls: String(s.urls ?? ""),
  }));
}

// ─── E. parseAssessments ────────────────────────────────────────────────────

function parseAssessments(
  raw: Array<Record<string, unknown>>
): AssessmentItem[] {
  return raw.map((a) => {
    const weightStr = String(a.weight ?? "0").replace("%", "").trim();
    return {
      category: String(a.category ?? ""),
      type: String(a.type ?? ""),
      part: String(a.part ?? ""),
      weight: parseFloat(weightStr) || 0,
      completionCriteria: String(a.completion_criteria ?? ""),
      duration: String(a.duration ?? ""),
      clo: String(a.clo ?? ""),
      questionType: String(a.question_type ?? ""),
      noQuestion: String(a.no_question ?? ""),
      knowledgeAndSkill: String(a.knowledge_and_skill ?? ""),
      gradingGuide: String(a.grading_guide ?? ""),
      note: String(a.note ?? ""),
    };
  });
}

// ─── F. parseMaterials ──────────────────────────────────────────────────────

function parseMaterials(raw: Array<Record<string, unknown>>): MaterialItem[] {
  return raw.map((m) => ({
    description: String(m.description ?? ""),
    author: String(m.author ?? ""),
    publisher: String(m.publisher ?? ""),
    publishedDate: String(m.published_date ?? ""),
    edition: String(m.edition ?? ""),
    isbn: String(m.isbn ?? ""),
    isMainMaterial: String(m.is_main_material ?? ""),
    isHardCopy: String(m.is_hard_copy ?? ""),
    isOnline: String(m.is_online ?? ""),
    note: String(m.note ?? ""),
  }));
}

// ─── G. parseReferences ─────────────────────────────────────────────────────

const REFERENCE_SKIP_PATTERNS = [
  "Read textbook",
  "Learn materrials",
  "Discuss key points",
  "Redo sample",
  "Do Assignment",
  "Read materia",
];

function parseReferences(raw: Array<unknown>): ReferenceItem[] {
  const items: ReferenceItem[] = [];
  for (const r of raw) {
    const text = String(r ?? "");
    const skip = REFERENCE_SKIP_PATTERNS.some((pat) => text.includes(pat));
    if (!skip && text.trim()) {
      items.push({ citation: text.trim() });
    }
  }
  return items;
}

// ─── H. API callers ─────────────────────────────────────────────────────────

function apiHeaders(cookie: string): Record<string, string> {
  return {
    Cookie: cookie,
    "Content-Type": "application/json",
  };
}

async function createSyllabus(
  cookie: string,
  courseId: string,
  meta: Metadata
): Promise<number> {
  const res = await fetch(`${API_BASE}/api/syllabus`, {
    method: "POST",
    headers: apiHeaders(cookie),
    body: JSON.stringify({
      courseId,
      syllabusName: meta.syllabusName,
      syllabusNameEnglish: meta.syllabusNameEnglish || undefined,
      credits: meta.credits,
      prerequisites: meta.prerequisites || undefined,
      description: meta.description || undefined,
      studentTasks: meta.studentTasks || undefined,
      tools: meta.tools || undefined,
      minAvgMarkToPass: meta.minAvgMarkToPass,
      decisionNo: meta.decisionNo || undefined,
      note: meta.note || undefined,
      degreeLevel: meta.degreeLevel || undefined,
      timeAllocation: meta.timeAllocation || undefined,
      scoringScale: meta.scoringScale || undefined,
    }),
  });

  if (res.status === 401) {
    throw new Error("Auth expired — session cookie invalid");
  }

  if (res.status >= 500) {
    // Retry once
    console.warn("  ⚠️  Server error on createSyllabus, retrying...");
    const retryRes = await fetch(`${API_BASE}/api/syllabus`, {
      method: "POST",
      headers: apiHeaders(cookie),
      body: JSON.stringify({
        courseId,
        syllabusName: meta.syllabusName,
        syllabusNameEnglish: meta.syllabusNameEnglish || undefined,
        credits: meta.credits,
        prerequisites: meta.prerequisites || undefined,
        description: meta.description || undefined,
        studentTasks: meta.studentTasks || undefined,
        tools: meta.tools || undefined,
        minAvgMarkToPass: meta.minAvgMarkToPass,
        decisionNo: meta.decisionNo || undefined,
        note: meta.note || undefined,
        degreeLevel: meta.degreeLevel || undefined,
        timeAllocation: meta.timeAllocation || undefined,
        scoringScale: meta.scoringScale || undefined,
      }),
    });

    if (!retryRes.ok) {
      throw new Error(
        `Create syllabus failed (retry): HTTP ${retryRes.status} — ${await retryRes.text()}`
      );
    }

    const data = (await retryRes.json()) as {
      syllabus: { id: number };
    };
    return data.syllabus.id;
  }

  if (res.status >= 400) {
    throw new Error(
      `Create syllabus skipped: HTTP ${res.status} — ${await res.text()}`
    );
  }

  const data = (await res.json()) as { syllabus: { id: number } };
  return data.syllabus.id;
}

async function fillSyllabus(
  cookie: string,
  syllabusId: number,
  meta: Metadata,
  materials: MaterialItem[],
  clos: CloItem[],
  schedules: ScheduleItem[],
  assessments: AssessmentItem[],
  references: ReferenceItem[]
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/syllabus/${syllabusId}`, {
    method: "PUT",
    headers: apiHeaders(cookie),
    body: JSON.stringify({
      syllabusName: meta.syllabusName,
      syllabusNameEnglish: meta.syllabusNameEnglish || undefined,
      credits: meta.credits,
      prerequisites: meta.prerequisites || undefined,
      description: meta.description || undefined,
      studentTasks: meta.studentTasks || undefined,
      tools: meta.tools || undefined,
      minAvgMarkToPass: meta.minAvgMarkToPass,
      decisionNo: meta.decisionNo || undefined,
      note: meta.note || undefined,
      degreeLevel: meta.degreeLevel || undefined,
      timeAllocation: meta.timeAllocation || undefined,
      scoringScale: meta.scoringScale || undefined,
      materials,
      clos,
      schedules,
      assessments,
      references,
      questions: [],
      videoLinks: [],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Fill syllabus failed: HTTP ${res.status} — ${text}`);
  }
}

async function approveSyllabus(
  cookie: string,
  id: number
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/syllabus/${id}/approve`, {
    method: "PATCH",
    headers: apiHeaders(cookie),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Approve syllabus failed: HTTP ${res.status} — ${text}`
    );
  }
}

async function activateSyllabus(
  cookie: string,
  id: number
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/syllabus/${id}/activate`, {
    method: "PATCH",
    headers: apiHeaders(cookie),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Activate syllabus failed: HTTP ${res.status} — ${text}`
    );
  }
}

// ─── I. getSubjectsToSeed ───────────────────────────────────────────────────

function getSubjectsToSeed(prisma: PrismaClient): Promise<SeedSubject[]> {
  // Build the set of NJS curriculum codes
  const njsCodes = new Set<string>();
  const njsSpec = SPECIALIZATION_SUBJECTS["NJS"] ?? [];

  for (const s of CORE_SUBJECTS) {
    // Remove TMI101 — no JSON data
    if (s.code === "TMI101") continue;
    njsCodes.add(s.code.toUpperCase());
  }

  for (const s of njsSpec) {
    // Remove FER202 — already has active syllabus
    if (s.code === "FER202") continue;
    njsCodes.add(s.code.toUpperCase());
  }

  return (async () => {
    // Query all courses from DB
    const courses = await prisma.course.findMany({
      select: { id: true, code: true },
      orderBy: { code: "asc" },
    });

    const codeToId = new Map<string, string>();
    for (const c of courses) {
      codeToId.set(c.code.toUpperCase(), c.id);
    }

    // Read manifest
    const manifestRaw = readFileSync(
      dataPath("data/subjects/manifest.json"),
      "utf-8"
    );
    const manifest = JSON.parse(manifestRaw) as {
      subjects: Record<
        string,
        {
          syl_id: string;
          subject_code: string;
          files: { json: string };
        }
      >;
    };

    // Build subject_code → json path from manifest
    const jsonPathByCode = new Map<string, string>();
    for (const entry of Object.values(manifest.subjects)) {
      const code = entry.subject_code.toUpperCase();
      if (!jsonPathByCode.has(code)) {
        jsonPathByCode.set(code, entry.files.json);
      }
    }

    // Idempotency: skip subject codes that already have an active+approved syllabus
    const existingActive = await prisma.syllabus.findMany({
      where: { isActive: true, isApproved: true },
      select: { courseId: true },
    });
    const activeCourseIds = new Set(existingActive.map((s) => s.courseId));

    const results: SeedSubject[] = [];

    for (const code of njsCodes) {
      // Idempotency check per subject
      const courseId = codeToId.get(code);
      if (courseId && activeCourseIds.has(courseId)) {
        console.log(`  ⏭️  ${code} — already has active syllabus, skipping`);
        continue;
      }
      if (!courseId) {
        console.warn(
          `  ⚠️  Subject ${code}: no matching course in DB — skipping`
        );
        continue;
      }

      const jsonPath = jsonPathByCode.get(code);
      if (!jsonPath) {
        console.warn(
          `  ⚠️  Subject ${code}: no JSON data in manifest — skipping`
        );
        continue;
      }

      results.push({ code, courseId, jsonPath });
    }

    return results;
  })();
}

// ─── I-sleep helper ─────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── J. seedOneSubject ──────────────────────────────────────────────────────

async function seedOneSubject(
  cookie: string,
  subject: SeedSubject,
  prisma: PrismaClient
): Promise<SeedResult> {
  const { code, courseId, jsonPath } = subject;
  console.log(`\n📘 [${code}] Starting...`);

  // 1. Parse JSON
  const fullPath = dataPath(jsonPath);
  let rawJson: Record<string, unknown>;
  try {
    rawJson = JSON.parse(readFileSync(fullPath, "utf-8"));
  } catch (err) {
    return { code, status: "failed", error: `Cannot read JSON: ${err}` };
  }

  const meta = parseMetadata(rawJson.metadata as Record<string, unknown>);
  const materials = parseMaterials(
    (rawJson.materials as Array<Record<string, unknown>>) ?? []
  );
  const clos = parseClos(
    (rawJson.clos as Array<Record<string, unknown>>) ?? []
  );
  const schedules = parseSchedule(
    (rawJson.schedule as Array<Record<string, unknown>>) ?? []
  );
  const assessments = parseAssessments(
    (rawJson.assessment_scheme as Array<Record<string, unknown>>) ?? []
  );
  const references = parseReferences(
    (rawJson.references as Array<unknown>) ?? []
  );

  // 2. Create
  let syllabusId: number;
  try {
    syllabusId = await createSyllabus(cookie, courseId, meta);
    console.log(`  ✅ Created syllabus id=${syllabusId}`);
  } catch (err) {
    return {
      code,
      status: "failed",
      error: `Create: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  await sleep(500);

  // 3. Fill
  try {
    await fillSyllabus(
      cookie,
      syllabusId,
      meta,
      materials,
      clos,
      schedules,
      assessments,
      references
    );
    console.log("  ✅ Filled");
  } catch (err) {
    return {
      code,
      syllabusId,
      status: "failed",
      error: `Fill: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  await sleep(500);

  // 4. Approve
  try {
    await approveSyllabus(cookie, syllabusId);
    console.log("  ✅ Approved");
  } catch (err) {
    return {
      code,
      syllabusId,
      status: "failed",
      error: `Approve: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  await sleep(500);

  // 5. Activate
  try {
    await activateSyllabus(cookie, syllabusId);
    console.log("  ✅ Activated");
  } catch (err) {
    return {
      code,
      syllabusId,
      status: "failed",
      error: `Activate: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  await sleep(500);

  // 6. Verify sync
  let syncStatus = "pending";
  for (let attempt = 0; attempt < 3; attempt++) {
    await sleep(2000);
    const ws = await prisma.ragWorkspace.findUnique({
      where: { syllabusId },
      select: { syncStatus: true },
    });

    if (ws?.syncStatus === "SYNCED") {
      syncStatus = "SYNCED";
      console.log("  ✅ Sync: SYNCED");
      break;
    }

    if (ws?.syncStatus === "FAILED") {
      syncStatus = "FAILED";
      console.warn(`  ⚠️  Sync: FAILED for ${code}`);
      break;
    }

    if (attempt === 2) {
      if (!ws?.syncStatus) {
        console.warn(`  ⚠️  Sync: pending (no status yet)`);
      } else {
        syncStatus = ws.syncStatus;
        console.warn(`  ⚠️  Sync: ${ws.syncStatus}`);
      }
    }
  }

  return { code, syllabusId, status: "ok", syncStatus };
}

// ─── K. main ────────────────────────────────────────────────────────────────

async function main() {
  const prisma = new PrismaClient();

  console.log("🔐 Logging in as lecturer...");
  let cookie: string;
  try {
    cookie = await loginAsLecturer();
  } catch (err) {
    console.error("❌ Auth failure:", err);
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log("\n📋 Loading subjects to seed...");
  const subjects = await getSubjectsToSeed(prisma);
  console.log(`Found ${subjects.length} subjects to seed.\n`);

  const results: SeedResult[] = [];

  for (const subject of subjects) {
    const result = await seedOneSubject(cookie, subject, prisma);
    results.push(result);
  }

  // ─── Summary ──────────────────────────────────────────────────────────

  console.log("\n\n================================================");
  console.log("📊 SUMMARY");
  console.log("================================================");
  console.log("|---|-------|------|----------|");
  for (const r of results) {
    const idStr = r.syllabusId ? String(r.syllabusId) : "-";
    const statusStr = r.status === "ok" ? "ok" : r.status;
    const syncStr =
      r.status === "ok" ? (r.syncStatus ?? "pending") : "-";
    console.log(`| ${r.code.padEnd(8)} | ${idStr.padEnd(5)} | ${statusStr.padEnd(4)} | ${syncStr.padEnd(8)} |`);
  }
  console.log("|---|-------|------|----------|");

  const ok = results.filter((r) => r.status === "ok").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const failed = results.filter((r) => r.status === "failed").length;

  console.log(`\n✅ OK: ${ok}  ⏭️  Skipped: ${skipped}  ❌ Failed: ${failed}`);

  if (failed > 0) {
    console.log("\n❌ Failures:");
    for (const r of results) {
      if (r.status === "failed") {
        console.log(`  - ${r.code}: ${r.error ?? "unknown"}`);
      }
    }
  }

  await prisma.$disconnect();

  if (failed > 0) {
    process.exit(1);
  }

  console.log("\n🎉 Done!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});

import "../config/env.js";
import { prisma } from "../modules/auth/services/db.service.js";

const course = await prisma.course.findFirst({ where: { code: "SWD392" } });
if (!course) { console.log("SWD392 not found"); process.exit(0); }

// Check RagWorkspace for SWD392
const workspaces = await prisma.ragWorkspace.findMany({
  where: { syllabus: { courseId: course.id } },
  include: { syllabus: { select: { id: true, syllabusName: true } } },
});
console.log("RagWorkspace entries for SWD392:");
if (workspaces.length === 0) console.log("  NONE");
for (const w of workspaces) {
  console.log(`  id=${w.id} syllabusId=${w.syllabusId} slug=${w.workspaceSlug} name=${w.workspaceName} syncStatus=${w.syncStatus} anythingLlmId=${w.anythingLlmId}`);
}

// Also check what findFirstActiveSyllabus returns
const activeSyl = await prisma.syllabus.findFirst({
  where: { courseId: course.id, isActive: true, isApproved: true },
  orderBy: { id: "desc" },
});
console.log(`\nFirst active syllabus (desc): #${activeSyl?.id} - ${activeSyl?.syllabusName}`);

const activeSylAsc = await prisma.syllabus.findFirst({
  where: { courseId: course.id, isActive: true, isApproved: true },
  orderBy: { id: "asc" },
});
console.log(`First active syllabus (asc): #${activeSylAsc?.id} - ${activeSylAsc?.syllabusName}`);

await prisma.$disconnect();

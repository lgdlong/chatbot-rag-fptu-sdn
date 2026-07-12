import "../config/env.js";
import { prisma } from "../modules/auth/services/db.service.js";

// Find NJS curriculum
const curriculum = await prisma.curriculum.findUnique({
  where: { curriculumId: "BIT_SE_NJS_19B" },
});
if (!curriculum) { console.log("NJS curriculum not found"); process.exit(0); }

// Get all courses in NJS curriculum
const subjects = await prisma.curriculumSubject.findMany({
  where: { curriculumId: curriculum.id },
  include: { course: true },
  orderBy: [{ semesterNo: "asc" }, { course: { code: "asc" } }],
});

console.log(`NJS curriculum has ${subjects.length} subjects`);

let seeded = 0, empty = 0, missing = 0;

for (const subj of subjects) {
  const syllabus = await prisma.syllabus.findFirst({
    where: { courseId: subj.courseId, isActive: true, isApproved: true },
    select: { id: true },
  });
  if (!syllabus) {
    console.log(`  MISSING: ${subj.course.code} (sem ${subj.semesterNo})`);
    missing++;
    continue;
  }
  // Check for child data
  const [sched, mat, clo, assess] = await Promise.all([
    prisma.syllabusSchedule.count({ where: { syllabusId: syllabus.id } }),
    prisma.syllabusMaterial.count({ where: { syllabusId: syllabus.id } }),
    prisma.syllabusClo.count({ where: { syllabusId: syllabus.id } }),
    prisma.assessmentScheme.count({ where: { syllabusId: syllabus.id } }),
  ]);
  if (sched + mat + clo + assess === 0) {
    console.log(`  EMPTY: ${subj.course.code} - syllabus #${syllabus.id} has 0 child rows`);
    empty++;
  } else {
    seeded++;
  }
}

console.log(`\nSummary: ${seeded} seeded, ${empty} empty, ${missing} missing`);
await prisma.$disconnect();

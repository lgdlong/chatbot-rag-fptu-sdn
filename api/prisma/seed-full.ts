/**
 * Seed Full — populates ALL 48 courses per curriculum, both NJS and NET.
 * 
 * Run: npx tsx prisma/seed-full.ts
 * 
 * Unlike seed.ts (which deletes everything), this script uses upsert
 * so you can run it on existing data without wiping users/syllabuses.
 * 
 * Hierarchy created:
 *   Major SE
 *     ├── Specialization NJS → Curriculum BIT_SE_NJS_19B (48 subjects)
 *     └── Specialization NET → Curriculum BIT_SE_NET_19B (48 subjects)
 */

import { PrismaClient } from '@prisma/client';
import { CORE_SUBJECTS, SPECIALIZATION_SUBJECTS } from '../src/constants/core-subjects.js';

const prisma = new PrismaClient();

async function upsertMajor(code: string, name: string, description: string) {
  return prisma.major.upsert({
    where: { code },
    update: { name, description },
    create: { code, name, description },
  });
}

async function upsertSpecialization(majorId: string, code: string, name: string, description: string) {
  return prisma.specialization.upsert({
    where: { code },
    update: { majorId, name, description },
    create: { majorId, code, name, description },
  });
}

async function upsertCourse(code: string, name: string) {
  return prisma.course.upsert({
    where: { code },
    update: { name },
    create: { code, name },
  });
}

async function upsertCurriculum(
  curriculumId: string,
  majorId: string,
  specializationId: string | null,
  batchCode: string,
) {
  return prisma.curriculum.upsert({
    where: { curriculumId },
    update: { majorId, specializationId, batchCode },
    create: { curriculumId, majorId, specializationId, batchCode },
  });
}

async function upsertCurriculumSubject(
  curriculumId: string,
  courseId: string,
  semesterNo: number,
  isSpecializationSpecific: boolean,
) {
  const existing = await prisma.curriculumSubject.findUnique({
    where: { curriculumId_courseId: { curriculumId, courseId } },
  });
  if (existing) {
    return prisma.curriculumSubject.update({
      where: { id: existing.id },
      data: { semesterNo, isSpecializationSpecific },
    });
  }
  return prisma.curriculumSubject.create({
    data: { curriculumId, courseId, semesterNo, isSpecializationSpecific },
  });
}

async function main() {
  console.log('🌱 Seeding full curricula (NJS + NET)...\n');

  // 1. Upsert Major SE
  const majorSE = await upsertMajor(
    'SE',
    'Software Engineering',
    'Kỹ thuật phần mềm - Đại học FPT',
  );
  console.log('✅ Major SE');

  // 2. Upsert Specializations
  const specNJS = await upsertSpecialization(
    majorSE.id,
    'NJS',
    'React & NodeJS Fullstack',
    'Chuyên sâu phát triển ứng dụng Web hiện đại với NodeJS và React',
  );
  const specNET = await upsertSpecialization(
    majorSE.id,
    'NET',
    '.NET Cross-platform',
    'Chuyên sâu phát triển ứng dụng doanh nghiệp đa nền tảng với .NET',
  );
  console.log('✅ Specializations NJS + NET');

  // 3. Upsert ALL 48 courses (44 core + 4 NJS + 4 NET = 48 unique)
  const allCourseCodes = new Set<string>();
  for (const s of CORE_SUBJECTS) allCourseCodes.add(s.code);
  for (const s of SPECIALIZATION_SUBJECTS.NJS) allCourseCodes.add(s.code);
  for (const s of SPECIALIZATION_SUBJECTS.NET) allCourseCodes.add(s.code);

  const courseMap = new Map<string, string>(); // code → id
  for (const code of allCourseCodes) {
    const entry =
      CORE_SUBJECTS.find((c) => c.code === code) ??
      SPECIALIZATION_SUBJECTS.NJS.find((c) => c.code === code) ??
      SPECIALIZATION_SUBJECTS.NET.find((c) => c.code === code)!;
    const course = await upsertCourse(code, entry.name);
    courseMap.set(code, course.id);
  }
  console.log(`✅ ${allCourseCodes.size} courses upserted`);

  // 4. Upsert Curricula
  const currNJS = await upsertCurriculum('BIT_SE_NJS_19B', majorSE.id, specNJS.id, '19B');
  const currNET = await upsertCurriculum('BIT_SE_NET_19B', majorSE.id, specNET.id, '19B');
  console.log('✅ Curricula BIT_SE_NJS_19B + BIT_SE_NET_19B');

  // 5. Assign subjects to NJS curriculum (44 core + 4 NJS-specific)
  const njsSpecificCodes = new Set(SPECIALIZATION_SUBJECTS.NJS.map((s) => s.code));
  for (const s of CORE_SUBJECTS) {
    await upsertCurriculumSubject(currNJS.id, courseMap.get(s.code)!, s.semesterNo, false);
  }
  for (const s of SPECIALIZATION_SUBJECTS.NJS) {
    await upsertCurriculumSubject(currNJS.id, courseMap.get(s.code)!, s.semesterNo, true);
  }
  console.log(`✅ NJS: 44 core + ${SPECIALIZATION_SUBJECTS.NJS.length} specific = 48 subjects`);

  // 6. Assign subjects to NET curriculum (44 core + 4 NET-specific)
  for (const s of CORE_SUBJECTS) {
    await upsertCurriculumSubject(currNET.id, courseMap.get(s.code)!, s.semesterNo, false);
  }
  for (const s of SPECIALIZATION_SUBJECTS.NET) {
    await upsertCurriculumSubject(currNET.id, courseMap.get(s.code)!, s.semesterNo, true);
  }
  console.log(`✅ NET: 44 core + ${SPECIALIZATION_SUBJECTS.NET.length} specific = 48 subjects`);

  console.log('\n🎉 Seed full hoàn tất!');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error('❌', e);
    prisma.$disconnect().then(() => process.exit(1));
  });

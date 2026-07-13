import "../config/env.js";
import { prisma } from "../modules/auth/services/db.service.js";

const ids = [20, 23, 96, 97, 98]; // JPD113, JPD123, SWR302, SWT301, SWD392

// Deactivate so seed script doesn't skip them
await prisma.syllabus.updateMany({
  where: { id: { in: ids } },
  data: { isActive: false },
});

const codes = ["JPD113", "JPD123", "SWR302", "SWT301", "SWD392"];
const courses = await prisma.course.findMany({
  where: { code: { in: codes } },
  select: { id: true, code: true },
});
const courseIds = new Set(courses.map(c => c.id));

// Also deactivate any other active syllabuses for these courses
await prisma.syllabus.updateMany({
  where: { courseId: { in: [...courseIds] }, isActive: true },
  data: { isActive: false },
});

console.log("Deactivated syllabuses for:", codes.join(", "));
await prisma.$disconnect();

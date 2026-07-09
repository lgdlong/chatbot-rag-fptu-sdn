import { ApiSyllabusSummary } from "@/lib/api";

export interface Subject {
  code: string;
  name: string;
  credits: number;
  decision: string;
  isActive: boolean;
  isApproved: boolean;
  syllabusId: string;
  syllabusName: string;
  department: string;
  color: string;
}

// Color palette for dynamic assignment
const SUBJECT_COLORS = [
  "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444",
  "#06b6d4", "#ec4899", "#14b8a6", "#f97316", "#6366f1",
];

/**
 * Convert API syllabus summary to frontend Subject shape.
 */
export function mapSyllabusToSubject(syllabus: ApiSyllabusSummary, index: number = 0): Subject {
  return {
    code: syllabus.course.code,
    name: syllabus.course.name,
    credits: syllabus.credits,
    decision: syllabus.decisionNo || "",
    isActive: syllabus.isActive,
    isApproved: syllabus.isApproved,
    syllabusId: String(syllabus.id),
    syllabusName: syllabus.syllabusNameEnglish || syllabus.syllabusName,
    department: "FPT University",
    color: SUBJECT_COLORS[index % SUBJECT_COLORS.length],
  };
}

// Keep static fallback for when API is unavailable
export const ALL_SUBJECTS: Subject[] = [
  {
    code: "FER202",
    name: "Front-End web development with React",
    credits: 3,
    decision: "359/QĐ-ĐHFPT dated 04/09/2025",
    isActive: true,
    isApproved: true,
    syllabusId: "12580",
    syllabusName: "Front-End web development with React_Phát triển web Front-End với React",
    department: "Software Engineering",
    color: "#3b82f6",
  },
  {
    code: "SDN302",
    name: "Server-Side development with NodeJS",
    credits: 3,
    decision: "412/QĐ-ĐHFPT dated 15/06/2025",
    isActive: true,
    isApproved: true,
    syllabusId: "12582",
    syllabusName: "Server-Side development with NodeJS_Phát triển phía Server với NodeJS",
    department: "Software Engineering",
    color: "#10b981",
  },
  {
    code: "SWD392",
    name: "Software Architecture and Design",
    credits: 3,
    decision: "201/QĐ-ĐHFPT dated 18/02/2025",
    isActive: true,
    isApproved: true,
    syllabusId: "12585",
    syllabusName: "Software Architecture and Design_Thiết kế và Kiến trúc phần mềm",
    department: "Software Engineering",
    color: "#ef4444",
  },
];

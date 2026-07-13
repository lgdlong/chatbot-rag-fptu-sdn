/**
 * Core subjects shared across all SE curricula (44 subjects).
 * Each specialization adds 4 specific subjects on top.
 * 
 * Source: docs/research/srs-data/other_cur.txt (BIT_SE_NET_19B)
 * All subjects except the 4 NET-specific ones.
 */

export interface CoreSubjectEntry {
  code: string;
  name: string;
  semesterNo: number; // 0 = foundational (non-term), 1-9 = academic semester
}

/**
 * 44 core subjects — common to ALL SE specializations.
 * Only the 4 isSpecializationSpecific=true subjects differ per spec.
 */
export const CORE_SUBJECTS: CoreSubjectEntry[] = [
  // Term 0 — Foundational / Non-term
  { code: 'VOV114', name: 'Vovinam 1', semesterNo: 0 },
  { code: 'VOV124', name: 'Vovinam 2', semesterNo: 0 },
  { code: 'VOV134', name: 'Vovinam 3', semesterNo: 0 },
  { code: 'TRS601', name: 'English 6 (University success)', semesterNo: 0 },
  { code: 'TMI101', name: 'Traditional musical instrument', semesterNo: 0 },
  { code: 'OTP101', name: 'Orientation and General Training Program', semesterNo: 0 },
  // Term 1
  { code: 'CSI106', name: 'Introduction to Computer Science', semesterNo: 1 },
  { code: 'SSL101c', name: 'Academic Skills for University Success', semesterNo: 1 },
  { code: 'PRF192', name: 'Programming Fundamentals', semesterNo: 1 },
  { code: 'MAE101', name: 'Mathematics for Engineering', semesterNo: 1 },
  { code: 'CEA201', name: 'Computer Organization and Architecture', semesterNo: 1 },
  // Term 2
  { code: 'PRO192', name: 'Object-Oriented Programming', semesterNo: 2 },
  { code: 'MAD101', name: 'Discrete mathematics', semesterNo: 2 },
  { code: 'OSG202', name: 'Operating Systems', semesterNo: 2 },
  { code: 'NWC204', name: 'Computer Networking', semesterNo: 2 },
  { code: 'SSG104', name: 'Communication and In-Group Working Skills', semesterNo: 2 },
  // Term 3
  { code: 'CSD201', name: 'Data Structures and Algorithms', semesterNo: 3 },
  { code: 'DBI202', name: 'Database Systems', semesterNo: 3 },
  { code: 'LAB211', name: 'OOP with Java Lab', semesterNo: 3 },
  { code: 'JPD113', name: 'Elementary Japanese 1- A1.1', semesterNo: 3 },
  { code: 'WED201c', name: 'Web Design', semesterNo: 3 },
  // Term 4
  { code: 'SWE201c', name: 'Introduction to Software Engineering', semesterNo: 4 },
  { code: 'JPD123', name: 'Elementary Japanese 1-A1.2', semesterNo: 4 },
  { code: 'IOT102', name: 'Internet of Things', semesterNo: 4 },
  { code: 'PRJ301', name: 'Java Web application development', semesterNo: 4 },
  { code: 'MAS291', name: 'Statistics & Probability', semesterNo: 4 },
  // Term 5
  { code: 'SWR302', name: 'Software Requirements', semesterNo: 5 },
  { code: 'SWT301', name: 'Software Testing', semesterNo: 5 },
  { code: 'SWP391', name: 'Software development project', semesterNo: 5 },
  { code: 'WDU203c', name: 'The UI/UX Design', semesterNo: 5 },
  // Term 6
  { code: 'ENW493c', name: 'Research Methods & Academic Writing Skills', semesterNo: 6 },
  { code: 'OJT202', name: 'On the job training', semesterNo: 6 },
  // Term 7
  { code: 'EXE101', name: 'Experiential Entrepreneurship 1', semesterNo: 7 },
  { code: 'PMG201c', name: 'Project Management', semesterNo: 7 },
  { code: 'SWD392', name: 'Software Architecture and Design', semesterNo: 7 },
  // Term 8
  { code: 'PRM393', name: 'Mobile Programming', semesterNo: 8 },
  { code: 'EXE201', name: 'Experiential Entrepreneurship 2', semesterNo: 8 },
  { code: 'ITE302c', name: 'Ethics in IT', semesterNo: 8 },
  { code: 'MLN122', name: 'Political economics of Marxism – Leninism', semesterNo: 8 },
  { code: 'MLN111', name: 'Philosophy of Marxism – Leninism', semesterNo: 8 },
  // Term 9
  { code: 'MLN131', name: 'Scientific socialism', semesterNo: 9 },
  { code: 'VNR202', name: 'History of Vietnam Communist Party', semesterNo: 9 },
  { code: 'HCM202', name: 'Ho Chi Minh Ideology', semesterNo: 9 },
  { code: 'SEP490', name: 'SE Capstone Project', semesterNo: 9 },
];

/**
 * Specialization-specific subjects (4 per spec).
 * key = specialization code, value = 4 unique subjects.
 */
export const SPECIALIZATION_SUBJECTS: Record<string, CoreSubjectEntry[]> = {
  NJS: [
    { code: 'FER202', name: 'Front-End Web Development with React', semesterNo: 5 },
    { code: 'SDN302', name: 'Server-Side Development with NodeJS', semesterNo: 7 },
    { code: 'MMA301', name: 'Multiplatform Mobile App Development', semesterNo: 7 },
    { code: 'WDP301', name: 'Web Development Project', semesterNo: 8 },
  ],
  NET: [
    { code: 'PRN212', name: 'BasicCross-Platform Application Programming With .NET', semesterNo: 5 },
    { code: 'PRN222', name: 'Advanced Cross-Platform Application Programming With .NET', semesterNo: 7 },
    { code: 'PRU213', name: 'Game Programming with C#', semesterNo: 7 },
    { code: 'PRN232', name: 'Building Cross-Platform Back-End Application With .NET', semesterNo: 8 },
  ],
};

/**
 * Returns ALL 48 subjects for a given specialization (44 core + 4 specific).
 */
export function getAllSubjectsForSpecialization(specCode: string): CoreSubjectEntry[] {
  const specific = SPECIALIZATION_SUBJECTS[specCode] ?? [];
  return [...CORE_SUBJECTS, ...specific];
}

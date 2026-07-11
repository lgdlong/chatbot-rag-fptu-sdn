/**
 * API Client Utility Layer
 * Centralized HTTP client for all backend API calls.
 * Uses cookie-based auth (Better Auth session cookies) via credentials: "include".
 */

const API_BASE_URL =
  (typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_API_BASE_URL
    : process.env.NEXT_PUBLIC_API_BASE_URL) || "http://localhost:8000";

// ─── Generic Fetch Wrapper ───

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function fetchApi<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    let errorMessage = `API Error: ${res.status}`;
    try {
      const body = await res.json();
      errorMessage = body.error || errorMessage;
    } catch {
      // ignore parse errors
    }
    throw new ApiError(errorMessage, res.status);
  }

  return res.json();
}

// ─── Types ───

export interface ApiCourse {
  id: string;
  code: string;
  name: string;
  createdAt: string;
  documentCount?: number;
}

export interface ApiSyllabusSummary {
  id: number;
  courseId: string;
  syllabusName: string;
  syllabusNameEnglish: string | null;
  credits: number;
  isApproved: boolean;
  isActive: boolean;
  decisionNo: string | null;
  course: {
    code: string;
    name: string;
  };
}

export interface ApiSyllabusDetail {
  id: number;
  courseId: string;
  syllabusName: string;
  syllabusNameEnglish: string | null;
  credits: number;
  degreeLevel: string;
  timeAllocation: string | null;
  prerequisites: string | null;
  description: string | null;
  studentTasks: string | null;
  tools: string | null;
  scoringScale: string;
  decisionNo: string | null;
  approvedDate: string | null;
  minAvgMarkToPass: string;
  isApproved: boolean;
  isActive: boolean;
  note: string | null;
  course: ApiCourse;
  materials: ApiMaterial[];
  clos: ApiClo[];
  schedules: ApiSchedule[];
  questions: ApiQuestion[];
  assessments: ApiAssessment[];
  references: ApiReference[];
  videoLinks: ApiVideoLink[];
  documents: ApiDocument[];
}

export interface ApiMaterial {
  id: string;
  description: string;
  author: string | null;
  publisher: string | null;
  publishedDate: string | null;
  edition: string | null;
  isbn: string | null;
  isMainMaterial: string | null;
  isHardCopy: string | null;
  isOnline: string | null;
  note: string | null;
}

export interface ApiClo {
  id: string;
  cloName: string;
  cloDetails: string;
  loDetails: string | null;
}

export interface ApiSchedule {
  id: string;
  session: number;
  topic: string;
  learningMethod: string | null;
  lo: string | null;
  itu: string | null;
  studentMaterials: string | null;
  sDownload: string | null;
  studentTasks: string | null;
  urls: string | null;
}

export interface ApiQuestion {
  id: string;
  sessionNo: number;
  name: string;
  details: string;
}

export interface ApiAssessment {
  id: string;
  category: string;
  type: string | null;
  part: string | null;
  weight: string;
  completionCriteria: string | null;
  duration: string | null;
  clo: string | null;
  questionType: string | null;
  noQuestion: string | null;
  knowledgeAndSkill: string | null;
  gradingGuide: string | null;
  note: string | null;
}

export interface ApiReference {
  id: string;
  citation: string;
}

export interface ApiVideoLink {
  id: string;
  url: string;
  title: string;
  description: string | null;
}

export interface ApiDocument {
  id: string;
  name: string;
  fileUrl: string;
  fileType: string;
  status: string;
  createdAt: string;
}

export interface ApiChatSession {
  id: string;
  title: string;
  scopeMode: string;
  createdAt: string;
  scopeLabel?: string;
  scopedCourses?: Array<{ id: string; code: string; name: string }>;
  messages?: ApiChatMessage[];
}

export interface ApiChatMessage {
  id: string;
  sessionId: string;
  sender: "USER" | "ASSISTANT";
  content: string;
  citations?: unknown;
  createdAt: string;
}

// ─── Auth APIs ───

export async function devLogin(
  role: "student" | "lecturer" | "admin"
): Promise<{ success: boolean; user: { id: string; name: string; email: string; role: string }; token?: string }> {
  return fetchApi("/api/chat/dev-login", {
    method: "POST",
    body: JSON.stringify({ role }),
  });
}

export async function getSession(): Promise<{
  user: { id: string; name: string; email: string; role: string | null } | null;
  session: { id: string; token: string } | null;
}> {
  try {
    return await fetchApi("/api/auth/get-session");
  } catch {
    return { user: null, session: null };
  }
}

export async function signOut(): Promise<void> {
  await fetchApi("/api/auth/sign-out", { method: "POST" });
}

export async function signInEmail(
  email: string,
  password: string
): Promise<{ user: { id: string; name: string; email: string; role: string }; token?: string }> {
  return fetchApi("/api/auth/sign-in/email", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// ─── Syllabus APIs ───

export async function searchSyllabus(
  subjectCode?: string
): Promise<{ syllabuses: ApiSyllabusSummary[] }> {
  const params = subjectCode ? `?subject_code=${encodeURIComponent(subjectCode)}` : "";
  return fetchApi(`/api/syllabus${params}`);
}

export async function getSyllabusDetail(
  id: number
): Promise<{ syllabus: ApiSyllabusDetail }> {
  return fetchApi(`/api/syllabus/${id}`);
}

export async function getSyllabusDocuments(
  syllabusId: number
): Promise<{ documents: ApiDocument[] }> {
  return fetchApi(`/api/syllabus/${syllabusId}/documents`);
}

export async function uploadSyllabusDocument(
  syllabusId: number,
  file: File
): Promise<{ document: ApiDocument }> {
  const url = `${API_BASE_URL}/api/syllabus/${syllabusId}/documents`;
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!res.ok) {
    let errorMessage = `API Error: ${res.status}`;
    try {
      const body = await res.json();
      errorMessage = body.error || errorMessage;
    } catch {
      // ignore parse errors
    }
    throw new ApiError(errorMessage, res.status);
  }

  return res.json();
}

export async function deleteSyllabusDocument(
  syllabusId: number,
  documentId: string
): Promise<{ success: boolean }> {
  return fetchApi(`/api/syllabus/${syllabusId}/documents/${encodeURIComponent(documentId)}`, {
    method: "DELETE",
  });
}

export async function deleteSyllabus(id: number): Promise<{ success: boolean }> {
  return fetchApi(`/api/syllabus/${id}`, {
    method: "DELETE",
  });
}

export async function deactivateSyllabus(id: number): Promise<{ success: boolean; syllabus: ApiSyllabusDetail }> {
  return fetchApi(`/api/syllabus/${id}/deactivate`, {
    method: "PATCH",
  });
}

export async function approveSyllabus(id: number): Promise<{ success: boolean; syllabus: ApiSyllabusDetail }> {
  return fetchApi(`/api/syllabus/${id}/approve`, {
    method: "PATCH",
  });
}

export async function activateSyllabus(id: number): Promise<{ success: boolean; syllabus: ApiSyllabusDetail }> {
  return fetchApi(`/api/syllabus/${id}/activate`, {
    method: "PATCH",
  });
}

// ─── Course APIs ───

export async function getCourses(): Promise<{ courses: ApiCourse[] }> {
  return fetchApi("/api/courses");
}

// ─── Chat APIs ───

export async function createChatSession(options: {
  scopeMode?: "ALL_COURSES" | "SELECTED_COURSES" | "SELECTED_DOCUMENTS";
  courseIds?: string[];
  documentIds?: string[];
}): Promise<{ session: ApiChatSession }> {
  return fetchApi("/api/chat/sessions", {
    method: "POST",
    body: JSON.stringify(options),
  });
}

export async function getChatSessions(): Promise<{ sessions: ApiChatSession[] }> {
  return fetchApi("/api/chat/sessions");
}

export async function getChatSessionDetail(
  sessionId: string
): Promise<{ session: ApiChatSession }> {
  return fetchApi(`/api/chat/sessions/${sessionId}`);
}

export async function deleteChatSession(sessionId: string): Promise<{ success: boolean }> {
  return fetchApi(`/api/chat/sessions/${sessionId}`, { method: "DELETE" });
}

/**
 * Sends a chat message and reads the SSE stream.
 * Returns an AbortController so the caller can cancel.
 */
export function sendChatMessageStream(
  sessionId: string,
  message: string,
  callbacks: {
    onChunk: (chunk: string) => void;
    onCitations: (citations: unknown[]) => void;
    onError: (error: string) => void;
    onDone: () => void;
  }
): AbortController {
  const controller = new AbortController();

  const url = `${API_BASE_URL}/api/chat/send`;

  fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, message }),
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        callbacks.onError(body.error || `HTTP ${res.status}`);
        callbacks.onDone();
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        callbacks.onError("No response body");
        callbacks.onDone();
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            // event type handled via next data line
            continue;
          }
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data);
              if (parsed.chunk) {
                callbacks.onChunk(parsed.chunk);
              }
              if (parsed.citations) {
                callbacks.onCitations(parsed.citations);
              }
              if (parsed.error) {
                callbacks.onError(parsed.error);
              }
            } catch {
              // ignore malformed lines
            }
          }
        }
      }

      callbacks.onDone();
    })
    .catch((err) => {
      if (err.name !== "AbortError") {
        callbacks.onError(err.message || "Network error");
        callbacks.onDone();
      }
    });

  return controller;
}

// ─── Curriculum Management APIs ───

export interface ApiMajor {
  id: string;
  code: string;
  name: string;
  description: string | null;
}

export interface ApiSpecialization {
  id: string;
  majorId: string;
  code: string;
  name: string;
  description: string | null;
  major?: {
    code: string;
    name: string;
  };
}

export interface ApiCurriculum {
  id: string;
  curriculumId: string;
  majorId: string;
  specializationId: string | null;
  batchCode: string;
  major: {
    code: string;
    name: string;
  };
  specialization: {
    code: string;
    name: string;
  } | null;
  _count: {
    subjects: number;
  };
}

export async function getMajors(): Promise<{ majors: ApiMajor[] }> {
  return fetchApi("/api/curriculum/majors");
}

export async function createMajor(payload: {
  code: string;
  name: string;
  description?: string;
}): Promise<{ major: ApiMajor }> {
  return fetchApi("/api/curriculum/majors", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteMajor(id: string): Promise<{ success: boolean }> {
  return fetchApi(`/api/curriculum/majors/${id}`, {
    method: "DELETE",
  });
}

export async function getSpecializations(): Promise<{ specializations: ApiSpecialization[] }> {
  return fetchApi("/api/curriculum/specializations");
}

export async function createSpecialization(payload: {
  majorId: string;
  code: string;
  name: string;
  description?: string;
}): Promise<{ specialization: ApiSpecialization }> {
  return fetchApi("/api/curriculum/specializations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteSpecialization(id: string): Promise<{ success: boolean }> {
  return fetchApi(`/api/curriculum/specializations/${id}`, {
    method: "DELETE",
  });
}

export async function getCurriculums(): Promise<{ curriculums: ApiCurriculum[] }> {
  return fetchApi("/api/curriculum/curriculums");
}

export async function createCurriculum(payload: {
  curriculumId: string;
  majorId: string;
  specializationId?: string | null;
  batchCode: string;
}): Promise<{ curriculum: ApiCurriculum }> {
  return fetchApi("/api/curriculum/curriculums", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteCurriculum(id: string): Promise<{ success: boolean }> {
  return fetchApi(`/api/curriculum/curriculums/${id}`, {
    method: "DELETE",
  });
}

// ─── Admin: Create Lecturer ───

export interface CreateLecturerResponse {
  success: boolean;
  credentials: {
    email: string;
    temporaryPassword: string;
  };
  resetLink: string;
}

export async function createLecturer(payload: {
  name: string;
  email: string;
}): Promise<CreateLecturerResponse> {
  return fetchApi("/api/admin/create-lecturer", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function disableLecturer(userId: string): Promise<{ success: boolean }> {
  return fetchApi(`/api/admin/disable-lecturer/${userId}`, {
    method: "POST",
  });
}

export async function enableLecturer(userId: string): Promise<{ success: boolean }> {
  return fetchApi(`/api/admin/enable-lecturer/${userId}`, {
    method: "POST",
  });
}

// ─── Admin Dashboard Stats APIs ───

export interface DashboardStats {
  admins: number;
  lecturers: number;
  whitelist: number;
  students: number;
  syllabuses: number;
  courses: number;
  documents: number;
  chatSessions: number;
}

export interface QueryTrendItem {
  month: string;
  queries: number;
}

export interface ActivityItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  details: unknown;
  createdAt: string;
  user: { name: string; email: string } | null;
}

/** Aggregate entity counts for the superadmin dashboard */
export async function getAdminDashboardStats(): Promise<DashboardStats> {
  return fetchApi("/api/admin/stats/dashboard");
}

/** Monthly RAG query counts (ChatMessage) */
export async function getQueryTrend(months = 12): Promise<QueryTrendItem[]> {
  return fetchApi(`/api/admin/stats/query-trend?months=${months}`);
}

/** Recent audit-log entries */
export async function getAdminActivity(limit = 20): Promise<ActivityItem[]> {
  return fetchApi(`/api/admin/stats/activity?limit=${limit}`);
}


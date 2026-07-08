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
  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError("Không thể kết nối tới server. Vui lòng kiểm tra mạng.", 0);
  }

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

// ─── Whitelist APIs ───

export interface ApiWhitelistEntry {
  id: string;
  email: string;
  addedAt: string;
}

export interface ApiWhitelistListResult {
  emails: ApiWhitelistEntry[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export async function getWhitelist(params: {
  page?: number;
  limit?: number;
  q?: string;
}): Promise<ApiWhitelistListResult> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.q) query.set("q", params.q);
  return fetchApi(`/api/whitelist?${query.toString()}`);
}

export async function addWhitelistEmail(
  email: string
): Promise<{ success: boolean; email: ApiWhitelistEntry }> {
  return fetchApi("/api/whitelist", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function importWhitelistEmails(
  emails: string[]
): Promise<{ success: boolean; importedCount: number; skippedCount: number }> {
  return fetchApi("/api/whitelist/import", {
    method: "POST",
    body: JSON.stringify({ emails }),
  });
}

export async function deleteWhitelistEmail(id: string): Promise<{ success: boolean }> {
  return fetchApi(`/api/whitelist/${id}`, { method: "DELETE" });
}

// ─── Lecturer Request APIs ───

export interface ApiLecturerRequest {
  id: string;
  name: string;
  email: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewedById: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitLecturerRequestPayload {
  name: string;
  email: string;
  reason: string;
}

export async function submitLecturerRequest(
  payload: SubmitLecturerRequestPayload
): Promise<{ success: boolean; request: ApiLecturerRequest }> {
  return fetchApi("/api/auth-admin/lecturer-request", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getLecturerRequests(): Promise<{
  requests: ApiLecturerRequest[];
}> {
  return fetchApi("/api/auth-admin/admin/lecturer-requests");
}

export interface ApproveLecturerRequestResult {
  success: boolean;
  message: string;
  credentials: { email: string; temporaryPassword: string };
}

export async function approveLecturerRequest(
  requestId: string
): Promise<ApproveLecturerRequestResult> {
  return fetchApi(`/api/auth-admin/admin/lecturer-requests/${requestId}/approve`, {
    method: "POST",
  });
}

export async function rejectLecturerRequest(
  requestId: string
): Promise<{ success: boolean }> {
  return fetchApi(`/api/auth-admin/admin/lecturer-requests/${requestId}/reject`, {
    method: "POST",
  });
}

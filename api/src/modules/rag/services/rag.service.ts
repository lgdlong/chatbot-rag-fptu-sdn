import { GeminiService } from "./gemini.service.js";
import { AnythingLlmAdapter } from "./anythingllm.adapter.js";
import { prisma } from "../../auth/services/db.service.js";
import type { ResolvedChatScope } from "../../chat/services/chat-scope.service.js";

type ActiveSyllabus = {
  id: number;
  courseId: string;
  prerequisites: string | null;
  credits: number;
  tools: string | null;
};

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}._-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export class RagService {
  public static async retrieveAndGenerate(
    query: string,
    scope: ResolvedChatScope,
    chatHistory: Array<{ role: "user" | "model"; parts: string[] }>,
    onChunk: (text: string) => void,
  ) {
    const courseId = scope.courseIds.length > 0 ? scope.courseIds[0] : null;
    let activeSyllabus: ActiveSyllabus | null = null;

    if (courseId) {
      activeSyllabus = await prisma.syllabus.findFirst({
        where: {
          courseId,
          isActive: true,
          isApproved: true,
        },
        select: {
          id: true,
          courseId: true,
          prerequisites: true,
          credits: true,
          tools: true,
        },
      });
    }

    const queryLower = normalizeSearchText(query);
    let isSyllabusQuery = false;
    let structuredContext = "";
    let queryTypeLabel = "";

    if (activeSyllabus) {
      if (queryLower.match(/(thi|cuoi ky|final|assignment|lab|diem|trong so|percent|weight|%|assessment|danh gia)/g)) {
        isSyllabusQuery = true;
        queryTypeLabel = "Assessment Scheme";
        const assessments = await prisma.assessmentScheme.findMany({ where: { syllabusId: activeSyllabus.id } });
        structuredContext = `[Assessment Scheme - Cơ cấu phân bổ trọng số điểm đánh giá]:\n${assessments
          .map(
            (a) =>
              `- Đầu điểm: ${a.category}, Hình thức: ${a.type || "N/A"}, Trọng số: ${a.weight}%, Điều kiện hoàn thành: ${a.completionCriteria || "N/A"}, Thời gian: ${a.duration || "N/A"}, Chuẩn đầu ra (CLO): ${a.clo || "N/A"}, Hướng dẫn chấm: ${a.gradingGuide || "N/A"}, Ghi chú: ${a.note || "N/A"}`,
          )
          .join("\n")}`;
      } else if (queryLower.match(/(tien quyet|hoc truoc|prereq)/g)) {
        isSyllabusQuery = true;
        queryTypeLabel = "Prerequisites";
        structuredContext = `[Prerequisites - Môn học tiên quyết]: ${activeSyllabus.prerequisites || "Không có môn tiên quyết."}\n[Credits - Số tín chỉ]: ${activeSyllabus.credits} tín chỉ.`;
      } else if (queryLower.match(/(tin chi|credit)/g)) {
        isSyllabusQuery = true;
        queryTypeLabel = "Credits";
        structuredContext = `[Credits - Số tín chỉ môn học]: ${activeSyllabus.credits} tín chỉ.`;
      } else if (queryLower.match(/(clo|lo|dau ra|chuan dau ra)/g)) {
        isSyllabusQuery = true;
        queryTypeLabel = "Course Learning Outcomes (CLOs)";
        const clos = await prisma.syllabusClo.findMany({ where: { syllabusId: activeSyllabus.id } });
        structuredContext = `[CLOs - Các chuẩn đầu ra môn học]:\n${clos
          .map(
            (c) =>
              `- Mã CLO: ${c.cloName}\n  Mô tả chi tiết: ${c.cloDetails}\n  Ánh xạ chuẩn đầu ra chương trình (LO): ${c.loDetails || "N/A"}`,
          )
          .join("\n")}`;
      } else if (queryLower.match(/(buoi|session|lich trinh|weekly schedule|topic)/g)) {
        isSyllabusQuery = true;
        queryTypeLabel = "Weekly Schedule";
        const schedules = await prisma.syllabusSchedule.findMany({
          where: { syllabusId: activeSyllabus.id },
          orderBy: { session: "asc" },
        });
        structuredContext = `[Weekly Schedule - Lịch trình giảng dạy chi tiết buổi học]:\n${schedules
          .map(
            (s) =>
              `- Buổi thứ ${s.session}: Chủ đề: ${s.topic}, Hình thức học: ${s.learningMethod || "N/A"}, Đáp ứng CLO: ${s.lo || "N/A"}, Nhiệm vụ sinh viên: ${s.studentTasks || "N/A"}`,
          )
          .join("\n")}`;
      } else if (queryLower.match(/(tool|cong cu|phan mem)/g)) {
        isSyllabusQuery = true;
        queryTypeLabel = "Tools";
        structuredContext = `[Tools - Công cụ và phần mềm thực hành cần thiết]: ${activeSyllabus.tools || "Không yêu cầu tool đặc thù."}`;
      } else if (queryLower.match(/(sach|giao trinh|material|tai lieu tham khao)/g)) {
        isSyllabusQuery = true;
        queryTypeLabel = "Materials & References";
        const materials = await prisma.syllabusMaterial.findMany({ where: { syllabusId: activeSyllabus.id } });
        const references = await prisma.syllabusReference.findMany({ where: { syllabusId: activeSyllabus.id } });
        structuredContext = `[Materials - Học liệu chính/phụ (Giáo trình)]:\n${materials
          .map(
            (m) =>
              `- Tên sách: ${m.description}, Tác giả: ${m.author || "N/A"}, Nhà xuất bản: ${m.publisher || "N/A"}, Phân loại: ${m.isMainMaterial || "N/A"}`,
          )
          .join("\n")}\n\n[References - Tài liệu tham khảo chính quy bổ sung]:\n${references
          .map((r) => `- Trích dẫn: ${r.citation}`)
          .join("\n")}`;
      }
    }

    if (isSyllabusQuery && activeSyllabus) {
      const systemPrompt = `Bạn là Trợ lý học tập FLM chuyên nghiệp của Trường Đại học FPT. 
Nhiệm vụ của bạn là trả lời thắc mắc của sinh viên dựa trên dữ liệu đề cương chi tiết (Syllabus) có cấu trúc cực kỳ chính xác được cung cấp dưới đây.
Dữ liệu này được lấy trực tiếp từ hệ thống quản lý FLM chính thức của trường.

QUY TẮC CỐT LÕI:
1. Bạn phải bám sát 100% vào dữ liệu có cấu trúc bên dưới để trả lời. Tuyệt đối không tự bịa (hallucination) ra các thông số, trọng số điểm, tín chỉ hoặc buổi học không có trong context.
2. Nếu câu hỏi không thể trả lời từ dữ liệu cung cấp, hãy lịch sự phản hồi: "Hiện đề cương môn học không có thông tin chi tiết về phần này."
3. Hãy trả lời bằng tiếng Việt một cách rõ ràng, mạch lạc, có cấu trúc đẹp mắt (dùng markdown, bullet points hoặc bảng biểu nếu cần thiết).

DỮ LIỆU ĐỀ CƯƠNG CHI TIẾT CÓ CẤU TRÚC:
----------------------------------------
Môn học: ${scope.scopedCourses.length > 0 ? scope.scopedCourses[0].name : "Không rõ"} (${scope.scopedCourses.length > 0 ? scope.scopedCourses[0].code : "N/A"})
${structuredContext}
----------------------------------------`;

      const fullAnswer = await GeminiService.generateChatStream(systemPrompt, chatHistory, query, [], onChunk);

      return {
        citations: [
          {
            documentId: `postgres-syllabus-${activeSyllabus.id}`,
            documentName: `FPT FLM Syllabus: ${queryTypeLabel}`,
            fileUrl: null,
            page: 1,
          },
        ],
        fullAnswer,
      };
    }

    const workspaceSlug = activeSyllabus
      ? `${scope.scopedCourses[0].code.toLowerCase()}_${activeSyllabus.id}`
      : scope.scopedCourses.length > 0
        ? scope.scopedCourses[0].code.toLowerCase()
        : "default";

    try {
      const result = await AnythingLlmAdapter.streamWorkspaceChat({
        workspaceSlug,
        query,
        onChunk,
      });

      return result;
    } catch {
      const reply = "Rất tiếc, không thể kết nối tới AnythingLLM.";
      onChunk(reply);
      return { citations: [], fullAnswer: reply };
    }
  }
}

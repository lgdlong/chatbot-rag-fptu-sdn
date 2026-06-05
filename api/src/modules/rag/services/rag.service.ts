import { appendFile } from "node:fs/promises";
import { GeminiService } from "./gemini.service.js";
import { prisma } from "../../auth/services/db.service.js";
import { ENV } from "../../../config/env.js";
import type { ResolvedChatScope } from "../../chat/services/chat-scope.service.js";

type RagCitation = {
  documentId: string;
  documentName: string;
  page: number;
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

function extractRescueTerms(query: string) {
  const normalized = normalizeSearchText(query);
  const stopWords = new Set([
    "va",
    "hoac",
    "cho",
    "voi",
    "cua",
    "nay",
    "nay?",
    "la",
    "co",
    "tong",
    "so",
    "bao",
    "nhieu",
    "tai",
    "lieu",
    "file",
    "slide",
    "chuong",
    "phan",
    "trong",
    "o",
    "ve",
  ]);

  return Array.from(
    new Set(
      normalized
        .split(" ")
        .map((token) => token.trim())
        .filter((token) => token.length >= 3 && !stopWords.has(token)),
    ),
  ).slice(0, 6);
}

export class RagService {
  public static async retrieveAndGenerate(
    query: string,
    scope: ResolvedChatScope,
    chatHistory: Array<{ role: "user" | "model"; parts: string[] }>,
    onChunk: (text: string) => void,
  ) {
    const logFile = "logs/a.log";
    const writeLog = async (text: string) => {
      try {
        const time = new Date().toISOString();
        await appendFile(logFile, `[${time}] ${text}\n`);
      } catch (err) {
        // ignore log write errors
      }
    };

    // 1. Xác định Syllabus đang Active + Approved của môn học
    const courseId = scope.courseIds.length > 0 ? scope.courseIds[0] : null;
    let activeSyllabus: any = null;
    if (courseId) {
      activeSyllabus = await prisma.syllabus.findFirst({
        where: {
          courseId,
          isActive: true,
          isApproved: true
        }
      });
    }

    // 2. [INTENT ROUTER] - Phát hiện câu hỏi liên quan đến FLM Syllabus có cấu trúc
    const queryLower = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    let isSyllabusQuery = false;
    let structuredContext = "";
    let queryTypeLabel = "";

    if (activeSyllabus) {
      if (queryLower.match(/(thi|cuoi ky|final|assignment|lab|diem|trong so|percent|weight|%|assessment|danh gia)/g)) {
        isSyllabusQuery = true;
        queryTypeLabel = "Assessment Scheme";
        const assessments = await prisma.assessmentScheme.findMany({
          where: { syllabusId: activeSyllabus.id }
        });
        structuredContext = `[Assessment Scheme - Cơ cấu phân bổ trọng số điểm đánh giá]:\n` + assessments.map(a => 
          `- Đầu điểm: ${a.category}, Hình thức: ${a.type || "N/A"}, Trọng số: ${a.weight}%, Điều kiện hoàn thành: ${a.completionCriteria || "N/A"}, Thời gian: ${a.duration || "N/A"}, Chuẩn đầu ra (CLO): ${a.clo || "N/A"}, Hướng dẫn chấm: ${a.gradingGuide || "N/A"}, Ghi chú: ${a.note || "N/A"}`
        ).join("\n");
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
        const clos = await prisma.syllabusClo.findMany({
          where: { syllabusId: activeSyllabus.id }
        });
        structuredContext = `[CLOs - Các chuẩn đầu ra môn học]:\n` + clos.map(c => 
          `- Mã CLO: ${c.cloName}\n  Mô tả chi tiết: ${c.cloDetails}\n  Ánh xạ chuẩn đầu ra chương trình (LO): ${c.loDetails || "N/A"}`
        ).join("\n");
      } else if (queryLower.match(/(buoi|session|lich trinh|weekly schedule|topic)/g)) {
        isSyllabusQuery = true;
        queryTypeLabel = "Weekly Schedule";
        const schedules = await prisma.syllabusSchedule.findMany({
          where: { syllabusId: activeSyllabus.id },
          orderBy: { session: "asc" }
        });
        structuredContext = `[Weekly Schedule - Lịch trình giảng dạy chi tiết buổi học]:\n` + schedules.map(s => 
          `- Buổi thứ ${s.session}: Chủ đề: ${s.topic}, Hình thức học: ${s.learningMethod || "N/A"}, Đáp ứng CLO: ${s.lo || "N/A"}, Nhiệm vụ sinh viên: ${s.studentTasks || "N/A"}`
        ).join("\n");
      } else if (queryLower.match(/(tool|cong cu|phan mem)/g)) {
        isSyllabusQuery = true;
        queryTypeLabel = "Tools";
        structuredContext = `[Tools - Công cụ và phần mềm thực hành cần thiết]: ${activeSyllabus.tools || "Không yêu cầu tool đặc thù."}`;
      } else if (queryLower.match(/(sach|giao trinh|material|tai lieu tham khao)/g)) {
        isSyllabusQuery = true;
        queryTypeLabel = "Materials & References";
        const materials = await prisma.syllabusMaterial.findMany({
          where: { syllabusId: activeSyllabus.id }
        });
        const references = await prisma.syllabusReference.findMany({
          where: { syllabusId: activeSyllabus.id }
        });
        structuredContext = `[Materials - Học liệu chính/phụ (Giáo trình)]:\n` + materials.map(m => 
          `- Tên sách: ${m.description}, Tác giả: ${m.author || "N/A"}, Nhà xuất bản: ${m.publisher || "N/A"}, Phân loại: ${m.isMainMaterial || "N/A"}`
        ).join("\n") + `\n\n[References - Tài liệu tham khảo chính quy bổ sung]:\n` + references.map(r => 
          `- Trích dẫn: ${r.citation}`
        ).join("\n");
      }
    }

    // 3. Nếu là câu hỏi cấu trúc Syllabus -> Query PostgreSQL trực tiếp và trả lời qua Gemini
    if (isSyllabusQuery && activeSyllabus) {
      await writeLog(`[RAG] Intent Router detected: Answering structure query "${queryTypeLabel}" from PostgreSQL directly.`);
      
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

      const fullAnswer = await GeminiService.generateChatStream(
        systemPrompt,
        chatHistory,
        query,
        [], // Không cần PDF base64 chunks cho dữ liệu cấu trúc
        onChunk
      );

      return {
        citations: [{
          documentId: `postgres-syllabus-${activeSyllabus.id}`,
          documentName: `FPT FLM Syllabus: ${queryTypeLabel}`,
          fileUrl: null,
          page: 1
        }],
        fullAnswer
      };
    }

    // 4. Nếu là câu hỏi phi cấu trúc -> RAG qua AnythingLLM Workspace cô lập
    // Workspace slug được cô lập theo dạng: {subject_code}_{syllabus_id}
    const workspaceSlug = activeSyllabus 
      ? `${scope.scopedCourses[0].code.toLowerCase()}_${activeSyllabus.id}` 
      : (scope.scopedCourses.length > 0 ? scope.scopedCourses[0].code.toLowerCase() : "default");

    await writeLog(`[RAG] Proxying chat to AnythingLLM isolated workspace slug: "${workspaceSlug}"`);

    if (!ENV.ANYTHING_LLM_API_KEY) {
       const reply = "AnythingLLM API Key chưa được cấu hình. Vui lòng thêm ANYTHING_LLM_API_KEY vào biến môi trường.";
       onChunk(reply);
       return { citations: [], fullAnswer: reply };
    }

    try {
      const response = await fetch(`${ENV.ANYTHING_LLM_URL}/api/v1/workspace/${workspaceSlug}/stream-chat`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${ENV.ANYTHING_LLM_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: query,
          mode: "chat"
        })
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "N/A");
        await writeLog(`AnythingLLM error: ${response.status} ${response.statusText}. Chi tiết: ${errorBody}`);
        const reply = "Rất tiếc, máy chủ RAG đang gặp sự cố. Vui lòng thử lại sau.";
        onChunk(reply);
        return { citations: [], fullAnswer: reply };
      }

      let fullAnswer = "";
      let rawSources: any[] = [];

      if (response.body) {
        const decoder = new TextDecoder("utf-8");
        await writeLog("Khởi đầu nhận Stream từ AnythingLLM...");
        
        for await (const chunk of response.body as any) {
          const chunkText = decoder.decode(chunk, { stream: true });
          await writeLog(`RAW CHUNK NHẬN ĐƯỢC:\n${chunkText}`);
          
          const lines = chunkText.split("\n");
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;
            
            await writeLog(`XỬ LÝ DÒNG: ${trimmedLine}`);
            if (trimmedLine.startsWith("data: ")) {
              const dataStr = trimmedLine.slice(6).trim();
              await writeLog(`NỘI DUNG DATA TRÍCH XUẤT: ${dataStr}`);
              
              if (dataStr === "[DONE]") {
                await writeLog("STREAM KẾT THÚC ([DONE])");
                continue;
              }
              try {
                const data = JSON.parse(dataStr);
                await writeLog(`PARSED JSON OK: ${JSON.stringify(data)}`);
                if (data.textResponse) {
                  await writeLog(`THẤY TEXT RESPONSE: ${data.textResponse}`);
                  fullAnswer += data.textResponse;
                  onChunk(data.textResponse);
                } else if (data.sources && Array.isArray(data.sources)) {
                  await writeLog(`THẤY SOURCES: ${JSON.stringify(data.sources)}`);
                  rawSources = data.sources;
                } else {
                  await writeLog("Không tìm thấy field 'textResponse' hay 'sources' trong JSON.");
                }
              } catch (e) {
                await writeLog(`LỖI PARSE JSON DÒNG NÀY: ${e instanceof Error ? e.message : String(e)}`);
              }
            }
          }
        }
      } else {
        await writeLog("Response body bị rỗng!");
      }

      const citations: any[] = [];
      const seenDocIds = new Set<string>();

      if (rawSources.length > 0) {
        for (const source of rawSources) {
          const title = source.title;
          if (!title) continue;

          // Tìm file tương ứng trong PostgreSQL
          const dbDoc = await prisma.document.findFirst({
            where: {
              name: {
                equals: title,
                mode: "insensitive"
              }
            },
            select: { id: true, name: true, fileUrl: true }
          });

          const docId = dbDoc ? dbDoc.id : (source.id || "unknown");
          if (seenDocIds.has(docId)) {
            continue;
          }
          seenDocIds.add(docId);

          if (dbDoc) {
            citations.push({
              documentId: dbDoc.id,
              documentName: dbDoc.name,
              fileUrl: dbDoc.fileUrl,
              page: 1
            });
          } else {
            citations.push({
              documentId: source.id || "unknown",
              documentName: title,
              fileUrl: null,
              page: 1
            });
          }
        }
      }

      await writeLog(`TRẢ VỀ CITATIONS MAPPED: ${JSON.stringify(citations)}`);

      return {
        citations, 
        fullAnswer,
      };
    } catch (error) {
      await writeLog(`Failed to call AnythingLLM: ${error instanceof Error ? error.message : String(error)}`);
      const reply = "Rất tiếc, không thể kết nối tới AnythingLLM.";
      onChunk(reply);
      return { citations: [], fullAnswer: reply };
    }
  }
}

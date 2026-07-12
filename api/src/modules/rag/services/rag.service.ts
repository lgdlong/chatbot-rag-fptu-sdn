import { AnythingLlmAdapter } from "./anythingllm.adapter.js";
import { SyllabusRepository } from "../../syllabus/repositories/syllabus.repository.js";
import type { ResolvedChatScope } from "../../chat/services/chat-scope.service.js";

type ActiveSyllabus = {
  id: number;
  courseId: string;
};

function stripMarkdown(text: string): string {
  // 1. Code blocks & inline code
  text = text.replace(/```[\s\S]*?```/g, "");
  text = text.replace(/`([^`]+)`/g, "$1");
  // 2. Normalize bullets — * + and numbered → -, preserve indent
  text = text.replace(/^([\s]*)[*+]\s+/gm, "$1- ");
  text = text.replace(/^([\s]*)\d+\.\s+/gm, "$1- ");
  // 3. Bold/italic — remaining * markers (bullet đã xử lý riêng ở bước 2)
  text = text.replace(/\*{1,3}([^*\n]+?)\*{1,3}/g, " $1 ");
  // 4. Links & images
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1");
  // 5. Block-level formatting
  text = text.replace(/^#{1,6}\s+/gm, "");
  text = text.replace(/^>\s+/gm, "");
  text = text.replace(/^[-*_]{3,}\s*$/gm, "");
  // 6. Scrub bare ** and * markers that leaked through per-chunk
  //    (happens when markdown syntax is split across streaming chunks)
  text = text.replace(/\*\*/g, "");
  // 7. Normalize whitespace
  text = text.replace(/[ \t]+/g, " ");
  text = text.replace(/\n{3,}/g, "\n\n");
  return text.trim();
}

export class RagService {
  public static async retrieveAndGenerate(
    query: string,
    scope: ResolvedChatScope,
    _chatHistory: Array<{ role: "user" | "model"; parts: string[] }>,
    onChunk: (text: string) => void,
  ) {
    const courseId = scope.courseIds.length > 0 ? scope.courseIds[0] : null;
    let activeSyllabus: ActiveSyllabus | null = null;

    if (courseId) {
      activeSyllabus = (await SyllabusRepository.findFirstActiveSyllabus(
        courseId,
        {
          isApproved: true,
          select: { id: true, courseId: true },
        },
      )) as ActiveSyllabus | null;
    }

    const workspaceSlug = activeSyllabus
      ? `${scope.scopedCourses[0].code.toLowerCase()}_${activeSyllabus.id}`
      : scope.scopedCourses.length > 0
        ? scope.scopedCourses[0].code.toLowerCase()
        : "default";

    try {
      const onChunkClean = (text: string) => onChunk(stripMarkdown(text));
      const result = await AnythingLlmAdapter.streamWorkspaceChat({
        workspaceSlug,
        query,
        onChunk: onChunkClean,
      });

      return { ...result, fullAnswer: stripMarkdown(result.fullAnswer) };
    } catch (error) {
      console.error("[RagService] AnythingLLM stream failed:", error);
      const errMsg = error instanceof Error ? error.message : String(error);
      const errorReply = stripMarkdown(
        `Xin lỗi, hiện tại AI trợ lý đang gặp sự cố kỹ thuật. Vui lòng thử lại sau.\n\nChi tiết lỗi: ${errMsg}`
      );
      onChunk(errorReply);
      return { citations: [], fullAnswer: errorReply };
    }
  }
}

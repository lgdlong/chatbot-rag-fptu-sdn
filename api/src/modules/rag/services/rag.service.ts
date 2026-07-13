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

export type Citation = {
  documentName: string;
  excerpt: string;
};

/** Clean up internal AnythingLLM document names for display. */
function formatDocumentName(raw: string): string {
  if (/^syllabus_\d+_snapshot(\.md)?$/i.test(raw)) {
    return "syllabus";
  }
  // Keep real filenames, strip .md extension for readability
  return raw.replace(/\.md$/i, "");
}

function transformCitations(sources: unknown[]): Citation[] {
  return sources.map((source) => {
    if (!source || typeof source !== "object") {
      return { documentName: "Tài liệu", excerpt: "" };
    }
    const record = source as Record<string, unknown>;

    // Try every field name AnythingLLM might use
    const rawTitle =
      typeof record.title === "string"
        ? record.title
        : typeof record.filename === "string"
          ? record.filename
          : typeof (record as any).metadata?.title === "string"
            ? (record as any).metadata.title
            : typeof (record as any).documentName === "string"
              ? (record as any).documentName
              : "";

    const textContent =
      typeof record.textContent === "string"
        ? record.textContent
        : typeof record.content === "string"
          ? record.content
          : typeof record.text === "string"
            ? record.text
            : typeof record.snippet === "string"
              ? record.snippet
              : typeof (record as any).excerpt === "string"
                ? (record as any).excerpt
                : "";

    return {
      documentName: formatDocumentName(rawTitle || "Tài liệu"),
      excerpt: textContent ? textContent.substring(0, 200).trim() : "",
    };
  });
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

      return {
        citations: Array.isArray(result.citations)
          ? transformCitations(result.citations)
          : [],
        fullAnswer: stripMarkdown(result.fullAnswer),
      };
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

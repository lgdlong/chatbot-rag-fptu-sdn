import { ENV } from "../../../config/env.js";

type AnythingLlmWorkspacesResponse = {
  workspaces?: Array<{ slug?: string }>;
};

type AnythingLlmStreamPayload = {
  textResponse?: string;
  sources?: unknown[];
};

type StreamWorkspaceChatParams = {
  workspaceSlug: string;
  query: string;
  onChunk: (text: string) => void;
};

function baseUrl() {
  return ENV.ANYTHING_LLM_URL.replace(/\/+$/, "");
}

function authHeaders(includeJson = false) {
  if (!ENV.ANYTHING_LLM_API_KEY) {
    throw new Error("AnythingLLM API Key chưa được cấu hình. Vui lòng thêm ANYTHING_LLM_API_KEY vào biến môi trường.");
  }

  return {
    Authorization: `Bearer ${ENV.ANYTHING_LLM_API_KEY}`,
    ...(includeJson ? { "Content-Type": "application/json" } : {}),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseJson<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

async function assertOk(response: Response, fallbackMessage: string) {
  if (response.ok) {
    return;
  }

  const detail = await response.text().catch(() => "N/A");
  throw new Error(`${fallbackMessage}: ${response.status} ${response.statusText}. Detail: ${detail}`);
}

export class AnythingLlmAdapter {
  public static async listWorkspaceSlugs() {
    const response = await fetch(`${baseUrl()}/api/v1/workspaces`, {
      headers: authHeaders(),
    });

    await assertOk(response, "AnythingLLM workspace list failed");

    const payload = (await response.json()) as AnythingLlmWorkspacesResponse;
    return (payload.workspaces ?? [])
      .map((workspace) => workspace.slug?.trim())
      .filter((slug): slug is string => typeof slug === "string" && slug.length > 0);
  }

  public static async ensureWorkspace(workspaceSlug: string) {
    const workspaces = await this.listWorkspaceSlugs();
    const exists = workspaces.includes(workspaceSlug);

    if (exists) {
      return;
    }

    const response = await fetch(`${baseUrl()}/api/v1/workspace/new`, {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify({ name: workspaceSlug }),
    });

    await assertOk(response, `AnythingLLM workspace creation failed for ${workspaceSlug}`);

    // Set LLM guardrail system prompt immediately after creation
    await this.updateWorkspaceSystemPrompt(workspaceSlug);
  }

  public static async uploadPdf(fileName: string, buffer: Uint8Array) {
    const formData = new FormData();
    const payloadBuffer = (buffer.buffer as ArrayBuffer).slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    const fileBlob = new Blob([payloadBuffer], { type: "application/pdf" });
    formData.append("file", fileBlob, fileName);

    const response = await fetch(`${baseUrl()}/api/v1/document/upload`, {
      method: "POST",
      headers: authHeaders(),
      body: formData,
    });

    await assertOk(response, `AnythingLLM file upload failed for ${fileName}`);

    const payload = (await response.json()) as {
      documents?: Array<{ location?: string }>;
    };
    const location = payload.documents?.[0]?.location;
    if (!location) {
      throw new Error("AnythingLLM upload did not return a valid document location");
    }

    return location;
  }

  public static async uploadMarkdown(fileName: string, content: string) {
    const formData = new FormData();
    const fileBlob = new Blob([content], { type: "text/markdown" });
    formData.append("file", fileBlob, fileName);

    const response = await fetch(`${baseUrl()}/api/v1/document/upload`, {
      method: "POST",
      headers: authHeaders(),
      body: formData,
    });

    await assertOk(response, `AnythingLLM file upload failed for ${fileName}`);

    const payload = (await response.json()) as {
      documents?: Array<{ location?: string }>;
    };
    const location = payload.documents?.[0]?.location;
    if (!location) {
      throw new Error("AnythingLLM upload did not return a valid document location");
    }

    return location;
  }

  public static async updateWorkspaceEmbeddings(
    workspaceSlug: string,
    payload: { adds?: string[]; deletes?: string[] },
  ) {
    const response = await fetch(`${baseUrl()}/api/v1/workspace/${workspaceSlug}/update-embeddings`, {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify(payload),
    });

    await assertOk(response, `AnythingLLM workspace update failed for ${workspaceSlug}`);
  }

  public static async renameWorkspace(oldSlug: string, newSlug: string, newName: string) {
    const response = await fetch(`${baseUrl()}/api/v1/workspace/${oldSlug}/update`, {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify({ name: newName, slug: newSlug }),
    });

    await assertOk(response, `AnythingLLM workspace rename failed for ${oldSlug}`);
  }

  public static async updateWorkspaceSystemPrompt(workspaceSlug: string) {
    const prompt = ENV.ANYTHING_LLM_SYSTEM_PROMPT;
    const response = await fetch(`${baseUrl()}/api/v1/workspace/${workspaceSlug}/update`, {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify({
        name: workspaceSlug,
        slug: workspaceSlug,
        openAiPrompt: prompt,
      }),
    });

    await assertOk(response, `AnythingLLM system prompt update failed for ${workspaceSlug}`);
  }

  public static async syncAllWorkspacePrompts() {
    const workSlugs = await this.listWorkspaceSlugs();
    if (workSlugs.length === 0) {
      return { updated: 0, failed: 0 };
    }

    let updated = 0;
    let failed = 0;
    for (const slug of workSlugs) {
      try {
        await this.updateWorkspaceSystemPrompt(slug);
        updated++;
      } catch {
        failed++;
      }
    }

    return { updated, failed };
  }

  public static async deleteWorkspace(workspaceSlug: string) {
    const response = await fetch(`${baseUrl()}/api/v1/workspace/${workspaceSlug}`, {
      method: "DELETE",
      headers: authHeaders(),
    });

    await assertOk(response, `AnythingLLM workspace delete failed for ${workspaceSlug}`);
  }

  public static async purgeDocuments(documentNames: string[]) {
    if (documentNames.length === 0) {
      return;
    }

    const response = await fetch(`${baseUrl()}/api/v1/system/remove-documents`, {
      method: "DELETE",
      headers: authHeaders(true),
      body: JSON.stringify({ names: documentNames }),
    });

    await assertOk(response, "AnythingLLM document purge failed");
  }

  public static async streamWorkspaceChat({ workspaceSlug, query, onChunk }: StreamWorkspaceChatParams) {
    const response = await fetch(`${baseUrl()}/api/v1/workspace/${workspaceSlug}/stream-chat`, {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify({ message: query, mode: "chat" }),
    });

    await assertOk(response, `AnythingLLM stream chat failed for ${workspaceSlug}`);

    let fullAnswer = "";
    let citations: unknown[] = [];
    const body = response.body;
    if (!body) {
      return { fullAnswer, citations };
    }

    const decoder = new TextDecoder("utf-8");
    for await (const chunk of body) {
      const chunkText = decoder.decode(chunk, { stream: true });
      for (const line of chunkText.split("\n")) {
        const trimmedLine = line.trim();
        if (!trimmedLine.startsWith("data: ")) {
          continue;
        }

        const dataStr = trimmedLine.slice(6).trim();
        if (!dataStr || dataStr === "[DONE]") {
          continue;
        }

        const payload = parseJson<AnythingLlmStreamPayload>(dataStr);
        if (!payload || !isRecord(payload)) {
          continue;
        }

        if (typeof payload.textResponse === "string" && payload.textResponse.length > 0) {
          fullAnswer += payload.textResponse;
          onChunk(payload.textResponse);
          continue;
        }

        if (Array.isArray(payload.sources)) {
          citations = payload.sources;
        }
      }
    }

    return { fullAnswer, citations };
  }
}

import path from "node:path";
import { fileURLToPath } from "node:url";

import fs from "node:fs";

// Programmatically load the root .env file at startup by walking up the directory tree
// Manual parsing to avoid loadEnvFile / tsx compatibility issues
try {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  let dir = __dirname;
  let envPath = "";
  for (let i = 0; i < 5; i++) {
    const checkPath = path.resolve(dir, ".env");
    if (fs.existsSync(checkPath)) {
      envPath = checkPath;
      break;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  if (envPath) {
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const sepIdx = trimmed.indexOf("=");
      if (sepIdx === -1) continue;
      const key = trimmed.slice(0, sepIdx).trim();
      let value = trimmed.slice(sepIdx + 1).trim();
      // Strip surrounding quotes if any
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (key && !process.env[key]) {
        process.env[key] = value;
      }
    }
  }
} catch (e) {
  console.error("[env] Failed to load .env file:", e);
}

// Export parsed env variables for usage (with defaults)
export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 8000,
  DATABASE_URL: process.env.DATABASE_URL || "",
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || "",
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || "http://localhost:8000",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET!,

  INTERNAL_API_KEY:
    process.env.INTERNAL_API_KEY || "super_secret_internal_key_fptu_rag",
  INTERNAL_API_URL: process.env.INTERNAL_API_URL || "http://localhost:8000",
  ANYTHING_LLM_URL: process.env.ANYTHING_LLM_URL || "http://localhost:3003",
  ANYTHING_LLM_API_KEY: process.env.ANYTHING_LLM_API_KEY || "",
  ANYTHING_LLM_SYSTEM_PROMPT:
    process.env.ANYTHING_LLM_SYSTEM_PROMPT ||
    "Bạn là trợ lý học tập của Đại học FPT.\n\nQUY TẮC (ưu tiên theo thứ tự từ trên xuống):\n1. Trả lời CHỈ dựa trên tài liệu môn học được cung cấp. Luôn kèm citation [tên tài liệu] sau mỗi thông tin.\n2. Nếu câu hỏi không liên quan đến nội dung môn học (syllabus, bài giảng, project/đồ án/bài tập lớn, assignment, kiến thức chuyên ngành) → trả lời: \"Xin lỗi, tôi chỉ có thể trả lời các câu hỏi liên quan đến nội dung môn học. Bạn vui lòng đặt câu hỏi cụ thể hơn về môn học, ví dụ: 'điểm PT tối thiểu là bao nhiêu?', 'bài tập nhóm chiếm bao nhiêu phần trăm?', 'môn này có bao nhiêu tín chỉ?'\"\n3. Nếu câu hỏi là yêu cầu thao tác hệ thống (xóa/upload tài liệu, đổi gói, cấp quyền, đổi môn) → trả lời: \"Xin lỗi, tôi chỉ có thể trả lời các câu hỏi liên quan đến nội dung môn học.\"\n4. Nếu không tìm thấy câu trả lời trong tài liệu được cung cấp → thành thật nói không biết, không tự bịa thông tin.\n5. Câu hỏi quá ngắn hoặc thiếu ngữ cảnh (vd chỉ gõ 'PT', 'PE', 'quiz') vẫn được hiểu là hỏi về môn học. Hãy cố gắng suy luận từ tài liệu trước khi từ chối. Nếu không chắc chắn, hãy hỏi lại người dùng để làm rõ thay vì từ chối ngay.",
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  RESEND_API_KEY: process.env.RESEND_API_KEY || "",
  // Dev uses Resend test domain; for production, set EMAIL_FROM env to a verified domain
  EMAIL_FROM: process.env.EMAIL_FROM || "FPTU RAG Chatbot <noreply@lgdlong.site>",

  // Cloudinary for image upload
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",
} as const;

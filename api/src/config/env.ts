import path from "node:path";
import { fileURLToPath } from "node:url";

import fs from "node:fs";

// Programmatically load the root .env file at startup by walking up the directory tree
try {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  let dir = __dirname;
  let envPath = "";
  // Duyệt ngược lên tối đa 5 cấp thư mục để tìm file .env ở thư mục gốc
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
    process.loadEnvFile(envPath);
  }
} catch (e) {
  // Ignore error in environments where env variables are pre-loaded (e.g. Docker, Vercel)
}

// Export parsed env variables for usage (with defaults)
export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 8000,
  DATABASE_URL: process.env.DATABASE_URL || "",
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || "",
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || "http://localhost:8000",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  GEMINI_TEXT_MODEL: process.env.GEMINI_TEXT_MODEL || "gemini-2.0-flash-lite",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET!,

  INTERNAL_API_KEY:
    process.env.INTERNAL_API_KEY || "super_secret_internal_key_fptu_rag",
  INTERNAL_API_URL: process.env.INTERNAL_API_URL || "http://localhost:8000",
  ANYTHING_LLM_URL: process.env.ANYTHING_LLM_URL || "http://localhost:3003",
  ANYTHING_LLM_API_KEY: process.env.ANYTHING_LLM_API_KEY || "",
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  RESEND_API_KEY: process.env.RESEND_API_KEY || "",
  // Dev uses Resend test domain; for production, set EMAIL_FROM env to a verified domain
  EMAIL_FROM: process.env.EMAIL_FROM || "FPTU RAG Chatbot <onboarding@resend.dev>",
} as const;

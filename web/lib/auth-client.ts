import { createAuthClient } from "better-auth/react";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

// Minimal frontend prep for the UI team.
export const authClient = createAuthClient({
  baseURL: apiBaseUrl,
});

import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { adminAc, userAc } from "better-auth/plugins/admin/access";

export const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

export const authClient = createAuthClient({
  baseURL: apiBaseUrl,
  plugins: [
    adminClient({
      roles: {
        ADMIN: adminAc,
        LECTURER: userAc,
        STUDENT: userAc,
      },
    }),
  ],
});

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** REST fetch for non–Better Auth routes (whitelist, lecturer-requests). */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${apiBaseUrl}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    ...init,
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      typeof body?.error === "string"
        ? body.error
        : `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }

  return body as T;
}

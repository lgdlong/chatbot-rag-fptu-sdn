"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  ReactNode,
} from "react";
import { authClient } from "../../lib/auth-client";
import * as api from "@/lib/api";

/** Matches backend roles per docs/api/00_auth.md */
export type UserRole = "ADMIN" | "LECTURER" | "STUDENT";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  image?: string | null;
  banned?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginAsRole: (role: UserRole) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  refetchSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function toUserRole(role: string | null | undefined): UserRole {
  if (role === "ADMIN" || role === "LECTURER" || role === "STUDENT") {
    return role;
  }
  return "STUDENT";
}

function mapSessionUser(
  sessionUser: {
    id: string;
    email: string;
    name: string;
    image?: string | null;
    role?: string | null;
    banned?: boolean | null;
  } | undefined,
): User | null {
  if (!sessionUser) return null;
  return {
    id: sessionUser.id,
    email: sessionUser.email,
    name: sessionUser.name,
    image: sessionUser.image,
    role: toUserRole(sessionUser.role),
    banned: sessionUser.banned ?? false,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending, refetch } = authClient.useSession();
  const user = mapSessionUser(session?.user);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authClient.signIn.email({ email, password });
    if (result.error) {
      const msg = (result.error.message ?? "").toLowerCase();
      let vietnameseMsg: string;
      if (msg.includes("invalid email") || msg.includes("invalid password") || (msg.includes("email") && msg.includes("password"))) {
        vietnameseMsg = "Email hoặc mật khẩu không chính xác.";
      } else if (msg.includes("user not found") || msg.includes("account not found")) {
        vietnameseMsg = "Tài khoản không tồn tại.";
      } else if (msg.includes("banned") || msg.includes("disabled") || msg.includes("suspended")) {
        vietnameseMsg = "Tài khoản đã bị vô hiệu hóa. Liên hệ admin để được hỗ trợ.";
      } else if (msg.includes("rate limit") || msg.includes("too many")) {
        vietnameseMsg = "Quá nhiều lần thử đăng nhập. Vui lòng đợi vài phút.";
      } else {
        vietnameseMsg = result.error.message ?? "Đăng nhập thất bại.";
      }
      return { success: false, error: vietnameseMsg };
    }
    await refetch();
    return { success: true };
  }, [refetch]);

  /**
   * Dev-login: Quick login for development/testing.
   * Creates user + session via POST /api/chat/dev-login
   */
  const loginAsRole = useCallback(async (role: UserRole): Promise<boolean> => {
    try {
      const backendRole =
        role === "ADMIN" ? "admin" : role === "LECTURER" ? "lecturer" : "student";
      const result = await api.devLogin(backendRole);
      if (result.success && result.user) {
        await refetch();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [refetch]);

  const logout = useCallback(async () => {
    await authClient.signOut();
    await refetch();
  }, [refetch]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: isPending,
        login,
        loginAsRole,
        logout,
        isAuthenticated: !!user,
        refetchSession: () => {
          void refetch();
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/** Redirect path after login based on backend role. */
export function portalPathForRole(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "/superadmin";
    case "LECTURER":
      return "/teacher";
    case "STUDENT":
      return "/student";
  }
}

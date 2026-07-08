"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  ReactNode,
} from "react";
import { authClient } from "../../lib/auth-client";

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
      return {
        success: false,
        error: result.error.message ?? "Đăng nhập thất bại",
      };
    }
    await refetch();
    return { success: true };
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

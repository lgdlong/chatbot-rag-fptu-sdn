"use client";

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from "react";
import * as api from "@/lib/api";

export type UserRole = "superadmin" | "teacher" | "student";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<UserRole | false>;
  loginAsRole: (role: UserRole) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Map backend role strings to frontend role type */
function mapRole(backendRole: string | null | undefined): UserRole {
  switch (backendRole?.toUpperCase()) {
    case "ADMIN":
      return "superadmin";
    case "LECTURER":
      return "teacher";
    case "STUDENT":
    default:
      return "student";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(false);

  // Check existing session on mount
  const checkSession = useCallback(async () => {
    try {
      const { user: sessionUser } = await api.getSession();
      if (sessionUser) {
        const userData: User = {
          id: sessionUser.id,
          email: sessionUser.email,
          role: mapRole(sessionUser.role),
          name: sessionUser.name || sessionUser.email.split("@")[0],
        };
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      checkSession();
    }
  }, [checkSession]);

  /**
   * Login using email/password via Better Auth sign-in endpoint.
   */
  const login = async (email: string, password: string): Promise<UserRole | false> => {
    try {
      const result = await api.signInEmail(email, password);
      if (result.user) {
        const role = mapRole(result.user.role);
        const userData: User = {
          id: result.user.id,
          email: result.user.email,
          role,
          name: result.user.name || email.split("@")[0],
        };
        setUser(userData);
        return role;
      }
      return false;
    } catch {
      return false;
    }
  };

  /**
   * Dev-login: Quick login for development/testing.
   * Creates user + session via POST /api/chat/dev-login
   */
  const loginAsRole = async (role: UserRole): Promise<boolean> => {
    try {
      const backendRole =
        role === "superadmin" ? "admin" : role === "teacher" ? "lecturer" : "student";
      const result = await api.devLogin(backendRole);
      if (result.success && result.user) {
        const userData: User = {
          id: result.user.id,
          email: result.user.email,
          role: mapRole(result.user.role),
          name: result.user.name || result.user.email.split("@")[0],
        };
        setUser(userData);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    try {
      await api.signOut();
    } catch {
      // ignore sign-out errors
    }
    setUser(null);
  };

  const contextValue: AuthContextType = {
    user,
    login,
    loginAsRole,
    logout,
    isAuthenticated: !!user,
    isLoading,
  };

  return (
    <AuthContext.Provider value={contextValue}>
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

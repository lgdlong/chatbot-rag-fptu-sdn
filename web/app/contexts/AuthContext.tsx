"use client";

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";

export type UserRole = "superadmin" | "teacher" | "student";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  loginWithGoogle: (email: string, role: UserRole) => Promise<boolean>;
  loginAsRole: (role: UserRole) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Core mock users database synced with credentials.json
const mockUsers = {
  superadmin: {
    id: "admin_1",
    email: "admin@fpt.edu.vn",
    password: "AdminPassword123!",
    role: "superadmin" as UserRole,
    name: "Quan tri vien",
  },
  teachers: [
    {
      id: "lecturer_1",
      email: "lecturer1@fpt.edu.vn",
      password: "LecturerPassword123!",
      role: "teacher" as UserRole,
      name: "Giang vien Mot",
    },
    {
      id: "lecturer_2",
      email: "lecturer2@fpt.edu.vn",
      password: "LecturerPassword123!",
      role: "teacher" as UserRole,
      name: "Giang vien Hai",
    },
  ],
  students: [
    {
      id: "student_1",
      email: "huydqse180459@fpt.edu.vn",
      password: "123456",
      role: "student" as UserRole,
      name: "Duong Quang Huy",
    },
    {
      id: "student_2",
      email: "student2@fpt.edu.vn",
      password: "StudentPassword123!",
      role: "student" as UserRole,
      name: "Sinh vien Hai",
    },
  ],
  studentWhitelist: [
    "student1@fpt.edu.vn",
    "student2@fpt.edu.vn",
    "student3@fpt.edu.vn",
    "student4@fpt.edu.vn",
    "student5@fpt.edu.vn",
  ],
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Lazy initializer only runs on the client (no SSR)
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem("user");
      return stored ? (JSON.parse(stored) as User) : null;
    } catch {
      return null;
    }
  });

  // Track client mount to avoid SSR hydration mismatch
  const isMountedRef = useRef(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    isMountedRef.current = true;
    // Delay one tick so this setState is NOT considered "synchronous in effect"
    const id = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(id);
  }, []);

  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    if (!email.endsWith("@fpt.edu.vn")) {
      return false;
    }

    if (role === "superadmin") {
      if (
        email === mockUsers.superadmin.email &&
        password === mockUsers.superadmin.password
      ) {
        const userData: User = {
          id: mockUsers.superadmin.id,
          email: mockUsers.superadmin.email,
          role: mockUsers.superadmin.role,
          name: mockUsers.superadmin.name,
        };
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        return true;
      }
      return false;
    }

    if (role === "teacher") {
      const teacher = mockUsers.teachers.find(
        (t) => t.email === email && t.password === password
      );
      if (teacher) {
        const userData: User = {
          id: teacher.id,
          email: teacher.email,
          role: teacher.role,
          name: teacher.name,
        };
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        return true;
      }
      return false;
    }

    if (role === "student") {
      const student = mockUsers.students.find(
        (s) => s.email === email && s.password === password
      );
      if (student) {
        const userData: User = {
          id: student.id,
          email: student.email,
          role: student.role,
          name: student.name,
        };
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        return true;
      }
      return false;
    }

    return false;
  };

  const loginWithGoogle = async (email: string, role: UserRole): Promise<boolean> => {
    if (!email.endsWith("@fpt.edu.vn")) {
      return false;
    }

    if (role === "teacher") {
      const teacher = mockUsers.teachers.find((t) => t.email === email);
      if (teacher) {
        const userData: User = {
          id: teacher.id,
          email: teacher.email,
          role: teacher.role,
          name: teacher.name,
        };
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        return true;
      }
      // If not found in mock list, let them log in as demo teacher anyway
      const userData: User = {
        id: `lecturer_${Date.now()}`,
        email,
        role: "teacher",
        name: email.split("@")[0],
      };
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      return true;
    }

    if (role === "student") {
      const userData: User = {
        id: `student_${Date.now()}`,
        email,
        role: "student",
        name: email.split("@")[0],
      };
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      return true;
    }

    return false;
  };

  const loginAsRole = async (role: UserRole): Promise<boolean> => {
    let userData: User;

    if (role === "superadmin") {
      userData = {
        id: mockUsers.superadmin.id,
        email: mockUsers.superadmin.email,
        role: "superadmin",
        name: mockUsers.superadmin.name,
      };
    } else if (role === "teacher") {
      const teacher = mockUsers.teachers[0];
      userData = {
        id: teacher.id,
        email: teacher.email,
        role: "teacher",
        name: teacher.name,
      };
    } else {
      const student = mockUsers.students[0];
      userData = {
        id: student.id,
        email: student.email,
        role: "student",
        name: student.name,
      };
    }

    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  // Prevent SSR flash/mismatch
  const contextValue = {
    user: isMounted ? user : null,
    login,
    loginWithGoogle,
    loginAsRole,
    logout,
    isAuthenticated: isMounted ? !!user : false,
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

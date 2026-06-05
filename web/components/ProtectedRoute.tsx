"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, UserRole } from "../app/contexts/AuthContext";
import { Center, Loader } from "@mantine/core";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (user && !allowedRoles.includes(user.role)) {
      if (user.role === "superadmin") {
        router.push("/superadmin");
      } else if (user.role === "teacher") {
        router.push("/teacher");
      } else if (user.role === "student") {
        router.push("/student");
      } else {
        router.push("/login");
      }
    }
  }, [user, isAuthenticated, allowedRoles, router]);

  if (!isAuthenticated || !user || !allowedRoles.includes(user.role)) {
    return (
      <Center style={{ width: "100vw", height: "100vh" }}>
        <Loader color="#1A3A5C" size="xl" type="bars" />
      </Center>
    );
  }

  return <>{children}</>;
}

"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useAuth,
  UserRole,
  portalPathForRole,
} from "../app/contexts/AuthContext";
import { Center, Loader } from "@mantine/core";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (user && !allowedRoles.includes(user.role)) {
      router.push(portalPathForRole(user.role));
    }
  }, [user, isAuthenticated, isLoading, allowedRoles, router]);

  if (isLoading || !isAuthenticated || !user || !allowedRoles.includes(user.role)) {
    return (
      <Center style={{ width: "100vw", height: "100vh" }}>
        <Loader color="#1A3A5C" size="xl" type="bars" />
      </Center>
    );
  }

  return <>{children}</>;
}

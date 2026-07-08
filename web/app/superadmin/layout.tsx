"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AppShell,
  Group,
  Text,
  Stack,
  Box,
  Avatar,
  UnstyledButton,
} from "@mantine/core";
import {
  IconLayoutDashboard,
  IconShield,
  IconUserCheck,
  IconLogout,
  IconCrown,
  IconUserCog,
} from "@tabler/icons-react";
import { useAuth } from "../contexts/AuthContext";
import { ProtectedRoute } from "../../components/ProtectedRoute";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const navigation = [
    { name: "Dashboard", href: "/superadmin", icon: IconLayoutDashboard },
    { name: "Admin Accounts", href: "/superadmin/admins", icon: IconShield },
    { name: "Student Whitelist", href: "/superadmin/whitelist", icon: IconUserCheck },
    { name: "Yêu cầu Giảng viên", href: "/superadmin/lecturer-requests", icon: IconUserCog },
  ];

  const isActive = (href: string) => {
    if (href === "/superadmin") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const userInitial = user?.email?.charAt(0).toUpperCase() || "A";

  return (
    <ProtectedRoute allowedRoles={["superadmin"]}>
      <AppShell
        navbar={{ width: 260, breakpoint: "sm" }}
        styles={{
          navbar: { backgroundColor: "#1A3A5C", color: "white", borderRight: "none" },
          main: { backgroundColor: "#F8FAFC", minHeight: "100vh" },
        }}
      >
        <AppShell.Navbar p={0}>
          {/* Logo Header */}
          <Box p="md" style={{ borderBottom: "1px solid #0D2137", height: "64px", display: "flex", alignContent: "center" }}>
            <Group gap="sm" style={{ height: "100%" }}>
              <Box
                style={{
                  backgroundColor: "white",
                  color: "#1A3A5C",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                }}
              >
                <IconCrown size={20} />
              </Box>
              <div>
                <Text fw={900} size="sm" style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Super Admin
                </Text>
                <Text fw={700} size="9px" style={{ color: "#9DBAD9", textTransform: "uppercase", letterSpacing: "1px" }}>
                  Hệ thống Root
                </Text>
              </div>
            </Group>
          </Box>

          {/* Navigation Links */}
          <Stack gap="xs" py="md" style={{ flexGrow: 1 }}>
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <UnstyledButton
                  key={item.name}
                  component={Link}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 24px",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: active ? "white" : "#9DBAD9",
                    backgroundColor: active ? "#0D2137" : "transparent",
                    borderLeft: active ? "4px solid #FFC107" : "4px solid transparent",
                    transition: "all 0.2s ease",
                  }}
                  className="nav-link"
                >
                  <Icon size={18} color={active ? "#FFC107" : "#9DBAD9"} />
                  <Text span fw={700}>{item.name}</Text>
                </UnstyledButton>
              );
            })}
          </Stack>

          {/* Profile footer panel */}
          <Box p="md" style={{ borderTop: "1px solid #0D2137" }}>
            <Group gap="sm" mb="md" px="xs">
              <Avatar color="#FFC107" radius={0} size="sm" fw={800} style={{ border: "1px solid #4A85B9", color: "#1A3A5C" }}>
                {userInitial}
              </Avatar>
              <Box style={{ flexGrow: 1, overflow: "hidden" }}>
                <Text size="xs" fw={700} style={{ color: "white", textTransform: "uppercase" }} truncate>
                  {user?.email?.split("@")[0] || "admin"}
                </Text>
                <Text size="10px" fw={700} style={{ color: "#FFC107", textTransform: "uppercase" }}>
                  Super Admin
                </Text>
              </Box>
            </Group>

            <UnstyledButton
              onClick={handleLogout}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                fontSize: "10px",
                fontWeight: 800,
                color: "#9DBAD9",
                width: "100%",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
              className="hover-text-white"
            >
              <IconLogout size={16} />
              Đăng xuất
            </UnstyledButton>
          </Box>
        </AppShell.Navbar>

        <AppShell.Main>
          <Box p="lg">
            {children}
          </Box>
        </AppShell.Main>
      </AppShell>
    </ProtectedRoute>
  );
}

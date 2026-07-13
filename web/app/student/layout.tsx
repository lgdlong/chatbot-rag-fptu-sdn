"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AppShell,
  Container,
  Group,
  Text,
  Menu,
  UnstyledButton,
  Avatar,
  Box,
  Badge,
  Divider,
  Stack,
} from "@mantine/core";
import {
  IconLogout,
  IconChevronDown,
  IconBook2,
  IconSchool,
  IconHome,
} from "@tabler/icons-react";
import { useAuth } from "../contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const navigation = [
    { name: "Trang chủ", href: "/student", icon: IconHome },
  ];

  const isActive = (href: string) => {
    if (href === "/student") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const userInitial = user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "S";
  const userName = user?.name || user?.email?.split("@")[0] || "Student";
  const userEmail = user?.email || "student@fpt.edu.vn";

  return (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <AppShell
        header={{ height: 64 }}
        navbar={{ width: 260, breakpoint: "sm" }}
        styles={{
          navbar: { backgroundColor: "#1A3A5C", color: "white", borderRight: "none" },
          main: {
            backgroundColor: "#F0F4F8",
            minHeight: "100vh",
          },
        }}
      >
        {/* ─── HEADER ─── */}
        <AppShell.Header
          style={{
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            background: "linear-gradient(135deg, #1A3A5C 0%, #0f2848 60%, #0a1e3d 100%)",
            boxShadow: "0 2px 16px rgba(10, 30, 61, 0.45)",
          }}
        >
          <Container fluid style={{ height: "100%" }}>
            <Group justify="space-between" align="center" style={{ height: "100%" }}>

              {/* ─── Logo + Brand ─── */}
              <Link href="/student" style={{ textDecoration: "none" }}>
                <Group gap="sm" align="center">
                  {/* FPT Hexagon mark */}
                  <Box
                    style={{
                      background: "linear-gradient(135deg, #F37021 0%, #ff8c42 100%)",
                      color: "white",
                      width: "38px",
                      height: "38px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 900,
                      fontSize: "12px",
                      letterSpacing: "0.5px",
                      clipPath: "polygon(0 0, 88% 0, 100% 12%, 100% 100%, 12% 100%, 0 88%)",
                      flexShrink: 0,
                    }}
                  >
                    FPT
                  </Box>
                  <Box>
                    <Text
                      fw={900}
                      size="sm"
                      style={{
                        color: "white",
                        textTransform: "uppercase",
                        letterSpacing: "1.5px",
                        lineHeight: 1.1,
                      }}
                    >
                      RAG Chatbot
                    </Text>
                    <Text
                      size="10px"
                      style={{
                        color: "rgba(255,255,255,0.45)",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        lineHeight: 1,
                      }}
                    >
                      Mini FLM · FPT University
                    </Text>
                  </Box>
                </Group>
              </Link>

              {/* ─── Right: Role badge + User menu ─── */}
              <Group gap="sm" align="center">
                {/* Role pill */}
                <Badge
                  size="sm"
                  radius="sm"
                  leftSection={<IconSchool size={10} />}
                  visibleFrom="sm"
                  style={{
                    background: "rgba(35, 172, 104, 0.15)",
                    border: "1px solid rgba(35, 172, 104, 0.35)",
                    color: "#4ade80",
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                  }}
                >
                  Sinh viên
                </Badge>

                {/* Thin divider */}
                <Box
                  visibleFrom="sm"
                  style={{
                    width: "1px",
                    height: "28px",
                    background: "rgba(255,255,255,0.12)",
                  }}
                />

                {/* User dropdown */}
                <Menu
                  shadow="xl"
                  width={248}
                  position="bottom-end"
                  radius="md"
                  transitionProps={{ transition: "pop-top-right", duration: 150 }}
                >
                  <Menu.Target>
                    <UnstyledButton
                      style={{
                        padding: "5px 10px 5px 6px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        borderRadius: "10px",
                        background: "rgba(255,255,255,0.07)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        transition: "all 0.2s ease",
                        cursor: "pointer",
                      }}
                      className="user-btn-hover"
                    >
                      <Avatar
                        size={28}
                        radius="xl"
                        style={{
                          background: "linear-gradient(135deg, #F37021, #ff8c42)",
                          color: "white",
                          fontWeight: 800,
                          fontSize: "12px",
                          flexShrink: 0,
                        }}
                      >
                        {userInitial}
                      </Avatar>
                      <Box visibleFrom="xs" style={{ lineHeight: 1 }}>
                        <Text size="xs" fw={700} style={{ color: "white", lineHeight: 1.25 }}>
                          {userName}
                        </Text>
                        <Text size="10px" style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1 }}>
                          {userEmail}
                        </Text>
                      </Box>
                      <IconChevronDown size={13} color="rgba(255,255,255,0.4)" style={{ flexShrink: 0 }} />
                    </UnstyledButton>
                  </Menu.Target>

                  <Menu.Dropdown p={0} style={{ overflow: "hidden" }}>
                    {/* Dropdown header */}
                    <Box
                      px="md"
                      py="sm"
                      style={{
                        background: "linear-gradient(135deg, #1A3A5C 0%, #0f2848 100%)",
                      }}
                    >
                      <Group gap="sm">
                        <Avatar
                          size={38}
                          radius="xl"
                          style={{
                            background: "linear-gradient(135deg, #F37021, #ff8c42)",
                            color: "white",
                            fontWeight: 800,
                            flexShrink: 0,
                          }}
                        >
                          {userInitial}
                        </Avatar>
                        <Box style={{ minWidth: 0 }}>
                          <Text size="sm" fw={700} style={{ color: "white", lineHeight: 1.2 }} truncate>
                            {userName}
                          </Text>
                          <Text size="xs" style={{ color: "rgba(255,255,255,0.55)", wordBreak: "break-all" }}>
                            {userEmail}
                          </Text>
                        </Box>
                      </Group>
                      <Badge
                        size="xs"
                        mt="sm"
                        leftSection={<IconSchool size={8} />}
                        style={{
                          background: "rgba(35, 172, 104, 0.2)",
                          border: "1px solid rgba(35, 172, 104, 0.4)",
                          color: "#4ade80",
                        }}
                      >
                        Sinh viên · FPT University
                      </Badge>
                    </Box>

                    <Box py={4}>
                      <Menu.Item
                        leftSection={<IconBook2 size={14} color="#1A3A5C" />}
                        component={Link}
                        href="/student"
                        style={{ fontWeight: 600, fontSize: "13px", margin: "2px 4px", borderRadius: "6px" }}
                      >
                        Tra cứu môn học
                      </Menu.Item>
                    </Box>

                    <Divider />

                    <Box py={4}>
                      <Menu.Item
                        color="red"
                        leftSection={<IconLogout size={14} />}
                        onClick={handleLogout}
                        style={{ fontWeight: 700, fontSize: "13px", margin: "2px 4px", borderRadius: "6px" }}
                      >
                        Đăng xuất
                      </Menu.Item>
                    </Box>
                  </Menu.Dropdown>
                </Menu>
              </Group>
            </Group>
          </Container>
        </AppShell.Header>

        {/* ─── SIDEBAR ─── */}
        <AppShell.Navbar p={0}>
          {/* Logo Brand Header */}
          <Box p="md" style={{ borderBottom: "1px solid #0D2137", height: "64px", display: "flex", alignContent: "center" }}>
            <Group gap="sm" style={{ height: "100%" }}>
              <Box
                style={{
                  background: "linear-gradient(135deg, #F37021 0%, #ff8c42 100%)",
                  color: "white",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: "10px",
                }}
              >
                FPT
              </Box>
              <div>
                <Text fw={900} size="sm" style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  RAG Chatbot
                </Text>
                <Text fw={700} size="9px" style={{ color: "#9DBAD9", textTransform: "uppercase", letterSpacing: "1px" }}>
                  Sinh viên Portal
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

          {/* User Profile at Bottom */}
          <Box p="md" style={{ borderTop: "1px solid #0D2137" }}>
            <Group gap="sm" mb="md" px="xs">
              <Avatar
                size="sm"
                radius="xl"
                fw={800}
                style={{
                  background: "linear-gradient(135deg, #F37021, #ff8c42)",
                  color: "white",
                  border: "1px solid #4A85B9",
                }}
              >
                {userInitial}
              </Avatar>
              <Box style={{ flexGrow: 1, overflow: "hidden" }}>
                <Text size="xs" fw={700} style={{ color: "white", textTransform: "uppercase" }} truncate>
                  {userName}
                </Text>
                <Text size="10px" fw={700} style={{ color: "#4ade80", textTransform: "uppercase" }}>
                  Sinh viên
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

        {/* ─── Main Content ─── */}
        <AppShell.Main>
          <Box style={{ minHeight: "calc(100vh - 64px)" }}>
            {children}
          </Box>
        </AppShell.Main>
      </AppShell>

      <style>{`
        .user-btn-hover:hover {
          background: rgba(255,255,255,0.13) !important;
          border-color: rgba(255,255,255,0.2) !important;
        }
      `}</style>
    </ProtectedRoute>
  );
}
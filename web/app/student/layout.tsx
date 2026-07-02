"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
} from "@mantine/core";
import {
  IconLogout,
  IconChevronDown,
  IconBook2,
  IconSchool,
} from "@tabler/icons-react";
import { useAuth } from "../contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const userInitial = user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "S";
  const userName = user?.name || user?.email?.split("@")[0] || "Student";
  const userEmail = user?.email || "student@fpt.edu.vn";

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <AppShell
        header={{ height: 64 }}
        styles={{
          main: {
            backgroundColor: "#F0F4F8",
            minHeight: "100vh",
            paddingTop: "64px",
            paddingLeft: 0,
            paddingRight: 0,
            paddingBottom: 0,
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
          <Container size="xl" style={{ height: "100%" }}>
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
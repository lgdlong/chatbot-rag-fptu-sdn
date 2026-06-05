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
  Button,
} from "@mantine/core";
import { IconLogout, IconUser, IconChevronDown } from "@tabler/icons-react";
import { useAuth } from "../contexts/AuthContext";
import { ProtectedRoute } from "../../components/ProtectedRoute";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const userInitial = user?.email?.charAt(0).toUpperCase() || "S";
  const userName = user?.email?.split("@")[0] || "student";

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <AppShell
        header={{ height: 64 }}
        styles={{
          main: { backgroundColor: "#F8FAFC", minHeight: "100vh" },
        }}
      >
        <AppShell.Header
          style={{
            borderBottom: "1px solid #E2E8F0",
            backgroundColor: "white",
            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
          }}
        >
          <Container size="90%" style={{ height: "100%" }}>
            <Group justify="space-between" align="center" style={{ height: "100%" }}>
              <Link href="/student" style={{ textDecoration: "none" }}>
                <Group gap="xs">
                  <Box
                    style={{
                      backgroundColor: "#1A3A5C",
                      color: "white",
                      width: "32px",
                      height: "32px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      fontSize: "14px",
                    }}
                  >
                    FPT
                  </Box>
                  <Text
                    fw={900}
                    size="md"
                    style={{
                      color: "#1A3A5C",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    RAG Chatbot & Mini FLM
                  </Text>
                </Group>
              </Link>

              <Group>
                <Menu shadow="md" width={200} position="bottom-end" radius={0}>
                  <Menu.Target>
                    <UnstyledButton
                      style={{
                        padding: "6px 12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        borderRadius: "4px",
                        transition: "background-color 0.2s ease",
                      }}
                      className="hover-bg-gray"
                    >
                      <Avatar color="#1A3A5C" radius={0} size="sm" fw={700}>
                        {userInitial}
                      </Avatar>
                      <Group gap={4}>
                        <Text size="sm" fw={700} style={{ textTransform: "uppercase", color: "#4A5568" }}>
                          {userName}
                        </Text>
                        <IconChevronDown size={14} color="#718096" />
                      </Group>
                    </UnstyledButton>
                  </Menu.Target>

                  <Menu.Dropdown>
                    <Box px="md" py="xs" style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <Text size="10px" fw={700} c="dimmed" style={{ textTransform: "uppercase", letterSpacing: "1px" }}>
                        Tài khoản sinh viên
                      </Text>
                      <Text size="xs" fw={700} style={{ color: "#1A3A5C", wordBreak: "break-all" }}>
                        {user?.email}
                      </Text>
                    </Box>

                    <Menu.Item
                      color="red"
                      leftSection={<IconLogout size={14} />}
                      onClick={handleLogout}
                      style={{ fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}
                    >
                      Đăng xuất
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>
            </Group>
          </Container>
        </AppShell.Header>

        <AppShell.Main>
          <Container size="90%" py="xl">
            {children}
          </Container>
        </AppShell.Main>
      </AppShell>
    </ProtectedRoute>
  );
}

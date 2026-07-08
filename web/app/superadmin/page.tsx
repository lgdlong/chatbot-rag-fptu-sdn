"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Title,
  Text,
  Button,
  Card,
  ThemeIcon,
  Group,
  Stack,
  SimpleGrid,
  Grid,
  Box,
  Loader,
  Center,
} from "@mantine/core";
import { BarChart } from "@mantine/charts";
import { notifications } from "@mantine/notifications";
import {
  IconShield,
  IconUserCheck,
  IconActivity,
  IconPlus,
  IconUsers,
  IconSettings,
} from "@tabler/icons-react";
import { authClient, apiFetch } from "../../lib/auth-client";

interface WhitelistListResponse {
  emails: unknown[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface DashboardStats {
  totalAdmins: number;
  totalWhitelist: number;
  totalUsers: number;
}

const chartData = [
  { month: "T3/2026", Queries: 450 },
  { month: "T4/2026", Queries: 890 },
  { month: "T5/2026", Queries: 1200 },
  { month: "T6/2026", Queries: 1482 },
];

const systemActivity = [
  {
    type: "admin",
    action: "Tài khoản admin mới được tạo: admin2@fpt.edu.vn",
    time: "1 giờ trước",
  },
  {
    type: "whitelist",
    action: "Cập nhật danh sách whitelist: thêm 15 sinh viên khóa K19",
    time: "3 giờ trước",
  },
  {
    type: "login",
    action: "Quản trị viên admin1@fpt.edu.vn đã đăng nhập",
    time: "5 giờ trước",
  },
];

function formatCount(n: number): string {
  return n.toLocaleString("vi-VN");
}

export default function SuperAdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const [usersPageRes, whitelistRes, usersListRes] = await Promise.all([
        authClient.admin.listUsers({ query: { limit: "1", offset: "0" } }),
        apiFetch<WhitelistListResponse>("/api/whitelist?page=1&limit=1"),
        authClient.admin.listUsers({ query: { limit: "500", offset: "0" } }),
      ]);

      if (usersPageRes.error) {
        throw new Error(usersPageRes.error.message ?? "Không tải được danh sách người dùng");
      }

      const totalUsers = usersPageRes.data?.total ?? 0;
      const users = usersListRes.data?.users ?? [];
      const totalAdmins = users.filter((u) => u.role === "ADMIN").length;
      const totalWhitelist = whitelistRes.pagination.total;

      setStats({ totalAdmins, totalWhitelist, totalUsers });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không tải được số liệu dashboard";
      notifications.show({ title: "Lỗi", message, color: "red" });
      setStats({ totalAdmins: 0, totalWhitelist: 0, totalUsers: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const statCards = [
    {
      name: "Tổng Admin",
      value: stats ? formatCount(stats.totalAdmins) : "—",
      icon: IconShield,
      color: "blue" as const,
      description: "Tài khoản quản trị (role ADMIN)",
    },
    {
      name: "Sinh viên Whitelist",
      value: stats ? formatCount(stats.totalWhitelist) : "—",
      icon: IconUserCheck,
      color: "green" as const,
      description: "Email sinh viên được cấp quyền",
    },
    {
      name: "Tổng người dùng",
      value: stats ? formatCount(stats.totalUsers) : "—",
      icon: IconUsers,
      color: "purple" as const,
      description: "Tất cả tài khoản trong hệ thống",
    },
  ];

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="center">
        <div>
          <Title order={1} style={{ fontSize: "24px", fontWeight: 900, color: "#1A3A5C" }}>
            Tổng quan hệ thống
          </Title>
          <Text size="sm" c="dimmed">
            Quản lý và giám sát tài nguyên RAG Hybrid
          </Text>
        </div>
        <Group gap="xs">
          <Button
            variant="outline"
            color="gray"
            radius={0}
            fw={700}
            loading={loading}
            onClick={() => void loadStats()}
          >
            Làm mới
          </Button>
          <Button
            component={Link}
            href="/superadmin/admins"
            leftSection={<IconPlus size={16} />}
            style={{ backgroundColor: "#F26F21" }}
            radius={0}
            fw={700}
          >
            Thêm Quản trị viên
          </Button>
        </Group>
      </Group>

      {loading && !stats ? (
        <Center py="xl">
          <Loader color="#1A3A5C" size="lg" type="bars" />
        </Center>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            const colors = {
              blue: { bg: "#E8EFF7", text: "#1A3A5C" },
              green: { bg: "#DCFCE7", text: "#16A34A" },
              purple: { bg: "#F3E8FF", text: "#7C3AED" },
            }[stat.color];

            return (
              <Card
                key={stat.name}
                p="lg"
                radius={0}
                style={{ border: "1px solid #E2E8F0", backgroundColor: "white" }}
                className="hover-card"
              >
                <Stack gap="sm">
                  <Group justify="space-between">
                    <ThemeIcon size={44} radius={0} style={{ backgroundColor: colors.bg, color: colors.text }}>
                      <Icon size={22} />
                    </ThemeIcon>
                    <Text size="10px" fw={800} c="dimmed" style={{ textTransform: "uppercase", letterSpacing: "1px" }}>
                      Thời gian thực
                    </Text>
                  </Group>
                  <div>
                    <Text size="xs" fw={700} c="dimmed" style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {stat.name}
                    </Text>
                    <Text style={{ fontSize: "28px", fontWeight: 900, color: "#1A3A5C", marginTop: "4px" }}>
                      {stat.value}
                    </Text>
                    <Text size="11px" c="dimmed" mt={4}>
                      {stat.description}
                    </Text>
                  </div>
                </Stack>
              </Card>
            );
          })}
        </SimpleGrid>
      )}

      <Grid gap="md">
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Stack gap="md">
            <Card radius={0} p="lg" style={{ border: "1px solid #E2E8F0", backgroundColor: "white" }}>
              <Title order={2} style={{ fontSize: "16px", fontWeight: 900, color: "#1A3A5C", marginBottom: "16px" }}>
                Số lượng câu hỏi RAG Chatbot hàng tháng
              </Title>
              <Box style={{ height: "220px" }}>
                <BarChart
                  h={200}
                  data={chartData}
                  dataKey="month"
                  series={[{ name: "Queries", color: "#1A3A5C" }]}
                  tickLine="y"
                  gridAxis="y"
                />
              </Box>
            </Card>

            <Card p={0} radius={0} style={{ border: "1px solid #E2E8F0", backgroundColor: "white" }}>
              <Box px="md" py="sm" style={{ borderBottom: "1px solid #E2E8F0", backgroundColor: "#F8FAFC" }}>
                <Title order={2} style={{ fontSize: "16px", fontWeight: 900, color: "#1A1A1A" }}>
                  Nhật ký hoạt động hệ thống
                </Title>
              </Box>
              <Stack gap={0}>
                {systemActivity.map((activity, index) => (
                  <Box
                    key={index}
                    p="md"
                    style={{
                      borderBottom: index === systemActivity.length - 1 ? "none" : "1px solid #F1F5F9",
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                    }}
                    className="hover-bg-gray"
                  >
                    <ThemeIcon size={36} radius={0} style={{ backgroundColor: "#E8EFF7", color: "#1A3A5C" }}>
                      <IconActivity size={18} />
                    </ThemeIcon>
                    <Box style={{ flexGrow: 1 }}>
                      <Text size="sm" fw={700} style={{ color: "#1A1A1A" }}>
                        {activity.action}
                      </Text>
                      <Text size="10px" c="dimmed" mt={2}>
                        {activity.time}
                      </Text>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Card>
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Stack gap="md">
            <Text fw={800} size="xs" style={{ color: "#1A3A5C", letterSpacing: "1.5px", textTransform: "uppercase" }}>
              Lối tắt quản lý
            </Text>

            <Card
              p="lg"
              radius={0}
              style={{ border: "1px solid #E2E8F0", backgroundColor: "white", cursor: "pointer" }}
              component={Link}
              href="/superadmin/admins"
              className="hover-card"
            >
              <Group gap="md">
                <ThemeIcon size={44} radius={0} style={{ backgroundColor: "#E8EFF7", color: "#1A3A5C" }}>
                  <IconUsers size={22} />
                </ThemeIcon>
                <div>
                  <Title order={3} style={{ fontSize: "15px", fontWeight: 800, color: "#1A3A5C" }}>
                    QUẢN LÝ TÀI KHOẢN
                  </Title>
                  <Text size="xs" c="dimmed" mt={4}>
                    Danh sách người dùng & admin
                  </Text>
                </div>
              </Group>
            </Card>

            <Card
              p="lg"
              radius={0}
              style={{ border: "1px solid #E2E8F0", backgroundColor: "white", cursor: "pointer" }}
              component={Link}
              href="/superadmin/whitelist"
              className="hover-card"
            >
              <Group gap="md">
                <ThemeIcon size={44} radius={0} style={{ backgroundColor: "#DCFCE7", color: "#16A34A" }}>
                  <IconUserCheck size={22} />
                </ThemeIcon>
                <div>
                  <Title order={3} style={{ fontSize: "15px", fontWeight: 800, color: "#1A3A5C" }}>
                    CẤU HÌNH WHITELIST
                  </Title>
                  <Text size="xs" c="dimmed" mt={4}>
                    Quản lý email sinh viên được duyệt
                  </Text>
                </div>
              </Group>
            </Card>

            <Card
              p="lg"
              radius={0}
              style={{ border: "1px solid #E2E8F0", backgroundColor: "white", cursor: "pointer" }}
              className="hover-card"
            >
              <Group gap="md">
                <ThemeIcon size={44} radius={0} style={{ backgroundColor: "#F3E8FF", color: "#7C3AED" }}>
                  <IconSettings size={22} />
                </ThemeIcon>
                <div>
                  <Title order={3} style={{ fontSize: "15px", fontWeight: 800, color: "#1A3A5C" }}>
                    GIÁM SÁT RAG
                  </Title>
                  <Text size="xs" c="dimmed" mt={4}>
                    Theo dõi hiệu năng Vector DB & Gemini Chunks
                  </Text>
                </div>
              </Group>
            </Card>
          </Stack>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}

"use client";

import React from "react";
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import {
  IconShield,
  IconUserCheck,
  IconActivity,
  IconUsers,
  IconBook,
  IconFileText,
  IconMessages,
  IconSchool,
  IconCloudOff,
  IconCrown,
} from "@tabler/icons-react";
import {
  getAdminDashboardStats,
  getQueryTrend,
  getAdminActivity,
  getTeacherStats,
  type DashboardStats,
  type QueryTrendItem,
  type ActivityItem,
  type TeacherStats,
} from "../../lib/api";

// ── Helpers ──

function formatCount(n: number): string {
  return n.toLocaleString("vi-VN");
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Vài giây trước";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  return new Date(iso).toLocaleDateString("vi-VN");
}

function formatMonth(ym: string): string {
  // "2026-03" → "T3/2026"
  const [y, m] = ym.split("-");
  return `T${Number(m)}/${y}`;
}

// ── Page ──

export default function SuperAdminDashboardPage() {
  const queryClient = useQueryClient();

  const dashboardStats = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: getAdminDashboardStats,
  });

  const trend = useQuery({
    queryKey: ["query-trend"],
    queryFn: () => getQueryTrend(12),
  });

  const activityQuery = useQuery({
    queryKey: ["admin-activity"],
    queryFn: () => getAdminActivity(20),
  });

  const teacherStats = useQuery({
    queryKey: ["teacher-stats"],
    queryFn: getTeacherStats,
  });

  // ── Denormalise for downstream ──

  const stats = dashboardStats.data;
  const chartData = trend.data ?? [];
  const activity = activityQuery.data ?? [];
  const loading = dashboardStats.isLoading && !dashboardStats.data;

  const refresh = () => {
    queryClient.invalidateQueries({
      queryKey: ["admin-dashboard", "query-trend", "admin-activity", "teacher-stats"],
    });
  };

  // ── Stat cards ──

  const statCards = stats
    ? [
        {
          name: "Quản trị viên",
          value: formatCount(stats.admins),
          icon: IconShield,
          color: "blue" as const,
          description: "Tài khoản role ADMIN",
        },
        {
          name: "Giảng viên",
          value: formatCount(stats.lecturers),
          icon: IconSchool,
          color: "cyan" as const,
          description: "Tài khoản role LECTURER",
        },
        {
          name: "Sinh viên",
          value: formatCount(stats.students),
          icon: IconUsers,
          color: "purple" as const,
          description: "Tài khoản role STUDENT",
        },
        {
          name: "Whitelist",
          value: formatCount(stats.whitelist),
          icon: IconUserCheck,
          color: "green" as const,
          description: "Email sinh viên được duyệt",
        },
        {
          name: "Môn học",
          value: formatCount(stats.courses),
          icon: IconBook,
          color: "orange" as const,
          description: "Course trong hệ thống",
        },
        {
          name: "Đề cương",
          value: formatCount(stats.syllabuses),
          icon: IconFileText,
          color: "red" as const,
          description: "Phiên bản Syllabus",
        },
        {
          name: "Tài liệu",
          value: formatCount(stats.documents),
          icon: IconFileText,
          color: "teal" as const,
          description: "Document đã upload",
        },
        {
          name: "Hội thoại",
          value: formatCount(stats.chatSessions),
          icon: IconMessages,
          color: "grape" as const,
          description: "Chat session đã tạo",
        },
      ]
    : [];

  const colorMap: Record<string, { bg: string; text: string }> = {
    blue: { bg: "#E8EFF7", text: "#1A3A5C" },
    cyan: { bg: "#E0F7FA", text: "#00838F" },
    green: { bg: "#DCFCE7", text: "#16A34A" },
    purple: { bg: "#F3E8FF", text: "#7C3AED" },
    orange: { bg: "#FFF3E0", text: "#E65100" },
    red: { bg: "#FFEBEE", text: "#C62828" },
    teal: { bg: "#E0F2F1", text: "#00695C" },
    grape: { bg: "#F3E5F5", text: "#7B1FA2" },
  };

  // ── Chart adapters ──

  const chartSeries = chartData.map((d) => ({
    month: formatMonth(d.month),
    Queries: d.queries,
  }));

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
        <Button
          variant="outline"
          size="xs"
          color="#1A3A5C"
          onClick={refresh}
          loading={loading}
        >
          Làm mới
        </Button>
      </Group>

      {loading && !stats ? (
        <Center py="xl">
          <Loader color="#1A3A5C" size="lg" type="bars" />
        </Center>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            const colors = colorMap[stat.color];
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
                    <Text
                      size="10px"
                      fw={800}
                      c="dimmed"
                      style={{ textTransform: "uppercase", letterSpacing: "1px" }}
                    >
                      Thời gian thực
                    </Text>
                  </Group>
                  <div>
                    <Text
                      size="xs"
                      fw={700}
                      c="dimmed"
                      style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}
                    >
                      {stat.name}
                    </Text>
                    <Text
                      style={{ fontSize: "28px", fontWeight: 900, color: "#1A3A5C", marginTop: "4px" }}
                    >
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

      {/* ── Teacher Statistics Section ── */}
      <Box>
        <Text
          fw={800}
          size="xs"
          style={{ color: "#1A3A5C", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "12px" }}
        >
          Thống kê giảng viên
        </Text>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
          {/* Total lecturers */}
          <Card p="lg" radius={0} style={{ border: "1px solid #E2E8F0", backgroundColor: "white" }} className="hover-card">
            <Stack gap="sm">
              <Group justify="space-between">
                <ThemeIcon size={44} radius={0} style={{ backgroundColor: "#E8EFF7", color: "#1A3A5C" }}>
                  <IconSchool size={22} />
                </ThemeIcon>
              </Group>
              <div>
                <Text size="xs" fw={700} c="dimmed" style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Tổng giảng viên
                </Text>
                <Text style={{ fontSize: "28px", fontWeight: 900, color: "#1A3A5C", marginTop: "4px" }}>
                  {teacherStats.data ? formatCount(teacherStats.data.totalLecturers) : "—"}
                </Text>
                <Text size="11px" c="dimmed" mt={4}>
                  Tài khoản role LECTURER
                </Text>
              </div>
            </Stack>
          </Card>

          {/* Active last 7 days */}
          <Card p="lg" radius={0} style={{ border: "1px solid #E2E8F0", backgroundColor: "white" }} className="hover-card">
            <Stack gap="sm">
              <Group justify="space-between">
                <ThemeIcon size={44} radius={0} style={{ backgroundColor: "#DCFCE7", color: "#16A34A" }}>
                  <IconActivity size={22} />
                </ThemeIcon>
              </Group>
              <div>
                <Text size="xs" fw={700} c="dimmed" style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Hoạt động trong 7 ngày
                </Text>
                <Text style={{ fontSize: "28px", fontWeight: 900, color: "#1A3A5C", marginTop: "4px" }}>
                  {teacherStats.data ? formatCount(teacherStats.data.activeLastWeek) : "—"}
                </Text>
                <Text size="11px" c="dimmed" mt={4}>
                  Giảng viên có tương tác chatbot
                </Text>
              </div>
            </Stack>
          </Card>

          {/* Unsynced syllabuses */}
          <Card p="lg" radius={0} style={{ border: "1px solid #E2E8F0", backgroundColor: "white" }} className="hover-card">
            <Stack gap="sm">
              <Group justify="space-between">
                <ThemeIcon size={44} radius={0} style={{ backgroundColor: "#FFEBEE", color: "#C62828" }}>
                  <IconCloudOff size={22} />
                </ThemeIcon>
              </Group>
              <div>
                <Text size="xs" fw={700} c="dimmed" style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Syllabus chưa đồng bộ
                </Text>
                <Text style={{ fontSize: "28px", fontWeight: 900, color: "#1A3A5C", marginTop: "4px" }}>
                  {teacherStats.data ? formatCount(teacherStats.data.unsyncedSyllabuses) : "—"}
                </Text>
                <Text size="11px" c="dimmed" mt={4}>
                  Chưa đồng bộ lên RAG workspace
                </Text>
              </div>
            </Stack>
          </Card>

          {/* Top teachers */}
          <Card p="lg" radius={0} style={{ border: "1px solid #E2E8F0", backgroundColor: "white" }} className="hover-card">
            <Stack gap="sm">
              <Group justify="space-between">
                <ThemeIcon size={44} radius={0} style={{ backgroundColor: "#FFF3E0", color: "#E65100" }}>
                  <IconCrown size={22} />
                </ThemeIcon>
              </Group>
              <div>
                <Text size="xs" fw={700} c="dimmed" style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Top giảng viên
                </Text>
                <Text size="11px" c="dimmed" mt={4}>
                  Nhiều hội thoại nhất
                </Text>
                {teacherStats.data && teacherStats.data.topTeachers.length > 0 ? (
                  <Stack gap={4} mt="xs">
                    {teacherStats.data.topTeachers.map((t, i) => (
                      <Group key={t.userId} justify="space-between" gap="xs">
                        <Group gap={6} style={{ flex: 1, minWidth: 0 }}>
                          <Text size="xs" fw={800} c="dimmed" style={{ minWidth: 16 }}>
                            #{i + 1}
                          </Text>
                          <Text size="xs" fw={600} truncate style={{ flex: 1 }}>
                            {t.name}
                          </Text>
                        </Group>
                        <Text size="xs" fw={700} c="#1A3A5C">
                          {t.sessionCount}
                        </Text>
                      </Group>
                    ))}
                  </Stack>
                ) : (
                  <Text size="11px" c="dimmed" mt={4}>
                    Chưa có dữ liệu
                  </Text>
                )}
              </div>
            </Stack>
          </Card>
        </SimpleGrid>
      </Box>

      <Grid gap="md">
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Stack gap="md">
            <Card radius={0} p="lg" style={{ border: "1px solid #E2E8F0", backgroundColor: "white" }}>
              <Title order={2} style={{ fontSize: "16px", fontWeight: 900, color: "#1A3A5C", marginBottom: "16px" }}>
                Số lượng câu hỏi RAG Chatbot hàng tháng
              </Title>
              <Box style={{ height: "220px" }}>
                {chartSeries.length > 0 ? (
                  <BarChart
                    h={200}
                    data={chartSeries}
                    dataKey="month"
                    series={[{ name: "Queries", color: "#1A3A5C" }]}
                    tickLine="y"
                    gridAxis="y"
                  />
                ) : (
                  <Center h={200}>
                    <Text size="sm" c="dimmed">Chưa có dữ liệu</Text>
                  </Center>
                )}
              </Box>
            </Card>

            <Card p={0} radius={0} style={{ border: "1px solid #E2E8F0", backgroundColor: "white" }}>
              <Box px="md" py="sm" style={{ borderBottom: "1px solid #E2E8F0", backgroundColor: "#F8FAFC" }}>
                <Title order={2} style={{ fontSize: "16px", fontWeight: 900, color: "#1A1A1A" }}>
                  Nhật ký hoạt động hệ thống
                </Title>
              </Box>
              <Stack gap={0}>
                {activity.length > 0 ? (
                  activity.map((act, index) => (
                    <Box
                      key={act.id}
                      p="md"
                      style={{
                        borderBottom:
                          index === activity.length - 1 ? "none" : "1px solid #F1F5F9",
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                      }}
                      className="hover-bg-gray"
                    >
                      <ThemeIcon
                        size={36}
                        radius={0}
                        style={{ backgroundColor: "#E8EFF7", color: "#1A3A5C" }}
                      >
                        <IconActivity size={18} />
                      </ThemeIcon>
                      <Box style={{ flexGrow: 1 }}>
                        <Text size="sm" fw={700} style={{ color: "#1A1A1A" }}>
                          {act.action}{" "}
                          {act.user && (
                            <Text component="span" size="sm" c="dimmed">
                              — {act.user.name} ({act.user.email})
                            </Text>
                          )}
                        </Text>
                        <Text size="10px" c="dimmed" mt={2}>
                          {timeAgo(act.createdAt)}
                        </Text>
                      </Box>
                    </Box>
                  ))
                ) : (
                  <Box p="md">
                    <Text size="sm" c="dimmed">
                      Chưa có hoạt động nào được ghi nhận.
                    </Text>
                  </Box>
                )}
              </Stack>
            </Card>
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Stack gap="md">
            <Text
              fw={800}
              size="xs"
              style={{ color: "#1A3A5C", letterSpacing: "1.5px", textTransform: "uppercase" }}
            >
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
          </Stack>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}

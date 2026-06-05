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
} from "@mantine/core";
import { BarChart } from "@mantine/charts";
import {
  IconShield,
  IconUserCheck,
  IconActivity,
  IconAlertCircle,
  IconPlus,
  IconUsers,
  IconSettings,
} from "@tabler/icons-react";

export default function SuperAdminDashboardPage() {
  const stats = [
    {
      name: "Tổng Admin",
      value: "2",
      icon: IconShield,
      color: "blue",
      description: "Tài khoản quản trị đang hoạt động",
    },
    {
      name: "Sinh viên Whitelist",
      value: "1,250",
      icon: IconUserCheck,
      color: "green",
      description: "Email sinh viên được cấp quyền",
    },
    {
      name: "Phiên hoạt động",
      value: "42",
      icon: IconActivity,
      color: "purple",
      description: "Người dùng đang trực tuyến",
    },
    {
      name: "Yêu cầu phê duyệt",
      value: "5",
      icon: IconAlertCircle,
      color: "orange",
      description: "Syllabus đang chờ xử lý",
    },
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

  const chartData = [
    { month: "T3/2026", Queries: 450 },
    { month: "T4/2026", Queries: 890 },
    { month: "T5/2026", Queries: 1200 },
    { month: "T6/2026", Queries: 1482 },
  ];

  return (
    <Stack gap="xl">
      {/* Header */}
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
          <Button variant="outline" color="gray" radius={0} fw={700}>
            Xuất báo cáo
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

      {/* Stats Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const colors = {
            blue: { bg: "#E8EFF7", text: "#1A3A5C" },
            green: { bg: "#DCFCE7", text: "#16A34A" },
            purple: { bg: "#F3E8FF", text: "#7C3AED" },
            orange: { bg: "#FFE8D6", text: "#F37021" },
          }[stat.color] || { bg: "#F1F5F9", text: "#475569" };

          return (
            <Card key={stat.name} p="lg" radius={0} style={{ border: "1px solid #E2E8F0", backgroundColor: "white" }} className="hover-card">
              <Stack gap="sm">
                <Group justify="space-between">
                  <ThemeIcon size={44} radius={0} style={{ backgroundColor: colors.bg, color: colors.text }}>
                    <Icon size={22} />
                  </ThemeIcon>
                  <Text size="10px" fw={800} c="dimmed" style={{ textTransform: "uppercase", letterSpacing: "1px" }}>Tháng này</Text>
                </Group>
                <div>
                  <Text size="xs" fw={700} c="dimmed" style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>{stat.name}</Text>
                  <Text style={{ fontSize: "28px", fontWeight: 900, color: "#1A3A5C", marginTop: "4px" }}>{stat.value}</Text>
                  <Text size="11px" c="dimmed" mt={4}>{stat.description}</Text>
                </div>
              </Stack>
            </Card>
          );
        })}
      </SimpleGrid>

      {/* Main Grid: Chart & Actions */}
      <Grid gap="md">
        {/* Charts & System Logs */}
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Stack gap="md">
            {/* Chart */}
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

            {/* Activities */}
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
                      <Text size="sm" fw={700} style={{ color: "#1A1A1A" }}>{activity.action}</Text>
                      <Text size="10px" c="dimmed" mt={2}>{activity.time}</Text>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Card>
          </Stack>
        </Grid.Col>

        {/* Shortcuts */}
        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Stack gap="md">
            <Text fw={800} size="xs" style={{ color: "#1A3A5C", letterSpacing: "1.5px", textTransform: "uppercase" }}>Lối tắt quản lý</Text>
            
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
                  <Title order={3} style={{ fontSize: "15px", fontWeight: 800, color: "#1A3A5C" }}>QUẢN LÝ ADMIN</Title>
                  <Text size="xs" c="dimmed" mt={4}>Thêm, sửa, xóa các tài khoản admin</Text>
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
                  <Title order={3} style={{ fontSize: "15px", fontWeight: 800, color: "#1A3A5C" }}>CẤU HÌNH WHITELIST</Title>
                  <Text size="xs" c="dimmed" mt={4}>Quản lý dải email sinh viên được duyệt</Text>
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
                  <Title order={3} style={{ fontSize: "15px", fontWeight: 800, color: "#1A3A5C" }}>GIÁM SÁT RAG</Title>
                  <Text size="xs" c="dimmed" mt={4}>Theo dõi hiệu năng Vector DB & Gemini Chunks</Text>
                </div>
              </Group>
            </Card>
          </Stack>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import {
  Title,
  Text,
  SimpleGrid,
  Card,
  ThemeIcon,
  Group,
  Stack,
  Box,
  Grid,
} from "@mantine/core";
import {
  IconFileText,
  IconUpload,
  IconCircleCheck,
  IconClock,
} from "@tabler/icons-react";

export default function TeacherDashboardPage() {
  const stats = [
    {
      name: "Tổng Syllabus",
      value: "44",
      icon: IconFileText,
      color: "blue",
      description: "Chương trình SE",
    },
    {
      name: "Đang Hoạt Động",
      value: "38",
      icon: IconCircleCheck,
      color: "green",
      description: "Đã phê duyệt & sử dụng",
    },
    {
      name: "Bản Nháp",
      value: "6",
      icon: IconClock,
      color: "yellow",
      description: "Chưa duyệt",
    },
    {
      name: "Tài Liệu",
      value: "156",
      icon: IconUpload,
      color: "orange",
      description: "Đã index",
    },
  ];

  const recentActivity = [
    {
      type: "syllabus",
      action: "Syllabus FER202 đã được kích hoạt",
      time: "2 giờ trước",
      user: "admin@fpt.edu.vn",
    },
    {
      type: "document",
      action: "3 tài liệu đã upload vào SDN302",
      time: "5 giờ trước",
      user: "admin@fpt.edu.vn",
    },
  ];

  return (
    <Stack gap="xl">
      {/* Header */}
      <div>
        <Title order={1} style={{ fontSize: "24px", fontWeight: 900, color: "#1A3A5C" }}>
          Dashboard
        </Title>
        <Text size="sm" c="dimmed">
          Tổng quan hệ thống RAG Chatbot & Quản lý đề cương (Syllabus)
        </Text>
      </div>

      {/* Stats Grid */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const colors = {
            blue: { bg: "#E8EFF7", text: "#1A3A5C" },
            green: { bg: "#DCFCE7", text: "#16A34A" },
            yellow: { bg: "#FEF9C3", text: "#CA8A04" },
            orange: { bg: "#FFE8D6", text: "#F37021" },
          }[stat.color] || { bg: "#F1F5F9", text: "#475569" };

          return (
            <Card
              key={stat.name}
              p="lg"
              radius={0}
              style={{
                border: "1px solid #E2E8F0",
                backgroundColor: "white",
              }}
              className="hover-card"
            >
              <Stack gap="sm">
                <Group justify="space-between">
                  <ThemeIcon size={44} radius={0} style={{ backgroundColor: colors.bg, color: colors.text }}>
                    <Icon size={22} />
                  </ThemeIcon>
                </Group>
                <div>
                  <Text size="xs" fw={700} c="dimmed" style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {stat.name}
                  </Text>
                  <Text style={{ fontSize: "28px", fontWeight: 900, color: "#1A1A1A", marginTop: "4px" }}>
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

      {/* Details Grid */}
      <Grid gap="md">
        {/* Recent Activity */}
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Card p={0} radius={0} style={{ border: "1px solid #E2E8F0", backgroundColor: "white" }}>
            <Box px="md" py="sm" style={{ borderBottom: "1px solid #E2E8F0", backgroundColor: "#F8FAFC" }}>
              <Title order={2} style={{ fontSize: "16px", fontWeight: 900, color: "#1A1A1A" }}>
                Hoạt Động Gần Đây
              </Title>
            </Box>
            
            <Stack gap={0}>
              {recentActivity.map((activity, index) => (
                <Box
                  key={index}
                  p="md"
                  style={{
                    borderBottom: index === recentActivity.length - 1 ? "none" : "1px solid #F1F5F9",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "16px",
                  }}
                  className="hover-bg-gray"
                >
                  <ThemeIcon
                    size={40}
                    radius={0}
                    style={{
                      backgroundColor: activity.type === "syllabus" ? "#E8EFF7" : "#FFE8D6",
                      color: activity.type === "syllabus" ? "#1A3A5C" : "#F37021",
                    }}
                  >
                    {activity.type === "syllabus" ? <IconFileText size={20} /> : <IconUpload size={20} />}
                  </ThemeIcon>
                  <Box style={{ flexGrow: 1 }}>
                    <Text size="sm" fw={700} style={{ color: "#1A1A1A" }}>
                      {activity.action}
                    </Text>
                    <Text size="xs" c="dimmed" mt={4}>
                      bởi <Text span inherit fw={700}>{activity.user}</Text> · {activity.time}
                    </Text>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Card>
        </Grid.Col>

        {/* Quick Actions */}
        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Stack gap="md">
            <Card
              p="lg"
              radius={0}
              style={{
                border: "1px solid #E2E8F0",
                backgroundColor: "white",
                cursor: "pointer",
              }}
              component={Link}
              href="/teacher/syllabus"
              className="hover-card"
            >
              <ThemeIcon size={44} radius={0} style={{ backgroundColor: "#E8EFF7", color: "#1A3A5C", marginBottom: "16px" }}>
                <IconFileText size={24} />
              </ThemeIcon>
              <Title order={3} style={{ fontSize: "16px", fontWeight: 800, color: "#1A1A1A" }}>
                Quản lý Syllabus
              </Title>
              <Text size="xs" c="dimmed" mt="xs" style={{ lineHeight: 1.5 }}>
                Tạo mới, chỉnh sửa, cập nhật và phê duyệt các đề cương chi tiết môn học.
              </Text>
            </Card>

            <Card
              p="lg"
              radius={0}
              style={{
                border: "1px solid #E2E8F0",
                backgroundColor: "white",
                cursor: "pointer",
              }}
              component={Link}
              href="/teacher/documents"
              className="hover-card"
            >
              <ThemeIcon size={44} radius={0} style={{ backgroundColor: "#FFE8D6", color: "#F37021", marginBottom: "16px" }}>
                <IconUpload size={24} />
              </ThemeIcon>
              <Title order={3} style={{ fontSize: "16px", fontWeight: 800, color: "#1A1A1A" }}>
                Upload Tài Liệu
              </Title>
              <Text size="xs" c="dimmed" mt="xs" style={{ lineHeight: 1.5 }}>
                Tải lên slide bài giảng, file PDF bài đọc để huấn luyện / cập nhật cơ sở dữ liệu RAG.
              </Text>
            </Card>
          </Stack>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}

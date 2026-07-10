"use client";

import React, { useEffect, useState, useCallback } from "react";
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
  Loader,
  Center,
} from "@mantine/core";
import {
  IconFileText,
  IconUpload,
  IconCircleCheck,
  IconClock,
} from "@tabler/icons-react";
import * as api from "@/lib/api";

export default function TeacherDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [totalSyllabus, setTotalSyllabus] = useState(0);
  const [activeSyllabus, setActiveSyllabus] = useState(0);
  const [draftSyllabus, setDraftSyllabus] = useState(0);
  const [totalDocs, setTotalDocs] = useState(0);
  const [recentActivities, setRecentActivities] = useState<Array<{ type: string; action: string; time: string; user: string }>>([]);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const [syllabusesRes, coursesRes] = await Promise.all([
        api.searchSyllabus(),
        api.getCourses(),
      ]);

      const syllabuses = syllabusesRes.syllabuses || [];
      const courses = coursesRes.courses || [];

      setTotalSyllabus(syllabuses.length);
      setActiveSyllabus(syllabuses.filter((s) => s.isActive && s.isApproved).length);
      setDraftSyllabus(syllabuses.filter((s) => !s.isApproved).length);

      // Sum document counts
      const docCount = courses.reduce((sum, c) => sum + (c.documentCount || 0), 0);
      setTotalDocs(docCount);

      // Create recent activity lists based on newest syllabuses
      const sortedSyllabuses = [...syllabuses].slice(0, 5);
      const activities = sortedSyllabuses.map((s) => {
        const approvedText = s.isApproved ? "đã được duyệt & kích hoạt" : "đang ở trạng thái bản nháp";
        return {
          type: "syllabus",
          action: `Syllabus ${s.course?.code || s.courseId} (${s.syllabusName}) ${approvedText}`,
          time: s.decisionNo ? `Quyết định: ${s.decisionNo}` : "Mới cập nhật",
          user: "Hệ thống FLM",
        };
      });

      setRecentActivities(activities);
    } catch (error) {
      console.error("Failed to load dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const stats = [
    {
      name: "Tổng Syllabus",
      value: loading ? "—" : String(totalSyllabus),
      icon: IconFileText,
      color: "blue",
      description: "Đề cương trong hệ thống",
    },
    {
      name: "Đang Hoạt Động",
      value: loading ? "—" : String(activeSyllabus),
      icon: IconCircleCheck,
      color: "green",
      description: "Đã phê duyệt & sử dụng",
    },
    {
      name: "Bản Nháp / Chờ duyệt",
      value: loading ? "—" : String(draftSyllabus),
      icon: IconClock,
      color: "yellow",
      description: "Đề cương chưa phê duyệt",
    },
    {
      name: "Tài Liệu Môn Học",
      value: loading ? "—" : String(totalDocs),
      icon: IconUpload,
      color: "orange",
      description: "Slide bài giảng đã index RAG",
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

      {loading ? (
        <Center py="xl">
          <Loader color="#1A3A5C" type="bars" />
        </Center>
      ) : (
        <>
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
                    Hoạt Động Gần Đây (Syllabus mới cập nhật)
                  </Title>
                </Box>

                <Stack gap={0}>
                  {recentActivities.map((activity, index) => (
                    <Box
                      key={index}
                      p="md"
                      style={{
                        borderBottom: index === recentActivities.length - 1 ? "none" : "1px solid #F1F5F9",
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
                          backgroundColor: "#E8EFF7",
                          color: "#1A3A5C",
                        }}
                      >
                        <IconFileText size={20} />
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
                  {recentActivities.length === 0 && (
                    <Box p="xl" style={{ textAlign: "center", color: "#9CA3AF" }}>
                      <Text size="sm" fw={700}>Chưa có hoạt động nào được ghi nhận</Text>
                    </Box>
                  )}
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


        </>
      )}
    </Stack>
  );
}

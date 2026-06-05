"use client";

import React from "react";
import Link from "next/link";
import {
  Container,
  Group,
  Button,
  Text,
  Title,
  SimpleGrid,
  Card,
  ThemeIcon,
  Stack,
  Box,
  Badge,
} from "@mantine/core";
import {
  IconBook,
  IconSchool,
  IconUsers,
  IconCrown,
  IconArrowRight,
  IconDatabase,
  IconMessageChatbot,
} from "@tabler/icons-react";

export default function LandingPage() {
  return (
    <Box style={{ minHeight: "100vh", backgroundColor: "#F9FAFB" }}>
      {/* Header */}
      <Box
        component="header"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          backgroundColor: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid #E5E7EB",
        }}
      >
        <Container size="lg" style={{ height: "64px" }}>
          <Group justify="space-between" align="center" style={{ height: "100%" }}>
            <Group gap="md">
              <ThemeIcon size={40} color="#F26F21" radius="md">
                <IconBook size={24} color="white" />
              </ThemeIcon>
              <div>
                <Text fw={800} size="md" style={{ color: "#1A1A1A", lineHeight: 1.2 }}>
                  FPT University
                </Text>
                <Text fw={600} size="xs" style={{ color: "#1A3A5C", letterSpacing: "0.5px" }}>
                  RAG Chatbot & FLM System
                </Text>
              </div>
            </Group>
            <Button
              component={Link}
              href="/login"
              color="#F26F21"
              radius={0}
              fw={700}
              size="sm"
              style={{
                backgroundColor: "#F26F21",
                transition: "all 0.2s ease",
              }}
            >
              Đăng nhập
            </Button>
          </Group>
        </Container>
      </Box>

      {/* Hero Section */}
      <Container size="lg" style={{ paddingTop: "80px", paddingBottom: "80px" }}>
        <Stack align="center" gap="xl" style={{ textAlign: "center" }}>
          <Badge
            color="#1A3A5C"
            variant="light"
            size="lg"
            radius={0}
            style={{
              padding: "8px 16px",
              border: "1px solid #9DBAD9",
              fontSize: "12px",
              fontWeight: 700,
              height: "auto",
            }}
          >
            SDN302 - Final Project
          </Badge>

          <Title
            order={1}
            style={{
              fontSize: "52px",
              fontWeight: 900,
              color: "#1A1A1A",
              lineHeight: 1.1,
              letterSpacing: "-1px",
            }}
          >
            Hệ thống quản lý
            <br />
            <Text
              span
              inherit
              variant="gradient"
              gradient={{ from: "#F26F21", to: "#E65C00", deg: 90 }}
            >
              học liệu thông minh
            </Text>
          </Title>

          <Text size="xl" style={{ color: "#6B7280", maxWidth: "760px", lineHeight: 1.6 }}>
            Kết hợp RAG (Retrieval-Augmented Generation) và AI Chatbot để hỗ trợ sinh viên
            học tập hiệu quả với khả năng trả lời câu hỏi dựa trên tài liệu môn học thực tế.
          </Text>

          <Group gap="md" mt="md">
            <Button
              component={Link}
              href="/login"
              size="lg"
              radius={0}
              fw={700}
              style={{
                backgroundColor: "#FFC107",
                color: "#1A1A1A",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
            >
              Bắt đầu ngay
            </Button>
            <Button
              component="a"
              href="#features"
              size="lg"
              variant="outline"
              radius={0}
              fw={700}
              style={{
                borderColor: "#1A3A5C",
                color: "#1A3A5C",
                borderWidth: "2px",
              }}
            >
              Tìm hiểu thêm
            </Button>
          </Group>
        </Stack>
      </Container>

      {/* Features Section */}
      <Box id="features" style={{ backgroundColor: "white", padding: "100px 0" }}>
        <Container size="lg">
          <Stack align="center" gap="xs" style={{ textAlign: "center", marginBottom: "64px" }}>
            <Title order={2} style={{ fontSize: "32px", fontWeight: 800, color: "#1A1A1A" }}>
              Tính năng nổi bật
            </Title>
            <Text style={{ color: "#6B7280", maxWidth: "600px" }}>
              Hệ thống được thiết kế đặc biệt cho chương trình Software Engineering của FPT University
            </Text>
          </Stack>

          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl">
            <Card
              p="xl"
              radius={0}
              style={{
                border: "1px solid #E5E7EB",
                transition: "all 0.3s ease",
                cursor: "default",
              }}
              className="hover-card"
            >
              <ThemeIcon size={56} radius={0} color="#F3F4F6" style={{ border: "1px solid #D1D5DB", marginBottom: "24px" }}>
                <IconMessageChatbot size={28} color="#1A3A5C" />
              </ThemeIcon>
              <Text fw={800} size="lg" style={{ color: "#1A1A1A", marginBottom: "12px" }}>
                AI Chatbot thông minh
              </Text>
              <Text size="sm" style={{ color: "#6B7280", lineHeight: 1.6 }}>
                Hỏi đáp tự động về nội dung môn học với khả năng trích dẫn nguồn chính xác từ tài liệu.
                Hỗ trợ đa ngôn ngữ Việt-Anh.
              </Text>
            </Card>

            <Card
              p="xl"
              radius={0}
              style={{
                border: "1px solid #E5E7EB",
                transition: "all 0.3s ease",
                cursor: "default",
              }}
              className="hover-card"
            >
              <ThemeIcon size={56} radius={0} color="#F3F4F6" style={{ border: "1px solid #D1D5DB", marginBottom: "24px" }}>
                <IconSchool size={28} color="#1A3A5C" />
              </ThemeIcon>
              <Text fw={800} size="lg" style={{ color: "#1A1A1A", marginBottom: "12px" }}>
                Quản lý Syllabus
              </Text>
              <Text size="sm" style={{ color: "#6B7280", lineHeight: 1.6 }}>
                Giáo viên dễ dàng tạo, chỉnh sửa và phê duyệt syllabus với workflow rõ ràng.
                Sinh viên xem thông tin CLO, lịch học và đánh giá.
              </Text>
            </Card>

            <Card
              p="xl"
              radius={0}
              style={{
                border: "1px solid #E5E7EB",
                transition: "all 0.3s ease",
                cursor: "default",
              }}
              className="hover-card"
            >
              <ThemeIcon size={56} radius={0} color="#F3F4F6" style={{ border: "1px solid #D1D5DB", marginBottom: "24px" }}>
                <IconDatabase size={28} color="#1A3A5C" />
              </ThemeIcon>
              <Text fw={800} size="lg" style={{ color: "#1A1A1A", marginBottom: "12px" }}>
                Hybrid RAG System
              </Text>
              <Text size="sm" style={{ color: "#6B7280", lineHeight: 1.6 }}>
                Kết hợp dữ liệu có cấu trúc (PostgreSQL) và vector search (Qdrant)
                để trả lời chính xác cả câu hỏi về điểm số lẫn nội dung bài giảng.
              </Text>
            </Card>
          </SimpleGrid>
        </Container>
      </Box>

      {/* Portals Section */}
      <Container size="lg" style={{ paddingTop: "100px", paddingBottom: "100px" }}>
        <Stack align="center" gap="xs" style={{ textAlign: "center", marginBottom: "64px" }}>
          <Title order={2} style={{ fontSize: "32px", fontWeight: 800, color: "#1A1A1A" }}>
            Các cổng thông tin
          </Title>
          <Text style={{ color: "#6B7280", maxWidth: "600px" }}>
            Hệ thống hỗ trợ 3 vai trò với quyền hạn và chức năng khác nhau
          </Text>
        </Stack>

        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
          {/* Super Admin Portal */}
          <Card
            p="xl"
            radius={0}
            style={{
              backgroundColor: "#1A3A5C",
              color: "white",
              border: "1px solid #1A3A5C",
              transition: "all 0.3s ease",
              position: "relative",
              overflow: "hidden",
            }}
            component={Link}
            href="/login"
            className="portal-card"
          >
            <ThemeIcon size={48} radius={0} color="transparent" style={{ marginBottom: "24px" }}>
              <IconCrown size={48} color="#FFC107" />
            </ThemeIcon>
            <Text fw={800} size="xl" style={{ color: "white", marginBottom: "12px" }}>
              Super Admin
            </Text>
            <Text size="sm" style={{ color: "#D1D5DB", marginBottom: "32px", flexGrow: 1 }}>
              Quản lý tài khoản giáo viên, cấu hình whitelist sinh viên và xem báo cáo tổng thể.
            </Text>
            <Group gap="xs" style={{ color: "#FFC107" }} className="portal-link-text">
              <Text fw={700} size="sm">Truy cập</Text>
              <IconArrowRight size={18} />
            </Group>
          </Card>

          {/* Teacher Portal */}
          <Card
            p="xl"
            radius={0}
            style={{
              backgroundColor: "#FFC107",
              color: "#1A1A1A",
              border: "1px solid #FFC107",
              transition: "all 0.3s ease",
              position: "relative",
              overflow: "hidden",
            }}
            component={Link}
            href="/login"
            className="portal-card"
          >
            <ThemeIcon size={48} radius={0} color="transparent" style={{ marginBottom: "24px" }}>
              <IconSchool size={48} color="#1A3A5C" />
            </ThemeIcon>
            <Text fw={800} size="xl" style={{ color: "#1A1A1A", marginBottom: "12px" }}>
              Giáo viên
            </Text>
            <Text size="sm" style={{ color: "#2B2B2B", marginBottom: "32px", flexGrow: 1 }}>
              Quản lý syllabus, upload tài liệu bài giảng, theo dõi chương trình đào tạo sinh viên.
            </Text>
            <Group gap="xs" style={{ color: "#1A3A5C" }} className="portal-link-text">
              <Text fw={700} size="sm">Truy cập</Text>
              <IconArrowRight size={18} />
            </Group>
          </Card>

          {/* Student Portal */}
          <Card
            p="xl"
            radius={0}
            style={{
              backgroundColor: "#F26F21",
              color: "white",
              border: "1px solid #F26F21",
              transition: "all 0.3s ease",
              position: "relative",
              overflow: "hidden",
            }}
            component={Link}
            href="/login"
            className="portal-card"
          >
            <ThemeIcon size={48} radius={0} color="transparent" style={{ marginBottom: "24px" }}>
              <IconUsers size={48} color="white" />
            </ThemeIcon>
            <Text fw={800} size="xl" style={{ color: "white", marginBottom: "12px" }}>
              Sinh viên
            </Text>
            <Text size="sm" style={{ color: "#FFF", opacity: 0.9, marginBottom: "32px", flexGrow: 1 }}>
              Xem syllabus, chat với AI trợ lý ảo, tra cứu thông tin học liệu môn học chi tiết.
            </Text>
            <Group gap="xs" style={{ color: "white" }} className="portal-link-text">
              <Text fw={700} size="sm">Truy cập</Text>
              <IconArrowRight size={18} />
            </Group>
          </Card>
        </SimpleGrid>
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        style={{
          backgroundColor: "#0D2137",
          color: "white",
          borderTop: "4px solid #FFC107",
          padding: "64px 0 32px 0",
        }}
      >
        <Container size="lg">
          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl" style={{ marginBottom: "48px" }}>
            <Stack gap="md">
              <Text fw={800} size="lg" style={{ color: "#FFC107" }}>
                FPT RAG Chatbot
              </Text>
              <Text size="sm" style={{ color: "#D1D5DB", lineHeight: 1.6 }}>
                Hệ thống hỗ trợ học tập thông minh cho sinh viên Software Engineering,
                kết hợp công nghệ AI và quản lý học liệu hiện đại.
              </Text>
            </Stack>

            <Stack gap="md">
              <Text fw={800} size="lg">
                Dự án
              </Text>
              <Stack gap="xs">
                <Text size="sm" style={{ color: "#D1D5DB" }}>• Môn học: SDN302</Text>
                <Text size="sm" style={{ color: "#D1D5DB" }}>• Chuyên ngành: Software Engineering</Text>
                <Text size="sm" style={{ color: "#D1D5DB" }}>• Phạm vi: 44 môn chung + 4 môn đặc thù</Text>
              </Stack>
            </Stack>

            <Stack gap="md">
              <Text fw={800} size="lg">
                Công nghệ
              </Text>
              <Stack gap="xs">
                <Text size="sm" style={{ color: "#D1D5DB" }}>• React + Next.js 16 + Mantine v9</Text>
                <Text size="sm" style={{ color: "#D1D5DB" }}>• PostgreSQL + Qdrant Vector DB</Text>
                <Text size="sm" style={{ color: "#D1D5DB" }}>• Gemini API & Embedding</Text>
                <Text size="sm" style={{ color: "#D1D5DB" }}>• Better Auth (OAuth)</Text>
              </Stack>
            </Stack>
          </SimpleGrid>

          <Box style={{ borderTop: "1px solid #1A3A5C", paddingTop: "32px", textAlign: "center" }}>
            <Text size="xs" style={{ color: "#9CA3AF" }}>
              © 2026 FPT University. Demo Project - Not for production use.
            </Text>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}

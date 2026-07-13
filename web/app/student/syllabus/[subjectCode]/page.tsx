"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Box,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Skeleton,
  Stack,
  Tabs,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconBook2,
  IconCalendar,
  IconChartBar,
  IconDownload,
  IconX,
  IconBulb,
  IconInfoCircle,
  IconSchool,
  IconClock,
  IconCertificate,
  IconAlertCircle,
} from "@tabler/icons-react";
import { ChatbotWidget } from "@/components/chatbot/ChatbotWidget";
import * as api from "@/lib/api";
import type { ApiSyllabusDetail } from "@/lib/api";

// Import layout tabs components
import { SyllabusOverviewTab } from "@/components/student/syllabus/SyllabusOverviewTab";
import { SyllabusMaterialsTab } from "@/components/student/syllabus/SyllabusMaterialsTab";
import { SyllabusCLOsTab } from "@/components/student/syllabus/SyllabusCLOsTab";
import { SyllabusScheduleTab } from "@/components/student/syllabus/SyllabusScheduleTab";
import { SyllabusAssessmentTab } from "@/components/student/syllabus/SyllabusAssessmentTab";

/**
 * Adapter: Convert API camelCase syllabus detail → snake_case shape
 * that the existing tab components expect (metadata, materials, clos, schedule, assessment_scheme).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adaptApiToLegacyShape(s: ApiSyllabusDetail): any {
  return {
    metadata: {
      syllabus_id: String(s.id),
      syllabus_name: s.syllabusName,
      syllabus_name_english: s.syllabusNameEnglish || "",
      subject_code: s.course.code,
      credits: String(s.credits),
      degree_level: s.degreeLevel,
      time_allocation: s.timeAllocation || "",
      prerequisites: s.prerequisites || "",
      description: s.description || "",
      student_tasks: s.studentTasks || "",
      tools: s.tools || "",
      scoring_scale: s.scoringScale,
      decision_no: s.decisionNo || "",
      is_approved: s.isApproved,
      is_active: s.isActive,
      note: s.note || "",
      min_avg_mark_to_pass: s.minAvgMarkToPass,
      approved_date: s.approvedDate || "",
    },
    materials: s.materials.map((m) => ({
      description: m.description,
      author: m.author || "",
      publisher: m.publisher || "",
      published_date: m.publishedDate || "",
      edition: m.edition || "",
      isbn: m.isbn || "",
      is_main_material: m.isMainMaterial || "",
      is_hard_copy: m.isHardCopy || "",
      is_online: m.isOnline || "",
      note: m.note || "",
    })),
    clos: s.clos.map((c) => ({
      clo_name: c.cloName,
      clo_details: c.cloDetails,
      lo_details: c.loDetails || "",
    })),
    schedule: s.schedules.map((sc) => ({
      session: sc.session,
      topic: sc.topic,
      learning_method: sc.learningMethod || "",
      lo: sc.lo || "",
      itu: sc.itu || "",
      student_materials: sc.studentMaterials || "",
      s_download: sc.sDownload || "",
      student_tasks: sc.studentTasks || "",
      urls: sc.urls || "",
    })),
    assessment_scheme: s.assessments.map((a) => ({
      category: a.category,
      type: a.type || "",
      part: a.part || "",
      weight: a.weight,
      completion_criteria: a.completionCriteria || "",
      duration: a.duration || "",
      clo: a.clo || "",
      question_type: a.questionType || "",
      no_question: a.noQuestion || "",
      knowledge_and_skill: a.knowledgeAndSkill || "",
      grading_guide: a.gradingGuide || "",
      note: a.note || "",
    })),
  };
}

export default function SyllabusViewerPage() {
  const params = useParams();
  const subjectCode = (params.subjectCode as string)?.toUpperCase() || "FER202";

  const [activeTab, setActiveTab] = useState<string | null>("overview");

  const { data: queryResult, isLoading, error: queryError } = useQuery({
    queryKey: ["syllabus-detail", subjectCode],
    queryFn: async () => {
      const { syllabuses } = await api.searchSyllabus(subjectCode);
      if (!syllabuses || syllabuses.length === 0) {
        throw new Error("NOT_FOUND");
      }
      const target =
        syllabuses.find((s) => s.isActive && s.isApproved) || syllabuses[0];
      const { syllabus } = await api.getSyllabusDetail(target.id);
      const adapted = adaptApiToLegacyShape(syllabus);
      return { adapted, courseId: syllabus.courseId ?? null };
    },
  });

  const syllabusData = queryResult?.adapted ?? null;
  const courseId = queryResult?.courseId ?? null;
  const error = queryError
    ? queryError.message === "NOT_FOUND"
      ? "NOT_FOUND"
      : "API_ERROR"
    : null;

  // Loading state
  if (isLoading) {
    return (
      <Box style={{ backgroundColor: "#F0F4F8", minHeight: "100vh", paddingBottom: "120px" }}>
        <Box
          style={{
            background: "linear-gradient(135deg, #1A3A5C 0%, #0f2848 100%)",
            padding: "28px 0",
          }}
        >
          <Container fluid>
            <Skeleton height={32} width={150} mb="lg" style={{ opacity: 0.3 }} />
            <Skeleton height={24} width={100} mb="sm" style={{ opacity: 0.3 }} />
            <Skeleton height={36} width={400} mb="sm" style={{ opacity: 0.3 }} />
            <Skeleton height={16} width={300} style={{ opacity: 0.3 }} />
          </Container>
        </Box>
        <Container fluid py="xl">
          <Skeleton height={48} mb="lg" />
          <Stack gap="md">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height={80} radius="lg" />
            ))}
          </Stack>
        </Container>
      </Box>
    );
  }

  // Not found
  if (error === "NOT_FOUND" || !syllabusData) {
    return (
      <Container size="sm" py="xl" style={{ textAlign: "center" }}>
        <Card p="xl" radius="lg" style={{ border: "1px dashed #fca5a5", background: "#fff5f5" }}>
          <Stack align="center" gap="md">
            <ThemeIcon size={64} radius="xl" style={{ background: "#fee2e2", color: "#dc2626" }}>
              <IconX size={32} />
            </ThemeIcon>
            <Text fw={800} style={{ color: "#dc2626", fontSize: "18px" }}>
              Không tìm thấy Syllabus
            </Text>
            <Text c="dimmed" size="sm">
              Môn học <strong>{subjectCode}</strong> chưa có trong hệ thống hoặc chưa được duyệt.
            </Text>
            {error === "API_ERROR" && (
              <Text c="dimmed" size="xs">
                <IconAlertCircle size={12} style={{ verticalAlign: "middle" }} /> Không thể kết nối đến server backend.
              </Text>
            )}
            <Button
              component={Link}
              href="/student"
              radius="md"
              style={{ background: "linear-gradient(135deg, #1A3A5C, #0f2848)" }}
              leftSection={<IconArrowLeft size={14} />}
            >
              Quay lại tìm kiếm
            </Button>
          </Stack>
        </Card>
      </Container>
    );
  }

  const { metadata, materials, clos, schedule, assessment_scheme } = syllabusData;

  return (
    <Box style={{ backgroundColor: "#F0F4F8", minHeight: "100vh", paddingBottom: "120px" }}>

      {/* ─── Page Header Banner ─── */}
      <Box
        style={{
          background: "linear-gradient(135deg, #1A3A5C 0%, #0f2848 100%)",
          padding: "28px 0",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circle */}
        <Box
          style={{
            position: "absolute",
            top: "-40px",
            right: "5%",
            width: "180px",
            height: "180px",
            borderRadius: "50%",
            background: "rgba(243, 112, 33, 0.07)",
            pointerEvents: "none",
          }}
        />

        <Container fluid>
          {/* Back button */}
          <Button
            component={Link}
            href="/student"
            size="sm"
            mb="lg"
            leftSection={<IconArrowLeft size={16} />}
            className="back-btn-hover"
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#ffffff",
              fontWeight: 600,
              fontSize: "13px",
              backdropFilter: "blur(8px)",
              transition: "all 0.2s ease",
              cursor: "pointer",
            }}
          >
            Quay lại trang chủ
          </Button>

          <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">
            <Stack gap="xs">
              {/* Code + Status badges */}
              <Group gap="xs">
                <Badge
                  size="lg"
                  radius="md"
                  style={{
                    background: "rgba(243, 112, 33, 0.2)",
                    color: "#F37021",
                    border: "1px solid rgba(243, 112, 33, 0.4)",
                    fontWeight: 900,
                    fontFamily: "monospace",
                    letterSpacing: "1px",
                    fontSize: "14px",
                  }}
                >
                  {metadata.subject_code}
                </Badge>
                <Badge
                  size="sm"
                  radius="xl"
                  style={{
                    background: metadata.is_active === "true" || metadata.is_active === true
                      ? "rgba(35, 172, 104, 0.2)"
                      : "rgba(239, 68, 68, 0.2)",
                    color: metadata.is_active === "true" || metadata.is_active === true ? "#4ade80" : "#f87171",
                    border: metadata.is_active === "true" || metadata.is_active === true
                      ? "1px solid rgba(35, 172, 104, 0.4)"
                      : "1px solid rgba(239, 68, 68, 0.4)",
                  }}
                >
                  {metadata.is_active === "true" || metadata.is_active === true ? "Active" : "Inactive"}
                </Badge>
                {(metadata.is_approved === "true" || metadata.is_approved === true) && (
                  <Badge
                    size="sm"
                    radius="xl"
                    style={{
                      background: "rgba(59, 130, 246, 0.2)",
                      color: "#93c5fd",
                      border: "1px solid rgba(59, 130, 246, 0.4)",
                    }}
                    leftSection={<IconCertificate size={10} />}
                  >
                    Approved
                  </Badge>
                )}
              </Group>

              {/* Syllabus name */}
              <Title
                order={1}
                style={{
                  color: "white",
                  fontSize: "clamp(18px, 3vw, 26px)",
                  fontWeight: 900,
                  lineHeight: 1.2,
                  maxWidth: "640px",
                }}
              >
                {metadata.syllabus_name_english || metadata.syllabus_name}
              </Title>

              {/* Meta info row */}
              <Group gap="lg" mt="xs">
                <Group gap={6}>
                  <IconSchool size={14} color="rgba(255,255,255,0.5)" />
                  <Text size="xs" style={{ color: "rgba(255,255,255,0.55)" }}>
                    {metadata.degree_level || "Undergraduate"}
                  </Text>
                </Group>
                <Group gap={6}>
                  <IconBook2 size={14} color="rgba(255,255,255,0.5)" />
                  <Text size="xs" style={{ color: "rgba(255,255,255,0.55)" }}>
                    {metadata.credits} tín chỉ
                  </Text>
                </Group>
                <Group gap={6}>
                  <IconClock size={14} color="rgba(255,255,255,0.5)" />
                  <Text size="xs" style={{ color: "rgba(255,255,255,0.55)" }}>
                    {schedule?.length || 0} sessions
                  </Text>
                </Group>
                <Group gap={6}>
                  <IconCertificate size={14} color="rgba(255,255,255,0.5)" />
                  <Text size="xs" style={{ color: "rgba(255,255,255,0.55)" }}>
                    ID: {metadata.syllabus_id}
                  </Text>
                </Group>
              </Group>
            </Stack>

            {/* Download button */}
            <Button
              size="sm"
              radius="md"
              style={{
                background: "linear-gradient(135deg, #F37021, #e05e10)",
                fontWeight: 700,
                border: "none",
              }}
              leftSection={<IconDownload size={14} />}
            >
              Download Student Material
            </Button>
          </Group>
        </Container>
      </Box>

      {/* ─── Sticky Tabs ─── */}
      <Box
        style={{
          position: "sticky",
          top: "66px",
          zIndex: 100,
          background: "white",
          borderBottom: "1px solid #E2E8F0",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        <Container fluid>
          <Tabs
            value={activeTab}
            onChange={setActiveTab}
            classNames={{
              tab: "custom-tabs-tab"
            }}
            styles={{
              list: {
                border: "none",
                gap: 0,
              }
            }}
          >
            <Tabs.List>
              <Tabs.Tab value="overview" leftSection={<IconInfoCircle size={14} />}>
                Tổng quan
              </Tabs.Tab>
              <Tabs.Tab value="materials" leftSection={<IconBook2 size={14} />}>
                Tài liệu
                <Badge size="xs" ml={6} style={{ background: "#F37021", color: "white" }}>
                  {materials?.length || 0}
                </Badge>
              </Tabs.Tab>
              <Tabs.Tab value="clos" leftSection={<IconBulb size={14} />}>
                CLOs / LOs
                <Badge size="xs" ml={6} style={{ background: "#23AC68", color: "white" }}>
                  {clos?.length || 0}
                </Badge>
              </Tabs.Tab>
              <Tabs.Tab value="schedule" leftSection={<IconCalendar size={14} />}>
                Lịch học
                <Badge size="xs" ml={6} style={{ background: "#3b82f6", color: "white" }}>
                  {schedule?.length || 0}
                </Badge>
              </Tabs.Tab>
              <Tabs.Tab value="assessment" leftSection={<IconChartBar size={14} />}>
                Đánh giá
                <Badge size="xs" ml={6} style={{ background: "#8b5cf6", color: "white" }}>
                  {assessment_scheme?.length || 0}
                </Badge>
              </Tabs.Tab>
            </Tabs.List>
          </Tabs>
        </Container>
      </Box>

      {/* ─── Tab Content ─── */}
      <Container fluid py="xl">
        {activeTab === "overview" && <SyllabusOverviewTab metadata={metadata} />}
        {activeTab === "materials" && <SyllabusMaterialsTab materials={materials} />}
        {activeTab === "clos" && <SyllabusCLOsTab clos={clos} metadata={metadata} />}
        {activeTab === "schedule" && <SyllabusScheduleTab schedule={schedule} metadata={metadata} />}
        {activeTab === "assessment" && <SyllabusAssessmentTab assessment_scheme={assessment_scheme} />}
      </Container>

      <style>{`
        .back-btn-hover:hover {
          background: rgba(255, 255, 255, 0.18) !important;
          border-color: rgba(255, 255, 255, 0.3) !important;
          transform: translateX(-3px);
        }
      `}</style>

      {/* ─── Floating RAG Chatbot ─── */}
      <ChatbotWidget subjectCode={subjectCode} courseId={courseId} />
    </Box>
  );
}
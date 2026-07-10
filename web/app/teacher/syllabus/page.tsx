"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Title,
  Text,
  Button,
  Card,
  TextInput,
  Table,
  Group,
  Stack,
  Badge,
  ActionIcon,
  Box,
  Alert,
  Skeleton,
} from "@mantine/core";
import {
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconCircleCheck,
  IconClock,
  IconCircleX,
  IconLink,
  IconBan,
  IconCircleDot,
} from "@tabler/icons-react";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import * as api from "@/lib/api";
import type { ApiSyllabusSummary } from "@/lib/api";

export default function SyllabusManagementPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [syllabi, setSyllabi] = useState<ApiSyllabusSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const loadSyllabi = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const { syllabuses } = await api.searchSyllabus();
      setSyllabi(syllabuses);
    } catch (err) {
      console.error("Failed to load syllabi:", err);
      setApiError("Không thể tải dữ liệu syllabus từ server.");
      setSyllabi([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSyllabi();
  }, [loadSyllabi]);

  const handleDeleteSyllabus = (syllabus: ApiSyllabusSummary) => {
    modals.openConfirmModal({
      title: "Xóa Syllabus",
      children: (
        <Text size="sm">
          Bạn có chắc chắn muốn xóa syllabus <b>#{syllabus.id} - {syllabus.syllabusName}</b>? Hành động này sẽ gỡ bỏ tất cả tài liệu môn học liên kết và không thể hoàn tác.
        </Text>
      ),
      labels: { confirm: "Xóa", cancel: "Hủy" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await api.deleteSyllabus(syllabus.id);
          notifications.show({
            title: "Thành công",
            message: `Đã xóa syllabus #${syllabus.id}`,
            color: "green",
          });
          void loadSyllabi();
        } catch (err: any) {
          notifications.show({
            title: "Lỗi",
            message: err.message || "Không thể xóa syllabus.",
            color: "red",
          });
        }
      },
    });
  };

  const handleActivate = async (syllabus: ApiSyllabusSummary) => {
    try {
      await api.activateSyllabus(syllabus.id);
      notifications.show({
        title: "Thành công",
        message: `Đã kích hoạt syllabus #${syllabus.id}`,
        color: "green",
      });
      void loadSyllabi();
    } catch (err: any) {
      notifications.show({
        title: "Lỗi",
        message: err.message || "Không thể kích hoạt syllabus.",
        color: "red",
      });
    }
  };

  const handleDeactivate = (syllabus: ApiSyllabusSummary) => {
    modals.openConfirmModal({
      title: "Huỷ kích hoạt Syllabus",
      children: (
        <Text size="sm">
          Bạn có chắc chắn muốn huỷ kích hoạt syllabus <b>#{syllabus.id} - {syllabus.syllabusName}</b>?
          Sinh viên sẽ không còn thấy syllabus này trên trang tìm kiếm nữa.
        </Text>
      ),
      labels: { confirm: "Huỷ kích hoạt", cancel: "Hủy" },
      confirmProps: { color: "orange" },
      onConfirm: async () => {
        try {
          await api.deactivateSyllabus(syllabus.id);
          notifications.show({
            title: "Thành công",
            message: `Đã huỷ kích hoạt syllabus #${syllabus.id}`,
            color: "green",
          });
          void loadSyllabi();
        } catch (err: any) {
          notifications.show({
            title: "Lỗi",
            message: err.message || "Không thể huỷ kích hoạt syllabus.",
            color: "red",
          });
        }
      },
    });
  };

  const filteredSyllabi = useMemo(() => {
    const searchLower = searchTerm.trim().toLowerCase();

    return syllabi.filter((syllabus) => {
      const matchesSearch =
        searchLower === "" ||
        syllabus.course.code.toLowerCase().includes(searchLower) ||
        syllabus.course.name.toLowerCase().includes(searchLower) ||
        syllabus.syllabusName.toLowerCase().includes(searchLower);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && syllabus.isActive && syllabus.isApproved) ||
        (statusFilter === "draft" && !syllabus.isApproved) ||
        (statusFilter === "inactive" && !syllabus.isActive && syllabus.isApproved);

      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter, syllabi]);

  const getStatusBadge = (isActive: boolean, isApproved: boolean) => {
    if (isActive && isApproved) {
      return (
        <Badge
          color="green"
          radius={0}
          fw={700}
          leftSection={<IconCircleCheck size={12} />}
        >
          Đang sử dụng
        </Badge>
      );
    }

    if (!isApproved) {
      return (
        <Badge
          color="yellow"
          radius={0}
          fw={700}
          leftSection={<IconClock size={12} />}
        >
          Bản nháp
        </Badge>
      );
    }

    return (
      <Badge
        color="gray"
        radius={0}
        fw={700}
        leftSection={<IconCircleX size={12} />}
      >
        Đã ẩn
      </Badge>
    );
  };

  return (
    <Stack gap="xl">
      {/* Header */}
      <Group justify="space-between" align="center">
        <div>
          <Title order={1} style={{ fontSize: "24px", fontWeight: 900, color: "#1A3A5C" }}>
            Quản lý Syllabus
          </Title>
          <Text size="sm" c="dimmed">
            Tìm kiếm, phê duyệt và kích hoạt đề cương môn học
          </Text>
        </div>
        <Button
          component={Link}
          href="/teacher/syllabus/create"
          leftSection={<IconPlus size={16} />}
          style={{ backgroundColor: "#F26F21" }}
          radius={0}
          fw={700}
        >
          Tạo Syllabus
        </Button>
      </Group>

      {apiError && (
        <Alert title="Lỗi API" color="red" radius={0}>
          {apiError}
        </Alert>
      )}

      {/* Filters Card */}
      <Card p="md" radius={0} style={{ border: "1px solid #E2E8F0", backgroundColor: "white" }}>
        <Group grow gap="md" align="center" style={{ width: "100%" }}>
          <TextInput
            placeholder="Tìm theo Subject Code hoặc tên môn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftSection={<IconSearch size={16} color="#9CA3AF" />}
            radius={0}
            style={{ flexGrow: 1 }}
          />

          <Group gap="xs" justify="flex-end">
            {[
              { id: "all", label: "Tất cả" },
              { id: "active", label: "Đang sử dụng" },
              { id: "draft", label: "Bản nháp" },
              { id: "inactive", label: "Đã ẩn" },
            ].map((tab) => (
              <Button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                variant={statusFilter === tab.id ? "filled" : "outline"}
                color={statusFilter === tab.id ? "#1A3A5C" : "gray"}
                radius={0}
                size="sm"
                fw={700}
                style={{
                  backgroundColor: statusFilter === tab.id ? "#1A3A5C" : "transparent",
                  color: statusFilter === tab.id ? "white" : "#4B5563",
                  borderColor: statusFilter === tab.id ? "#1A3A5C" : "#D1D5DB",
                }}
              >
                {tab.label}
              </Button>
            ))}
          </Group>
        </Group>
      </Card>

      {/* Table Card */}
      <Card p={0} radius={0} style={{ border: "1px solid #E2E8F0", backgroundColor: "white" }}>
        {isLoading ? (
          <Box p="xl">
            <Skeleton height={28} width={180} mb="md" />
            <Skeleton height={20} width="100%" mb="sm" />
            <Skeleton height={20} width="100%" mb="sm" />
            <Skeleton height={20} width="100%" />
          </Box>
        ) : (
          <>
            <Table layout="fixed" highlightOnHover striped>
              <Table.Thead style={{ backgroundColor: "#F8FAFC" }}>
                <Table.Tr>
                  <Table.Th style={{ width: "90px", fontWeight: 700, fontSize: "12px", color: "#475569" }}>ID</Table.Th>
                  <Table.Th style={{ width: "120px", fontWeight: 700, fontSize: "12px", color: "#475569" }}>Subject Code</Table.Th>
                  <Table.Th style={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>Tên môn học</Table.Th>
                  <Table.Th style={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>Syllabus Name</Table.Th>
                  <Table.Th style={{ width: "150px", fontWeight: 700, fontSize: "12px", color: "#475569" }}>Trạng thái</Table.Th>
                  <Table.Th style={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>Decision No</Table.Th>
                  <Table.Th style={{ width: "100px", fontWeight: 700, fontSize: "12px", color: "#475569", textAlign: "right" }}>Thao tác</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredSyllabi.map((syllabus) => (
                  <Table.Tr key={syllabus.id}>
                    <Table.Td style={{ fontSize: "13px", color: "#64748B" }}>#{syllabus.id}</Table.Td>
                    <Table.Td style={{ fontSize: "13px", fontWeight: 700, color: "#1A1A1A" }}>{syllabus.course.code}</Table.Td>
                    <Table.Td style={{ fontSize: "13px", fontWeight: 600 }}>{syllabus.course.name}</Table.Td>
                    <Table.Td style={{ fontSize: "13px" }}>
                      <Text
                        component={Link}
                        href={`/student/syllabus/${syllabus.course.code.toLowerCase()}`}
                        style={{
                          color: "#1A3A5C",
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          textDecoration: "underline",
                        }}
                      >
                        <IconLink size={14} />
                        {syllabus.syllabusName}
                      </Text>
                    </Table.Td>
                    <Table.Td>{getStatusBadge(syllabus.isActive, syllabus.isApproved)}</Table.Td>
                    <Table.Td style={{ fontSize: "13px", color: "#475569" }}>{syllabus.decisionNo ?? "-"}</Table.Td>
                    <Table.Td style={{ textAlign: "right" }}>
                      <Group gap="xs" justify="flex-end">
                        {syllabus.isActive && syllabus.isApproved && (
                          <ActionIcon variant="subtle" color="orange" size="sm" title="Huỷ kích hoạt" onClick={() => handleDeactivate(syllabus)}>
                            <IconBan size={16} />
                          </ActionIcon>
                        )}
                        {!syllabus.isActive && syllabus.isApproved && (
                          <ActionIcon variant="subtle" color="green" size="sm" title="Kích hoạt" onClick={() => handleActivate(syllabus)}>
                            <IconCircleDot size={16} />
                          </ActionIcon>
                        )}
                        <ActionIcon variant="subtle" color="gray" size="sm" title="Chỉnh sửa">
                          <IconEdit size={16} />
                        </ActionIcon>
                        <ActionIcon variant="subtle" color="red" size="sm" title="Xóa" onClick={() => handleDeleteSyllabus(syllabus)}>
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>

            {filteredSyllabi.length === 0 && (
              <Box p="xl" style={{ textAlign: "center", color: "#9CA3AF" }}>
                <Text size="sm" fw={700}>Không tìm thấy kết quả phù hợp</Text>
              </Box>
            )}
          </>
        )}
      </Card>
    </Stack>
  );
}

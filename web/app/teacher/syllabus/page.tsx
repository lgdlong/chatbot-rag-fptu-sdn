"use client";

import React, { useState, useMemo } from "react";
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
  Menu,
  Pagination,
} from "@mantine/core";
import {
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconCircleCheck,
  IconClock,
  IconCircleX,
  IconAlertCircle,
  IconCloudOff,
  IconBan,
  IconCircleDot,
  IconCloudUpload,
  IconDotsVertical,
} from "@tabler/icons-react";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";
import type { ApiSyllabusSummary } from "@/lib/api";

export default function SyllabusManagementPage() {
  const PAGE_SIZE = 15;
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const syllabiQuery = useQuery({
    queryKey: ["syllabuses", page],
    queryFn: () => api.searchSyllabus(undefined, page),
    placeholderData: (prev) => prev,
  });

  const syllabi = syllabiQuery.data?.syllabuses ?? [];
  const total = syllabiQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["syllabuses"] });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteSyllabus(id),
    onSuccess: (_data, id) => {
      notifications.show({ title: "Thành công", message: `Đã xóa syllabus #${id}`, color: "green" });
      invalidate();
    },
    onError: (err: any) => {
      notifications.show({ title: "Lỗi", message: err.message || "Không thể xóa syllabus.", color: "red" });
    },
  });

  const syncMutation = useMutation({
    mutationFn: (id: number) => api.syncSyllabus(id),
    onSuccess: (_data, id) => {
      notifications.show({ title: "Đồng bộ thành công", message: `Đã gửi yêu cầu đồng bộ syllabus #${id} lên hệ thống RAG`, color: "green" });
      invalidate();
    },
    onError: (err: any) => {
      notifications.show({ title: "Lỗi đồng bộ", message: err.message || "Không thể đồng bộ syllabus.", color: "red" });
    },
  });

  const activateMutation = useMutation({
    mutationFn: (id: number) => api.activateSyllabus(id),
    onSuccess: (_data, id) => {
      notifications.show({ title: "Thành công", message: `Đã kích hoạt syllabus #${id}`, color: "green" });
      invalidate();
    },
    onError: (err: any) => {
      notifications.show({ title: "Lỗi", message: err.message || "Không thể kích hoạt syllabus.", color: "red" });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: number) => api.deactivateSyllabus(id),
    onSuccess: (_data, id) => {
      notifications.show({ title: "Thành công", message: `Đã huỷ kích hoạt syllabus #${id}`, color: "green" });
      invalidate();
    },
    onError: (err: any) => {
      notifications.show({ title: "Lỗi", message: err.message || "Không thể huỷ kích hoạt syllabus.", color: "red" });
    },
  });

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
      onConfirm: () => deleteMutation.mutate(syllabus.id),
    });
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
      onConfirm: () => deactivateMutation.mutate(syllabus.id),
    });
  };

  const handleActivate = (syllabus: ApiSyllabusSummary) => {
    modals.openConfirmModal({
      title: "Kích hoạt Syllabus",
      children: (
        <Text size="sm">
          Bạn có chắc chắn muốn kích hoạt syllabus <b>#{syllabus.id} - {syllabus.syllabusName}</b>?
          Syllabus sẽ hiển thị cho sinh viên trên trang tìm kiếm.
        </Text>
      ),
      labels: { confirm: "Kích hoạt", cancel: "Hủy" },
      confirmProps: { color: "green" },
      onConfirm: () => activateMutation.mutate(syllabus.id),
    });
  };

  const displaySyllabi = useMemo(() => {
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

  const getSyncBadge = (ragWorkspace: ApiSyllabusSummary["ragWorkspace"]) => {
    const status = ragWorkspace?.syncStatus ?? null;
    switch (status) {
      case "SYNCED":
        return (
          <Badge color="green" radius={0} fw={700} variant="light" leftSection={<IconCircleCheck size={12} />}>
            Đã đồng bộ
          </Badge>
        );
      case "SYNCING":
        return (
          <Badge color="blue" radius={0} fw={700} variant="light" leftSection={<IconClock size={12} />}>
            Đang đồng bộ...
          </Badge>
        );
      case "FAILED":
        return (
          <Badge color="red" radius={0} fw={700} variant="light" leftSection={<IconAlertCircle size={12} />}>
            Lỗi đồng bộ
          </Badge>
        );
      default:
        return (
          <Badge color="gray" radius={0} fw={700} variant="light" leftSection={<IconCloudOff size={12} />}>
            Chưa đồng bộ
          </Badge>
        );
    }
  };

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

      {syllabiQuery.isError && (
        <Alert title="Lỗi API" color="red" radius={0}>
          {syllabiQuery.error?.message || "Không thể tải dữ liệu syllabus từ server."}
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
        {syllabiQuery.isLoading ? (
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
                  <Table.Th style={{ width: "150px", fontWeight: 700, fontSize: "12px", color: "#475569" }}>Đồng bộ hệ thống RAG</Table.Th>
                  <Table.Th style={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>Decision No</Table.Th>
                  <Table.Th style={{ width: "100px", fontWeight: 700, fontSize: "12px", color: "#475569", textAlign: "right" }}>Thao tác</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {displaySyllabi.map((syllabus) => (
                  <Table.Tr key={syllabus.id}>
                    <Table.Td style={{ fontSize: "13px", color: "#64748B" }}>#{syllabus.id}</Table.Td>
                    <Table.Td style={{ fontSize: "13px", fontWeight: 700, color: "#1A1A1A" }}>{syllabus.course.code}</Table.Td>
                    <Table.Td style={{ fontSize: "13px", fontWeight: 600 }}>{syllabus.course.name}</Table.Td>
                    <Table.Td style={{ fontSize: "13px", fontWeight: 600 }}>
                      {syllabus.syllabusName}
                    </Table.Td>
                    <Table.Td>{getStatusBadge(syllabus.isActive, syllabus.isApproved)}</Table.Td>
                    <Table.Td>{getSyncBadge(syllabus.ragWorkspace)}</Table.Td>
                    <Table.Td style={{ fontSize: "13px", color: "#475569" }}>{syllabus.decisionNo ?? "-"}</Table.Td>
                    <Table.Td style={{ textAlign: "right" }}>
                      <Menu shadow="md" width={200} radius={0} withinPortal>
                        <Menu.Target>
                          <ActionIcon variant="subtle" color="gray" size="sm">
                            <IconDotsVertical size={16} />
                          </ActionIcon>
                        </Menu.Target>

                        <Menu.Dropdown>
                          <Menu.Label style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase" }}>
                            #{syllabus.id} · {syllabus.course.code}
                          </Menu.Label>

                          {syllabus.isActive && syllabus.isApproved && (
                            <Menu.Item
                              color="orange"
                              leftSection={<IconBan size={16} />}
                              onClick={() => handleDeactivate(syllabus)}
                            >
                              Huỷ kích hoạt
                            </Menu.Item>
                          )}
                          {!syllabus.isActive && syllabus.isApproved && (
                            <Menu.Item
                              color="green"
                              leftSection={<IconCircleDot size={16} />}
                              onClick={() => handleActivate(syllabus)}
                            >
                              Kích hoạt
                            </Menu.Item>
                          )}

                          <Menu.Item
                            component={Link}
                            href={`/teacher/syllabus/${syllabus.id}/edit`}
                            leftSection={<IconEdit size={16} />}
                          >
                            Chỉnh sửa
                          </Menu.Item>

                          <Menu.Item
                            leftSection={<IconCloudUpload size={16} />}
                            onClick={() => syncMutation.mutate(syllabus.id)}
                            disabled={syncMutation.isPending}
                          >
                            {syncMutation.isPending ? "Đang đồng bộ..." : "Đồng bộ RAG"}
                          </Menu.Item>

                          <Menu.Divider />

                          <Menu.Item
                            color="red"
                            leftSection={<IconTrash size={16} />}
                            onClick={() => handleDeleteSyllabus(syllabus)}
                          >
                            Xoá
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>

            {displaySyllabi.length === 0 && (
              <Box p="xl" style={{ textAlign: "center", color: "#9CA3AF" }}>
                <Text size="sm" fw={700}>Không tìm thấy kết quả phù hợp</Text>
              </Box>
            )}

            {totalPages > 1 && (
              <Group justify="space-between" px="md" py="sm" style={{ borderTop: "1px solid #E2E8F0", backgroundColor: "#F8FAFC" }}>
                <Text size="xs" c="dimmed" fw={600}>
                  {total} syllabus · Trang {page}/{totalPages}
                </Text>
                <Pagination
                  total={totalPages}
                  value={page}
                  onChange={(p) => setPage(p)}
                  radius={0}
                  size="sm"
                  color="#1A3A5C"
                />
              </Group>
            )}
          </>
        )}
      </Card>
    </Stack>
  );
}

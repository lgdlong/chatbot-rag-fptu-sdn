"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Title,
  Text,
  Button,
  Card,
  Table,
  Group,
  Stack,
  Badge,
  Alert,
  Box,
  Loader,
  Center,
  Modal,
  CopyButton,
  ActionIcon,
  Tooltip,
  Tabs,
  ThemeIcon,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import {
  IconAlertCircle,
  IconCheck,
  IconX,
  IconCopy,
  IconUserCog,
} from "@tabler/icons-react";
import {
  getLecturerRequests,
  approveLecturerRequest,
  rejectLecturerRequest,
  ApiLecturerRequest,
  ApproveLecturerRequestResult,
  ApiError,
} from "@/lib/api";

type StatusFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusBadge(status: ApiLecturerRequest["status"]) {
  switch (status) {
    case "PENDING":
      return { color: "yellow", label: "Chờ duyệt" };
    case "APPROVED":
      return { color: "green", label: "Đã duyệt" };
    case "REJECTED":
      return { color: "red", label: "Đã từ chối" };
    default:
      return { color: "gray", label: "Không xác định" };
  }
}

export default function LecturerRequestsPage() {
  const [requests, setRequests] = useState<ApiLecturerRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [credentialsModal, setCredentialsModal] = useState<ApproveLecturerRequestResult | null>(null);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setFetchError("");
    try {
      const result = await getLecturerRequests();
      setRequests(result.requests);
    } catch (err) {
      setRequests([]);
      if (err instanceof ApiError) {
        setFetchError(err.message);
      } else {
        setFetchError("Không thể tải danh sách yêu cầu.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const filteredRequests = requests.filter((req) => {
    if (statusFilter === "ALL") return true;
    return req.status === statusFilter;
  });

  const handleApprove = (request: ApiLecturerRequest) => {
    modals.openConfirmModal({
      title: "Xác nhận duyệt yêu cầu",
      centered: true,
      radius: 0,
      children: (
        <Text size="sm">
          Bạn có chắc muốn duyệt yêu cầu của <strong>{request.name}</strong> ({request.email})?
          Hệ thống sẽ tạo tài khoản giảng viên và hiển thị mật khẩu tạm.
        </Text>
      ),
      labels: { confirm: "Duyệt", cancel: "Hủy" },
      confirmProps: { color: "green", radius: 0 },
      cancelProps: { radius: 0 },
      onConfirm: async () => {
        setActionLoadingId(request.id);
        try {
          const result = await approveLecturerRequest(request.id);
          setCredentialsModal(result);
          await fetchRequests();
        } catch (err) {
          const message =
            err instanceof ApiError ? err.message : "Không thể duyệt yêu cầu. Vui lòng thử lại.";
          modals.open({
            title: "Lỗi",
            centered: true,
            radius: 0,
            children: <Text size="sm">{message}</Text>,
          });
        } finally {
          setActionLoadingId(null);
        }
      },
    });
  };

  const handleReject = (request: ApiLecturerRequest) => {
    modals.openConfirmModal({
      title: "Xác nhận từ chối yêu cầu",
      centered: true,
      radius: 0,
      children: (
        <Text size="sm">
          Bạn có chắc muốn từ chối yêu cầu của <strong>{request.name}</strong> ({request.email})?
        </Text>
      ),
      labels: { confirm: "Từ chối", cancel: "Hủy" },
      confirmProps: { color: "red", radius: 0 },
      cancelProps: { radius: 0 },
      onConfirm: async () => {
        setActionLoadingId(request.id);
        try {
          await rejectLecturerRequest(request.id);
          await fetchRequests();
        } catch (err) {
          const message =
            err instanceof ApiError ? err.message : "Không thể từ chối yêu cầu. Vui lòng thử lại.";
          modals.open({
            title: "Lỗi",
            centered: true,
            radius: 0,
            children: <Text size="sm">{message}</Text>,
          });
        } finally {
          setActionLoadingId(null);
        }
      },
    });
  };

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="center">
        <div>
          <Title order={1} style={{ fontSize: "24px", fontWeight: 900, color: "#1A3A5C" }}>
            Yêu cầu Giảng viên
          </Title>
          <Text size="sm" c="dimmed">
            Duyệt hoặc từ chối các yêu cầu đăng ký quyền LECTURER
          </Text>
        </div>
        <Group gap="xs">
          <Badge color="yellow" radius={0} size="lg" fw={700}>
            {pendingCount} chờ duyệt
          </Badge>
        </Group>
      </Group>

      {fetchError && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" radius={0}>
          {fetchError}
        </Alert>
      )}

      <Tabs
        value={statusFilter}
        onChange={(value) => setStatusFilter((value as StatusFilter) || "ALL")}
        radius={0}
        color="#1A3A5C"
      >
        <Tabs.List>
          <Tabs.Tab value="ALL" fw={700}>
            Tất cả
          </Tabs.Tab>
          <Tabs.Tab value="PENDING" fw={700}>
            Pending
          </Tabs.Tab>
          <Tabs.Tab value="APPROVED" fw={700}>
            Approved
          </Tabs.Tab>
          <Tabs.Tab value="REJECTED" fw={700}>
            Rejected
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      <Card p={0} radius={0} style={{ border: "1px solid #E2E8F0", backgroundColor: "white" }}>
        {isLoading ? (
          <Center p="xl">
            <Loader color="#1A3A5C" />
          </Center>
        ) : (
          <>
            <Table layout="fixed" highlightOnHover striped>
              <Table.Thead style={{ backgroundColor: "#F8FAFC" }}>
                <Table.Tr>
                  <Table.Th style={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>Họ tên</Table.Th>
                  <Table.Th style={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>Email</Table.Th>
                  <Table.Th style={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>Lý do</Table.Th>
                  <Table.Th style={{ width: "120px", fontWeight: 700, fontSize: "12px", color: "#475569" }}>
                    Trạng thái
                  </Table.Th>
                  <Table.Th style={{ width: "160px", fontWeight: 700, fontSize: "12px", color: "#475569" }}>
                    Ngày gửi
                  </Table.Th>
                  <Table.Th style={{ width: "180px", fontWeight: 700, fontSize: "12px", color: "#475569", textAlign: "right" }}>
                    Hành động
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredRequests.map((request) => {
                  const badge = getStatusBadge(request.status);
                  return (
                    <Table.Tr key={request.id}>
                      <Table.Td style={{ fontSize: "13px", fontWeight: 700 }}>{request.name}</Table.Td>
                      <Table.Td style={{ fontSize: "13px" }}>{request.email}</Table.Td>
                      <Table.Td style={{ fontSize: "13px" }}>{request.reason}</Table.Td>
                      <Table.Td>
                        <Badge color={badge.color} radius={0} fw={700}>
                          {badge.label}
                        </Badge>
                      </Table.Td>
                      <Table.Td style={{ fontSize: "12px" }}>{formatDate(request.createdAt)}</Table.Td>
                      <Table.Td style={{ textAlign: "right" }}>
                        {request.status === "PENDING" ? (
                          <Group gap="xs" justify="flex-end">
                            <Button
                              size="xs"
                              radius={0}
                              color="green"
                              leftSection={<IconCheck size={14} />}
                              fw={700}
                              loading={actionLoadingId === request.id}
                              onClick={() => handleApprove(request)}
                            >
                              Duyệt
                            </Button>
                            <Button
                              size="xs"
                              radius={0}
                              color="red"
                              variant="outline"
                              leftSection={<IconX size={14} />}
                              fw={700}
                              loading={actionLoadingId === request.id}
                              onClick={() => handleReject(request)}
                            >
                              Từ chối
                            </Button>
                          </Group>
                        ) : (
                          <Text size="xs" c="dimmed" fw={700}>
                            —
                          </Text>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>

            {filteredRequests.length === 0 && (
              <Box p="xl" style={{ textAlign: "center", color: "#9CA3AF" }}>
                <ThemeIcon size={48} radius={0} color="gray.0" style={{ color: "#64748B", margin: "0 auto 12px" }}>
                  <IconUserCog size={24} />
                </ThemeIcon>
                <Text size="sm" fw={700}>
                  Không có yêu cầu nào
                </Text>
              </Box>
            )}
          </>
        )}
      </Card>

      <Modal
        opened={credentialsModal !== null}
        onClose={() => {}}
        title="Thông tin tài khoản giảng viên"
        centered
        radius={0}
        closeOnClickOutside={false}
        closeOnEscape={false}
        withCloseButton={false}
        styles={{
          title: { fontWeight: 900, color: "#1A3A5C", textTransform: "uppercase", fontSize: "16px" },
          header: { borderBottom: "1px solid #E2E8F0" },
        }}
      >
        {credentialsModal && (
          <Stack gap="md" py="md">
            <Alert icon={<IconAlertCircle size={16} />} color="orange" radius={0} title="Lưu ý quan trọng">
              Mật khẩu tạm chỉ hiển thị một lần. Hãy sao chép và gửi cho giảng viên trước khi đóng.
            </Alert>

            <Box>
              <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                Email
              </Text>
              <Text fw={700}>{credentialsModal.credentials.email}</Text>
            </Box>

            <Box>
              <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                Mật khẩu tạm
              </Text>
              <Group gap="xs">
                <Text fw={900} style={{ fontFamily: "monospace", color: "#1A3A5C" }}>
                  {credentialsModal.credentials.temporaryPassword}
                </Text>
                <CopyButton value={credentialsModal.credentials.temporaryPassword}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? "Đã sao chép" : "Sao chép"} withArrow>
                      <ActionIcon color={copied ? "teal" : "gray"} variant="subtle" onClick={copy} radius={0}>
                        <IconCopy size={16} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              </Group>
            </Box>

            <Group justify="flex-end" mt="md">
              <Button
                radius={0}
                style={{ backgroundColor: "#1A3A5C" }}
                fw={700}
                onClick={() => setCredentialsModal(null)}
              >
                Đã ghi nhận
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}

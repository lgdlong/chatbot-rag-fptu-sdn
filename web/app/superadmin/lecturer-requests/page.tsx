"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Title,
  Text,
  Button,
  Card,
  Table,
  Group,
  Stack,
  Badge,
  ActionIcon,
  Modal,
  Alert,
  ThemeIcon,
  Box,
  Loader,
  Center,
  Tabs,
  CopyButton,
  Tooltip,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import {
  IconCheck,
  IconX,
  IconAlertCircle,
  IconUserCog,
  IconCopy,
  IconCheck as IconCheckmark,
} from "@tabler/icons-react";
import {
  apiFetch,
  ApiError,
  LecturerRequest,
  LecturerRequestListResponse,
  ApproveRequestResponse,
} from "../../../lib/auth-client";

type StatusFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

interface CredentialsModalState {
  open: boolean;
  email: string;
  temporaryPassword: string;
}

function statusBadgeColor(status: string): string {
  if (status === "PENDING") return "yellow";
  if (status === "APPROVED") return "green";
  if (status === "REJECTED") return "red";
  return "gray";
}

function statusLabel(status: string): string {
  if (status === "PENDING") return "Chờ duyệt";
  if (status === "APPROVED") return "Đã duyệt";
  if (status === "REJECTED") return "Từ chối";
  return "Không xác định";
}

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN");
}

export default function LecturerRequestsPage() {
  const [allRequests, setAllRequests] = useState<LecturerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [credentialsModal, setCredentialsModal] = useState<CredentialsModalState>({
    open: false,
    email: "",
    temporaryPassword: "",
  });

  const filteredRequests = allRequests.filter(
    (req) => statusFilter === "ALL" || req.status === statusFilter,
  );

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<LecturerRequestListResponse>(
        "/api/auth-admin/admin/lecturer-requests",
      );
      setAllRequests(data.requests);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Không tải được danh sách yêu cầu";
      notifications.show({
        title: "Lỗi",
        message,
        color: "red",
      });
      setAllRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const handleApprove = (request: LecturerRequest) => {
    modals.openConfirmModal({
      title: "Duyệt yêu cầu giảng viên",
      children: (
        <Stack gap="xs">
          <Text size="sm">
            Bạn có chắc muốn duyệt yêu cầu của <b>{request.name}</b> ({request.email})?
          </Text>
          <Text size="xs" c="dimmed">
            Hệ thống sẽ gửi mật khẩu tạm thời cho email này.
          </Text>
        </Stack>
      ),
      labels: { confirm: "Duyệt", cancel: "Hủy" },
      confirmProps: { color: "green" },
      onConfirm: async () => {
        try {
          const result = await apiFetch<ApproveRequestResponse>(
            `/api/auth-admin/admin/lecturer-requests/${request.id}/approve`,
            { method: "POST" },
          );
          notifications.show({
            title: "Thành công",
            message: result.message,
            color: "green",
          });
          setCredentialsModal({
            open: true,
            email: result.credentials.email,
            temporaryPassword: result.credentials.temporaryPassword,
          });
          void loadRequests();
        } catch (err) {
          notifications.show({
            title: "Lỗi",
            message:
              err instanceof ApiError ? err.message : "Không duyệt được yêu cầu",
            color: "red",
          });
        }
      },
    });
  };

  const handleReject = (request: LecturerRequest) => {
    modals.openConfirmModal({
      title: "Từ chối yêu cầu giảng viên",
      children: (
        <Text size="sm">
          Bạn có chắc muốn từ chối yêu cầu của <b>{request.name}</b> ({request.email})?
        </Text>
      ),
      labels: { confirm: "Từ chối", cancel: "Hủy" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await apiFetch(`/api/auth-admin/admin/lecturer-requests/${request.id}/reject`, {
            method: "POST",
          });
          notifications.show({
            title: "Đã từ chối",
            message: `Yêu cầu của ${request.name} đã bị từ chối`,
            color: "green",
          });
          void loadRequests();
        } catch (err) {
          notifications.show({
            title: "Lỗi",
            message:
              err instanceof ApiError
                ? err.message
                : "Không từ chối được yêu cầu",
            color: "red",
          });
        }
      },
    });
  };

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="center">
        <div>
          <Title order={1} style={{ fontSize: "24px", fontWeight: 900, color: "#1A3A5C" }}>
            Yêu cầu Giảng viên
          </Title>
          <Text size="sm" c="dimmed">
            API <b>GET/POST /api/auth-admin/admin/lecturer-requests</b>
          </Text>
        </div>
      </Group>

      {loading ? (
        <Center py="xl">
          <Loader color="#1A3A5C" type="bars" />
        </Center>
      ) : (
        <>
          <Tabs
            defaultValue="ALL"
            onChange={(value) => setStatusFilter(value as StatusFilter)}
            styles={{
              tabLabel: { fontWeight: 700, fontSize: "14px" },
            }}
          >
            <Tabs.List>
              <Tabs.Tab
                value="ALL"
                leftSection={<span>{allRequests.length}</span>}
              >
                Tất cả
              </Tabs.Tab>
              <Tabs.Tab
                value="PENDING"
                leftSection={
                  <Badge size="sm" color="yellow" variant="light">
                    {allRequests.filter((r) => r.status === "PENDING").length}
                  </Badge>
                }
              >
                Chờ duyệt
              </Tabs.Tab>
              <Tabs.Tab
                value="APPROVED"
                leftSection={
                  <Badge size="sm" color="green" variant="light">
                    {allRequests.filter((r) => r.status === "APPROVED").length}
                  </Badge>
                }
              >
                Đã duyệt
              </Tabs.Tab>
              <Tabs.Tab
                value="REJECTED"
                leftSection={
                  <Badge size="sm" color="red" variant="light">
                    {allRequests.filter((r) => r.status === "REJECTED").length}
                  </Badge>
                }
              >
                Từ chối
              </Tabs.Tab>
            </Tabs.List>
          </Tabs>

          <Card p={0} radius={0} style={{ border: "1px solid #E2E8F0", backgroundColor: "white" }}>
            <Table layout="fixed" highlightOnHover striped>
              <Table.Thead style={{ backgroundColor: "#F8FAFC" }}>
                <Table.Tr>
                  <Table.Th style={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>
                    Họ tên
                  </Table.Th>
                  <Table.Th style={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>
                    Email
                  </Table.Th>
                  <Table.Th style={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>
                    Lý do
                  </Table.Th>
                  <Table.Th
                    style={{
                      width: "120px",
                      fontWeight: 700,
                      fontSize: "12px",
                      color: "#475569",
                    }}
                  >
                    Trạng thái
                  </Table.Th>
                  <Table.Th
                    style={{
                      width: "160px",
                      fontWeight: 700,
                      fontSize: "12px",
                      color: "#475569",
                    }}
                  >
                    Ngày gửi
                  </Table.Th>
                  <Table.Th
                    style={{
                      width: "160px",
                      fontWeight: 700,
                      fontSize: "12px",
                      color: "#475569",
                      textAlign: "center",
                    }}
                  >
                    Hành động
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredRequests.map((request) => (
                  <Table.Tr key={request.id}>
                    <Table.Td style={{ fontSize: "13px", fontWeight: 700 }}>
                      <Group gap="xs">
                        <ThemeIcon size={28} color="blue.0" style={{ color: "#1A3A5C" }}>
                          <IconUserCog size={16} />
                        </ThemeIcon>
                        <Text span inherit>{request.name}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td style={{ fontSize: "13px", color: "#64748B" }}>
                      {request.email}
                    </Table.Td>
                    <Table.Td
                      style={{
                        fontSize: "13px",
                        color: "#64748B",
                        maxWidth: "200px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={request.reason}
                    >
                      {request.reason}
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={statusBadgeColor(request.status)}
                        radius={0}
                        fw={700}
                      >
                        {statusLabel(request.status)}
                      </Badge>
                    </Table.Td>
                    <Table.Td style={{ fontSize: "13px", color: "#64748B" }}>
                      {formatDate(request.createdAt)}
                    </Table.Td>
                    <Table.Td style={{ textAlign: "center" }}>
                      {request.status === "PENDING" && (
                        <Group gap="xs" justify="center">
                          <Tooltip label="Duyệt">
                            <ActionIcon
                              variant="subtle"
                              color="green"
                              size="sm"
                              onClick={() => handleApprove(request)}
                              aria-label="Duyệt"
                            >
                              <IconCheck size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Từ chối">
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              size="sm"
                              onClick={() => handleReject(request)}
                              aria-label="Từ chối"
                            >
                              <IconX size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      )}
                      {request.status !== "PENDING" && (
                        <Text size="xs" c="dimmed">
                          —
                        </Text>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>

            {filteredRequests.length === 0 && (
              <Box p="xl" style={{ textAlign: "center", color: "#9CA3AF" }}>
                <Text size="sm" fw={700}>
                  Không có yêu cầu nào phù hợp
                </Text>
              </Box>
            )}
          </Card>
        </>
      )}

      <Modal
        opened={credentialsModal.open}
        onClose={() => {}}
        title="Thông tin đăng nhập tạm thời"
        centered
        radius={0}
        closeOnClickOutside={false}
        closeOnEscape={false}
        withCloseButton={false}
        styles={{
          title: {
            fontWeight: 900,
            color: "#1A3A5C",
            textTransform: "uppercase",
            fontSize: "16px",
          },
          header: { borderBottom: "1px solid #E2E8F0" },
        }}
      >
        <Stack gap="lg" py="md">
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Lưu ý quan trọng"
            color="orange"
            radius={0}
          >
            <Text size="sm">
              Thông tin này chỉ hiển thị một lần duy nhất. Vui lòng sao chép và gửi cho giảng viên ngay.
            </Text>
          </Alert>

          <div>
            <Text size="sm" fw={700} mb="xs">
              Email
            </Text>
            <Group gap="xs">
              <Text
                size="sm"
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  backgroundColor: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: "0px",
                  fontFamily: "monospace",
                }}
              >
                {credentialsModal.email}
              </Text>
              <CopyButton
                value={credentialsModal.email}
                timeout={2000}
              >
                {({ copied, copy }) => (
                  <Tooltip
                    label={copied ? "Đã sao chép" : "Sao chép"}
                    withArrow
                    position="right"
                  >
                    <ActionIcon
                      color={copied ? "teal" : "gray"}
                      variant="light"
                      onClick={copy}
                      size="lg"
                    >
                      {copied ? (
                        <IconCheckmark size={16} />
                      ) : (
                        <IconCopy size={16} />
                      )}
                    </ActionIcon>
                  </Tooltip>
                )}
              </CopyButton>
            </Group>
          </div>

          <div>
            <Text size="sm" fw={700} mb="xs">
              Mật khẩu tạm thời
            </Text>
            <Group gap="xs">
              <Text
                size="sm"
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  backgroundColor: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: "0px",
                  fontFamily: "monospace",
                  letterSpacing: "2px",
                }}
              >
                {credentialsModal.temporaryPassword}
              </Text>
              <CopyButton
                value={credentialsModal.temporaryPassword}
                timeout={2000}
              >
                {({ copied, copy }) => (
                  <Tooltip
                    label={copied ? "Đã sao chép" : "Sao chép"}
                    withArrow
                    position="right"
                  >
                    <ActionIcon
                      color={copied ? "teal" : "gray"}
                      variant="light"
                      onClick={copy}
                      size="lg"
                    >
                      {copied ? (
                        <IconCheckmark size={16} />
                      ) : (
                        <IconCopy size={16} />
                      )}
                    </ActionIcon>
                  </Tooltip>
                )}
              </CopyButton>
            </Group>
          </div>

          <Group justify="flex-end" mt="md">
            <Button
              style={{ backgroundColor: "#1A3A5C" }}
              radius={0}
              onClick={() =>
                setCredentialsModal({
                  open: false,
                  email: "",
                  temporaryPassword: "",
                })
              }
              fw={700}
            >
              Đã ghi nhận
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}

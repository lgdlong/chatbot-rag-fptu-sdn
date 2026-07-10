"use client";

import React, { useCallback, useEffect, useState } from "react";
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
  Modal,
  Alert,
  Textarea,
  ThemeIcon,
  SimpleGrid,
  Box,
  Loader,
  Center,
  Pagination,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import {
  IconPlus,
  IconSearch,
  IconUserCheck,
  IconTrash,
  IconUpload,
  IconDownload,
  IconMail,
  IconAlertCircle,
} from "@tabler/icons-react";
import { apiFetch, ApiError } from "../../../lib/auth-client";

const PAGE_SIZE = 10;

interface WhitelistEmail {
  id: string;
  email: string;
  addedAt: string;
}

interface WhitelistListResponse {
  emails: WhitelistEmail[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface WhitelistImportResponse {
  success: boolean;
  importedCount: number;
  skippedCount: number;
}

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN");
}

export default function WhitelistManagementPage() {
  const [emails, setEmails] = useState<WhitelistEmail[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [adding, setAdding] = useState(false);

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkEmailsText, setBulkEmailsText] = useState("");
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadWhitelist = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (searchTerm) params.set("q", searchTerm);

      const data = await apiFetch<WhitelistListResponse>(`/api/whitelist?${params.toString()}`);
      setEmails(data.emails);
      setTotal(data.pagination.total);
      setTotalPages(Math.max(1, data.pagination.totalPages));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Không tải được whitelist";
      notifications.show({ title: "Lỗi", message, color: "red" });
      setEmails([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm]);

  useEffect(() => {
    void loadWhitelist();
  }, [loadWhitelist]);

  const handleAddEmail = async () => {
    setErrorMsg("");
    const email = newEmail.trim().toLowerCase();
    if (!email) {
      setErrorMsg("Email là bắt buộc");
      return;
    }

    setAdding(true);
    try {
      await apiFetch("/api/whitelist", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      notifications.show({
        title: "Thành công",
        message: `Đã thêm ${email} vào whitelist`,
        color: "green",
      });
      setShowAddModal(false);
      setNewEmail("");
      void loadWhitelist();
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : "Không thêm được email");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteEmail = (item: WhitelistEmail) => {
    modals.openConfirmModal({
      title: "Xóa khỏi whitelist",
      children: (
        <Text size="sm">
          Xóa <b>{item.email}</b> khỏi danh sách trắng?
        </Text>
      ),
      labels: { confirm: "Xóa", cancel: "Hủy" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await apiFetch(`/api/whitelist/${item.id}`, { method: "DELETE" });
          notifications.show({
            title: "Đã xóa",
            message: item.email,
            color: "green",
          });
          void loadWhitelist();
        } catch (err) {
          notifications.show({
            title: "Lỗi",
            message: err instanceof ApiError ? err.message : "Không xóa được email",
            color: "red",
          });
        }
      },
    });
  };

  const handleBulkUpload = async () => {
    if (!bulkEmailsText.trim()) {
      notifications.show({ title: "Lỗi", message: "Danh sách email trống", color: "red" });
      return;
    }

    const emailList = bulkEmailsText
      .split("\n")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (emailList.length === 0) {
      notifications.show({ title: "Lỗi", message: "Không có email hợp lệ", color: "red" });
      return;
    }

    setImporting(true);
    try {
      const result = await apiFetch<WhitelistImportResponse>("/api/whitelist/import", {
        method: "POST",
        body: JSON.stringify({ emails: emailList }),
      });
      notifications.show({
        title: "Import hoàn tất",
        message: `Thêm ${result.importedCount} email, bỏ qua ${result.skippedCount}`,
        color: "green",
      });
      setShowBulkModal(false);
      setBulkEmailsText("");
      void loadWhitelist();
    } catch (err) {
      notifications.show({
        title: "Lỗi",
        message: err instanceof ApiError ? err.message : "Import thất bại",
        color: "red",
      });
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({ page: "1", limit: "10000" });
      if (searchTerm) params.set("q", searchTerm);
      const data = await apiFetch<WhitelistListResponse>(`/api/whitelist?${params.toString()}`);
      const lines = data.emails.map((e) => e.email).join("\n");
      const blob = new Blob([lines], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "student-whitelist.txt";
      link.click();
      URL.revokeObjectURL(url);
      notifications.show({
        title: "Export",
        message: `Đã xuất ${data.emails.length} email`,
        color: "green",
      });
    } catch (err) {
      notifications.show({
        title: "Lỗi",
        message: err instanceof ApiError ? err.message : "Export thất bại",
        color: "red",
      });
    }
  };

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="center">
        <div>
          <Title order={1} style={{ fontSize: "24px", fontWeight: 900, color: "#1A3A5C" }}>
            Student Whitelist
          </Title>
          <Text size="sm" c="dimmed">
            API <b>GET/POST /api/whitelist</b> — 00_auth.md §4
          </Text>
        </div>
        <Group gap="xs">
          <Button
            onClick={() => setShowBulkModal(true)}
            variant="outline"
            color="gray"
            radius={0}
            leftSection={<IconUpload size={16} />}
            fw={700}
          >
            Bulk Upload
          </Button>
          <Button
            onClick={() => void handleExport()}
            variant="outline"
            color="green"
            radius={0}
            leftSection={<IconDownload size={16} />}
            fw={700}
          >
            Export
          </Button>
          <Button
            onClick={() => {
              setErrorMsg("");
              setShowAddModal(true);
            }}
            style={{ backgroundColor: "#F26F21" }}
            radius={0}
            leftSection={<IconPlus size={16} />}
            fw={700}
          >
            Thêm Email
          </Button>
        </Group>
      </Group>

      <Alert
        color="green"
        radius={0}
        title="Quy chế Whitelist"
        icon={<IconAlertCircle size={20} />}
        styles={{ title: { fontWeight: 700 } }}
      >
        <Stack gap="xs" mt="xs">
          <Text size="sm">• Chỉ email trong whitelist mới được đăng ký/đăng nhập sinh viên.</Text>

        </Stack>
      </Alert>

      <Card p="md" radius={0} style={{ border: "1px solid #E2E8F0", backgroundColor: "white" }}>
        <TextInput
          placeholder="Tìm kiếm email sinh viên..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          leftSection={<IconSearch size={16} color="#9CA3AF" />}
          radius={0}
          style={{ maxWidth: "400px" }}
        />
      </Card>

      <Card p={0} radius={0} style={{ border: "1px solid #E2E8F0", backgroundColor: "white" }}>
        {loading ? (
          <Center py="xl">
            <Loader color="#1A3A5C" type="bars" />
          </Center>
        ) : (
          <>
            <Table layout="fixed" highlightOnHover striped>
              <Table.Thead style={{ backgroundColor: "#F8FAFC" }}>
                <Table.Tr>
                  <Table.Th style={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>Email sinh viên</Table.Th>
                  <Table.Th style={{ width: "160px", fontWeight: 700, fontSize: "12px", color: "#475569" }}>Ngày thêm</Table.Th>
                  <Table.Th style={{ width: "160px", fontWeight: 700, fontSize: "12px", color: "#475569" }}>Trạng thái</Table.Th>
                  <Table.Th style={{ width: "80px", fontWeight: 700, fontSize: "12px", color: "#475569", textAlign: "right" }}>
                    Xóa
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {emails.map((item) => (
                  <Table.Tr key={item.id}>
                    <Table.Td style={{ fontSize: "13px", fontWeight: 700 }}>
                      <Group gap="xs">
                        <ThemeIcon size={28} color="green.0" style={{ color: "#16A34A" }}>
                          <IconUserCheck size={16} />
                        </ThemeIcon>
                        <Text span inherit>{item.email}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td style={{ fontSize: "13px", color: "#64748B" }}>{formatDate(item.addedAt)}</Table.Td>
                    <Table.Td>
                      <Badge color="green" radius={0} fw={700}>
                        ĐÃ DUYỆT
                      </Badge>
                    </Table.Td>
                    <Table.Td style={{ textAlign: "right" }}>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        size="sm"
                        onClick={() => handleDeleteEmail(item)}
                        aria-label="Xóa email"
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>

            {emails.length === 0 && (
              <Box p="xl" style={{ textAlign: "center", color: "#9CA3AF" }}>
                <Text size="sm" fw={700}>
                  Không tìm thấy email nào phù hợp
                </Text>
              </Box>
            )}

            {totalPages > 1 && (
              <Group justify="center" p="md">
                <Pagination total={totalPages} value={page} onChange={setPage} radius={0} color="#1A3A5C" />
              </Group>
            )}
          </>
        )}
      </Card>

      <Modal
        opened={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Thêm email sinh viên Whitelist"
        centered
        radius={0}
        styles={{
          title: { fontWeight: 900, color: "#1A3A5C", textTransform: "uppercase", fontSize: "16px" },
          header: { borderBottom: "1px solid #E2E8F0" },
        }}
      >
        <Stack gap="md" py="md">
          {errorMsg && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" radius={0}>
              {errorMsg}
            </Alert>
          )}

          <TextInput
            label="Email sinh viên"
            placeholder="SE150123@fpt.edu.vn"
            required
            radius={0}
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            leftSection={<IconMail size={16} />}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="outline" color="gray" radius={0} onClick={() => setShowAddModal(false)} fw={700}>
              Hủy bỏ
            </Button>
            <Button
              style={{ backgroundColor: "#F26F21" }}
              radius={0}
              onClick={() => void handleAddEmail()}
              fw={700}
              loading={adding}
            >
              Thêm vào Whitelist
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title="Upload hàng loạt email (Bulk Upload)"
        centered
        radius={0}
        styles={{
          title: { fontWeight: 900, color: "#1A3A5C", textTransform: "uppercase", fontSize: "16px" },
          header: { borderBottom: "1px solid #E2E8F0" },
        }}
      >
        <Stack gap="md" py="md">
          <Textarea
            label="Dán danh sách email (mỗi dòng một email)"
            placeholder={"student1@fpt.edu.vn\nstudent2@fpt.edu.vn"}
            rows={8}
            radius={0}
            value={bulkEmailsText}
            onChange={(e) => setBulkEmailsText(e.target.value)}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="outline" color="gray" radius={0} onClick={() => setShowBulkModal(false)} fw={700}>
              Hủy bỏ
            </Button>
            <Button
              style={{ backgroundColor: "#1A3A5C" }}
              radius={0}
              onClick={() => void handleBulkUpload()}
              fw={700}
              loading={importing}
            >
              Bắt đầu tải lên
            </Button>
          </Group>
        </Stack>
      </Modal>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <Card p="lg" radius={0} style={{ border: "1px solid #E2E8F0", backgroundColor: "white" }}>
          <Group gap="md">
            <ThemeIcon size={40} radius={0} color="green.0" style={{ color: "#16A34A" }}>
              <IconUserCheck size={20} />
            </ThemeIcon>
            <div>
              <Text size="xs" fw={700} c="dimmed" style={{ textTransform: "uppercase" }}>
                Tổng Whitelist
              </Text>
              <Text fw={900} size="xl" style={{ color: "#1A1A1A" }}>
                {loading ? "—" : total.toLocaleString("vi-VN")}
              </Text>
            </div>
          </Group>
        </Card>

        <Card p="lg" radius={0} style={{ border: "1px solid #E2E8F0", backgroundColor: "white" }}>
          <Group gap="md">
            <ThemeIcon size={40} radius={0} color="blue.0" style={{ color: "#1A3A5C" }}>
              <IconMail size={20} />
            </ThemeIcon>
            <div>
              <Text size="xs" fw={700} c="dimmed" style={{ textTransform: "uppercase" }}>
                Trang hiện tại
              </Text>
              <Text fw={900} size="xl" style={{ color: "#1A1A1A" }}>
                {loading ? "—" : `${page} / ${totalPages}`}
              </Text>
            </div>
          </Group>
        </Card>
      </SimpleGrid>
    </Stack>
  );
}

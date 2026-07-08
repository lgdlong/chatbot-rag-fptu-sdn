"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Title,
  Text,
  Button,
  Card,
  TextInput,
  Table,
  Group,
  Stack,
  ActionIcon,
  Modal,
  Alert,
  Textarea,
  ThemeIcon,
  SimpleGrid,
  Box,
  Pagination,
  Loader,
  Center,
} from "@mantine/core";
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
import {
  getWhitelist,
  addWhitelistEmail,
  importWhitelistEmails,
  deleteWhitelistEmail,
  ApiWhitelistEntry,
  ApiError,
} from "@/lib/api";

const PAGE_LIMIT = 10;

const emptyPagination = {
  page: 1,
  limit: PAGE_LIMIT,
  total: 0,
  totalPages: 0,
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function WhitelistManagementPage() {
  const [emails, setEmails] = useState<ApiWhitelistEntry[]>([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkEmailsText, setBulkEmailsText] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchWhitelist = useCallback(async () => {
    setIsLoading(true);
    setFetchError("");
    try {
      const result = await getWhitelist({
        page,
        limit: PAGE_LIMIT,
        q: debouncedSearch || undefined,
      });
      setEmails(result.emails);
      setPagination(result.pagination);
    } catch (err) {
      setEmails([]);
      setPagination(emptyPagination);
      if (err instanceof ApiError) {
        setFetchError(err.message);
      } else {
        setFetchError("Không thể tải danh sách whitelist.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchWhitelist();
  }, [fetchWhitelist]);

  const handleAddEmail = async () => {
    if (!newEmail.endsWith("@fpt.edu.vn")) {
      setErrorMsg("Email sinh viên bắt buộc phải có đuôi @fpt.edu.vn");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");
    try {
      await addWhitelistEmail(newEmail.trim().toLowerCase());
      setShowAddModal(false);
      setNewEmail("");
      await fetchWhitelist();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Không thể thêm email. Vui lòng thử lại.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEmail = async (item: ApiWhitelistEntry) => {
    if (!confirm(`Bạn muốn xóa email ${item.email} khỏi danh sách whitelist?`)) {
      return;
    }

    try {
      await deleteWhitelistEmail(item.id);
      if (emails.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        await fetchWhitelist();
      }
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Không thể xóa email. Vui lòng thử lại.";
      alert(message);
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkEmailsText.trim()) return;

    const emailList = bulkEmailsText
      .split("\n")
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.endsWith("@fpt.edu.vn"));

    if (emailList.length === 0) {
      alert("Không tìm thấy email hợp lệ dạng @fpt.edu.vn.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await importWhitelistEmails(emailList);
      alert(
        `Đã thêm ${result.importedCount} email. Bỏ qua ${result.skippedCount} email trùng/không hợp lệ.`
      );
      setShowBulkModal(false);
      setBulkEmailsText("");
      await fetchWhitelist();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Không thể import danh sách. Vui lòng thử lại.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const total = pagination.total > 0 ? pagination.total : PAGE_LIMIT;
      const result = await getWhitelist({
        q: debouncedSearch || undefined,
        limit: total,
        page: 1,
      });
      const dataStr = result.emails.map((e) => e.email).join("\n");
      const dataBlob = new Blob([dataStr], { type: "text/plain" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "student-whitelist.txt";
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Không thể xuất danh sách. Vui lòng thử lại.";
      alert(message);
    } finally {
      setIsExporting(false);
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
            Quản lý danh sách email sinh viên được phép đăng nhập Google OAuth
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
            onClick={handleExport}
            variant="outline"
            color="green"
            radius={0}
            leftSection={<IconDownload size={16} />}
            fw={700}
            loading={isExporting}
          >
            Export
          </Button>
          <Button
            onClick={() => setShowAddModal(true)}
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
        title="Quy chế Whitelist Google Portal"
        icon={<IconAlertCircle size={20} />}
        styles={{ title: { fontWeight: 700 } }}
      >
        <Stack gap="xs" mt="xs">
          <Text size="sm">
            • Chỉ những tài khoản sinh viên có email khớp trong danh sách này mới có thể đăng nhập.
          </Text>
          <Text size="sm">
            • Whitelist có thể được nhập thủ công từng email hoặc upload hàng loạt (Bulk upload) bằng
            cách dán danh sách.
          </Text>
          <Text size="sm">
            • Sinh viên không thuộc Whitelist sẽ bị chặn truy cập và hiển thị thông báo lỗi.
          </Text>
        </Stack>
      </Alert>

      {fetchError && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" radius={0}>
          {fetchError}
        </Alert>
      )}

      <Card p="md" radius={0} style={{ border: "1px solid #E2E8F0", backgroundColor: "white" }}>
        <TextInput
          placeholder="Tìm kiếm email sinh viên..."
          aria-label="Tìm kiếm email sinh viên"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftSection={<IconSearch size={16} color="#9CA3AF" />}
          radius={0}
          style={{ maxWidth: "400px" }}
        />
      </Card>

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
                  <Table.Th style={{ width: "120px", fontWeight: 700, fontSize: "12px", color: "#475569" }}>
                    ID
                  </Table.Th>
                  <Table.Th style={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>
                    Email sinh viên
                  </Table.Th>
                  <Table.Th style={{ width: "160px", fontWeight: 700, fontSize: "12px", color: "#475569" }}>
                    Ngày thêm
                  </Table.Th>
                  <Table.Th
                    style={{ width: "80px", fontWeight: 700, fontSize: "12px", color: "#475569", textAlign: "right" }}
                  >
                    Xóa
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {emails.map((item) => (
                  <Table.Tr key={item.id}>
                    <Table.Td style={{ fontSize: "12px", color: "#64748B" }}>{item.id.slice(0, 8)}...</Table.Td>
                    <Table.Td style={{ fontSize: "13px", fontWeight: 700 }}>
                      <Group gap="xs">
                        <ThemeIcon size={28} color="green.0" style={{ color: "#16A34A" }}>
                          <IconUserCheck size={16} />
                        </ThemeIcon>
                        <Text span inherit>
                          {item.email}
                        </Text>
                      </Group>
                    </Table.Td>
                    <Table.Td style={{ fontSize: "13px" }}>{formatDate(item.addedAt)}</Table.Td>
                    <Table.Td style={{ textAlign: "right" }}>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        size="sm"
                        aria-label={`Xóa ${item.email} khỏi whitelist`}
                        onClick={() => handleDeleteEmail(item)}
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

            {pagination.totalPages > 1 && (
              <Group justify="center" p="md">
                <Pagination
                  total={pagination.totalPages}
                  value={page}
                  onChange={setPage}
                  radius={0}
                  color="#1A3A5C"
                />
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
            label="Email sinh viên (@fpt.edu.vn)"
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
              onClick={handleAddEmail}
              fw={700}
              loading={isSubmitting}
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
            label="Dán danh sách email sinh viên (Mỗi dòng một email)"
            placeholder={"student1@fpt.edu.vn\nstudent2@fpt.edu.vn\nstudent3@fpt.edu.vn"}
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
              onClick={handleBulkUpload}
              fw={700}
              loading={isSubmitting}
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
                {pagination.total}
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
                {pagination.page} / {Math.max(pagination.totalPages, 1)}
              </Text>
            </div>
          </Group>
        </Card>
      </SimpleGrid>
    </Stack>
  );
}

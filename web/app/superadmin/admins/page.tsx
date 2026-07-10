"use client";

import React, { useCallback, useEffect, useState } from "react";
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
  Modal,
  PasswordInput,
  Alert,
  Box,
  ThemeIcon,
  Select,
  Pagination,
  Loader,
  Center,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconPlus,
  IconSearch,
  IconShield,
  IconEye,
  IconMail,
  IconLock,
  IconAlertCircle,
  IconUser,
} from "@tabler/icons-react";
import { authClient } from "../../../lib/auth-client";
import type { UserRole } from "../../contexts/AuthContext";

const PAGE_SIZE = 10;

type RoleFilter = UserRole | "ALL";

interface AdminListUser {
  id: string;
  name: string;
  email: string;
  role?: string | null;
  banned?: boolean | null;
  createdAt?: string | Date;
}

function roleBadgeColor(role: string | null | undefined): string {
  if (role === "ADMIN") return "blue";
  if (role === "LECTURER") return "orange";
  return "gray";
}

function formatDate(value: string | Date | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN");
}

export default function AdminManagementPage() {
  const [users, setUsers] = useState<AdminListUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("STUDENT");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const searchField = searchTerm.includes("@") ? "email" : "name";
      const baseQuery: Record<string, string> = {
        limit: roleFilter === "ALL" ? String(PAGE_SIZE) : "500",
        offset: roleFilter === "ALL" ? String((page - 1) * PAGE_SIZE) : "0",
      };
      if (searchTerm) {
        baseQuery.searchValue = searchTerm;
        baseQuery.searchField = searchField;
      }

      const res = await authClient.admin.listUsers({ query: baseQuery });
      if (res.error) {
        throw new Error(res.error.message ?? "Không tải được danh sách người dùng");
      }

      let list = (res.data?.users ?? []) as AdminListUser[];
      let count = res.data?.total ?? list.length;

      if (roleFilter !== "ALL") {
        list = list.filter((u) => u.role === roleFilter);
        count = list.length;
        const start = (page - 1) * PAGE_SIZE;
        list = list.slice(start, start + PAGE_SIZE);
      }

      setUsers(list);
      setTotal(count);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Lỗi tải danh sách";
      notifications.show({ title: "Lỗi", message, color: "red" });
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, roleFilter]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const handleAddUser = async () => {
    setErrorMsg("");
    if (!newEmail.trim()) {
      setErrorMsg("Email là bắt buộc");
      return;
    }
    if (!newName.trim()) {
      setErrorMsg("Họ tên là bắt buộc");
      return;
    }
    if (newPassword && newPassword.length < 8) {
      setErrorMsg("Mật khẩu tối thiểu 8 ký tự");
      return;
    }

    setCreating(true);
    try {
      const res = await authClient.admin.createUser({
        name: newName.trim(),
        email: newEmail.trim().toLowerCase(),
        password: newPassword || undefined,
        role: newRole,
      });
      if (res.error) {
        throw new Error(res.error.message ?? "Không tạo được tài khoản");
      }
      notifications.show({
        title: "Thành công",
        message: `Đã tạo tài khoản ${newEmail}`,
        color: "green",
      });
      setShowAddModal(false);
      setNewEmail("");
      setNewPassword("");
      setNewName("");
      setNewRole("STUDENT");
      void loadUsers();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Không tạo được tài khoản");
    } finally {
      setCreating(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="center">
        <div>
          <Title order={1} style={{ fontSize: "24px", fontWeight: 900, color: "#1A3A5C" }}>
            Quản lý tài khoản
          </Title>
          <Text size="sm" c="dimmed">
            Danh sách người dùng hệ thống (Admin Plugin — 00_auth.md §3)
          </Text>
        </div>
        <Button
          leftSection={<IconPlus size={16} />}
          style={{ backgroundColor: "#F26F21" }}
          radius={0}
          fw={700}
          onClick={() => {
            setErrorMsg("");
            setShowAddModal(true);
          }}
        >
          Tạo người dùng
        </Button>
      </Group>

      <Alert
        color="indigo"
        radius={0}
        title="API Admin Plugin"
        icon={<IconAlertCircle size={20} />}
        styles={{ title: { fontWeight: 700 } }}
      >
        <Text size="sm">
          Sử dụng <b>list-users</b> và <b>create-user</b>. Chi tiết từng tài khoản tại trang xem chi tiết.
        </Text>
      </Alert>

      <Card p="md" radius={0} style={{ border: "1px solid #E2E8F0", backgroundColor: "white" }}>
        <Group gap="md" wrap="wrap">
          <TextInput
            placeholder="Tìm theo tên hoặc email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            leftSection={<IconSearch size={16} color="#9CA3AF" />}
            radius={0}
            style={{ flex: 1, minWidth: 220, maxWidth: 400 }}
          />
          <Select
            label="Vai trò"
            placeholder="Tất cả"
            data={[
              { value: "ALL", label: "Tất cả vai trò" },
              { value: "ADMIN", label: "ADMIN" },
              { value: "LECTURER", label: "LECTURER" },
              { value: "STUDENT", label: "STUDENT" },
            ]}
            value={roleFilter}
            onChange={(v) => {
              setRoleFilter((v as RoleFilter) ?? "ALL");
              setPage(1);
            }}
            radius={0}
            w={180}
          />
        </Group>
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
                  <Table.Th style={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>Người dùng</Table.Th>
                  <Table.Th style={{ width: "120px", fontWeight: 700, fontSize: "12px", color: "#475569" }}>Vai trò</Table.Th>
                  <Table.Th style={{ width: "120px", fontWeight: 700, fontSize: "12px", color: "#475569" }}>Trạng thái</Table.Th>
                  <Table.Th style={{ width: "120px", fontWeight: 700, fontSize: "12px", color: "#475569" }}>Ngày tạo</Table.Th>
                  <Table.Th style={{ width: "72px", fontWeight: 700, fontSize: "12px", color: "#475569", textAlign: "right" }}>
                    Chi tiết
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {users.map((user) => (
                  <Table.Tr key={user.id}>
                    <Table.Td>
                      <Group gap="sm">
                        <ThemeIcon size={36} radius={0} color="blue.1" style={{ color: "#1A3A5C" }}>
                          <IconShield size={18} />
                        </ThemeIcon>
                        <div>
                          <Text size="sm" fw={700} style={{ color: "#1A1A1A" }}>
                            {user.name}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {user.email}
                          </Text>
                        </div>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={roleBadgeColor(user.role)} radius={0} fw={700}>
                        {user.role ?? "—"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {user.banned ? (
                        <Badge color="red" radius={0} fw={700}>
                          BỊ CẤM
                        </Badge>
                      ) : (
                        <Badge color="green" radius={0} fw={700}>
                          HOẠT ĐỘNG
                        </Badge>
                      )}
                    </Table.Td>
                    <Table.Td style={{ fontSize: "13px", color: "#64748B" }}>
                      {formatDate(user.createdAt)}
                    </Table.Td>
                    <Table.Td style={{ textAlign: "right" }}>
                      <ActionIcon
                        component={Link}
                        href={`/superadmin/admins/${user.id}`}
                        variant="subtle"
                        color="gray"
                        size="sm"
                        aria-label="Xem chi tiết"
                      >
                        <IconEye size={16} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>

            {users.length === 0 && (
              <Box p="xl" style={{ textAlign: "center", color: "#9CA3AF" }}>
                <Text size="sm" fw={700}>
                  Không tìm thấy người dùng phù hợp
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
        title="Tạo người dùng mới"
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
            label="Họ và tên"
            placeholder="Nguyễn Văn A"
            required
            radius={0}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            leftSection={<IconUser size={16} />}
          />

          <TextInput
            label="Email"
            placeholder="user@fpt.edu.vn"
            required
            radius={0}
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            leftSection={<IconMail size={16} />}
          />

          <PasswordInput
            label="Mật khẩu (tùy chọn, tối thiểu 8 ký tự)"
            placeholder="••••••••"
            radius={0}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            leftSection={<IconLock size={16} />}
          />

          <Select
            label="Vai trò"
            data={[
              { value: "STUDENT", label: "STUDENT" },
              { value: "LECTURER", label: "LECTURER" },
              { value: "ADMIN", label: "ADMIN" },
            ]}
            value={newRole}
            onChange={(v) => setNewRole((v as UserRole) ?? "STUDENT")}
            radius={0}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="outline" color="gray" radius={0} onClick={() => setShowAddModal(false)} fw={700}>
              Hủy bỏ
            </Button>
            <Button
              style={{ backgroundColor: "#F26F21" }}
              radius={0}
              onClick={() => void handleAddUser()}
              fw={700}
              loading={creating}
            >
              Tạo tài khoản
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}

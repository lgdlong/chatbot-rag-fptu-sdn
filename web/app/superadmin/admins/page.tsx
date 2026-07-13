"use client";

import React, { useEffect, useState } from "react";
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
  IconTrash,
  IconBan,
  IconCircleCheck,
  IconKey,
} from "@tabler/icons-react";
import { authClient, apiFetch } from "../../../lib/auth-client";
import type { UserRole } from "../../contexts/AuthContext";
import { modals } from "@mantine/modals";
import * as api from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const PAGE_SIZE = 10;

type RoleFilter = UserRole | "ALL";

interface AdminListUser {
  id: string;
  name: string;
  email: string;
  role?: string | null;
  banned?: boolean | null;
  plainPassword?: string | null;
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
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreateLecturerModal, setShowCreateLecturerModal] = useState(false);
  const [createLecturerEmail, setCreateLecturerEmail] = useState("");
  const [creatingLecturer, setCreatingLecturer] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("STUDENT");
  const [errorMsg, setErrorMsg] = useState("");

  const { data: sessionData } = authClient.useSession();
  const currentUserId = sessionData?.user?.id;

  const queryClient = useQueryClient();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", page, debouncedSearch, roleFilter],
    queryFn: async () => {
      const searchField = debouncedSearch.includes("@") ? "email" : "name";
      const baseQuery: Record<string, string> = {
        limit: roleFilter === "ALL" ? String(PAGE_SIZE) : "500",
        offset: roleFilter === "ALL" ? String((page - 1) * PAGE_SIZE) : "0",
      };
      if (debouncedSearch) {
        baseQuery.searchValue = debouncedSearch;
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

      return { users: list, total: count };
    },
    placeholderData: (prev) => prev,
  });

  const users = data?.users ?? [];
  const total = data?.total ?? 0;

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await authClient.admin.removeUser({ userId });
      if (res.error) throw new Error(res.error.message || "Không thể xóa tài khoản");
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const disableMutation = useMutation({
    mutationFn: (userId: string) => api.disableLecturer(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const enableMutation = useMutation({
    mutationFn: (userId: string) => api.enableLecturer(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (userId: string) => api.resetLecturerPassword(userId),
    onSuccess: (_data, userId) => {
      const user = users.find((u) => u.id === userId);
      notifications.show({
        title: "Thành công",
        message: `Đã gửi mật khẩu mới qua email ${user?.email ?? ""}`,
        color: "green",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err) => {
      notifications.show({
        title: "Lỗi",
        message: err instanceof Error ? err.message : "Không thể cấp lại mật khẩu",
        color: "red",
      });
    },
  });

  const handleDeleteUser = (user: AdminListUser) => {
    modals.openConfirmModal({
      title: "Xóa tài khoản người dùng",
      children: (
        <Text size="sm">
          Bạn có chắc chắn muốn xóa tài khoản của <b>{user.name} ({user.email})</b>?
          Hành động này sẽ xóa vĩnh viễn tài khoản và các dữ liệu liên quan.
        </Text>
      ),
      labels: { confirm: "Xóa", cancel: "Hủy" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await deleteMutation.mutateAsync(user.id);
          notifications.show({
            title: "Thành công",
            message: `Đã xóa tài khoản ${user.email}`,
            color: "green",
          });
        } catch (err: any) {
          notifications.show({
            title: "Lỗi",
            message: err.message || "Đã xảy ra lỗi khi xóa tài khoản.",
            color: "red",
          });
        }
      },
    });
  };

  const handleDisableLecturer = (user: AdminListUser) => {
    modals.openConfirmModal({
      title: "Vô hiệu hoá tài khoản",
      children: (
        <Text size="sm">
          Bạn có chắc chắn muốn vô hiệu hoá tài khoản của <b>{user.name} ({user.email})</b>?
          Người dùng sẽ không thể đăng nhập cho đến khi được kích hoạt lại.
        </Text>
      ),
      labels: { confirm: "Vô hiệu hoá", cancel: "Hủy" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await disableMutation.mutateAsync(user.id);
          notifications.show({
            title: "Thành công",
            message: `Đã vô hiệu hoá tài khoản ${user.email}`,
            color: "green",
          });
        } catch (err: any) {
          notifications.show({
            title: "Lỗi",
            message: err.message || "Không thể vô hiệu hoá tài khoản.",
            color: "red",
          });
        }
      },
    });
  };

  const handleResetLecturerPassword = (user: AdminListUser) => {
    modals.openConfirmModal({
      title: "Cấp lại mật khẩu",
      children: (
        <Text size="sm">
          Cấp lại mật khẩu cho giảng viên <b>{user.name} ({user.email})</b>?
          Mật khẩu mới sẽ được gửi qua email.
        </Text>
      ),
      labels: { confirm: "Cấp lại", cancel: "Hủy" },
      confirmProps: { color: "orange" },
      onConfirm: () => resetPasswordMutation.mutate(user.id),
    });
  };

  const handleEnableLecturer = (user: AdminListUser) => {
    modals.openConfirmModal({
      title: "Kích hoạt lại tài khoản",
      children: (
        <Text size="sm">
          Bạn có chắc chắn muốn kích hoạt lại tài khoản của <b>{user.name} ({user.email})</b>?
          Người dùng sẽ có thể đăng nhập trở lại.
        </Text>
      ),
      labels: { confirm: "Kích hoạt lại", cancel: "Hủy" },
      confirmProps: { color: "green" },
      onConfirm: async () => {
        try {
          await enableMutation.mutateAsync(user.id);
          notifications.show({
            title: "Thành công",
            message: `Đã kích hoạt lại tài khoản ${user.email}`,
            color: "green",
          });
        } catch (err: any) {
          notifications.show({
            title: "Lỗi",
            message: err.message || "Không thể kích hoạt lại tài khoản.",
            color: "red",
          });
        }
      },
    });
  };

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
        data: {
          plainPassword: newPassword || undefined,
        }
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
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Không tạo được tài khoản");
    } finally {
      setCreating(false);
    }
  };

  const handleCreateLecturer = async () => {
    setErrorMsg("");
    const email = createLecturerEmail.trim().toLowerCase();
    if (!email) {
      setErrorMsg("Email là bắt buộc");
      return;
    }

    setCreatingLecturer(true);
    try {
      await api.createLecturer({ email });
      notifications.show({
        title: "Thành công",
        message: `Mật khẩu đã được gửi qua email ${email}`,
        color: "green",
      });
      setShowCreateLecturerModal(false);
      setCreateLecturerEmail("");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (err: any) {
      setErrorMsg(err.message || "Không thể tạo tài khoản giảng viên");
    } finally {
      setCreatingLecturer(false);
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
        </div>
        <Group gap="sm">
          <Button
            variant="outline"
            color="gray"
            radius={0}
            fw={700}
            onClick={() => {
              setErrorMsg("");
              setCreateLecturerEmail("");
              setShowCreateLecturerModal(true);
            }}
          >
            Tạo giảng viên
          </Button>
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
      </Group>

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
        {isLoading ? (
          <Center py="xl">
            <Loader color="#1A3A5C" type="bars" />
          </Center>
        ) : (
          <>
            <Table layout="fixed" highlightOnHover striped>
              <Table.Thead style={{ backgroundColor: "#F8FAFC" }}>
                <Table.Tr>
                  <Table.Th style={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>Người dùng</Table.Th>
                  <Table.Th style={{ width: "110px", fontWeight: 700, fontSize: "12px", color: "#475569" }}>Vai trò</Table.Th>
                  <Table.Th style={{ width: "110px", fontWeight: 700, fontSize: "12px", color: "#475569" }}>Trạng thái</Table.Th>
                  <Table.Th style={{ width: "140px", fontWeight: 700, fontSize: "12px", color: "#475569" }}>Mật khẩu</Table.Th>
                  <Table.Th style={{ width: "110px", fontWeight: 700, fontSize: "12px", color: "#475569" }}>Ngày tạo</Table.Th>
                  <Table.Th style={{ width: "100px", fontWeight: 700, fontSize: "12px", color: "#475569", textAlign: "right" }}>
                    Thao tác
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
                    <Table.Td style={{ fontSize: "13px", color: "#64748B", fontFamily: "monospace" }}>
                      {user.plainPassword || "—"}
                    </Table.Td>
                    <Table.Td style={{ fontSize: "13px", color: "#64748B" }}>
                      {formatDate(user.createdAt)}
                    </Table.Td>
                    <Table.Td style={{ textAlign: "right" }}>
                      <Group gap="xs" justify="flex-end">
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
                        {user.role === "LECTURER" && !user.banned && (
                          <ActionIcon
                            variant="subtle"
                            color="orange"
                            size="sm"
                            aria-label="Vô hiệu hoá"
                            onClick={() => handleDisableLecturer(user)}
                          >
                            <IconBan size={16} />
                          </ActionIcon>
                        )}
                        {user.role === "LECTURER" && user.banned && (
                          <ActionIcon
                            variant="subtle"
                            color="green"
                            size="sm"
                            aria-label="Kích hoạt lại"
                            onClick={() => handleEnableLecturer(user)}
                          >
                            <IconCircleCheck size={16} />
                          </ActionIcon>
                        )}
                        {user.role === "LECTURER" && (
                          <ActionIcon
                            variant="subtle"
                            color="orange"
                            size="sm"
                            aria-label="Cấp lại mật khẩu"
                            onClick={() => handleResetLecturerPassword(user)}
                          >
                            <IconKey size={16} />
                          </ActionIcon>
                        )}
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          size="sm"
                          aria-label="Xóa tài khoản"
                          disabled={user.id === currentUserId}
                          onClick={() => handleDeleteUser(user)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
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
        opened={showCreateLecturerModal}
        onClose={() => setShowCreateLecturerModal(false)}
        title="Tạo giảng viên"
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

          <Text size="sm" c="dimmed">
            Hệ thống sẽ tự động tạo tài khoản và gửi thông tin đăng nhập qua email.
          </Text>

          <TextInput
            label="Email"
            placeholder="giangvien@fpt.edu.vn"
            required
            type="email"
            radius={0}
            value={createLecturerEmail}
            onChange={(e) => setCreateLecturerEmail(e.target.value)}
            leftSection={<IconMail size={16} />}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="outline" color="gray" radius={0} onClick={() => setShowCreateLecturerModal(false)} fw={700}>
              Hủy bỏ
            </Button>
            <Button
              style={{ backgroundColor: "#F26F21" }}
              radius={0}
              onClick={() => void handleCreateLecturer()}
              fw={700}
              loading={creatingLecturer}
            >
              Tạo giảng viên
            </Button>
          </Group>
        </Stack>
      </Modal>

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

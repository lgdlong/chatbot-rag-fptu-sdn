"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Title,
  Text,
  Button,
  Card,
  Group,
  Stack,
  Badge,
  Table,
  Box,
  ThemeIcon,
  Select,
  PasswordInput,
  TextInput,
  Loader,
  Center,
  Divider,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import {
  IconArrowLeft,
  IconShield,
  IconBan,
  IconLock,
  IconTrash,
  IconUserCheck,
  IconLogout,
  IconSwitchHorizontal,
} from "@tabler/icons-react";
import { authClient } from "../../../../lib/auth-client";
import {
  useAuth,
  portalPathForRole,
  type UserRole,
} from "../../../contexts/AuthContext";

interface AdminUserDetail {
  id: string;
  name: string;
  email: string;
  role?: string | null;
  banned?: boolean | null;
  banReason?: string | null;
  banExpires?: string | Date | null;
  emailVerified?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

interface UserSession {
  id?: string;
  token?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  expiresAt?: string | Date;
  createdAt?: string | Date;
}

function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN");
}

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const userId = params.id;
  const router = useRouter();
  const { user: currentUser, refetchSession } = useAuth();

  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("STUDENT");
  const [newPassword, setNewPassword] = useState("");
  const [banReason, setBanReason] = useState("");

  const isSelf = currentUser?.id === userId;

  const loadUser = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authClient.admin.getUser({ query: { id: userId } });
      if (res.error) {
        throw new Error(res.error.message ?? "Không tải được thông tin người dùng");
      }
      const user = res.data as AdminUserDetail;
      setDetail(user);
      if (user.role === "ADMIN" || user.role === "LECTURER" || user.role === "STUDENT") {
        setSelectedRole(user.role);
      }
    } catch (err) {
      notifications.show({
        title: "Lỗi",
        message: err instanceof Error ? err.message : "Không tải được người dùng",
        color: "red",
      });
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const res = await authClient.admin.listUserSessions({ userId });
      if (res.error) {
        throw new Error(res.error.message ?? "Không tải được phiên đăng nhập");
      }
      const list = Array.isArray(res.data) ? res.data : (res.data as { sessions?: UserSession[] })?.sessions ?? [];
      setSessions(list as UserSession[]);
    } catch (err) {
      notifications.show({
        title: "Lỗi",
        message: err instanceof Error ? err.message : "Không tải được phiên",
        color: "red",
      });
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadUser();
    void loadSessions();
  }, [loadUser, loadSessions]);

  const handleSetRole = () => {
    if (isSelf) return;
    modals.openConfirmModal({
      title: "Đổi vai trò",
      children: (
        <Text size="sm">
          Đổi vai trò của <b>{detail?.email}</b> thành <b>{selectedRole}</b>?
        </Text>
      ),
      labels: { confirm: "Xác nhận", cancel: "Hủy" },
      confirmProps: { color: "orange" },
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const res = await authClient.admin.setRole({ userId, role: selectedRole });
          if (res.error) throw new Error(res.error.message);
          notifications.show({ title: "Thành công", message: "Đã cập nhật vai trò", color: "green" });
          await loadUser();
        } catch (err) {
          notifications.show({
            title: "Lỗi",
            message: err instanceof Error ? err.message : "Không đổi được vai trò",
            color: "red",
          });
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleBan = () => {
    if (isSelf) return;
    modals.openConfirmModal({
      title: "Cấm tài khoản",
      children: (
        <Stack gap="sm">
          <Text size="sm">Bạn có chắc muốn cấm tài khoản này?</Text>
          <TextInput
            label="Lý do (tùy chọn)"
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            radius={0}
          />
        </Stack>
      ),
      labels: { confirm: "Cấm", cancel: "Hủy" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const res = await authClient.admin.banUser({
            userId,
            banReason: banReason.trim() || undefined,
          });
          if (res.error) throw new Error(res.error.message);
          notifications.show({ title: "Thành công", message: "Đã cấm tài khoản", color: "green" });
          await loadUser();
        } catch (err) {
          notifications.show({
            title: "Lỗi",
            message: err instanceof Error ? err.message : "Không cấm được tài khoản",
            color: "red",
          });
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleUnban = async () => {
    if (isSelf) return;
    setActionLoading(true);
    try {
      const res = await authClient.admin.unbanUser({ userId });
      if (res.error) throw new Error(res.error.message);
      notifications.show({ title: "Thành công", message: "Đã gỡ cấm tài khoản", color: "green" });
      await loadUser();
    } catch (err) {
      notifications.show({
        title: "Lỗi",
        message: err instanceof Error ? err.message : "Không gỡ cấm được",
        color: "red",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      notifications.show({ title: "Lỗi", message: "Mật khẩu tối thiểu 8 ký tự", color: "red" });
      return;
    }
    setActionLoading(true);
    try {
      const res = await authClient.admin.setUserPassword({ userId, newPassword });
      if (res.error) throw new Error(res.error.message);
      notifications.show({ title: "Thành công", message: "Đã đặt mật khẩu mới", color: "green" });
      setNewPassword("");
    } catch (err) {
      notifications.show({
        title: "Lỗi",
        message: err instanceof Error ? err.message : "Không đặt được mật khẩu",
        color: "red",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveUser = () => {
    if (isSelf) return;
    modals.openConfirmModal({
      title: "Xóa vĩnh viễn",
      children: (
        <Text size="sm" c="red">
          Xóa hoàn toàn tài khoản <b>{detail?.email}</b>? Hành động không thể hoàn tác.
        </Text>
      ),
      labels: { confirm: "Xóa", cancel: "Hủy" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const res = await authClient.admin.removeUser({ userId });
          if (res.error) throw new Error(res.error.message);
          notifications.show({ title: "Đã xóa", message: "Tài khoản đã bị xóa", color: "green" });
          router.push("/superadmin/admins");
        } catch (err) {
          notifications.show({
            title: "Lỗi",
            message: err instanceof Error ? err.message : "Không xóa được tài khoản",
            color: "red",
          });
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleImpersonate = () => {
    if (isSelf) return;
    modals.openConfirmModal({
      title: "Đóng vai người dùng",
      children: (
        <Text size="sm">
          Nhập vai <b>{detail?.email}</b>? Bạn sẽ chuyển sang portal của họ.
        </Text>
      ),
      labels: { confirm: "Đóng vai", cancel: "Hủy" },
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const res = await authClient.admin.impersonateUser({ userId });
          if (res.error) throw new Error(res.error.message);
          refetchSession();
          const role = (detail?.role as UserRole) ?? "STUDENT";
          router.push(portalPathForRole(role));
        } catch (err) {
          notifications.show({
            title: "Lỗi",
            message: err instanceof Error ? err.message : "Không đóng vai được",
            color: "red",
          });
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleRevokeSession = (sessionToken: string) => {
    modals.openConfirmModal({
      title: "Thu hồi phiên",
      children: <Text size="sm">Đăng xuất phiên này khỏi thiết bị của người dùng?</Text>,
      labels: { confirm: "Thu hồi", cancel: "Hủy" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          const res = await authClient.admin.revokeUserSession({ sessionToken });
          if (res.error) throw new Error(res.error.message);
          notifications.show({ title: "Thành công", message: "Đã thu hồi phiên", color: "green" });
          await loadSessions();
        } catch (err) {
          notifications.show({
            title: "Lỗi",
            message: err instanceof Error ? err.message : "Không thu hồi được phiên",
            color: "red",
          });
        }
      },
    });
  };

  if (loading) {
    return (
      <Center py="xl">
        <Loader color="#1A3A5C" size="lg" type="bars" />
      </Center>
    );
  }

  if (!detail) {
    return (
      <Stack gap="md">
        <Button component={Link} href="/superadmin/admins" variant="subtle" leftSection={<IconArrowLeft size={16} />}>
          Quay lại danh sách
        </Button>
        <Text c="dimmed">Không tìm thấy người dùng.</Text>
      </Stack>
    );
  }

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="flex-start">
        <Stack gap="xs">
          <Button
            component={Link}
            href="/superadmin/admins"
            variant="subtle"
            size="xs"
            leftSection={<IconArrowLeft size={14} />}
            styles={{ root: { paddingLeft: 0 } }}
          >
            Quay lại danh sách
          </Button>
          <Group gap="md">
            <ThemeIcon size={48} radius={0} color="blue.1" style={{ color: "#1A3A5C" }}>
              <IconShield size={24} />
            </ThemeIcon>
            <div>
              <Title order={1} style={{ fontSize: "22px", fontWeight: 900, color: "#1A3A5C" }}>
                {detail.name}
              </Title>
              <Text size="sm" c="dimmed">
                {detail.email}
              </Text>
              <Group gap="xs" mt={4}>
                <Badge color="blue" radius={0}>
                  {detail.role ?? "—"}
                </Badge>
                {detail.banned ? (
                  <Badge color="red" radius={0}>
                    BỊ CẤM
                  </Badge>
                ) : (
                  <Badge color="green" radius={0}>
                    HOẠT ĐỘNG
                  </Badge>
                )}
                {isSelf && (
                  <Badge color="yellow" radius={0}>
                    TÀI KHOẢN CỦA BẠN
                  </Badge>
                )}
              </Group>
            </div>
          </Group>
        </Stack>
      </Group>

      <Group grow align="stretch">
        <Card p="lg" radius={0} style={{ border: "1px solid #E2E8F0" }}>
          <Title order={3} size="sm" fw={800} mb="md" c="#1A3A5C">
            Thông tin
          </Title>
          <Stack gap="xs">
            <Text size="sm">
              <Text span fw={700}>
                Ngày tạo:
              </Text>{" "}
              {formatDateTime(detail.createdAt)}
            </Text>
            <Text size="sm">
              <Text span fw={700}>
                Cập nhật:
              </Text>{" "}
              {formatDateTime(detail.updatedAt)}
            </Text>
            {detail.banned && detail.banReason && (
              <Text size="sm" c="red">
                <Text span fw={700}>
                  Lý do cấm:
                </Text>{" "}
                {detail.banReason}
              </Text>
            )}
          </Stack>
        </Card>

        <Card p="lg" radius={0} style={{ border: "1px solid #E2E8F0" }}>
          <Title order={3} size="sm" fw={800} mb="md" c="#1A3A5C">
            Đổi vai trò
          </Title>
          <Group align="flex-end">
            <Select
              data={[
                { value: "STUDENT", label: "STUDENT" },
                { value: "LECTURER", label: "LECTURER" },
                { value: "ADMIN", label: "ADMIN" },
              ]}
              value={selectedRole}
              onChange={(v) => setSelectedRole((v as UserRole) ?? "STUDENT")}
              disabled={isSelf}
              radius={0}
              style={{ flex: 1 }}
            />
            <Button
              onClick={handleSetRole}
              disabled={isSelf || selectedRole === detail.role}
              loading={actionLoading}
              radius={0}
              style={{ backgroundColor: "#1A3A5C" }}
            >
              Lưu vai trò
            </Button>
          </Group>
        </Card>
      </Group>

      <Card p="lg" radius={0} style={{ border: "1px solid #E2E8F0" }}>
        <Title order={3} size="sm" fw={800} mb="md" c="#1A3A5C">
          Đặt mật khẩu mới
        </Title>
        <Group align="flex-end">
          <PasswordInput
            placeholder="Mật khẩu mới (tối thiểu 8 ký tự)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            radius={0}
            style={{ flex: 1 }}
            leftSection={<IconLock size={16} />}
          />
          <Button
            onClick={() => void handleSetPassword()}
            loading={actionLoading}
            radius={0}
            style={{ backgroundColor: "#F26F21" }}
          >
            Đặt mật khẩu
          </Button>
        </Group>
      </Card>

      <Card p="lg" radius={0} style={{ border: "1px solid #E2E8F0" }}>
        <Title order={3} size="sm" fw={800} mb="md" c="#1A3A5C">
          Hành động quản trị
        </Title>
        <Group gap="sm" wrap="wrap">
          {detail.banned ? (
            <Button
              leftSection={<IconUserCheck size={16} />}
              color="green"
              radius={0}
              onClick={() => void handleUnban()}
              disabled={isSelf}
              loading={actionLoading}
            >
              Gỡ cấm
            </Button>
          ) : (
            <Button
              leftSection={<IconBan size={16} />}
              color="red"
              variant="outline"
              radius={0}
              onClick={handleBan}
              disabled={isSelf}
              loading={actionLoading}
            >
              Cấm tài khoản
            </Button>
          )}
          <Button
            leftSection={<IconSwitchHorizontal size={16} />}
            variant="outline"
            radius={0}
            onClick={handleImpersonate}
            disabled={isSelf}
            loading={actionLoading}
          >
            Đóng vai
          </Button>
          <Button
            leftSection={<IconTrash size={16} />}
            color="red"
            radius={0}
            onClick={handleRemoveUser}
            disabled={isSelf}
            loading={actionLoading}
          >
            Xóa vĩnh viễn
          </Button>
        </Group>
        {isSelf && (
          <Text size="xs" c="dimmed" mt="sm">
            Không thể tự cấm, xóa, đổi role hoặc đóng vai chính mình.
          </Text>
        )}
      </Card>

      <Card p={0} radius={0} style={{ border: "1px solid #E2E8F0" }}>
        <Box px="md" py="sm" style={{ borderBottom: "1px solid #E2E8F0", backgroundColor: "#F8FAFC" }}>
          <Group justify="space-between">
            <Title order={3} size="sm" fw={800} c="#1A3A5C">
              Phiên đăng nhập
            </Title>
            <Button size="xs" variant="light" radius={0} loading={sessionsLoading} onClick={() => void loadSessions()}>
              Làm mới
            </Button>
          </Group>
        </Box>
        {sessionsLoading ? (
          <Center py="lg">
            <Loader size="sm" color="#1A3A5C" />
          </Center>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>IP</Table.Th>
                <Table.Th>Thiết bị</Table.Th>
                <Table.Th>Hết hạn</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>Thu hồi</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sessions.map((session, idx) => (
                <Table.Tr key={session.id ?? session.token ?? idx}>
                  <Table.Td>{session.ipAddress ?? "—"}</Table.Td>
                  <Table.Td>
                    <Text size="xs" lineClamp={2}>
                      {session.userAgent ?? "—"}
                    </Text>
                  </Table.Td>
                  <Table.Td>{formatDateTime(session.expiresAt)}</Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    {session.token ? (
                      <Button
                        size="xs"
                        color="red"
                        variant="subtle"
                        leftSection={<IconLogout size={14} />}
                        onClick={() => handleRevokeSession(session.token!)}
                      >
                        Thu hồi
                      </Button>
                    ) : (
                      "—"
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
        {!sessionsLoading && sessions.length === 0 && (
          <Box p="md">
            <Text size="sm" c="dimmed">
              Không có phiên hoạt động.
            </Text>
          </Box>
        )}
      </Card>

      <Divider />
    </Stack>
  );
}

"use client";

import React, { useState } from "react";
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
} from "@mantine/core";
import {
  IconPlus,
  IconSearch,
  IconShield,
  IconEdit,
  IconTrash,
  IconMail,
  IconLock,
  IconAlertCircle,
  IconUser,
} from "@tabler/icons-react";

const initialAdmins = [
  {
    id: "1",
    email: "admin1@fpt.edu.vn",
    name: "Quản trị viên 1",
    createdAt: "2026-01-15",
    lastLogin: "2026-06-05",
  },
  {
    id: "2",
    email: "admin2@fpt.edu.vn",
    name: "Quản trị viên 2",
    createdAt: "2026-02-20",
    lastLogin: "2026-06-04",
  },
];

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState(initialAdmins);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const filteredAdmins = admins.filter(
    (admin) =>
      admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddAdmin = () => {
    if (!newEmail.endsWith("@fpt.edu.vn")) {
      setErrorMsg("Email quản trị bắt buộc phải có đuôi @fpt.edu.vn");
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg("Mật khẩu tối thiểu phải từ 6 ký tự");
      return;
    }

    const admin = {
      id: Date.now().toString(),
      email: newEmail,
      name: newName || newEmail.split("@")[0],
      createdAt: new Date().toISOString().split("T")[0],
      lastLogin: "Chưa từng",
    };

    setAdmins([...admins, admin]);
    setShowAddModal(false);
    setNewEmail("");
    setNewPassword("");
    setNewName("");
    setErrorMsg("");
  };

  const handleDeleteAdmin = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa tài khoản quản trị này?")) {
      setAdmins(admins.filter((a) => a.id !== id));
    }
  };

  return (
    <Stack gap="xl">
      {/* Header */}
      <Group justify="space-between" align="center">
        <div>
          <Title order={1} style={{ fontSize: "24px", fontWeight: 900, color: "#1A3A5C" }}>
            Admin Accounts
          </Title>
          <Text size="sm" c="dimmed">
            Tạo mới và quản lý các tài khoản quản trị hệ thống
          </Text>
        </div>
        <Button
          leftSection={<IconPlus size={16} />}
          style={{ backgroundColor: "#F26F21" }}
          radius={0}
          fw={700}
          onClick={() => setShowAddModal(true)}
        >
          Thêm Admin
        </Button>
      </Group>

      {/* Access guidelines info */}
      <Alert
        color="indigo"
        radius={0}
        title="Yêu cầu truy cập tài khoản Admin"
        icon={<IconAlertCircle size={20} />}
        styles={{ title: { fontWeight: 700 } }}
      >
        <Stack gap="xs" mt="xs">
          <Text size="sm">• Email đăng ký bắt buộc phải thuộc tên miền đại học <b>@fpt.edu.vn</b>.</Text>
          <Text size="sm">• Mật khẩu đăng ký tối thiểu phải từ 6 ký tự.</Text>
          <Text size="sm">• Chỉ tài khoản Super Admin root mới có quyền tạo mới hoặc xóa tài khoản admin cấp dưới.</Text>
        </Stack>
      </Alert>

      {/* Filter Card */}
      <Card p="md" radius={0} style={{ border: "1px solid #E2E8F0", backgroundColor: "white" }}>
        <TextInput
          placeholder="Tìm kiếm admin theo tên hoặc email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftSection={<IconSearch size={16} color="#9CA3AF" />}
          radius={0}
          style={{ maxWidth: "400px" }}
        />
      </Card>

      {/* Table Card */}
      <Card p={0} radius={0} style={{ border: "1px solid #E2E8F0", backgroundColor: "white" }}>
        <Table layout="fixed" highlightOnHover striped>
          <Table.Thead style={{ backgroundColor: "#F8FAFC" }}>
            <Table.Tr>
              <Table.Th style={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>Quản trị viên (Admin Details)</Table.Th>
              <Table.Th style={{ width: "160px", fontWeight: 700, fontSize: "12px", color: "#475569" }}>Ngày tạo</Table.Th>
              <Table.Th style={{ width: "160px", fontWeight: 700, fontSize: "12px", color: "#475569" }}>Đăng nhập cuối</Table.Th>
              <Table.Th style={{ width: "100px", fontWeight: 700, fontSize: "12px", color: "#475569", textAlign: "right" }}>Thao tác</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredAdmins.map((admin) => (
              <Table.Tr key={admin.id}>
                <Table.Td>
                  <Group gap="sm">
                    <ThemeIcon size={36} radius={0} color="blue.1" style={{ color: "#1A3A5C" }}>
                      <IconShield size={18} />
                    </ThemeIcon>
                    <div>
                      <Text size="sm" fw={700} style={{ color: "#1A1A1A" }}>{admin.name}</Text>
                      <Text size="xs" c="dimmed">{admin.email}</Text>
                    </div>
                  </Group>
                </Table.Td>
                <Table.Td style={{ fontSize: "13px", color: "#64748B" }}>{admin.createdAt}</Table.Td>
                <Table.Td style={{ fontSize: "13px", color: "#64748B" }}>{admin.lastLogin}</Table.Td>
                <Table.Td style={{ textAlign: "right" }}>
                  <Group gap="xs" justify="flex-end">
                    <ActionIcon variant="subtle" color="gray" size="sm"><IconEdit size={16} /></ActionIcon>
                    <ActionIcon variant="subtle" color="red" size="sm" onClick={() => handleDeleteAdmin(admin.id)}>
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        {filteredAdmins.length === 0 && (
          <Box p="xl" style={{ textAlign: "center", color: "#9CA3AF" }}>
            <Text size="sm" fw={700}>Không tìm thấy tài khoản quản trị phù hợp</Text>
          </Box>
        )}
      </Card>

      {/* Add Admin Modal */}
      <Modal
        opened={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Thêm tài khoản Admin mới"
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
            label="Email quản trị (@fpt.edu.vn)"
            placeholder="admin@fpt.edu.vn"
            required
            radius={0}
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            leftSection={<IconMail size={16} />}
          />

          <PasswordInput
            label="Mật khẩu (Tối thiểu 6 ký tự)"
            placeholder="••••••••"
            required
            radius={0}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            leftSection={<IconLock size={16} />}
          />

          <TextInput
            label="Họ và tên"
            placeholder="Nhập tên hiển thị..."
            radius={0}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            leftSection={<IconUser size={16} />}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="outline" color="gray" radius={0} onClick={() => setShowAddModal(false)} fw={700}>
              Hủy bỏ
            </Button>
            <Button
              style={{ backgroundColor: "#F26F21" }}
              radius={0}
              onClick={handleAddAdmin}
              fw={700}
            >
              Lưu tài khoản
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}

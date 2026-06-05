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
  Alert,
  Textarea,
  ThemeIcon,
  SimpleGrid,
  Box,
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

const initialWhitelist = [
  "student1@fpt.edu.vn",
  "student2@fpt.edu.vn",
  "student3@fpt.edu.vn",
  "student4@fpt.edu.vn",
  "student5@fpt.edu.vn",
];

export default function WhitelistManagementPage() {
  const [whitelist, setWhitelist] = useState(initialWhitelist);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkEmailsText, setBulkEmailsText] = useState("");

  const filteredWhitelist = whitelist.filter((email) =>
    email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddEmail = () => {
    if (!newEmail.endsWith("@fpt.edu.vn")) {
      setErrorMsg("Email sinh viên bắt buộc phải có đuôi @fpt.edu.vn");
      return;
    }

    if (whitelist.includes(newEmail)) {
      setErrorMsg("Email này đã nằm trong danh sách whitelist.");
      return;
    }

    setWhitelist([...whitelist, newEmail]);
    setShowAddModal(false);
    setNewEmail("");
    setErrorMsg("");
  };

  const handleDeleteEmail = (email: string) => {
    if (confirm(`Bạn muốn xóa email ${email} khỏi danh sách whitelist?`)) {
      setWhitelist(whitelist.filter((e) => e !== email));
    }
  };

  const handleBulkUpload = () => {
    if (!bulkEmailsText.trim()) return;

    const emailList = bulkEmailsText
      .split("\n")
      .map((e) => e.trim())
      .filter((e) => e.endsWith("@fpt.edu.vn") && !whitelist.includes(e));

    if (emailList.length > 0) {
      setWhitelist([...whitelist, ...emailList]);
      alert(`Đã thêm thành công ${emailList.length} sinh viên vào Whitelist.`);
      setShowBulkModal(false);
      setBulkEmailsText("");
    } else {
      alert("Không tìm thấy email mới hợp lệ dạng @fpt.edu.vn.");
    }
  };

  const handleExport = () => {
    const dataStr = whitelist.join("\n");
    const dataBlob = new Blob([dataStr], { type: "text/plain" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "student-whitelist.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Stack gap="xl">
      {/* Header */}
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

      {/* Info Banner */}
      <Alert
        color="green"
        radius={0}
        title="Quy chế Whitelist Google Portal"
        icon={<IconAlertCircle size={20} />}
        styles={{ title: { fontWeight: 700 } }}
      >
        <Stack gap="xs" mt="xs">
          <Text size="sm">• Chỉ những tài khoản sinh viên có email khớp trong danh sách này mới có thể đăng nhập.</Text>
          <Text size="sm">• Whitelist có thể được nhập thủ công từng email hoặc upload hàng loạt (Bulk upload) bằng cách dán danh sách.</Text>
          <Text size="sm">• Sinh viên không thuộc Whitelist sẽ bị chặn truy cập và hiển thị thông báo lỗi.</Text>
        </Stack>
      </Alert>

      {/* Search Filter */}
      <Card p="md" radius={0} style={{ border: "1px solid #E2E8F0", backgroundColor: "white" }}>
        <TextInput
          placeholder="Tìm kiếm email sinh viên..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftSection={<IconSearch size={16} color="#9CA3AF" />}
          radius={0}
          style={{ maxWidth: "400px" }}
        />
      </Card>

      {/* Whitelist Grid / Table */}
      <Card p={0} radius={0} style={{ border: "1px solid #E2E8F0", backgroundColor: "white" }}>
        <Table layout="fixed" highlightOnHover striped>
          <Table.Thead style={{ backgroundColor: "#F8FAFC" }}>
            <Table.Tr>
              <Table.Th style={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>Email sinh viên</Table.Th>
              <Table.Th style={{ width: "220px", fontWeight: 700, fontSize: "12px", color: "#475569" }}>Quyền hạn</Table.Th>
              <Table.Th style={{ width: "80px", fontWeight: 700, fontSize: "12px", color: "#475569", textAlign: "right" }}>Xóa</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredWhitelist.map((email, index) => (
              <Table.Tr key={index}>
                <Table.Td style={{ fontSize: "13px", fontWeight: 700 }}>
                  <Group gap="xs">
                    <ThemeIcon size={28} color="green.0" style={{ color: "#16A34A" }}>
                      <IconUserCheck size={16} />
                    </ThemeIcon>
                    <Text span inherit>{email}</Text>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Badge color="green" radius={0} fw={700}>ĐÃ DUYỆT TRUY CẬP</Badge>
                </Table.Td>
                <Table.Td style={{ textAlign: "right" }}>
                  <ActionIcon variant="subtle" color="red" size="sm" onClick={() => handleDeleteEmail(email)}>
                    <IconTrash size={16} />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        {filteredWhitelist.length === 0 && (
          <Box p="xl" style={{ textAlign: "center", color: "#9CA3AF" }}>
            <Text size="sm" fw={700}>Không tìm thấy email nào phù hợp</Text>
          </Box>
        )}
      </Card>

      {/* Add Email Modal */}
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
            >
              Thêm vào Whitelist
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Bulk Upload Modal */}
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
            placeholder="student1@fpt.edu.vn&#10;student2@fpt.edu.vn&#10;student3@fpt.edu.vn"
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
            >
              Bắt đầu tải lên
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Bottom Counters Stats Grid */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        <Card p="lg" radius={0} style={{ border: "1px solid #E2E8F0", backgroundColor: "white" }}>
          <Group gap="md">
            <ThemeIcon size={40} radius={0} color="green.0" style={{ color: "#16A34A" }}>
              <IconUserCheck size={20} />
            </ThemeIcon>
            <div>
              <Text size="xs" fw={700} c="dimmed" style={{ textTransform: "uppercase" }}>Tổng Whitelist</Text>
              <Text fw={900} size="xl" style={{ color: "#1A1A1A" }}>{whitelist.length}</Text>
            </div>
          </Group>
        </Card>

        <Card p="lg" radius={0} style={{ border: "1px solid #E2E8F0", backgroundColor: "white" }}>
          <Group gap="md">
            <ThemeIcon size={40} radius={0} color="blue.0" style={{ color: "#1A3A5C" }}>
              <IconMail size={20} />
            </ThemeIcon>
            <div>
              <Text size="xs" fw={700} c="dimmed" style={{ textTransform: "uppercase" }}>Tài khoản đang mở</Text>
              <Text fw={900} size="xl" style={{ color: "#1A1A1A" }}>12</Text>
            </div>
          </Group>
        </Card>
      </SimpleGrid>
    </Stack>
  );
}

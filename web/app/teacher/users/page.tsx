"use client";

import React, { useState } from "react";
import {
  Title,
  Text,
  Button,
  Tabs,
  TextInput,
  Table,
  Group,
  Stack,
  Card,
  ThemeIcon,
  Badge,
  ActionIcon,
  Alert,
  Box,
  SimpleGrid,
} from "@mantine/core";
import {
  IconPlus,
  IconSearch,
  IconShield,
  IconUserCheck,
  IconMail,
  IconTrash,
  IconEdit,
  IconAlertCircle,
} from "@tabler/icons-react";

const mockAdmins = [
  {
    id: 1,
    email: "admin1@fpt.edu.vn",
    role: "Admin",
    createdAt: "2024-01-15",
    lastLogin: "2024-05-22",
  },
  {
    id: 2,
    email: "admin2@fpt.edu.vn",
    role: "Admin",
    createdAt: "2024-02-20",
    lastLogin: "2024-05-20",
  },
];

const mockWhitelist = [
  "student1@fpt.edu.vn",
  "student2@fpt.edu.vn",
  "student3@fpt.edu.vn",
  "student4@fpt.edu.vn",
  "student5@fpt.edu.vn",
];

export default function UserManagementPage() {
  const [activeTab, setActiveTab] = useState<string | null>("admins");
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <Stack gap="xl">
      {/* Header */}
      <Group justify="space-between" align="center">
        <div>
          <Title order={1} style={{ fontSize: "24px", fontWeight: 900, color: "#1A3A5C" }}>
            Quản lý Tài khoản
          </Title>
          <Text size="sm" c="dimmed">
            Quản trị viên và danh sách Whitelist sinh viên
          </Text>
        </div>
        <Button
          leftSection={<IconPlus size={16} />}
          style={{ backgroundColor: "#F26F21" }}
          radius={0}
          fw={700}
        >
          {activeTab === "admins" ? "Thêm Admin" : "Thêm vào Whitelist"}
        </Button>
      </Group>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={setActiveTab} radius={0} variant="outline" styles={{
        tab: {
          fontWeight: 700,
          fontSize: "13px",
          color: "#4B5563",
        }
      }}>
        <Tabs.List style={{ backgroundColor: "white", borderBottom: "1px solid #E2E8F0" }}>
          <Tabs.Tab value="admins" leftSection={<IconShield size={16} />}>Admins ({mockAdmins.length})</Tabs.Tab>
          <Tabs.Tab value="whitelist" leftSection={<IconUserCheck size={16} />}>Student Whitelist ({mockWhitelist.length})</Tabs.Tab>
        </Tabs.List>

        <Card p={0} radius={0} style={{ border: "1px solid #E2E8F0", borderTop: "none", backgroundColor: "white" }}>
          <Box p="md" style={{ borderBottom: "1px solid #E2E8F0" }}>
            <TextInput
              placeholder={`Tìm kiếm ${activeTab === "admins" ? "admins" : "email sinh viên"}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftSection={<IconSearch size={16} color="#9CA3AF" />}
              radius={0}
              style={{ maxWidth: "400px" }}
            />
          </Box>

          <Tabs.Panel value="admins">
            <Table layout="fixed" highlightOnHover striped>
              <Table.Thead style={{ backgroundColor: "#F8FAFC" }}>
                <Table.Tr>
                  <Table.Th style={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>Email</Table.Th>
                  <Table.Th style={{ width: "140px", fontWeight: 700, fontSize: "12px", color: "#475569" }}>Vai trò</Table.Th>
                  <Table.Th style={{ width: "160px", fontWeight: 700, fontSize: "12px", color: "#475569" }}>Ngày tạo</Table.Th>
                  <Table.Th style={{ width: "160px", fontWeight: 700, fontSize: "12px", color: "#475569" }}>Đăng nhập cuối</Table.Th>
                  <Table.Th style={{ width: "100px", fontWeight: 700, fontSize: "12px", color: "#475569", textAlign: "right" }}>Thao tác</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {mockAdmins.map((admin) => (
                  <Table.Tr key={admin.id}>
                    <Table.Td style={{ fontSize: "13px", fontWeight: 700 }}>
                      <Group gap="xs">
                        <IconMail size={16} color="#9CA3AF" />
                        <Text span inherit>{admin.email}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="outline" color="#1A3A5C" radius={0} fw={700}>
                        {admin.role}
                      </Badge>
                    </Table.Td>
                    <Table.Td style={{ fontSize: "13px", color: "#64748B" }}>{admin.createdAt}</Table.Td>
                    <Table.Td style={{ fontSize: "13px", color: "#64748B" }}>{admin.lastLogin}</Table.Td>
                    <Table.Td style={{ textAlign: "right" }}>
                      <Group gap="xs" justify="flex-end">
                        <ActionIcon variant="subtle" color="gray" size="sm"><IconEdit size={16} /></ActionIcon>
                        <ActionIcon variant="subtle" color="red" size="sm"><IconTrash size={16} /></ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Tabs.Panel>

          <Tabs.Panel value="whitelist">
            <Stack gap="md" p="md">
              <Alert color="yellow" radius={0} title="Lưu ý Whitelist" icon={<IconAlertCircle size={20} />} styles={{ title: { fontWeight: 700 } }}>
                Chỉ sinh viên có email trong danh sách này mới có thể đăng nhập Student Portal bằng tài khoản Google. Hãy đảm bảo dùng định dạng email @fpt.edu.vn.
              </Alert>

              <Table layout="fixed" highlightOnHover striped>
                <Table.Thead style={{ backgroundColor: "#F8FAFC" }}>
                  <Table.Tr>
                    <Table.Th style={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>Email sinh viên Whitelist</Table.Th>
                    <Table.Th style={{ width: "200px", fontWeight: 700, fontSize: "12px", color: "#475569" }}>Quyền truy cập</Table.Th>
                    <Table.Th style={{ width: "100px", fontWeight: 700, fontSize: "12px", color: "#475569", textAlign: "right" }}>Thao tác</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {mockWhitelist.map((email, i) => (
                    <Table.Tr key={i}>
                      <Table.Td style={{ fontSize: "13px", fontWeight: 700 }}>
                        <Group gap="xs">
                          <IconUserCheck size={18} color="#1A3A5C" />
                          <Text span inherit>{email}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge color="green" radius={0} fw={700}>ĐÃ CẤP QUYỀN</Badge>
                      </Table.Td>
                      <Table.Td style={{ textAlign: "right" }}>
                        <ActionIcon variant="subtle" color="red" size="sm"><IconTrash size={16} /></ActionIcon>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Stack>
          </Tabs.Panel>
        </Card>
      </Tabs>
    </Stack>
  );
}

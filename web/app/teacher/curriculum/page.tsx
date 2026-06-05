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
  Box,
} from "@mantine/core";
import {
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconAlertTriangle,
  IconSchool,
} from "@tabler/icons-react";

export default function CurriculumManagementPage() {
  const [activeTab, setActiveTab] = useState<string | null>("curriculum");
  const [search, setSearch] = useState("");

  return (
    <Stack gap="xl">
      {/* Header */}
      <Group justify="space-between" align="center">
        <div>
          <Title order={1} style={{ fontSize: "24px", fontWeight: 900, color: "#1A3A5C" }}>
            Chương trình đào tạo
          </Title>
          <Text size="sm" c="dimmed">
            Quản lý Ngành, Chuyên ngành hẹp và Khung chương trình (Curriculum)
          </Text>
        </div>
        <Button
          leftSection={<IconPlus size={16} />}
          style={{ backgroundColor: "#F26F21" }}
          radius={0}
          fw={700}
        >
          {activeTab === "major" ? "Thêm Ngành" : activeTab === "specialization" ? "Thêm CN Hẹp" : "Tạo Khung chương trình"}
        </Button>
      </Group>

      {/* Tabs Layout */}
      <Tabs value={activeTab} onChange={setActiveTab} radius={0} variant="outline" styles={{
        tab: {
          fontWeight: 700,
          fontSize: "13px",
          color: "#4B5563",
        }
      }}>
        <Tabs.List style={{ backgroundColor: "white", borderBottom: "1px solid #E2E8F0" }}>
          <Tabs.Tab value="curriculum">Khung Chương trình (Curriculum)</Tabs.Tab>
          <Tabs.Tab value="major">Ngành (Major)</Tabs.Tab>
          <Tabs.Tab value="specialization">Chuyên ngành hẹp (Specialization)</Tabs.Tab>
        </Tabs.List>

        <Card p={0} radius={0} style={{ border: "1px solid #E2E8F0", borderTop: "none", backgroundColor: "white" }}>
          <Box p="md" style={{ borderBottom: "1px solid #E2E8F0" }}>
            <TextInput
              placeholder="Tìm kiếm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftSection={<IconSearch size={16} color="#9CA3AF" />}
              radius={0}
              style={{ maxWidth: "400px" }}
            />
          </Box>

          <Tabs.Panel value="curriculum">
            <Table layout="fixed" highlightOnHover striped>
              <Table.Thead style={{ backgroundColor: "#F8FAFC" }}>
                <Table.Tr>
                  <Table.Th style={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>Mã chương trình</Table.Th>
                  <Table.Th style={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>Tên chương trình</Table.Th>
                  <Table.Th style={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>Ngành áp dụng</Table.Th>
                  <Table.Th style={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>Trạng thái cấu trúc</Table.Th>
                  <Table.Th style={{ width: "100px", fontWeight: 700, fontSize: "12px", color: "#475569", textAlign: "right" }}>Thao tác</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                <Table.Tr>
                  <Table.Td style={{ fontSize: "13px", fontWeight: 700, color: "#1A3A5C" }}>BIT_SE_NJS_19B</Table.Td>
                  <Table.Td style={{ fontSize: "13px" }}>Kỹ thuật phần mềm (NodeJS) K19B</Table.Td>
                  <Table.Td style={{ fontSize: "13px" }}>Software Engineering</Table.Td>
                  <Table.Td style={{ fontSize: "13px" }}>
                    <Badge color="green" radius={0} fw={700}>Đủ 44 chung + 4 đặc thù</Badge>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Group gap="xs" justify="flex-end">
                      <ActionIcon variant="subtle" color="gray" size="sm"><IconEdit size={16} /></ActionIcon>
                      <ActionIcon variant="subtle" color="red" size="sm"><IconTrash size={16} /></ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
                <Table.Tr style={{ backgroundColor: "#FEFCE8" }}>
                  <Table.Td style={{ fontSize: "13px", fontWeight: 700, color: "#1A3A5C" }}>BIT_SE_NET_20A</Table.Td>
                  <Table.Td style={{ fontSize: "13px" }}>Kỹ thuật phần mềm (.NET) K20A</Table.Td>
                  <Table.Td style={{ fontSize: "13px" }}>Software Engineering</Table.Td>
                  <Table.Td style={{ fontSize: "13px" }}>
                    <Badge color="yellow" radius={0} fw={700} leftSection={<IconAlertTriangle size={12} />}>
                      Thiếu 1 môn đặc thù
                    </Badge>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Group gap="xs" justify="flex-end">
                      <ActionIcon variant="subtle" color="gray" size="sm"><IconEdit size={16} /></ActionIcon>
                      <ActionIcon variant="subtle" color="red" size="sm"><IconTrash size={16} /></ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
          </Tabs.Panel>

          <Tabs.Panel value="major">
            <Table layout="fixed" highlightOnHover striped>
              <Table.Thead style={{ backgroundColor: "#F8FAFC" }}>
                <Table.Tr>
                  <Table.Th style={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>Mã Ngành</Table.Th>
                  <Table.Th style={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>Tên Ngành (Tiếng Anh)</Table.Th>
                  <Table.Th style={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>Tên Ngành (Tiếng Việt)</Table.Th>
                  <Table.Th style={{ width: "100px", fontWeight: 700, fontSize: "12px", color: "#475569", textAlign: "right" }}>Thao tác</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                <Table.Tr>
                  <Table.Td style={{ fontSize: "13px", fontWeight: 700, color: "#1A3A5C" }}>SE</Table.Td>
                  <Table.Td style={{ fontSize: "13px" }}>Software Engineering</Table.Td>
                  <Table.Td style={{ fontSize: "13px" }}>Kỹ thuật phần mềm</Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Group gap="xs" justify="flex-end">
                      <ActionIcon variant="subtle" color="gray" size="sm"><IconEdit size={16} /></ActionIcon>
                      <ActionIcon variant="subtle" color="red" size="sm"><IconTrash size={16} /></ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
          </Tabs.Panel>

          <Tabs.Panel value="specialization">
            <Table layout="fixed" highlightOnHover striped>
              <Table.Thead style={{ backgroundColor: "#F8FAFC" }}>
                <Table.Tr>
                  <Table.Th style={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>Mã CN Hẹp</Table.Th>
                  <Table.Th style={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>Tên Chuyên ngành</Table.Th>
                  <Table.Th style={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>Thuộc Ngành</Table.Th>
                  <Table.Th style={{ width: "100px", fontWeight: 700, fontSize: "12px", color: "#475569", textAlign: "right" }}>Thao tác</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                <Table.Tr>
                  <Table.Td style={{ fontSize: "13px", fontWeight: 700, color: "#1A3A5C" }}>NJS</Table.Td>
                  <Table.Td style={{ fontSize: "13px" }}>React & NodeJS</Table.Td>
                  <Table.Td style={{ fontSize: "13px" }}>Software Engineering</Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Group gap="xs" justify="flex-end">
                      <ActionIcon variant="subtle" color="gray" size="sm"><IconEdit size={16} /></ActionIcon>
                      <ActionIcon variant="subtle" color="red" size="sm"><IconTrash size={16} /></ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td style={{ fontSize: "13px", fontWeight: 700, color: "#1A3A5C" }}>NET</Table.Td>
                  <Table.Td style={{ fontSize: "13px" }}>.NET & React</Table.Td>
                  <Table.Td style={{ fontSize: "13px" }}>Software Engineering</Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Group gap="xs" justify="flex-end">
                      <ActionIcon variant="subtle" color="gray" size="sm"><IconEdit size={16} /></ActionIcon>
                      <ActionIcon variant="subtle" color="red" size="sm"><IconTrash size={16} /></ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
          </Tabs.Panel>
        </Card>
      </Tabs>
    </Stack>
  );
}

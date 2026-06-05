"use client";

import React, { useState } from "react";
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
  Box,
} from "@mantine/core";
import {
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconCircleCheck,
  IconClock,
  IconCircleX,
  IconLink,
} from "@tabler/icons-react";

const mockSyllabi = [
  {
    id: 12580,
    code: "FER202",
    subjectName: "Front-End web development with React",
    syllabusName: "FER202_Fall2025_v1.0",
    isActive: true,
    isApproved: true,
    decisionNo: "359/QĐ-ĐHFPT 04/09/2025",
  },
  {
    id: 12581,
    code: "SDN302",
    subjectName: "Server-Side development with NodeJS",
    syllabusName: "SDN302_Fall2025_v1.1",
    isActive: true,
    isApproved: true,
    decisionNo: "412/QĐ-ĐHFPT 10/09/2025",
  },
  {
    id: 9426,
    code: "FER201m",
    subjectName: "Front-End web development with React (Old)",
    syllabusName: "FER201m_Spring2024_v1",
    isActive: false,
    isApproved: true,
    decisionNo: "100/QĐ-ĐHFPT 01/01/2024",
  },
  {
    id: 12600,
    code: "PRN212",
    subjectName: "Basic Cross-Platform App Programming With .NET",
    syllabusName: "PRN212_Draft_v2",
    isActive: false,
    isApproved: false,
    decisionNo: "Pending",
  },
];

export default function SyllabusManagementPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredSyllabi = mockSyllabi.filter((syllabus) => {
    const matchesSearch =
      syllabus.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      syllabus.subjectName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && syllabus.isActive && syllabus.isApproved) ||
      (statusFilter === "draft" && !syllabus.isApproved) ||
      (statusFilter === "inactive" && !syllabus.isActive && syllabus.isApproved);

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (isActive: boolean, isApproved: boolean) => {
    if (isActive && isApproved) {
      return (
        <Badge
          color="green"
          radius={0}
          fw={700}
          leftSection={<IconCircleCheck size={12} />}
        >
          Đang sử dụng
        </Badge>
      );
    }
    if (!isApproved) {
      return (
        <Badge
          color="yellow"
          radius={0}
          fw={700}
          leftSection={<IconClock size={12} />}
        >
          Bản nháp
        </Badge>
      );
    }
    return (
      <Badge
        color="gray"
        radius={0}
        fw={700}
        leftSection={<IconCircleX size={12} />}
      >
        Đã ẩn
      </Badge>
    );
  };

  return (
    <Stack gap="xl">
      {/* Header */}
      <Group justify="space-between" align="center">
        <div>
          <Title order={1} style={{ fontSize: "24px", fontWeight: 900, color: "#1A3A5C" }}>
            Quản lý Syllabus
          </Title>
          <Text size="sm" c="dimmed">
            Tìm kiếm, phê duyệt và kích hoạt đề cương môn học
          </Text>
        </div>
        <Button
          component={Link}
          href="/teacher/syllabus/create"
          leftSection={<IconPlus size={16} />}
          style={{ backgroundColor: "#F26F21" }}
          radius={0}
          fw={700}
        >
          Tạo Syllabus
        </Button>
      </Group>

      {/* Filters Card */}
      <Card p="md" radius={0} style={{ border: "1px solid #E2E8F0", backgroundColor: "white" }}>
        <Group grow gap="md" align="center" style={{ width: "100%" }}>
          <TextInput
            placeholder="Tìm theo Subject Code hoặc tên môn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftSection={<IconSearch size={16} color="#9CA3AF" />}
            radius={0}
            style={{ flexGrow: 1 }}
          />

          <Group gap="xs" justify="flex-end">
            {[
              { id: "all", label: "Tất cả" },
              { id: "active", label: "Đang sử dụng" },
              { id: "draft", label: "Bản nháp" },
              { id: "inactive", label: "Đã ẩn" },
            ].map((tab) => (
              <Button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                variant={statusFilter === tab.id ? "filled" : "outline"}
                color={statusFilter === tab.id ? "#1A3A5C" : "gray"}
                radius={0}
                size="sm"
                fw={700}
                style={{
                  backgroundColor: statusFilter === tab.id ? "#1A3A5C" : "transparent",
                  color: statusFilter === tab.id ? "white" : "#4B5563",
                  borderColor: statusFilter === tab.id ? "#1A3A5C" : "#D1D5DB",
                }}
              >
                {tab.label}
              </Button>
            ))}
          </Group>
        </Group>
      </Card>

      {/* Table Card */}
      <Card p={0} radius={0} style={{ border: "1px solid #E2E8F0", backgroundColor: "white" }}>
        <Table layout="fixed" highlightOnHover striped>
          <Table.Thead style={{ backgroundColor: "#F8FAFC" }}>
            <Table.Tr>
              <Table.Th style={{ width: "90px", fontWeight: 700, fontSize: "12px", color: "#475569" }}>ID</Table.Th>
              <Table.Th style={{ width: "120px", fontWeight: 700, fontSize: "12px", color: "#475569" }}>Subject Code</Table.Th>
              <Table.Th style={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>Tên môn học</Table.Th>
              <Table.Th style={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>Syllabus Name</Table.Th>
              <Table.Th style={{ width: "150px", fontWeight: 700, fontSize: "12px", color: "#475569" }}>Trạng thái</Table.Th>
              <Table.Th style={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>Decision No</Table.Th>
              <Table.Th style={{ width: "100px", fontWeight: 700, fontSize: "12px", color: "#475569", textAlign: "right" }}>Thao tác</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredSyllabi.map((syllabus) => (
              <Table.Tr key={syllabus.id}>
                <Table.Td style={{ fontSize: "13px", color: "#64748B" }}>#{syllabus.id}</Table.Td>
                <Table.Td style={{ fontSize: "13px", fontWeight: 700, color: "#1A1A1A" }}>{syllabus.code}</Table.Td>
                <Table.Td style={{ fontSize: "13px", fw: 600 }}>{syllabus.subjectName}</Table.Td>
                <Table.Td style={{ fontSize: "13px" }}>
                  <Text
                    component={Link}
                    href={`/student/syllabus/${syllabus.code.toLowerCase()}`}
                    style={{
                      color: "#1A3A5C",
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      textDecoration: "underline",
                    }}
                  >
                    <IconLink size={14} />
                    {syllabus.syllabusName}
                  </Text>
                </Table.Td>
                <Table.Td>{getStatusBadge(syllabus.isActive, syllabus.isApproved)}</Table.Td>
                <Table.Td style={{ fontSize: "13px", color: "#475569" }}>{syllabus.decisionNo}</Table.Td>
                <Table.Td style={{ textAlign: "right" }}>
                  <Group gap="xs" justify="flex-end">
                    <ActionIcon variant="subtle" color="gray" size="sm" title="Chỉnh sửa">
                      <IconEdit size={16} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" color="red" size="sm" title="Xóa">
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        {filteredSyllabi.length === 0 && (
          <Box p="xl" style={{ textAlign: "center", color: "#9CA3AF" }}>
            <Text size="sm" fw={700}>Không tìm thấy kết quả phù hợp</Text>
          </Box>
        )}
      </Card>
    </Stack>
  );
}

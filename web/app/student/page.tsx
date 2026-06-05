"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Title,
  Text,
  TextInput,
  Button,
  Stack,
  Group,
  Card,
  Box,
  ThemeIcon,
  Table,
  Checkbox,
} from "@mantine/core";
import { IconSearch, IconAlertCircle } from "@tabler/icons-react";

// Mock database matches Figma wireframes
const ALL_SUBJECTS = [
  {
    code: "FER202",
    name: "Front-End web development with React",
    credits: 3,
    decision: "359/QĐ-ĐHFPT dated 04/09/2025",
    isActive: true,
    isApproved: true,
    syllabusId: "12580",
    syllabusName: "Front-End web development with React_Phát triển web Front-End với React"
  },
  {
    code: "PRN232",
    name: "Building Cross-Platform Back-End Application With .NET",
    credits: 3,
    decision: "202/QĐ-ĐHFPT dated 10/12/2025",
    isActive: false,
    isApproved: false,
    syllabusId: "12581",
    syllabusName: "Building Cross-Platform Back-End Application With .NET_Xây dựng ứng dụng Back-End với .NET"
  },
  {
    code: "SDN302",
    name: "Server-Side development with NodeJS",
    credits: 3,
    decision: "412/QĐ-ĐHFPT dated 15/06/2025",
    isActive: true,
    isApproved: true,
    syllabusId: "12582",
    syllabusName: "Server-Side development with NodeJS_Phát triển phía Server với NodeJS"
  },
  {
    code: "PRN212",
    name: "Basic Cross-Platform App Programming With .NET",
    credits: 3,
    decision: "321/QĐ-ĐHFPT dated 12/03/2025",
    isActive: true,
    isApproved: true,
    syllabusId: "12583",
    syllabusName: "Basic Cross-Platform App Programming With .NET_Lập trình ứng dụng đa nền tảng cơ bản với .NET"
  },
  {
    code: "SWE201c",
    name: "Introduction to Software Engineering",
    credits: 3,
    decision: "155/QĐ-ĐHFPT dated 22/01/2025",
    isActive: true,
    isApproved: true,
    syllabusId: "12584",
    syllabusName: "Introduction to Software Engineering_Nhập môn Kỹ nghệ phần mềm"
  },
  {
    code: "SWD392",
    name: "Software Architecture and Design",
    credits: 3,
    decision: "201/QĐ-ĐHFPT dated 18/02/2025",
    isActive: true,
    isApproved: true,
    syllabusId: "12585",
    syllabusName: "Software Architecture and Design_Thiết kế và Kiến trúc phần mềm"
  },
  {
    code: "FER201m",
    name: "Front-End web development with React (Old)",
    credits: 3,
    decision: "100/QĐ-ĐHFPT dated 10/10/2024",
    isActive: false,
    isApproved: true,
    syllabusId: "12586",
    syllabusName: "Front-End web development with React (Old)_Phát triển web Front-End với React (Cũ)"
  },
];

export default function StudentDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<typeof ALL_SUBJECTS>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = () => {
    if (searchTerm.trim().length >= 2) {
      setHasSearched(true);
      const filtered = ALL_SUBJECTS.filter(
        (s) =>
          s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setResults(filtered);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <Stack gap="xl">
      <div>
        <Title order={1} style={{ fontSize: "24px", fontWeight: 900, color: "#1A3A5C", textTransform: "uppercase" }}>
          Tìm kiếm môn học
        </Title>
        <Text size="sm" c="dimmed">
          Tra cứu đề cương chi tiết (Syllabus) và hỏi đáp trợ lý học tập AI theo từng môn cụ thể.
        </Text>
      </div>

      <Group gap="xs" align="flex-end">
        <TextInput
          placeholder="Nhập mã môn hoặc tên môn (VD: FER202, .NET)..."
          size="lg"
          radius={0}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          leftSection={<IconSearch size={18} color="#9CA3AF" />}
          style={{ flexGrow: 1 }}
        />
        <Button
          size="lg"
          radius={0}
          style={{ backgroundColor: "#1A3A5C" }}
          onClick={handleSearch}
          fw={700}
        >
          TÌM KIẾM
        </Button>
      </Group>

      {hasSearched && (
        <Stack gap="md">
          <Text size="xs" fw={700} c="dimmed" style={{ letterSpacing: "1px", textTransform: "uppercase" }}>
            Kết quả tìm kiếm ({results.length})
          </Text>

          {results.length === 0 ? (
            <Card
              p="xl"
              radius={0}
              style={{
                border: "1px dashed #CBD5E1",
                backgroundColor: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
              }}
            >
              <Stack align="center" gap="xs">
                <ThemeIcon size={48} radius="xl" color="gray.1">
                  <IconAlertCircle size={24} color="#64748B" />
                </ThemeIcon>
                <Text size="sm" fw={700} style={{ color: "#64748B" }}>
                  Không tìm thấy môn học tương ứng.
                </Text>
                <Text size="xs" c="dimmed">
                  Vui lòng kiểm tra lại từ khóa tìm kiếm (Nhập tối thiểu 2 ký tự).
                </Text>
              </Stack>
            </Card>
          ) : (
            <Box style={{ overflowX: "auto" }}>
              <Table striped withTableBorder withColumnBorders style={{ backgroundColor: "white", minWidth: "1000px" }} fz="sm">
                <Table.Thead style={{ backgroundColor: "#F37021" }}>
                  <Table.Tr>
                    <Table.Th style={{ color: "white", fontWeight: "bold", width: "10%" }}>Syllabus ID</Table.Th>
                    <Table.Th style={{ color: "white", fontWeight: "bold", width: "10%" }}>Subject Code</Table.Th>
                    <Table.Th style={{ color: "white", fontWeight: "bold", width: "25%" }}>Subject Name</Table.Th>
                    <Table.Th style={{ color: "white", fontWeight: "bold", width: "25%" }}>Syllabus Name</Table.Th>
                    <Table.Th style={{ color: "white", fontWeight: "bold", textAlign: "center", width: "8%" }}>IsActive</Table.Th>
                    <Table.Th style={{ color: "white", fontWeight: "bold", textAlign: "center", width: "8%" }}>IsApproved</Table.Th>
                    <Table.Th style={{ color: "white", fontWeight: "bold", width: "14%" }}>DecisionNo MM/dd/yyyy</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {results.map((subject) => (
                    <Table.Tr key={subject.code}>
                      <Table.Td>{subject.syllabusId}</Table.Td>
                      <Table.Td>{subject.code}</Table.Td>
                      <Table.Td>{subject.name}</Table.Td>
                      <Table.Td style={{ wordBreak: "break-word" }}>
                        <Link
                          href={`/student/syllabus/${subject.code.toLowerCase()}`}
                          style={{ color: "#1A3A5C", textDecoration: "underline" }}
                        >
                          {subject.syllabusName}
                        </Link>
                      </Table.Td>
                      <Table.Td style={{ textAlign: "center" }}>
                        <Box style={{ display: "flex", justifyContent: "center" }}>
                          <Checkbox checked={subject.isActive} readOnly color="fptGreen" size="xs" />
                        </Box>
                      </Table.Td>
                      <Table.Td style={{ textAlign: "center" }}>
                        <Box style={{ display: "flex", justifyContent: "center" }}>
                          <Checkbox checked={subject.isApproved} readOnly color="fptGreen" size="xs" />
                        </Box>
                      </Table.Td>
                      <Table.Td>{subject.decision}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Box>
          )}
        </Stack>
      )}
    </Stack>
  );
}

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
  Select,
  Modal,
  Alert,
  SegmentedControl,
  Box,
  ThemeIcon,
} from "@mantine/core";
import { Dropzone, FileWithPath } from "@mantine/dropzone";
import {
  IconUpload,
  IconSearch,
  IconFileText,
  IconPhoto,
  IconVideo,
  IconTrash,
  IconCircleCheck,
  IconClock,
  IconAlertCircle,
  IconLink,
  IconFileCode,
} from "@tabler/icons-react";

const mockDocuments = [
  {
    id: 1,
    name: "FER202_Lecture01.pdf",
    subjectCode: "FER202",
    type: "pdf",
    size: "2.4 MB",
    status: "indexed",
    uploadedAt: "2026-05-20",
  },
  {
    id: 2,
    name: "FER202_Lab01.docx",
    subjectCode: "FER202",
    type: "docx",
    size: "156 KB",
    status: "indexed",
    uploadedAt: "2026-05-20",
  },
  {
    id: 3,
    name: "SDN302_Overview.pptx",
    subjectCode: "SDN302",
    type: "pptx",
    size: "5.2 MB",
    status: "processing",
    uploadedAt: "2026-05-23",
  },
  {
    id: 4,
    name: "SDN302_Diagram.png",
    subjectCode: "SDN302",
    type: "image",
    size: "892 KB",
    status: "failed",
    uploadedAt: "2026-05-23",
  },
];

export default function DocumentManagementPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadType, setUploadType] = useState<string>("file");
  const [files, setFiles] = useState<FileWithPath[]>([]);

  const subjects = Array.from(new Set(mockDocuments.map((doc) => doc.subjectCode)));

  const filteredDocs = mockDocuments.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === "all" || doc.subjectCode === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <IconFileText size={20} color="#DC2626" />;
      case "docx":
        return <IconFileText size={20} color="#2563EB" />;
      case "pptx":
        return <IconFileText size={20} color="#D97706" />;
      case "image":
        return <IconPhoto size={20} color="#16A34A" />;
      case "video":
        return <IconVideo size={20} color="#0D9488" />;
      default:
        return <IconFileText size={20} color="#64748B" />;
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "indexed") {
      return (
        <Badge variant="light" color="green" radius={0} fw={700} leftSection={<IconCircleCheck size={12} />}>
          Đã index RAG
        </Badge>
      );
    }
    if (status === "processing") {
      return (
        <Badge variant="light" color="yellow" radius={0} fw={700} leftSection={<IconClock size={12} />}>
          Đang xử lý
        </Badge>
      );
    }
    return (
      <Badge variant="light" color="red" radius={0} fw={700} leftSection={<IconAlertCircle size={12} />}>
        Thất bại
      </Badge>
    );
  };

  return (
    <Stack gap="xl">
      {/* Header */}
      <Group justify="space-between" align="center">
        <div>
          <Title order={1} style={{ fontSize: "24px", fontWeight: 900, color: "#1A3A5C" }}>
            Quản lý Tài liệu
          </Title>
          <Text size="sm" c="dimmed">
            Tải lên slide bài giảng, giáo trình PDF để chunking & embedding vào Qdrant cho Chatbot RAG.
          </Text>
        </div>
        <Button
          leftSection={<IconUpload size={16} />}
          style={{ backgroundColor: "#F26F21" }}
          radius={0}
          fw={700}
          onClick={() => setIsUploadModalOpen(true)}
        >
          Upload file mới
        </Button>
      </Group>

      {/* Guidelines */}
      <Alert
        color="blue"
        radius={0}
        title="Quy định và Hướng dẫn Upload"
        icon={<IconAlertCircle size={20} />}
        styles={{ title: { fontWeight: 700 } }}
      >
        <Stack gap="xs" mt="xs">
          <Text size="sm">• Định dạng hỗ trợ: <b>PDF, DOCX, PPTX (slide bài giảng), Hình ảnh (PNG, JPG)</b>. Với tài liệu video, vui lòng dán URL phụ đề.</Text>
          <Text size="sm">• Giới hạn dung lượng: <b>Tối đa 50MB</b> mỗi file. Số lượng tối đa: <b>10 tài liệu</b> mỗi môn học.</Text>
          <Text size="sm">• Tiến trình: Sau khi tải lên, hệ thống sẽ tự động phân mảnh văn bản (chunking) và nhúng vector ngữ nghĩa (Gemini Embedding) vào Qdrant DB.</Text>
        </Stack>
      </Alert>

      {/* Filters Card */}
      <Card p="md" radius={0} style={{ border: "1px solid #E2E8F0", backgroundColor: "white" }}>
        <Group grow gap="md" align="center">
          <TextInput
            placeholder="Tìm kiếm theo tên tài liệu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftSection={<IconSearch size={16} color="#9CA3AF" />}
            radius={0}
            style={{ flexGrow: 1 }}
          />

          <Select
            placeholder="Tất cả môn học"
            data={[{ value: "all", label: "Tất cả môn học" }, ...subjects.map((sub) => ({ value: sub, label: sub }))]}
            value={selectedSubject}
            onChange={(val) => setSelectedSubject(val || "all")}
            radius={0}
            style={{ maxWidth: "200px" }}
          />
        </Group>
      </Card>

      {/* Document Table Card */}
      <Card p={0} radius={0} style={{ border: "1px solid #E2E8F0", backgroundColor: "white" }}>
        <Table layout="fixed" highlightOnHover striped>
          <Table.Thead style={{ backgroundColor: "#F8FAFC" }}>
            <Table.Tr>
              <Table.Th style={{ width: "60px", fontWeight: 700, fontSize: "12px", color: "#475569", textAlign: "center" }}>Loại</Table.Th>
              <Table.Th style={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>Tên tài liệu</Table.Th>
              <Table.Th style={{ width: "120px", fontWeight: 700, fontSize: "12px", color: "#475569" }}>Môn học</Table.Th>
              <Table.Th style={{ width: "120px", fontWeight: 700, fontSize: "12px", color: "#475569" }}>Dung lượng</Table.Th>
              <Table.Th style={{ width: "140px", fontWeight: 700, fontSize: "12px", color: "#475569" }}>Ngày tải lên</Table.Th>
              <Table.Th style={{ width: "160px", fontWeight: 700, fontSize: "12px", color: "#475569" }}>Trạng thái RAG</Table.Th>
              <Table.Th style={{ width: "80px", fontWeight: 700, fontSize: "12px", color: "#475569", textAlign: "right" }}>Xóa</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredDocs.map((doc) => (
              <Table.Tr key={doc.id}>
                <Table.Td style={{ textAlign: "center" }}>{getFileIcon(doc.type)}</Table.Td>
                <Table.Td style={{ fontSize: "13px", fontWeight: 700 }}>{doc.name}</Table.Td>
                <Table.Td style={{ fontSize: "13px", fontWeight: 700, color: "#1A3A5C" }}>{doc.subjectCode}</Table.Td>
                <Table.Td style={{ fontSize: "13px", color: "#64748B" }}>{doc.size}</Table.Td>
                <Table.Td style={{ fontSize: "13px", color: "#64748B" }}>{doc.uploadedAt}</Table.Td>
                <Table.Td>{getStatusBadge(doc.status)}</Table.Td>
                <Table.Td style={{ textAlign: "right" }}>
                  <ActionIcon variant="subtle" color="red" size="sm">
                    <IconTrash size={16} />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        {filteredDocs.length === 0 && (
          <Box p="xl" style={{ textAlign: "center", color: "#9CA3AF" }}>
            <Text size="sm" fw={700}>Không tìm thấy tài liệu phù hợp</Text>
          </Box>
        )}
      </Card>

      {/* Upload Dialog Modal */}
      <Modal
        opened={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Thêm tài liệu môn học mới"
        centered
        radius={0}
        styles={{
          title: { fontWeight: 900, color: "#1A3A5C", textTransform: "uppercase", fontSize: "16px" },
          header: { borderBottom: "1px solid #E2E8F0" },
        }}
      >
        <Stack gap="md" py="md">
          <Select
            label="Môn học áp dụng"
            placeholder="Chọn môn học..."
            data={["FER202", "SDN302", "PRN232"]}
            required
            radius={0}
          />

          <SegmentedControl
            value={uploadType}
            onChange={setUploadType}
            data={[
              { label: "Tập tin (Files)", value: "file" },
              { label: "Đường dẫn (URL Video)", value: "url" },
            ]}
            radius={0}
            styles={{
              root: { backgroundColor: "#F1F5F9" },
              indicator: { backgroundColor: "#1A3A5C" },
              control: { fontWeight: 700 },
            }}
          />

          {uploadType === "file" ? (
            <Dropzone
              onDrop={(acceptedFiles) => setFiles(acceptedFiles)}
              maxSize={50 * 1024 ** 2}
              radius={0}
              styles={{
                root: { border: "2px dashed #CBD5E1", backgroundColor: "#F8FAFC", cursor: "pointer" },
              }}
            >
              <Stack align="center" gap="xs" py="md" style={{ textAlign: "center" }}>
                <ThemeIcon size={48} radius="xl" color="blue.0" style={{ color: "#1A3A5C" }}>
                  <IconUpload size={24} />
                </ThemeIcon>
                <Text size="sm" fw={700}>Kéo thả file vào đây, hoặc click để chọn file</Text>
                <Text size="xs" c="dimmed">
                  Hỗ trợ: PDF, DOCX, PPTX, PNG, JPG (Tối đa 50MB)
                </Text>
              </Stack>
            </Dropzone>
          ) : (
            <TextInput
              label="Đường dẫn bài giảng video (YouTube, Google Drive)"
              placeholder="https://www.youtube.com/watch?v=..."
              radius={0}
              required
              leftSection={<IconLink size={16} />}
            />
          )}

          {files.length > 0 && (
            <Card p="xs" radius={0} withBorder>
              <Text fw={700} size="xs" mb={4}>Tập tin đã chọn:</Text>
              {files.map((f, i) => (
                <Group key={i} justify="space-between">
                  <Text size="xs" truncate style={{ maxWidth: "260px" }}>{f.name}</Text>
                  <Text size="xs" c="dimmed">{(f.size / 1024 / 1024).toFixed(2)} MB</Text>
                </Group>
              ))}
            </Card>
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="outline" color="gray" radius={0} onClick={() => setIsUploadModalOpen(false)} fw={700}>
              Hủy bỏ
            </Button>
            <Button
              style={{ backgroundColor: "#F26F21" }}
              radius={0}
              onClick={() => {
                alert("Tiến trình Chunking & Embedding đã bắt đầu ở background...");
                setIsUploadModalOpen(false);
                setFiles([]);
              }}
              fw={700}
            >
              Bắt đầu index
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}

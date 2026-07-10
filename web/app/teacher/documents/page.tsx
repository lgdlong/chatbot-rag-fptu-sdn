"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  Box,
  ThemeIcon,
  Loader,
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
import * as api from "@/lib/api";
import type { ApiSyllabusSummary, ApiDocument } from "@/lib/api";

export default function DocumentManagementPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSyllabusId, setSelectedSyllabusId] = useState<number | null>(null);
  const [syllabi, setSyllabi] = useState<ApiSyllabusSummary[]>([]);
  const [documents, setDocuments] = useState<ApiDocument[]>([]);
  const [isLoadingSyllabi, setIsLoadingSyllabi] = useState(true);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [files, setFiles] = useState<FileWithPath[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const loadSyllabi = useCallback(async () => {
    setIsLoadingSyllabi(true);
    setApiError(null);
    try {
      const { syllabuses } = await api.searchSyllabus();
      setSyllabi(syllabuses);
      setSelectedSyllabusId(syllabuses[0]?.id ?? null);
    } catch (err) {
      console.error("Failed to load syllabi:", err);
      setApiError("Không thể tải danh sách syllabus từ server.");
    } finally {
      setIsLoadingSyllabi(false);
    }
  }, []);

  const loadDocuments = useCallback(
    async (syllabusId: number) => {
      setIsLoadingDocs(true);
      setApiError(null);
      try {
        const { documents } = await api.getSyllabusDocuments(syllabusId);
        setDocuments(documents);
      } catch (err) {
        console.error("Failed to load documents:", err);
        setApiError("Không thể tải danh sách tài liệu.");
        setDocuments([]);
      } finally {
        setIsLoadingDocs(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadSyllabi();
  }, [loadSyllabi]);

  useEffect(() => {
    if (selectedSyllabusId !== null) {
      void loadDocuments(selectedSyllabusId);
    } else {
      setDocuments([]);
    }
  }, [selectedSyllabusId, loadDocuments]);

  const selectedSyllabus = useMemo(
    () => syllabi.find((s) => s.id === selectedSyllabusId) ?? null,
    [syllabi, selectedSyllabusId]
  );

  const handleUpload = async () => {
    if (!selectedSyllabusId) {
      setUploadError("Vui lòng chọn syllabus trước khi tải lên tài liệu.");
      return;
    }

    if (files.length === 0) {
      setUploadError("Vui lòng chọn file PDF để tải lên.");
      return;
    }

    const file = files[0];
    if (file.size > 50 * 1024 ** 2) {
      setUploadError("File vượt quá giới hạn 50MB.");
      return;
    }

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setUploadError("Hiện tại chỉ hỗ trợ upload file PDF.");
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    try {
      await api.uploadSyllabusDocument(selectedSyllabusId, file);
      setFiles([]);
      setIsUploadModalOpen(false);
      void loadDocuments(selectedSyllabusId);
    } catch (err: unknown) {
      console.error("Upload failed:", err);
      const message = err instanceof Error ? err.message : "Lỗi khi upload tài liệu.";
      setUploadError(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!selectedSyllabusId) return;
    setApiError(null);

    try {
      await api.deleteSyllabusDocument(selectedSyllabusId, documentId);
      void loadDocuments(selectedSyllabusId);
    } catch (err) {
      console.error("Delete failed:", err);
      setApiError("Không thể xóa tài liệu.");
    }
  };

  const subjectOptions = useMemo(
    () =>
      syllabi.map((syllabus) => ({
        value: String(syllabus.id),
        label: `${syllabus.course.code} - ${syllabus.course.name}`,
      })),
    [syllabi]
  );

  const filteredDocs = useMemo(() => {
    const searchLower = searchTerm.trim().toLowerCase();
    return documents.filter((doc) =>
      searchLower === "" || doc.name.toLowerCase().includes(searchLower)
    );
  }, [searchTerm, documents]);

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
        return <IconFileCode size={20} color="#64748B" />;
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "COMPLETED" || status === "completed" || status === "indexed") {
      return (
        <Badge variant="light" color="green" radius={0} fw={700} leftSection={<IconCircleCheck size={12} />}>
          Đã index RAG
        </Badge>
      );
    }
    if (status === "PROCESSING" || status === "processing") {
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

  const documentCountLabel = selectedSyllabus ? `${filteredDocs.length} tài liệu` : "Chọn syllabus để xem tài liệu";

  return (
    <Stack gap="xl">
      {/* Header */}
      <Group justify="space-between" align="center">
        <div>
          <Title order={1} style={{ fontSize: "24px", fontWeight: 900, color: "#1A3A5C" }}>
            Quản lý Tài liệu
          </Title>
          <Text size="sm" c="dimmed">
            Tải lên slide bài giảng PDF để chunking & embedding vào Qdrant cho Chatbot RAG.
          </Text>
        </div>
        <Button
          leftSection={<IconUpload size={16} />}
          style={{ backgroundColor: "#F26F21" }}
          radius={0}
          fw={700}
          onClick={() => setIsUploadModalOpen(true)}
          disabled={!selectedSyllabusId}
        >
          Upload file mới
        </Button>
      </Group>

      {apiError && (
        <Alert title="Lỗi API" color="red" radius={0}>
          {apiError}
        </Alert>
      )}

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
            label="Chọn syllabus"
            placeholder={isLoadingSyllabi ? "Đang tải syllabus..." : "Chọn syllabus..."}
            data={subjectOptions}
            value={selectedSyllabusId ? String(selectedSyllabusId) : null}
            onChange={(value) => setSelectedSyllabusId(value ? Number(value) : null)}
            radius={0}
            style={{ maxWidth: "300px" }}
            disabled={isLoadingSyllabi}
          />
        </Group>
      </Card>

      <Card p={0} radius={0} style={{ border: "1px solid #E2E8F0", backgroundColor: "white" }}>
        <Group position="apart" align="center" style={{ padding: "20px" }}>
          <Text size="sm" color="dimmed">
            {documentCountLabel}
          </Text>
          {selectedSyllabus && (
            <Text size="sm" color="dimmed">
              {selectedSyllabus.course.code} • {selectedSyllabus.syllabusName}
            </Text>
          )}
        </Group>

        {isLoadingDocs ? (
          <Box p="xl" style={{ textAlign: "center" }}>
            <Loader />
          </Box>
        ) : (
          <Table layout="fixed" highlightOnHover striped>
            <Table.Thead style={{ backgroundColor: "#F8FAFC" }}>
              <Table.Tr>
                <Table.Th style={{ width: "60px", fontWeight: 700, fontSize: "12px", color: "#475569", textAlign: "center" }}>Loại</Table.Th>
                <Table.Th style={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>Tên tài liệu</Table.Th>
                <Table.Th style={{ width: "140px", fontWeight: 700, fontSize: "12px", color: "#475569" }}>Trạng thái</Table.Th>
                <Table.Th style={{ width: "120px", fontWeight: 700, fontSize: "12px", color: "#475569" }}>Ngày tải lên</Table.Th>
                <Table.Th style={{ width: "80px", fontWeight: 700, fontSize: "12px", color: "#475569", textAlign: "right" }}>Xóa</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredDocs.map((doc) => (
                <Table.Tr key={doc.id}>
                  <Table.Td style={{ textAlign: "center" }}>{getFileIcon(doc.fileType || doc.name.split(".").pop() || "pdf")}</Table.Td>
                  <Table.Td style={{ fontSize: "13px", fontWeight: 700 }}>{doc.name}</Table.Td>
                  <Table.Td>{getStatusBadge(doc.status)}</Table.Td>
                  <Table.Td style={{ fontSize: "13px", color: "#64748B" }}>{new Date(doc.createdAt).toLocaleDateString()}</Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <ActionIcon variant="subtle" color="red" size="sm" onClick={() => void handleDelete(String(doc.id))}>
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}

        {!selectedSyllabusId && !isLoadingSyllabi && (
          <Box p="xl" style={{ textAlign: "center", color: "#9CA3AF" }}>
            <Text size="sm" fw={700}>Vui lòng chọn syllabus để xem tài liệu</Text>
          </Box>
        )}

        {selectedSyllabusId && filteredDocs.length === 0 && !isLoadingDocs && (
          <Box p="xl" style={{ textAlign: "center", color: "#9CA3AF" }}>
            <Text size="sm" fw={700}>Không tìm thấy tài liệu phù hợp</Text>
          </Box>
        )}
      </Card>

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
          <Text size="sm" color="dimmed">
            Upload PDF cho syllabus: <strong>{selectedSyllabus?.course.code ?? "-"}</strong>
          </Text>

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
              <Text size="xs" c="dimmed">Hỗ trợ: PDF (Tối đa 50MB)</Text>
            </Stack>
          </Dropzone>

          {uploadError && (
            <Alert color="red" radius={0}>
              {uploadError}
            </Alert>
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
              onClick={handleUpload}
              disabled={files.length === 0 || isUploading || !selectedSyllabusId}
              fw={700}
            >
              {isUploading ? "Đang upload..." : "Bắt đầu upload"}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}

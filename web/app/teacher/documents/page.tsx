"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Pagination,
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
  IconX,
} from "@tabler/icons-react";
import * as api from "@/lib/api";
import type { ApiSyllabusSummary, ApiDocument } from "@/lib/api";

type FileUploadStatus = "pending" | "uploading" | "success" | "error";

interface FileStatus {
  file: FileWithPath;
  status: FileUploadStatus;
  error?: string;
}

const PAGE_SIZE = 20;

export default function DocumentManagementPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSyllabusId, setSelectedSyllabusId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [fileStatuses, setFileStatuses] = useState<FileStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSummary, setUploadSummary] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const syllabiQuery = useQuery({
    queryKey: ["syllabuses"],
    queryFn: () => api.searchSyllabus(),
    select: (data) => data.syllabuses,
  });

  const documentsQuery = useQuery({
    queryKey: ["all-documents", page],
    queryFn: () => api.getAllDocuments(page, PAGE_SIZE),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ syllabusId, documentId }: { syllabusId: number; documentId: string }) =>
      api.deleteSyllabusDocument(syllabusId, documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-documents"] });
    },
  });

  const apiError = syllabiQuery.error || documentsQuery.error || deleteMutation.error
    ? (syllabiQuery.error instanceof Error ? syllabiQuery.error.message :
       documentsQuery.error instanceof Error ? documentsQuery.error.message :
       deleteMutation.error instanceof Error ? deleteMutation.error.message :
       "Không thể thực hiện thao tác.")
    : null;

  const handleFilesDrop = (acceptedFiles: FileWithPath[]) => {
    const newStatuses: FileStatus[] = acceptedFiles.map((file) => ({
      file,
      status: "pending" as FileUploadStatus,
    }));
    setFileStatuses((prev) => [...prev, ...newStatuses]);
    setUploadError(null);
    setUploadSummary(null);
  };

  const handleRemoveFile = (index: number) => {
    setFileStatuses((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!selectedSyllabusId) {
      setUploadError("Vui lòng chọn syllabus trước khi tải lên tài liệu.");
      return;
    }

    const pendingFiles = fileStatuses.filter((fs) => fs.status === "pending");
    if (pendingFiles.length === 0) {
      setUploadError("Vui lòng chọn file để tải lên.");
      return;
    }

    for (const fs of pendingFiles) {
      if (fs.file.size > 50 * 1024 ** 2) {
        setUploadError(`File "${fs.file.name}" vượt quá giới hạn 50MB.`);
        return;
      }
      const allowedExts = ["pdf", "docx", "pptx", "txt", "md"];
      const ext = fs.file.name.split(".").pop()?.toLowerCase() || "";
      if (!allowedExts.includes(ext)) {
        setUploadError(`File "${fs.file.name}" không được hỗ trợ. Các định dạng cho phép: PDF, DOCX, PPTX, TXT, Markdown.`);
        return false;
      }
      // Reject filenames with special characters (& % # + = @ $ ; etc.)
      if (!/^[\w\s.\-]+$/i.test(fs.file.name.replace(/\.[^.]+$/, ""))) {
        setUploadError(`Tên file "${fs.file.name}" chứa ký tự đặc biệt không hợp lệ. Chỉ chấp nhận chữ cái, số, dấu cách, dấu gạch ngang và gạch dưới.`);
        return false;
      }
    }

    setUploadError(null);
    setUploadSummary(null);
    setIsUploading(true);

    let successCount = 0;
    const totalCount = pendingFiles.length;

    for (const fs of pendingFiles) {
      const fileIndex = fileStatuses.indexOf(fs);

      setFileStatuses((prev) =>
        prev.map((item, i) => (i === fileIndex ? { ...item, status: "uploading" as FileUploadStatus } : item))
      );

      try {
        await api.uploadSyllabusDocument(selectedSyllabusId, fs.file);
        successCount++;
        setFileStatuses((prev) =>
          prev.map((item, i) => (i === fileIndex ? { ...item, status: "success" as FileUploadStatus } : item))
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Lỗi không xác định.";
        // Giới hạn 10 tài liệu → reset file về pending, dừng chuỗi, ko hiện summary
        if (message.toLowerCase().includes("giới hạn") || message.toLowerCase().includes("tối đa 10")) {
          setFileStatuses((prev) =>
            prev.map((item, i) =>
              i === fileIndex ? { ...item, status: "pending" as FileUploadStatus } : item
            )
          );
          setUploadError(message);
          setIsUploading(false);
          return;
        }
        setFileStatuses((prev) =>
          prev.map((item, i) =>
            i === fileIndex ? { ...item, status: "error" as FileUploadStatus, error: message } : item
          )
        );
      }
    }

    queryClient.invalidateQueries({ queryKey: ["all-documents"] });
    setUploadSummary(`Đã tải lên ${successCount}/${totalCount} file thành công.`);
    setIsUploading(false);

    if (successCount === totalCount) {
      setTimeout(() => {
        setFileStatuses([]);
        setIsUploadModalOpen(false);
        setUploadSummary(null);
      }, 1500);
    }
  };

  const handleDelete = async (documentId: string) => {
    setUploadError(null);
    const doc = allDocs.find((d) => d.id === documentId);
    if (!doc) return;

    try {
      await deleteMutation.mutateAsync({ syllabusId: doc.syllabus!.id, documentId });
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const subjectOptions = useMemo(
    () =>
      (syllabiQuery.data ?? []).map((syllabus) => ({
        value: String(syllabus.id),
        label: `${syllabus.course.code} - ${syllabus.course.name}`,
      })),
    [syllabiQuery.data]
  );

  const allDocs = documentsQuery.data?.documents ?? [];

  const filteredDocs = useMemo(() => {
    const searchLower = searchTerm.trim().toLowerCase();
    return allDocs.filter((doc) =>
      searchLower === "" || doc.name.toLowerCase().includes(searchLower)
    );
  }, [searchTerm, allDocs]);

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <IconFileText size={20} color="#DC2626" />;
      case "docx":
        return <IconFileText size={20} color="#2563EB" />;
      case "pptx":
        return <IconFileText size={20} color="#D97706" />;
      case "txt":
      case "md":
        return <IconFileText size={20} color="#6B7280" />;
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

  const documentCountLabel = `${filteredDocs.length} tài liệu`;

  return (
    <Stack gap="xl">
      {/* Header */}
      <Group justify="space-between" align="center">
        <div>
          <Title order={1} style={{ fontSize: "24px", fontWeight: 900, color: "#1A3A5C" }}>
            Quản lý Tài liệu
          </Title>
          <Text size="sm" c="dimmed">
              Tải lên tài liệu môn học (PDF, DOCX, PPTX, TXT, Markdown) để chunking & embedding vào Qdrant cho Chatbot RAG.
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

      {apiError && (
        <Alert title="Lỗi API" color="red" radius={0}>
          {apiError}
        </Alert>
      )}

      <Card p="md" radius={0} style={{ border: "1px solid #E2E8F0", backgroundColor: "white" }}>
        <TextInput
          placeholder="Tìm kiếm theo tên tài liệu..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftSection={<IconSearch size={16} color="#9CA3AF" />}
          radius={0}
        />
      </Card>

      <Card p={0} radius={0} style={{ border: "1px solid #E2E8F0", backgroundColor: "white" }}>
        <Box px="md" py="sm" style={{ borderBottom: "1px solid #E2E8F0" }}>
          <Text size="sm" c="dimmed">{documentCountLabel}</Text>
        </Box>

        {documentsQuery.isLoading ? (
          <Box p="xl" style={{ textAlign: "center" }}>
            <Loader />
          </Box>
        ) : (
          <Table highlightOnHover striped>
            <Table.Thead style={{ backgroundColor: "#F8FAFC" }}>
              <Table.Tr>
                <Table.Th style={{ width: "50px", fontWeight: 700, fontSize: "12px", color: "#475569", textAlign: "center" }}>Loại</Table.Th>
                <Table.Th style={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>Tên tài liệu</Table.Th>
                <Table.Th style={{ width: "100px", fontWeight: 700, fontSize: "12px", color: "#475569" }}>Môn học</Table.Th>
                <Table.Th style={{ width: "120px", fontWeight: 700, fontSize: "12px", color: "#475569" }}>Trạng thái</Table.Th>
                <Table.Th style={{ width: "100px", fontWeight: 700, fontSize: "12px", color: "#475569" }}>Ngày tải lên</Table.Th>
                <Table.Th style={{ width: "60px", fontWeight: 700, fontSize: "12px", color: "#475569", textAlign: "right" }}>Xóa</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredDocs.map((doc) => (
                <Table.Tr key={doc.id}>
                  <Table.Td style={{ textAlign: "center" }}>{getFileIcon(doc.fileType || doc.name.split(".").pop() || "pdf")}</Table.Td>
                  <Table.Td style={{ fontSize: "13px", fontWeight: 700 }}>{doc.name}</Table.Td>
                  <Table.Td style={{ fontSize: "12px", color: "#1A3A5C", fontWeight: 600 }}>
                    {doc.syllabus?.course.code || "—"}
                  </Table.Td>
                  <Table.Td>{getStatusBadge(doc.status)}</Table.Td>
                  <Table.Td style={{ fontSize: "12px", color: "#64748B" }}>
                    {new Date(doc.createdAt).toLocaleDateString("vi-VN")}
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <ActionIcon variant="subtle" color="red" size="sm" onClick={() => void handleDelete(doc.id)}>
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}

        {filteredDocs.length === 0 && !documentsQuery.isLoading && (
          <Box p="xl" style={{ textAlign: "center", color: "#9CA3AF" }}>
            <Text size="sm" fw={700}>Không tìm thấy tài liệu phù hợp</Text>
          </Box>
        )}

        {documentsQuery.data && documentsQuery.data.total > PAGE_SIZE && (
          <Box p="md" style={{ display: "flex", justifyContent: "center" }}>
            <Pagination
              total={Math.ceil(documentsQuery.data.total / PAGE_SIZE)}
              value={page}
              onChange={setPage}
              radius={0}
            />
          </Box>
        )}
      </Card>

      <Modal
        opened={isUploadModalOpen}
        onClose={() => {
          if (!isUploading) {
            setIsUploadModalOpen(false);
            setFileStatuses([]);
            setUploadError(null);
            setUploadSummary(null);
          }
        }}
        title="Thêm tài liệu môn học mới"
        centered
        radius={0}
        closeOnClickOutside={!isUploading}
        closeOnEscape={!isUploading}
        styles={{
          title: { fontWeight: 900, color: "#1A3A5C", textTransform: "uppercase", fontSize: "16px" },
          header: { borderBottom: "1px solid #E2E8F0" },
        }}
      >
        <Stack gap="md" py="md">
          <Select
            label="Chọn syllabus để upload tài liệu"
            placeholder={syllabiQuery.isLoading ? "Đang tải syllabus..." : "Chọn syllabus..."}
            data={subjectOptions}
            value={selectedSyllabusId ? String(selectedSyllabusId) : null}
            onChange={(value) => setSelectedSyllabusId(value ? Number(value) : null)}
            radius={0}
            disabled={syllabiQuery.isLoading || isUploading}
            required
          />

          <Dropzone
            onDrop={handleFilesDrop}
            multiple
              accept={{ "application/pdf": [".pdf"], "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"], "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"], "text/plain": [".txt", ".md"] }}
            maxSize={50 * 1024 ** 2}
            radius={0}
            disabled={isUploading}
            styles={{
              root: { border: "2px dashed #CBD5E1", backgroundColor: "#F8FAFC", cursor: isUploading ? "not-allowed" : "pointer" },
            }}
          >
            <Stack align="center" gap="xs" py="md" style={{ textAlign: "center" }}>
              <ThemeIcon size={48} radius="xl" color="blue.0" style={{ color: "#1A3A5C" }}>
                <IconUpload size={24} />
              </ThemeIcon>
              <Text size="sm" fw={700}>Kéo thả file vào đây, hoặc click để chọn file</Text>
              <Text size="xs" c="dimmed">Hỗ trợ: PDF, DOCX, PPTX, TXT, Markdown (Tối đa 50MB) — Chọn được nhiều file cùng lúc</Text>
            </Stack>
          </Dropzone>

          {uploadError && (
            <Alert color="red" radius={0}>
              {uploadError}
            </Alert>
          )}

          {uploadSummary && (
            <Alert color={fileStatuses.every((fs) => fs.status === "success") ? "green" : "yellow"} radius={0}>
              {uploadSummary}
            </Alert>
          )}

          {fileStatuses.length > 0 && (
            <Card p="xs" radius={0} withBorder>
              <Group justify="space-between" mb={4}>
                <Text fw={700} size="xs">Tập tin đã chọn ({fileStatuses.length}):</Text>
                {!isUploading && (
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    size="sm"
                    title="Xóa tất cả"
                    onClick={() => setFileStatuses([])}
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                )}
              </Group>
              <Stack gap={4}>
                {fileStatuses.map((fs, i) => (
                  <Group key={i} justify="space-between" wrap="nowrap" style={{ padding: "4px 0" }}>
                    <Group gap="xs" style={{ flex: 1, minWidth: 0 }}>
                      {fs.status === "uploading" && <Loader size={14} color="blue" type="dots" />}
                      {fs.status === "success" && <IconCircleCheck size={14} color="#16A34A" />}
                      {fs.status === "error" && <IconAlertCircle size={14} color="#DC2626" />}
                      {fs.status === "pending" && <IconFileText size={14} color="#64748B" />}
                      <Text
                        size="xs"
                        truncate
                        style={{ maxWidth: "200px", fontWeight: 500 }}
                        c={fs.status === "error" ? "red" : undefined}
                      >
                        {fs.file.name}
                      </Text>
                      <Text size="xs" c="dimmed" style={{ whiteSpace: "nowrap" }}>
                        {(fs.file.size / 1024 / 1024).toFixed(2)} MB
                      </Text>
                    </Group>
                    <Group gap="xs" wrap="nowrap">
                      {fs.status === "pending" && !isUploading && (
                        <ActionIcon variant="subtle" color="gray" size="xs" onClick={() => handleRemoveFile(i)}>
                          <IconX size={14} />
                        </ActionIcon>
                      )}
                      {fs.status === "uploading" && (
                        <Text size="xs" c="blue" fw={600} style={{ whiteSpace: "nowrap" }}>Đang tải lên...</Text>
                      )}
                      {fs.status === "success" && (
                        <Text size="xs" c="green" fw={600}>Thành công</Text>
                      )}
                      {fs.status === "error" && (
                        <Text size="xs" c="red" fw={600} truncate style={{ maxWidth: "120px" }}>
                          Lỗi: {fs.error}
                        </Text>
                      )}
                    </Group>
                  </Group>
                ))}
              </Stack>
            </Card>
          )}

          <Group justify="flex-end" mt="md">
            <Button
              variant="outline"
              color="gray"
              radius={0}
              onClick={() => {
                if (!isUploading) {
                  setIsUploadModalOpen(false);
                  setFileStatuses([]);
                  setUploadError(null);
                  setUploadSummary(null);
                }
              }}
              disabled={isUploading}
              fw={700}
            >
              Hủy bỏ
            </Button>
            <Button
              style={{ backgroundColor: "#F26F21" }}
              radius={0}
              onClick={handleUpload}
              disabled={fileStatuses.filter((fs) => fs.status === "pending").length === 0 || isUploading || !selectedSyllabusId}
              loading={isUploading}
              fw={700}
            >
              {isUploading
                ? `Đang tải lên... (${fileStatuses.filter((fs) => fs.status === "success" || fs.status === "error").length}/${fileStatuses.filter((fs) => fs.status !== "pending").length})`
                : `Bắt đầu upload (${fileStatuses.filter((fs) => fs.status === "pending").length} file)`}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}

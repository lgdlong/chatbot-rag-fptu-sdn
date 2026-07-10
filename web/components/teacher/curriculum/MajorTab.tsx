"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Table,
  Group,
  Text,
  Badge,
  ActionIcon,
  Loader,
  Center,
  Box,
  TextInput,
  Button,
  Modal,
  Stack,
  Textarea,
  Alert,
} from "@mantine/core";
import { IconTrash, IconPlus, IconSchool, IconAlertCircle } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";
import * as api from "@/lib/api";
import type { ApiMajor } from "@/lib/api";

interface MajorTabProps {
  search: string;
}

export function MajorTab({ search }: MajorTabProps) {
  const [majors, setMajors] = useState<ApiMajor[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  const loadMajors = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getMajors();
      setMajors(data.majors);
    } catch (err: any) {
      console.error(err);
      notifications.show({
        title: "Lỗi tải dữ liệu",
        message: err.message || "Không thể tải danh sách Ngành học.",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMajors();
  }, [loadMajors]);

  const filteredMajors = useMemo(() => {
    const s = search.trim().toLowerCase();
    return majors.filter(
      (m) =>
        m.code.toLowerCase().includes(s) ||
        m.name.toLowerCase().includes(s) ||
        (m.description && m.description.toLowerCase().includes(s))
    );
  }, [search, majors]);

  const handleAddMajor = async () => {
    if (!code.trim() || !name.trim()) {
      setAddError("Mã ngành và tên ngành là bắt buộc.");
      return;
    }
    setAddError(null);
    setAdding(true);
    try {
      await api.createMajor({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim() || undefined,
      });
      notifications.show({
        title: "Thành công",
        message: `Đã tạo ngành học ${code.trim().toUpperCase()}`,
        color: "green",
      });
      setIsAddModalOpen(false);
      setCode("");
      setName("");
      setDescription("");
      void loadMajors();
    } catch (err: any) {
      setAddError(err.message || "Không thể tạo ngành học.");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteMajor = (major: ApiMajor) => {
    modals.openConfirmModal({
      title: "Xóa ngành học",
      children: (
        <Text size="sm">
          Bạn có chắc chắn muốn xóa ngành học <b>{major.code} - {major.name}</b>? Hành động này không thể hoàn tác.
        </Text>
      ),
      labels: { confirm: "Xóa", cancel: "Hủy" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await api.deleteMajor(major.id);
          notifications.show({
            title: "Đã xóa",
            message: `Xóa thành công ngành học ${major.code}`,
            color: "green",
          });
          void loadMajors();
        } catch (err: any) {
          notifications.show({
            title: "Lỗi xóa ngành",
            message: err.message || "Không thể xóa ngành học. Vui lòng xóa các chuyên ngành hẹp liên kết trước.",
            color: "red",
          });
        }
      },
    });
  };

  if (loading) {
    return (
      <Center py="xl">
        <Loader color="#1A3A5C" type="bars" />
      </Center>
    );
  }

  return (
    <>
      <Box p="md" style={{ display: "flex", justifyContent: "flex-end", borderBottom: "1px solid #E2E8F0" }}>
        <Button
          leftSection={<IconPlus size={16} />}
          style={{ backgroundColor: "#F26F21" }}
          radius={0}
          fw={700}
          onClick={() => {
            setAddError(null);
            setIsAddModalOpen(true);
          }}
        >
          Thêm Ngành
        </Button>
      </Box>

      <Table layout="fixed" highlightOnHover striped>
        <Table.Thead style={{ backgroundColor: "#F8FAFC" }}>
          <Table.Tr>
            <Table.Th style={{ width: "120px", fontWeight: 700, fontSize: "12px", color: "#475569" }}>Mã Ngành</Table.Th>
            <Table.Th style={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>Tên Ngành</Table.Th>
            <Table.Th style={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>Mô tả</Table.Th>
            <Table.Th style={{ width: "100px", fontWeight: 700, fontSize: "12px", color: "#475569", textAlign: "right" }}>Thao tác</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {filteredMajors.map((major) => (
            <Table.Tr key={major.id}>
              <Table.Td style={{ fontSize: "13px", fontWeight: 700, color: "#1A3A5C" }}>{major.code}</Table.Td>
              <Table.Td style={{ fontSize: "13px" }}>{major.name}</Table.Td>
              <Table.Td style={{ fontSize: "13px", color: "#64748B" }}>{major.description || "—"}</Table.Td>
              <Table.Td style={{ textAlign: "right" }}>
                <ActionIcon variant="subtle" color="red" size="sm" onClick={() => handleDeleteMajor(major)}>
                  <IconTrash size={16} />
                </ActionIcon>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      {filteredMajors.length === 0 && (
        <Box p="xl" style={{ textAlign: "center", color: "#9CA3AF" }}>
          <Text size="sm" fw={700}>Không có Ngành học nào phù hợp</Text>
        </Box>
      )}

      {/* Modal Thêm Ngành */}
      <Modal
        opened={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Thêm Ngành Học Mới"
        centered
        radius={0}
        styles={{
          title: { fontWeight: 900, color: "#1A3A5C", textTransform: "uppercase", fontSize: "16px" },
          header: { borderBottom: "1px solid #E2E8F0" },
        }}
      >
        <Stack gap="md" py="md">
          {addError && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" radius={0}>
              {addError}
            </Alert>
          )}

          <TextInput
            label="Mã ngành"
            placeholder="Ví dụ: SE, AI, GD"
            required
            radius={0}
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />

          <TextInput
            label="Tên ngành"
            placeholder="Ví dụ: Software Engineering"
            required
            radius={0}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Textarea
            label="Mô tả"
            placeholder="Nhập thông tin mô tả chi tiết..."
            radius={0}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="outline" color="gray" radius={0} onClick={() => setIsAddModalOpen(false)} fw={700}>
              Hủy bỏ
            </Button>
            <Button
              style={{ backgroundColor: "#F26F21" }}
              radius={0}
              onClick={handleAddMajor}
              fw={700}
              loading={adding}
            >
              Tạo Ngành
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}

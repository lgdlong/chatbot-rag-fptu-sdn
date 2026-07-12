"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Table,
  Group,
  Text,
  ActionIcon,
  Loader,
  Center,
  Box,
  TextInput,
  Button,
  Modal,
  Stack,
  Alert,
} from "@mantine/core";
import { IconTrash, IconPlus, IconAlertCircle } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";
import * as api from "@/lib/api";
import type { ApiCourse } from "@/lib/api";

interface SubjectTabProps {
  search: string;
}

export function SubjectTab({ search }: SubjectTabProps) {
  const [courses, setCourses] = useState<ApiCourse[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getCourses();
      setCourses(data.courses);
    } catch (err: any) {
      console.error(err);
      notifications.show({
        title: "Lỗi tải dữ liệu",
        message: err.message || "Không thể tải danh sách môn học.",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  const filteredCourses = useMemo(() => {
    const s = search.trim().toLowerCase();
    return courses
      .filter(
        (c) =>
          c.code.toLowerCase().includes(s) ||
          c.name.toLowerCase().includes(s)
      )
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [search, courses]);

  const handleAddCourse = async () => {
    if (!code.trim() || !name.trim()) {
      setAddError("Mã môn và tên môn là bắt buộc.");
      return;
    }
    setAddError(null);
    setAdding(true);
    try {
      await api.createCourse({
        code: code.trim().toUpperCase(),
        name: name.trim(),
      });
      notifications.show({
        title: "Thành công",
        message: `Đã tạo môn học ${code.trim().toUpperCase()}`,
        color: "green",
      });
      setIsAddModalOpen(false);
      setCode("");
      setName("");
      void loadCourses();
    } catch (err: any) {
      setAddError(err.message || "Không thể tạo môn học.");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteCourse = (course: ApiCourse) => {
    modals.openConfirmModal({
      title: "Xóa môn học",
      children: (
        <Text size="sm">
          Bạn có chắc chắn muốn xóa môn học <b>{course.code} - {course.name}</b>? Hành động này không thể hoàn tác.
        </Text>
      ),
      labels: { confirm: "Xóa", cancel: "Hủy" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await api.deleteCourse(course.id);
          notifications.show({
            title: "Đã xóa",
            message: `Xóa thành công môn học ${course.code}`,
            color: "green",
          });
          void loadCourses();
        } catch (err: any) {
          notifications.show({
            title: "Lỗi xóa môn",
            message: err.message || "Không thể xóa môn học. Vui lòng xóa các tài liệu liên kết trước.",
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
          Thêm Môn
        </Button>
      </Box>

      <Table layout="fixed" highlightOnHover striped>
        <Table.Thead style={{ backgroundColor: "#F8FAFC" }}>
          <Table.Tr>
            <Table.Th style={{ width: "120px", fontWeight: 700, fontSize: "12px", color: "#475569" }}>Mã Môn</Table.Th>
            <Table.Th style={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>Tên Môn</Table.Th>
            <Table.Th style={{ width: "100px", fontWeight: 700, fontSize: "12px", color: "#475569", textAlign: "right" }}>Thao tác</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {filteredCourses.map((course) => (
            <Table.Tr key={course.id}>
              <Table.Td style={{ fontSize: "13px", fontWeight: 700, color: "#1A3A5C" }}>{course.code}</Table.Td>
              <Table.Td style={{ fontSize: "13px" }}>{course.name}</Table.Td>
              <Table.Td style={{ textAlign: "right" }}>
                <ActionIcon variant="subtle" color="red" size="sm" onClick={() => handleDeleteCourse(course)}>
                  <IconTrash size={16} />
                </ActionIcon>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      {filteredCourses.length === 0 && (
        <Box p="xl" style={{ textAlign: "center", color: "#9CA3AF" }}>
          <Text size="sm" fw={700}>Không có Môn học nào phù hợp</Text>
        </Box>
      )}

      {/* Modal Thêm Môn */}
      <Modal
        opened={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Thêm Môn Học Mới"
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
            label="Mã môn"
            placeholder="Ví dụ: INT1306, CSD201"
            required
            radius={0}
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />

          <TextInput
            label="Tên môn"
            placeholder="Ví dụ: Lập trình Java"
            required
            radius={0}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="outline" color="gray" radius={0} onClick={() => setIsAddModalOpen(false)} fw={700}>
              Hủy bỏ
            </Button>
            <Button
              style={{ backgroundColor: "#F26F21" }}
              radius={0}
              onClick={handleAddCourse}
              fw={700}
              loading={adding}
            >
              Tạo Môn
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}

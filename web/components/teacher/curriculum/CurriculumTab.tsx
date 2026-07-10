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
  Alert,
  Select,
} from "@mantine/core";
import { IconTrash, IconPlus, IconAlertCircle, IconAlertTriangle } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";
import * as api from "@/lib/api";
import type { ApiCurriculum, ApiMajor, ApiSpecialization } from "@/lib/api";

interface CurriculumTabProps {
  search: string;
}

export function CurriculumTab({ search }: CurriculumTabProps) {
  const [curriculums, setCurriculums] = useState<ApiCurriculum[]>([]);
  const [majors, setMajors] = useState<ApiMajor[]>([]);
  const [specializations, setSpecializations] = useState<ApiSpecialization[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  
  const [curriculumId, setCurriculumId] = useState("");
  const [selectedMajorId, setSelectedMajorId] = useState<string | null>(null);
  const [selectedSpecId, setSelectedSpecId] = useState<string | null>(null);
  const [batchCode, setBatchCode] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [currData, majorsData, specsData] = await Promise.all([
        api.getCurriculums(),
        api.getMajors(),
        api.getSpecializations(),
      ]);
      setCurriculums(currData.curriculums);
      setMajors(majorsData.majors);
      setSpecializations(specsData.specializations);
    } catch (err: any) {
      console.error(err);
      notifications.show({
        title: "Lỗi tải dữ liệu",
        message: err.message || "Không thể tải dữ liệu khung chương trình.",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredCurriculums = useMemo(() => {
    const s = search.trim().toLowerCase();
    return curriculums.filter(
      (c) =>
        c.curriculumId.toLowerCase().includes(s) ||
        c.batchCode.toLowerCase().includes(s) ||
        c.major.name.toLowerCase().includes(s) ||
        (c.specialization?.name && c.specialization.name.toLowerCase().includes(s))
    );
  }, [search, curriculums]);

  const handleAddCurriculum = async () => {
    if (!curriculumId.trim() || !selectedMajorId || !batchCode.trim()) {
      setAddError("Mã khung chương trình, ngành học và khóa học (batch code) là bắt buộc.");
      return;
    }
    setAddError(null);
    setAdding(true);
    try {
      await api.createCurriculum({
        curriculumId: curriculumId.trim().toUpperCase(),
        majorId: selectedMajorId,
        specializationId: selectedSpecId || null,
        batchCode: batchCode.trim().toUpperCase(),
      });
      notifications.show({
        title: "Thành công",
        message: `Đã tạo khung chương trình ${curriculumId.trim().toUpperCase()}`,
        color: "green",
      });
      setIsAddModalOpen(false);
      setCurriculumId("");
      setSelectedMajorId(null);
      setSelectedSpecId(null);
      setBatchCode("");
      void loadData();
    } catch (err: any) {
      setAddError(err.message || "Không thể tạo khung chương trình.");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteCurriculum = (curr: ApiCurriculum) => {
    modals.openConfirmModal({
      title: "Xóa khung chương trình",
      children: (
        <Text size="sm">
          Bạn có chắc chắn muốn xóa khung chương trình <b>{curr.curriculumId}</b>? Tất cả dữ liệu môn học liên kết sẽ bị gỡ bỏ khỏi khung.
        </Text>
      ),
      labels: { confirm: "Xóa", cancel: "Hủy" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await api.deleteCurriculum(curr.id);
          notifications.show({
            title: "Đã xóa",
            message: `Xóa thành công khung chương trình ${curr.curriculumId}`,
            color: "green",
          });
          void loadData();
        } catch (err: any) {
          notifications.show({
            title: "Lỗi xóa dữ liệu",
            message: err.message || "Không thể xóa khung chương trình.",
            color: "red",
          });
        }
      },
    });
  };

  const majorOptions = useMemo(
    () =>
      majors.map((m) => ({
        value: m.id,
        label: `${m.code} - ${m.name}`,
      })),
    [majors]
  );

  // Filter specializations based on selected Major for premium UX
  const filteredSpecOptions = useMemo(() => {
    if (!selectedMajorId) return [];
    return specializations
      .filter((s) => s.majorId === selectedMajorId)
      .map((s) => ({
        value: s.id,
        label: `${s.code} - ${s.name}`,
      }));
  }, [specializations, selectedMajorId]);

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
          Tạo Khung chương trình
        </Button>
      </Box>

      <Table layout="fixed" highlightOnHover striped>
        <Table.Thead style={{ backgroundColor: "#F8FAFC" }}>
          <Table.Tr>
            <Table.Th style={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>Mã chương trình</Table.Th>
            <Table.Th style={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>Khóa học</Table.Th>
            <Table.Th style={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>Ngành áp dụng</Table.Th>
            <Table.Th style={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>Chuyên ngành hẹp</Table.Th>
            <Table.Th style={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>Số lượng môn</Table.Th>
            <Table.Th style={{ width: "100px", fontWeight: 700, fontSize: "12px", color: "#475569", textAlign: "right" }}>Thao tác</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {filteredCurriculums.map((curr) => (
            <Table.Tr key={curr.id}>
              <Table.Td style={{ fontSize: "13px", fontWeight: 700, color: "#1A3A5C" }}>{curr.curriculumId}</Table.Td>
              <Table.Td style={{ fontSize: "13px", fontWeight: 600 }}>{curr.batchCode}</Table.Td>
              <Table.Td style={{ fontSize: "13px" }}>{curr.major.name}</Table.Td>
              <Table.Td style={{ fontSize: "13px" }}>
                {curr.specialization ? (
                  <Badge color="orange" radius={0} variant="light" fw={700}>
                    {curr.specialization.name}
                  </Badge>
                ) : (
                  <Badge color="gray" radius={0} variant="light" fw={700}>
                    Chung
                  </Badge>
                )}
              </Table.Td>
              <Table.Td style={{ fontSize: "13px" }}>
                <Badge color={curr._count.subjects > 0 ? "green" : "yellow"} radius={0} fw={700}>
                  {curr._count.subjects} môn học
                </Badge>
              </Table.Td>
              <Table.Td style={{ textAlign: "right" }}>
                <ActionIcon variant="subtle" color="red" size="sm" onClick={() => handleDeleteCurriculum(curr)}>
                  <IconTrash size={16} />
                </ActionIcon>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      {filteredCurriculums.length === 0 && (
        <Box p="xl" style={{ textAlign: "center", color: "#9CA3AF" }}>
          <Text size="sm" fw={700}>Không có Khung chương trình nào phù hợp</Text>
        </Box>
      )}

      {/* Modal Thêm Khung chương trình */}
      <Modal
        opened={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Tạo Khung Chương Trình Mới"
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
            label="Mã khung chương trình"
            placeholder="Ví dụ: BIT_SE_NJS_19B"
            required
            radius={0}
            value={curriculumId}
            onChange={(e) => setCurriculumId(e.target.value)}
          />

          <Select
            label="Ngành học"
            placeholder="Chọn ngành học..."
            required
            data={majorOptions}
            value={selectedMajorId}
            onChange={(val) => {
              setSelectedMajorId(val);
              setSelectedSpecId(null); // Reset spec when major changes
            }}
            radius={0}
          />

          <Select
            label="Chuyên ngành hẹp (Tùy chọn)"
            placeholder={selectedMajorId ? "Chọn chuyên ngành hẹp..." : "Vui lòng chọn Ngành học trước"}
            disabled={!selectedMajorId}
            data={filteredSpecOptions}
            value={selectedSpecId}
            onChange={setSelectedSpecId}
            radius={0}
            clearable
          />

          <TextInput
            label="Khóa học (Batch Code)"
            placeholder="Ví dụ: 19B, 20A"
            required
            radius={0}
            value={batchCode}
            onChange={(e) => setBatchCode(e.target.value)}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="outline" color="gray" radius={0} onClick={() => setIsAddModalOpen(false)} fw={700}>
              Hủy bỏ
            </Button>
            <Button
              style={{ backgroundColor: "#F26F21" }}
              radius={0}
              onClick={handleAddCurriculum}
              fw={700}
              loading={adding}
            >
              Tạo Khung
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}

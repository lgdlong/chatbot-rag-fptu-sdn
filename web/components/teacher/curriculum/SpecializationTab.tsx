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
  Select,
} from "@mantine/core";
import { IconTrash, IconPlus, IconAlertCircle } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";
import * as api from "@/lib/api";
import type { ApiSpecialization, ApiMajor } from "@/lib/api";

interface SpecializationTabProps {
  search: string;
}

export function SpecializationTab({ search }: SpecializationTabProps) {
  const [specs, setSpecs] = useState<ApiSpecialization[]>([]);
  const [majors, setMajors] = useState<ApiMajor[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectCounts, setSubjectCounts] = useState<Record<string, number>>({});

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [selectedMajorId, setSelectedMajorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [specsData, majorsData] = await Promise.all([
        api.getSpecializations(),
        api.getMajors(),
      ]);
      setSpecs(specsData.specializations);
      setMajors(majorsData.majors);

      // Fetch subject counts for each specialization
      const counts: Record<string, number> = {};
      await Promise.all(
        specsData.specializations.map(async (spec) => {
          try {
            const result = await api.getSpecializationSubjectCount(spec.id);
            counts[spec.id] = result.specializationSpecific;
          } catch {
            counts[spec.id] = 0;
          }
        })
      );
      setSubjectCounts(counts);
    } catch (err: any) {
      console.error(err);
      notifications.show({
        title: "Lỗi tải dữ liệu",
        message: err.message || "Không thể tải dữ liệu chuyên ngành.",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredSpecs = useMemo(() => {
    const s = search.trim().toLowerCase();
    return specs.filter(
      (spec) =>
        spec.code.toLowerCase().includes(s) ||
        spec.name.toLowerCase().includes(s) ||
        (spec.major?.name && spec.major.name.toLowerCase().includes(s)) ||
        (spec.description && spec.description.toLowerCase().includes(s))
    );
  }, [search, specs]);

  const handleAddSpec = async () => {
    if (!selectedMajorId) {
      setAddError("Vui lòng chọn Ngành học.");
      return;
    }
    if (!code.trim() || !name.trim()) {
      setAddError("Mã chuyên ngành và tên chuyên ngành là bắt buộc.");
      return;
    }
    setAddError(null);
    setAdding(true);
    try {
      await api.createSpecialization({
        majorId: selectedMajorId,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim() || undefined,
      });
      notifications.show({
        title: "Thành công",
        message: `Đã tạo chuyên ngành hẹp ${code.trim().toUpperCase()}`,
        color: "green",
      });
      setIsAddModalOpen(false);
      setSelectedMajorId(null);
      setCode("");
      setName("");
      setDescription("");
      void loadData();
    } catch (err: any) {
      setAddError(err.message || "Không thể tạo chuyên ngành hẹp.");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteSpec = (spec: ApiSpecialization) => {
    modals.openConfirmModal({
      title: "Xóa chuyên ngành hẹp",
      children: (
        <Text size="sm">
          Bạn có chắc chắn muốn xóa chuyên ngành <b>{spec.code} - {spec.name}</b>?
        </Text>
      ),
      labels: { confirm: "Xóa", cancel: "Hủy" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await api.deleteSpecialization(spec.id);
          notifications.show({
            title: "Đã xóa",
            message: `Xóa thành công chuyên ngành hẹp ${spec.code}`,
            color: "green",
          });
          void loadData();
        } catch (err: any) {
          notifications.show({
            title: "Lỗi xóa chuyên ngành",
            message: err.message || "Không thể xóa chuyên ngành hẹp. Vui lòng kiểm tra liên kết khung chương trình.",
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
          Thêm CN Hẹp
        </Button>
      </Box>

      <Table layout="fixed" highlightOnHover striped>
        <Table.Thead style={{ backgroundColor: "#F8FAFC" }}>
          <Table.Tr>
            <Table.Th style={{ width: "120px", fontWeight: 700, fontSize: "12px", color: "#475569" }}>Mã CN Hẹp</Table.Th>
            <Table.Th style={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>Tên Chuyên ngành</Table.Th>
            <Table.Th style={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>Thuộc Ngành</Table.Th>
            <Table.Th style={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>Mô tả</Table.Th>
            <Table.Th style={{ width: "130px", fontWeight: 700, fontSize: "12px", color: "#475569", textAlign: "center" }}>Môn đặc thù</Table.Th>
            <Table.Th style={{ width: "100px", fontWeight: 700, fontSize: "12px", color: "#475569", textAlign: "right" }}>Thao tác</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {filteredSpecs.map((spec) => {
            const specCount = subjectCounts[spec.id] ?? 0;
            return (
            <Table.Tr key={spec.id}>
              <Table.Td style={{ fontSize: "13px", fontWeight: 700, color: "#1A3A5C" }}>{spec.code}</Table.Td>
              <Table.Td style={{ fontSize: "13px" }}>{spec.name}</Table.Td>
              <Table.Td style={{ fontSize: "13px" }}>
                <Badge color="blue" radius={0} variant="light" fw={700}>
                  {spec.major ? `${spec.major.code} - ${spec.major.name}` : "—"}
                </Badge>
              </Table.Td>
              <Table.Td style={{ fontSize: "13px", color: "#64748B" }}>{spec.description || "—"}</Table.Td>
              <Table.Td style={{ textAlign: "center" }}>
                <Badge
                  color={specCount === 4 ? "green" : "orange"}
                  variant="filled"
                  radius={0}
                  size="sm"
                >
                  {specCount}/4 môn đặc thù
                </Badge>
              </Table.Td>
              <Table.Td style={{ textAlign: "right" }}>
                <ActionIcon variant="subtle" color="red" size="sm" onClick={() => handleDeleteSpec(spec)}>
                  <IconTrash size={16} />
                </ActionIcon>
              </Table.Td>
            </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>

      {filteredSpecs.length === 0 && (
        <Box p="xl" style={{ textAlign: "center", color: "#9CA3AF" }}>
          <Text size="sm" fw={700}>Không có Chuyên ngành hẹp nào phù hợp</Text>
        </Box>
      )}

      {/* Modal Thêm Chuyên ngành hẹp */}
      <Modal
        opened={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Thêm Chuyên Ngành Hẹp"
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

          <Select
            label="Thuộc Ngành học"
            placeholder="Chọn ngành học liên kết..."
            required
            data={majorOptions}
            value={selectedMajorId}
            onChange={setSelectedMajorId}
            radius={0}
          />

          <TextInput
            label="Mã chuyên ngành hẹp"
            placeholder="Ví dụ: NJS, NET, AI"
            required
            radius={0}
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />

          <TextInput
            label="Tên chuyên ngành hẹp"
            placeholder="Ví dụ: React & NodeJS"
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
              onClick={handleAddSpec}
              fw={700}
              loading={adding}
            >
              Tạo CN Hẹp
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}

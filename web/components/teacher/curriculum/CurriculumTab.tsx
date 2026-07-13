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
  NumberInput,
  Checkbox,
} from "@mantine/core";
import { IconTrash, IconPlus, IconAlertCircle, IconAlertTriangle, IconListDetails } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";
import * as api from "@/lib/api";
import type { ApiCurriculum, ApiCurriculumSubject, ApiMajor, ApiSpecialization, ApiCourse } from "@/lib/api";

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

  // Subject management state
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [selectedCurriculum, setSelectedCurriculum] = useState<ApiCurriculum | null>(null);
  const [curriculumSubjects, setCurriculumSubjects] = useState<ApiCurriculumSubject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);

  // Add subject form state
  const [addSubjectModalOpen, setAddSubjectModalOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [semesterNo, setSemesterNo] = useState<number>(1);
  const [isSpecSpecific, setIsSpecSpecific] = useState(false);
  const [subjectAddError, setSubjectAddError] = useState<string | null>(null);
  const [subjectAdding, setSubjectAdding] = useState(false);
  const [quickFilling, setQuickFilling] = useState(false);
  const [availableCourses, setAvailableCourses] = useState<ApiCourse[]>([]);

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

  const openSubjectManager = useCallback(async (curr: ApiCurriculum) => {
    setSelectedCurriculum(curr);
    setSubjectModalOpen(true);
    setSubjectsLoading(true);
    try {
      const data = await api.getCurriculumDetail(curr.curriculumId);
      setCurriculumSubjects(data.curriculum.subjects);
    } catch (err: any) {
      notifications.show({ title: "Lỗi", message: err.message || "Không thể tải danh sách môn học.", color: "red" });
    } finally {
      setSubjectsLoading(false);
    }
  }, []);

  const openAddSubjectForm = useCallback(async () => {
    setSubjectAddError(null);
    setSelectedCourseId(null);
    setSemesterNo(1);
    setIsSpecSpecific(false);
    setAddSubjectModalOpen(true);
    try {
      const coursesData = await api.getCourses();
      setAvailableCourses(coursesData.courses);
    } catch { /* courses not loaded */ }
  }, []);

  const handleQuickFill = useCallback(async () => {
    if (!selectedCurriculum) return;
    setQuickFilling(true);
    try {
      const result = await api.quickFillCoreSubjects(selectedCurriculum.curriculumId);
      notifications.show({
        title: "Thành công",
        message: `Đã điền ${result.count} môn cơ bản vào khung chương trình.`,
        color: "green",
      });
      // Refresh subject list
      const data = await api.getCurriculumDetail(selectedCurriculum.curriculumId);
      setCurriculumSubjects(data.curriculum.subjects);
      void loadData();
    } catch (err: any) {
      notifications.show({
        title: "Lỗi",
        message: err.message || "Không thể điền môn cơ bản.",
        color: "red",
      });
    } finally {
      setQuickFilling(false);
    }
  }, [selectedCurriculum]);

  const handleAddSubject = async () => {
    if (!selectedCourseId || !selectedCurriculum) {
      setSubjectAddError("Vui lòng chọn môn học.");
      return;
    }
    setSubjectAddError(null);
    setSubjectAdding(true);
    try {
      await api.assignSubjectToCurriculum(selectedCurriculum.curriculumId, {
        courseId: selectedCourseId,
        semesterNo,
        isSpecializationSpecific: isSpecSpecific,
      });
      notifications.show({ title: "Thành công", message: "Đã thêm môn học vào khung chương trình.", color: "green" });
      setAddSubjectModalOpen(false);
      // Refresh subject list
      const data = await api.getCurriculumDetail(selectedCurriculum.curriculumId);
      setCurriculumSubjects(data.curriculum.subjects);
      // Refresh curriculum list (to update subject count)
      void loadData();
    } catch (err: any) {
      if (err.status === 409) {
        setSubjectAddError(err.message || "Chuyên ngành hẹp chỉ có tối đa 4 môn học đặc thù.");
      } else {
        setSubjectAddError(err.message || "Không thể thêm môn học.");
      }
    } finally {
      setSubjectAdding(false);
    }
  };

  const handleRemoveSubject = (subject: ApiCurriculumSubject) => {
    if (!selectedCurriculum) return;
    modals.openConfirmModal({
      title: "Gỡ môn học",
      children: (<Text size="sm">Gỡ môn <b>{subject.course.code} - {subject.course.name}</b> khỏi khung chương trình?</Text>),
      labels: { confirm: "Gỡ", cancel: "Hủy" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await api.removeSubjectFromCurriculum(selectedCurriculum.curriculumId, subject.courseId);
          notifications.show({ title: "Đã gỡ", message: `Đã gỡ môn ${subject.course.code}`, color: "green" });
          const data = await api.getCurriculumDetail(selectedCurriculum.curriculumId);
          setCurriculumSubjects(data.curriculum.subjects);
          void loadData();
        } catch (err: any) {
          notifications.show({ title: "Lỗi", message: err.message || "Không thể gỡ môn học.", color: "red" });
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
                <Group gap={4} justify="flex-end" wrap="nowrap">
                  <ActionIcon variant="subtle" color="blue" size="sm" onClick={() => openSubjectManager(curr)} title="Quản lý môn học">
                    <IconListDetails size={16} />
                  </ActionIcon>
                  <ActionIcon variant="subtle" color="red" size="sm" onClick={() => handleDeleteCurriculum(curr)} title="Xóa khung chương trình">
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
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

      {/* Modal Quản lý Môn học */}
      <Modal
        opened={subjectModalOpen}
        onClose={() => setSubjectModalOpen(false)}
        title={`Quản lý Môn học — ${selectedCurriculum?.curriculumId || ""}`}
        size="xl"
        centered
        radius={0}
        styles={{
          title: { fontWeight: 900, color: "#1A3A5C", textTransform: "uppercase", fontSize: "16px" },
          header: { borderBottom: "1px solid #E2E8F0" },
        }}
      >
        <Stack gap="md" py="md">
          <Box>
            <Group gap="sm">
              <Button
                leftSection={<IconPlus size={16} />}
                style={{ backgroundColor: "#F26F21" }}
                radius={0}
                fw={700}
                onClick={openAddSubjectForm}
              >
                Thêm môn học
              </Button>
              <Button
                variant="outline"
                color="blue"
                radius={0}
                fw={700}
                onClick={handleQuickFill}
                loading={quickFilling}
                leftSection={<IconListDetails size={16} />}
              >
                Điền 44 môn cơ bản
              </Button>
            </Group>
          </Box>

          {subjectsLoading ? (
            <Center py="xl"><Loader color="#1A3A5C" type="bars" /></Center>
          ) : curriculumSubjects.length === 0 ? (
            <Box p="xl" style={{ textAlign: "center", color: "#9CA3AF" }}>
              <Text size="sm" fw={700}>Chưa có môn học nào trong khung chương trình này</Text>
            </Box>
          ) : (
            <Table highlightOnHover striped>
              <Table.Thead style={{ backgroundColor: "#F8FAFC" }}>
                <Table.Tr>
                  <Table.Th style={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>Mã môn</Table.Th>
                  <Table.Th style={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>Tên môn</Table.Th>
                  <Table.Th style={{ width: "80px", fontWeight: 700, fontSize: "12px", color: "#475569", textAlign: "center" }}>Học kỳ</Table.Th>
                  <Table.Th style={{ width: "100px", fontWeight: 700, fontSize: "12px", color: "#475569", textAlign: "center" }}>Đặc thù CN</Table.Th>
                  <Table.Th style={{ width: "60px", fontWeight: 700, fontSize: "12px", color: "#475569", textAlign: "center" }}>Gỡ</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {curriculumSubjects
                  .sort((a, b) => a.semesterNo - b.semesterNo)
                  .map((s) => (
                    <Table.Tr key={s.courseId}>
                      <Table.Td style={{ fontSize: "13px", fontWeight: 700, color: "#1A3A5C" }}>{s.course.code}</Table.Td>
                      <Table.Td style={{ fontSize: "13px" }}>{s.course.name}</Table.Td>
                      <Table.Td style={{ fontSize: "13px", textAlign: "center" }}>
                        <Badge color="blue" radius={0} variant="light">Kỳ {s.semesterNo}</Badge>
                      </Table.Td>
                      <Table.Td style={{ textAlign: "center" }}>
                        {s.isSpecializationSpecific ? (
                          <Badge color="orange" radius={0} variant="filled">Đặc thù</Badge>
                        ) : (
                          <Text size="xs" c="dimmed">—</Text>
                        )}
                      </Table.Td>
                      <Table.Td style={{ textAlign: "center" }}>
                        <ActionIcon variant="subtle" color="red" size="sm" onClick={() => handleRemoveSubject(s)}>
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Table.Td>
                    </Table.Tr>
                  ))}
              </Table.Tbody>
            </Table>
          )}
        </Stack>
      </Modal>

      {/* Modal Thêm môn học vào khung */}
      <Modal
        opened={addSubjectModalOpen}
        onClose={() => setAddSubjectModalOpen(false)}
        title="Thêm Môn Học Vào Khung"
        centered
        radius={0}
        styles={{
          title: { fontWeight: 900, color: "#1A3A5C", textTransform: "uppercase", fontSize: "16px" },
          header: { borderBottom: "1px solid #E2E8F0" },
        }}
      >
        <Stack gap="md" py="md">
          {subjectAddError && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" radius={0}>
              {subjectAddError}
            </Alert>
          )}

          <Select
            label="Môn học"
            placeholder="Chọn môn học..."
            required
            searchable
            radius={0}
            data={availableCourses.map((c) => ({ value: c.id, label: `${c.code} - ${c.name}` }))}
            value={selectedCourseId}
            onChange={setSelectedCourseId}
          />

          <NumberInput
            label="Học kỳ"
            placeholder="Nhập học kỳ (1-9)"
            required
            radius={0}
            min={1}
            max={9}
            value={semesterNo}
            onChange={(val) => setSemesterNo(typeof val === "number" ? val : 1)}
          />

          <Checkbox
            label="Môn đặc thù chuyên ngành hẹp"
            radius={0}
            checked={isSpecSpecific}
            onChange={(e) => setIsSpecSpecific(e.currentTarget.checked)}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="outline" color="gray" radius={0} onClick={() => setAddSubjectModalOpen(false)} fw={700}>
              Hủy bỏ
            </Button>
            <Button
              style={{ backgroundColor: "#F26F21" }}
              radius={0}
              onClick={handleAddSubject}
              fw={700}
              loading={subjectAdding}
            >
              Thêm
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}

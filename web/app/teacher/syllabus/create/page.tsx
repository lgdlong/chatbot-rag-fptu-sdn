"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useStore } from "@tanstack/react-form";
import {
  Title,
  Text,
  Button,
  Card,
  Stepper,
  TextInput,
  NumberInput,
  Textarea,
  Stack,
  Group,
  Table,
  Alert,
  ActionIcon,
  SimpleGrid,
  Select,
  LoadingOverlay,
  Box,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconArrowLeft,
  IconCheck,
  IconAlertCircle,
  IconPlus,
  IconTrash,
  IconRocket,
} from "@tabler/icons-react";
import {
  createSyllabus,
  updateSyllabusFull,
  getCourses,
  type ApiCourse,
  type CreateSyllabusPayload,
} from "@/lib/api";
import { DEMO_DATASETS, type DemoDatasetKey } from "./demo-data";

type CloRow = { cloName: string; cloDetails: string; loDetails: string };

type ScheduleRow = {
  session: number; topic: string; learningMethod: string; lo: string; studentTasks: string;
  itu: string; studentMaterials: string; sDownload: string; urls: string;
};

type AssessmentRow = {
  category: string; type: string; part: string; weight: number; completionCriteria: string;
  duration: string; clo: string; questionType: string; noQuestion: string;
  knowledgeAndSkill: string; gradingGuide: string; note: string;
};

type MaterialRow = {
  description: string; author: string; publisher: string; publishedDate: string;
  edition: string; isbn: string; isMainMaterial: string; isHardCopy: string;
  isOnline: string; note: string;
};

function emptyClo(): CloRow {
  return { cloName: "", cloDetails: "", loDetails: "" };
}
function emptySchedule(session: number): ScheduleRow {
  return { session, topic: "", learningMethod: "", lo: "", studentTasks: "", itu: "", studentMaterials: "", sDownload: "", urls: "" };
}
function emptyAssessment(): AssessmentRow {
  return { category: "", type: "on-going", part: "", weight: 0, completionCriteria: "", duration: "", clo: "", questionType: "", noQuestion: "", knowledgeAndSkill: "", gradingGuide: "", note: "" };
}
function emptyMaterial(): MaterialRow {
  return { description: "", author: "", publisher: "", publishedDate: "", edition: "", isbn: "", isMainMaterial: "Main", isHardCopy: "Không", isOnline: "Có", note: "" };
}

export default function CreateSyllabusPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [courses, setCourses] = useState<ApiCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [demoKey, setDemoKey] = useState<DemoDatasetKey>("FER202");

  useEffect(() => {
    getCourses()
      .then((res) => setCourses(res.courses))
      .catch(() => notifications.show({ title: "Lỗi", message: "Không thể tải danh sách môn học", color: "red" }))
      .finally(() => setCoursesLoading(false));
  }, []);

  const handleQuickFill = (key: DemoDatasetKey) => {
    const data = DEMO_DATASETS[key];
    if (!data) return;
    (Object.keys(data) as (keyof typeof data)[]).forEach((field) => {
      form.setFieldValue(field as any, data[field] as any);
    });
    notifications.show({
      title: "Đã điền dữ liệu",
      message: `Đã điền nhanh bộ data "${key}" — ${data.syllabusName}`,
      color: "green",
    });
  };

  const form = useForm({
    defaultValues: {
      courseId: "",
      syllabusName: "",
      syllabusNameEnglish: "",
      credits: 3,
      prerequisites: "",
      description: "",
      studentTasks: "",
      tools: "",
      scoringScale: "10",
      minAvgMarkToPass: 5,
      decisionNo: "",
      note: "",
      degreeLevel: "Bachelor",
      timeAllocation: "",
      clos: [] as CloRow[],
      schedules: [] as ScheduleRow[],
      assessments: [
        { category: "Progress Test 1", type: "on-going", part: "", weight: 10, completionCriteria: "", duration: "", clo: "", questionType: "", noQuestion: "", knowledgeAndSkill: "", gradingGuide: "", note: "" },
        { category: "Progress Test 2", type: "on-going", part: "", weight: 10, completionCriteria: "", duration: "", clo: "", questionType: "", noQuestion: "", knowledgeAndSkill: "", gradingGuide: "", note: "" },
        { category: "Assignment", type: "on-going", part: "", weight: 20, completionCriteria: "", duration: "", clo: "", questionType: "", noQuestion: "", knowledgeAndSkill: "", gradingGuide: "", note: "" },
        { category: "Final Exam", type: "final exam", part: "", weight: 40, completionCriteria: "", duration: "", clo: "", questionType: "", noQuestion: "", knowledgeAndSkill: "", gradingGuide: "", note: "" },
      ] as AssessmentRow[],
      materials: [] as MaterialRow[],
    },
    onSubmit: async ({ value }) => {
      setSubmitting(true);
      try {
        const step1: CreateSyllabusPayload = {
          courseId: value.courseId,
          syllabusName: value.syllabusName,
          syllabusNameEnglish: value.syllabusNameEnglish || undefined,
          credits: value.credits,
          prerequisites: value.prerequisites || undefined,
          description: value.description || undefined,
          studentTasks: value.studentTasks || undefined,
          tools: value.tools || undefined,
          scoringScale: value.scoringScale || "10",
          minAvgMarkToPass: value.minAvgMarkToPass ?? 5,
          decisionNo: value.decisionNo || undefined,
          note: value.note || undefined,
          degreeLevel: value.degreeLevel || "Bachelor",
          timeAllocation: value.timeAllocation || undefined,
        };

        const { syllabus } = await createSyllabus(step1);

        await updateSyllabusFull(syllabus.id, {
          clos: value.clos.filter((c) => c.cloName || c.cloDetails).map((c) => ({
            cloName: c.cloName,
            cloDetails: c.cloDetails,
            loDetails: c.loDetails || null,
          })),
          schedules: value.schedules.filter((s) => s.topic).map((s) => ({
            session: s.session,
            topic: s.topic,
            learningMethod: s.learningMethod || null,
            lo: s.lo || null,
            studentTasks: s.studentTasks || null,
            itu: s.itu || null,
            studentMaterials: s.studentMaterials || null,
            sDownload: s.sDownload || null,
            urls: s.urls || null,
          })),
          assessments: value.assessments.filter((a) => a.category).map((a) => ({
            category: a.category,
            type: a.type || null,
            weight: a.weight,
            clo: a.clo || null,
            completionCriteria: a.completionCriteria || null,
            gradingGuide: a.gradingGuide || null,
            part: a.part || null,
            duration: a.duration || null,
            questionType: a.questionType || null,
            noQuestion: a.noQuestion || null,
            knowledgeAndSkill: a.knowledgeAndSkill || null,
            note: a.note || null,
          })),
          materials: value.materials.filter((m) => m.description).map((m) => ({
            description: m.description,
            author: m.author || null,
            publisher: m.publisher || null,
            isMainMaterial: m.isMainMaterial || null,
            publishedDate: m.publishedDate || null,
            edition: m.edition || null,
            isbn: m.isbn || null,
            isHardCopy: m.isHardCopy || null,
            isOnline: m.isOnline || null,
            note: m.note || null,
          })),
        });

        notifications.show({
          title: "Thành công",
          message: `Đã tạo syllabus "${syllabus.syllabusName}"`,
          color: "green",
        });
        router.push("/teacher/syllabus");
      } catch (err: any) {
        notifications.show({
          title: "Lỗi",
          message: err?.message || "Không thể tạo syllabus",
          color: "red",
        });
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Subscribed values (for non-Field reactive logic)
  const values = useStore(form.store, (s) => s.values);

  // --- Validation helpers ---
  const step1Valid =
    values.courseId && values.syllabusName.trim() && values.credits > 0;

  const totalWeight = values.assessments.reduce((sum, a) => sum + a.weight, 0);
  const weightValid = totalWeight === 100;

  const handleStepClick = (step: number) => {
    if (step > 0 && !step1Valid) {
      notifications.show({
        title: "Thiếu thông tin",
        message: "Hoàn thành Bước 1 trước",
        color: "red",
      });
      return;
    }
    setActiveStep(step);
  };

  const nextStep = () => {
    if (activeStep === 0 && !step1Valid) {
      notifications.show({
        title: "Thiếu thông tin bắt buộc",
        message: "Nhập Môn học, Tên syllabus, Số tín chỉ",
        color: "red",
      });
      return;
    }
    setActiveStep((prev) => Math.min(prev + 1, 4));
  };

  const prevStep = () => setActiveStep((prev) => Math.max(prev - 1, 0));

  // --- Array mutation helpers ---
  const addClo = () => form.setFieldValue("clos", [...values.clos, emptyClo()]);
  const removeClo = (i: number) => form.setFieldValue("clos", values.clos.filter((_, idx) => idx !== i));

  const addSchedule = () => {
    const next = values.schedules.length + 1;
    form.setFieldValue("schedules", [...values.schedules, emptySchedule(next)]);
  };
  const removeSchedule = (i: number) =>
    form.setFieldValue("schedules", values.schedules.filter((_, idx) => idx !== i));

  const addAssessment = () =>
    form.setFieldValue("assessments", [...values.assessments, emptyAssessment()]);
  const removeAssessment = (i: number) =>
    form.setFieldValue("assessments", values.assessments.filter((_, idx) => idx !== i));

  const addMaterial = () =>
    form.setFieldValue("materials", [...values.materials, emptyMaterial()]);
  const removeMaterial = (i: number) =>
    form.setFieldValue("materials", values.materials.filter((_, idx) => idx !== i));

  // --- Submit handler ---
  const handleSave = () => {
    if (!weightValid) return;
    form.handleSubmit();
  };

  // --- Inline field builders ---
  function Ftext(name: string, label: string, placeholder: string, required?: boolean) {
    return (
      <form.Field name={name as any}>
        {(f: any) => (
          <TextInput
            label={label} placeholder={placeholder} required={required} radius={0}
            value={f.state.value ?? ""}
            onChange={(e) => f.handleChange(e.target.value)}
            error={f.state.meta.errors?.[0]}
          />
        )}
      </form.Field>
    );
  }

  function Fnum(name: string, label: string, min: number, max?: number, required?: boolean) {
    return (
      <form.Field name={name as any}>
        {(f: any) => (
          <NumberInput
            label={label} required={required} radius={0} min={min} max={max}
            value={f.state.value ?? 0}
            onChange={(val) => f.handleChange(val ?? 0)}
            error={f.state.meta.errors?.[0]}
          />
        )}
      </form.Field>
    );
  }

  function Farea(name: string, label: string, placeholder: string) {
    return (
      <form.Field name={name as any}>
        {(f: any) => (
          <Textarea
            label={label} placeholder={placeholder} radius={0} rows={3}
            value={f.state.value ?? ""}
            onChange={(e) => f.handleChange(e.target.value)}
            error={f.state.meta.errors?.[0]}
          />
        )}
      </form.Field>
    );
  }

  function Fselect(name: string, label: string, data: { value: string; label: string }[], placeholder?: string, required?: boolean) {
    return (
      <form.Field name={name as any}>
        {(f: any) => (
          <Select
            label={label} placeholder={placeholder} required={required} radius={0}
            data={data} searchable
            value={f.state.value ?? ""}
            onChange={(val) => f.handleChange(val ?? "")}
            error={f.state.meta.errors?.[0]}
          />
        )}
      </form.Field>
    );
  }

  // --- Content per step ---
  const stepContent = [
    // Step 0: Metadata
    <Card key="step0" p="xl" radius={0} style={{ border: "1px solid #E2E8F0", backgroundColor: "white", marginTop: 24 }}>
      <Stack gap="md">
        <Title order={2} style={{ fontSize: 16, fontWeight: 900, color: "#1A1A1A" }}>
          Thông tin chung (Metadata)
        </Title>
        <LoadingOverlay visible={coursesLoading} />
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          {Fselect("courseId", "Môn học", courses.map((c) => ({ value: c.id, label: `${c.code} - ${c.name}` })), "Chọn môn học...", true)}
          {Ftext("syllabusName", "Tên syllabus", "VD: Front-End Web Development with React", true)}
          {Ftext("syllabusNameEnglish", "English Name", "VD: Front-End Web Development with React")}
          {Fnum("credits", "Số tín chỉ (Credits)", 1, undefined, true)}
          {Ftext("prerequisites", "Điều kiện tiên quyết", "VD: WED201c")}
        </SimpleGrid>
        {Farea("description", "Mô tả môn học", "Nhập mô tả chi tiết học phần...")}
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          {Ftext("studentTasks", "Nhiệm vụ sinh viên", "VD: Làm bài tập, đi học đầy đủ")}
          {Ftext("tools", "Công cụ học tập", "VD: VS Code, Node.js")}
          {Fnum("minAvgMarkToPass", "Điểm qua môn tối thiểu", 1)}
          {Ftext("scoringScale", "Thang điểm", "10")}
          {Fselect("degreeLevel", "Bậc đào tạo", [
            { value: "Bachelor", label: "Bachelor" },
            { value: "Master", label: "Master" },
            { value: "PhD", label: "PhD" },
          ])}
          {Ftext("decisionNo", "Số quyết định", "VD: 359/QĐ-ĐHFPT")}
        </SimpleGrid>
        {Farea("timeAllocation", "Phân bổ thời gian", "VD: 150h = 30h lý thuyết + ...")}
        {Farea("note", "Ghi chú", "Nhập ghi chú...")}
      </Stack>
    </Card>,

    // Step 1: CLOs
    <Card key="step1" p="xl" radius={0} style={{ border: "1px solid #E2E8F0", backgroundColor: "white", marginTop: 24 }}>
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={2} style={{ fontSize: 16, fontWeight: 900, color: "#1A1A1A" }}>
            Chuẩn đầu ra môn học (CLOs)
          </Title>
          <Button variant="subtle" color="#1A3A5C" onClick={addClo} leftSection={<IconPlus size={16} />} fw={700} size="xs">
            Thêm CLO
          </Button>
        </Group>
        {values.clos.length === 0 && <Text c="dimmed" size="sm">Chưa có CLO nào. Bấm "Thêm CLO" để bắt đầu.</Text>}
        {values.clos.map((clo, i) => (
          <Card key={i} p="sm" radius={0} withBorder style={{ borderColor: "#E2E8F0" }}>
            <Stack gap="sm">
              <Group justify="space-between">
                <Text fw={700} size="sm">CLO #{i + 1}</Text>
                <ActionIcon variant="subtle" color="red" size="sm" onClick={() => removeClo(i)}>
                  <IconTrash size={14} />
                </ActionIcon>
              </Group>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                {Ftext(`clos[${i}].cloName`, "Mã CLO", `VD: CLO${i + 1}`)}
                {Farea(`clos[${i}].cloDetails`, "Mô tả CLO", "Mô tả chi tiết...")}
              </SimpleGrid>
              {Ftext(`clos[${i}].loDetails`, "Ánh xạ LO", "VD: LO1, LO2,...")}
            </Stack>
          </Card>
        ))}
      </Stack>
    </Card>,

    // Step 2: Schedule
    <Card key="step2" p="xl" radius={0} style={{ border: "1px solid #E2E8F0", backgroundColor: "white", marginTop: 24 }}>
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={2} style={{ fontSize: 16, fontWeight: 900, color: "#1A1A1A" }}>
            Lịch trình học tập (Schedule)
          </Title>
          <Button variant="subtle" color="#1A3A5C" onClick={addSchedule} leftSection={<IconPlus size={16} />} fw={700} size="xs">
            Thêm buổi học
          </Button>
        </Group>
        {values.schedules.length === 0 && <Text c="dimmed" size="sm">Chưa có lịch trình. Bấm "Thêm buổi học" để bắt đầu.</Text>}
        {values.schedules.map((s, i) => (
          <Card key={i} p="sm" radius={0} withBorder style={{ borderColor: "#E2E8F0" }}>
            <Stack gap="sm">
              <Group justify="space-between">
                <Text fw={700} size="sm">Buổi {s.session}</Text>
                <ActionIcon variant="subtle" color="red" size="sm" onClick={() => removeSchedule(i)}>
                  <IconTrash size={14} />
                </ActionIcon>
              </Group>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                {Ftext(`schedules[${i}].topic`, "Chủ đề", "Nhập chủ đề buổi học...")}
                {Ftext(`schedules[${i}].learningMethod`, "Hình thức", "VD: Online, Offline")}
              </SimpleGrid>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                {Ftext(`schedules[${i}].lo`, "Đáp ứng CLO", "VD: CLO1")}
                {Ftext(`schedules[${i}].studentTasks`, "Nhiệm vụ SV", "VD: Đọc slide...")}
              </SimpleGrid>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                {Fselect(`schedules[${i}].itu`, "Mức độ giảng dạy (ITU)", [
                  { value: "I", label: "I - Introduce" },
                  { value: "T", label: "T - Teach" },
                  { value: "U", label: "U - Utilize" },
                  { value: "IT", label: "IT (Combo)" },
                  { value: "T,U", label: "T,U (Combo)" },
                ])}
                {Ftext(`schedules[${i}].sDownload`, "Tài liệu download", "Link hoặc mô tả...")}
              </SimpleGrid>
              {Farea(`schedules[${i}].studentMaterials`, "Học liệu cho SV", "Mô tả tài liệu sinh viên cần xem...")}
              {Farea(`schedules[${i}].urls`, "URLs tham khảo", "Link video, slide...")}
            </Stack>
          </Card>
        ))}
      </Stack>
    </Card>,

    // Step 3: Assessment
    <Card key="step3" p="xl" radius={0} style={{ border: "1px solid #E2E8F0", backgroundColor: "white", marginTop: 24 }}>
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={2} style={{ fontSize: 16, fontWeight: 900, color: "#1A1A1A" }}>
            Cơ cấu đánh giá (Assessment)
          </Title>
          <Button variant="subtle" color="#1A3A5C" onClick={addAssessment} leftSection={<IconPlus size={16} />} fw={700} size="xs">
            Thêm cột điểm
          </Button>
        </Group>

        {totalWeight !== 100 && (
          <Alert icon={<IconAlertCircle size={18} />} title="Cảnh báo trọng số" color="yellow" radius={0}>
            Tổng trọng số {totalWeight}%. Cần đúng 100% để lưu.
          </Alert>
        )}

        <Box style={{ overflowX: "auto" }}>
        <Table highlightOnHover striped withTableBorder>
          <Table.Thead style={{ backgroundColor: "#F8FAFC" }}>
            <Table.Tr>
              <Table.Th style={{ fontWeight: 700, fontSize: 11, color: "#475569", whiteSpace: "nowrap" }}>Thành phần</Table.Th>
              <Table.Th style={{ fontWeight: 700, fontSize: 11, color: "#475569", whiteSpace: "nowrap" }}>Loại</Table.Th>
              <Table.Th style={{ width: 60, fontWeight: 700, fontSize: 11, color: "#475569", whiteSpace: "nowrap" }}>Part</Table.Th>
              <Table.Th style={{ width: 90, fontWeight: 700, fontSize: 11, color: "#475569", whiteSpace: "nowrap" }}>Trọng số (%)</Table.Th>
              <Table.Th style={{ width: 80, fontWeight: 700, fontSize: 11, color: "#475569", whiteSpace: "nowrap" }}>CLO</Table.Th>
              <Table.Th style={{ width: 150, fontWeight: 700, fontSize: 11, color: "#475569", whiteSpace: "nowrap" }}>Tiêu chí hoàn thành</Table.Th>
              <Table.Th style={{ width: 80, fontWeight: 700, fontSize: 11, color: "#475569", whiteSpace: "nowrap" }}>Duration</Table.Th>
              <Table.Th style={{ width: 100, fontWeight: 700, fontSize: 11, color: "#475569", whiteSpace: "nowrap" }}>Question Type</Table.Th>
              <Table.Th style={{ width: 60, fontWeight: 700, fontSize: 11, color: "#475569", whiteSpace: "nowrap" }}>No.</Table.Th>
              <Table.Th style={{ width: 120, fontWeight: 700, fontSize: 11, color: "#475569", whiteSpace: "nowrap" }}>Grading Guide</Table.Th>
              <Table.Th style={{ width: 100, fontWeight: 700, fontSize: 11, color: "#475569", whiteSpace: "nowrap" }}>Note</Table.Th>
              <Table.Th style={{ width: 50, fontWeight: 700, fontSize: 11, color: "#475569", whiteSpace: "nowrap" }}>Xóa</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {values.assessments.map((a, i) => (
              <Table.Tr key={i}>
                <Table.Td>
                  <form.Field name={`assessments[${i}].category`}>
                    {(f: any) => (
                      <TextInput
                        value={f.state.value}
                        onChange={(e) => f.handleChange(e.target.value)}
                        radius={0}
                        styles={{ input: { border: "1px solid transparent", fontSize: 12, padding: "4px 6px", "&:focus": { borderColor: "#1A3A5C" } } }}
                      />
                    )}
                  </form.Field>
                </Table.Td>
                <Table.Td>
                  <form.Field name={`assessments[${i}].type`}>
                    {(f: any) => (
                      <Select
                        data={[
                          { value: "on-going", label: "On-going" },
                          { value: "final exam", label: "Final Exam" },
                        ]}
                        value={f.state.value}
                        onChange={(val) => f.handleChange(val ?? "on-going")}
                        radius={0}
                        styles={{ input: { border: "1px solid transparent", fontSize: 12, padding: "4px 6px", "&:focus": { borderColor: "#1A3A5C" } } }}
                      />
                    )}
                  </form.Field>
                </Table.Td>
                <Table.Td>
                  <form.Field name={`assessments[${i}].part`}>
                    {(f: any) => (
                      <TextInput
                        value={f.state.value || ""}
                        onChange={(e) => f.handleChange(e.target.value)}
                        radius={0}
                        styles={{ input: { border: "1px solid transparent", fontSize: 12, padding: "4px 6px", minWidth: 50, "&:focus": { borderColor: "#1A3A5C" } } }}
                      />
                    )}
                  </form.Field>
                </Table.Td>
                <Table.Td>
                  <form.Field name={`assessments[${i}].weight`}>
                    {(f: any) => (
                      <NumberInput
                        value={f.state.value}
                        onChange={(val) => f.handleChange(val as number)}
                        radius={0}
                        min={0}
                        max={100}
                        styles={{ input: { fontSize: 12, padding: "4px 6px" } }}
                      />
                    )}
                  </form.Field>
                </Table.Td>
                <Table.Td>
                  <form.Field name={`assessments[${i}].clo`}>
                    {(f: any) => (
                      <TextInput
                        value={f.state.value}
                        onChange={(e) => f.handleChange(e.target.value)}
                        radius={0}
                        styles={{ input: { border: "1px solid transparent", fontSize: 12, padding: "4px 6px", minWidth: 60, "&:focus": { borderColor: "#1A3A5C" } } }}
                      />
                    )}
                  </form.Field>
                </Table.Td>
                <Table.Td>
                  <form.Field name={`assessments[${i}].completionCriteria`}>
                    {(f: any) => (
                      <TextInput
                        value={f.state.value || ""}
                        onChange={(e) => f.handleChange(e.target.value)}
                        radius={0}
                        styles={{ input: { border: "1px solid transparent", fontSize: 12, padding: "4px 6px", minWidth: 120, "&:focus": { borderColor: "#1A3A5C" } } }}
                      />
                    )}
                  </form.Field>
                </Table.Td>
                <Table.Td>
                  <form.Field name={`assessments[${i}].duration`}>
                    {(f: any) => (
                      <TextInput
                        value={f.state.value || ""}
                        onChange={(e) => f.handleChange(e.target.value)}
                        radius={0}
                        styles={{ input: { border: "1px solid transparent", fontSize: 12, padding: "4px 6px", minWidth: 60, "&:focus": { borderColor: "#1A3A5C" } } }}
                      />
                    )}
                  </form.Field>
                </Table.Td>
                <Table.Td>
                  <form.Field name={`assessments[${i}].questionType`}>
                    {(f: any) => (
                      <TextInput
                        value={f.state.value || ""}
                        onChange={(e) => f.handleChange(e.target.value)}
                        radius={0}
                        styles={{ input: { border: "1px solid transparent", fontSize: 12, padding: "4px 6px", minWidth: 80, "&:focus": { borderColor: "#1A3A5C" } } }}
                      />
                    )}
                  </form.Field>
                </Table.Td>
                <Table.Td>
                  <form.Field name={`assessments[${i}].noQuestion`}>
                    {(f: any) => (
                      <TextInput
                        value={f.state.value || ""}
                        onChange={(e) => f.handleChange(e.target.value)}
                        radius={0}
                        styles={{ input: { border: "1px solid transparent", fontSize: 12, padding: "4px 6px", minWidth: 40, "&:focus": { borderColor: "#1A3A5C" } } }}
                      />
                    )}
                  </form.Field>
                </Table.Td>
                <Table.Td>
                  <form.Field name={`assessments[${i}].gradingGuide`}>
                    {(f: any) => (
                      <TextInput
                        value={f.state.value || ""}
                        onChange={(e) => f.handleChange(e.target.value)}
                        radius={0}
                        styles={{ input: { border: "1px solid transparent", fontSize: 12, padding: "4px 6px", minWidth: 100, "&:focus": { borderColor: "#1A3A5C" } } }}
                      />
                    )}
                  </form.Field>
                </Table.Td>
                <Table.Td>
                  <form.Field name={`assessments[${i}].note`}>
                    {(f: any) => (
                      <TextInput
                        value={f.state.value || ""}
                        onChange={(e) => f.handleChange(e.target.value)}
                        radius={0}
                        styles={{ input: { border: "1px solid transparent", fontSize: 12, padding: "4px 6px", minWidth: 80, "&:focus": { borderColor: "#1A3A5C" } } }}
                      />
                    )}
                  </form.Field>
                </Table.Td>
                <Table.Td style={{ textAlign: "center" }}>
                  <ActionIcon variant="subtle" color="red" onClick={() => removeAssessment(i)}>
                    <IconTrash size={14} />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
            <Table.Tr style={{ backgroundColor: "#F1F5F9", fontWeight: "bold" }}>
              <Table.Td style={{ fontSize: 13, textAlign: "right" }} colSpan={3}>Tổng cộng:</Table.Td>
              <Table.Td style={{ fontSize: 13, color: totalWeight === 100 ? "#16A34A" : "#DC2626", fontWeight: 800 }}>
                {totalWeight}%
              </Table.Td>
              <Table.Td></Table.Td>
              <Table.Td></Table.Td>
              <Table.Td></Table.Td>
              <Table.Td></Table.Td>
              <Table.Td></Table.Td>
              <Table.Td></Table.Td>
              <Table.Td></Table.Td>
              <Table.Td></Table.Td>
              <Table.Td></Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
        </Box>
      </Stack>
    </Card>,

    // Step 4: Materials
    <Card key="step4" p="xl" radius={0} style={{ border: "1px solid #E2E8F0", backgroundColor: "white", marginTop: 24 }}>
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={2} style={{ fontSize: 16, fontWeight: 900, color: "#1A1A1A" }}>
            Tài liệu học tập (Materials)
          </Title>
          <Button variant="subtle" color="#1A3A5C" onClick={addMaterial} leftSection={<IconPlus size={16} />} fw={700} size="xs">
            Thêm tài liệu
          </Button>
        </Group>
        {values.materials.length === 0 && <Text c="dimmed" size="sm">Chưa có tài liệu. Bấm "Thêm tài liệu" để bắt đầu.</Text>}
        {values.materials.map((m, i) => (
          <Card key={i} p="sm" radius={0} withBorder style={{ borderColor: "#E2E8F0" }}>
            <Stack gap="sm">
              <Group justify="space-between">
                <Text fw={700} size="sm">Tài liệu #{i + 1}</Text>
                <ActionIcon variant="subtle" color="red" size="sm" onClick={() => removeMaterial(i)}>
                  <IconTrash size={14} />
                </ActionIcon>
              </Group>
              {Ftext(`materials[${i}].description`, "Mô tả tài liệu", "VD: Textbook name", true)}
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                {Ftext(`materials[${i}].author`, "Tác giả", "VD: John Doe")}
                {Ftext(`materials[${i}].publisher`, "Nhà xuất bản", "VD: NXB Giáo dục")}
              </SimpleGrid>
              {Fselect(`materials[${i}].isMainMaterial`, "Loại", [
                { value: "Main", label: "Giáo trình chính (Main)" },
                { value: "Reference", label: "Tài liệu tham khảo (Reference)" },
              ])}
              <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
                {Ftext(`materials[${i}].publishedDate`, "Ngày xuất bản", "VD: 2021")}
                {Ftext(`materials[${i}].edition`, "Phiên bản", "VD: 4th Edition")}
                {Ftext(`materials[${i}].isbn`, "ISBN", "VD: 978-0136886099")}
              </SimpleGrid>
              <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
                {Fselect(`materials[${i}].isHardCopy`, "Bản cứng", [
                  { value: "Có", label: "Có" },
                  { value: "Không", label: "Không" },
                ])}
                {Fselect(`materials[${i}].isOnline`, "Online", [
                  { value: "Có", label: "Có" },
                  { value: "Không", label: "Không" },
                ])}
              </SimpleGrid>
              {Ftext(`materials[${i}].note`, "Ghi chú", "Ghi chú thêm...")}
            </Stack>
          </Card>
        ))}
      </Stack>
    </Card>,
  ];

  return (
    <Stack gap="xl" style={{ maxWidth: 1000, margin: "0 auto" }}>
      {/* Header */}
      <Group gap="md">
        <ActionIcon component={Link} href="/teacher/syllabus" variant="subtle" color="gray" size="lg">
          <IconArrowLeft size={20} />
        </ActionIcon>
        <div>
          <Title order={1} style={{ fontSize: 24, fontWeight: 900, color: "#1A3A5C" }}>
            Tạo Syllabus Mới
          </Title>
          <Text size="sm" c="dimmed">Hoàn thành 5 bước để tạo bản nháp đề cương môn học</Text>
        </div>
      </Group>

      {/* Quick-fill demo data */}
      <Card p="sm" radius={0} style={{ border: "1px solid #E2E8F0", backgroundColor: "#FAFBFC" }}>
        <Group gap="sm" align="end">
          <div style={{ flex: 1 }}>
            <Select
              label="Điền nhanh dữ liệu mẫu"
              placeholder="Chọn bộ data..."
              radius={0}
              data={Object.keys(DEMO_DATASETS).map((k) => ({
                value: k,
                label: `${k} — ${DEMO_DATASETS[k as DemoDatasetKey].syllabusName}`,
              }))}
              value={demoKey}
              onChange={(val) => setDemoKey((val as DemoDatasetKey) || "FER202")}
            />
          </div>
          <Button
            leftSection={<IconRocket size={16} />}
            style={{ backgroundColor: "#1A3A5C" }}
            radius={0}
            fw={700}
            onClick={() => handleQuickFill(demoKey)}
          >
            Điền nhanh
          </Button>
        </Group>
      </Card>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {/* Stepper */}
        <Stepper active={activeStep} onStepClick={handleStepClick} radius={0} color="#1A3A5C"
          styles={{ stepIcon: { borderRadius: 0 } }}
        >
          <Stepper.Step label="Metadata" description="Thông tin chung">{stepContent[0]}</Stepper.Step>
          <Stepper.Step label="CLOs" description="Chuẩn đầu ra">{stepContent[1]}</Stepper.Step>
          <Stepper.Step label="Schedule" description="Lịch trình">{stepContent[2]}</Stepper.Step>
          <Stepper.Step label="Assessment" description="Đánh giá">{stepContent[3]}</Stepper.Step>
          <Stepper.Step label="Materials" description="Tài liệu">{stepContent[4]}</Stepper.Step>
        </Stepper>

        {/* Controls */}
        <Group justify="space-between" mt="xl">
          <Button variant="outline" color="gray" radius={0} onClick={prevStep} disabled={activeStep === 0} fw={700}>
            Quay lại
          </Button>
          {activeStep < 4 ? (
            <Button onClick={nextStep} style={{ backgroundColor: "#1A3A5C" }} radius={0} fw={700}>
              Tiếp tục
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              disabled={!weightValid || submitting}
              style={{ backgroundColor: "#F26F21" }}
              radius={0}
              fw={700}
              leftSection={<IconCheck size={18} />}
              loading={submitting}
            >
              {submitting ? "Đang lưu..." : "LƯU BẢN NHÁP"}
            </Button>
          )}
        </Group>
      </form>
    </Stack>
  );
}

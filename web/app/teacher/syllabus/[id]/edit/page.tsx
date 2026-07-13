"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
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
  Alert,
  ActionIcon,
  SimpleGrid,
  Select,
  LoadingOverlay,
  Box,
  Badge,
  Progress,
  Tooltip,
  Collapse,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconArrowLeft,
  IconCheck,
  IconAlertCircle,
  IconPlus,
  IconTrash,
  IconChevronDown,
  IconChevronUp,
  IconCopy,
} from "@tabler/icons-react";
import {
  getSyllabusDetail,
  updateSyllabusFull,
  getCourses,
  type ApiCourse,
  type UpdateSyllabusFullPayload,
} from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

interface SyllabusFormValues {
  courseId: string;
  syllabusName: string;
  syllabusNameEnglish: string;
  credits: number;
  prerequisites: string;
  description: string;
  studentTasks: string;
  tools: string;
  scoringScale: string;
  minAvgMarkToPass: number;
  decisionNo: string;
  note: string;
  degreeLevel: string;
  timeAllocation: string;
  clos: CloRow[];
  schedules: ScheduleRow[];
  assessments: AssessmentRow[];
  materials: MaterialRow[];
}

export default function EditSyllabusPage() {
  const params = useParams();
  const syllabusId = Number(params.id);

  const coursesQuery = useQuery({
    queryKey: ["courses"],
    queryFn: () => getCourses(),
  });

  const syllabusQuery = useQuery({
    queryKey: ["syllabus-edit", syllabusId],
    queryFn: () => getSyllabusDetail(syllabusId),
    enabled: !!syllabusId,
  });

  const initialValues = useMemo<SyllabusFormValues | null>(() => {
    if (!syllabusQuery.data) return null;
    const s = syllabusQuery.data.syllabus;
    return {
      courseId: s.courseId,
      syllabusName: s.syllabusName,
      syllabusNameEnglish: s.syllabusNameEnglish || "",
      credits: s.credits,
      prerequisites: s.prerequisites || "",
      description: s.description || "",
      studentTasks: s.studentTasks || "",
      tools: s.tools || "",
      scoringScale: s.scoringScale || "10",
      minAvgMarkToPass: s.minAvgMarkToPass ? parseFloat(s.minAvgMarkToPass) : 5,
      decisionNo: s.decisionNo || "",
      note: s.note || "",
      degreeLevel: s.degreeLevel || "Bachelor",
      timeAllocation: s.timeAllocation || "",
      clos: s.clos.map((c) => ({
        cloName: c.cloName,
        cloDetails: c.cloDetails,
        loDetails: c.loDetails || "",
      })) as CloRow[],
      schedules: s.schedules.map((sc) => ({
        session: sc.session,
        topic: sc.topic,
        learningMethod: sc.learningMethod || "",
        lo: sc.lo || "",
        studentTasks: sc.studentTasks || "",
        itu: sc.itu || "",
        studentMaterials: sc.studentMaterials || "",
        sDownload: sc.sDownload || "",
        urls: sc.urls || "",
      })) as ScheduleRow[],
      assessments: s.assessments.map((a) => ({
        category: a.category,
        type: a.type || "on-going",
        part: a.part || "",
        weight: typeof a.weight === "string" ? parseFloat(a.weight) : a.weight,
        completionCriteria: a.completionCriteria || "",
        duration: a.duration || "",
        clo: a.clo || "",
        questionType: a.questionType || "",
        noQuestion: a.noQuestion || "",
        knowledgeAndSkill: a.knowledgeAndSkill || "",
        gradingGuide: a.gradingGuide || "",
        note: a.note || "",
      })) as AssessmentRow[],
      materials: s.materials.map((m) => ({
        description: m.description,
        author: m.author || "",
        publisher: m.publisher || "",
        publishedDate: m.publishedDate || "",
        edition: m.edition || "",
        isbn: m.isbn || "",
        isMainMaterial: m.isMainMaterial || "Main",
        isHardCopy: m.isHardCopy || "Không",
        isOnline: m.isOnline || "Có",
        note: m.note || "",
      })) as MaterialRow[],
    };
  }, [syllabusQuery.data]);

  if (coursesQuery.isPending || syllabusQuery.isPending || !initialValues) {
    return (
      <Box style={{ position: "relative", minHeight: 400 }}>
        <LoadingOverlay visible={true} />
      </Box>
    );
  }

  return (
    <EditSyllabusForm
      syllabusId={syllabusId}
      initialValues={initialValues}
      courses={coursesQuery.data?.courses ?? []}
    />
  );
}

interface EditSyllabusFormProps {
  syllabusId: number;
  initialValues: SyllabusFormValues;
  courses: ApiCourse[];
}

function EditSyllabusForm({ syllabusId, initialValues, courses }: EditSyllabusFormProps) {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [expandedAssessments, setExpandedAssessments] = useState<Record<number, boolean>>({});
  const [expandedSchedules, setExpandedSchedules] = useState<Record<number, boolean>>({});
  const [expandedClos, setExpandedClos] = useState<Record<number, boolean>>({});
  const [expandedMaterials, setExpandedMaterials] = useState<Record<number, boolean>>({});

  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateSyllabusFullPayload) => updateSyllabusFull(syllabusId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["syllabus-edit", syllabusId] });
      notifications.show({
        title: "Thành công",
        message: `Đã cập nhật syllabus "${variables.syllabusName}"`,
        color: "green",
      });
      router.push("/teacher/syllabus");
    },
    onError: (err: any) => {
      notifications.show({
        title: "Lỗi",
        message: err?.message || "Không thể cập nhật syllabus",
        color: "red",
      });
    },
  });

  const form = useForm({
    defaultValues: initialValues,
    onSubmit: async ({ value }) => {
      const payload: UpdateSyllabusFullPayload = {
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
      };

      updateMutation.mutate(payload);
    },
  });

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
  const addClo = () => {
    const nextIdx = values.clos.length;
    form.setFieldValue("clos", [...values.clos, emptyClo()]);
    setExpandedClos((prev) => ({ ...prev, [nextIdx]: true }));
  };

  const removeClo = (i: number) => {
    form.setFieldValue("clos", values.clos.filter((_, idx) => idx !== i));
    setExpandedClos((prev) => {
      const next: Record<number, boolean> = {};
      Object.keys(prev).forEach((k) => {
        const idx = parseInt(k, 10);
        if (idx < i) {
          next[idx] = prev[idx];
        } else if (idx > i) {
          next[idx - 1] = prev[idx];
        }
      });
      return next;
    });
  };

  const toggleExpandClo = (i: number) => {
    setExpandedClos((prev) => ({
      ...prev,
      [i]: prev[i] === false ? true : false,
    }));
  };

  const expandAllClos = () => {
    const next: Record<number, boolean> = {};
    values.clos.forEach((_, idx) => {
      next[idx] = true;
    });
    setExpandedClos(next);
  };

  const collapseAllClos = () => {
    const next: Record<number, boolean> = {};
    values.clos.forEach((_, idx) => {
      next[idx] = false;
    });
    setExpandedClos(next);
  };

  const addSchedule = () => {
    const next = values.schedules.length + 1;
    const nextIdx = values.schedules.length;
    form.setFieldValue("schedules", [...values.schedules, emptySchedule(next)]);
    setExpandedSchedules((prev) => ({ ...prev, [nextIdx]: true }));
  };

  const removeSchedule = (i: number) => {
    form.setFieldValue("schedules", values.schedules.filter((_, idx) => idx !== i));
    setExpandedSchedules((prev) => {
      const next: Record<number, boolean> = {};
      Object.keys(prev).forEach((k) => {
        const idx = parseInt(k, 10);
        if (idx < i) {
          next[idx] = prev[idx];
        } else if (idx > i) {
          next[idx - 1] = prev[idx];
        }
      });
      return next;
    });
  };

  const toggleExpandSchedule = (i: number) => {
    setExpandedSchedules((prev) => ({
      ...prev,
      [i]: prev[i] === false ? true : false,
    }));
  };

  const expandAllSchedules = () => {
    const next: Record<number, boolean> = {};
    values.schedules.forEach((_, idx) => {
      next[idx] = true;
    });
    setExpandedSchedules(next);
  };

  const collapseAllSchedules = () => {
    const next: Record<number, boolean> = {};
    values.schedules.forEach((_, idx) => {
      next[idx] = false;
    });
    setExpandedSchedules(next);
  };

  const addAssessment = () => {
    const nextIdx = values.assessments.length;
    form.setFieldValue("assessments", [...values.assessments, emptyAssessment()]);
    setExpandedAssessments((prev) => ({ ...prev, [nextIdx]: true }));
  };

  const removeAssessment = (i: number) => {
    form.setFieldValue("assessments", values.assessments.filter((_, idx) => idx !== i));
    setExpandedAssessments((prev) => {
      const next: Record<number, boolean> = {};
      Object.keys(prev).forEach((k) => {
        const idx = parseInt(k, 10);
        if (idx < i) {
          next[idx] = prev[idx];
        } else if (idx > i) {
          next[idx - 1] = prev[idx];
        }
      });
      return next;
    });
  };

  const duplicateAssessment = (i: number) => {
    const copy = { ...values.assessments[i] };
    const nextIdx = values.assessments.length;
    form.setFieldValue("assessments", [...values.assessments, copy]);
    setExpandedAssessments((prev) => ({ ...prev, [nextIdx]: true }));
    notifications.show({
      title: "Đã sao chép",
      message: `Đã nhân bản thành phần "${copy.category || "Chưa đặt tên"}"`,
      color: "blue",
    });
  };

  const toggleExpand = (i: number) => {
    setExpandedAssessments((prev) => ({
      ...prev,
      [i]: prev[i] === false ? true : false,
    }));
  };

  const expandAll = () => {
    const next: Record<number, boolean> = {};
    values.assessments.forEach((_, idx) => {
      next[idx] = true;
    });
    setExpandedAssessments(next);
  };

  const collapseAll = () => {
    const next: Record<number, boolean> = {};
    values.assessments.forEach((_, idx) => {
      next[idx] = false;
    });
    setExpandedAssessments(next);
  };

  const addMaterial = () => {
    const nextIdx = values.materials.length;
    form.setFieldValue("materials", [...values.materials, emptyMaterial()]);
    setExpandedMaterials((prev) => ({ ...prev, [nextIdx]: true }));
  };

  const removeMaterial = (i: number) => {
    form.setFieldValue("materials", values.materials.filter((_, idx) => idx !== i));
    setExpandedMaterials((prev) => {
      const next: Record<number, boolean> = {};
      Object.keys(prev).forEach((k) => {
        const idx = parseInt(k, 10);
        if (idx < i) {
          next[idx] = prev[idx];
        } else if (idx > i) {
          next[idx - 1] = prev[idx];
        }
      });
      return next;
    });
  };

  const toggleExpandMaterial = (i: number) => {
    setExpandedMaterials((prev) => ({
      ...prev,
      [i]: prev[i] === false ? true : false,
    }));
  };

  const expandAllMaterials = () => {
    const next: Record<number, boolean> = {};
    values.materials.forEach((_, idx) => {
      next[idx] = true;
    });
    setExpandedMaterials(next);
  };

  const collapseAllMaterials = () => {
    const next: Record<number, boolean> = {};
    values.materials.forEach((_, idx) => {
      next[idx] = false;
    });
    setExpandedMaterials(next);
  };

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

  function Farea(name: string, label: string, placeholder: string, rows: number = 3) {
    return (
      <form.Field name={name as any}>
        {(f: any) => (
          <Textarea
            label={label} placeholder={placeholder} radius={0} rows={rows}
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
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          {Fselect("courseId", "Môn học", courses.map((c) => ({ value: c.id, label: `${c.code} - ${c.name}` })), "Chọn môn học...", true)}
          {Ftext("syllabusName", "Tên syllabus", "VD: Front-End Web Development with React", true)}
          {Ftext("syllabusNameEnglish", "Tên syllabus trong tiếng anh", "VD: Front-End Web Development with React")}
          {Fnum("credits", "Số tín chỉ (Credits)", 1, undefined, true)}
          {Ftext("prerequisites", "Điều kiện tiên quyết", "VD: WED201c")}
        </SimpleGrid>
        {Farea("description", "Mô tả môn học", "Nhập mô tả chi tiết học phần...", 5)}
        {Farea("studentTasks", "Nhiệm vụ sinh viên", "VD: Làm bài tập đầy đủ, tham gia thảo luận trên lớp...", 5)}
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
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
        {Farea("timeAllocation", "Phân bổ thời gian", "VD: 150h = 30h lý thuyết + ...", 5)}
        {Farea("note", "Ghi chú", "Nhập ghi chú...")}
      </Stack>
    </Card>,

    // Step 1: CLOs
    <Card key="step1" p="xl" radius={0} style={{ border: "1px solid #E2E8F0", backgroundColor: "white", marginTop: 24 }}>
      <Stack gap="lg">
        {/* Toolbar */}
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <Title order={2} style={{ fontSize: 16, fontWeight: 900, color: "#1A1A1A" }}>
              Chuẩn đầu ra môn học ({values.clos.length} CLO)
            </Title>
          </Group>
          <Group gap="xs">
            <Button variant="outline" color="gray" size="xs" radius={0} onClick={collapseAllClos} leftSection={<IconChevronDown size={14} />}>
              Thu gọn tất cả
            </Button>
            <Button variant="outline" color="gray" size="xs" radius={0} onClick={expandAllClos} leftSection={<IconChevronUp size={14} />}>
              Mở rộng tất cả
            </Button>
            <Button style={{ backgroundColor: "#1A3A5C" }} size="xs" radius={0} onClick={addClo} leftSection={<IconPlus size={14} />}>
              Thêm CLO
            </Button>
          </Group>
        </Group>

        {/* List of CLOs */}
        {values.clos.length === 0 ? (
          <Card p="xl" radius={0} withBorder style={{ borderStyle: "dashed", textAlign: "center" }}>
            <Text c="dimmed" size="sm">Chưa có chuẩn đầu ra (CLO) nào. Bấm nút "Thêm CLO" để bắt đầu.</Text>
          </Card>
        ) : (
          <Stack gap="md">
            {values.clos.map((clo, i) => {
              const isExpanded = !!expandedClos[i];
              return (
                <Card 
                  key={i} 
                  p={0} 
                  radius={0} 
                  withBorder 
                  style={{ 
                    borderColor: isExpanded ? "#1A3A5C" : "#E2E8F0",
                    boxShadow: isExpanded ? "0 4px 12px rgba(26, 58, 92, 0.05)" : "none",
                    transition: "all 0.2s ease"
                  }}
                >
                  {/* Card Header (Click to Toggle) */}
                  <Box 
                    p="md" 
                    onClick={() => toggleExpandClo(i)}
                    style={{ 
                      backgroundColor: isExpanded ? "#F1F5F9" : "#FAFBFC", 
                      borderBottom: isExpanded ? "1px solid #E2E8F0" : "none",
                      cursor: "pointer",
                      userSelect: "none"
                    }}
                  >
                    <Group justify="space-between">
                      <Group gap="sm" style={{ flex: 1 }}>
                        <Badge variant="filled" color="gray" radius={0} styles={{ root: { height: 22, minWidth: 26, padding: 0 } }}>
                          #{i + 1}
                        </Badge>
                        <Text fw={700} size="sm" c={isExpanded ? "#1A3A5C" : "#334155"} style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {clo.cloName || <span style={{ fontStyle: "italic", color: "#94A3B8" }}>(Mã CLO trống)</span>}
                        </Text>
                        <Group gap="xs">
                          {clo.loDetails && (
                            <Badge variant="outline" color="teal" radius={0}>
                              LO: {clo.loDetails}
                            </Badge>
                          )}
                        </Group>
                      </Group>
                      
                      <Group gap="xs" onClick={(e) => e.stopPropagation()}>
                        <Tooltip label="Xóa">
                          <ActionIcon variant="subtle" color="red" onClick={() => removeClo(i)}>
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Tooltip>

                        <ActionIcon variant="subtle" color="gray" onClick={() => toggleExpandClo(i)}>
                          {isExpanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                        </ActionIcon>
                      </Group>
                    </Group>
                  </Box>

                  {/* Card Body */}
                  <Collapse expanded={isExpanded}>
                    <Box p="md">
                      <Stack gap="md">
                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                          {Ftext(`clos[${i}].cloName`, "Mã CLO", `VD: CLO${i + 1}`, true)}
                          {Ftext(`clos[${i}].loDetails`, "Ánh xạ LO", "VD: LO1, LO2,...")}
                        </SimpleGrid>
                        {Farea(`clos[${i}].cloDetails`, "Mô tả CLO", "Mô tả chi tiết...", 4)}
                      </Stack>
                    </Box>
                  </Collapse>
                </Card>
              );
            })}
          </Stack>
        )}
      </Stack>
    </Card>,

    // Step 2: Schedule
    <Card key="step2" p="xl" radius={0} style={{ border: "1px solid #E2E8F0", backgroundColor: "white", marginTop: 24 }}>
      <Stack gap="lg">
        {/* Toolbar */}
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <Title order={2} style={{ fontSize: 16, fontWeight: 900, color: "#1A1A1A" }}>
              Lịch trình học tập ({values.schedules.length} buổi học)
            </Title>
          </Group>
          <Group gap="xs">
            <Button variant="outline" color="gray" size="xs" radius={0} onClick={collapseAllSchedules} leftSection={<IconChevronDown size={14} />}>
              Thu gọn tất cả
            </Button>
            <Button variant="outline" color="gray" size="xs" radius={0} onClick={expandAllSchedules} leftSection={<IconChevronUp size={14} />}>
              Mở rộng tất cả
            </Button>
            <Button style={{ backgroundColor: "#1A3A5C" }} size="xs" radius={0} onClick={addSchedule} leftSection={<IconPlus size={14} />}>
              Thêm buổi học
            </Button>
          </Group>
        </Group>

        {/* List of Sessions */}
        {values.schedules.length === 0 ? (
          <Card p="xl" radius={0} withBorder style={{ borderStyle: "dashed", textAlign: "center" }}>
            <Text c="dimmed" size="sm">Chưa có lịch trình học tập nào. Bấm nút "Thêm buổi học" để bắt đầu.</Text>
          </Card>
        ) : (
          <Stack gap="md">
            {values.schedules.map((s, i) => {
              const isExpanded = !!expandedSchedules[i];
              return (
                <Card 
                  key={i} 
                  p={0} 
                  radius={0} 
                  withBorder 
                  style={{ 
                    borderColor: isExpanded ? "#1A3A5C" : "#E2E8F0",
                    boxShadow: isExpanded ? "0 4px 12px rgba(26, 58, 92, 0.05)" : "none",
                    transition: "all 0.2s ease"
                  }}
                >
                  {/* Card Header (Click to Toggle) */}
                  <Box 
                    p="md" 
                    onClick={() => toggleExpandSchedule(i)}
                    style={{ 
                      backgroundColor: isExpanded ? "#F1F5F9" : "#FAFBFC", 
                      borderBottom: isExpanded ? "1px solid #E2E8F0" : "none",
                      cursor: "pointer",
                      userSelect: "none"
                    }}
                  >
                    <Group justify="space-between">
                      <Group gap="sm" style={{ flex: 1 }}>
                        <Badge variant="filled" color="gray" radius={0} styles={{ root: { height: 22, minWidth: 50, padding: "0 6px" } }}>
                          Buổi {s.session}
                        </Badge>
                        <Text fw={700} size="sm" c={isExpanded ? "#1A3A5C" : "#334155"} style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {s.topic || <span style={{ fontStyle: "italic", color: "#94A3B8" }}>(Chưa đặt chủ đề buổi học)</span>}
                        </Text>
                        <Group gap="xs">
                          {s.learningMethod && (
                            <Badge variant="outline" color="blue" radius={0}>
                              {s.learningMethod}
                            </Badge>
                          )}
                          {s.lo && (
                            <Badge variant="outline" color="teal" radius={0}>
                              CLO: {s.lo}
                            </Badge>
                          )}
                          {s.itu && (
                            <Badge variant="outline" color="violet" radius={0}>
                              ITU: {s.itu}
                            </Badge>
                          )}
                        </Group>
                      </Group>
                      
                      <Group gap="xs" onClick={(e) => e.stopPropagation()}>
                        <Tooltip label="Xóa">
                          <ActionIcon variant="subtle" color="red" onClick={() => removeSchedule(i)}>
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Tooltip>

                        <ActionIcon variant="subtle" color="gray" onClick={() => toggleExpandSchedule(i)}>
                          {isExpanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                        </ActionIcon>
                      </Group>
                    </Group>
                  </Box>

                  {/* Card Body */}
                  <Collapse expanded={isExpanded}>
                    <Box p="md">
                      <Stack gap="md">
                        {/* Row 1: Core Fields */}
                        <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="md">
                          {Ftext(`schedules[${i}].topic`, "Chủ đề", "Nhập chủ đề buổi học...", true)}
                          {Ftext(`schedules[${i}].learningMethod`, "Hình thức giảng dạy", "VD: Online, Offline")}
                          {Ftext(`schedules[${i}].lo`, "Đáp ứng CLO", "VD: CLO1")}
                          
                          <form.Field name={`schedules[${i}].itu`}>
                            {(f: any) => (
                              <Select
                                label="Mức độ giảng dạy (ITU)"
                                placeholder="Chọn mức độ..."
                                radius={0}
                                data={[
                                  { value: "I", label: "I - Introduce" },
                                  { value: "T", label: "T - Teach" },
                                  { value: "U", label: "U - Utilize" },
                                  { value: "IT", label: "IT (Combo)" },
                                  { value: "T,U", label: "T,U (Combo)" },
                                ]}
                                value={f.state.value ?? ""}
                                onChange={(val) => f.handleChange(val ?? "")}
                                error={f.state.meta.errors?.[0]}
                              />
                            )}
                          </form.Field>
                        </SimpleGrid>

                        {/* Row 2: Secondary Fields */}
                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                          {Ftext(`schedules[${i}].studentTasks`, "Nhiệm vụ sinh viên", "VD: Đọc trước bài, làm quiz...")}
                          {Ftext(`schedules[${i}].sDownload`, "Tài liệu cần download", "Link hoặc mô tả...")}
                        </SimpleGrid>

                        {/* Row 3: Textareas for Materials & Reference URLs */}
                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                          {Farea(`schedules[${i}].studentMaterials`, "Học liệu chi tiết cho SV", "Mô tả cụ thể sách, slide, hoặc chương cần đọc...")}
                          {Farea(`schedules[${i}].urls`, "URLs tham khảo", "Link video bài giảng, tài liệu bổ sung...")}
                        </SimpleGrid>
                      </Stack>
                    </Box>
                  </Collapse>
                </Card>
              );
            })}
          </Stack>
        )}
      </Stack>
    </Card>,

    // Step 3: Assessment
    <Card key="step3" p="xl" radius={0} style={{ border: "1px solid #E2E8F0", backgroundColor: "white", marginTop: 24 }}>
      <Stack gap="lg">
        {/* Weight Allocation Status Panel */}
        <Card p="md" radius={0} style={{ backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
          <Stack gap="xs">
            <Group justify="space-between" align="center">
              <div>
                <Text size="sm" fw={700} c="#475569">Trạng thái trọng số phân bổ</Text>
                <Text size="lg" fw={900} c="#1A1A1A">
                  Tổng trọng số: <span style={{ color: totalWeight === 100 ? "#16A34A" : totalWeight > 100 ? "#DC2626" : "#F26F21" }}>{totalWeight}%</span> / 100%
                </Text>
              </div>
              <Badge 
                size="lg" 
                radius={0}
                variant="filled"
                color={totalWeight === 100 ? "green" : totalWeight > 100 ? "red" : "orange"}
              >
                {totalWeight === 100 
                  ? "Hợp lệ" 
                  : totalWeight > 100 
                    ? `Thừa ${totalWeight - 100}%` 
                    : `Thiếu ${100 - totalWeight}%`}
              </Badge>
            </Group>
            <Progress 
              value={totalWeight} 
              color={totalWeight === 100 ? "green" : totalWeight > 100 ? "red" : "orange"} 
              size="md" 
              radius={0}
              striped={totalWeight !== 100}
              animated={totalWeight !== 100}
            />
          </Stack>
        </Card>

        {/* Toolbar */}
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <Title order={2} style={{ fontSize: 16, fontWeight: 900, color: "#1A1A1A" }}>
              Cơ cấu đánh giá ({values.assessments.length} thành phần)
            </Title>
          </Group>
          <Group gap="xs">
            <Button variant="outline" color="gray" size="xs" radius={0} onClick={collapseAll} leftSection={<IconChevronDown size={14} />}>
              Thu gọn tất cả
            </Button>
            <Button variant="outline" color="gray" size="xs" radius={0} onClick={expandAll} leftSection={<IconChevronUp size={14} />}>
              Mở rộng tất cả
            </Button>
            <Button style={{ backgroundColor: "#1A3A5C" }} size="xs" radius={0} onClick={addAssessment} leftSection={<IconPlus size={14} />}>
              Thêm thành phần
            </Button>
          </Group>
        </Group>

        {/* List of Assessments */}
        {values.assessments.length === 0 ? (
          <Card p="xl" radius={0} withBorder style={{ borderStyle: "dashed", textAlign: "center" }}>
            <Text c="dimmed" size="sm">Chưa có thành phần đánh giá nào. Bấm nút "Thêm thành phần" để bắt đầu.</Text>
          </Card>
        ) : (
          <Stack gap="md">
            {values.assessments.map((a, i) => {
              const isExpanded = !!expandedAssessments[i];
              return (
                <Card 
                  key={i} 
                  p={0} 
                  radius={0} 
                  withBorder 
                  style={{ 
                    borderColor: isExpanded ? "#1A3A5C" : "#E2E8F0",
                    boxShadow: isExpanded ? "0 4px 12px rgba(26, 58, 92, 0.05)" : "none",
                    transition: "all 0.2s ease"
                  }}
                >
                  {/* Card Header (Click to Toggle) */}
                  <Box 
                    p="md" 
                    onClick={() => toggleExpand(i)}
                    style={{ 
                      backgroundColor: isExpanded ? "#F1F5F9" : "#FAFBFC", 
                      borderBottom: isExpanded ? "1px solid #E2E8F0" : "none",
                      cursor: "pointer",
                      userSelect: "none"
                    }}
                  >
                    <Group justify="space-between">
                      <Group gap="sm" style={{ flex: 1 }}>
                        <Badge variant="filled" color="gray" radius={0} styles={{ root: { height: 22, minWidth: 26, padding: 0 } }}>
                          #{i + 1}
                        </Badge>
                        <Text fw={700} size="sm" c={isExpanded ? "#1A3A5C" : "#334155"} style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {a.category || <span style={{ fontStyle: "italic", color: "#94A3B8" }}>(Chưa đặt tên thành phần)</span>}
                        </Text>
                        <Group gap="xs">
                          {a.weight > 0 && (
                            <Badge variant="outline" color="blue" radius={0}>
                              Trọng số: {a.weight}%
                            </Badge>
                          )}
                          {a.clo && (
                            <Badge variant="outline" color="teal" radius={0}>
                              CLO: {a.clo}
                            </Badge>
                          )}
                        </Group>
                      </Group>
                      
                      <Group gap="xs" onClick={(e) => e.stopPropagation()}>
                        <Badge 
                          variant="light" 
                          color={a.type === "final exam" ? "orange" : "blue"}
                          radius={0}
                        >
                          {a.type === "final exam" ? "Final Exam" : "Ongoing"}
                        </Badge>
                        
                        <Tooltip label="Nhân bản">
                          <ActionIcon variant="subtle" color="blue" onClick={() => duplicateAssessment(i)}>
                            <IconCopy size={16} />
                          </ActionIcon>
                        </Tooltip>

                        <Tooltip label="Xóa">
                          <ActionIcon variant="subtle" color="red" onClick={() => removeAssessment(i)}>
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Tooltip>

                        <ActionIcon variant="subtle" color="gray" onClick={() => toggleExpand(i)}>
                          {isExpanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                        </ActionIcon>
                      </Group>
                    </Group>
                  </Box>

                  {/* Card Body */}
                  <Collapse expanded={isExpanded}>
                    <Box p="md">
                      <Stack gap="md">
                        {/* Row 1: Basic Info */}
                        <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="md">
                          <form.Field name={`assessments[${i}].category`}>
                            {(f: any) => (
                              <TextInput
                                label="Tên thành phần"
                                placeholder="VD: Progress Test 1"
                                required
                                radius={0}
                                value={f.state.value ?? ""}
                                onChange={(e) => f.handleChange(e.target.value)}
                                error={f.state.meta.errors?.[0]}
                              />
                            )}
                          </form.Field>

                          <form.Field name={`assessments[${i}].type`}>
                            {(f: any) => (
                              <Select
                                label="Loại đánh giá"
                                data={[
                                  { value: "on-going", label: "On-going" },
                                  { value: "final exam", label: "Final Exam" },
                                ]}
                                required
                                radius={0}
                                value={f.state.value ?? "on-going"}
                                onChange={(val) => f.handleChange(val ?? "on-going")}
                                error={f.state.meta.errors?.[0]}
                              />
                            )}
                          </form.Field>

                          <form.Field name={`assessments[${i}].weight`}>
                            {(f: any) => (
                              <NumberInput
                                label="Trọng số (%)"
                                required
                                radius={0}
                                min={0}
                                max={100}
                                value={f.state.value ?? 0}
                                onChange={(val) => f.handleChange(val ?? 0)}
                                error={f.state.meta.errors?.[0]}
                              />
                            )}
                          </form.Field>

                          <form.Field name={`assessments[${i}].clo`}>
                            {(f: any) => (
                              <TextInput
                                label="Đáp ứng CLO"
                                placeholder="VD: CLO1, CLO2"
                                radius={0}
                                value={f.state.value ?? ""}
                                onChange={(e) => f.handleChange(e.target.value)}
                                error={f.state.meta.errors?.[0]}
                              />
                            )}
                          </form.Field>
                        </SimpleGrid>

                        {/* Row 2: Secondary Specs */}
                        <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="md">
                          <form.Field name={`assessments[${i}].part`}>
                            {(f: any) => (
                              <TextInput
                                label="Part"
                                placeholder="VD: 1"
                                radius={0}
                                value={f.state.value ?? ""}
                                onChange={(e) => f.handleChange(e.target.value)}
                                error={f.state.meta.errors?.[0]}
                              />
                            )}
                          </form.Field>

                          <form.Field name={`assessments[${i}].completionCriteria`}>
                            {(f: any) => (
                              <TextInput
                                label="Tiêu chí hoàn thành"
                                placeholder="VD: 5"
                                radius={0}
                                value={f.state.value ?? ""}
                                onChange={(e) => f.handleChange(e.target.value)}
                                error={f.state.meta.errors?.[0]}
                              />
                            )}
                          </form.Field>

                          <form.Field name={`assessments[${i}].duration`}>
                            {(f: any) => (
                              <TextInput
                                label="Thời lượng"
                                placeholder="VD: 15' hoặc 10'-30'"
                                radius={0}
                                value={f.state.value ?? ""}
                                onChange={(e) => f.handleChange(e.target.value)}
                                error={f.state.meta.errors?.[0]}
                              />
                            )}
                          </form.Field>

                          <form.Field name={`assessments[${i}].noQuestion`}>
                            {(f: any) => (
                              <TextInput
                                label="Số câu hỏi"
                                placeholder="VD: 40 hoặc -"
                                radius={0}
                                value={f.state.value ?? ""}
                                onChange={(e) => f.handleChange(e.target.value)}
                                error={f.state.meta.errors?.[0]}
                              />
                            )}
                          </form.Field>
                        </SimpleGrid>

                        {/* Row 3: Question Type and Knowledge & Skill */}
                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                          <form.Field name={`assessments[${i}].questionType`}>
                            {(f: any) => (
                              <TextInput
                                label="Dạng câu hỏi / Hình thức thi"
                                placeholder="VD: Oral Presentation, Multiple Choice"
                                radius={0}
                                value={f.state.value ?? ""}
                                onChange={(e) => f.handleChange(e.target.value)}
                                error={f.state.meta.errors?.[0]}
                              />
                            )}
                          </form.Field>

                          <form.Field name={`assessments[${i}].knowledgeAndSkill`}>
                            {(f: any) => (
                              <Textarea
                                label="Kiến thức & Kỹ năng đánh giá"
                                placeholder="VD: Topic from video lectures, class discussion activities."
                                radius={0}
                                rows={2}
                                value={f.state.value ?? ""}
                                onChange={(e) => f.handleChange(e.target.value)}
                                error={f.state.meta.errors?.[0]}
                              />
                            )}
                          </form.Field>
                        </SimpleGrid>

                        {/* Row 4 & 5: Detailed Guides & Notes (Spacious) */}
                        <form.Field name={`assessments[${i}].gradingGuide`}>
                          {(f: any) => (
                            <Textarea
                              label="Hướng dẫn chấm điểm (Grading Guide)"
                              placeholder="Nhập tiêu chí chấm điểm chi tiết (ví dụ: chia theo các tiêu chí nhỏ, chấm theo thang điểm, vai trò nhóm...). Có thể sử dụng dấu gạch đầu dòng."
                              radius={0}
                              rows={5}
                              value={f.state.value ?? ""}
                              onChange={(e) => f.handleChange(e.target.value)}
                              error={f.state.meta.errors?.[0]}
                            />
                          )}
                        </form.Field>

                        <form.Field name={`assessments[${i}].note`}>
                          {(f: any) => (
                            <Textarea
                              label="Ghi chú thêm (Note)"
                              placeholder="Nhập ghi chú hoặc trách nhiệm của giảng viên sau khi chấm..."
                              radius={0}
                              rows={3}
                              value={f.state.value ?? ""}
                              onChange={(e) => f.handleChange(e.target.value)}
                              error={f.state.meta.errors?.[0]}
                            />
                          )}
                        </form.Field>
                      </Stack>
                    </Box>
                  </Collapse>
                </Card>
              );
            })}
          </Stack>
        )}
      </Stack>
    </Card>,

    // Step 4: Materials
    <Card key="step4" p="xl" radius={0} style={{ border: "1px solid #E2E8F0", backgroundColor: "white", marginTop: 24 }}>
      <Stack gap="lg">
        {/* Toolbar */}
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <Title order={2} style={{ fontSize: 16, fontWeight: 900, color: "#1A1A1A" }}>
              Tài liệu học tập ({values.materials.length} tài liệu)
            </Title>
          </Group>
          <Group gap="xs">
            <Button variant="outline" color="gray" size="xs" radius={0} onClick={collapseAllMaterials} leftSection={<IconChevronDown size={14} />}>
              Thu gọn tất cả
            </Button>
            <Button variant="outline" color="gray" size="xs" radius={0} onClick={expandAllMaterials} leftSection={<IconChevronUp size={14} />}>
              Mở rộng tất cả
            </Button>
            <Button style={{ backgroundColor: "#1A3A5C" }} size="xs" radius={0} onClick={addMaterial} leftSection={<IconPlus size={14} />}>
              Thêm tài liệu
            </Button>
          </Group>
        </Group>

        {/* List of Materials */}
        {values.materials.length === 0 ? (
          <Card p="xl" radius={0} withBorder style={{ borderStyle: "dashed", textAlign: "center" }}>
            <Text c="dimmed" size="sm">Chưa có tài liệu học tập nào. Bấm nút "Thêm tài liệu" để bắt đầu.</Text>
          </Card>
        ) : (
          <Stack gap="md">
            {values.materials.map((m, i) => {
              const isExpanded = !!expandedMaterials[i];
              return (
                <Card 
                  key={i} 
                  p={0} 
                  radius={0} 
                  withBorder 
                  style={{ 
                    borderColor: isExpanded ? "#1A3A5C" : "#E2E8F0",
                    boxShadow: isExpanded ? "0 4px 12px rgba(26, 58, 92, 0.05)" : "none",
                    transition: "all 0.2s ease"
                  }}
                >
                  {/* Card Header (Click to Toggle) */}
                  <Box 
                    p="md" 
                    onClick={() => toggleExpandMaterial(i)}
                    style={{ 
                      backgroundColor: isExpanded ? "#F1F5F9" : "#FAFBFC", 
                      borderBottom: isExpanded ? "1px solid #E2E8F0" : "none",
                      cursor: "pointer",
                      userSelect: "none"
                    }}
                  >
                    <Group justify="space-between">
                      <Group gap="sm" style={{ flex: 1 }}>
                        <Badge variant="filled" color="gray" radius={0} styles={{ root: { height: 22, minWidth: 26, padding: 0 } }}>
                          #{i + 1}
                        </Badge>
                        <Text fw={700} size="sm" c={isExpanded ? "#1A3A5C" : "#334155"} style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {m.description || <span style={{ fontStyle: "italic", color: "#94A3B8" }}>(Mô tả tài liệu trống)</span>}
                        </Text>
                        <Group gap="xs">
                          {m.isMainMaterial && (
                            <Badge variant="outline" color={m.isMainMaterial === "Main" ? "blue" : "gray"} radius={0}>
                              {m.isMainMaterial === "Main" ? "Chính" : "Tham khảo"}
                            </Badge>
                          )}
                          <Badge variant="light" color={m.isOnline === "Có" ? "green" : "red"} radius={0}>
                            Online: {m.isOnline}
                          </Badge>
                          <Badge variant="light" color={m.isHardCopy === "Có" ? "green" : "red"} radius={0}>
                            Bản cứng: {m.isHardCopy}
 Esp                           </Badge>
                        </Group>
                      </Group>
                      
                      <Group gap="xs" onClick={(e) => e.stopPropagation()}>
                        <Tooltip label="Xóa">
                          <ActionIcon variant="subtle" color="red" onClick={() => removeMaterial(i)}>
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Tooltip>

                        <ActionIcon variant="subtle" color="gray" onClick={() => toggleExpandMaterial(i)}>
                          {isExpanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                        </ActionIcon>
                      </Group>
                    </Group>
                  </Box>

                  {/* Card Body */}
                  <Collapse expanded={isExpanded}>
                    <Box p="md">
                      <Stack gap="md">
                        {/* Row 1: Core details */}
                        {Ftext(`materials[${i}].description`, "Mô tả tài liệu (Tên sách/Tài liệu)", "VD: Textbook name", true)}
                        
                        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                          {Ftext(`materials[${i}].author`, "Tác giả", "VD: John Doe")}
                          {Ftext(`materials[${i}].publisher`, "Nhà xuất bản", "VD: NXB Giáo dục")}
                          {Fselect(`materials[${i}].isMainMaterial`, "Loại tài liệu", [
                            { value: "Main", label: "Giáo trình chính (Main)" },
                            { value: "Reference", label: "Tài liệu tham khảo (Reference)" },
                          ])}
                        </SimpleGrid>

                        {/* Row 2: Secondary details */}
                        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                          {Ftext(`materials[${i}].publishedDate`, "Năm xuất bản", "VD: 2021")}
                          {Ftext(`materials[${i}].edition`, "Phiên bản", "VD: 4th Edition")}
                          {Ftext(`materials[${i}].isbn`, "ISBN", "VD: 978-0136886099")}
                        </SimpleGrid>

                        {/* Row 3: Copies and notes */}
                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                          {Fselect(`materials[${i}].isHardCopy`, "Có bản cứng không?", [
                            { value: "Có", label: "Có" },
                            { value: "Không", label: "Không" },
                          ])}
                          {Fselect(`materials[${i}].isOnline`, "Có bản online không?", [
                            { value: "Có", label: "Có" },
                            { value: "Không", label: "Không" },
                          ])}
                        </SimpleGrid>
                        {Ftext(`materials[${i}].note`, "Ghi chú thêm", "Ghi chú về học liệu...")}
                      </Stack>
                    </Box>
                  </Collapse>
                </Card>
              );
            })}
          </Stack>
        )}
      </Stack>
    </Card>,
  ];

  return (
    <Stack gap="xl">
      {/* Header */}
      <Group gap="md">
        <ActionIcon component={Link} href="/teacher/syllabus" variant="subtle" color="gray" size="lg">
          <IconArrowLeft size={20} />
        </ActionIcon>
        <div>
          <Title order={1} style={{ fontSize: 24, fontWeight: 900, color: "#1A3A5C" }}>
            Chỉnh sửa Syllabus
          </Title>
          <Text size="sm" c="dimmed">Cập nhật 5 bước để lưu các chỉnh sửa của đề cương môn học</Text>
        </div>
      </Group>

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
              disabled={!weightValid || updateMutation.isPending}
              style={{ backgroundColor: "#F26F21" }}
              radius={0}
              fw={700}
              leftSection={<IconCheck size={18} />}
              loading={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Đang lưu..." : "LƯU THAY ĐỔI"}
            </Button>
          )}
        </Group>
      </form>
    </Stack>
  );
}

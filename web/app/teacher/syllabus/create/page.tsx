"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Box,
  SimpleGrid,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconCheck,
  IconAlertCircle,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";

export default function CreateSyllabusPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);

  // Assessment scheme mock editing state for validation demo
  const [assessments, setAssessments] = useState([
    { name: "Progress Test 1", weight: 10 },
    { name: "Progress Test 2", weight: 10 },
    { name: "Assignment", weight: 20 },
    { name: "Final Exam", weight: 40 },
  ]);

  const totalWeight = assessments.reduce((acc, curr) => acc + curr.weight, 0);

  const nextStep = () => setActiveStep((current) => (current < 4 ? current + 1 : current));
  const prevStep = () => setActiveStep((current) => (current > 0 ? current - 1 : current));

  const handleSave = () => {
    if (totalWeight === 100) {
      router.push("/teacher/syllabus");
    }
  };

  const handleAddAssessment = () => {
    setAssessments([...assessments, { name: "Thành phần mới", weight: 0 }]);
  };

  const handleDeleteAssessment = (index: number) => {
    const updated = assessments.filter((_, i) => i !== index);
    setAssessments(updated);
  };

  const handleWeightChange = (index: number, val: string | number) => {
    const updated = [...assessments];
    updated[index].weight = Number(val) || 0;
    setAssessments(updated);
  };

  const handleNameChange = (index: number, val: string) => {
    const updated = [...assessments];
    updated[index].name = val;
    setAssessments(updated);
  };

  return (
    <Stack gap="xl" style={{ maxWidth: "1000px", margin: "0 auto" }}>
      {/* Header */}
      <Group gap="md">
        <ActionIcon
          component={Link}
          href="/teacher/syllabus"
          variant="subtle"
          color="gray"
          size="lg"
        >
          <IconArrowLeft size={20} />
        </ActionIcon>
        <div>
          <Title order={1} style={{ fontSize: "24px", fontWeight: 900, color: "#1A3A5C" }}>
            Tạo Syllabus Mới
          </Title>
          <Text size="sm" c="dimmed">
            Hoàn thành 5 bước để tạo bản nháp đề cương môn học
          </Text>
        </div>
      </Group>

      {/* Stepper Component */}
      <Stepper active={activeStep} onStepClick={setActiveStep} radius={0} color="#1A3A5C" styles={{
        stepIcon: { borderRadius: 0 },
      }}>
        <Stepper.Step label="Metadata" description="Thông tin chung">
          <Card p="xl" radius={0} style={{ border: "1px solid #E2E8F0", backgroundColor: "white", marginTop: "24px" }}>
            <Stack gap="md">
              <Title order={2} style={{ fontSize: "16px", fontWeight: 900, color: "#1A1A1A" }}>
                Thông tin chung (Metadata)
              </Title>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <TextInput label="Subject Code" placeholder="VD: FER202" required radius={0} />
                <TextInput label="Tên môn học" placeholder="Front-End web development with React" required radius={0} />
                <NumberInput label="Số tín chỉ (Credits)" defaultValue={3} min={1} required radius={0} />
                <TextInput label="Điều kiện tiên quyết (Pre-requisites)" placeholder="VD: WED201c" radius={0} />
              </SimpleGrid>
              <Textarea label="Mô tả môn học" placeholder="Nhập mô tả chi tiết học phần..." rows={4} radius={0} />
            </Stack>
          </Card>
        </Stepper.Step>

        <Stepper.Step label="CLOs" description="Chuẩn đầu ra">
          <Card p="xl" radius={0} style={{ border: "1px solid #E2E8F0", backgroundColor: "white", marginTop: "24px" }}>
            <Stack align="center" py="xl" gap="xs" style={{ color: "#64748B" }}>
              <Text fw={700}>Nhập chuẩn đầu ra môn học (CLOs)</Text>
              <Text size="xs" c="dimmed">Màn hình cấu hình bản nháp dành cho mục đích Prototype UI</Text>
            </Stack>
          </Card>
        </Stepper.Step>

        <Stepper.Step label="Schedule" description="Lịch trình học">
          <Card p="xl" radius={0} style={{ border: "1px solid #E2E8F0", backgroundColor: "white", marginTop: "24px" }}>
            <Stack align="center" py="xl" gap="xs" style={{ color: "#64748B" }}>
              <Text fw={700}>Thiết lập lịch trình giảng dạy (30/60 Sessions)</Text>
              <Text size="xs" c="dimmed">Màn hình cấu hình bản nháp dành cho mục đích Prototype UI</Text>
            </Stack>
          </Card>
        </Stepper.Step>

        <Stepper.Step label="Assessment" description="Cơ cấu đánh giá">
          <Card p="xl" radius={0} style={{ border: "1px solid #E2E8F0", backgroundColor: "white", marginTop: "24px" }}>
            <Stack gap="md">
              <Group justify="space-between">
                <Title order={2} style={{ fontSize: "16px", fontWeight: 900, color: "#1A1A1A" }}>
                  Cơ cấu đánh giá (Assessment Scheme)
                </Title>
                <Button
                  variant="subtle"
                  color="#1A3A5C"
                  onClick={handleAddAssessment}
                  leftSection={<IconPlus size={16} />}
                  fw={700}
                  size="xs"
                >
                  Thêm cột điểm
                </Button>
              </Group>

              {totalWeight !== 100 && (
                <Alert
                  icon={<IconAlertCircle size={18} />}
                  title="Cảnh báo trọng số"
                  color="yellow"
                  radius={0}
                  styles={{ title: { fontWeight: 700 } }}
                >
                  Tổng trọng số hiện tại là {totalWeight}%. Bạn phải cấu hình tổng trọng số đúng bằng 100% mới có thể lưu bản nháp.
                </Alert>
              )}

              <Table highlightOnHover striped withTableBorder>
                <Table.Thead style={{ backgroundColor: "#F8FAFC" }}>
                  <Table.Tr>
                    <Table.Th style={{ fontWeight: 700, fontSize: "12px", color: "#475569" }}>Thành phần đánh giá</Table.Th>
                    <Table.Th style={{ width: "160px", fontWeight: 700, fontSize: "12px", color: "#475569" }}>Trọng số (%)</Table.Th>
                    <Table.Th style={{ width: "80px", fontWeight: 700, fontSize: "12px", color: "#475569", textAlign: "center" }}>Xóa</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {assessments.map((a, i) => (
                    <Table.Tr key={i}>
                      <Table.Td>
                        <TextInput
                          value={a.name}
                          onChange={(e) => handleNameChange(i, e.target.value)}
                          radius={0}
                          styles={{ input: { border: "1px solid transparent", "&:focus": { borderColor: "#1A3A5C" } } }}
                        />
                      </Table.Td>
                      <Table.Td>
                        <NumberInput
                          value={a.weight}
                          onChange={(val) => handleWeightChange(i, val)}
                          radius={0}
                          min={0}
                          max={100}
                        />
                      </Table.Td>
                      <Table.Td style={{ textAlign: "center" }}>
                        <ActionIcon variant="subtle" color="red" onClick={() => handleDeleteAssessment(i)}>
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                  <Table.Tr style={{ backgroundColor: "#F1F5F9", fontWeight: "bold" }}>
                    <Table.Td style={{ fontSize: "13px", textAlign: "right" }}>Tổng cộng (Total Weight):</Table.Td>
                    <Table.Td style={{ fontSize: "13px", color: totalWeight === 100 ? "#16A34A" : "#DC2626", fontWeight: 800 }}>
                      {totalWeight}%
                    </Table.Td>
                    <Table.Td></Table.Td>
                  </Table.Tr>
                </Table.Tbody>
              </Table>
            </Stack>
          </Card>
        </Stepper.Step>

        <Stepper.Step label="Materials" description="Tài liệu học">
          <Card p="xl" radius={0} style={{ border: "1px solid #E2E8F0", backgroundColor: "white", marginTop: "24px" }}>
            <Stack align="center" py="xl" gap="xs" style={{ color: "#64748B" }}>
              <Text fw={700}>Thêm tài liệu tham khảo và giáo trình học tập</Text>
              <Text size="xs" c="dimmed">Màn hình cấu hình bản nháp dành cho mục đích Prototype UI</Text>
            </Stack>
          </Card>
        </Stepper.Step>
      </Stepper>

      {/* Control Buttons */}
      <Group justify="space-between" mt="xl">
        <Button
          variant="outline"
          color="gray"
          radius={0}
          onClick={prevStep}
          disabled={activeStep === 0}
          fw={700}
        >
          Quay lại
        </Button>
        
        {activeStep < 4 ? (
          <Button
            onClick={nextStep}
            style={{ backgroundColor: "#1A3A5C" }}
            radius={0}
            fw={700}
          >
            Tiếp tục
          </Button>
        ) : (
          <Button
            onClick={handleSave}
            disabled={totalWeight !== 100}
            style={{ backgroundColor: "#F26F21" }}
            radius={0}
            fw={700}
            leftSection={<IconCheck size={18} />}
          >
            LƯU BẢN NHÁP
          </Button>
        )}
      </Group>
    </Stack>
  );
}

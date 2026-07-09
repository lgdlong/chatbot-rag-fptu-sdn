import React from "react";
import { Stack, Card, Divider, Box, Badge, Text } from "@mantine/core";
import { IconInfoCircle, IconBook2, IconClipboardList, IconBulb } from "@tabler/icons-react";
import { SectionHeader, InfoRow, BooleanCell, formatMultiline } from "./SyllabusHelpers";

interface SyllabusOverviewTabProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: any;
}

export function SyllabusOverviewTab({ metadata }: SyllabusOverviewTabProps) {
  return (
    <Stack gap="xl">
      <Card radius="lg" padding="xl" style={{ background: "white", border: "1px solid #E2E8F0" }}>
        <SectionHeader icon={IconInfoCircle} title="Thông tin chung Syllabus" color="#1A3A5C" />
        <Divider mb="md" style={{ borderColor: "#F1F5F9" }} />

        <Stack gap={0}>
          <InfoRow label="Syllabus ID" value={metadata.syllabus_id} />
          <InfoRow
            label="Syllabus Name"
            value={<span style={{ fontWeight: 700, color: "#1A3A5C" }}>{metadata.syllabus_name}</span>}
          />
          <InfoRow
            label="English Name"
            value={<span style={{ fontWeight: 700, color: "#1A3A5C" }}>{metadata.syllabus_name_english}</span>}
          />
          <InfoRow label="Subject Code" value={
            <Box>
              <Badge size="md" radius="md" style={{ background: "#F37021", color: "white", fontFamily: "monospace", fontWeight: 800 }}>
                {metadata.subject_code}
              </Badge>
            </Box>
          } />
          <InfoRow label="No. Credits" value={
            <Box style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span style={{ fontWeight: 800, color: "#1A3A5C", fontSize: "18px" }}>{metadata.credits}</span>
              <span style={{ fontSize: "12px", color: "#64748b" }}>tín chỉ</span>
            </Box>
          } />
          <InfoRow label="Degree Level" value={metadata.degree_level} />
          <InfoRow label="Time Allocation" value={metadata.time_allocation} />
          <InfoRow label="Pre-Requisite" value={metadata.prerequisites} />
          <InfoRow label="Scoring Scale" value={metadata.scoring_scale} />
          <InfoRow label="Min Avg Mark to Pass" value={
            <Box>
              <Badge size="sm" style={{ background: "#dcfce7", color: "#16a34a", fontWeight: 700 }}>
                {metadata.min_avg_mark_to_pass}
              </Badge>
            </Box>
          } />
          <InfoRow label="Decision No." value={metadata.decision_no} />
          <InfoRow label="Approved Date" value={metadata.approved_date} />
          <InfoRow label="Is Approved" value={
            <BooleanCell value={metadata.is_approved === "true" || metadata.is_approved === true} />
          } />
          <InfoRow label="Is Active" value={
            <BooleanCell value={metadata.is_active === "true" || metadata.is_active === true} />
          } />
          <InfoRow label="Note" value={metadata.note} />
        </Stack>
      </Card>

      {/* Description & Tasks */}
      <Box
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
          gap: "16px",
        }}
      >
        <Card radius="lg" padding="xl" style={{ background: "white", border: "1px solid #E2E8F0" }}>
          <SectionHeader icon={IconBook2} title="Mô tả môn học" color="#3b82f6" />
          <Text size="sm" style={{ color: "#374151", lineHeight: 1.8 }}>
            {formatMultiline(metadata.description)}
          </Text>
        </Card>

        <Card radius="lg" padding="xl" style={{ background: "white", border: "1px solid #E2E8F0" }}>
          <SectionHeader icon={IconClipboardList} title="Nhiệm vụ sinh viên" color="#F37021" />
          <Text size="sm" style={{ color: "#374151", lineHeight: 1.8 }}>
            {formatMultiline(metadata.student_tasks)}
          </Text>
        </Card>
      </Box>

      {/* Tools */}
      {metadata.tools && (
        <Card radius="lg" padding="xl" style={{ background: "white", border: "1px solid #E2E8F0" }}>
          <SectionHeader icon={IconBulb} title="Công cụ sử dụng" color="#10b981" />
          <Text size="sm" style={{ color: "#374151", lineHeight: 1.8 }}>
            {formatMultiline(metadata.tools)}
          </Text>
        </Card>
      )}
    </Stack>
  );
}

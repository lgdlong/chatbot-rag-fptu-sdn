import React from "react";
import { Card, Box, Table, Badge, Text, Anchor, Group } from "@mantine/core";
import { IconCalendar, IconDownload, IconExternalLink } from "@tabler/icons-react";
import { SectionHeader, formatMultiline } from "./SyllabusHelpers";

interface SyllabusScheduleTabProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schedule: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: any;
}

export function SyllabusScheduleTab({ schedule, metadata }: SyllabusScheduleTabProps) {
  return (
    <Card radius="lg" padding="xl" style={{ background: "white", border: "1px solid #E2E8F0" }}>
      <SectionHeader
        icon={IconCalendar}
        title="Lịch học chi tiết"
        count={schedule?.length}
        countLabel="sessions (45'/session)"
        color="#3b82f6"
      />
      <Box style={{ overflowX: "auto", width: "100%" }}>
        <Table
          striped
          withTableBorder
          withColumnBorders
          style={{ minWidth: "1200px", backgroundColor: "white" }}
          fz="xs"
        >
          <Table.Thead>
            <Table.Tr style={{ background: "linear-gradient(135deg, #F37021, #e05e10)" }}>
              {[
                { label: "Session", w: "50px" },
                { label: "Topic", w: "280px" },
                { label: "Learning Type", w: "90px" },
                { label: "LO", w: "60px" },
                { label: "ITU", w: "50px" },
                { label: "Student Materials", w: "140px" },
                { label: "S-Download", w: "140px" },
                { label: "Student Tasks", w: "200px" },
                { label: "URLs", w: "100px" },
              ].map(({ label, w }) => (
                <Table.Th
                  key={label}
                  style={{
                    color: "white",
                    fontWeight: 700,
                    minWidth: w,
                    padding: "10px 10px",
                  }}
                >
                  {label}
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {schedule?.map((s: any, idx: number) => (
              <Table.Tr key={idx}>
                <Table.Td style={{ textAlign: "center" }}>
                  <Badge size="sm" circle style={{ background: "#F37021", color: "white" }}>
                    {s.session}
                  </Badge>
                </Table.Td>
                <Table.Td style={{ maxWidth: "280px" }}>
                  <Text size="xs" style={{ lineHeight: 1.6 }}>
                    {formatMultiline(s.topic)}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Badge
                    size="xs"
                    radius="sm"
                    style={{
                      background: s.learning_method?.toLowerCase().includes("lecture")
                        ? "#dbeafe"
                        : "#dcfce7",
                      color: s.learning_method?.toLowerCase().includes("lecture")
                        ? "#1d4ed8"
                        : "#15803d",
                    }}
                  >
                    {s.learning_method}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="xs" fw={600} style={{ color: "#23AC68" }}>
                    {s.lo}
                  </Text>
                </Table.Td>
                <Table.Td><Text size="xs">{s.itu || "—"}</Text></Table.Td>
                <Table.Td><Text size="xs" style={{ lineHeight: 1.5 }}>{s.student_materials || "—"}</Text></Table.Td>
                <Table.Td>
                  {s.s_download === "FER202" || s.s_download === "PRN232" ? (
                    <Anchor
                      href={`https://flm.fpt.edu.vn/download/${metadata.syllabus_id}/S/1_${s.s_download}.zip`}
                      size="xs"
                      style={{ color: "#1A3A5C" }}
                    >
                      <Group gap={4}>
                        <IconDownload size={12} />
                        {s.s_download}
                      </Group>
                    </Anchor>
                  ) : (
                    <Text size="xs">{formatMultiline(s.s_download) || "—"}</Text>
                  )}
                </Table.Td>
                <Table.Td>
                  <Text size="xs" style={{ lineHeight: 1.5 }}>
                    {formatMultiline(s.student_tasks) || "—"}
                  </Text>
                </Table.Td>
                <Table.Td>
                  {s.urls ? (
                    <Anchor href={s.urls} target="_blank" size="xs" style={{ color: "#1A3A5C" }}>
                      <Group gap={4}>
                        <IconExternalLink size={12} />
                        Link
                      </Group>
                    </Anchor>
                  ) : (
                    <Text size="xs" c="dimmed">—</Text>
                  )}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Box>
    </Card>
  );
}

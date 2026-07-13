import React from "react";
import { Stack, Box, Card, Text, Table, Badge } from "@mantine/core";
import { IconChartBar } from "@tabler/icons-react";
import { SectionHeader, formatMultiline } from "./SyllabusHelpers";

interface SyllabusAssessmentTabProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  assessment_scheme: any[];
}

export function SyllabusAssessmentTab({ assessment_scheme }: SyllabusAssessmentTabProps) {
  return (
    <Stack gap="lg">
      {/* Summary cards */}
      <Box
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "12px",
        }}
      >
        {(() => {
          // Group by category for summary
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const categories: Record<string, any[]> = {};
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          assessment_scheme?.forEach((a: any) => {
            if (!categories[a.category]) categories[a.category] = [];
            categories[a.category].push(a);
          });
          const colors = ["#3b82f6", "#F37021", "#23AC68", "#8b5cf6", "#ef4444"];
          return Object.entries(categories).map(([cat, items], i) => {
            const totalWeight = items.reduce((sum, a) => {
              const w = parseFloat(a.weight?.toString().replace("%", "") || "0");
              return sum + (isNaN(w) ? 0 : w);
            }, 0);
            return (
              <Card
                key={cat}
                padding="md"
                radius="md"
                style={{
                  background: "white",
                  border: `1px solid ${colors[i % colors.length]}30`,
                  borderTop: `3px solid ${colors[i % colors.length]}`,
                }}
              >
                <Text size="xs" fw={700} c="dimmed" style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {cat}
                </Text>
                <Text fw={900} style={{ color: colors[i % colors.length], fontSize: "24px", lineHeight: 1.2 }}>
                  {totalWeight > 0 ? `${totalWeight}%` : `${items.length} items`}
                </Text>
                <Text size="xs" c="dimmed">{items.length} assessment(s)</Text>
              </Card>
            );
          });
        })()}
      </Box>

      {/* Full table */}
      <Card radius="lg" padding="xl" style={{ background: "white", border: "1px solid #E2E8F0" }}>
        <SectionHeader
          icon={IconChartBar}
          title="Bảng đánh giá (Assessment Scheme)"
          count={assessment_scheme?.length}
          countLabel="assessments"
          color="#8b5cf6"
        />
        <Box style={{ overflowX: "auto", width: "100%" }}>
          <Table
            striped
            withTableBorder
            withColumnBorders
            style={{ minWidth: "1300px", tableLayout: "fixed", backgroundColor: "white" }}
            fz="xs"
          >
            <Table.Thead>
              <Table.Tr style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)" }}>
                {[
                  { label: "Category", w: "7%" },
                  { label: "Type", w: "7%" },
                  { label: "Part", w: "3%" },
                  { label: "Weight", w: "5%" },
                  { label: "Completion Criteria", w: "5%" },
                  { label: "Duration", w: "5%" },
                  { label: "CLO", w: "5%" },
                  { label: "Question Type", w: "8%" },
                  { label: "No. Questions", w: "6%" },
                  { label: "Knowledge & Skill", w: "17%" },
                  { label: "Grading Guide", w: "16%" },
                  { label: "Note", w: "16%" },
                ].map(({ label, w }) => (
                  <Table.Th
                    key={label}
                    style={{
                      color: "white",
                      fontWeight: 700,
                      width: w,
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
              {assessment_scheme?.map((a: any, idx: number) => (
                <Table.Tr key={idx}>
                  <Table.Td>
                    <Badge size="xs" radius="sm" style={{ background: "#ede9fe", color: "#7c3aed", fontWeight: 700 }}>
                      {a.category}
                    </Badge>
                  </Table.Td>
                  <Table.Td><Text size="xs">{a.type}</Text></Table.Td>
                  <Table.Td style={{ textAlign: "center" }}>
                    <Text size="xs">{a.part || "—"}</Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "center" }}>
                    <Badge
                      size="sm"
                      style={{
                        background: "#dcfce7",
                        color: "#15803d",
                        fontWeight: 800,
                        fontFamily: "monospace",
                      }}
                    >
                      {a.weight}
                    </Badge>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "center" }}>
                    <Text size="xs">{a.completion_criteria || "—"}</Text>
                  </Table.Td>
                  <Table.Td><Text size="xs">{a.duration}</Text></Table.Td>
                  <Table.Td>
                    <Text size="xs" fw={600} style={{ color: "#23AC68" }}>
                      {formatMultiline(a.clo)}
                    </Text>
                  </Table.Td>
                  <Table.Td><Text size="xs">{a.question_type || "—"}</Text></Table.Td>
                  <Table.Td style={{ textAlign: "center" }}>
                    <Text size="xs">{a.no_question || "—"}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" style={{ lineHeight: 1.6 }}>
                      {formatMultiline(a.knowledge_and_skill) || "—"}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" style={{ lineHeight: 1.6 }}>
                      {formatMultiline(a.grading_guide) || "—"}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" style={{ lineHeight: 1.6 }}>
                      {formatMultiline(a.note) || "—"}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Box>
      </Card>
    </Stack>
  );
}

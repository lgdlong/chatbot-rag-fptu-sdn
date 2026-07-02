import React from "react";
import { Stack, Alert, Group, Text, Anchor, Card, Box, Table, Badge } from "@mantine/core";
import { IconInfoCircle, IconExternalLink, IconBulb } from "@tabler/icons-react";
import { SectionHeader } from "./SyllabusHelpers";

interface SyllabusCLOsTabProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  clos: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: any;
}

export function SyllabusCLOsTab({ clos, metadata }: SyllabusCLOsTabProps) {
  return (
    <Stack gap="lg">
      <Alert
        icon={<IconInfoCircle size={16} />}
        radius="md"
        style={{
          background: "#eff6ff",
          border: "1px solid #bfdbfe",
          color: "#1d4ed8",
        }}
      >
        <Group justify="space-between" align="center" wrap="wrap" gap="xs">
          <Text size="sm" fw={600} style={{ color: "#1d4ed8" }}>
            Course Learning Outcomes (CLOs) — {clos?.length} kết quả học tập
          </Text>
          <Anchor
            href={`https://flm.fpt.edu.vn/CLOMapping/View?syllabusID=${metadata.syllabus_id}`}
            target="_blank"
            size="sm"
            style={{ color: "#1d4ed8", fontWeight: 700 }}
          >
            <Group gap={4}>
              <IconExternalLink size={14} />
              View CLO → PLO Mapping
            </Group>
          </Anchor>
        </Group>
      </Alert>

      <Card radius="lg" padding="xl" style={{ background: "white", border: "1px solid #E2E8F0" }}>
        <SectionHeader
          icon={IconBulb}
          title="Course Learning Outcomes"
          count={clos?.length}
          countLabel="CLOs"
          color="#23AC68"
        />
        <Box style={{ overflowX: "auto" }}>
          <Table striped withTableBorder withColumnBorders fz="sm">
            <Table.Thead>
              <Table.Tr style={{ background: "linear-gradient(135deg, #23AC68, #1c8c53)" }}>
                <Table.Th style={{ color: "white", fontWeight: 700, width: "80px", textAlign: "center" }}>
                  CLO Name
                </Table.Th>
                <Table.Th style={{ color: "white", fontWeight: 700, width: "30%" }}>
                  CLO Details
                </Table.Th>
                <Table.Th style={{ color: "white", fontWeight: 700 }}>
                  LO Details
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {clos?.map((clo: any, idx: number) => (
                <Table.Tr key={idx}>
                  <Table.Td style={{ textAlign: "center" }}>
                    <Badge
                      size="md"
                      radius="md"
                      style={{
                        background: "linear-gradient(135deg, #23AC68, #1c8c53)",
                        color: "white",
                        fontWeight: 800,
                      }}
                    >
                      {clo.clo_name}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" style={{ lineHeight: 1.6 }}>
                      {clo.clo_details}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" style={{ lineHeight: 1.6 }}>
                      {clo.lo_details}
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

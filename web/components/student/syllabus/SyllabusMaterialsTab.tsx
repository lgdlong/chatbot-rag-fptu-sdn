import React from "react";
import { Stack, Card, Box, Table, Anchor, Text } from "@mantine/core";
import { IconBook2 } from "@tabler/icons-react";
import { SectionHeader, BooleanCell, isMaterialChecked } from "./SyllabusHelpers";

interface SyllabusMaterialsTabProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  materials: any[];
}

export function SyllabusMaterialsTab({ materials }: SyllabusMaterialsTabProps) {
  return (
    <Stack gap="lg">
      <Card radius="lg" padding="xl" style={{ background: "white", border: "1px solid #E2E8F0" }}>
        <SectionHeader
          icon={IconBook2}
          title="Tài liệu học tập"
          count={materials?.length}
          countLabel="tài liệu"
          color="#1A3A5C"
        />
        <Box style={{ overflowX: "auto" }}>
          <Table
            striped
            withTableBorder
            withColumnBorders
            style={{ minWidth: "1000px" }}
            fz="xs"
          >
            <Table.Thead>
              <Table.Tr style={{ background: "linear-gradient(135deg, #1A3A5C, #0f2848)" }}>
                {[
                  "Material Description",
                  "Author",
                  "Publisher",
                  "Published Date",
                  "Edition",
                  "ISBN",
                  "Main",
                  "Hard Copy",
                  "Online",
                  "Note",
                ].map((h) => (
                  <Table.Th
                    key={h}
                    style={{
                      color: "white",
                      fontWeight: 700,
                      padding: "10px 12px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {materials?.map((m: any, idx: number) => (
                <Table.Tr key={idx}>
                  <Table.Td style={{ maxWidth: "240px" }}>
                    {m.description?.startsWith("http") ? (
                      <Anchor
                        href={m.description}
                        target="_blank"
                        size="xs"
                        style={{ color: "#1A3A5C" }}
                      >
                        {m.description}
                      </Anchor>
                    ) : (
                      <Text size="xs">{m.description}</Text>
                    )}
                  </Table.Td>
                  <Table.Td><Text size="xs">{m.author || "—"}</Text></Table.Td>
                  <Table.Td><Text size="xs">{m.publisher || "—"}</Text></Table.Td>
                  <Table.Td><Text size="xs" style={{ whiteSpace: "nowrap" }}>{m.published_date || "—"}</Text></Table.Td>
                  <Table.Td><Text size="xs">{m.edition || "—"}</Text></Table.Td>
                  <Table.Td><Text size="xs">{m.isbn || "—"}</Text></Table.Td>
                  <Table.Td style={{ textAlign: "center" }}>
                    <BooleanCell value={isMaterialChecked(m, "is_main_material")} />
                  </Table.Td>
                  <Table.Td style={{ textAlign: "center" }}>
                    <BooleanCell value={isMaterialChecked(m, "is_hard_copy")} />
                  </Table.Td>
                  <Table.Td style={{ textAlign: "center" }}>
                    <BooleanCell value={isMaterialChecked(m, "is_online")} />
                  </Table.Td>
                  <Table.Td><Text size="xs">{m.note || "—"}</Text></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Box>
      </Card>
    </Stack>
  );
}

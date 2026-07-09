import React from "react";
import Link from "next/link";
import { Card, Box, Stack, Group, Badge, Text, ThemeIcon } from "@mantine/core";
import { IconCheck, IconX, IconArrowRight } from "@tabler/icons-react";
import { Subject } from "./subjectsData";

interface SubjectCardProps {
  subject: Subject;
}

export function SubjectCard({ subject }: SubjectCardProps) {
  return (
    <Link
      href={`/student/syllabus/${subject.code.toLowerCase()}`}
      style={{ textDecoration: "none" }}
    >
      <Card
        padding="lg"
        radius="lg"
        style={{
          backgroundColor: "white",
          border: "1px solid #E2E8F0",
          cursor: "pointer",
          transition: "all 0.25s ease",
          height: "100%",
          position: "relative",
          overflow: "hidden",
        }}
        className="subject-card"
      >
        {/* Color accent bar */}
        <Box
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: `linear-gradient(90deg, ${subject.color}, ${subject.color}88)`,
          }}
        />

        <Stack gap="sm" h="100%">
          {/* Header row */}
          <Group justify="space-between" align="flex-start">
            <Badge
              size="lg"
              radius="md"
              style={{
                background: `${subject.color}15`,
                color: subject.color,
                border: `1px solid ${subject.color}30`,
                fontWeight: 800,
                fontFamily: "monospace",
                letterSpacing: "0.5px",
              }}
            >
              {subject.code}
            </Badge>
            <Group gap={6}>
              <Badge
                size="xs"
                radius="xl"
                style={
                  subject.isActive
                    ? { background: "#dcfce7", color: "#16a34a", border: "1px solid #bbf7d0" }
                    : { background: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca" }
                }
                leftSection={subject.isActive ? <IconCheck size={8} /> : <IconX size={8} />}
              >
                {subject.isActive ? "Active" : "Inactive"}
              </Badge>
              {subject.isApproved && (
                <Badge
                  size="xs"
                  radius="xl"
                  style={{ background: "#dbeafe", color: "#2563eb", border: "1px solid #bfdbfe" }}
                >
                  Approved
                </Badge>
              )}
            </Group>
          </Group>

          {/* Subject name */}
          <Text fw={700} size="sm" style={{ color: "#1e293b", lineHeight: 1.4, flex: 1 }}>
            {subject.name}
          </Text>

          {/* Footer */}
          <Box
            style={{
              borderTop: "1px solid #F1F5F9",
              paddingTop: "10px",
            }}
          >
            <Group justify="space-between" align="center">
              <Group gap={16}>
                <Box>
                  <Text size="10px" c="dimmed" fw={600} style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Tín chỉ
                  </Text>
                  <Text size="sm" fw={800} style={{ color: "#1A3A5C" }}>
                    {subject.credits}
                  </Text>
                </Box>
                <Box>
                  <Text size="10px" c="dimmed" fw={600} style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Syllabus ID
                  </Text>
                  <Text size="sm" fw={700} style={{ color: "#475569" }}>
                    {subject.syllabusId}
                  </Text>
                </Box>
              </Group>
              <ThemeIcon
                size={28}
                radius="xl"
                style={{
                  background: `${subject.color}15`,
                  color: subject.color,
                  transition: "all 0.2s ease",
                }}
                className="card-arrow"
              >
                <IconArrowRight size={14} />
              </ThemeIcon>
            </Group>
          </Box>
        </Stack>
      </Card>
    </Link>
  );
}

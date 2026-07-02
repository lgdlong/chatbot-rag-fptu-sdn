import React from "react";
import Link from "next/link";
import { Card, Group, Badge, Box, Text, Button } from "@mantine/core";
import { IconArrowRight } from "@tabler/icons-react";
import { Subject } from "./subjectsData";

interface SearchResultRowProps {
  subject: Subject;
}

export function SearchResultRow({ subject }: SearchResultRowProps) {
  return (
    <Card
      padding="md"
      radius="md"
      style={{
        backgroundColor: "white",
        border: "1px solid #E2E8F0",
        transition: "all 0.2s ease",
      }}
      className="search-result-row"
    >
      <Group justify="space-between" align="center" wrap="nowrap">
        <Group gap="md" align="center" style={{ flex: 1, minWidth: 0 }}>
          {/* Code badge */}
          <Badge
            size="lg"
            radius="md"
            style={{
              background: `${subject.color}15`,
              color: subject.color,
              border: `1px solid ${subject.color}30`,
              fontWeight: 800,
              fontFamily: "monospace",
              flexShrink: 0,
              minWidth: "80px",
            }}
          >
            {subject.code}
          </Badge>

          {/* Name + Decision */}
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Text fw={700} size="sm" style={{ color: "#1e293b" }} lineClamp={1}>
              {subject.name}
            </Text>
            <Text size="xs" c="dimmed" style={{ marginTop: 2 }} lineClamp={1}>
              {subject.decision}
            </Text>
          </Box>
        </Group>

        {/* Badges + Action */}
        <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
          <Badge
            size="xs"
            radius="xl"
            visibleFrom="sm"
            style={
              subject.isActive
                ? { background: "#dcfce7", color: "#16a34a", border: "1px solid #bbf7d0" }
                : { background: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca" }
            }
          >
            {subject.isActive ? "Active" : "Inactive"}
          </Badge>
          <Badge
            size="xs"
            radius="xl"
            visibleFrom="md"
            style={
              subject.isApproved
                ? { background: "#dbeafe", color: "#2563eb", border: "1px solid #bfdbfe" }
                : { background: "#fef3c7", color: "#d97706", border: "1px solid #fde68a" }
            }
          >
            {subject.isApproved ? "Approved" : "Pending"}
          </Badge>
          <Badge size="xs" radius="xl" visibleFrom="sm" style={{ background: "#F1F5F9", color: "#64748b" }}>
            {subject.credits} TC
          </Badge>

          <Link
            href={`/student/syllabus/${subject.code.toLowerCase()}`}
            style={{ textDecoration: "none" }}
          >
            <Button
              size="xs"
              radius="md"
              style={{
                background: "linear-gradient(135deg, #1A3A5C, #0f2848)",
                color: "white",
                fontWeight: 700,
                fontSize: "11px",
              }}
              rightSection={<IconArrowRight size={12} />}
            >
              Xem Syllabus
            </Button>
          </Link>
        </Group>
      </Group>
    </Card>
  );
}

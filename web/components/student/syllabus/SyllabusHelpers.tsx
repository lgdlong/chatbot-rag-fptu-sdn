import React from "react";
import { Group, ThemeIcon, Box, Text } from "@mantine/core";
import { IconCheck, IconX } from "@tabler/icons-react";

export const formatMultiline = (text: string) => {
  if (!text) return "";
  const formatted = text.replace(/([^\n])(- )/g, "$1\n$2");
  return formatted.split("\n").map((line, i, arr) => (
    <React.Fragment key={i}>
      {line}
      {i < arr.length - 1 && <br />}
    </React.Fragment>
  ));
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isMaterialChecked = (m: any, field: string) => {
  if (m[field] === "true" || m[field] === "checked" || m[field] === true || m[field] === "1")
    return true;
  if (m.description?.includes("getbootstrap.com") || m.description?.includes("react.dev")) {
    if (field === "is_main_material" || field === "is_online") return true;
  }
  return false;
};

export function SectionHeader({
  icon: Icon,
  title,
  count,
  countLabel = "items",
  color = "#1A3A5C",
}: {
  icon: React.ElementType;
  title: string;
  count?: number;
  countLabel?: string;
  color?: string;
}) {
  return (
    <Group gap="sm" align="center" mb="md">
      <ThemeIcon
        size={36}
        radius="md"
        style={{
          background: `${color}15`,
          color: color,
          border: `1px solid ${color}25`,
        }}
      >
        <Icon size={18} />
      </ThemeIcon>
      <Box>
        <Text fw={800} size="md" style={{ color: "#1e293b", lineHeight: 1.2 }}>
          {title}
        </Text>
        {count !== undefined && (
          <Text size="xs" c="dimmed" fw={500}>
            {count} {countLabel}
          </Text>
        )}
      </Box>
    </Group>
  );
}

export function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box
      style={{
        display: "grid",
        gridTemplateColumns: "240px 1fr",
        padding: "14px 20px",
        borderBottom: "1px solid #f1f5f9",
        alignItems: "center",
      }}
    >
      <Text
        size="xs"
        fw={800}
        c="dimmed"
        style={{
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {label}
      </Text>
      <Box style={{ color: "#1e293b", lineHeight: 1.6, fontSize: "14px" }}>
        {value || <span style={{ color: "#94a3b8" }}>—</span>}
      </Box>
    </Box>
  );
}

export function BooleanCell({ value }: { value: boolean }) {
  return (
    <Box style={{ display: "flex", justifyContent: "center" }}>
      {value ? (
        <ThemeIcon size={20} radius="xl" style={{ background: "#dcfce7", color: "#16a34a" }}>
          <IconCheck size={12} />
        </ThemeIcon>
      ) : (
        <ThemeIcon size={20} radius="xl" style={{ background: "#fee2e2", color: "#dc2626" }}>
          <IconX size={12} />
        </ThemeIcon>
      )}
    </Box>
  );
}

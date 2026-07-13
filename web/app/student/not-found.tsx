"use client";

import { Stack, Title, Text, Button } from "@mantine/core";
import Link from "next/link";

export default function StudentNotFound() {
  return (
    <Stack align="center" justify="center" h="60vh" gap="md" px="md">
      <Title order={1} style={{ color: "#1A3A5C", fontSize: "5rem" }}>
        404
      </Title>
      <Title order={3} c="dimmed">
        Không tìm thấy trang
      </Title>
      <Text c="dimmed" size="sm" ta="center" maw={400}>
        Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
      </Text>
      <Button
        component={Link}
        href="/student"
        radius={0}
        style={{
          background: "linear-gradient(135deg, #1A3A5C 0%, #0f2848 100%)",
          color: "white",
          fontWeight: 700,
          letterSpacing: "0.5px",
        }}
      >
        Quay lại trang chủ
      </Button>
    </Stack>
  );
}

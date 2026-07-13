"use client";

import { Stack, Title, Text, Button } from "@mantine/core";
import { useEffect } from "react";

export default function StudentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Stack align="center" justify="center" h="60vh" gap="md" px="md">
      <Title order={1} style={{ color: "#1A3A5C", fontSize: "3rem" }}>
        Đã xảy ra lỗi
      </Title>
      <Text c="dimmed" size="lg" ta="center" maw={480}>
        Có lỗi trong quá trình xử lý. Vui lòng thử lại sau.
      </Text>
      <Button
        onClick={reset}
        radius={0}
        style={{
          background: "linear-gradient(135deg, #F37021 0%, #ff8c42 100%)",
          color: "white",
          fontWeight: 700,
          letterSpacing: "0.5px",
        }}
      >
        Thử lại
      </Button>
    </Stack>
  );
}

import React from "react";
import { Collapse, Stack, Group, Text, ActionIcon, Button, ScrollArea, Box } from "@mantine/core";
import { IconX, IconPlus } from "@tabler/icons-react";
import { Message } from "./types";

interface ChatHistorySidebarProps {
  isHistoryOpen: boolean;
  setIsHistoryOpen: (open: boolean) => void;
  subjectCode: string;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export function ChatHistorySidebar({
  isHistoryOpen,
  setIsHistoryOpen,
  subjectCode,
  setMessages,
}: ChatHistorySidebarProps) {
  return (
    <Collapse
      expanded={isHistoryOpen}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        bottom: 0,
        width: "180px",
        backgroundColor: "white",
        borderRight: "1px solid #E2E8F0",
        zIndex: 200,
        height: "100%",
        boxShadow: "5px 0 15px -3px rgba(0, 0, 0, 0.05)",
      }}
    >
      <Stack p="sm" gap="md" style={{ height: "100%" }}>
        <Group justify="space-between">
          <Text fw={800} size="10px" c="dimmed" style={{ textTransform: "uppercase", letterSpacing: "1px" }}>
            Lịch sử chat
          </Text>
          <ActionIcon size="xs" variant="subtle" color="gray" onClick={() => setIsHistoryOpen(false)}>
            <IconX size={12} />
          </ActionIcon>
        </Group>

        <Button
          leftSection={<IconPlus size={14} />}
          variant="outline"
          color="#1A3A5C"
          radius={0}
          size="xs"
          fw={700}
          fullWidth
          onClick={() => {
            setMessages([
              {
                id: Date.now().toString(),
                role: "bot",
                content: `Cuộc trò chuyện mới về ${subjectCode}. Bạn cần hỗ trợ gì?`,
                timestamp: new Date(),
              },
            ]);
            setIsHistoryOpen(false);
          }}
        >
          CHAT MỚI
        </Button>

        <ScrollArea style={{ flexGrow: 1 }}>
          <Stack gap="xs">
            <Box
              p="xs"
              style={{
                backgroundColor: "#F1F5F9",
                borderLeft: "3px solid #1A3A5C",
                cursor: "pointer",
                position: "relative",
              }}
            >
              <Text fw={700} size="xs" style={{ color: "#1A3A5C" }}>{subjectCode}</Text>
              <Text size="10px" c="dimmed" truncate fs="italic">
                {'"'}thi cuối kỳ...{'"'}
              </Text>
            </Box>
          </Stack>
        </ScrollArea>
      </Stack>
    </Collapse>
  );
}

import React, { useState, useEffect, useCallback } from "react";
import { Collapse, Stack, Group, Text, ActionIcon, Button, ScrollArea, Box, Skeleton } from "@mantine/core";
import { IconX, IconPlus } from "@tabler/icons-react";
import { Message } from "./types";
import * as api from "@/lib/api";

interface ChatHistorySidebarProps {
  isHistoryOpen: boolean;
  setIsHistoryOpen: (open: boolean) => void;
  subjectCode: string;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  onNewChat?: () => void;
  setSessionId?: React.Dispatch<React.SetStateAction<string | null>>;
}

export function ChatHistorySidebar({
  isHistoryOpen,
  setIsHistoryOpen,
  subjectCode,
  setMessages,
  onNewChat,
  setSessionId,
}: ChatHistorySidebarProps) {
  const [sessions, setSessions] = useState<api.ApiChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadSessions = useCallback(async () => {
    if (!isHistoryOpen) return;
    setIsLoading(true);
    try {
      const { sessions: apiSessions } = await api.getChatSessions();
      setSessions(apiSessions);
    } catch {
      // Silently fail - history just won't show
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  }, [isHistoryOpen]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleSessionClick = async (session: api.ApiChatSession) => {
    try {
      const { session: detail } = await api.getChatSessionDetail(session.id);
      if (detail.messages && detail.messages.length > 0) {
        const mapped: Message[] = detail.messages.map((m) => ({
          id: m.id,
          role: m.sender === "USER" ? "user" : "bot",
          content: m.content,
          timestamp: new Date(m.createdAt),
        }));
        setMessages(mapped);
      }
      setSessionId?.(session.id);
      setIsHistoryOpen(false);
    } catch {
      // ignore
    }
  };

  const handleNewChat = () => {
    if (onNewChat) {
      onNewChat();
    } else {
      setMessages([
        {
          id: Date.now().toString(),
          role: "bot",
          content: `Cuộc trò chuyện mới về ${subjectCode}. Bạn cần hỗ trợ gì?`,
          timestamp: new Date(),
        },
      ]);
      setSessionId?.(null);
      setIsHistoryOpen(false);
    }
  };

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
          onClick={handleNewChat}
        >
          CHAT MỚI
        </Button>

        <ScrollArea style={{ flexGrow: 1 }}>
          <Stack gap="xs">
            {isLoading ? (
              <>
                <Skeleton height={40} />
                <Skeleton height={40} />
                <Skeleton height={40} />
              </>
            ) : sessions.length === 0 ? (
              <Text size="10px" c="dimmed" ta="center" py="md">
                Chưa có lịch sử
              </Text>
            ) : (
              sessions.map((session) => (
                <Box
                  key={session.id}
                  p="xs"
                  style={{
                    backgroundColor: "#F1F5F9",
                    borderLeft: "3px solid #1A3A5C",
                    cursor: "pointer",
                    transition: "background 0.15s ease",
                  }}
                  onClick={() => handleSessionClick(session)}
                >
                  <Text fw={700} size="xs" style={{ color: "#1A3A5C" }} lineClamp={1}>
                    {session.title}
                  </Text>
                  <Text size="10px" c="dimmed" truncate fs="italic">
                    {new Date(session.createdAt).toLocaleDateString("vi-VN")}
                  </Text>
                </Box>
              ))
            )}
          </Stack>
        </ScrollArea>
      </Stack>
    </Collapse>
  );
}

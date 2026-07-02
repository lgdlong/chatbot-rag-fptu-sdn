import React from "react";
import { ScrollArea, Stack, Box, Group, Avatar, Text, Paper, Loader } from "@mantine/core";
import { IconBook } from "@tabler/icons-react";
import { Message } from "./types";

interface ChatMessageListProps {
  messages: Message[];
  isLoading: boolean;
  viewportRef: React.RefObject<HTMLDivElement | null>;
}

export function ChatMessageList({ messages, isLoading, viewportRef }: ChatMessageListProps) {
  return (
    <ScrollArea
      style={{ flexGrow: 1, height: "100%" }}
      viewportRef={viewportRef}
      p="md"
    >
      <Stack gap="md" style={{ paddingBottom: "12px" }}>
        {messages.map((msg) => (
          <Box
            key={msg.id}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: msg.role === "user" ? "flex-end" : "flex-start",
              width: "100%",
            }}
          >
            {msg.role === "bot" && (
              <Group gap="xs" mb={4}>
                <Avatar size={18} color="#1A3A5C" radius={0} style={{ fontWeight: "bold", fontSize: "10px" }}>
                  AI
                </Avatar>
                <Text fw={800} size="10px" style={{ color: "#1A3A5C", textTransform: "uppercase" }}>
                  AI Assistant
                </Text>
              </Group>
            )}

            <Paper
              p="sm"
              radius={0}
              style={{
                maxWidth: "85%",
                backgroundColor: msg.role === "user" ? "#1A3A5C" : "white",
                color: msg.role === "user" ? "white" : "#1A1A1A",
                border: msg.role === "user" ? "none" : "1px solid #E2E8F0",
              }}
            >
              <Text size="sm" style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                {msg.content}
              </Text>
            </Paper>

            {/* Citations block */}
            {msg.citation && (
              <Paper
                mt="xs"
                p="xs"
                radius={0}
                style={{
                  maxWidth: "85%",
                  backgroundColor: "#FFFDF0",
                  borderLeft: "3px solid #FFC107",
                  borderWidth: "1px 1px 1px 3px",
                  borderColor: "#FEF08A #FEF08A #FEF08A #FFC107",
                }}
              >
                <Group gap={4} mb={2}>
                  <IconBook size={12} color="#D97706" />
                  <Text fw={800} size="10px" style={{ color: "#D97706", textTransform: "uppercase" }}>
                    Nguồn: {msg.citation.source}
                  </Text>
                </Group>
                <Text size="11px" fs="italic" style={{ color: "#4B5563" }}>
                  {'"'}{msg.citation.excerpt}{'"'}
                </Text>
              </Paper>
            )}

            <Text size="10px" c="dimmed" mt={4}>
              {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </Text>
          </Box>
        ))}

        {isLoading && (
          <Box style={{ display: "flex", flexDirection: "column", alignSelf: "flex-start" }}>
            <Group gap="xs" mb={4}>
              <Avatar size={18} color="#1A3A5C" radius={0} style={{ fontWeight: "bold", fontSize: "10px" }}>
                AI
              </Avatar>
              <Text fw={800} size="10px" style={{ color: "#1A3A5C", textTransform: "uppercase" }}>
                AI Assistant
              </Text>
            </Group>
            <Paper p="sm" radius={0} style={{ backgroundColor: "white", border: "1px solid #E2E8F0" }}>
              <Loader color="#1A3A5C" size="sm" type="dots" />
            </Paper>
          </Box>
        )}
      </Stack>
    </ScrollArea>
  );
}

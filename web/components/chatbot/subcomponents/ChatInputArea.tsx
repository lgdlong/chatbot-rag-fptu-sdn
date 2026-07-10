import React from "react";
import { Box, Group, Textarea, ActionIcon, Text } from "@mantine/core";
import { IconSend } from "@tabler/icons-react";

interface ChatInputAreaProps {
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  handleSend: () => void;
  subjectCode: string;
}

export function ChatInputArea({
  input,
  setInput,
  isLoading,
  handleSend,
  subjectCode,
}: ChatInputAreaProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box
      p="sm"
      style={{
        borderTop: "1px solid #E2E8F0",
        backgroundColor: "white",
        flexShrink: 0,
      }}
    >
      <Group gap="xs" align="flex-end">
        <Textarea
          placeholder={`Hỏi AI về môn ${subjectCode}...`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          maxRows={4}
          style={{ flexGrow: 1 }}
          styles={{
            input: {
              borderRadius: 0,
              borderColor: "#E2E8F0",
              fontSize: "13px",
              "&:focus": { borderColor: "#1A3A5C" },
            },
          }}
        />
        <ActionIcon
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          size="lg"
          radius={0}
          style={{
            backgroundColor: !input.trim() || isLoading ? "#E2E8F0" : "#1A3A5C",
            color: "white",
            height: "36px",
            width: "36px",
          }}
        >
          <IconSend size={18} />
        </ActionIcon>
      </Group>
      <Group justify="space-between" mt={4}>
        <Text size="9px" c="dimmed">
          Trợ lý AI trả lời dựa trên Syllabus chính thức
        </Text>
        <Text size="9px" c={input.length > 4900 ? "red" : "dimmed"}>
          {input.length}/5000
        </Text>
      </Group>
    </Box>
  );
}

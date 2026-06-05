"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Paper,
  Text,
  Button,
  ActionIcon,
  Textarea,
  Stack,
  Group,
  ScrollArea,
  Avatar,
  ThemeIcon,
  Collapse,
  Loader,
  Box,
} from "@mantine/core";
import {
  IconMessageChatbot,
  IconX,
  IconSend,
  IconHistory,
  IconBook,
  IconTrash,
  IconPlus,
} from "@tabler/icons-react";

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
  citation?: {
    source: string;
    excerpt: string;
  };
  timestamp: Date;
}

interface ChatbotWidgetProps {
  subjectCode: string;
}

export function ChatbotWidget({ subjectCode }: ChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "bot",
      content: `Xin chào! Tôi là trợ lý của môn học ${subjectCode}. Bạn muốn tìm hiểu gì về đề chương (Syllabus) hay tài liệu của môn học này?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollHeight = scrollAreaRef.current.scrollHeight;
      scrollAreaRef.current.scrollTo({ top: scrollHeight, behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 50);
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!input.trim() || isLoading || input.length > 5000) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Mock API answer based on subject keywords
    setTimeout(() => {
      const contentLower = userMsg.content.toLowerCase();
      const isAssessment = contentLower.includes("thi") || contentLower.includes("điểm") || contentLower.includes("đánh giá");
      const isCredits = contentLower.includes("tín chỉ") || contentLower.includes("credit");
      
      let reply = "";
      let citation = undefined;

      if (isAssessment) {
        reply = `Trong môn học ${subjectCode}, cấu trúc đánh giá (Assessment Scheme) bao gồm các thành phần quan trọng. Thông thường Final Exam chiếm 30% tổng điểm và yêu cầu điểm số trung bình tối thiểu để qua môn là 5.0.`;
        citation = {
          source: "Cơ cấu đánh giá (Assessment Scheme)",
          excerpt: "Final Exam: 30%, Passing mark: 5.0"
        };
      } else if (isCredits) {
        reply = `Môn học ${subjectCode} có thời lượng phân bổ là 3 tín chỉ (Credits), tương ứng với khoảng 30 session học trên lớp kết hợp tự học.`;
        citation = {
          source: "Thông tin chung (General Information)",
          excerpt: "Credits: 3, Time Allocation: 30 sessions"
        };
      } else {
        reply = `Tôi đã nhận được câu hỏi về ${subjectCode}. Dựa trên tài liệu Syllabus, nội dung này tập trung vào các kiến thức cốt lõi và chuẩn đầu ra (CLOs) của môn học. Bạn có muốn xem cụ thể về chuẩn đầu ra CLO hay kế hoạch giảng dạy từng session không?`;
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        content: reply,
        citation,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <Button
        onClick={() => setIsOpen(true)}
        size="lg"
        radius={0}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          backgroundColor: "#1A3A5C",
          color: "white",
          zIndex: 1000,
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
          display: isOpen ? "none" : "flex",
          transition: "transform 0.2s ease",
        }}
        leftSection={<IconMessageChatbot size={22} />}
        fw={800}
        className="hover-scale"
      >
        HỎI AI TRỢ LÝ
      </Button>

      {/* Chat Window Panel */}
      {isOpen && (
        <Paper
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            width: "380px",
            height: "580px",
            backgroundColor: "white",
            border: "1px solid #E2E8F0",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            display: "flex",
            flexDirection: "column",
            zIndex: 1000,
            overflow: "hidden",
          }}
          radius={0}
        >
          {/* Header */}
          <Group
            justify="space-between"
            px="md"
            style={{
              height: "52px",
              backgroundColor: "#1A3A5C",
              color: "white",
              borderBottom: "1px solid #0D2137",
              flexShrink: 0,
            }}
          >
            <ActionIcon
              variant="subtle"
              color="white"
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              title="Lịch sử chat"
            >
              <IconHistory size={20} />
            </ActionIcon>
            <Text fw={800} size="sm" style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Hỏi đáp {subjectCode}
            </Text>
            <ActionIcon variant="subtle" color="white" onClick={() => setIsOpen(false)}>
              <IconX size={20} />
            </ActionIcon>
          </Group>

          {/* Main Content Area */}
          <Box style={{ flexGrow: 1, display: "flex", position: "relative", overflow: "hidden", backgroundColor: "#F8FAFC" }}>
            
            {/* History Drawer Sidebar Overlay */}
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
                        "thi cuối kỳ..."
                      </Text>
                    </Box>
                  </Stack>
                </ScrollArea>
              </Stack>
            </Collapse>

            {/* Chat Messages Log */}
            <ScrollArea
              style={{ flexGrow: 1, height: "100%" }}
              viewportRef={scrollAreaRef}
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
                          "{msg.citation.excerpt}"
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
          </Box>

          {/* Input Area */}
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
        </Paper>
      )}
    </>
  );
}

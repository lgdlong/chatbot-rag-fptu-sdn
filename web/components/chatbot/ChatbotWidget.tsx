"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Paper, Button, ActionIcon, Text, Group, Box } from "@mantine/core";
import { IconMessageChatbot, IconX, IconHistory } from "@tabler/icons-react";

import { Message } from "./subcomponents/types";
import { ChatHistorySidebar } from "./subcomponents/ChatHistorySidebar";
import { ChatMessageList } from "./subcomponents/ChatMessageList";
import { ChatInputArea } from "./subcomponents/ChatInputArea";
import * as api from "@/lib/api";

interface ChatbotWidgetProps {
  subjectCode: string;
  courseId?: string | null;
}

export function ChatbotWidget({ subjectCode, courseId }: ChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "bot",
      content: `Xin chào! Tôi là trợ lý AI của môn học ${subjectCode}. Bạn muốn tìm hiểu gì về đề cương (Syllabus) hay tài liệu của môn học này?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

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

  // Create a chat session when the widget opens (if not already created)
  const ensureSession = useCallback(async () => {
    if (sessionId) return sessionId;

    try {
      const options: Parameters<typeof api.createChatSession>[0] = {};

      if (courseId) {
        options.scopeMode = "SELECTED_COURSES";
        options.courseIds = [courseId];
      } else {
        options.scopeMode = "ALL_COURSES";
      }

      const { session } = await api.createChatSession(options);
      setSessionId(session.id);
      return session.id;
    } catch (err) {
      console.error("Failed to create chat session:", err);
      return null;
    }
  }, [courseId, sessionId]);

  const handleSend = async () => {
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

    // Ensure we have a session
    const sid = await ensureSession();
    if (!sid) {
      // Fallback: mock response if session creation fails
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        content: "⚠️ Không thể kết nối đến server RAG. Vui lòng kiểm tra backend đã chạy chưa.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsLoading(false);
      return;
    }

    // Add an empty bot message that we'll stream into
    const botMsgId = (Date.now() + 1).toString();
    const botMsg: Message = {
      id: botMsgId,
      role: "bot",
      content: "",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, botMsg]);

    // Stream response via SSE
    abortRef.current = api.sendChatMessageStream(sid, userMsg.content, {
      onChunk: (chunk) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId ? { ...m, content: m.content + chunk } : m
          )
        );
      },
      onCitations: (citations) => {
        if (citations && citations.length > 0) {
          // Append citation info to the bot message
          const citationText = (citations as Array<{ source?: string; excerpt?: string }>)
            .map((c, i) => `[${i + 1}] ${c.source || "Nguồn tài liệu"}`)
            .join("\n");

          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMsgId
                ? {
                    ...m,
                    citation: {
                      source: "Trích dẫn từ tài liệu",
                      excerpt: citationText,
                    },
                  }
                : m
            )
          );
        }
      },
      onError: (error) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId
              ? {
                  ...m,
                  content: m.content || `⚠️ Lỗi: ${error}`,
                }
              : m
          )
        );
      },
      onDone: () => {
        setIsLoading(false);
      },
    });
  };

  // Create a new session
  const handleNewChat = useCallback(() => {
    // Cancel any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setSessionId(null);
    setMessages([
      {
        id: Date.now().toString(),
        role: "bot",
        content: `Cuộc trò chuyện mới về ${subjectCode}. Bạn cần hỗ trợ gì?`,
        timestamp: new Date(),
      },
    ]);
    setIsHistoryOpen(false);
    setIsLoading(false);
  }, [subjectCode]);

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
        AI TRỢ LÝ
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
            <ChatHistorySidebar
              isHistoryOpen={isHistoryOpen}
              setIsHistoryOpen={setIsHistoryOpen}
              subjectCode={subjectCode}
              setMessages={setMessages}
              onNewChat={handleNewChat}
              setSessionId={setSessionId}
            />

            {/* Chat Messages Log */}
            <ChatMessageList
              messages={messages}
              isLoading={isLoading}
              viewportRef={scrollAreaRef}
            />
          </Box>

          {/* Input Area */}
          <ChatInputArea
            input={input}
            setInput={setInput}
            isLoading={isLoading}
            handleSend={handleSend}
            subjectCode={subjectCode}
          />
        </Paper>
      )}
    </>
  );
}

"use client";

import React, { useState, useRef, useEffect } from "react";
import { Paper, Button, ActionIcon, Text, Group, Box } from "@mantine/core";
import { IconMessageChatbot, IconX, IconHistory } from "@tabler/icons-react";

import { Message } from "./subcomponents/types";
import { ChatHistorySidebar } from "./subcomponents/ChatHistorySidebar";
import { ChatMessageList } from "./subcomponents/ChatMessageList";
import { ChatInputArea } from "./subcomponents/ChatInputArea";

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

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Title,
  Text,
  Stack,
  Box,
  Group,
  Combobox,
  useCombobox,
  InputBase,
  Input,
  Button,
  Paper,
  Loader,
  Center,
} from "@mantine/core";
import { IconMessageChatbot, IconHistory, IconBook } from "@tabler/icons-react";

import { Message } from "../../../components/chatbot/subcomponents/types";
import { ChatMessageList } from "../../../components/chatbot/subcomponents/ChatMessageList";
import { ChatInputArea } from "../../../components/chatbot/subcomponents/ChatInputArea";
import { ChatHistorySidebar } from "../../../components/chatbot/subcomponents/ChatHistorySidebar";
import * as api from "@/lib/api";

interface CourseOption {
  id: string;
  code: string;
  name: string;
}

export default function TeacherChatPage() {
  const [selectedCourse, setSelectedCourse] = useState<CourseOption | null>(null);
  const [search, setSearch] = useState("");

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: () => api.getCourses(),
    select: (data) => data.courses || [],
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const combobox = useCombobox();

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: "smooth" });
    }
  };

  useEffect(() => {
    setTimeout(scrollToBottom, 50);
  }, [messages]);

  // Ensure chat session for selected course
  const ensureSession = useCallback(async () => {
    if (!selectedCourse) return null;
    if (sessionId) return sessionId;

    try {
      const { session } = await api.createChatSession({
        scopeMode: "SELECTED_COURSES",
        courseIds: [selectedCourse.id],
      });
      setSessionId(session.id);
      return session.id;
    } catch {
      return null;
    }
  }, [selectedCourse, sessionId]);

  const handleCourseChange = (course: CourseOption) => {
    if (course.id === selectedCourse?.id) return;
    // Cancel any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setSelectedCourse(course);
    setSessionId(null);
    setMessages([
      {
        id: Date.now().toString(),
        role: "bot",
        content: `Xin chào! Tôi là trợ lý AI của môn học **${course.code} - ${course.name}**. Bạn muốn tìm hiểu gì về đề cương (Syllabus) hay tài liệu của môn học này?`,
        timestamp: new Date(),
      },
    ]);
    setIsLoading(false);
    combobox.closeDropdown();
  };

  const handleNewChat = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setSessionId(null);
    if (selectedCourse) {
      setMessages([
        {
          id: Date.now().toString(),
          role: "bot",
          content: `Cuộc trò chuyện mới về ${selectedCourse.code}. Bạn cần hỗ trợ gì?`,
          timestamp: new Date(),
        },
      ]);
    } else {
      setMessages([]);
    }
    setIsHistoryOpen(false);
    setIsLoading(false);
  }, [selectedCourse]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || input.length > 5000) return;
    if (!selectedCourse) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    const sid = await ensureSession();
    if (!sid) {
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

    const botMsgId = (Date.now() + 1).toString();
    const botMsg: Message = { id: botMsgId, role: "bot", content: "", timestamp: new Date() };
    setMessages((prev) => [...prev, botMsg]);

    abortRef.current = api.sendChatMessageStream(sid, userMsg.content, {
      onChunk: (chunk) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === botMsgId ? { ...m, content: m.content + chunk } : m))
        );
      },
      onCitations: (citations) => {
        if (citations && citations.length > 0) {
          const citationText = (citations as Array<{ source?: string; excerpt?: string }>)
            .map((c: any, i: number) => `[${i + 1}] ${c.source || c.title || "Nguồn tài liệu"}`)
            .join("\n");
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMsgId
                ? { ...m, citation: { source: "Trích dẫn từ tài liệu", excerpt: citationText } }
                : m
            )
          );
        }
      },
      onError: (error) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === botMsgId ? { ...m, content: m.content || `⚠️ Lỗi: ${error}` } : m))
        );
      },
      onDone: () => setIsLoading(false),
    });
  };

  // Build combobox options + filter/sort by search chars
  const q = search.trim().toLowerCase();
  const filteredOptions = courses
    .map((c) => ({ value: c.id, label: `${c.code} - ${c.name}`, code: c.code, name: c.name }))
    .filter((opt) => !q || opt.code.toLowerCase().includes(q) || opt.name.toLowerCase().includes(q))
    .sort((a, b) => {
      if (!q) return a.code.localeCompare(b.code);
      // Prioritise code match over name match
      const aCodeMatch = a.code.toLowerCase().includes(q);
      const bCodeMatch = b.code.toLowerCase().includes(q);
      if (aCodeMatch && !bCodeMatch) return -1;
      if (!aCodeMatch && bCodeMatch) return 1;
      return a.code.localeCompare(b.code);
    });

  const selectedLabel = selectedCourse ? `${selectedCourse.code} - ${selectedCourse.name}` : "";

  return (
    <Stack gap="lg" style={{ height: "calc(100vh - 100px)" }}>
      {/* Header + Subject Selector */}
      <Group justify="space-between" align="center" wrap="nowrap">
        <Group gap="sm">
          <IconMessageChatbot size={24} color="#1A3A5C" />
          <Title order={2} style={{ fontSize: "20px", fontWeight: 900, color: "#1A3A5C" }}>
            Trợ lý AI
          </Title>
        </Group>

        <Group gap="sm" wrap="nowrap">
          <Text size="sm" fw={700} c="dimmed" style={{ whiteSpace: "nowrap" }}>
            Chọn môn học:
          </Text>
          <Combobox
            store={combobox}
            onOptionSubmit={(val) => {
              const course = courses.find((c) => c.id === val);
              if (course) {
                handleCourseChange(course);
                setSearch("");
                combobox.closeDropdown();
              }
            }}
          >
            <Combobox.Target>
              <InputBase
                component="button"
                type="button"
                pointer
                rightSection={<Combobox.Chevron />}
                rightSectionPointerEvents="none"
                radius={0}
                style={{ minWidth: "380px" }}
                styles={{ input: { fontWeight: 600, fontSize: "13px" } }}
                onClick={() => combobox.toggleDropdown()}
              >
                {selectedLabel || (coursesLoading ? "Đang tải..." : "Gõ để tìm môn học...")}
              </InputBase>
            </Combobox.Target>

            <Combobox.Dropdown>
              {/* Search input inside dropdown */}
              <Combobox.Search
                value={search}
                onChange={(e) => setSearch(e.currentTarget.value)}
                placeholder="Tìm theo mã hoặc tên môn..."
                radius={0}
                styles={{ input: { fontSize: "13px" } }}
              />
              <Combobox.Options mah={300} style={{ overflowY: "auto" }}>
                {filteredOptions.length === 0 ? (
                  <Combobox.Empty>
                    {coursesLoading ? "Đang tải..." : "Không tìm thấy môn học nào"}
                  </Combobox.Empty>
                ) : (
                  filteredOptions.map((opt) => (
                    <Combobox.Option value={opt.value} key={opt.value}>
                      {opt.label}
                    </Combobox.Option>
                  ))
                )}
              </Combobox.Options>
            </Combobox.Dropdown>
          </Combobox>

          <Button
            variant="outline"
            size="xs"
            radius={0}
            color="#1A3A5C"
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            leftSection={<IconHistory size={14} />}
          >
            Lịch sử
          </Button>

          <Button
            size="xs"
            radius={0}
            color="#F37021"
            onClick={handleNewChat}
            disabled={!selectedCourse}
          >
            + Tạo mới
          </Button>
        </Group>
      </Group>

      {/* Chat Area */}
      <Box style={{ flexGrow: 1, position: "relative" }}>
        {!selectedCourse ? (
          <Center h="100%">
            <Stack align="center" gap="md">
              <IconBook size={48} color="#CBD5E1" />
              <Text size="lg" c="dimmed" fw={600}>
                Chọn một môn học để bắt đầu hỏi đáp
              </Text>
              <Text size="sm" c="dimmed">
                Sử dụng combobox phía trên để chọn môn học
              </Text>
            </Stack>
          </Center>
        ) : (
          <Paper
            radius={0}
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              border: "1px solid #E2E8F0",
              backgroundColor: "#F8FAFC",
            }}
          >
            {/* History Sidebar */}
            <ChatHistorySidebar
              isHistoryOpen={isHistoryOpen}
              setIsHistoryOpen={setIsHistoryOpen}
              subjectCode={selectedCourse.code}
              setMessages={setMessages}
              onNewChat={handleNewChat}
              setSessionId={setSessionId}
            />

            {/* Messages */}
            <ChatMessageList
              messages={messages}
              isLoading={isLoading}
              viewportRef={scrollAreaRef}
            />

            {/* Input */}
            <ChatInputArea
              input={input}
              setInput={setInput}
              isLoading={isLoading}
              handleSend={handleSend}
              subjectCode={selectedCourse.code}
            />
          </Paper>
        )}
      </Box>
    </Stack>
  );
}

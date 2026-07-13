"use client";

import React, { useState } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import {
  Title,
  Text,
  TextInput,
  Button,
  Stack,
  Group,
  Card,
  Box,
  Badge,
  ThemeIcon,
  Skeleton,
  Alert,
} from "@mantine/core";
import {
  IconSearch,
  IconAlertCircle,
  IconSparkles,
  IconWifiOff,
} from "@tabler/icons-react";

import { Subject, ALL_SUBJECTS, mapSyllabusToSubject } from "@/components/student/subjectsData";
import { SearchResultRow } from "@/components/student/SearchResultRow";
import * as api from "@/lib/api";

export default function StudentDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dismissedError, setDismissedError] = useState(false);

  // Load all syllabuses — infinite scroll pagination
  const initialQuery = useInfiniteQuery({
    queryKey: ["student-syllabuses"],
    queryFn: ({ pageParam = 1 }) => api.searchSyllabus(undefined, pageParam),
    getNextPageParam: (lastPage) => {
      const totalPages = Math.ceil(lastPage.total / lastPage.limit);
      return lastPage.page < totalPages ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
  });

  // Search when user types 2+ characters
  const searchQuery = useQuery({
    queryKey: ["student-syllabuses", searchTerm],
    queryFn: () => api.searchSyllabus(searchTerm || undefined),
    enabled: searchTerm.length >= 2,
  });

  // Derived state — flatten all loaded pages
  const allSyllabuses = initialQuery.data?.pages.flatMap((p) => p.syllabuses) ?? [];
  const allSubjects = allSyllabuses.length > 0
    ? allSyllabuses.map((s, i) => mapSyllabusToSubject(s, i))
    : ALL_SUBJECTS;

  const searchRaw = searchQuery.data?.syllabuses;
  const results = searchTerm.length >= 2
    ? (searchRaw ? searchRaw.map((s, i) => mapSyllabusToSubject(s, i)) : [])
    : [];

  const isSearching = searchTerm.length >= 2 ? searchQuery.isLoading : false;
  const isLoadingSubjects = initialQuery.isLoading;
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = initialQuery;
  const hasSearched = searchTerm.length >= 2;

  const apiError = !dismissedError && (
    searchTerm.length >= 2
      ? searchQuery.isError
        ? "Không thể kết nối đến server."
        : null
      : initialQuery.isError
        ? "Không thể kết nối đến server. Đang hiển thị dữ liệu mẫu."
        : null
  );

  const handleSearch = () => {
    if (searchTerm.trim().length < 2) return;
    // Query fires automatically via enabled condition
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleClear = () => {
    setSearchTerm("");
    setDismissedError(false);
  };

  return (
    <Box style={{ backgroundColor: "#F0F4F8", minHeight: "100vh" }}>
      {/* ─── Hero Section ─── */}
      <Box
        style={{
          background: "linear-gradient(135deg, #1A3A5C 0%, #0f2848 50%, #0a1e3d 100%)",
          padding: "48px 0 64px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background decorative elements */}
        <Box
          style={{
            position: "absolute",
            top: "-60px",
            right: "-60px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "rgba(243, 112, 33, 0.06)",
            pointerEvents: "none",
          }}
        />
        <Box
          style={{
            position: "absolute",
            bottom: "-80px",
            left: "10%",
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            background: "rgba(35, 172, 104, 0.05)",
            pointerEvents: "none",
          }}
        />

        <Box px={{ base: "md", sm: "xl" }}>
          <Stack gap="lg" align="center" style={{ textAlign: "center" }}>
            <Group gap="xs" justify="center">
              <ThemeIcon
                size={40}
                radius="xl"
                style={{
                  background: "rgba(243, 112, 33, 0.15)",
                  color: "#F37021",
                  border: "1px solid rgba(243, 112, 33, 0.3)",
                }}
              >
                <IconSparkles size={20} />
              </ThemeIcon>
              <Badge
                size="md"
                radius="xl"
                style={{
                  background: "rgba(243, 112, 33, 0.12)",
                  border: "1px solid rgba(243, 112, 33, 0.3)",
                  color: "#F37021",
                  fontWeight: 700,
                }}
              >
                FPT University · Tra cứu học thuật
              </Badge>
            </Group>

            <Title
              order={1}
              style={{
                fontSize: "clamp(28px, 5vw, 42px)",
                fontWeight: 900,
                color: "white",
                lineHeight: 1.2,
                fontFamily: "var(--font-geist-sans), sans-serif",
              }}
            >
              Tìm kiếm <span style={{ color: "#F37021" }}>Môn học & Syllabus</span>
            </Title>

            <Text
              size="md"
              style={{
                color: "rgba(255,255,255,0.7)",
                maxWidth: "600px",
                lineHeight: 1.6,
              }}
            >
              Tra cứu đề cương chi tiết (Syllabus) và hỏi đáp trợ lý học tập AI theo từng môn cụ thể tại FPT University.
            </Text>

            {/* Search Input Box */}
            <Box style={{ width: "100%", maxWidth: "680px", marginTop: "12px" }}>
              <Group gap={0} wrap="nowrap" style={{ boxShadow: "0 10px 30px rgba(10,30,61,0.25)", borderRadius: "12px" }}>
                <TextInput
                  placeholder="Nhập mã môn hoặc tên môn (VD: FER202, NodeJS, React...)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.currentTarget.value)}
                  onKeyDown={handleKeyDown}
                  leftSection={<IconSearch size={18} color="#94a3b8" />}
                  style={{ flex: 1 }}
                  styles={{
                    input: {
                      borderRadius: "12px 0 0 12px",
                      border: "2px solid rgba(255,255,255,0.15)",
                      background: "rgba(255,255,255,0.95)",
                      fontSize: "14px",
                      height: "52px",
                      "&:focus": {
                        borderColor: "#F37021",
                      },
                    },
                  }}
                />
                <Button
                  size="lg"
                  radius={0}
                  loading={isSearching}
                  style={{
                    background: "linear-gradient(135deg, #F37021, #e05e10)",
                    borderRadius: "0 12px 12px 0",
                    fontWeight: 800,
                    letterSpacing: "0.5px",
                    padding: "0 24px",
                    height: "52px",
                    border: "none",
                  }}
                  onClick={handleSearch}
                >
                  TÌM KIẾM
                </Button>
              </Group>

              <Text
                size="xs"
                style={{ color: "rgba(255,255,255,0.4)", marginTop: "8px", textAlign: "left" }}
              >
                Nhập ít nhất 2 ký tự · Gõ Enter hoặc click Tìm kiếm
              </Text>
            </Box>
          </Stack>
        </Box>
      </Box>

      {/* ─── Content Area ─── */}
      <Box px={{ base: "md", sm: "xl" }} py="xl">
        {/* API Error Banner */}
        {apiError && (
          <Alert
            icon={<IconWifiOff size={16} />}
            title="Chế độ Offline"
            color="yellow"
            radius="md"
            mb="lg"
            withCloseButton
            onClose={() => setDismissedError(true)}
          >
            {apiError}
          </Alert>
        )}

        {/* ─── Search Results ─── */}
        {hasSearched && (
          <Stack gap="md" mb="xl">
            <Group justify="space-between" align="center">
              <Group gap="xs">
                <Text size="xs" fw={700} c="dimmed" style={{ letterSpacing: "1px", textTransform: "uppercase" }}>
                  Kết quả tìm kiếm
                </Text>
                <Badge
                  size="sm"
                  radius="xl"
                  style={{
                    background: results.length > 0 ? "#dbeafe" : "#fee2e2",
                    color: results.length > 0 ? "#2563eb" : "#dc2626",
                    fontWeight: 700,
                  }}
                >
                  {results.length} môn
                </Badge>
              </Group>
              <Button
                size="xs"
                variant="subtle"
                color="gray"
                onClick={handleClear}
                style={{ fontSize: "12px" }}
              >
                Xóa kết quả
              </Button>
            </Group>

            {isSearching ? (
              <Stack gap="xs">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} height={70} radius="md" />
                ))}
              </Stack>
            ) : results.length === 0 ? (
              <Card
                p="xl"
                radius="lg"
                style={{
                  border: "1px dashed #CBD5E1",
                  backgroundColor: "white",
                  textAlign: "center",
                }}
              >
                <Stack align="center" gap="sm">
                  <ThemeIcon size={56} radius="xl" style={{ background: "#F8FAFC", color: "#94a3b8" }}>
                    <IconAlertCircle size={28} />
                  </ThemeIcon>
                  <Text size="md" fw={700} style={{ color: "#64748B" }}>
                    Không tìm thấy môn học tương ứng.
                  </Text>
                  <Text size="sm" c="dimmed">
                    Vui lòng kiểm tra lại từ khóa. Thử tìm bằng mã môn (VD: FER202) hoặc tên môn.
                  </Text>
                </Stack>
              </Card>
            ) : (
              <Stack gap="xs">
                {results.map((subject) => (
                  <SearchResultRow key={`${subject.code}-${subject.syllabusId}`} subject={subject} />
                ))}
              </Stack>
            )}
          </Stack>
        )}

        {/* ─── All subjects grid ─── */}
        {!hasSearched && (
          <Stack gap="xl">
            <Stack gap="md">
              <Group justify="space-between" align="center">
                <Box>
                  <Text size="xs" fw={700} c="dimmed" style={{ textTransform: "uppercase", letterSpacing: "1px" }}>
                    Tất cả môn học
                  </Text>
                  <Text fw={800} style={{ color: "#1A3A5C", fontSize: "18px" }}>
                    Danh sách Syllabus ({allSubjects.length} môn)
                  </Text>
                </Box>
              </Group>

              {isLoadingSubjects ? (
                <Stack gap="xs">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} height={70} radius="md" />
                  ))}
                </Stack>
              ) : (
                <Stack gap="xs">
                  {allSubjects.map((subject) => (
                    <SearchResultRow key={`${subject.code}-${subject.syllabusId}`} subject={subject} />
                  ))}

                  {/* Load more button */}
                  {hasNextPage && (
                    <Group justify="center" mt="md">
                      <Button
                        variant="outline"
                        color="#1A3A5C"
                        radius="md"
                        size="sm"
                        fw={700}
                        loading={isFetchingNextPage}
                        onClick={() => fetchNextPage()}
                        style={{ borderColor: "#CBD5E1" }}
                      >
                        {isFetchingNextPage ? "Đang tải..." : "Tải thêm 20 môn"}
                      </Button>
                    </Group>
                  )}
                </Stack>
              )}
            </Stack>
          </Stack>
        )}
      </Box>

      <style>{`
        .subject-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(26, 58, 92, 0.12) !important;
          border-color: #CBD5E1 !important;
        }
        .subject-card:hover .card-arrow {
          transform: translateX(3px);
        }
        .search-result-row:hover {
          border-color: #CBD5E1 !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06) !important;
        }
      `}</style>
    </Box>
  );
}

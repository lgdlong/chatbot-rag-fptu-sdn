"use client";

import React, { useState } from "react";
import {
  Title,
  Text,
  Tabs,
  TextInput,
  Group,
  Stack,
  Card,
  Box,
} from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { CurriculumTab } from "@/components/teacher/curriculum/CurriculumTab";
import { MajorTab } from "@/components/teacher/curriculum/MajorTab";
import { SpecializationTab } from "@/components/teacher/curriculum/SpecializationTab";
import { SubjectTab } from "@/components/teacher/curriculum/SubjectTab";

export default function CurriculumManagementPage() {
  const [activeTab, setActiveTab] = useState<string | null>("curriculum");
  const [search, setSearch] = useState("");

  return (
    <Stack gap="xl">
      {/* Header */}
      <Group justify="space-between" align="center">
        <div>
          <Title order={1} style={{ fontSize: "24px", fontWeight: 900, color: "#1A3A5C" }}>
            Chương trình đào tạo
          </Title>
          <Text size="sm" c="dimmed">
            Quản lý Môn học, Ngành, Chuyên ngành hẹp và Khung chương trình (Curriculum)
          </Text>
        </div>
      </Group>

      {/* Tabs Layout */}
      <Tabs value={activeTab} onChange={setActiveTab} radius={0} variant="outline" styles={{
        tab: {
          fontWeight: 700,
          fontSize: "13px",
          color: "#4B5563",
        }
      }}>
        <Tabs.List style={{ backgroundColor: "white", borderBottom: "1px solid #E2E8F0" }}>
          <Tabs.Tab value="subject">Môn học (Subject)</Tabs.Tab>
          <Tabs.Tab value="curriculum">Khung Chương trình (Curriculum)</Tabs.Tab>
          <Tabs.Tab value="major">Ngành (Major)</Tabs.Tab>
          <Tabs.Tab value="specialization">Chuyên ngành hẹp (Specialization)</Tabs.Tab>
        </Tabs.List>

        <Card p={0} radius={0} style={{ border: "1px solid #E2E8F0", borderTop: "none", backgroundColor: "white" }}>
          <Box p="md" style={{ borderBottom: "1px solid #E2E8F0" }}>
            <TextInput
              placeholder="Tìm kiếm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftSection={<IconSearch size={16} color="#9CA3AF" />}
              radius={0}
              style={{ maxWidth: "400px" }}
            />
          </Box>

          <Tabs.Panel value="subject">
            <SubjectTab search={search} />
          </Tabs.Panel>

          <Tabs.Panel value="curriculum">
            <CurriculumTab search={search} />
          </Tabs.Panel>

          <Tabs.Panel value="major">
            <MajorTab search={search} />
          </Tabs.Panel>

          <Tabs.Panel value="specialization">
            <SpecializationTab search={search} />
          </Tabs.Panel>
        </Card>
      </Tabs>
    </Stack>
  );
}

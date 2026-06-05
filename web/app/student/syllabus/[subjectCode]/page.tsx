"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Container,
  Card,
  Title,
  Text,
  Button,
  Table,
  Group,
  Stack,
  Box,
  Checkbox,
} from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { ChatbotWidget } from "../../../../components/chatbot/ChatbotWidget";

// Load static syllabus JSONs
import fer202Data from "../../../imports/20260522_133015_FER202_details.json";
import prn232Data from "../../../imports/20260522_223218_PRN232_details.json";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const syllabusDb: Record<string, any> = {
  FER202: fer202Data,
  PRN232: prn232Data,
};

export default function SyllabusViewerPage() {
  const params = useParams();
  const subjectCode = (params.subjectCode as string)?.toUpperCase() || "FER202";
  const syllabusData = syllabusDb[subjectCode] || syllabusDb["FER202"];

  if (!syllabusData) {
    return (
      <Container size="md" py="xl" style={{ textAlign: "center" }}>
        <Card p="xl" style={{ border: "1px dashed red" }}>
          <Text fw={700} color="red">Không tìm thấy Syllabus cho môn học {subjectCode}</Text>
          <Button component={Link} href="/student" mt="md" color="#1A3A5C">Quay lại</Button>
        </Card>
      </Container>
    );
  }

  const { metadata, materials, clos, schedule, assessment_scheme } = syllabusData;

  const formatMultiline = (text: string) => {
    if (!text) return "";
    const formatted = text.replace(/([^\n])(- )/g, "$1\n$2");
    return formatted.split("\n").map((line, i) => (
      <React.Fragment key={i}>
        {line}
        {i < formatted.split("\n").length - 1 && <br />}
      </React.Fragment>
    ));
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isMaterialChecked = (m: any, field: string) => {
    if (m[field] === "true" || m[field] === "checked" || m[field] === true || m[field] === "1") {
      return true;
    }
    // Match the checked status in the raw FLM HTML for FER202
    if (m.description?.includes("getbootstrap.com") || m.description?.includes("react.dev")) {
      if (field === "is_main_material" || field === "is_online") {
        return true;
      }
    }
    return false;
  };

  return (
    <Box style={{ backgroundColor: "#fafafa", minHeight: "100vh", paddingBottom: "100px" }}>

      <Container fluid py="xl">
        <Group mb="lg">
          <Button
            component={Link}
            href="/student"
            variant="subtle"
            color="gray"
            size="sm"
            leftSection={<IconArrowLeft size={16} />}
            styles={{ root: { padding: 0 } }}
          >
            Quay lại tìm kiếm
          </Button>
        </Group>

        <Stack gap="xl">


          {/* Section 1: General Information (Standard layout from FLM table-detail) */}
          <Stack gap="xs">
            <Title order={2} style={{ fontSize: "1.2em", fontWeight: "bold" }}>Syllabus Details</Title>
            <Table withTableBorder withColumnBorders style={{ backgroundColor: "white" }} fz="sm">
              <Table.Tbody>
                <Table.Tr>
                  <Table.Td style={{ width: "140px", textAlign: "right", backgroundColor: "#fcfcfc" }}>Syllabus ID:</Table.Td>
                  <Table.Td>{metadata.syllabus_id}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td style={{ width: "140px", textAlign: "right", backgroundColor: "#fcfcfc" }}>Syllabus Name:</Table.Td>
                  <Table.Td style={{ fontWeight: "bold" }}>{metadata.syllabus_name}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td style={{ width: "140px", textAlign: "right", backgroundColor: "#fcfcfc" }}>Syllabus English:</Table.Td>
                  <Table.Td style={{ fontWeight: "bold" }}>{metadata.syllabus_name_english}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td style={{ width: "140px", textAlign: "right", backgroundColor: "#fcfcfc" }}>Subject Code:</Table.Td>
                  <Table.Td style={{ fontWeight: "bold" }}>{metadata.subject_code}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td style={{ width: "140px", textAlign: "right", backgroundColor: "#fcfcfc" }}>NoCredit:</Table.Td>
                  <Table.Td>{metadata.credits}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td style={{ width: "140px", textAlign: "right", backgroundColor: "#fcfcfc" }}>Degree Level:</Table.Td>
                  <Table.Td>{metadata.degree_level}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td style={{ width: "140px", textAlign: "right", backgroundColor: "#fcfcfc" }}>Time Allocation:</Table.Td>
                  <Table.Td>{metadata.time_allocation}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td style={{ width: "140px", textAlign: "right", backgroundColor: "#fcfcfc" }}>Pre-Requisite:</Table.Td>
                  <Table.Td>{metadata.prerequisites || "\u00a0"}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td style={{ width: "140px", textAlign: "right", backgroundColor: "#fcfcfc" }}>Description:</Table.Td>
                  <Table.Td style={{ lineHeight: 1.5 }}>{formatMultiline(metadata.description)}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td style={{ width: "140px", textAlign: "right", backgroundColor: "#fcfcfc" }}>StudentTasks:</Table.Td>
                  <Table.Td style={{ lineHeight: 1.5 }}>{formatMultiline(metadata.student_tasks)}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td style={{ width: "140px", textAlign: "right", backgroundColor: "#fcfcfc" }}>Tools:</Table.Td>
                  <Table.Td style={{ lineHeight: 1.5 }}>{formatMultiline(metadata.tools)}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td style={{ width: "140px", textAlign: "right", backgroundColor: "#fcfcfc" }}>Scoring Scale:</Table.Td>
                  <Table.Td>{metadata.scoring_scale}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td style={{ width: "140px", textAlign: "right", backgroundColor: "#fcfcfc" }}>DecisionNo MM/dd/yyyy:</Table.Td>
                  <Table.Td>{metadata.decision_no}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td style={{ width: "140px", textAlign: "right", backgroundColor: "#fcfcfc" }}>IsApproved:</Table.Td>
                  <Table.Td style={{ fontWeight: "bold" }}>{metadata.is_approved}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td style={{ width: "140px", textAlign: "right", backgroundColor: "#fcfcfc" }}>Note:</Table.Td>
                  <Table.Td>{metadata.note || "\u00a0"}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td style={{ width: "140px", textAlign: "right", backgroundColor: "#fcfcfc" }}>MinAvgMarkToPass:</Table.Td>
                  <Table.Td>{metadata.min_avg_mark_to_pass}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td style={{ width: "140px", textAlign: "right", backgroundColor: "#fcfcfc" }}>IsActive:</Table.Td>
                  <Table.Td>{metadata.is_active}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td style={{ width: "140px", textAlign: "right", backgroundColor: "#fcfcfc" }}>ApprovedDate:</Table.Td>
                  <Table.Td>{metadata.approved_date}</Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
          </Stack>

          {/* Section 2: Materials */}
          <Stack gap="xs">
            <Text c="fptGreen" fw={700} size="sm">{materials.length} material(s)</Text>
            <Table striped withTableBorder withColumnBorders style={{ backgroundColor: "white" }} fz="sm">
              <Table.Thead style={{ backgroundColor: "#1A3A5C" }}>
                <Table.Tr>
                  <Table.Th style={{ color: "white", fontWeight: "bold" }}>MaterialDescription</Table.Th>
                  <Table.Th style={{ color: "white", fontWeight: "bold" }}>Author</Table.Th>
                  <Table.Th style={{ color: "white", fontWeight: "bold" }}>Publisher</Table.Th>
                  <Table.Th style={{ color: "white", fontWeight: "bold" }}>PublishedDate</Table.Th>
                  <Table.Th style={{ color: "white", fontWeight: "bold" }}>Edition</Table.Th>
                  <Table.Th style={{ color: "white", fontWeight: "bold" }}>ISBN</Table.Th>
                  <Table.Th style={{ color: "white", fontWeight: "bold", textAlign: "center" }}>IsMainMaterial</Table.Th>
                  <Table.Th style={{ color: "white", fontWeight: "bold", textAlign: "center" }}>IsHardCopy</Table.Th>
                  <Table.Th style={{ color: "white", fontWeight: "bold", textAlign: "center" }}>IsOnline</Table.Th>
                  <Table.Th style={{ color: "white", fontWeight: "bold" }}>Note</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {materials.map((m: any, idx: number) => (
                  <Table.Tr key={idx}>
                    <Table.Td>
                      {m.description.startsWith("http") ? (
                        <a href={m.description} target="_blank" rel="noopener noreferrer" style={{ color: "#1A3A5C", textDecoration: "none" }}>
                          {m.description}
                        </a>
                      ) : (
                        m.description
                      )}
                    </Table.Td>
                    <Table.Td>{m.author || "\u00a0"}</Table.Td>
                    <Table.Td>{m.publisher || "\u00a0"}</Table.Td>
                    <Table.Td>{m.published_date || "\u00a0"}</Table.Td>
                    <Table.Td>{m.edition || "\u00a0"}</Table.Td>
                    <Table.Td>{m.isbn || "\u00a0"}</Table.Td>
                    <Table.Td style={{ textAlign: "center" }}>
                      <Box style={{ display: "flex", justifyContent: "center" }}>
                        <Checkbox checked={isMaterialChecked(m, "is_main_material")} readOnly color="fptGreen" size="xs" />
                      </Box>
                    </Table.Td>
                    <Table.Td style={{ textAlign: "center" }}>
                      <Box style={{ display: "flex", justifyContent: "center" }}>
                        <Checkbox checked={isMaterialChecked(m, "is_hard_copy")} readOnly color="fptGreen" size="xs" />
                      </Box>
                    </Table.Td>
                    <Table.Td style={{ textAlign: "center" }}>
                      <Box style={{ display: "flex", justifyContent: "center" }}>
                        <Checkbox checked={isMaterialChecked(m, "is_online")} readOnly color="fptGreen" size="xs" />
                      </Box>
                    </Table.Td>
                    <Table.Td>{m.note || "\u00a0"}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Stack>

          {/* Section 3: CLOs */}
          <Stack gap="xs">
            <Text c="fptGreen" fw={700} size="sm">{clos.length} LO(s)</Text>
            <Table striped withTableBorder withColumnBorders style={{ backgroundColor: "white" }} fz="sm">
              <Table.Thead style={{ backgroundColor: "#23AC68" }}>
                <Table.Tr>
                  <Table.Th style={{ color: "white", fontWeight: "bold", width: "6%" }}>CLO Name</Table.Th>
                  <Table.Th style={{ color: "white", fontWeight: "bold", width: "20%" }}>CLO Details</Table.Th>
                  <Table.Th style={{ color: "white", fontWeight: "bold", width: "74%" }}>LO Details</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {clos.map((clo: any, idx: number) => (
                  <Table.Tr key={idx}>
                    <Table.Td style={{ textAlign: "center" }}>{clo.clo_name}</Table.Td>
                    <Table.Td>{clo.clo_details}</Table.Td>
                    <Table.Td>{clo.lo_details}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Stack>

          <Group>
            <a
              href={`https://flm.fpt.edu.vn/CLOMapping/View?syllabusID=${metadata.syllabus_id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#1A3A5C", textDecoration: "none", fontWeight: "bold" }}
            >
              View mapping of CLOs to PLOs
            </a>
          </Group>

          <Group>
            <Button
              color="fptOrange"
              styles={{ root: { backgroundColor: "#F37021", fontWeight: "bold" } }}
            >
              Download All Student Material
            </Button>
          </Group>

          {/* Section 4: Schedule */}
          <Stack gap="xs">
            <Text c="fptGreen" fw={700} size="sm">{schedule.length} sessions (45&apos;/session)</Text>
            <Box style={{ overflowX: "auto", width: "100%" }}>
              <Table striped withTableBorder withColumnBorders style={{ backgroundColor: "white", minWidth: "1200px" }} fz="sm">
                <Table.Thead style={{ backgroundColor: "#F37021" }}>
                  <Table.Tr>
                    <Table.Th style={{ color: "white", fontWeight: "bold", width: "4%" }}>Session</Table.Th>
                    <Table.Th style={{ color: "white", fontWeight: "bold", width: "32%" }}>Topic</Table.Th>
                    <Table.Th style={{ color: "white", fontWeight: "bold", width: "6%" }}>Learning-Teaching Type</Table.Th>
                    <Table.Th style={{ color: "white", fontWeight: "bold", width: "4%" }}>LO</Table.Th>
                    <Table.Th style={{ color: "white", fontWeight: "bold", width: "4%" }}>ITU</Table.Th>
                    <Table.Th style={{ color: "white", fontWeight: "bold", width: "12%" }}>Student Materials</Table.Th>
                    <Table.Th style={{ color: "white", fontWeight: "bold", width: "18%" }}>S-Download</Table.Th>
                    <Table.Th style={{ color: "white", fontWeight: "bold", width: "18%" }}>Student&apos;s Tasks</Table.Th>
                    <Table.Th style={{ color: "white", fontWeight: "bold" }}>URLs</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {schedule.map((s: any, idx: number) => (
                    <Table.Tr key={idx}>
                      <Table.Td style={{ textAlign: "center" }}>{s.session}</Table.Td>
                      <Table.Td>{formatMultiline(s.topic)}</Table.Td>
                      <Table.Td>{s.learning_method}</Table.Td>
                      <Table.Td>{s.lo}</Table.Td>
                      <Table.Td>{s.itu || "\u00a0"}</Table.Td>
                      <Table.Td>{s.student_materials || "\u00a0"}</Table.Td>
                      <Table.Td>
                        {s.s_download === "FER202" || s.s_download === "PRN232" ? (
                          <a href={`https://flm.fpt.edu.vn/download/${metadata.syllabus_id}/S/1_${s.s_download}.zip`} style={{ color: "#1A3A5C", textDecoration: "none" }}>
                            {s.s_download}
                          </a>
                        ) : (
                          formatMultiline(s.s_download) || "\u00a0"
                        )}
                      </Table.Td>
                      <Table.Td>{formatMultiline(s.student_tasks) || "\u00a0"}</Table.Td>
                      <Table.Td>{s.urls || "\u00a0"}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Box>
          </Stack>

          {/* Section 5: Assessment Scheme */}
          <Stack gap="xs">
            <Text c="fptGreen" fw={700} size="sm">{assessment_scheme.length} assessment(s)</Text>
            <Box style={{ overflowX: "auto", width: "100%" }}>
              <Table striped withTableBorder withColumnBorders style={{ backgroundColor: "white", width: "100%" }} fz="sm">
                <Table.Thead style={{ backgroundColor: "#1A3A5C" }}>
                  <Table.Tr>
                    <Table.Th style={{ color: "white", fontWeight: "bold", width: "8%" }}>Category</Table.Th>
                    <Table.Th style={{ color: "white", fontWeight: "bold", width: "8%" }}>Type</Table.Th>
                    <Table.Th style={{ color: "white", fontWeight: "bold", textAlign: "center", width: "4%" }}>Part</Table.Th>
                    <Table.Th style={{ color: "white", fontWeight: "bold", textAlign: "center", width: "4%" }}>Weight</Table.Th>
                    <Table.Th style={{ color: "white", fontWeight: "bold", textAlign: "center", width: "5%" }}>Completion Criteria</Table.Th>
                    <Table.Th style={{ color: "white", fontWeight: "bold", width: "4%" }}>Duration</Table.Th>
                    <Table.Th style={{ color: "white", fontWeight: "bold", width: "4%" }}>CLO</Table.Th>
                    <Table.Th style={{ color: "white", fontWeight: "bold", width: "6%" }}>Question Type</Table.Th>
                    <Table.Th style={{ color: "white", fontWeight: "bold", width: "5%" }}>No Question</Table.Th>
                    <Table.Th style={{ color: "white", fontWeight: "bold", width: "16%" }}>Knowledge and Skill</Table.Th>
                    <Table.Th style={{ color: "white", fontWeight: "bold", width: "24%" }}>Grading Guide</Table.Th>
                    <Table.Th style={{ color: "white", fontWeight: "bold", width: "12%" }}>Note</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {assessment_scheme.map((a: any, idx: number) => (
                    <Table.Tr key={idx}>
                      <Table.Td>{a.category}</Table.Td>
                      <Table.Td>{a.type}</Table.Td>
                      <Table.Td style={{ textAlign: "center" }}>{a.part || "\u00a0"}</Table.Td>
                      <Table.Td style={{ textAlign: "center" }}>{a.weight}</Table.Td>
                      <Table.Td style={{ textAlign: "center" }}>{a.completion_criteria || "\u00a0"}</Table.Td>
                      <Table.Td>{a.duration}</Table.Td>
                      <Table.Td>{formatMultiline(a.clo)}</Table.Td>
                      <Table.Td>{a.question_type || "\u00a0"}</Table.Td>
                      <Table.Td>{a.no_question || "\u00a0"}</Table.Td>
                      <Table.Td>{formatMultiline(a.knowledge_and_skill) || "\u00a0"}</Table.Td>
                      <Table.Td>{formatMultiline(a.grading_guide) || "\u00a0"}</Table.Td>
                      <Table.Td>{formatMultiline(a.note) || "\u00a0"}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Box>
          </Stack>
        </Stack>
      </Container>

      {/* Floating RAG Chatbot assistant */}
      <ChatbotWidget subjectCode={subjectCode} />
    </Box>
  );
}

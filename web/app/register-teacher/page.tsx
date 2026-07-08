"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Card,
  Button,
  TextInput,
  Textarea,
  Title,
  Text,
  Stack,
  Group,
  ThemeIcon,
  Box,
  Alert,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconMail,
  IconUser,
  IconMessage,
  IconAlertCircle,
  IconCheck,
} from "@tabler/icons-react";
import {
  submitLecturerRequest,
  SubmitLecturerRequestPayload,
  ApiError,
} from "@/lib/api";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterTeacherPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!name.trim() || !email.trim() || !reason.trim()) {
      setErrorMsg("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      setErrorMsg("Email không đúng định dạng.");
      return;
    }

    setIsLoading(true);
    try {
      const payload: SubmitLecturerRequestPayload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        reason: reason.trim(),
      };

      // TODO: thêm rate-limit/CAPTCHA phía backend cho endpoint này
      await submitLecturerRequest(payload);
      setSuccessMsg("Yêu cầu đã được gửi, chờ Admin duyệt.");
      setName("");
      setEmail("");
      setReason("");
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Không thể gửi yêu cầu. Vui lòng thử lại sau.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      style={{
        minHeight: "100vh",
        backgroundColor: "#F8FAFC",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        style={{
          position: "absolute",
          top: "-10%",
          right: "-10%",
          width: "400px",
          height: "400px",
          backgroundColor: "rgba(243, 112, 33, 0.05)",
          borderRadius: "50%",
          filter: "blur(80px)",
        }}
      />
      <Box
        style={{
          position: "absolute",
          bottom: "-10%",
          left: "-10%",
          width: "400px",
          height: "400px",
          backgroundColor: "rgba(26, 58, 92, 0.05)",
          borderRadius: "50%",
          filter: "blur(80px)",
        }}
      />

      <Box style={{ width: "100%", maxWidth: "520px", zIndex: 10 }}>
        <Group mb="lg">
          <Button
            component={Link}
            href="/login"
            variant="subtle"
            color="gray"
            size="xs"
            leftSection={<IconArrowLeft size={16} />}
            styles={{ root: { padding: 0 } }}
          >
            Quay lại đăng nhập
          </Button>
        </Group>

        <Stack align="center" gap="xs" mb="xl" style={{ textAlign: "center" }}>
          <ThemeIcon
            size={72}
            radius={0}
            variant="gradient"
            gradient={{ from: "#1A3A5C", to: "#2A5A8C", deg: 135 }}
            style={{ boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
          >
            <Text fw={900} size="xl" style={{ color: "white" }}>
              FPT
            </Text>
          </ThemeIcon>
          <Title order={1} style={{ fontSize: "28px", fontWeight: 900, color: "#1A3A5C" }}>
            Đăng ký <Text span inherit style={{ color: "#F37021" }}>Giảng viên</Text>
          </Title>
          <Text size="xs" fw={700} style={{ color: "#9CA3AF", letterSpacing: "1px", textTransform: "uppercase" }}>
            Gửi yêu cầu cấp quyền LECTURER
          </Text>
        </Stack>

        <Card
          p="xl"
          radius={0}
          style={{
            borderTop: "4px solid #F37021",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            backgroundColor: "white",
          }}
        >
          <Stack gap="md">
            <div>
              <Title order={2} style={{ fontSize: "20px", fontWeight: 900, color: "#1A3A5C", textAlign: "center" }}>
                Form đăng ký giảng viên
              </Title>
              <Text
                size="xs"
                fw={700}
                c="dimmed"
                style={{ textAlign: "center", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "4px" }}
              >
                Admin sẽ xem xét và phản hồi qua email
              </Text>
            </div>

            {errorMsg && (
              <Alert icon={<IconAlertCircle size={16} />} title="Lỗi" color="red" radius={0}>
                {errorMsg}
              </Alert>
            )}

            {successMsg && (
              <Alert icon={<IconCheck size={16} />} title="Thành công" color="green" radius={0}>
                {successMsg}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Stack gap="md">
                <TextInput
                  label="Họ tên"
                  placeholder="Nguyễn Văn A"
                  required
                  radius={0}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  leftSection={<IconUser size={16} color="#9CA3AF" />}
                />

                <TextInput
                  label="Email FPT"
                  placeholder="lecturer@fpt.edu.vn"
                  required
                  radius={0}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftSection={<IconMail size={16} color="#9CA3AF" />}
                />

                <Textarea
                  label="Lý do đăng ký"
                  placeholder="Mô tả lý do bạn cần quyền giảng viên..."
                  required
                  radius={0}
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  leftSection={<IconMessage size={16} color="#9CA3AF" />}
                />

                <Button
                  type="submit"
                  fullWidth
                  loading={isLoading}
                  radius={0}
                  style={{ backgroundColor: "#1A3A5C" }}
                  size="md"
                  fw={700}
                >
                  Gửi yêu cầu
                </Button>
              </Stack>
            </form>
          </Stack>

          <Box mt="xl" style={{ textAlign: "center" }}>
            <Text size="xs" fw={700} style={{ color: "#9CA3AF", letterSpacing: "2px", textTransform: "uppercase" }}>
              © 2026 FPT UNIVERSITY
            </Text>
          </Box>
        </Card>
      </Box>
    </Box>
  );
}

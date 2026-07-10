"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import {
  Card,
  Button,
  TextInput,
  Title,
  Text,
  Stack,
  Alert,
  Box,
  Center,
  ThemeIcon,
  Anchor,
} from "@mantine/core";
import {
  IconMail,
  IconArrowLeft,
  IconAlertCircle,
  IconCircleCheck,
} from "@tabler/icons-react";
import { authClient } from "../../lib/auth-client";

function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email.trim()) {
      setErrorMsg("Vui lòng nhập email.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg("Địa chỉ email không hợp lệ.");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      });

      if (error) {
        const msg = error.message ?? "";
        const status = (error as { status?: number }).status;

        if (status === 429 || /rate/i.test(msg)) {
          setErrorMsg(
            "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút."
          );
        } else if (/failed to fetch|network|load/i.test(msg)) {
          setErrorMsg(
            "Không thể kết nối tới server. Vui lòng kiểm tra mạng và thử lại."
          );
        } else {
          setErrorMsg("Đã xảy ra lỗi. Vui lòng thử lại sau.");
        }
      } else {
        setSent(true);
      }
    } catch {
      setErrorMsg(
        "Không thể kết nối tới server. Vui lòng kiểm tra mạng và thử lại."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card
      p="xl"
      radius={0}
      withBorder
      style={{
        width: "100%",
        maxWidth: "420px",
        borderTop: "4px solid #F37021",
        boxShadow:
          "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        backgroundColor: "white",
      }}
    >
      <Stack gap="md">
        <Center>
          <ThemeIcon
            size={48}
            radius={0}
            variant="gradient"
            gradient={{ from: "#1A3A5C", to: "#2A5A8C", deg: 135 }}
          >
            <IconMail size={26} color="white" />
          </ThemeIcon>
        </Center>

        <Box style={{ textAlign: "center" }}>
          <Title
            order={2}
            style={{ fontSize: "20px", fontWeight: 900, color: "#1A3A5C" }}
          >
            Quên mật khẩu
          </Title>
          <Text size="xs" c="dimmed" mt={4}>
            Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu
          </Text>
        </Box>

        {errorMsg && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            color="red"
            radius={0}
          >
            {errorMsg}
          </Alert>
        )}

        {sent && (
          <Alert
            icon={<IconCircleCheck size={16} />}
            color="green"
            radius={0}
          >
            Nếu email tồn tại trong hệ thống, bạn sẽ nhận được email hướng dẫn
            đặt lại mật khẩu trong vài phút.
          </Alert>
        )}

        {!sent && (
          <form onSubmit={handleSubmit}>
            <Stack gap="sm">
              <TextInput
                label="Email"
                placeholder="name@fpt.edu.vn"
                required
                radius={0}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftSection={<IconMail size={16} color="#9CA3AF" />}
                disabled={isLoading}
              />

              <Button
                type="submit"
                fullWidth
                style={{ backgroundColor: "#1A3A5C" }}
                radius={0}
                fw={700}
                mt="md"
                loading={isLoading}
                disabled={isLoading}
              >
                Gửi yêu cầu
              </Button>
            </Stack>
          </form>
        )}

        <Box style={{ textAlign: "center" }}>
          <Anchor
            component={Link}
            href="/login"
            size="xs"
            c="dimmed"
            style={{ textDecoration: "none" }}
          >
            <Box
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
              }}
            >
              <IconArrowLeft size={14} />
              Quay lại trang đăng nhập
            </Box>
          </Anchor>
        </Box>
      </Stack>
    </Card>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Box
      style={{
        backgroundColor: "#F8FAFC",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <Suspense
        fallback={
          <Card
            p="xl"
            radius={0}
            withBorder
            style={{ width: "100%", maxWidth: "420px", textAlign: "center" }}
          >
            <Text size="sm">Đang tải...</Text>
          </Card>
        }
      >
        <ForgotPasswordForm />
      </Suspense>
    </Box>
  );
}

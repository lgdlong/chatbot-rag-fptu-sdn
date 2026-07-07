"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  Button,
  TextInput,
  PasswordInput,
  Title,
  Text,
  Stack,
  Group,
  ThemeIcon,
  Divider,
  Box,
  Alert,
} from "@mantine/core";
import {
  IconShieldCheck,
  IconLock,
  IconMail,
  IconArrowLeft,
  IconUserCheck,
  IconUserCog,
  IconAlertCircle,
} from "@tabler/icons-react";
import { useAuth, UserRole } from "../contexts/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login, loginAsRole, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const navigateByRole = (role: UserRole) => {
    if (role === "superadmin") router.push("/superadmin");
    else if (role === "teacher") router.push("/teacher");
    else router.push("/student");
  };

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Vui lòng điền đầy đủ email và mật khẩu.");
      return;
    }
    setErrorMsg("");
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        // Auto-detect role based on email for routing
        if (email.startsWith("admin")) router.push("/superadmin");
        else if (email.startsWith("lecturer")) router.push("/teacher");
        else router.push("/student");
      } else {
        setErrorMsg("Email hoặc mật khẩu không chính xác. Vui lòng thử lại.");
      }
    } catch {
      setErrorMsg("Đã xảy ra lỗi kết nối đến server. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (role: UserRole) => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const success = await loginAsRole(role);
      if (success) {
        navigateByRole(role);
      } else {
        setErrorMsg("Đăng nhập nhanh thất bại. Backend có thể chưa chạy.");
      }
    } catch {
      setErrorMsg("Không thể kết nối đến server backend (port 8000). Vui lòng khởi động backend.");
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
      {/* Decorative background elements */}
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

      <Box style={{ width: "100%", maxWidth: "440px", zIndex: 10 }}>
        {/* Quay lại link */}
        <Group mb="lg">
          <Button
            component={Link}
            href="/"
            variant="subtle"
            color="gray"
            size="xs"
            leftSection={<IconArrowLeft size={16} />}
            styles={{ root: { padding: 0 } }}
          >
            Quay lại trang chủ
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
            RAG <Text span inherit style={{ color: "#F37021" }}>CHATBOT</Text>
          </Title>
          <Text size="xs" fw={700} style={{ color: "#9CA3AF", letterSpacing: "1px", textTransform: "uppercase" }}>
            Hệ thống Trợ lý FLM & RAG Hybrid
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
                Đăng nhập hệ thống
              </Title>
              <Text size="xs" fw={700} c="dimmed" style={{ textAlign: "center", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "4px" }}>
                Nhập tài khoản FPT hoặc chọn đăng nhập nhanh
              </Text>
            </div>

            {errorMsg && (
              <Alert icon={<IconAlertCircle size={16} />} title="Lỗi đăng nhập" color="red" radius={0}>
                {errorMsg}
              </Alert>
            )}

            <form onSubmit={handleCredentialsLogin}>
              <Stack gap="md">
                <TextInput
                  label="Email FPT"
                  placeholder="name@fpt.edu.vn"
                  required
                  radius={0}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftSection={<IconMail size={16} color="#9CA3AF" />}
                />

                <PasswordInput
                  label="Mật khẩu"
                  placeholder="••••••••"
                  required
                  radius={0}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftSection={<IconLock size={16} color="#9CA3AF" />}
                />

                <Button
                  type="submit"
                  fullWidth
                  loading={isLoading || authLoading}
                  radius={0}
                  style={{ backgroundColor: "#1A3A5C" }}
                  size="md"
                  fw={700}
                >
                  Đăng nhập
                </Button>
              </Stack>
            </form>

            <Divider label="Đăng nhập nhanh (Dev Mode)" labelPosition="center" />

            <Group grow gap="xs">
              <Button
                onClick={() => handleDemoLogin("student")}
                variant="light"
                disabled={isLoading}
                size="md"
                radius={0}
                color="blue"
                leftSection={<IconUserCheck size={18} />}
                style={{
                  backgroundColor: "#F1F5F9",
                  color: "#1A3A5C",
                  fontSize: "11px",
                }}
                fw={700}
              >
                SINH VIÊN
              </Button>

              <Button
                onClick={() => handleDemoLogin("teacher")}
                variant="light"
                disabled={isLoading}
                size="md"
                radius={0}
                color="orange"
                leftSection={<IconUserCog size={18} />}
                style={{
                  backgroundColor: "#FFF7ED",
                  color: "#C2410C",
                  fontSize: "11px",
                }}
                fw={700}
              >
                GIẢNG VIÊN
              </Button>

              <Button
                onClick={() => handleDemoLogin("superadmin")}
                variant="light"
                disabled={isLoading}
                size="md"
                radius={0}
                color="blue"
                leftSection={<IconShieldCheck size={18} />}
                style={{
                  backgroundColor: "#F1F5F9",
                  color: "#1A3A5C",
                  fontSize: "11px",
                }}
                fw={700}
              >
                ADMIN
              </Button>
            </Group>
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

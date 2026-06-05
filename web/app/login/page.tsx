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
  Modal,
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
  IconBrandGoogle,
  IconAlertCircle,
} from "@tabler/icons-react";
import { useAuth, UserRole } from "../contexts/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login, loginAsRole, loginWithGoogle } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("student");
  
  const [isLoading, setIsLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Vui lòng điền đầy đủ email và mật khẩu.");
      return;
    }
    setErrorMsg("");
    setIsLoading(true);

    // Auto-detect role based on email context for demo convenience
    let role: UserRole = "student";
    if (email.startsWith("admin")) {
      role = "superadmin";
    } else if (email.startsWith("lecturer")) {
      role = "teacher";
    }

    try {
      const success = await login(email, password, role);
      if (success) {
        if (role === "superadmin") router.push("/superadmin");
        else if (role === "teacher") router.push("/teacher");
        else router.push("/student");
      } else {
        setErrorMsg("Email hoặc mật khẩu không chính xác hoặc sai định dạng @fpt.edu.vn.");
      }
    } catch (err) {
      setErrorMsg("Đã xảy ra lỗi đăng nhập. Vui lòng thử lại.");
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
        if (role === "superadmin") router.push("/superadmin");
        else if (role === "teacher") router.push("/teacher");
        else router.push("/student");
      }
    } catch (err) {
      setErrorMsg("Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
      setShowRoleModal(false);
    }
  };

  const handleGoogleLogin = async (role: UserRole) => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      // Demo login using a default email
      const demoEmail = role === "teacher" ? "lecturer1@fpt.edu.vn" : "student1@fpt.edu.vn";
      const success = await loginWithGoogle(demoEmail, role);
      if (success) {
        if (role === "teacher") router.push("/teacher");
        else router.push("/student");
      }
    } catch (err) {
      setErrorMsg("Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
      setShowRoleModal(false);
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
                  loading={isLoading}
                  radius={0}
                  style={{ backgroundColor: "#1A3A5C" }}
                  size="md"
                  fw={700}
                >
                  Đăng nhập
                </Button>
              </Stack>
            </form>

            <Divider label="Hoặc chọn phương thức khác" labelPosition="center" />

            <Button
              onClick={() => setShowRoleModal(true)}
              variant="outline"
              disabled={isLoading}
              fullWidth
              size="md"
              radius={0}
              color="gray"
              leftSection={<IconBrandGoogle size={20} color="#EA4335" />}
              style={{
                borderColor: "#E2E8F0",
                transition: "all 0.2s ease",
                fontSize: "12px",
              }}
              fw={700}
            >
              ĐĂNG NHẬP BẰNG GOOGLE
            </Button>

            <Button
              onClick={() => handleDemoLogin("superadmin")}
              variant="light"
              disabled={isLoading}
              fullWidth
              size="md"
              radius={0}
              color="blue"
              leftSection={<IconShieldCheck size={20} />}
              style={{
                backgroundColor: "#F1F5F9",
                color: "#1A3A5C",
                fontSize: "12px",
              }}
              fw={700}
            >
              VÀO THẲNG ADMIN
            </Button>
          </Stack>

          <Box mt="xl" style={{ textAlign: "center" }}>
            <Text size="xs" fw={700} style={{ color: "#9CA3AF", letterSpacing: "2px", textTransform: "uppercase" }}>
              © 2026 FPT UNIVERSITY
            </Text>
          </Box>
        </Card>
      </Box>

      {/* Role Selection Modal */}
      <Modal
        opened={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        title="Xác nhận vai trò truy cập"
        centered
        radius={0}
        styles={{
          title: { fontWeight: 900, color: "#1A3A5C", textTransform: "uppercase", fontSize: "16px" },
          header: { borderBottom: "1px solid #E2E8F0", paddingBottom: "12px" },
        }}
      >
        <Stack gap="md" py="md">
          <Text size="sm" c="dimmed" style={{ textAlign: "center" }}>
            Vui lòng chọn vai trò để tiếp tục đăng nhập Google Portal (Demo)
          </Text>

          <Group grow gap="md">
            <Button
              variant="outline"
              radius={0}
              size="xl"
              style={{
                height: "140px",
                display: "flex",
                flexDirection: "column",
                borderColor: "#E2E8F0",
              }}
              color="orange"
              onClick={() => handleGoogleLogin("teacher")}
            >
              <Stack align="center" gap="xs">
                <ThemeIcon size={48} radius={0} color="orange.1">
                  <IconUserCog size={28} color="#F37021" />
                </ThemeIcon>
                <Text fw={800} size="sm" style={{ color: "#1A3A5C" }}>GIẢNG VIÊN</Text>
                <Text size="10px" c="dimmed">Teacher Portal</Text>
              </Stack>
            </Button>

            <Button
              variant="outline"
              radius={0}
              size="xl"
              style={{
                height: "140px",
                display: "flex",
                flexDirection: "column",
                borderColor: "#E2E8F0",
              }}
              color="blue"
              onClick={() => handleGoogleLogin("student")}
            >
              <Stack align="center" gap="xs">
                <ThemeIcon size={48} radius={0} color="blue.1">
                  <IconUserCheck size={28} color="#1A3A5C" />
                </ThemeIcon>
                <Text fw={800} size="sm" style={{ color: "#1A3A5C" }}>SINH VIÊN</Text>
                <Text size="10px" c="dimmed">Student Portal</Text>
              </Stack>
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}

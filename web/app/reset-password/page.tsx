"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  Button,
  PasswordInput,
  Title,
  Text,
  Stack,
  Alert,
  Box,
  Center,
} from "@mantine/core";
import { IconLock, IconAlertCircle, IconCircleCheck } from "@tabler/icons-react";
import { authClient } from "../../lib/auth-client";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setErrorMsg("Đường dẫn đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.");
    }
  }, [token]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setErrorMsg("Thiếu token đặt lại mật khẩu.");
      return;
    }
    if (!password || !confirmPassword) {
      setErrorMsg("Vui lòng nhập đầy đủ các trường.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Mật khẩu phải dài tối thiểu 6 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Mật khẩu xác nhận không trùng khớp.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { error } = await authClient.resetPassword({
        newPassword: password,
        token: token,
      });

      if (error) {
        setErrorMsg(error.message || "Đặt lại mật khẩu thất bại. Token có thể đã hết hạn.");
      } else {
        setSuccessMsg("Đặt lại mật khẩu thành công! Hệ thống sẽ chuyển hướng bạn về trang Đăng nhập.");
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Đã xảy ra lỗi không xác định.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card p="xl" radius={0} withBorder style={{ width: "100%", maxWidth: "420px", backgroundColor: "white" }}>
      <Stack gap="md">
        <Center>
          <Box
            style={{
              backgroundColor: "#E8EFF7",
              color: "#1A3A5C",
              width: "48px",
              height: "48px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconLock size={26} />
          </Box>
        </Center>

        <Box style={{ textAlign: "center" }}>
          <Title order={2} style={{ fontSize: "20px", fontWeight: 900, color: "#1A3A5C" }}>
            Thiết Lập Mật Khẩu
          </Title>
          <Text size="xs" c="dimmed" mt={4}>
            Nhập mật khẩu mới để kích hoạt và truy cập tài khoản của bạn.
          </Text>
        </Box>

        {errorMsg && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" radius={0}>
            {errorMsg}
          </Alert>
        )}

        {successMsg && (
          <Alert icon={<IconCircleCheck size={16} />} color="green" radius={0}>
            {successMsg}
          </Alert>
        )}

        {!successMsg && (
          <form onSubmit={handleResetPassword}>
            <Stack gap="sm">
              <PasswordInput
                label="Mật khẩu mới"
                placeholder="Nhập mật khẩu tối thiểu 6 ký tự"
                required
                radius={0}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading || !token}
              />

              <PasswordInput
                label="Xác nhận mật khẩu"
                placeholder="Nhập lại mật khẩu mới"
                required
                radius={0}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading || !token}
              />

              <Button
                type="submit"
                fullWidth
                style={{ backgroundColor: "#F26F21" }}
                radius={0}
                fw={700}
                mt="md"
                loading={isLoading}
                disabled={!token}
              >
                Đặt Lại Mật Khẩu
              </Button>
            </Stack>
          </form>
        )}
      </Stack>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Box style={{ backgroundColor: "#F8FAFC", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <Suspense fallback={
        <Card p="xl" radius={0} withBorder style={{ width: "100%", maxWidth: "420px", textAlign: "center" }}>
          <Text size="sm">Đang tải...</Text>
        </Card>
      }>
        <ResetPasswordForm />
      </Suspense>
    </Box>
  );
}

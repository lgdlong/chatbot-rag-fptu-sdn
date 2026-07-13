"use client";

import React, { useState } from "react";
import {
  Title,
  Text,
  Card,
  PasswordInput,
  Button,
  Stack,
  Group,
  ThemeIcon,
  Box,
} from "@mantine/core";
import { IconLock, IconAlertCircle, IconCircleCheck } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { authClient } from "@/lib/auth-client";

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      notifications.show({ title: "Lỗi", message: "Vui lòng nhập mật khẩu hiện tại.", color: "red" });
      return;
    }
    if (newPassword.length < 8) {
      notifications.show({ title: "Lỗi", message: "Mật khẩu mới phải có ít nhất 8 ký tự.", color: "red" });
      return;
    }
    if (newPassword !== confirmPassword) {
      notifications.show({ title: "Lỗi", message: "Mật khẩu xác nhận không trùng khớp.", color: "red" });
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
      });

      if (error) {
        const isPasswordMismatch = error.message?.toLowerCase().includes("password") && 
          (error.message?.toLowerCase().includes("incorrect") || error.message?.toLowerCase().includes("wrong") || error.message?.toLowerCase().includes("invalid") || error.message?.toLowerCase().includes("mismatch") || error.message?.toLowerCase().includes("not match"));
        notifications.show({
          title: "Lỗi",
          message: isPasswordMismatch ? "Mật khẩu hiện tại không đúng. Vui lòng kiểm tra lại." : (error.message || "Đổi mật khẩu thất bại."),
          color: "red",
        });
      } else {
        notifications.show({
          title: "Thành công",
          message: "Đổi mật khẩu thành công.",
          color: "green",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err: any) {
      notifications.show({
        title: "Lỗi",
        message: err.message || "Đã xảy ra lỗi không xác định.",
        color: "red",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <Stack gap="xl">
      <div>
        <Title order={1} style={{ fontSize: "24px", fontWeight: 900, color: "#1A3A5C" }}>
          Cài đặt
        </Title>
        <Text size="sm" c="dimmed">
          Quản lý thông tin tài khoản và bảo mật
        </Text>
      </div>

      {/* Change Password Card */}
      <Card p={0} radius={0} style={{ border: "1px solid #E2E8F0", backgroundColor: "white" }}>
        <Box px="md" py="sm" style={{ borderBottom: "1px solid #E2E8F0", backgroundColor: "#F8FAFC" }}>
          <Group gap="sm">
            <ThemeIcon size={32} radius={0} style={{ backgroundColor: "#FFE8D6", color: "#F37021" }}>
              <IconLock size={18} />
            </ThemeIcon>
            <Title order={2} style={{ fontSize: "16px", fontWeight: 900, color: "#1A1A1A" }}>
              Đổi mật khẩu
            </Title>
          </Group>
        </Box>

        <Box p="md">
          <form onSubmit={handleChangePassword}>
            <Stack gap="sm" style={{ maxWidth: "480px" }}>
              <PasswordInput
                label="Mật khẩu hiện tại"
                placeholder="Nhập mật khẩu hiện tại"
                required
                radius={0}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isChangingPassword}
              />
              <PasswordInput
                label="Mật khẩu mới"
                placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)"
                required
                radius={0}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isChangingPassword}
              />
              <PasswordInput
                label="Xác nhận mật khẩu mới"
                placeholder="Nhập lại mật khẩu mới"
                required
                radius={0}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isChangingPassword}
              />
              <Button
                type="submit"
                style={{ backgroundColor: "#F37021" }}
                radius={0}
                fw={700}
                loading={isChangingPassword}
                mt="xs"
              >
                Đổi mật khẩu
              </Button>
            </Stack>
          </form>
        </Box>
      </Card>
    </Stack>
  );
}

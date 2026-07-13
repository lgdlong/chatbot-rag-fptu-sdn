"use client";

import React, { useState } from "react";
import {
  Title,
  Text,
  Button,
  Card,
  TextInput,
  Stack,
  Group,
  Alert,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconMail,
  IconCheck,
  IconArrowLeft,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { createLecturer } from "../../../lib/api";
import { ApiError } from "../../../lib/auth-client";

export default function CreateLecturerPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      notifications.show({
        title: "Lỗi",
        message: "Email giảng viên là bắt buộc",
        color: "red",
      });
      return;
    }

    setSubmitting(true);
    try {
      await createLecturer({ email: trimmedEmail });
      setDone(true);
      setEmail("");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Không thể tạo tài khoản giảng viên";
      notifications.show({
        title: "Lỗi",
        message,
        color: "red",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack gap="xl">
      <div>
        <Title order={1} style={{ fontSize: "24px", fontWeight: 900, color: "#1A3A5C" }}>
          Tạo tài khoản Giảng viên
        </Title>
        <Text size="sm" c="dimmed">
          Tạo tài khoản mới cho giảng viên — hệ thống sẽ sinh mật khẩu tạm thời
        </Text>
      </div>

      <Card p="lg" radius={0} style={{ border: "1px solid #E2E8F0", backgroundColor: "white" }}>
        <Stack gap="md">
          {done ? (
            <>
              <Alert
                icon={<IconCheck size={20} />}
                color="green"
                radius={0}
                title="Đã gửi thông tin đăng nhập"
              >
                <Text size="sm">
                  Mật khẩu đã được gửi qua email <b>{email}</b>. 
                  Giảng viên kiểm tra email để nhận thông tin đăng nhập.
                </Text>
              </Alert>
              <Group justify="space-between" mt="md">
                <Button
                  variant="outline"
                  color="gray"
                  radius={0}
                  leftSection={<IconArrowLeft size={16} />}
                  onClick={() => router.push("/superadmin/admins")}
                  fw={700}
                >
                  Quay lại quản lý tài khoản
                </Button>
                <Button
                  style={{ backgroundColor: "#F37021" }}
                  radius={0}
                  onClick={() => setDone(false)}
                  fw={700}
                >
                  Tiếp tục tạo giảng viên khác
                </Button>
              </Group>
            </>
          ) : (
            <>
              <TextInput
                label="Email"
                placeholder="giangvien@fpt.edu.vn"
                required
                type="email"
                radius={0}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftSection={<IconMail size={16} />}
                styles={{ label: { fontWeight: 700, fontSize: "13px" } }}
              />

              <Group justify="flex-end" mt="md">
                <Button
                  style={{ backgroundColor: "#F37021" }}
                  radius={0}
                  onClick={() => void handleSubmit()}
                  fw={700}
                  loading={submitting}
                >
                  Tạo tài khoản
                </Button>
              </Group>
            </>
          )}
        </Stack>
      </Card>
    </Stack>
  );
}

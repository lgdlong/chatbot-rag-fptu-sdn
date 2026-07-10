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
  Modal,
  Alert,
  CopyButton,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconUser,
  IconMail,
  IconAlertCircle,
  IconCheck,
  IconCopy,
  IconShieldCheck,
} from "@tabler/icons-react";
import { createLecturer, type CreateLecturerResponse } from "../../../lib/api";
import { ApiError } from "../../../lib/auth-client";

export default function CreateLecturerPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [credentials, setCredentials] = useState<CreateLecturerResponse["credentials"] | null>(null);

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      notifications.show({
        title: "Lỗi",
        message: "Họ tên giảng viên là bắt buộc",
        color: "red",
      });
      return;
    }

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
      const result = await createLecturer({ name: trimmedName, email: trimmedEmail });
      setCredentials(result.credentials);
      setShowCredentialsModal(true);
      setName("");
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
          <TextInput
            label="Họ tên đầy đủ"
            placeholder="Nguyễn Văn A"
            required
            radius={0}
            value={name}
            onChange={(e) => setName(e.target.value)}
            leftSection={<IconUser size={16} />}
            styles={{ label: { fontWeight: 700, fontSize: "13px" } }}
          />

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
              leftSection={<IconShieldCheck size={16} />}
            >
              Tạo tài khoản
            </Button>
          </Group>
        </Stack>
      </Card>

      <Modal
        opened={showCredentialsModal}
        onClose={() => setShowCredentialsModal(false)}
        title="Thông tin tài khoản giảng viên"
        centered
        radius={0}
        size="md"
        styles={{
          title: { fontWeight: 900, color: "#1A3A5C", textTransform: "uppercase", fontSize: "16px" },
          header: { borderBottom: "1px solid #E2E8F0" },
        }}
      >
        <Stack gap="md" py="md">
          <Alert
            icon={<IconAlertCircle size={20} />}
            color="orange"
            radius={0}
            styles={{ title: { fontWeight: 700 } }}
            title="Thông tin này chỉ hiển thị một lần"
          >
            <Text size="sm">
              Vui lòng sao chép và gửi thông tin đăng nhập cho giảng viên ngay bây giờ.
              Sau khi đóng, bạn sẽ không thể xem lại mật khẩu.
            </Text>
          </Alert>

          {credentials && (
            <>
              <div>
                <Text size="xs" fw={700} c="dimmed" style={{ textTransform: "uppercase", marginBottom: "6px" }}>
                  Email đăng nhập
                </Text>
                <Group gap="xs">
                  <Text
                    size="sm"
                    fw={700}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      backgroundColor: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      borderRadius: 0,
                      fontFamily: "monospace",
                    }}
                  >
                    {credentials.email}
                  </Text>
                  <CopyButton value={credentials.email}>
                    {({ copied, copy }) => (
                      <Tooltip label={copied ? "Đã sao chép" : "Sao chép"} withArrow position="right">
                        <ActionIcon
                          color={copied ? "green" : "gray"}
                          variant="light"
                          size="lg"
                          radius={0}
                          onClick={copy}
                        >
                          {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </CopyButton>
                </Group>
              </div>

              <div>
                <Text size="xs" fw={700} c="dimmed" style={{ textTransform: "uppercase", marginBottom: "6px" }}>
                  Mật khẩu tạm thời
                </Text>
                <Group gap="xs">
                  <Text
                    size="sm"
                    fw={700}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      backgroundColor: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      borderRadius: 0,
                      fontFamily: "monospace",
                    }}
                  >
                    {credentials.temporaryPassword}
                  </Text>
                  <CopyButton value={credentials.temporaryPassword}>
                    {({ copied, copy }) => (
                      <Tooltip label={copied ? "Đã sao chép" : "Sao chép"} withArrow position="right">
                        <ActionIcon
                          color={copied ? "green" : "gray"}
                          variant="light"
                          size="lg"
                          radius={0}
                          onClick={copy}
                        >
                          {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </CopyButton>
                </Group>
              </div>
            </>
          )}

          <Group justify="flex-end" mt="md">
            <Button
              style={{ backgroundColor: "#1A3A5C" }}
              radius={0}
              onClick={() => setShowCredentialsModal(false)}
              fw={700}
            >
              Đã ghi nhận
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}

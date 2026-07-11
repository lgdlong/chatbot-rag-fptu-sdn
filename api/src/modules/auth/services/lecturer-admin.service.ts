import { randomBytes } from "node:crypto";
import { auth } from "../auth.js";
import { UserRepository } from "../repositories/user.repository.js";
import {
  sendEmail,
  templateLecturerApproved,
} from "./email.service.js";
import { createAuditLog } from "./audit.service.js";
import { ENV } from "../../../config/env.js";
import { ValidationError } from "./email-whitelist.service.js";

/**
 * LecturerAdminService -- business logic for the admin-only lecturer
 * management endpoints (create / disable / enable).
 *
 * Layer rule: must NOT import prisma. All DB access goes through
 * UserRepository. Validation throws ValidationError with the correct HTTP
 * status; the controller maps those to JSON responses. Auth.api, email,
 * and audit calls are best-effort and fire-and-forget where the original
 * controller was non-blocking.
 */
export interface CreateLecturerResult {
  success: true;
  credentials: { email: string; temporaryPassword: string };
  resetLink: string;
}

export interface ToggleResult {
  success: true;
}

export class LecturerAdminService {
  /**
   * Admin-initiated lecturer onboarding. Bypasses the public registration
   * whitelist, generates a temporary password, fires a password-reset email,
   * and writes an audit log.
   */
  static async createLecturer(input: {
    name: string;
    email: string;
    adminUserId: string;
  }): Promise<CreateLecturerResult> {
    const name = (input.name ?? "").toString().trim();
    const email = (input.email ?? "").toString().trim().toLowerCase();

    if (!name || !email) {
      throw new ValidationError("Họ tên và email là bắt buộc.", 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError("Invalid email format", 400);
    }

    const existing = await UserRepository.findByEmail(email);
    if (existing) {
      throw new ValidationError(
        "Email này đã có tài khoản trong hệ thống.",
        409
      );
    }

    // 16 hex chars from 8 random bytes -- matches pre-refactor behavior.
    const temporaryPassword = randomBytes(8).toString("hex");

    const signUpRes = await auth.api.signUpEmail({
      body: { name, email, password: temporaryPassword },
    });

    if (!signUpRes?.user?.id) {
      throw new Error("Better Auth signUpEmail did not return a user");
    }

    await UserRepository.updateRole(signUpRes.user.id, "LECTURER");

    // Better Auth's requestPasswordReset appends its own token to redirectTo.
    const resetLink = `${ENV.BETTER_AUTH_URL.replace("8001", "3000")}/reset-password`;

    // Trigger Better Auth's sendResetPassword hook (email thiết lập mật khẩu)
    try {
      await auth.api.requestPasswordReset({
        body: { email, redirectTo: resetLink },
      });
    } catch (error) {
      console.error(
        `[LecturerAdminService] requestPasswordReset failed for ${email}:`,
        error
      );
    }

    // Gửi email thông báo tài khoản + mật khẩu tạm thời cho giảng viên mới
    // (best-effort, không fail request nếu email lỗi).
    try {
      await sendEmail({
        to: email,
        subject:
          "Tài khoản Giảng viên của bạn đã được tạo trên FPTU RAG Chatbot",
        text: `Chào ${name},\n\nTài khoản Giảng viên của bạn đã được tạo thành công trên hệ thống FPTU RAG Chatbot.\n\nThông tin đăng nhập:\n- Email: ${email}\n- Mật khẩu tạm thời: ${temporaryPassword}\n\nVui lòng đổi mật khẩu ngay sau khi đăng nhập lần đầu tại:\n${resetLink}\n\nTrân trọng,\nBan quản trị FPTU RAG Chatbot`,
        html: templateLecturerApproved(
          name,
          email,
          temporaryPassword,
          resetLink
        ),
      });
    } catch (error) {
      console.error(
        `[LecturerAdminService] sendEmail failed for ${email}:`,
        error
      );
    }

    // Audit log -- fire-and-forget để không block response, giống controller cũ.
    Promise.resolve().then(async () => {
      try {
        await createAuditLog({
          userId: input.adminUserId,
          action: "CREATE_LECTURER",
          entityType: "Lecturer",
          entityId: signUpRes.user.id,
          details: { name, email },
        });
      } catch (auditErr) {
        console.error("[AuditLog] Failed to write:", auditErr);
      }
    });

    return {
      success: true,
      credentials: { email, temporaryPassword },
      resetLink,
    };
  }

  /**
   * Soft-disable a lecturer. Requires the target to already be a LECTURER;
   * other roles throw a 400. Audit log is written fire-and-forget so the
   * response returns immediately.
   */
  static async disableLecturer(
    userId: string,
    adminUserId: string
  ): Promise<ToggleResult> {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new ValidationError("User not found", 404);
    }
    if (user.role !== "LECTURER") {
      throw new ValidationError("User is not a lecturer", 400);
    }

    await UserRepository.setBanned(userId, true, "Disabled by admin");

    Promise.resolve().then(async () => {
      try {
        await createAuditLog({
          userId: adminUserId,
          action: "DISABLE_LECTURER",
          entityType: "Lecturer",
          entityId: userId,
          details: { email: user.email },
        });
      } catch (auditErr) {
        console.error("[AuditLog] Failed to write:", auditErr);
      }
    });

    return { success: true };
  }

  /**
   * Re-enable a previously disabled lecturer. banReason is reset to null
   * so future operators can tell the account was re-activated.
   */
  static async enableLecturer(
    userId: string,
    adminUserId: string
  ): Promise<ToggleResult> {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new ValidationError("User not found", 404);
    }
    if (user.role !== "LECTURER") {
      throw new ValidationError("User is not a lecturer", 400);
    }

    await UserRepository.setBanned(userId, false, null);

    Promise.resolve().then(async () => {
      try {
        await createAuditLog({
          userId: adminUserId,
          action: "ENABLE_LECTURER",
          entityType: "Lecturer",
          entityId: userId,
          details: { email: user.email },
        });
      } catch (auditErr) {
        console.error("[AuditLog] Failed to write:", auditErr);
      }
    });

    return { success: true };
  }
}

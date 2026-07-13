import { auth } from "../auth.js";
import { UserRepository } from "../repositories/user.repository.js";
import {
  sendEmail,
  templateLecturerApproved,
  templatePasswordResetByAdmin,
} from "./email.service.js";
import { createAuditLog } from "./audit.service.js";
import { ENV } from "../../../config/env.js";
import { ValidationError } from "./email-whitelist.service.js";

/** Convert email local-part to display name: nguyen.van.a → Nguyen Van A */
function emailToName(email: string): string {
  return email
    .split("@")[0]
    .split(/[._-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** Generate random password with only letters (mixed case), 16 chars. */
function generatePassword(): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let pwd = "";
  for (let i = 0; i < 16; i++) {
    pwd += letters[Math.floor(Math.random() * letters.length)];
  }
  return pwd;
}

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
  email: string;
}

export interface ToggleResult {
  success: true;
}

export class LecturerAdminService {
  /**
   * Admin-initiated lecturer onboarding. Bypasses the public registration
   * whitelist, generates a temporary password, fires a password-reset email,
   * and writes an audit log.
   *
   * Security: password is NEVER returned in the response. Only sent via email.
   * Better Auth hashes the password before storing.
   */
  static async createLecturer(input: {
    email: string;
    adminUserId: string;
  }): Promise<CreateLecturerResult> {
    const email = (input.email ?? "").toString().trim().toLowerCase();

    if (!email) {
      throw new ValidationError("Email là bắt buộc.", 400);
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

    const name = emailToName(email);
    const temporaryPassword = generatePassword();

    const signUpRes = await auth.api.signUpEmail({
      body: { name, email, password: temporaryPassword },
    });

    if (!signUpRes?.user?.id) {
      throw new Error("Better Auth signUpEmail did not return a user");
    }

    await UserRepository.updateRole(signUpRes.user.id, "LECTURER");

    // Better Auth hook (user.create.after) đã tự gửi email đặt mật khẩu.
    // Ở đây chỉ gửi email credentials — ko gọi requestPasswordReset nữa (tránh duplicate).
    const resetLink = `${ENV.BETTER_AUTH_URL.replace("8001", "3000")}/reset-password`;

    // Gửi email thông báo tài khoản + mật khẩu tạm thời cho giảng viên mới
    // (best-effort, không fail request nếu email lỗi).
    try {
      await sendEmail({
        to: email,
        subject:
          "Tài khoản Giảng viên của bạn đã được tạo trên FPTU RAG Chatbot",
        text: `Chào ${name},\n\nTài khoản Giảng viên của bạn đã được tạo thành công trên hệ thống FPTU RAG Chatbot.\n\nThông tin đăng nhập:\n- Email: ${email}\n- Mật khẩu tạm thời: ${temporaryPassword}\n\nMột email riêng về hướng dẫn đặt mật khẩu mới sẽ được gửi sau.\n\nTrân trọng,\nBan quản trị FPTU RAG Chatbot`,
        html: templateLecturerApproved(
          name,
          email,
          temporaryPassword
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

    return { success: true, email };
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
   * Admin-initiated password reset for a LECTURER user.
   * Generates a 16-char mixed-case password, updates via Better Auth,
   * sends the new credentials via email, and writes an audit log.
   *
   * Security: the new password is NEVER returned in the response body —
   * only transmitted via email.
   */
  static async resetLecturerPassword(
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

    const name = user.name ?? emailToName(user.email);
    const temporaryPassword = generatePassword();

    // Update password in Better Auth (server-side API call — no HTTP needed)
    await auth.api.setUserPassword({
      body: {
        userId: user.id,
        newPassword: temporaryPassword,
      },
    });

    // Send email with new credentials (best-effort, don't fail request)
    const loginUrl = `${ENV.BETTER_AUTH_URL.replace("8001", "3000")}/login`;
    try {
      await sendEmail({
        to: user.email,
        subject:
          "Mật khẩu tài khoản Giảng viên đã được cấp lại trên FPTU RAG Chatbot",
        text: `Chào ${name},\n\nMật khẩu tài khoản Giảng viên của bạn đã được quản trị viên cấp lại.\n\nThông tin đăng nhập mới:\n- Email: ${user.email}\n- Mật khẩu mới: ${temporaryPassword}\n\nVui lòng đăng nhập và đổi mật khẩu ngay sau khi nhận được email này.\n\nTrân trọng,\nBan quản trị FPTU RAG Chatbot`,
        html: templatePasswordResetByAdmin(
          name,
          user.email,
          temporaryPassword,
          loginUrl
        ),
      });
    } catch (error) {
      console.error(
        `[LecturerAdminService] sendEmail failed for ${user.email}:`,
        error
      );
    }

    // Audit log — fire-and-forget
    Promise.resolve().then(async () => {
      try {
        await createAuditLog({
          userId: adminUserId,
          action: "RESET_LECTURER_PASSWORD",
          entityType: "Lecturer",
          entityId: user.id,
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

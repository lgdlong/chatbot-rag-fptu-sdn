import { Resend } from "resend";
import { ENV } from "../../../config/env.js";

let resend: Resend | null = null;

function getClient(): Resend | null {
  if (!ENV.RESEND_API_KEY) return null;
  if (!resend) resend = new Resend(ENV.RESEND_API_KEY);
  return resend;
}

// ─── HTML email templates ───

export function templatePasswordReset(name: string, resetUrl: string): string {
  const safeName = escapeHtml(name);
  const safeUrl = validateUrl(resetUrl);
  return `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#F4F6F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px">
<table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,.06)">
  <tr><td style="background:#1A3A5C;padding:32px 40px;text-align:center">
    <h1 style="margin:0;color:#fff;font-size:20px;font-weight:800;letter-spacing:1px">FPTU <span style="color:#F37021">RAG</span> CHATBOT</h1>
  </td></tr>
  <tr><td style="padding:40px">
    <h2 style="margin:0 0 16px;font-size:18px;color:#1A3A5C;font-weight:700">Xin chào ${safeName},</h2>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#475569">
      Bạn nhận được email này vì có yêu cầu <b>thiết lập mật khẩu</b> cho tài khoản RAG Chatbot FPTU.
    </p>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#475569">
      Liên kết có hiệu lực trong <b>1 giờ</b>.
    </p>
    <table cellpadding="0" cellspacing="0"><tr><td>
      <a href="${safeUrl}" style="display:inline-block;padding:12px 28px;background:#F37021;color:#fff;text-decoration:none;font-size:15px;font-weight:700;border-radius:6px">Thiết lập mật khẩu</a>
    </td></tr></table>
    <p style="margin:24px 0 0;font-size:13px;color:#94A3B8">
      Hoặc copy liên kết này vào trình duyệt:<br>
      <span style="color:#1A3A5C;word-break:break-all">${safeUrl}</span>
    </p>
  </td></tr>
  <tr><td style="padding:24px 40px;background:#F8FAFC;border-top:1px solid #E2E8F0">
    <p style="margin:0;font-size:12px;color:#94A3B8;text-align:center">
      &copy; 2026 FPT University &bull; Hệ thống Trợ lý FLM &amp; RAG Hybrid
    </p>
  </td></tr>
</table>
</td></tr></table>
</body>
</html>`;
}

export function templatePasswordResetByAdmin(
  name: string,
  email: string,
  tempPassword: string,
  loginUrl: string
): string {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safePass = escapeHtml(tempPassword);
  const safeUrl = validateUrl(loginUrl);
  return `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#F4F6F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px">
<table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,.06)">
  <tr><td style="background:#1A3A5C;padding:32px 40px;text-align:center">
    <h1 style="margin:0;color:#fff;font-size:20px;font-weight:800;letter-spacing:1px">FPTU <span style="color:#F37021">RAG</span> CHATBOT</h1>
  </td></tr>
  <tr><td style="padding:40px">
    <h2 style="margin:0 0 16px;font-size:18px;color:#1A3A5C;font-weight:700">Xin chào ${safeName},</h2>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#475569">
      Mật khẩu tài khoản <b>Giảng viên</b> của bạn đã được <span style="color:#F37021;font-weight:700">cấp lại</span> bởi quản trị viên.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px">
      <tr><td style="padding:16px 20px">
        <p style="margin:0 0 8px;font-size:13px;color:#64748B;font-weight:600">THÔNG TIN ĐĂNG NHẬP MỚI</p>
        <p style="margin:0 0 4px;font-size:14px;color:#1A3A5C"><b>Email:</b> ${safeEmail}</p>
        <p style="margin:0 0 4px;font-size:14px;color:#1A3A5C"><b>Mật khẩu mới:</b> <span style="font-family:monospace;background:#E2E8F0;padding:2px 8px;border-radius:4px">${safePass}</span></p>
      </td></tr>
    </table>
    <table cellpadding="0" cellspacing="0"><tr><td>
      <a href="${safeUrl}" style="display:inline-block;padding:12px 28px;background:#F37021;color:#fff;text-decoration:none;font-size:15px;font-weight:700;border-radius:6px">Đăng nhập ngay</a>
    </td></tr></table>
    <p style="margin:16px 0 0;font-size:13px;line-height:1.5;color:#94A3B8">
      <i>Vui lòng đổi mật khẩu ngay sau khi đăng nhập để bảo mật tài khoản.</i>
    </p>
  </td></tr>
  <tr><td style="padding:24px 40px;background:#F8FAFC;border-top:1px solid #E2E8F0">
    <p style="margin:0;font-size:12px;color:#94A3B8;text-align:center">
      &copy; 2026 FPT University &bull; Hệ thống Trợ lý FLM &amp; RAG Hybrid
    </p>
  </td></tr>
</table>
</td></tr></table>
</body>
</html>`;
}

export function templateLecturerApproved(name: string, email: string, tempPassword: string): string {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safePass = escapeHtml(tempPassword);
  return `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#F4F6F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px">
<table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,.06)">
  <tr><td style="background:#1A3A5C;padding:32px 40px;text-align:center">
    <h1 style="margin:0;color:#fff;font-size:20px;font-weight:800;letter-spacing:1px">FPTU <span style="color:#F37021">RAG</span> CHATBOT</h1>
  </td></tr>
  <tr><td style="padding:40px">
    <h2 style="margin:0 0 16px;font-size:18px;color:#1A3A5C;font-weight:700">Chào mừng ${safeName}!</h2>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#475569">
      Yêu cầu đăng ký tài khoản <b>Giảng viên</b> đã được <span style="color:#16A34A;font-weight:700">phê duyệt</span>.
    </p>
    <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#475569">
      Email đăng nhập và mật khẩu tạm thời của bạn:
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px">
      <tr><td style="padding:16px 20px">
        <p style="margin:0 0 8px;font-size:13px;color:#64748B;font-weight:600">THÔNG TIN ĐĂNG NHẬP</p>
        <p style="margin:0 0 4px;font-size:14px;color:#1A3A5C"><b>Email:</b> ${safeEmail}</p>
        <p style="margin:0;font-size:14px;color:#1A3A5C"><b>Mật khẩu tạm thời:</b> <span style="font-family:monospace;background:#E2E8F0;padding:2px 8px;border-radius:4px">${safePass}</span></p>
      </td></tr>
    </table>
    <p style="margin:0;font-size:13px;line-height:1.5;color:#94A3B8">
      <i>Email riêng về hướng dẫn đặt mật khẩu mới sẽ được gửi riêng sau đó.</i>
    </p>
  </td></tr>
  <tr><td style="padding:24px 40px;background:#F8FAFC;border-top:1px solid #E2E8F0">
    <p style="margin:0;font-size:12px;color:#94A3B8;text-align:center">
      &copy; 2026 FPT University &bull; Hệ thống Trợ lý FLM &amp; RAG Hybrid
    </p>
  </td></tr>
</table>
</td></tr></table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function validateUrl(url: string): string {
  try {
    const u = new URL(url);
    if (!["http:", "https:"].includes(u.protocol)) return "#";
    return escapeHtml(url);
  } catch {
    return "#";
  }
}

// ─── sendEmail ───

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html?: string;
  text: string;
}) {
  const client = getClient();

  if (!client) {
    if (process.env.NODE_ENV !== "production") {
      console.log("\n==================================================");
      console.log(`[LOCAL DEV EMAIL] To: ${to}`);
      console.log(`[LOCAL DEV EMAIL] Subject: ${subject}`);
      console.log(`[LOCAL DEV EMAIL] Text:\n${text}`);
      if (html) console.log(`[LOCAL DEV EMAIL] HTML:\n${html}`);
      console.log("==================================================\n");
    }
    return;
  }

  try {
    const { data, error } = await client.emails.send({
      from: ENV.EMAIL_FROM,
      to: [to],
      subject,
      html: html || text,
      text,
    });

    if (error) {
      console.error(`[Email Service] Resend error for ${to}:`, error);
      return;
    }

    console.log(`[Email Service] Email sent to ${to}. ID: ${data?.id}`);
  } catch (error) {
    console.error(`[Email Service] Failed to send email to ${to}:`, error);
  }
}

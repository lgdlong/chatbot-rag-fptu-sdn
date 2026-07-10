import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock env module so RESEND_API_KEY is "" (falsy → getClient() returns null,
// → sendEmail uses dev/local path instead of real Resend API)
vi.mock("../../../../config/env.js", () => ({
  ENV: {
    RESEND_API_KEY: "",
    EMAIL_FROM: "FPTU RAG Chatbot <onboarding@resend.dev>",
  },
}));

import { templatePasswordReset, sendEmail } from "../email.service.js";

describe("templatePasswordReset", () => {
  it("should generate valid HTML with all expected content", () => {
    const name = "Nguyễn Văn A";
    const resetUrl = "https://localhost:3000/reset-password?token=abc123";
    const html = templatePasswordReset(name, resetUrl);

    expect(html).toContain("Nguyễn Văn A");
    expect(html).toContain("https://localhost:3000/reset-password?token=abc123");
    expect(html).toContain("FPTU");
    expect(html).toContain("RAG");
    expect(html).toContain("Thiết lập mật khẩu");
    expect(html).toContain("1 giờ");
    expect(html).toContain("FPT University");
  });

  it("should escape XSS attempts in the name parameter", () => {
    const html = templatePasswordReset(
      "<script>alert('xss')</script>",
      "https://example.com/reset?token=x",
    );

    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
  });

  it("should block javascript: protocol URLs from appearing in href", () => {
    const html = templatePasswordReset("User", "javascript:alert(1)");

    expect(html).toContain('href="#"');
  });

  it("should block malformed URLs from appearing in href", () => {
    const html = templatePasswordReset("User", "not-a-url");

    expect(html).toContain('href="#"');
  });

  it("should escape HTML special chars in URL parameters", () => {
    const html = templatePasswordReset(
      "User",
      "https://example.com/reset?token=<x>",
    );

    expect(html).toContain("&lt;x&gt;");
  });

  it("should generate a complete HTML document structure", () => {
    const html = templatePasswordReset("User", "https://example.com/reset");

    expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
    expect(html).toContain("</html>");
  });
});

describe("sendEmail", () => {
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV;
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    vi.restoreAllMocks();
  });

  it("should log to console in dev mode without RESEND_API_KEY", async () => {
    process.env.NODE_ENV = "development";

    await sendEmail({
      to: "test@test.com",
      subject: "test",
      text: "Hello",
    });

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("[LOCAL DEV EMAIL]"),
    );
  });
});

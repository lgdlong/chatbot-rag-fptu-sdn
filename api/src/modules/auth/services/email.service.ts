import nodemailer from "nodemailer";
import { ENV } from "../../../config/env.js";

const transporter = nodemailer.createTransport({
  host: ENV.SMTP_HOST,
  port: ENV.SMTP_PORT,
  secure: ENV.SMTP_PORT === 465, // true for 465, false for other ports
  auth: ENV.SMTP_USER && ENV.SMTP_PASS ? {
    user: ENV.SMTP_USER,
    pass: ENV.SMTP_PASS,
  } : undefined,
});

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
  // If SMTP is not fully configured, fall back to console log for easy development/testing
  if (!ENV.SMTP_USER || !ENV.SMTP_PASS) {
    console.log("\n==================================================");
    console.log(`[LOCAL DEV EMAIL] To: ${to}`);
    console.log(`[LOCAL DEV EMAIL] Subject: ${subject}`);
    console.log(`[LOCAL DEV EMAIL] Text Content:\n${text}`);
    if (html) {
      console.log(`[LOCAL DEV EMAIL] HTML Content:\n${html}`);
    }
    console.log("==================================================\n");
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: ENV.SMTP_FROM,
      to,
      subject,
      text,
      html,
    });
    console.log(`[Email Service] Email sent successfully to ${to}. Message ID: ${info.messageId}`);
  } catch (error) {
    console.error(`[Email Service] Failed to send email to ${to}:`, error);
    console.log("\n================ [SMTP SEND FAILED - FALLBACK TO CONSOLE LOG] ================");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Text Content:\n${text}`);
    if (html) {
      console.log(`HTML Content:\n${html}`);
    }
    console.log("==============================================================================\n");
  }
}

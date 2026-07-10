import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from './services/db.service.js'
import { admin } from 'better-auth/plugins/admin'
import { adminAc, userAc } from 'better-auth/plugins/admin/access'
import { openAPI } from 'better-auth/plugins'
import { ENV } from '../../config/env.js'
import { sendEmail, templatePasswordReset } from './services/email.service.js'

function isStudentEmail(email: string) {
  const parts = email.toLowerCase().split('@');
  if (parts.length !== 2) return false;
  const [localPart, domain] = parts;
  if (domain !== 'fpt.edu.vn') return false;
  return /\d/.test(localPart);
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  onAPIError: {
    errorURL: `${ENV.BETTER_AUTH_URL.replace("8001", "3000")}/login`,
  },
  trustedOrigins: ["http://localhost:3000"], // Whitelist Next.js frontend origin for CSRF
  advanced: {
    ipAddress: {
      ipAddressHeaders: ["x-forwarded-for", "x-real-ip", "cf-connecting-ip"],
    },
  },
  emailAndPassword: {
    enabled: true,
    allowedDomains: ["@fpt.edu.vn", "@gmail.com"],
    sendResetPassword: async ({ user, url, token }, request) => {
      const userName = user.name || "bạn";
      await sendEmail({
        to: user.email,
        subject: "Thiết lập mật khẩu tài khoản RAG Chatbot FPTU",
        text: `Chào ${userName},\n\nTài khoản của bạn vừa được đăng ký. Vui lòng truy cập đường dẫn sau để đặt mật khẩu:\n${url}\n\nLiên kết có hiệu lực 1 giờ.\n\nTrân trọng,\nĐội ngũ vận hành FPTU RAG Chatbot`,
        html: templatePasswordReset(userName, url),
      });
    }
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    storage: "memory",
    customRules: {
      "/request-password-reset": {
        window: 900,
        max: 3,
      },
      "/reset-password": {
        window: 300,
        max: 5,
      },
    },
  },
  socialProviders: {
    google: {
      clientId: ENV.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || "dummy_google_client_id",
      clientSecret: ENV.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || "dummy_google_client_secret",
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (isStudentEmail(user.email)) {
            const whitelisted = await prisma.emailWhitelist.findUnique({
              where: { email: user.email }
            });
            if (!whitelisted) {
              throw new Error("Email chưa được trường cấp quyền truy cập. Liên hệ admin để được hỗ trợ.");
            }
            user.role = 'STUDENT';
          }
          return {
            data: user
          };
        },
        after: async (user) => {
          // Chỉ gửi mail đổi/đặt mật khẩu cho người dùng email/password chưa kích hoạt (bỏ qua social login Google đã verified)
          if (!user.emailVerified) {
            try {
              const frontendUrl = ENV.BETTER_AUTH_URL.replace("8001", "3000");
              await auth.api.requestPasswordReset({
                body: {
                  email: user.email,
                  redirectTo: `${frontendUrl}/reset-password`,
                }
              });
              console.log(`[Auth Hook] Sent password setup email to ${user.email}`);
            } catch (error) {
              console.error(`[Auth Hook] Failed to request password reset for ${user.email}:`, error);
            }
          }
        }
      }
    },
    session: {
      create: {
        before: async (session) => {
          const user = await prisma.user.findUnique({
            where: { id: session.userId }
          });
          if (user && user.role === 'STUDENT') {
            const whitelisted = await prisma.emailWhitelist.findUnique({
              where: { email: user.email }
            });
            if (!whitelisted) {
              throw new Error("Email chưa được trường cấp quyền truy cập. Liên hệ admin để được hỗ trợ.");
            }
          }
          return {
            data: session
          };
        }
      }
    }
  },
  plugins: [
    admin({
      adminRoles: ['ADMIN'],
      roles: {
        ADMIN: adminAc,
        LECTURER: userAc,
        STUDENT: userAc,
      },
    }),
    openAPI(),
  ],
})

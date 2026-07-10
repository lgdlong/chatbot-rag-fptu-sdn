import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from './services/db.service.js'
import { admin } from 'better-auth/plugins/admin'
import { adminAc, userAc } from 'better-auth/plugins/admin/access'
import { openAPI } from 'better-auth/plugins'
import { ENV } from '../../config/env.js'
import { sendEmail } from './services/email.service.js'

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
  user: {
    additionalFields: {
      plainPassword: {
        type: 'string',
        required: false,
      }
    }
  },
  onAPIError: {
    errorURL: `${ENV.BETTER_AUTH_URL.replace("8001", "3000")}/login`,
  },
  trustedOrigins: ["http://localhost:3000"], // Whitelist Next.js frontend origin for CSRF
  emailAndPassword: {
    enabled: true,
    allowedDomains: ["@fpt.edu.vn", "@gmail.com"],
    sendResetPassword: async ({ user, url, token }, request) => {
      await sendEmail({
        to: user.email,
        subject: "Thiết lập mật khẩu tài khoản RAG Chatbot FPTU",
        text: `Chào ${user.name},\n\nTài khoản của bạn vừa được đăng ký trên hệ thống RAG Chatbot FPTU.\n\nVui lòng truy cập đường dẫn sau để đặt mật khẩu mới cho tài khoản:\n${url}\n\nĐường dẫn này có hiệu lực trong vòng 1 giờ.\n\nTrân trọng,\nĐội ngũ vận hành FPTU RAG Chatbot`,
        html: `<p>Chào <b>${user.name}</b>,</p>
               <p>Tài khoản của bạn vừa được đăng ký trên hệ thống RAG Chatbot FPTU.</p>
               <p>Vui lòng click vào nút bên dưới để tiến hành đặt mật khẩu mới:</p>
               <p><a href="${url}" style="display:inline-block;padding:10px 20px;color:white;background-color:#F26F21;text-decoration:none;font-weight:bold;">Thiết lập mật khẩu</a></p>
               <p>Hoặc copy liên kết sau vào trình duyệt:</p>
               <p>${url}</p>
               <p>Đường dẫn này có hiệu lực trong vòng 1 giờ.</p>
               <br/>
               <p>Trân trọng,<br/>Đội ngũ vận hành FPTU RAG Chatbot</p>`
      });
    }
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
            const lecturerRequest = await prisma.lecturerRequest.findUnique({
              where: { email: user.email }
            });
            if (lecturerRequest) {
              return {
                data: user
              };
            }
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
            // Kiểm tra xem tài khoản này có phải là Giảng viên đang trong quá trình được duyệt không
            const isLecturerApproval = await prisma.lecturerRequest.findFirst({
              where: {
                email: user.email,
                status: "PENDING"
              }
            });

            // Nếu không phải là duyệt giảng viên (nghĩa là đăng ký student, admin hoặc gmail thông thường), gửi mail reset password
            if (!isLecturerApproval) {
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

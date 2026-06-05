import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from './services/db.service.js'
import { admin } from 'better-auth/plugins/admin'
import { adminAc, userAc } from 'better-auth/plugins/admin/access'
import { openAPI } from 'better-auth/plugins'
import { ENV } from '../../config/env.js'

function isStudentEmail(email: string) {
  return email.toLowerCase().endsWith('@fpt.edu.vn')
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  trustedOrigins: ["http://localhost:3000"], // Whitelist Next.js frontend origin for CSRF
  emailAndPassword: {
    enabled: true,
    allowedDomains: ["@fpt.edu.vn", "@gmail.com"],
  },
socialProviders: {
    google: {
      clientId: ENV.GOOGLE_CLIENT_ID || '',
      clientSecret: ENV.GOOGLE_CLIENT_SECRET || '',
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
        }
      }
    },
    session: {
      create: {
        before: async (session) => {
          const user = await prisma.user.findUnique({
            where: { id: session.userId }
          });
          if (user && (user.role === 'STUDENT' || isStudentEmail(user.email))) {
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

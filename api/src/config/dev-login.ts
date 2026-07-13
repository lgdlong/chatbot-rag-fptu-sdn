/**
 * Dev-login configuration.
 *
 * Mỗi role map tới một user mẫu dùng cho dev-login (các nút DEV LOGIN trên trang login).
 * Thay đổi credentials ở đây thay vì sửa trong controller.
 *
 * - userId / accountId: dùng khi upsert user và account.
 * - passwordHash: hash của plaintext password (Better Auth format salt:hash).
 * - password: plaintext password dùng để sign-in.
 */

export interface DevLoginAccount {
  role: string
  email: string
  name: string
  userId: string
  accountId: string
  passwordHash: string
  password: string
}

export const DEV_LOGIN_ACCOUNTS: Record<string, DevLoginAccount> = {
  student: {
    role: 'STUDENT',
    email: 'student2@fpt.edu.vn',
    name: 'Sinh vien Hai',
    userId: 'uecWMv1k1EkjMP4jyI45aYS7kEvYeFMY',
    accountId: 'fG96zHr6uTWtUtAigwu3DnSt84C1fA9U',
    passwordHash:
      '751992d00aba4afb76c3b05a4d930078:ec1f5fc5693549c3f43dd89b750a077e4f537cddbc88c173e8b3cdfed427f1ba4b89aa405305b1d5f9de7c298d2f83980a66e98f7d6fc4bac91246f257e06ccd',
    password: 'StudentPassword123!',
  },
  lecturer: {
    role: 'LECTURER',
    email: 'lecturer-test@fpt.edu.vn',
    name: 'Giảng viên E2E Test',
    userId: 'user-test-e2e-lecturer-id',
    accountId: 'account-test-e2e-lecturer-id',
    passwordHash:
      '751992d00aba4afb76c3b05a4d930078:ec1f5fc5693549c3f43dd89b750a077e4f537cddbc88c173e8b3cdfed427f1ba4b89aa405305b1d5f9de7c298d2f83980a66e98f7d6fc4bac91246f257e06ccd',
    password: 'StudentPassword123!',
  },
  admin: {
    role: 'ADMIN',
    email: 'admin-test@fpt.edu.vn',
    name: 'Quản trị viên E2E Test',
    userId: 'user-test-e2e-admin-id',
    accountId: 'account-test-e2e-admin-id',
    passwordHash:
      '751992d00aba4afb76c3b05a4d930078:ec1f5fc5693549c3f43dd89b750a077e4f537cddbc88c173e8b3cdfed427f1ba4b89aa405305b1d5f9de7c298d2f83980a66e98f7d6fc4bac91246f257e06ccd',
    password: 'StudentPassword123!',
  },
}

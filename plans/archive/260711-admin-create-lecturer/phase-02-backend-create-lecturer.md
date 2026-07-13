# Phase 2: Backend — API Tạo Lecturer

**Plan:** [plan-admin-create-lecturer.md](./plan-admin-create-lecturer.md)  
**Ngày:** 2026-07-11  
**Priority:** HIGH  
**Status:** PENDING  

## Mục tiêu

Thêm API endpoint `POST /api/admin/create-lecturer` cho phép admin nhập email → hệ thống tạo user, gán role LECTURER, gen mật khẩu random, gửi email welcome.

## Files Thay Đổi

### Thêm
| File | Nội dung |
|------|----------|
| `api/src/modules/auth/lecturer-admin.controller.ts` | Controller mới: `POST /api/admin/create-lecturer` |

### Sửa
| File | Thay đổi |
|------|----------|
| `api/src/index.ts` | Mount router mới: `/api/admin/*` |

## Logic Controller

```
POST /api/admin/create-lecturer
Body: { name: string, email: string }

1. requireAdmin(c) — kiểm tra session + role ADMIN
2. Validate name, email (format)
3. Check email chưa tồn tại (prisma.user.findUnique)
4. Generate random password: crypto.randomBytes(8).toString('hex') → 16 ký tự hex
5. Gọi auth.api.signUpEmail({ name, email, password: randomPass })
6. Cập nhật role: prisma.user.update({ role: "LECTURER" })
7. Gửi email qua sendEmail() dùng templateLecturerApproved(name, email, randomPass, resetLink)
8. Tạo password reset token (auth.api.requestPasswordReset)
9. Return { success: true, email, temporaryPassword: randomPass }
```

## Implementation Steps

1. Tạo `api/src/modules/auth/lecturer-admin.controller.ts`
   - Import auth, prisma, sendEmail, templateLecturerApproved, crypto, ENV
   - Viết `requireAdmin` helper (copy từ lecturer-request.controller.ts cũ)
   - Viết handler `POST /create-lecturer`
2. Sửa `api/src/index.ts` — import + mount router mới
3. Build check

## Success Criteria

- `POST /api/admin/create-lecturer` tạo user thành công
- User có role LECTURER trong DB
- Email gửi chứa tên, email, mật khẩu tạm
- Mật khẩu tạm được gen ngẫu nhiên, không lưu plaintext lâu dài
- Build không lỗi

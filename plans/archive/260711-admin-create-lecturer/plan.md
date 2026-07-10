# Plan: Admin Tạo Tài Khoản Giảng Viên

**Ngày:** 2026-07-11  
**Trạng thái:** ARCHIVED — COMPLETED  
**Archived tại:** `plans/260711-admin-create-lecturer/`  

## Mục tiêu

Thay flow đăng ký giảng viên hiện tại (lecturer tự đăng ký → admin duyệt → lưu plaintext password) bằng flow mới: **admin trực tiếp tạo tài khoản giảng viên**, hệ thống gen mật khẩu ngẫu nhiên, gửi email, lecturer tự đổi mật khẩu trong dashboard.

## Phases

| # | Phase | Files | Status |
|---|-------|-------|--------|
| 1 | [Cleanup — xoá flow lecturer cũ](./phase-01-cleanup.md) | ~8 xoá/sửa | DONE |
| 2 | [Backend — API tạo lecturer](./phase-02-backend.md) | 1 thêm, 1 sửa | DONE |
| 3 | [Frontend — Trang admin tạo lecturer](./phase-03-frontend-create.md) | 1 thêm, 2 sửa | DONE |
| 4 | [Trang đổi mật khẩu teacher](./phase-04-change-password.md) | 1 sửa | DONE |
| 5 | [Security — xoá plainPassword](./phase-05-remove-plainpassword.md) | 2 sửa | DONE |

## Tổng

- **Xoá:** `register-teacher/page.tsx`, `lecturer-request.controller.ts`, `lecturer-requests/page.tsx`, Prisma model `LecturerRequest`
- **Thêm:** `lecturer-admin.controller.ts`, `create-lecturer/page.tsx`
- **Sửa:** `auth.ts`, `auth-client.ts`, `index.ts`, `api.ts`, `teacher/page.tsx`, `superadmin/page.tsx`, `login/page.tsx`, `env.ts`

## Prerequisites

- ✅ `resend` thay `nodemailer`
- ✅ `EMAIL_FROM = "FPTU RAG Chatbot <onboarding@resend.dev>"`
- ✅ Template `templateLecturerApproved()` trong `email.service.ts`

## Archive

Sau khi hoàn thành, chuyển toàn bộ `.omo/plans/` → `plans/260711-admin-create-lecturer/`

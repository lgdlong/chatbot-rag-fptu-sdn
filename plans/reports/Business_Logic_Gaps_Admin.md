# Báo Cáo Chức Năng Cần Bổ Sung — Admin & Lecturer Management

> **Ngày**: 2026-07-13  
> **Phạm vi**: Admin governance, lecturer onboarding, password recovery  
> **Mục tiêu**: Liệt kê các chức năng business logic còn thiếu cần implement

---

## 1. 🔴 Tạo Teacher — Chỉ Nhập Email (bỏ Name + Password)

**Hiện tại:** `POST /api/admin/create-lecturer` yêu cầu `name` + `email`. Tạo account với mật khẩu random.

**Yêu cầu mới:** Admin chỉ cần nhập **email**. Hệ thống tự động:
- Random mật khẩu mạnh (16+ ký tự, mixed case + số + ký tự đặc biệt)
- Gửi email chứa thông tin đăng nhập + mật khẩu
- Name có thể gán tạm = phần địa chỉ email (VD: `nguyen.van.a@fpt.edu.vn` → `Nguyen Van A`)

**Cần sửa:**
| File | Sửa |
|------|-----|
| `web/app/superadmin/create-lecturer/page.tsx` | Bỏ field Name. Chỉ giữ email. |
| `api/src/modules/auth/services/lecturer-admin.service.ts` | Auto-generate name từ email, tăng độ mạnh password |
| `api/src/modules/auth/lecturer-admin.controller.ts` | Update validation (không bắt buộc name) |

---

## 2. 🔴 Admin Reset Mật Khẩu Teacher (Forgot Password Recovery)

**Hiện tại:** **Không có.** Chỉ có Better Auth tự động `requestPasswordReset` gửi email reset link — nhưng link này yêu cầu teacher tự click để đặt mật khẩu mới. Nếu teacher không vào được email hoặc link hết hạn, không có cách nào recovery từ admin.

**Yêu cầu:** Endpoint cho phép **Admin tự reset mật khẩu** của bất kỳ teacher nào.

### Backend — endpoint mới

```
POST /api/admin/reset-lecturer-password/:userId
Auth: ADMIN
```

**Logic:**
1. Kiểm tra user tồn tại + role = LECTURER
2. Random mật khẩu mạnh mới (16+ ký tự)
3. Update password trong Better Auth account
4. Gửi email chứa mật khẩu mới + hướng dẫn đổi trong settings
5. Ghi audit log `RESET_LECTURER_PASSWORD`

### Cần tạo mới:

| File | Nội dung |
|------|----------|
| `api/src/modules/auth/services/lecturer-admin.service.ts` | Thêm method `resetLecturerPassword(userId, adminUserId)` |
| `api/src/modules/auth/lecturer-admin.controller.ts` | Thêm route `POST /api/admin/reset-lecturer-password/:userId` |
| `api/src/modules/auth/services/email.service.ts` | Thêm template email `templatePasswordResetByAdmin()` |
| `api/src/modules/auth/repositories/user.repository.ts` | Thêm method `updatePassword(userId, hashedPassword)` |

### Frontend — nút reset trên trang teacher detail

| File | Sửa |
|------|-----|
| `web/app/superadmin/admins/[id]/page.tsx` | Thêm nút "Cấp lại mật khẩu" → API call → hiển thị kết quả |
| `web/app/superadmin/admins/page.tsx` | Thêm action icon "Reset password" trong table row |

### Email template mới

```
Chào [Tên],

Mật khẩu tài khoản Giảng viên của bạn trên hệ thống FPTU RAG Chatbot
đã được Admin cấp lại.

Thông tin đăng nhập mới:
- Email: [email]
- Mật khẩu mới: [password]

⚠️ VUI LÒNG ĐỔI MẬT KHẨU NGAY SAU KHI ĐĂNG NHẬP:
Vào menu Cài đặt (Settings) → Đổi mật khẩu → Nhập mật khẩu mới.

Liên kết đăng nhập: [login_url]

Trân trọng,
Ban quản trị FPTU RAG Chatbot
```

---

## 3. 🟡 Cập Nhật Email Template — Chỉ Rõ "Vào Settings Đổi Mật Khẩu"

**Hiện tại:** `templateLecturerApproved()` trong `email.service.ts` có dòng:
> "Vui lòng đổi mật khẩu sau khi đăng nhập lần đầu."

**Yêu cầu:** Phải chỉ rõ **đường dẫn cụ thể** đến trang settings:
> "Sau khi đăng nhập, vào menu **Cài đặt (Settings)** → **Đổi mật khẩu** để đặt mật khẩu mới."

**Cần sửa:**
| File | Sửa |
|------|-----|
| `api/src/modules/auth/services/email.service.ts` | Update `templateLecturerApproved()` — thêm hướng dẫn chi tiết đường dẫn settings + link |

---

## 4. 🟡 Admin Dashboard — Thiếu Thông Tin Teacher

**Hiện tại:** Dashboard có 8 stat cards (admins, lecturers, students, whitelist, courses, syllabuses, documents, chat sessions) + query trend chart + activity log.

**Thiếu:**
| Chức năng | Mô tả |
|-----------|-------|
| Last active của teacher | Khi nào teacher login lần cuối? (dựa vào session) |
| Số syllabus chưa sync | Syllabus có status sync ≠ SYNCED |
| Top teacher theo activity | Teacher nào tương tác nhiều nhất |

---

## 5. 🟡 Audit Log — Cần Thêm Event Types

**Hiện tại:** Audit log đã ghi `CREATE_LECTURER`, `DISABLE_LECTURER`, `ENABLE_LECTURER`, `CREATE_SYLLABUS`, `APPROVE_SYLLABUS`, `ACTIVATE_SYLLABUS`, `UPLOAD_DOCUMENT`.

**Cần thêm:**
| Event | Khi nào |
|-------|---------|
| `RESET_LECTURER_PASSWORD` | Admin reset mật khẩu teacher |
| `UPDATE_LECTURER` | Admin sửa thông tin teacher |
| `LOGIN` | Teacher login (nếu cần tracking) |

---

## 6. 🟢 Unify Create Lecturer UI

**Hiện tại:** Có **2 UI tạo teacher** riêng biệt:
- `/superadmin/create-lecturer/page.tsx` — Form chuyên dụng (chỉ create lecturer)
- `/superadmin/admins/page.tsx` — Modal "Tạo tài khoản" (tạo user với role bất kỳ)

**Nên:** Gộp làm một flow. Nút "Tạo giảng viên" ở trang `/superadmin/admins` mở modal chỉ nhập email (theo yêu cầu mới) thay vì redirect sang page riêng.

---

## Tổng Quan Mức Độ

| Priority | Chức năng | Nỗ lực | Phụ thuộc |
|----------|-----------|--------|-----------|
| 🔴 P0 | Tạo teacher chỉ email | ~0.5 ngày | Backend nhẹ + Frontend đơn giản |
| 🔴 P0 | Admin reset password teacher | ~1 ngày | Backend mới + Email template + Audit event type |
| 🟡 P1 | Update email template — chỉ rõ settings | ~0.25 ngày | Sửa text trong template |
| 🟡 P2 | Admin dashboard bổ sung teacher stats | ~0.5 ngày | Backend service + Frontend card |
| 🟢 P3 | Unify create lecturer UI | ~0.5 ngày | Frontend refactor |

---

*Report bổ sung cho QA_Final_Report.md — focus vào business logic admin còn thiếu*

# Danh Sách Chức Năng Mới Cần Thêm

> **Ngày**: 2026-07-13
> **Nguồn**: Tổng hợp từ `QA_Final_Report.md` và `Business_Logic_Gaps_Admin.md`
> **Kiểm tra codebase lần cuối**: 2026-07-13

---

## 1. 🔴 Tạo Teacher — Chỉ Nhập Email + Password Gửi Email (Ko Lưu Plaintext) + Unify UI

**Nguồn:** Business_Logic_Gaps_Admin.md — Mục 1 + Mục 6

**Trạng thái:** ✅ **Đã triển khai**

**Các thay đổi đã thực hiện:**

| File | Thay đổi |
|------|----------|
| `api/src/modules/auth/services/lecturer-admin.service.ts` | Thêm `emailToName()` + `generatePassword()` (16 chữ mixed case). Xoá `credentials` khỏi return, chỉ trả `{ success, email }`. Password ko lộ ra API. Xoá `requestPasswordReset` thủ công (tránh duplicate email). |
| `api/src/modules/auth/lecturer-admin.controller.ts` | Bỏ `name` khỏi request body. Chỉ nhận `email`. |
| `api/src/modules/auth/services/email.service.ts` | `templateLecturerApproved()` — xoá nút "Đến trang đổi mật khẩu", chỉ hiển thị thông tin đăng nhập. |
| `web/lib/api.ts` | `CreateLecturerResponse` — xoá `credentials` + `resetLink`, chỉ `{ success, email }`. |
| `web/app/superadmin/create-lecturer/page.tsx` | Bỏ name field, bỏ modal credentials. Khi tạo xong → Alert "Mật khẩu đã gửi qua email". |
| `web/app/superadmin/admins/page.tsx` | Thêm modal "Tạo giảng viên" — chỉ nhập email, dùng API `createLecturer`, toast success. |
| `.env` | `EMAIL_FROM` set `noreply@lgdlong.site` — Resend đã verify domain. |

---

## 2. 🔴 Admin Reset Mật Khẩu Teacher (Forgot Password Recovery)

**Nguồn:** Business_Logic_Gaps_Admin.md — Mục 2

**Trạng thái:** ❌ **Chưa triển khai**

**Hiện tại:** **Không có.** Chỉ có Better Auth `requestPasswordReset` — teacher tự reset qua email link.

**Kiểm tra codebase:**
- `api/src/modules/auth/lecturer-admin.controller.ts` — **ko có** route `reset-lecturer-password`. Chỉ có 3 routes: `create-lecturer`, `disable-lecturer`, `enable-lecturer`.
- `api/src/modules/admin/admin.controller.ts` — **ko có** reset endpoint.
- `api/src/index.ts` — mount `/api/admin` chỉ gồm `lecturerAdminRouter` + `adminStatsRouter`. Ko có reset route.
- `web/app/superadmin/admins/[id]/page.tsx` — **ko có** nút "Cấp lại mật khẩu".
- `web/app/superadmin/admins/page.tsx` — **ko có** action reset trong table row.

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
| `api/src/modules/auth/services/audit.service.ts` | Thêm `RESET_LECTURER_PASSWORD` vào `AuditAction` type |

### Frontend — nút reset trên trang teacher detail

| File | Sửa |
|------|-----|
| `web/app/superadmin/admins/[id]/page.tsx` | Thêm nút "Cấp lại mật khẩu" → API call → hiển thị kết quả |
| `web/app/superadmin/admins/page.tsx` | Thêm action icon "Reset password" trong table row |

---

## 3. ❌ BACKEND TEST COVERAGE

**Nguồn:** QA_Final_Report.md — Mục IV.2

**Trạng thái:** ❌ **Chưa triển khai** (⏳ User note: xử lý sau)

**Thực tế (kiểm tra codebase):**
- 1 file test duy nhất: `api/src/modules/auth/services/__tests__/email.service.test.ts`
- Không có unit test cho services
- Không có integration test cho API endpoints
- Không có E2E test

---

## 4. ⚠️ FRONTEND: THIẾU NEXT.JS BEST PRACTICES

**Nguồn:** QA_Final_Report.md — Mục IV.5

**Trạng thái:** ❌ **Chưa triển khai**

**Kiểm tra codebase:** **0 file** được tìm thấy:
- 0 `error.tsx` — Crash → white screen, ko fallback UI
- 0 `not-found.tsx` — 404 → blank
- 0 `loading.tsx` — ko skeleton
- ❌ `generateMetadata` — thiếu SEO title/description

**Mức độ ảnh hưởng:** **THẤP-TRUNG BÌNH** — Demo ko crash nhưng UX kém.

---

## 5. ⚠️ FRONTEND: UI/UX GAPS

**Nguồn:** QA_Final_Report.md — Mục IV.6

**Trạng thái:** ❌ **Chưa triển khai**

**Kiểm tra codebase:**

| Issue | Codebase Evidence |
|-------|------------------|
| ❌ Student layout ko sidebar | `web/app/student/layout.tsx` — AppShell chỉ header, **ko có** `AppShell.Navbar`. Navigation bằng dropdown menu. |
| ❌ Chat là floating widget | Student chỉ có chatbot widget trong syllabus detail page. **Ko có** standalone `web/app/student/chat/`. Teacher *có* chat page riêng (`web/app/teacher/chat/page.tsx`). |
| ❌ Teacher document manager ko batch upload | `web/app/teacher/documents/page.tsx` — upload từng file một qua modal. Ko có multi-file select. |
| ❌ Ko có breadcrumb | `web/app/student/syllabus/[subjectCode]/page.tsx` — ko có `Breadcrumb` component. |

**Mức độ ảnh hưởng:** **THẤP** — UI hoạt động được, thiếu refinement.

---

## 6. 🟡 Admin Dashboard — Thiếu Thông Tin Teacher

**Nguồn:** Business_Logic_Gaps_Admin.md — Mục 4

**Trạng thái:** ❌ **Chưa triển khai**

**Kiểm tra codebase:** `api/src/modules/admin/admin.service.ts`
- `DashboardStats`: 8 fields — `admins`, `lecturers`, `students`, `whitelist`, `syllabuses`, `courses`, `documents`, `chatSessions`.
- **Thiếu:** last active teacher, số syllabus chưa sync, top teacher activity.

---

## 7. 🟡 Audit Log — Cần Thêm Event Types

**Nguồn:** Business_Logic_Gaps_Admin.md — Mục 5

**Trạng thái:** ❌ **Chưa triển khai**

**Kiểm tra codebase:** `api/src/modules/auth/services/audit.service.ts`
- `AuditAction` type hiện tại: `CREATE_SYLLABUS`, `UPDATE_SYLLABUS`, `APPROVE_SYLLABUS`, `ACTIVATE_SYLLABUS`, `DEACTIVATE_SYLLABUS`, `DELETE_SYLLABUS`, `UPLOAD_DOCUMENT`, `DELETE_DOCUMENT`, `DISABLE_LECTURER`, `ENABLE_LECTURER`, `CREATE_LECTURER`.
- **Thiếu:** `RESET_LECTURER_PASSWORD`, `UPDATE_LECTURER`, `LOGIN`.

---

## Tổng Quan Mức Độ

| Priority | Chức năng | Trạng thái | Nỗ lực | Ghi chú |
|----------|-----------|------------|--------|---------|
| 🔴 P0 | Tạo teacher chỉ email + unify UI + password gửi email | ✅ Đã triển khai | ~0.75 ngày | Gom #1 cũ + #8 cũ |
| 🔴 P0 | Admin reset password teacher | ❌ Chưa làm | ~1 ngày | Backend mới + email template + audit + UI |
| 🔴 P0 | Backend test coverage | ❌ Chưa làm | ⏳ Xử lý sau | — |
| 🟡 P2 | Frontend: error/not-found/loading pages | ❌ Chưa làm | ~0.5 ngày | Tạo file tại mỗi portal layout |
| 🟡 P2 | Frontend: sidebar + breadcrumb + chat page | ❌ Chưa làm | ~1 ngày | Student layout refactor + breadcrumb |
| 🟡 P2 | Frontend: teacher document batch upload | ❌ Chưa làm | ~0.5 ngày | Upload modal multi-file |
| 🟡 P2 | Admin dashboard bổ sung teacher stats | ❌ Chưa làm | ~0.5 ngày | Backend service + Frontend card |
| 🟡 P2 | Audit log thêm event types | ❌ Chưa làm | ~0.25 ngày | Update type + ghi khi có action mới |

---

*Report tổng hợp từ QA_Final_Report.md và Business_Logic_Gaps_Admin.md — 2026-07-13. Đã kiểm tra codebase lần cuối 2026-07-13.*

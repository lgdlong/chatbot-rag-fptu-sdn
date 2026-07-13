# Danh Sách Chức Năng Mới Cần Thêm

> **Ngày**: 2026-07-13
> **Nguồn**: Tổng hợp từ `QA_Final_Report.md` và `Business_Logic_Gaps_Admin.md`
> **Cập nhật lần cuối**: 2026-07-13

---

## 1. 🔴 Tạo Teacher — Chỉ Nhập Email + Password Gửi Email (Ko Lưu Plaintext) + Unify UI

**Nguồn:** Business_Logic_Gaps_Admin.md — Mục 1 + Mục 6

**Trạng thái:** ✅ **Đã triển khai**

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

**Trạng thái:** ✅ **Đã triển khai**

| File | Thay đổi |
|------|----------|
| `api/src/modules/auth/services/lecturer-admin.service.ts` | Thêm `resetLecturerPassword(userId, adminUserId)` — validate LECTURER, gen 16-char password, `setUserPassword()`, email, audit log `RESET_LECTURER_PASSWORD`. |
| `api/src/modules/auth/lecturer-admin.controller.ts` | Thêm route `POST /api/admin/reset-lecturer-password/:userId` với `requireAdmin`. |
| `api/src/modules/auth/services/email.service.ts` | Thêm `templatePasswordResetByAdmin()` — HTML template riêng cho admin reset password. |
| `web/lib/api.ts` | Thêm `resetLecturerPassword(userId)` → API call. |
| `web/app/superadmin/admins/[id]/page.tsx` | Thêm nút "Cấp lại mật khẩu" + confirm modal. |
| `web/app/superadmin/admins/page.tsx` | Thêm action icon reset trong table row cho LECTURER. |

---

## 3. ❌ BACKEND TEST COVERAGE

**Nguồn:** QA_Final_Report.md — Mục IV.2

**Trạng thái:** ❌ **Chưa triển khai** (⏳ User note: xử lý sau)

- 1 file test duy nhất: `email.service.test.ts`
- Không có unit test cho services
- Không có integration test cho API endpoints
- Không có E2E test

---

## 4. ⚠️ FRONTEND: THIẾU NEXT.JS BEST PRACTICES

**Nguồn:** QA_Final_Report.md — Mục IV.5

**Trạng thái:** ✅ **Đã triển khai**

9 files created (error.tsx + not-found.tsx + loading.tsx × 3 portals):
- `web/app/student/error.tsx`, `not-found.tsx`, `loading.tsx`
- `web/app/teacher/error.tsx`, `not-found.tsx`, `loading.tsx`
- `web/app/superadmin/error.tsx`, `not-found.tsx`, `loading.tsx`

---

## 5. ⚠️ FRONTEND: UI/UX GAPS

**Nguồn:** QA_Final_Report.md — Mục IV.6

| Mục | Trạng thái | Ghi chú |
|-----|-----------|---------|
| Student layout sidebar | 🗑️ **Đã xoá** | User yêu cầu restore về bản gốc (header-only) |
| Breadcrumb syllabus page | 🗑️ **Đã xoá** | User yêu cầu xoá do UI xấu |
| Student standalone chat page | 🗑️ **Không làm** | User quyết định ko làm |
| Teacher document batch upload | ✅ **Đã triển khai** | Multi-file dropzone, sequential upload, per-file status |

---

## 6. 🟡 Admin Dashboard — Thiếu Thông Tin Teacher

**Nguồn:** Business_Logic_Gaps_Admin.md — Mục 4

**Trạng thái:** ✅ **Đã triển khai**

| File | Thay đổi |
|------|----------|
| `api/src/modules/admin/admin.service.ts` | Thêm `getTeacherStats()` — totalLecturers, activeLastWeek, unsyncedSyllabuses, topTeachers (top 5). |
| `api/src/modules/admin/admin.controller.ts` | Thêm route `GET /api/admin/stats/teachers`. |
| `web/lib/api.ts` | Thêm `TeacherStats` type + `getTeacherStats()`. |
| `web/app/superadmin/page.tsx` | Thêm 4 card thống kê giảng viên (tổng, active 7 ngày, chưa đồng bộ, xếp hạng top 5). |

---

## 7. 🟡 Audit Log — Cần Thêm Event Types

**Nguồn:** Business_Logic_Gaps_Admin.md — Mục 5

**Trạng thái:** ✅ **Đã triển khai**

`api/src/modules/auth/services/audit.service.ts`:
- Thêm `RESET_LECTURER_PASSWORD`, `UPDATE_LECTURER`, `LOGIN` vào `AuditAction` type
- Thêm `Session` vào `AuditEntityType`

---

## 8. 🟢 Các Tính Năng Bổ Sung Ngoài Kế Hoạch

| Tính năng | Mô tả |
|-----------|-------|
| Upload DOCX/PPTX/TXT/MD | Mở rộng từ PDF-only sang đa định dạng. Backend: `detectFileType()` với magic bytes + extension. Frontend: accept attribute, validation, icon. |
| Pagination document manager | `GET /api/syllabus/documents/all?page=&limit=` + frontend `PAGE_SIZE=20`. |
| All-documents API | `DocumentRepository.findAllWithCourse()` — query all docs + include syllabus/course. |
| Validate filename special chars | Regex loại bỏ `& % # + = @ $ ;` cả backend + frontend. |
| Upload limit error fix | 10-document limit hiện như validation alert, ko console.error, reset state clean. |

---

## Tổng Quan Mức Độ

| Priority | Chức năng | Trạng thái | Ghi chú |
|----------|-----------|------------|---------|
| 🔴 P0 | Tạo teacher chỉ email + unify UI + password gửi email | ✅ Đã triển khai | Gom #1 cũ + #8 cũ |
| 🔴 P0 | Admin reset password teacher | ✅ Đã triển khai | Backend + frontend + email + audit |
| 🔴 P0 | Backend test coverage | ❌ Chưa làm | ⏳ Xử lý sau |
| 🟡 P2 | Frontend: error/not-found/loading pages | ✅ Đã triển khai | 9 files, 3 portals |
| 🟡 P2 | Student sidebar | 🗑️ Đã xoá | User yêu cầu restore |
| 🟡 P2 | Breadcrumb syllabus page | 🗑️ Đã xoá | User yêu cầu xoá |
| 🟡 P2 | Student standalone chat page | 🗑️ Không làm | User quyết định ko làm |
| 🟡 P2 | Teacher document batch upload | ✅ Đã triển khai | Multi-file dropzone |
| 🟡 P2 | Upload DOCX/PPTX/TXT/MD | ✅ Đã triển khai | Mở rộng từ PDF-only |
| 🟡 P2 | Pagination document manager | ✅ Đã triển khai | 20/page |
| 🟡 P2 | Admin dashboard teacher stats | ✅ Đã triển khai | backend + frontend |
| 🟡 P2 | Audit log event types | ✅ Đã triển khai | `RESET_LECTURER_PASSWORD`, `UPDATE_LECTURER`, `LOGIN` |
| 🟡 P2 | Validate filename special chars | ✅ Đã triển khai | backend sanitize + frontend check |
| 🟢 P3 | Unify create lecturer UI | ✅ Đã triển khai | Gom vào #1 |

---

*Report tổng hợp từ QA_Final_Report.md và Business_Logic_Gaps_Admin.md — 2026-07-13.*

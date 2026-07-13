# Phase 1: Cleanup — Xoá Flow Đăng Ký Lecturer Cũ

**Plan:** [plan-admin-create-lecturer.md](./plan-admin-create-lecturer.md)  
**Ngày:** 2026-07-11  
**Priority:** HIGH  
**Status:** PENDING  

## Mục tiêu

Xoá toàn bộ flow lecturer tự đăng ký + admin duyệt. Bao gồm frontend, backend, và DB.

## Files Thay Đổi

### Xoá
| File | Lý do |
|------|-------|
| `web/app/register-teacher/page.tsx` | Trang lecturer tự đăng ký không còn dùng |
| `api/src/modules/auth/lecturer-request.controller.ts` | Controller POST/GET lecturer-request không còn dùng |

### Sửa
| File | Thay đổi |
|------|----------|
| `api/prisma/schema.prisma` | Xoá `model LecturerRequest` (line ~310-322) |
| `api/src/index.ts` | Xoá import + route của `lecturerRequestRouter` |
| `web/lib/auth-client.ts` | Xoá `LecturerRequest`, `LecturerRequestListResponse`, `ApproveRequestResponse`, `SubmitLecturerRequestPayload`, `SubmitLecturerRequestResponse` interfaces |
| `web/app/superadmin/lecturer-requests/page.tsx` | **Xoá file** (trang admin duyệt lecturer không cần nữa) |
| `web/app/superadmin/page.tsx` | Xoá link/nav đến trang lecturer-requests |
| `web/app/login/page.tsx` | Xoá link "Đăng ký giảng viên" (nếu có) |

### Migration
| Lệnh | Mục đích |
|------|----------|
| `npx prisma db push --schema=prisma/schema.prisma` | Xoá bảng `lecturer_requests` khỏi DB |
| `npx prisma generate --schema=prisma/schema.prisma` | Cập nhật Prisma client |

## Implementation Steps

1. Read `api/src/index.ts` — tìm dòng mount `lecturerRequestRouter`, xoá import + route
2. Xoá file `api/src/modules/auth/lecturer-request.controller.ts`
3. Xoá file `web/app/register-teacher/page.tsx`
4. Xoá file `web/app/superadmin/lecturer-requests/page.tsx`
5. Read `api/prisma/schema.prisma` — xoá `model LecturerRequest` + bảng liên quan
6. Read `web/lib/auth-client.ts` — xoá các interfaces lecturer-related
7. Read `web/app/superadmin/page.tsx` — xoá link/nav đến lecturer-requests
8. Read `web/app/login/page.tsx` — xoá link "Đăng ký giảng viên"
9. Run `npx prisma db push` + `npx prisma generate`
10. Build check — đảm bảo không có tham chiếu mồ côi

## Success Criteria

- `npm run build` (api/) không lỗi mới (chỉ còn lỗi pre-existing Prisma password field)
- `npm run build` (web/) không lỗi
- Không còn file nào import `lecturer-request.controller`, `LecturerRequest` interface cũ

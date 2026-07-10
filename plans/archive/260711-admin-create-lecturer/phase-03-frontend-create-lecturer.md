# Phase 3: Frontend — Trang Admin Tạo Lecturer

**Plan:** [plan-admin-create-lecturer.md](./plan-admin-create-lecturer.md)  
**Ngày:** 2026-07-11  
**Priority:** HIGH  
**Status:** PENDING  

## Mục tiêu

Thêm trang trong superadmin dashboard: form nhập tên + email → gọi API tạo tài khoản → hiển thị credentials.

## Files Thay Đổi

### Thêm
| File | Nội dung |
|------|----------|
| `web/app/superadmin/create-lecturer/page.tsx` | Form tạo lecturer + modal hiện credentials |

### Sửa
| File | Thay đổi |
|------|----------|
| `web/app/superadmin/page.tsx` | Thêm link/nav "Tạo tài khoản giảng viên" (nếu cần) |
| `web/lib/api.ts` | Thêm `createLecturer()` function |

## UI Components (dùng Mantine)

- Title: "Tạo tài khoản Giảng viên"
- Form: TextInput (Họ tên) + TextInput (Email) + Button "Tạo tài khoản"
- Modal sau khi tạo thành công: hiển thị email + mật khẩu tạm + nút copy
- Same style như các trang superadmin khác (#1A3A5C, #F37021, Mantine components)

## Implementation Steps

1. Thêm `createLecturer()` vào `web/lib/api.ts` — POST đến `/api/admin/create-lecturer`
2. Tạo `web/app/superadmin/create-lecturer/page.tsx`
   - UI: Card, Title, TextInput (name), TextInput (email), Button
   - Logic: validate → `createLecturer()` → hiển thị Modal credentials
3. Cập nhật `web/app/superadmin/page.tsx` — thêm link vào danh sách link admin
4. Build check

## Success Criteria

- Trang `/superadmin/create-lecturer` hiển thị form đẹp
- Submit thành công → modal hiện email + password
- Copy button hoạt động
- Build không lỗi

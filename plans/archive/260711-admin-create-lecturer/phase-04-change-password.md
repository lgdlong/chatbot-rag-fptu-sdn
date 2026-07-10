# Phase 4: Frontend — Trang Đổi Mật Khẩu Cho Teacher

**Plan:** [plan-admin-create-lecturer.md](./plan-admin-create-lecturer.md)  
**Ngày:** 2026-07-11  
**Priority:** MEDIUM  
**Status:** PENDING  

## Mục tiêu

Thêm form "Đổi mật khẩu" vào trang chủ teacher dashboard. Lecturer đăng nhập lần đầu → tự đổi mật khẩu.

## Logic

- Dùng `authClient.changePassword()` của Better Auth
- Form: PasswordInput (mật khẩu hiện tại) + PasswordInput (mật khẩu mới) + PasswordInput (xác nhận)
- Validate: mật khẩu mới ≥ 8 ký tự, khớp xác nhận

## Files Thay Đổi

### Sửa
| File | Thay đổi |
|------|----------|
| `web/app/teacher/page.tsx` | Thêm section/component "Đổi mật khẩu" |
| `web/lib/auth-client.ts` | (Không cần sửa — `authClient.changePassword` có sẵn) |

## UI Components

- Card "Đổi mật khẩu" ở cuối trang teacher dashboard
- 3 PasswordInput fields (current, new, confirm)
- Button "Đổi mật khẩu" màu #F37021
- Notification thành công / lỗi

## Implementation Steps

1. Kiểm tra `authClient.changePassword()` có sẵn (Better Auth client)
2. Sửa `web/app/teacher/page.tsx` — thêm section đổi mật khẩu
3. Thêm form, validation, gọi API
4. Build check

## Success Criteria

- Teacher có thể đổi mật khẩu từ dashboard
- Validation hoạt động (min 8 chars, confirm match)
- Sau khi đổi thành công → thông báo, tự clear form
- Build không lỗi

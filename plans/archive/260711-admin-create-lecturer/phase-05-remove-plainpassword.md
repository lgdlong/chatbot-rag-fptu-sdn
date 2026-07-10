# Phase 5: Security — Xoá plainPassword

**Plan:** [plan-admin-create-lecturer.md](./plan-admin-create-lecturer.md)  
**Ngày:** 2026-07-11  
**Priority:** HIGH  
**Status:** PENDING  

## Mục tiêu

Xoá `plainPassword` custom field khỏi Better Auth config. Sau Phase 2, không còn ai dùng `plainPassword` nữa.

## Files Thay Đổi

### Sửa
| File | Thay đổi |
|------|----------|
| `api/src/modules/auth/auth.ts` | Xoá `additionalFields: { plainPassword: {...} }` (line 22-28) |
| `web/lib/auth-client.ts` | Xoá `inferAdditionalFields({ user: { plainPassword: {...} } })` (lines 19-25) |

## Implementation Steps

1. Sửa `auth.ts` — xoá `user.additionalFields` block
2. Sửa `auth-client.ts` — xoá `inferAdditionalFields` import + config
3. (Optional) DB migration để xoá cột `plain_password` trong bảng User
4. Build check

## Success Criteria

- `plainPassword` không còn xuất hiện ở bất kỳ file TS/TSX nào
- Build không lỗi
- Better Auth vẫn hoạt động bình thường (password vẫn được hash)

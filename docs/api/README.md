# Hướng Dẫn Tích Hợp API

Tài liệu trong `docs/api/` là lớp tham chiếu kỹ thuật cho backend hiện tại. Nó không thay thế `docs/srs/`, và không phải nơi định nghĩa business scope chính thức.

---

## Source Of Truth

> [!IMPORTANT]
> Về product scope, role model và feature list, luôn ưu tiên [../srs/README.md](../srs/README.md).
> `docs/api/` chỉ dùng để đọc chi tiết endpoint, auth mechanism và format request/response.

---

## Các Module Hiện Có

### [00_auth.md](./00_auth.md)

- Better Auth
- sign up / sign in / sign out
- session handling

### [00_system.md](./00_system.md)

- health check
- system diagnostics

### [00_documents.md](./00_documents.md)

- upload PDF
- document processing status
- internal processing callback

### [00_chat.md](./00_chat.md)

- chat session lifecycle
- SSE response
- course-scoped chat behavior

---

## Các Module Đã Loại Khỏi Scope Chính Thức

- lecturer request / lecturer approval flow
- payment / subscription flow

Các tài liệu API tương ứng đã được gỡ khỏi `docs/api/` để tránh team đọc nhầm scope.

---

## Thông Tin Cơ Bản

- Base URL local: `http://localhost:8000`
- Content type mặc định: `application/json`
- SSE chat: `text/event-stream`
- Upload file: `multipart/form-data`

---

## Cơ Chế Xác Thực

### Better Auth session

- dùng cho `STUDENT`, `LECTURER`, `ADMIN`
- trình duyệt gửi cookie `better-auth.session_token`

### Internal bearer token

- dùng cho callback nội bộ
- header: `Authorization: Bearer <INTERNAL_API_KEY>`

---

## Error Format Chuẩn

```json
{
  "error": "Mô tả lỗi"
}
```

Mã lỗi thường gặp:

- `400` dữ liệu đầu vào không hợp lệ
- `401` chưa đăng nhập hoặc session hết hạn
- `403` không đủ quyền
- `404` không tìm thấy tài nguyên
- `409` xung đột trạng thái
- `500` lỗi hệ thống

---

## Tài Liệu Liên Quan

- [api_reference.md](./api_reference.md)
- [agent-instructions.md](./agent-instructions.md)
- [quality-checklist.md](./quality-checklist.md)
- [writing-guidelines.md](./writing-guidelines.md)
- [file-templates.md](./file-templates.md)


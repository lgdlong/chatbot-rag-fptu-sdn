# Hướng Dẫn Tích Hợp API

> Status: Current
> Audience: Developer
> Canonical: Yes — API reference
> Owner: Technical
>

Tài liệu trong `docs/api/` là lớp tham chiếu kỹ thuật cho backend hiện tại. Nó không thay thế `docs/srs/`, và không phải nơi định nghĩa business scope chính thức.

---

## Source Of Truth

> [!IMPORTANT]
> Về product scope, role model và feature list, luôn ưu tiên [../srs/README.md](../srs/README.md).
> `docs/api/` chỉ dùng để đọc chi tiết endpoint, auth mechanism và format request/response.

---

## Các Module Hiện Có

### [00_auth.md](./00_auth.md)

- Xác thực tài khoản qua Better Auth (đăng ký, đăng nhập email/mật khẩu, OAuth)
- Quản lý phiên hoạt động & tài khoản
- Phân hệ quản lý Whitelist Email (ADMIN)

### [00_system.md](./00_system.md)

- Sức khỏe hệ thống & kết nối DB / AnythingLLM
- Thống kê Uptime, RAM và CPU Platform

### [00_courses.md](./00_courses.md)

- Danh mục quản lý Môn học (Courses)
- Đồng bộ đổi tên/xóa workspace AnythingLLM

### [00_curriculum.md](./00_curriculum.md)

- Quản lý Ngành học (Major) & Chuyên ngành hẹp (Specialization)
- Khung chương trình đào tạo (Curriculum) & gán môn học

### [00_syllabus.md](./00_syllabus.md)

- Quản lý Đề cương môn học (Syllabus)
- Cấu trúc 8 bảng dữ liệu con chi tiết
- Ràng buộc tổng trọng số đánh giá bằng 100%
- Vòng đời kích hoạt và tự động ngưng bản ghi cũ

### [00_documents.md](./00_documents.md)

- Upload slide PDF theo Syllabus (hạn mức 50MB, tối đa 10 tệp/môn học)
- Gọi tiến trình lập chỉ mục Vector DB AnythingLLM
- Webhook nhận callback đồng bộ trong nền

### [00_chat.md](./00_chat.md)

- Khởi tạo session chat với cấu hình Scope đa dạng
- Gửi tin nhắn và streaming SSE kết hợp trích dẫn RAG
- Quản lý hạn mức tin nhắn tối đa 100 tin/phòng
- Edge case ẩn trích dẫn slide đã bị xóa khỏi DB

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


# API Documentation - Quality Checklist (Chatbot RAG FPTU)

Bảng tiêu chuẩn kiểm soát chất lượng nhằm đảm bảo tài liệu API luôn chính xác, đầy đủ và đồng bộ với mã nguồn xử lý thực tế.

---

## 🎯 Trước Khi Cập Nhật Tài Liệu

### 1. Tính Đầy Đủ (Content Completeness)

- [ ] **Mọi endpoint đều được ghi nhận**
  - Khai báo đầy đủ các phương thức HTTP (GET, POST, PATCH, DELETE).
  - Không bỏ sót bất kỳ path parameter nào (ví dụ: `:courseId`, `:sessionId`).

- [ ] **Mô tả chi tiết các trường dữ liệu**
  - Ghi rõ kiểu dữ liệu, bắt buộc hay tùy chọn.
  - Các tham số Query Parameters được mô tả rõ ràng.
  - Ghi nhận đầy đủ Request Headers đặc thù (như `Authorization: Bearer <token>`, `x-tenant-id`).

- [ ] **Xác nhận cấu trúc Response rõ ràng**
  - Response thành công kèm định dạng dữ liệu đầy đủ.
  - Response lỗi đính kèm đúng mã trạng thái HTTP (400, 401, 403, 404, 409, 500).

- [ ] **Bao quát các cơ chế đặc biệt**
  - Đặc tả định dạng truyền luồng SSE (`text/event-stream`) với các loại sự kiện (`message`, `citations`, `error`).
  - Đặc tả dữ liệu đính kèm nguồn slide giảng dạy (`citations`) bao gồm cơ chế đánh dấu `isDeleted`.

---

### 2. Định Dạng & Trình Bày (Structure & Formatting)

- [ ] **Phân tách tệp tin khoa học**
  - Tài liệu chi tiết được tổ chức theo các module còn nằm trong scope chính thức: `00_auth.md`, `00_system.md`, `00_documents.md`, `00_chat.md`.

- [ ] **Liên kết hoạt động tốt (No Broken Links)**
  - Tất cả các liên kết nội bộ sử dụng relative path đều hoạt động chính xác.
  - Các liên kết đến mã nguồn Hono/Prisma chỉ chính xác dòng code.

- [ ] **Bảng biểu căn chỉnh đẹp mắt**
  - Dùng dấu tick biểu thị trực quan: ✅ (Bắt buộc) và ❌ (Không bắt buộc / Tùy chọn).

- [ ] **Không có nội dung giữ chỗ (No Placeholders)**
  - Tuyệt đối không chứa các từ khóa `"TODO"`, `"TBD"`, `"..."`.
  - Tất cả các ví dụ JSON, cURL đều hoàn chỉnh, có thể copy-paste chạy ngay.

---

### 3. Tính Chính Xác (Accuracy & Realism)

- [ ] **Đã thử nghiệm thực tế (Tested against API)**
  - Request body và Response JSON khớp hoàn toàn với kết quả trả về của Hono server trên môi trường local.
  - Các trường dữ liệu (ví dụ: `courseId` thay vì `course_id`) phải trùng khớp với Prisma schema.

- [ ] **Sử dụng dữ liệu thực tế (Realistic Examples)**
  - Không sử dụng các giá trị ví dụ vô nghĩa như `foo`, `bar`, `test`.
  - Sử dụng mã môn học thật (`SWD392`), định dạng file PDF thật (`Chapter_1.pdf`), email FPT thật (`student-test@fpt.edu.vn`).

---

## ❌ Các Lỗi Phổ Biến Cần Tránh (Common Mistakes)

### 1. Nội dung mẫu rỗng hoặc giữ chỗ
* **❌ Sai:** Mô tả chung chung `"Mô tả parameter"`.
* **✅ Đúng:** Giải thích chi tiết `"Mã định danh môn học được sinh tự động bằng UUID trong hệ thống"`.

### 2. Bỏ qua các trường hợp lỗi
* **❌ Sai:** Chỉ cung cấp ví dụ khi gọi API thành công `200 OK`.
* **✅ Đúng:** Cung cấp đầy đủ cấu trúc JSON lỗi `400 Validation`, `401 Unauthorized`, `403 Forbidden`.

### 3. Ví dụ cURL thiếu headers cần thiết
* **❌ Sai:** `curl -X POST /api/chat/send`
* **✅ Đúng:** Cung cấp cổng server, Content-Type, Session cookie đính kèm:
  ```bash
  curl -X POST http://localhost:8000/api/chat/send \
    -H "Content-Type: application/json" \
    -H "Cookie: better-auth.session_token=YOUR_SESSION_COOKIE" \
    -d '{"sessionId": "session-123", "message": "SOLID là gì?"}'
  ```

---

## 📏 Giới Hạn Kích Thước Tệp Tin (File Size Limits)

- **Độ dài tối đa của một tệp tài liệu:** **800 dòng (lines)**.
- **Quy tắc phân tách:** Nếu một tệp tài liệu chi tiết vượt quá 800 dòng, AI Agent **bắt buộc** phải phân tách thành các tệp tin con và liên kết qua trang mục lục chính.

---

## 🏥 Tiêu chuẩn đặc tả theo từng phân hệ API của dự án

### 0. Phân hệ Xác thực & Tổ chức (`00_auth.md`)
- Phải đặc tả luồng SignUp, SignIn bằng Email/Mật khẩu và domain được phép (`@fpt.edu.vn`, `@gmail.com`).
- Phải làm rõ luồng phân quyền theo vai trò người dùng trong bối cảnh đơn trường.

### 1. Module Tài Liệu & Ingestion (`00_documents.md`)
- Phải ghi nhận giới hạn dung lượng tải file PDF **dưới 50MB**.
- Phải ghi nhận webhook nội bộ sử dụng `INTERNAL_API_KEY` xác thực.
- Phải chỉ rõ trạng thái tài liệu (`PENDING`, `PROCESSING`, `SUCCESS`, `FAILED`).

### 2. Phân Hệ Trò Chuyện (`00_chat.md`)
- Phải ghi nhận định dạng truyền luồng SSE `text/event-stream`.
- Phải đặc tả cấu trúc `citations` nguồn bài giảng gồm slide ảnh trích dẫn, trang slide số mấy và trạng thái xóa slide.
- Phải làm rõ phạm vi chat theo môn học và các lỗi quyền truy cập phiên chat.

### 3. Scope Alignment
- Không viết hoặc khôi phục tài liệu cho `lecturer request` hoặc `subscription/payment` nếu chưa có quyết định scope mới.

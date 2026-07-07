# API Đặc Tả: Quản Lý Môn Học (Courses)

Phân hệ này cho phép Giảng viên (Lecturer) và Quản trị viên (Admin) quản lý thông tin các môn học (Courses/Subjects) trong hệ thống. Cấu hình và hoạt động thực tế tại `rag.controller.ts` được mount trên prefix `/api/courses`.

---

## 🔐 Cơ Chế Xác Thực (Authentication)
- **Xem danh sách môn học:** Yêu cầu đăng nhập tài khoản bất kỳ (Sinh viên, Giảng viên hoặc Admin) thông qua Session Cookie từ Better Auth (`better-auth.session_token`).
- **Thêm, sửa, xóa môn học:** Yêu cầu đăng nhập tài khoản Giảng viên (`LECTURER`) hoặc Quản trị viên (`ADMIN`).

---

## 📂 Các Endpoint Đặc Tả

### 1. Lấy danh sách môn học kèm số lượng tài liệu
`GET /api/courses`

*   **Mô tả:** Trả về danh sách tất cả các môn học hiện có trong hệ thống, bao gồm tổng số lượng tài liệu (slides bài giảng) được nạp thành công ở tất cả các syllabus thuộc môn học đó.
*   **Xác thực:** ✅ Có yêu cầu (Session Cookie Better Auth).
*   **Ví dụ Response (200 OK):**
    ```json
    {
      "courses": [
        {
          "id": "course-uuid-1",
          "code": "SWD392",
          "name": "Software Architecture and Design",
          "createdAt": "2026-05-27T16:38:00.000Z",
          "documentCount": 3
        }
      ]
    }
    ```

---

### 2. Thêm môn học mới
`POST /api/courses`

*   **Mô tả:** Tạo một môn học mới trong hệ thống. Môn học mới được tạo ban đầu chưa có Syllabus hay workspace trên AnythingLLM.
*   **Xác thực:** ✅ Có yêu cầu (Giảng viên hoặc Admin Session Cookie).
*   **Request Body (JSON):**
    *   `code` (string, bắt buộc): Mã môn học (ví dụ: `"SWD392"`). Tự động chuyển thành chữ in hoa và cắt khoảng trắng thừa.
    *   `name` (string, bắt buộc): Tên môn học (ví dụ: `"Software Architecture and Design"`).
*   **Ví dụ JSON Request Body:**
    ```json
    {
      "code": "swd392",
      "name": "Software Architecture and Design"
    }
    ```
*   **Ví dụ Response (201 Created):**
    ```json
    {
      "course": {
        "id": "course-uuid-1",
        "code": "SWD392",
        "name": "Software Architecture and Design",
        "createdAt": "2026-07-03T15:00:00.000Z",
        "documentCount": 0
      }
    }
    ```
*   **Ví dụ Response lỗi trùng mã môn học (409 Conflict):**
    ```json
    {
      "error": "Course code already exists"
    }
    ```

---

### 3. Cập nhật thông tin môn học
`PATCH /api/courses/{courseId}`

*   **Mô tả:** Chỉnh sửa mã môn học hoặc tên môn học.
*   **Cơ chế đồng bộ RAG (Sync rename workspace):** Nếu mã môn học (`code`) thay đổi, hệ thống sẽ tự động gọi API AnythingLLM để đổi tên tất cả các workspaces hiện có của các đề cương thuộc môn học này theo định dạng mới: `{new_code_lower}_{syllabus_id}`.
*   **Xác thực:** ✅ Có yêu cầu (Giảng viên hoặc Admin Session Cookie).
*   **Path Parameters:**
    *   `courseId` (string, bắt buộc): ID duy nhất của môn học cần chỉnh sửa.
*   **Request Body (JSON):**
    *   `code` (string, bắt buộc): Mã môn học mới.
    *   `name` (string, bắt buộc): Tên môn học mới.
*   **Ví dụ Response (200 OK):**
    ```json
    {
      "course": {
        "id": "course-uuid-1",
        "code": "SWD392_NEW",
        "name": "Software Architecture and Design (Updated)",
        "createdAt": "2026-05-27T16:38:00.000Z",
        "documentCount": 3
      }
    }
    ```

---

### 4. Xóa môn học
`DELETE /api/courses/{courseId}`

*   **Mô tả:** Xóa vĩnh viễn môn học khỏi hệ thống.
*   **Các Ràng buộc & Edge Cases:**
    *   **Ràng buộc tài liệu:** Không thể xóa môn học nếu vẫn còn tài liệu (Document) đính kèm trong bất kỳ syllabus nào của môn học đó. Giảng viên bắt buộc phải xóa toàn bộ tài liệu trước (trả về `409 Conflict`).
    *   **Đồng bộ RAG:** Hệ thống sẽ tự động gửi yêu cầu xóa các workspace tương ứng với môn học này trên AnythingLLM trước khi thực thi xóa môn học trong database PostgreSQL.
*   **Xác thực:** ✅ Có yêu cầu (Giảng viên hoặc Admin Session Cookie).
*   **Path Parameters:**
    *   `courseId` (string, bắt buộc): ID môn học cần xóa.
*   **Ví dụ Response (200 OK):**
    ```json
    {
      "success": true
    }
    ```
*   **Ví dụ Response lỗi còn tài liệu (409 Conflict):**
    ```json
    {
      "error": "Course still has documents within its syllabuses. Delete all documents before removing the course."
    }
    ```

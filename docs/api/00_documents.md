# API Đặc Tả: Quản Lý Tài Liệu & RAG Ingestion

Phân hệ này dành riêng cho Giảng viên (Lecturer) và Quản trị viên (Admin) quản lý slides bài giảng, giáo trình môn học dưới dạng PDF, liên kết theo từng Đề cương môn học (Syllabus), kích hoạt tiến trình nạp dữ liệu (RAG Ingestion) vào Vector DB để phục vụ chatbot.

---

## 🔐 Cơ Chế Xác Thực (Authentication)
- **Truy vấn, Tải lên & Xóa tài liệu:** Yêu cầu đăng nhập tài khoản Giảng viên (`LECTURER`) hoặc Quản trị viên (`ADMIN`) thông qua Session Cookie từ Better Auth (`better-auth.session_token`).
- **Webhook nội bộ:** Yêu cầu đính kèm Bearer Token chứa giá trị bí mật `INTERNAL_API_KEY` trong request header.

---

## 📂 Các Endpoint Đặc Tả

### 1. Lấy danh sách tài liệu slide của một Syllabus
`GET /api/syllabus/{syllabusId}/documents`

*   **Mô tả:** Lấy danh sách các tài liệu PDF của một đề cương cụ thể.
*   **Xác thực:** ✅ Có yêu cầu (Session Cookie Better Auth).
*   **Path Parameters:**
    *   `syllabusId` (integer, bắt buộc): ID Đề cương môn học.
*   **Ví dụ Response (200 OK):**
    ```json
    {
      "documents": [
        {
          "id": "doc-456",
          "name": "Chapter_1_Introduction.pdf",
          "fileUrl": "/uploads/1716382025_Chapter_1.pdf",
          "fileType": "pdf",
          "status": "COMPLETED",
          "syllabusId": 12,
          "createdAt": "2026-05-27T16:38:00.000Z"
        }
      ]
    }
    ```

---

### 2. Giảng viên tải lên slide/tài liệu (PDF) cho Đề cương
`POST /api/syllabus/{syllabusId}/documents`

*   **Mô tả:** Tải một tệp tin bài giảng PDF (dung lượng tối đa 50MB theo yêu cầu SRS) lên hệ thống liên kết với một Đề cương (Syllabus) cụ thể.
*   **Các Ràng buộc & Edge Cases:**
    1.  **Định dạng:** Chỉ chấp nhận file PDF (`.pdf`).
    2.  **Dung lượng:** Tối đa 50MB.
    3.  **Hạn mức:** Giới hạn tối đa **10 tài liệu** cho mỗi môn học (Course/Subject) trên toàn bộ các Syllabus của môn học đó. Nếu vượt quá, server trả về lỗi `400 Bad Request`.
*   **Quy trình xử lý (Workflow):**
    1.  Server ghi tệp PDF vào thư mục `./uploads/` trên đĩa cục bộ.
    2.  Tạo bản ghi `Document` trong database PostgreSQL ở trạng thái `PENDING`.
    3.  Tạo bản ghi `IngestionJob` và cập nhật trạng thái tài liệu sang `PROCESSING`.
    4.  Gọi API AnythingLLM ở chế độ non-blocking để tự động khởi tạo Workspace nếu chưa có (theo định dạng slug: `{subject_code}_{syllabus_id}`), tải tệp lên và lập chỉ mục Vector.
    5.  Sau khi hoàn tất, gọi endpoint callback nội bộ để cập nhật trạng thái sang `COMPLETED` (hoặc `FAILED` nếu có lỗi).
*   **Xác thực:** ✅ Có yêu cầu (Session Cookie Better Auth).
*   **Content-Type:** `multipart/form-data`
*   **Path Parameters:**
    *   `syllabusId` (integer, bắt buộc): ID Đề cương môn học.
*   **Request Payload (Multipart Form):**
    *   `file` (file, bắt buộc): Slide bài giảng hoặc giáo trình PDF (dưới 50MB).
*   **Ví dụ Response (200 OK):**
    ```json
    {
      "success": true,
      "document": {
        "id": "doc-456",
        "name": "Chapter_1_Introduction.pdf",
        "status": "PROCESSING"
      }
    }
    ```
*   **Ví dụ Response lỗi vượt quá 10 tài liệu (400 Bad Request):**
    ```json
    {
      "error": "Giới hạn upload tối đa 10 tài liệu cho mỗi môn học đã bị vượt quá."
    }
    ```
*   **Ví dụ Response lỗi sai định dạng (400 Bad Request):**
    ```json
    {
      "error": "Unsupported file format. Please export your slide or document to PDF format before uploading."
    }
    ```

---

### 3. Xóa tài liệu slide giảng dạy khỏi Đề cương
`DELETE /api/syllabus/{syllabusId}/documents/{documentId}`

*   **Mô tả:** Xóa vĩnh viễn tài liệu khỏi hệ thống.
*   **Quy trình xử lý (Workflow):**
    1.  Server kiểm tra quyền giảng viên và trạng thái tài liệu. Nếu đang `PENDING` hoặc `PROCESSING`, API từ chối xóa để tránh xung đột (trả về `409 Conflict`).
    2.  Tiến hành xóa tệp PDF gốc lưu trên đĩa cứng.
    3.  Quét thư mục ảnh chunk `./uploads/chunks/` và xóa toàn bộ các tệp chunk ảnh của tài liệu.
    4.  Xóa bản ghi khỏi database PostgreSQL.
    5.  Đồng bộ xóa tài liệu trong AnythingLLM Workspace (loại bỏ khỏi workspace embeddings và purge khỏi system).
*   **Xác thực:** ✅ Có yêu cầu (Session Cookie Better Auth).
*   **Path Parameters:**
    *   `syllabusId` (integer, bắt buộc): ID Đề cương môn học.
    *   `documentId` (string, bắt buộc): ID tài liệu cần xóa.
*   **Ví dụ Response (200 OK):**
    ```json
    {
      "success": true
    }
    ```

---

### 4. Webhook cập nhật tiến độ Ingestion (Nội bộ)
`PATCH /api/internal/documents/{id}`

*   **Mô tả:** Endpoint nội bộ bảo mật dùng để cập nhật tình trạng xử lý tài liệu (Thành công/Thất bại) về cho API Server sau khi pipeline ingestion trong nền hoàn tất.
*   **Xác thực:** ✅ Có yêu cầu (Bearer Token chứa `INTERNAL_API_KEY` trong header `Authorization`).
*   **Path Parameters:**
    *   `id` (string, bắt buộc): ID tài liệu cần cập nhật trạng thái.
*   **Request Schema (JSON):**
    *   `status` (string, bắt buộc): Trạng thái xử lý mới (`"SUCCESS"` hoặc `"FAILED"`).
    *   `error` (string, tùy chọn): Lý do chi tiết nếu thất bại.
    *   `jobId` (string, tùy chọn): ID của Ingestion Job.
    *   `payload` (object, tùy chọn): Dữ liệu đính kèm bổ sung.
    *   `sourceLocation` (string, tùy chọn): Vị trí lưu trữ tài liệu trong AnythingLLM.
*   **Ví dụ JSON Request Body (Thành công):**
    ```json
    {
      "status": "SUCCESS",
      "sourceLocation": "custom-documents/1716382025_Chapter_1.pdf"
    }
    ```
*   **Ví dụ Response (200 OK):**
    ```json
    {
      "success": true
    }
    ```

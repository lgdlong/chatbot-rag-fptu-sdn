# API Đặc Tả: Phân Hệ Trò Chuyện (Chatbot AI RAG)

Phân hệ này cho phép sinh viên lựa chọn ngữ cảnh môn học hoặc tài liệu, quản lý các phiên hội thoại, lấy lịch sử tin nhắn và gửi câu hỏi để nhận câu trả lời dạng truyền luồng trực tiếp SSE (Server-Sent Events) từ Gemini LLM kết hợp dữ liệu slide bài giảng được trích xuất từ Qdrant Vector DB / AnythingLLM.

---

## 🔐 Cơ Chế Xác Thực (Authentication)
Tất cả các endpoint (trừ dev-login) yêu cầu đăng nhập tài khoản Sinh viên (`STUDENT`) hoặc Giảng viên/Admin thông qua Session Cookie từ Better Auth (`better-auth.session_token`).

---

## 📂 Các Endpoint Đặc Tả

### 1. Đăng nhập nhanh thử nghiệm E2E (Dev Mode)
`POST /api/chat/dev-login`

*   **Mô tả:** Endpoint hỗ trợ môi trường phát triển (Dev Mode). Khi gọi, hệ thống tự động gán session cho tài khoản được yêu cầu (`student`, `lecturer`, hoặc `admin`), thiết lập vai trò, tự tạo seed dữ liệu mẫu trong PostgreSQL và phản hồi đính kèm Cookie Header (`Set-Cookie`) giúp Client đăng nhập tức thì mà không cần qua giao diện Better Auth thông thường.
*   **Request Body (JSON):**
    *   `role` (string, tùy chọn): `"student"` (mặc định), `"lecturer"` hoặc `"admin"`.
*   **Ví dụ Response (200 OK):**
    ```json
    {
      "success": true,
      "user": {
        "id": "user-test-e2e-student-id",
        "name": "Sinh viên E2E Test",
        "email": "student-test@fpt.edu.vn",
        "role": "STUDENT"
      },
      "token": "cryptographic_jwt_session_token"
    }
    ```

---

### 2. Lấy danh sách các môn học
`GET /api/chat/courses`

*   **Mô tả:** Lấy toàn bộ danh sách các môn học hiện có trong hệ thống để người dùng chọn lựa ngữ cảnh hội thoại.
*   **Xác thực:** ✅ Có yêu cầu (Session Cookie Better Auth).
*   **Ví dụ Response (200 OK):**
    ```json
    {
      "courses": [
        {
          "id": "course-123",
          "code": "SWD392",
          "name": "Software Architecture and Design",
          "description": "Môn học thiết kế và kiến trúc phần mềm"
        }
      ]
    }
    ```

---

### 3. Lấy tài liệu slide bài giảng theo môn học
`GET /api/chat/courses/{courseId}/documents`

*   **Mô tả:** Truy xuất danh sách tất cả các tài liệu slide bài giảng PDF của một môn học cụ thể.
*   **Path Parameters:**
    *   `courseId` (string, bắt buộc): ID môn học.
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
          "createdAt": "2026-05-27T16:38:00.000Z"
        }
      ]
    }
    ```

---

### 4. Lấy danh mục tài liệu có thể lựa chọn (Document Catalog)
`GET /api/chat/document-catalog`

*   **Mô tả:** Trả về danh sách môn học kèm theo các tài liệu tương ứng của môn học đó đã được xử lý thành công (`COMPLETED`) để người dùng chọn lọc nguồn dữ liệu ngữ cảnh cụ thể khi chat.
*   **Xác thực:** ✅ Có yêu cầu (Session Cookie Better Auth).
*   **Ví dụ Response (200 OK):**
    ```json
    {
      "groups": [
        {
          "course": {
            "id": "course-123",
            "code": "SWD392",
            "name": "Software Architecture and Design"
          },
          "documents": [
            {
              "id": "doc-456",
              "name": "Chapter_1_Introduction.pdf",
              "fileType": "pdf",
              "status": "COMPLETED",
              "createdAt": "2026-05-27T16:38:00.000Z",
              "selectable": true
            }
          ]
        }
      ],
      "totalCourses": 1,
      "totalDocuments": 1
    }
    ```

---

### 5. Lấy danh sách phiên chat của Sinh viên
`GET /api/chat/sessions`

*   **Mô tả:** Lấy toàn bộ các phiên hội thoại (phòng chat) của người dùng hiện tại, sắp xếp theo thứ tự thời gian tạo mới nhất lên đầu.
*   **Ví dụ Response (200 OK):**
    ```json
    {
      "sessions": [
        {
          "id": "session-789",
          "title": "Hỏi về SOLID principles",
          "userId": "user-123",
          "courseId": "course-123",
          "scopeMode": "SELECTED_COURSES",
          "scopedCourses": [
            {
              "id": "course-123",
              "code": "SWD392",
              "name": "Software Architecture and Design"
            }
          ],
          "scopedDocuments": [],
          "createdAt": "2026-05-27T16:38:00.000Z"
        }
      ]
    }
    ```

---

### 6. Tạo một phiên chat mới với cấu hình Scope
`POST /api/chat/sessions`

*   **Mô tả:** Khởi tạo một cuộc hội thoại mới với phạm vi tìm kiếm RAG mong muốn. Có thể khoanh vùng tìm kiếm trên toàn hệ thống, theo một số môn học cụ thể hoặc theo các tài liệu bài giảng được chỉ định.
*   **Request Body (JSON):**
    *   `scopeMode` (string, tùy chọn): `"ALL_COURSES"` (toàn cục), `"SELECTED_COURSES"` (theo môn), `"SELECTED_DOCUMENTS"` (theo tài liệu cụ thể).
    *   `courseIds` (array of strings, tùy chọn): Danh sách ID môn học khi `scopeMode` là `"SELECTED_COURSES"`.
    *   `documentIds` (array of strings, tùy chọn): Danh sách ID tài liệu khi `scopeMode` là `"SELECTED_DOCUMENTS"`.
    *   `courseId` (string, tùy chọn): Dùng cho API legacy (tương đương với `"SELECTED_COURSES"` có 1 môn học).
*   **Ví dụ JSON Request Body:**
    ```json
    {
      "scopeMode": "SELECTED_DOCUMENTS",
      "documentIds": ["doc-456"]
    }
    ```
*   **Ví dụ Response (200 OK):**
    ```json
    {
      "session": {
        "id": "session-789",
        "title": "Cuộc hội thoại mới",
        "userId": "user-123",
        "scopeMode": "SELECTED_DOCUMENTS",
        "createdAt": "2026-07-03T15:00:00.000Z"
      }
    }
    ```

---

### 7. Chi tiết phiên chat & lịch sử tin nhắn
`GET /api/chat/sessions/{sessionId}`

*   **Mô tả:** Lấy đầy đủ thông tin chi tiết và lịch sử tin nhắn của cuộc hội thoại, kèm nhãn phạm vi truy cập RAG (`scopeLabel`).
*   **Cơ chế bảo vệ UI (Edge Case):** API tự động kiểm tra xem các slide ảnh trích dẫn (`citations`) đi kèm câu trả lời của AI còn tồn tại trong DB không. Nếu slide gốc đã bị giảng viên xóa, API tự động trả về `"isDeleted": true` cho trích dẫn đó để Front-end ẩn liên kết tải ảnh slide.
*   **Path Parameters:**
    *   `sessionId` (string, bắt buộc): ID cuộc hội thoại cần lấy chi tiết.
*   **Ví dụ Response (200 OK):**
    ```json
    {
      "session": {
        "id": "session-789",
        "title": "Hỏi về SOLID principles",
        "userId": "user-123",
        "scopeMode": "SELECTED_COURSES",
        "scopedCourses": [
          {
            "id": "course-123",
            "code": "SWD392",
            "name": "Software Architecture and Design"
          }
        ],
        "scopedDocuments": [],
        "scopeLabel": "SWD392",
        "scopeSummary": "SWD392",
        "createdAt": "2026-05-27T16:38:00.000Z",
        "messages": [
          {
            "id": "msg-1",
            "sender": "USER",
            "content": "SOLID là gì?",
            "createdAt": "2026-05-27T16:38:02.000Z"
          },
          {
            "id": "msg-2",
            "sender": "ASSISTANT",
            "content": "SOLID là 5 nguyên tắc thiết kế hướng đối tượng...",
            "citations": [
              {
                "documentId": "doc-456",
                "documentName": "Chapter_1_Introduction.pdf",
                "page": 3,
                "text": "SOLID principles stand for...",
                "isDeleted": false
              }
            ],
            "createdAt": "2026-05-27T16:38:05.000Z"
          }
        ]
      }
    }
    ```

---

### 8. Đổi tên phiên chat
`PATCH /api/chat/sessions/{sessionId}`

*   **Mô tả:** Cập nhật lại tiêu đề (Title) cho cuộc trò chuyện.
*   **Path Parameters:**
    *   `sessionId` (string, bắt buộc): ID cuộc hội thoại cần đổi tên.
*   **Request Body (JSON):**
    *   `title` (string, bắt buộc): Tiêu đề mới (không được để trống).
*   **Ví dụ Response (200 OK):**
    ```json
    {
      "success": true,
      "session": {
        "id": "session-789",
        "title": "Hỏi về Liskov Substitution",
        "userId": "user-123"
      }
    }
    ```

---

### 9. Xóa phiên chat
`DELETE /api/chat/sessions/{sessionId}`

*   **Mô tả:** Xóa vĩnh viễn phiên chat và toàn bộ lịch sử tin nhắn liên quan khỏi cơ sở dữ liệu.
*   **Path Parameters:**
    *   `sessionId` (string, bắt buộc): ID cuộc hội thoại cần xóa.
*   **Ví dụ Response (200 OK):**
    ```json
    {
      "success": true
    }
    ```

---

### 10. Gửi tin nhắn & truyền luồng câu trả lời (SSE Stream)
`POST /api/chat/send`

*   **Mô tả:** Điểm cuối cốt lõi của cuộc hội thoại:
    1.  **Hạn mức tin nhắn:** Mỗi phòng chat có giới hạn tối đa **100 tin nhắn** theo đặc tả SRS. Nếu vượt quá, server trả về thông báo lỗi dạng event-stream và không gọi AI.
    2.  **Truy vấn RAG:** Dựa vào cấu hình `scope` của Session, hệ thống truy xuất các slide bài giảng phù hợp từ Vector DB / AnythingLLM.
    3.  **Tự động đặt tên phòng chat:** Nếu là tin nhắn đầu tiên của phòng chat, server tự gọi Gemini phụ tóm tắt tin nhắn thành tiêu đề dưới 5 từ và cập nhật tên phòng.
    4.  **Tạo luồng SSE:** Mở luồng kết nối SSE (`text/event-stream`) để truyền luồng câu trả lời từng phần về client.
    5.  **Lưu trữ:** Lưu lại tin nhắn của người dùng và phản hồi kèm trích dẫn nguồn (`citations`) của chatbot.
*   **Xác thực:** ✅ Có yêu cầu (Session Cookie Better Auth).
*   **Content-Type:** `application/json`
*   **Request Body (JSON):**
    *   `sessionId` (string, bắt buộc): ID phiên chat.
    *   `message` (string, bắt buộc): Nội dung câu hỏi.
*   **Ví dụ JSON Request Body:**
    ```json
    {
      "sessionId": "session-789",
      "message": "SOLID là gì?"
    }
    ```
*   **Phản hồi luồng truyền SSE (200 OK - MIME: `text/event-stream`):**
    Server gửi các sự kiện (events) liên tục:
    *   **Sự kiện `message`:** Trả về các phân đoạn chữ của câu trả lời.
        ```text
        event: message
        data: {"chunk":"SOLID "}

        event: message
        data: {"chunk":"là "}
        ```
    *   **Sự kiện `citations`:** Trả về nguồn trích dẫn slide bài giảng khi câu trả lời hoàn tất.
        ```text
        event: citations
        data: {"citations":[{"documentId":"doc-456","documentName":"Chapter_1.pdf","page":3,"text":"SOLID principles...","isDeleted":false}]}
        ```
    *   **Sự kiện `error`:** Trả về nếu gặp sự cố xử lý AI đột ngột.
        ```text
        event: error
        data: "Lỗi kết nối API Gemini"
        ```
*   **Ví dụ Response SSE khi vượt quá hạn mức 100 tin nhắn:**
    ```text
    event: message
    data: {"chunk":"Phiên hội thoại này đã đạt giới hạn tối đa 100 tin nhắn (theo giới hạn quy định của SRS). Vui lòng tạo một phiên hội thoại mới để tiếp tục hỏi đáp."}

    event: citations
    data: {"citations":[]}
    ```

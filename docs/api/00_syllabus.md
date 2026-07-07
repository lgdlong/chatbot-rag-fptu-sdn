# API Đặc Tả: Phân Hệ Đề Cương Môn Học (Syllabus)

Phân hệ này cho phép tìm kiếm, xem chi tiết và quản lý thông tin Đề cương môn học (Syllabus) có cấu trúc phức tạp. Cấu hình thực tế tại `syllabus.controller.ts` được mount trên prefix `/api/syllabus`.

---

## 🔐 Cơ Chế Xác Thực & Phân Quyền
- **Xem thông tin (GET):** Yêu cầu đăng nhập tài khoản. Đối với **Sinh viên (`STUDENT`)**, sinh viên chỉ được phép xem các Syllabus đã được phê duyệt (`isApproved: true`) và đang hoạt động (`isActive: true`).
- **Quản lý đề cương (POST, PUT, PATCH, DELETE):** Chỉ cho phép giảng viên đăng nhập vai trò **`LECTURER`** thực hiện.

---

## 📂 Các Endpoint Đặc Tả

### 1. Tra cứu Đề cương môn học (Fuzzy Search)
`GET /api/syllabus`

*   **Mô tả:** Tìm kiếm danh sách các đề cương môn học trong hệ thống.
*   **Xác thực:** ✅ Có yêu cầu (Session Cookie Better Auth).
*   **Query Parameters:**
    *   `subject_code` (string, tùy chọn): Mã môn học cần tìm kiếm fuzzy (không phân biệt hoa thường).
*   **Ví dụ Response (200 OK):**
    ```json
    {
      "syllabuses": [
        {
          "id": 12,
          "courseId": "course-uuid-1",
          "syllabusName": "Software Architecture and Design Syllabus V1",
          "syllabusNameEnglish": "Syllabus for SWD392",
          "credits": 3,
          "isActive": true,
          "isApproved": true,
          "course": {
            "code": "SWD392",
            "name": "Software Architecture and Design"
          }
        }
      ]
    }
    ```

---

### 2. Xem chi tiết Đề cương môn học cấu trúc
`GET /api/syllabus/{id}`

*   **Mô tả:** Lấy thông tin chi tiết đầy đủ 100% của một đề cương bao gồm các thông số cốt lõi và 8 bảng dữ liệu con liên kết.
*   **Path Parameters:**
    *   `id` (integer, bắt buộc): ID Đề cương môn học.
*   **Ví dụ Response (200 OK):**
    ```json
    {
      "syllabus": {
        "id": 12,
        "courseId": "course-uuid-1",
        "syllabusName": "Software Architecture and Design Syllabus V1",
        "syllabusNameEnglish": "Syllabus for SWD392",
        "credits": 3,
        "prerequisites": "Prerequisite: PRN211",
        "description": "Mô tả đề cương môn học chi tiết...",
        "studentTasks": "Làm bài tập, đi học đầy đủ",
        "tools": "VS Code, Node.js",
        "minAvgMarkToPass": "5.0",
        "decisionNo": "Decision No 1234/QD-FPTU",
        "note": "Lưu ý đề cương",
        "isApproved": true,
        "isActive": true,
        "course": {
          "id": "course-uuid-1",
          "code": "SWD392",
          "name": "Software Architecture and Design"
        },
        "materials": [
          {
            "id": "mat-1",
            "syllabusId": 12,
            "description": "Software Architecture in Practice",
            "author": "Len Bass",
            "publisher": "Addison-Wesley",
            "publishedDate": "2021",
            "edition": "4th Edition",
            "isbn": "978-0136886099",
            "isMainMaterial": true,
            "isHardCopy": false,
            "isOnline": true,
            "note": null
          }
        ],
        "clos": [],
        "schedules": [],
        "questions": [],
        "assessments": [
          {
            "id": "asm-1",
            "syllabusId": 12,
            "category": "Progress Assessment",
            "type": "Assignment",
            "part": 1,
            "weight": "20.0",
            "completionCriteria": ">= 0",
            "duration": "120 mins",
            "clo": "CLO1, CLO2",
            "questionType": "Essay",
            "noQuestion": "1",
            "knowledgeAndSkill": "Design pattern integration",
            "gradingGuide": "Rubrics attached",
            "note": null
          }
        ],
        "references": [],
        "videoLinks": [],
        "documents": []
      }
    }
    ```

---

### 3. Tạo mới Đề cương môn học (Draft)
`POST /api/syllabus`

*   **Mô tả:** Khởi tạo đề cương môn học ban đầu ở trạng thái bản nháp nháp (`isApproved = false`, `isActive = false`).
*   **Xác thực:** ✅ Có yêu cầu (Giảng viên Session Cookie).
*   **Request Body (JSON):**
    *   `id` (integer, bắt buộc): Mã ID của đề cương (phải là số nguyên độc nhất).
    *   `courseId` (string, bắt buộc): ID môn học.
    *   `syllabusName` (string, bắt buộc): Tên đề cương môn học.
    *   `syllabusNameEnglish` (string, tùy chọn): Tên tiếng Anh.
    *   `credits` (number, tùy chọn): Số tín chỉ (mặc định `3`).
    *   `minAvgMarkToPass` (number, tùy chọn): Điểm trung bình tối thiểu để qua môn (mặc định `5.00`).
*   **Ví dụ JSON Request Body:**
    ```json
    {
      "id": 12,
      "courseId": "course-uuid-1",
      "syllabusName": "Software Architecture and Design Syllabus V1",
      "credits": 3
    }
    ```
*   **Ví dụ Response (201 Created):**
    ```json
    {
      "syllabus": {
        "id": 12,
        "courseId": "course-uuid-1",
        "syllabusName": "Software Architecture and Design Syllabus V1",
        "credits": 3,
        "isApproved": false,
        "isActive": false
      }
    }
    ```

---

### 4. Cập nhật chi tiết Đề cương & Ràng buộc trọng số đánh giá
`PUT /api/syllabus/{id}`

*   **Mô tả:** Cập nhật thông tin đề cương môn học và đồng bộ 7 bảng con dữ liệu cấu trúc (Materials, CLOs, Weekly Schedules, Constructive Questions, Assessments, References, Video Links).
*   **Ràng buộc Nghiệp vụ đặc trưng (Business Rules):**
    *   **Trọng số đánh giá (BR-05 & EC-28):** Tổng trọng số (`weight`) của tất cả các bài đánh giá trong mảng `assessments` gửi lên **bắt buộc phải bằng đúng 100%**. Nếu không, server sẽ từ chối cập nhật và trả về lỗi `400 Bad Request`.
*   **Xác thực:** ✅ Có yêu cầu (Giảng viên Session Cookie).
*   **Path Parameters:**
    *   `id` (integer, bắt buộc): ID Đề cương môn học.
*   **Request Body (JSON):**
    Khai báo thông tin cần sửa và các mảng thực thể con liên kết.
*   **Ví dụ JSON Request Body:**
    ```json
    {
      "syllabusName": "Software Architecture and Design Syllabus V1 (Updated)",
      "credits": 3,
      "assessments": [
        {
          "category": "Progress Assessment",
          "type": "Assignment",
          "part": 1,
          "weight": 40.00
        },
        {
          "category": "Final Assessment",
          "type": "Final Exam",
          "part": 1,
          "weight": 60.00
        }
      ]
    }
    ```
*   **Ví dụ Response (200 OK):**
    ```json
    {
      "success": true,
      "syllabus": {
        "id": 12,
        "syllabusName": "Software Architecture and Design Syllabus V1 (Updated)",
        "credits": 3
      }
    }
    ```
*   **Ví dụ Response lỗi trọng số đánh giá không bằng 100% (400 Bad Request):**
    ```json
    {
      "error": "Tổng trọng số đánh giá phải bằng đúng 100%. Hiện tại: 80.00%"
    }
    ```

---

### 5. Phê duyệt Đề cương môn học
`PATCH /api/syllabus/{id}/approve`

*   **Mô tả:** Cho phép giảng viên duyệt đề cương môn học. Sau khi duyệt, đề cương mới được phép kích hoạt (Activate) để áp dụng chính thức.
*   **Xác thực:** ✅ Có yêu cầu (Giảng viên Session Cookie).
*   **Path Parameters:**
    *   `id` (integer, bắt buộc): ID Đề cương môn học.
*   **Ví dụ Response (200 OK):**
    ```json
    {
      "success": true,
      "syllabus": {
        "id": 12,
        "isApproved": true
      }
    }
    ```

---

### 6. Kích hoạt Đề cương môn học & Quản lý vòng đời (Life Cycle)
`PATCH /api/syllabus/{id}/activate`

*   **Mô tả:** Thiết lập đề cương ở trạng thái hoạt động chính thức (`isActive = true`).
*   **Các Quy tắc Vòng đời & Ràng buộc (BR-09 & BR-10 & EC-25 & EC-26):**
    1.  **Điều kiện duyệt trước:** Đề cương phải được phê duyệt trước (`isApproved = true`) mới được kích hoạt. Nếu chưa duyệt, trả về lỗi `400 Bad Request`.
    2.  **Cơ chế chuyển giao tự động (Auto-deactivate):** Một môn học tại một thời điểm chỉ có duy nhất **một** đề cương hoạt động. Khi kích hoạt đề cương này, toàn bộ các phiên bản đề cương cũ khác thuộc cùng môn học (`courseId`) sẽ tự động được chuyển sang trạng thái ngưng hoạt động (`isActive = false`).
*   **Xác thực:** ✅ Có yêu cầu (Giảng viên Session Cookie).
*   **Path Parameters:**
    *   `id` (integer, bắt buộc): ID Đề cương môn học.
*   **Ví dụ Response (200 OK):**
    ```json
    {
      "success": true,
      "syllabus": {
        "id": 12,
        "isActive": true,
        "isApproved": true
      }
    }
    ```
*   **Ví dụ Response lỗi chưa phê duyệt đã kích hoạt (400 Bad Request):**
    ```json
    {
      "error": "Syllabus must be approved (is_approved=True) before activation."
    }
    ```

---

### 7. Xóa Đề cương môn học
`DELETE /api/syllabus/{id}`

*   **Mô tả:** Thực hiện xóa vật lý (hard delete) đề cương môn học khỏi cơ sở dữ liệu.
*   **Xác thực:** ✅ Có yêu cầu (Giảng viên Session Cookie).
*   **Path Parameters:**
    *   `id` (integer, bắt buộc): ID Đề cương môn học cần xóa.
*   **Ví dụ Response (200 OK):**
    ```json
    {
      "success": true
    }
    ```

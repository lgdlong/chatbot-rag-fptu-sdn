# API Đặc Tả: Phân Hệ Khung Chương Trình Đào Tạo (Curriculum)

Phân hệ này cho phép quản lý thông tin Ngành học (Major), Chuyên ngành hẹp (Specialization), Khung chương trình (Curriculum) và gán môn học vào khung chương trình đào tạo của trường học. Cấu hình thực tế tại `curriculum.controller.ts` được mount trên prefix `/api/curriculum`.

---

## 🔐 Cơ Chế Xác Thực (Authentication)
- **Xem thông tin (GET):** Yêu cầu đăng nhập tài khoản bất kỳ (Sinh viên, Giảng viên hoặc Admin) thông qua Session Cookie từ Better Auth (`better-auth.session_token`).
- **Thêm, sửa, xóa (POST, PUT, DELETE):** Yêu cầu tài khoản Quản trị viên (`ADMIN`).

---

## 📂 1. Quản Lý Ngành Học (Majors)

### 1.1 Lấy danh sách ngành học
`GET /api/curriculum/majors`

*   **Mô tả:** Trả về danh sách tất cả các ngành học hiện có trong hệ thống, sắp xếp theo mã ngành tăng dần.
*   **Xác thực:** ✅ Có yêu cầu (Session Cookie Better Auth).
*   **Ví dụ Response (200 OK):**
    ```json
    {
      "majors": [
        {
          "id": "major-uuid-1",
          "code": "SE",
          "name": "Kỹ thuật phần mềm",
          "description": "Ngành đào tạo kỹ sư phần mềm"
        }
      ]
    }
    ```

### 1.2 Tạo mới ngành học
`POST /api/curriculum/majors`

*   **Xác thực:** ✅ Có yêu cầu (ADMIN Session Cookie).
*   **Request Body (JSON):**
    *   `code` (string, bắt buộc): Mã ngành (ví dụ: `"SE"`).
    *   `name` (string, bắt buộc): Tên ngành (ví dụ: `"Kỹ thuật phần mềm"`).
    *   `description` (string, tùy chọn): Mô tả ngành.
*   **Ví dụ Response (201 Created):**
    ```json
    {
      "major": {
        "id": "major-uuid-1",
        "code": "SE",
        "name": "Kỹ thuật phần mềm",
        "description": "Ngành đào tạo kỹ sư phần mềm"
      }
    }
    ```

### 1.3 Cập nhật ngành học
`PUT /api/curriculum/majors/{id}`

*   **Xác thực:** ✅ Có yêu cầu (ADMIN Session Cookie).
*   **Path Parameters:**
    *   `id` (string, bắt buộc): ID ngành học.
*   **Request Body (JSON):**
    *   `name` (string, bắt buộc): Tên ngành mới.
    *   `description` (string, tùy chọn): Mô tả ngành mới.
*   **Ví dụ Response (200 OK):**
    ```json
    {
      "major": {
        "id": "major-uuid-1",
        "code": "SE",
        "name": "Kỹ thuật phần mềm (Đổi tên)",
        "description": "Mô tả mới"
      }
    }
    ```

### 1.4 Xóa ngành học
`DELETE /api/curriculum/majors/{id}`

*   **Mô tả:** Xóa ngành học ra khỏi hệ thống.
*   **Ràng buộc:** Không thể xóa ngành học nếu vẫn còn chuyên ngành hẹp (Specialization) liên kết với ngành học đó (trả về `409 Conflict`).
*   **Xác thực:** ✅ Có yêu cầu (ADMIN Session Cookie).
*   **Ví dụ Response (200 OK):**
    ```json
    {
      "success": true
    }
    ```

---

## 📂 2. Quản Lý Chuyên Ngành Hẹp (Specializations)

### 2.1 Lấy danh sách chuyên ngành hẹp
`GET /api/curriculum/specializations`

*   **Mô tả:** Lấy danh sách tất cả chuyên ngành hẹp kèm thông tin ngành học cha.
*   **Ví dụ Response (200 OK):**
    ```json
    {
      "specializations": [
        {
          "id": "spec-uuid-1",
          "majorId": "major-uuid-1",
          "code": "NJS",
          "name": "Lập trình NodeJS",
          "description": "Chuyên ngành Node.js",
          "major": {
            "code": "SE",
            "name": "Kỹ thuật phần mềm"
          }
        }
      ]
    }
    ```

### 2.2 Tạo chuyên ngành hẹp
`POST /api/curriculum/specializations`

*   **Xác thực:** ✅ Có yêu cầu (ADMIN Session Cookie).
*   **Request Body (JSON):**
    *   `majorId` (string, bắt buộc): ID ngành học cha.
    *   `code` (string, bắt buộc): Mã chuyên ngành hẹp (ví dụ: `"NJS"`).
    *   `name` (string, bắt buộc): Tên chuyên ngành hẹp (ví dụ: `"Lập trình NodeJS"`).
    *   `description` (string, tùy chọn): Mô tả.
*   **Ví dụ Response (201 Created):**
    ```json
    {
      "specialization": {
        "id": "spec-uuid-1",
        "majorId": "major-uuid-1",
        "code": "NJS",
        "name": "Lập trình NodeJS",
        "description": "Chuyên ngành Node.js"
      }
    }
    ```

### 2.3 Cập nhật chuyên ngành hẹp
`PUT /api/curriculum/specializations/{id}`

*   **Xác thực:** ✅ Có yêu cầu (ADMIN Session Cookie).
*   **Request Body (JSON):**
    *   `name` (string, bắt buộc): Tên chuyên ngành mới.
    *   `description` (string, tùy chọn): Mô tả mới.

### 2.4 Xóa chuyên ngành hẹp
`DELETE /api/curriculum/specializations/{id}`

*   **Ràng buộc:** Không thể xóa chuyên ngành hẹp nếu vẫn còn Khung chương trình (Curriculum) liên kết với chuyên ngành hẹp đó (trả về `409 Conflict`).
*   **Xác thực:** ✅ Có yêu cầu (ADMIN Session Cookie).

---

## 📂 3. Quản Lý Khung Chương Trình (Curriculums)

### 3.1 Lấy danh sách khung chương trình đào tạo
`GET /api/curriculum/curriculums`

*   **Mô tả:** Lấy toàn bộ danh sách các khung chương trình đào tạo hiện có.
*   **Ví dụ Response (200 OK):**
    ```json
    {
      "curriculums": [
        {
          "id": "curr-uuid-1",
          "curriculumId": "BIT_SE_NJS_19B",
          "majorId": "major-uuid-1",
          "specializationId": "spec-uuid-1",
          "batchCode": "K19B",
          "createdAt": "2026-05-27T16:38:00.000Z",
          "major": {
            "code": "SE",
            "name": "Kỹ thuật phần mềm"
          },
          "specialization": {
            "code": "NJS",
            "name": "Lập trình NodeJS"
          },
          "_count": {
            "subjects": 15
          }
        }
      ]
    }
    ```

### 3.2 Xem chi tiết khung chương trình kèm danh sách môn học
`GET /api/curriculum/curriculums/{curriculumId}`

*   **Mô tả:** Lấy thông tin chi tiết một khung chương trình đào tạo kèm theo toàn bộ danh sách các môn học được gán trong khung (sắp xếp theo học kỳ `semesterNo` tăng dần).
*   **Path Parameters:**
    *   `curriculumId` (string, bắt buộc): ID UUID hoặc Mã định danh Khung chương trình (ví dụ: `"BIT_SE_NJS_19B"`).
*   **Ví dụ Response (200 OK):**
    ```json
    {
      "curriculum": {
        "id": "curr-uuid-1",
        "curriculumId": "BIT_SE_NJS_19B",
        "majorId": "major-uuid-1",
        "specializationId": "spec-uuid-1",
        "batchCode": "K19B",
        "createdAt": "2026-05-27T16:38:00.000Z",
        "major": {
          "id": "major-uuid-1",
          "code": "SE",
          "name": "Kỹ thuật phần mềm"
        },
        "specialization": {
          "id": "spec-uuid-1",
          "code": "NJS",
          "name": "Lập trình NodeJS"
        },
        "subjects": [
          {
            "curriculumId": "curr-uuid-1",
            "courseId": "course-uuid-1",
            "semesterNo": 1,
            "isSpecializationSpecific": false,
            "course": {
              "id": "course-uuid-1",
              "code": "SWD392",
              "name": "Software Architecture and Design",
              "syllabuses": [
                {
                  "id": 12
                }
              ]
            }
          }
        ]
      }
    }
    ```

### 3.3 Tạo mới khung chương trình
`POST /api/curriculum/curriculums`

*   **Xác thực:** ✅ Có yêu cầu (ADMIN Session Cookie).
*   **Request Body (JSON):**
    *   `curriculumId` (string, bắt buộc): Mã định danh viết hoa không dấu cách (ví dụ: `"BIT_SE_NJS_19B"`).
    *   `majorId` (string, bắt buộc): ID ngành học.
    *   `specializationId` (string, tùy chọn): ID chuyên ngành hẹp.
    *   `batchCode` (string, bắt buộc): Khóa học (ví dụ: `"K19B"`).
*   **Ví dụ Response (201 Created):**
    ```json
    {
      "curriculum": {
        "id": "curr-uuid-1",
        "curriculumId": "BIT_SE_NJS_19B",
        "majorId": "major-uuid-1",
        "specializationId": "spec-uuid-1",
        "batchCode": "K19B"
      }
    }
    ```

### 3.4 Cập nhật khung chương trình
`PUT /api/curriculum/curriculums/{id}`

*   **Xác thực:** ✅ Có yêu cầu (ADMIN Session Cookie).
*   **Request Body (JSON):**
    *   `majorId` (string, bắt buộc): ID ngành học.
    *   `specializationId` (string, tùy chọn): ID chuyên ngành hẹp.
    *   `batchCode` (string, bắt buộc): Khóa học.

### 3.5 Xóa khung chương trình
`DELETE /api/curriculum/curriculums/{id}`

*   **Xác thực:** ✅ Có yêu cầu (ADMIN Session Cookie).

---

## 📂 4. Quản Lý Gán Môn Học Khung Chương Trình (Curriculum Subjects)

### 4.1 Gán môn học vào khung chương trình
`POST /api/curriculum/curriculums/{curriculumId}/subjects`

*   **Mô tả:** Gán một môn học vào khung chương trình đào tạo tại một học kỳ cụ thể (Semester No).
*   **Xác thực:** ✅ Có yêu cầu (ADMIN Session Cookie).
*   **Path Parameters:**
    *   `curriculumId` (string, bắt buộc): ID hoặc Mã khung chương trình.
*   **Request Body (JSON):**
    *   `courseId` (string, bắt buộc): ID môn học.
    *   `semesterNo` (integer, bắt buộc): Số học kỳ gán (từ `1` đến `9`).
    *   `isSpecializationSpecific` (boolean, tùy chọn): Đánh dấu môn học thuộc chuyên ngành hẹp (mặc định `false`).
*   **Ví dụ Response (201 Created):**
    ```json
    {
      "success": true,
      "link": {
        "curriculumId": "curr-uuid-1",
        "courseId": "course-uuid-1",
        "semesterNo": 1,
        "isSpecializationSpecific": false
      }
    }
    ```
*   **Response lỗi trùng môn học (409 Conflict):**
    ```json
    {
      "error": "This subject is already linked to this curriculum."
    }
    ```

### 4.2 Gỡ môn học khỏi khung chương trình
`DELETE /api/curriculum/curriculums/{curriculumId}/subjects/{courseId}`

*   **Mô tả:** Gỡ bỏ liên kết môn học ra khỏi khung chương trình đào tạo.
*   **Xác thực:** ✅ Có yêu cầu (ADMIN Session Cookie).
*   **Path Parameters:**
    *   `curriculumId` (string, bắt buộc): ID hoặc Mã khung chương trình.
    *   `courseId` (string, bắt buộc): ID môn học cần gỡ.
*   **Ví dụ Response (200 OK):**
    ```json
    {
      "success": true
    }
    ```

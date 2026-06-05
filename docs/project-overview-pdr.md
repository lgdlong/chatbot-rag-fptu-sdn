# TÀI LIỆU YÊU CẦU PHÁT TRIỂN SẢN PHẨM (PDR)
## Product Development Requirements — FPTU Chatbot RAG

Tài liệu này định nghĩa các yêu cầu chức năng và phi chức năng cho hệ thống **FPTU Chatbot RAG**, bao gồm mô hình Actor, Use Cases, đặc tả API, và acceptance criteria.

---

## 1. Tổng Quan Sản Phẩm

* **Tên sản phẩm:** FPTU Chatbot RAG — Hệ thống truy xuất kiến thức đa phương thức hỗ trợ học tập
* **Loại sản phẩm:** Web Application — hỗ trợ hệ thống học tập FPT University
* **Mục tiêu chính:** Cho phép sinh viên hỏi đáp dựa trên tài liệu môn học (PDF, Slide, Video) bằng phương pháp RAG (Retrieval-Augmented Generation)
* **Phạm vi:** Quản lý khung chương trình đào tạo (Curriculum), Syllabus từng môn học, tài liệu bài giảng, và chatbot hỏi đáp thông minh

---

## 2. Mô Hình Actor (Actors)

| Actor | Mô tả | Quyền hạn chính |
|-------|-------|----------------|
| **Student** | Sinh viên đã có email trong whitelist | Xem Syllabus, Chat hỏi đáp với tài liệu |
| **Lecturer** | Giảng viên được Super Admin phê duyệt | Upload tài liệu, quản lý Syllabus, tạo video links |
| **Super Admin** | Quản trị hệ thống | Quản lý whitelist email, duyệt lecturer request, quản lý người dùng |

---

## 3. Yêu Cầu Chức Năng (Functional Requirements)

### 3.1 Authentication & Authorization
- [x] Đăng ký / Đăng nhập email/password
- [x] Xác thực session qua Better Auth (database session + Redis cache)
- [x] Phân quyền theo `role` người dùng: `ADMIN`, `LECTURER`, `STUDENT`
- [x] Whitelist email — chỉ email có trong `EmailWhitelist` mới được đăng ký
- [x] Lecturer đăng ký qua form `LecturerRequest` → Super Admin phê duyệt
- [ ] Xác thực 2FA / TOTP (kế hoạch)

### 3.2 Curriculum Management (Super Admin)
- [x] CRUD Ngành học (`Major`): code, name, description
- [x] CRUD Chuyên ngành hẹp (`Specialization`): liên kết với Major
- [x] CRUD Khung chương trình đào tạo (`Curriculum`): curriculumId, batchCode, majorId, specializationId
- [x] Gán/Xóa môn học vào Curriculum (`CurriculumSubject`): semesterNo, isSpecializationSpecific

### 3.3 Course & Syllabus Management (Lecturer + Admin)
- [x] CRUD Môn học (`Course`): code, name
- [x] CRUD Syllabus (`Syllabus`): syllabusName, credits, degreeLevel, prerequisites, description, scoringScale, isApproved, isActive
- [x] Quản lý CLO — Chuẩn đầu ra (`SyllabusClo`): cloName, cloDetails
- [x] Quản lý lịch trình buổi học (`SyllabusSchedule`): session, topic, learningMethod, lo, itu
- [x] Quản lý phân bổ điểm (`AssessmentScheme`): category, type, weight, clo
- [x] Quản lý học liệu tham khảo (`SyllabusMaterial`): description, author, publisher, isbn
- [x] Quản lý câu hỏi kiến tạo (`ConstructiveQuestion`): sessionNo, name, details
- [x] Quản lý tài liệu tham khảo (`SyllabusReference`): citation text
- [x] Thêm/Xóa Video Links (`VideoLink`): url, title, description
- [x] Phê duyệt Syllabus (`PATCH /api/syllabus/:id/approve`)
- [x] Kích hoạt Syllabus (`PATCH /api/syllabus/:id/activate`)

### 3.4 Document Management (Lecturer)
- [x] Upload tài liệu vào Syllabus (`POST /api/syllabus/:syllabusId/documents`)
  * Hỗ trợ: `.pdf`, `.docx`, `.pptx`, images
  * Lưu file vật lý vào `/uploads` directory
  * Khởi tạo record `Document` với `status: PENDING`
  * Trigger ingestion pipeline (async embedding + Qdrant upsert)
- [x] Xóa tài liệu (`DELETE /api/syllabus/:syllabusId/documents/:documentId`)
  * Đồng bộ xóa chunks trong Qdrant
  * Xóa record DB

### 3.5 RAG Chat (Student)
- [x] Tạo phiên chat mới (`POST /api/chat/sessions`)
- [x] Lấy danh sách phiên chat (`GET /api/chat/sessions`)
- [x] Gửi tin nhắn và nhận streaming response (SSE) (`POST /api/chat/stream`)
- [x] Ba chế độ scoping chat:
  * `ALL_COURSES` — hỏi về tất cả tài liệu
  * `SELECTED_COURSES` — giới hạn trong một số môn học
  * `SELECTED_DOCUMENTS` — giới hạn trong một số tài liệu cụ thể
- [x] Hiển thị citations (tên tài liệu, số trang, snippet)
- [x] Lưu lịch sử chat (ChatMessage với citations dạng JSON)
- [x] Xem danh mục tài liệu có thể chat (`GET /api/chat/document-catalog`)

### 3.6 Audit Logging
- [x] Ghi log mọi hành động quản trị vào `AuditLog` (userId, action, entityType, entityId, details)

---

## 4. Yêu Cầu Phi Chức Năng (Non-Functional Requirements)

| Requirement | Tiêu chí | Độ ưu tiên |
|-------------|---------|-----------|
| **Performance** | API response time < 500ms (không tính LLM streaming) | HIGH |
| **Streaming Latency** | Time to first token < 2s | HIGH |
| **Security** | Session-based auth trên mọi protected endpoint | CRITICAL |
| **Data Isolation** | Mỗi request phải kiểm tra ownership trước khi trả dữ liệu | CRITICAL |
| **Scalability** | Turborepo monorepo hỗ trợ mở rộng module dễ dàng | MEDIUM |
| **Availability** | Health check endpoint `/api/health` phản hồi < 100ms | MEDIUM |

---

## 5. API Endpoints Specification

### 5.1 Authentication (`/api/auth/*` — Better Auth handler)
```
POST /api/auth/sign-in/email       # Đăng nhập email/password
POST /api/auth/sign-up/email       # Đăng ký tài khoản mới (kiểm tra whitelist)
POST /api/auth/sign-out            # Đăng xuất, hủy session
GET  /api/auth/get-session         # Lấy session hiện tại
```

### 5.2 Whitelist & Lecturer Requests
```
GET    /api/whitelist              # Danh sách whitelist email (Super Admin)
POST   /api/whitelist              # Thêm email vào whitelist
DELETE /api/whitelist/:id          # Xóa email khỏi whitelist

GET    /api/auth-admin/lecturer-requests         # Danh sách yêu cầu
POST   /api/auth-admin/lecturer-requests         # Gửi yêu cầu trở thành Lecturer
PATCH  /api/auth-admin/lecturer-requests/:id     # Phê duyệt / Từ chối yêu cầu
```

### 5.3 Curriculum Management
```
GET    /api/curriculum/majors                              # Danh sách ngành
POST   /api/curriculum/majors                              # Tạo ngành mới
PUT    /api/curriculum/majors/:id                          # Cập nhật ngành
DELETE /api/curriculum/majors/:id                          # Xóa ngành

GET    /api/curriculum/specializations                     # Danh sách chuyên ngành hẹp
POST   /api/curriculum/specializations                     # Tạo chuyên ngành hẹp
PUT    /api/curriculum/specializations/:id                 # Cập nhật
DELETE /api/curriculum/specializations/:id                 # Xóa

GET    /api/curriculum/curriculums                         # Danh sách khung chương trình
GET    /api/curriculum/curriculums/:curriculumId            # Chi tiết (kèm subjects)
POST   /api/curriculum/curriculums                         # Tạo khung chương trình
PUT    /api/curriculum/curriculums/:id                     # Cập nhật
DELETE /api/curriculum/curriculums/:id                     # Xóa
POST   /api/curriculum/curriculums/:curriculumId/subjects   # Gán môn học
DELETE /api/curriculum/curriculums/:curriculumId/subjects/:courseId  # Gỡ môn học
```

### 5.4 Course & Syllabus
```
GET    /api/courses                                          # Danh sách môn học
POST   /api/courses                                          # Tạo môn học mới
PATCH  /api/courses/:courseId                                # Cập nhật môn học
DELETE /api/courses/:courseId                                # Xóa môn học

GET    /api/syllabus                                         # Danh sách syllabus
GET    /api/syllabus/:id                                     # Chi tiết syllabus
POST   /api/syllabus                                         # Tạo syllabus mới
PUT    /api/syllabus/:id                                     # Cập nhật syllabus
DELETE /api/syllabus/:id                                     # Xóa syllabus
PATCH  /api/syllabus/:id/approve                             # Phê duyệt syllabus
PATCH  /api/syllabus/:id/activate                            # Kích hoạt syllabus

GET    /api/syllabus/:syllabusId/documents                   # Danh sách tài liệu
POST   /api/syllabus/:syllabusId/documents                   # Upload tài liệu
DELETE /api/syllabus/:syllabusId/documents/:documentId       # Xóa tài liệu
```

### 5.5 Chat
```
GET    /api/chat/sessions                                    # Danh sách phiên chat
POST   /api/chat/sessions                                    # Tạo phiên chat mới
POST   /api/chat/stream                                      # Gửi tin nhắn (SSE streaming)
GET    /api/chat/document-catalog                            # Danh mục tài liệu để chat
GET    /api/chat/courses                                     # Danh sách môn chat
GET    /api/chat/courses/:courseId/documents                 # Tài liệu theo môn
```

### 5.6 Internal
```
PATCH  /api/internal/documents/:id   # Cập nhật trạng thái xử lý tài liệu (từ worker)
GET    /api/health                   # Health check (DB latency + memory)
```

---

## 6. Database Schema Thực Tế (Prisma)

> Schema triển khai thực tế dành riêng cho cấu trúc học thuật FPTU với 21 models:

**Curriculum domain:** `Major` → `Specialization` → `Curriculum` → `CurriculumSubject` → `Course` → `Syllabus`

**Syllabus sub-tables:** `SyllabusClo`, `SyllabusSchedule`, `AssessmentScheme`, `SyllabusMaterial`, `ConstructiveQuestion`, `SyllabusReference`, `VideoLink`

**Document:** `Document` (gắn với `Syllabus`)

**Chat:** `ChatSession` (3 scopeMode) → `ChatSessionCourse` / `ChatSessionDocument` → `ChatMessage` (với `citations: Json?`)

**Auth (Better Auth):** `User`, `Session`, `Account`, `Verification`

**Admin:** `EmailWhitelist`, `LecturerRequest`, `AuditLog`

**Enum values:**
```
SenderType { USER, ASSISTANT }
ChatSessionScopeMode { ALL_COURSES, SELECTED_COURSES, SELECTED_DOCUMENTS }
```

---

## 7. Acceptance Criteria

### 7.1 Authentication
- [x] User có thể đăng nhập với email/password
- [x] Chỉ email có trong whitelist mới được tạo tài khoản
- [x] Session được lưu trữ trong DB và cache Redis
- [x] Lecturer request flow: submit → admin review → approve/reject

### 7.2 Curriculum & Syllabus
- [x] Admin có thể tạo Major → Specialization → Curriculum → gán Course
- [x] Lecturer có thể tạo, cập nhật, phê duyệt, kích hoạt Syllabus
- [x] Upload tài liệu vào Syllabus, hệ thống xử lý async và lưu vector

### 7.3 RAG Chat
- [x] Student có thể gửi câu hỏi và nhận streaming response
- [x] Citations hiển thị đúng (tên tài liệu, số trang, snippet)
- [x] Scoping hoạt động đúng theo `ALL_COURSES` / `SELECTED_COURSES` / `SELECTED_DOCUMENTS`
- [x] Lịch sử chat được lưu kèm citations dạng JSON

### 7.4 Performance
- [x] `GET /api/health` < 100ms
- [ ] Vector search < 200ms
- [ ] Time to first token < 2s

---

## 8. Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| API Token Cost | HIGH | Implement request caching cho các câu hỏi phổ biến |
| LLM Hallucination | MEDIUM | Strict system prompt + guardrails "từ chối trả lời ngoài tài liệu" |
| Slow Vector Search | MEDIUM | Optimize Qdrant index, dùng payload filtering theo syllabusId |
| Document Processing Failure | HIGH | Status tracking (PENDING → PROCESSING → COMPLETED/FAILED) + retry logic |
| Session Expiry Under Load | MEDIUM | Redis session cache + reasonable TTL |

---

> **Last Updated:** 2026-06-05
> **Version:** 2.0
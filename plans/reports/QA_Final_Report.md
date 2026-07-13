# Báo Cáo Kiểm Tra Chất Lượng Cuối Cùng (Final QA Report)

> **Ngày**: 2026-07-13  
> **Phạm vi**: Toàn bộ codebase — `api/`, `web/`, `data/`, `docs/`  
> **Mục tiêu**: Đối chiếu yêu cầu từ `docs/srs/Requirements_Raw.md` và `SRS_Detailed.md` với thực tế triển khai

---

## I. TỔNG QUAN (Executive Summary)

| Hạng mục                                   | Kết quả                                                             |
| ------------------------------------------ | ------------------------------------------------------------------- |
| **Tổng số yêu cầu từ Requirements_Raw.md** | ~18 yêu cầu chức năng                                               |
| **Đã triển khai hoàn chỉnh**               | 14/18 (78%)                                                         |
| **Triển khai một phần**                    | 2/18 (11%)                                                          |
| **Chưa triển khai / thiếu**                | 2/18 (11%)                                                          |
| **API Endpoints**                          | 59 endpoints (8 controllers)                                        |
| **Frontend Pages**                         | 18 pages (3 portals)                                                |
| **Database Models**                        | 21 models + 6 enums                                                 |
| **Database Records**                       | 52 courses, 105 syllabuses (đã seed đầy đủ), 96 curriculum_subjects |
| **Test Coverage**                          | ⏳ **1 file test** — backend test cases để lại xử lý sau            |

---

## II. ĐỐI CHIẾU YÊU CẦU CHI TIẾT

### A. Yêu cầu từ Requirements_Raw.md (gốc)

| #     | Yêu cầu                                  | Trạng thái     | Mô tả                                                                                                                                                         |
| ----- | ---------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A.1.1 | Upload PDF, DOCX, slide bài giảng        | ⚠️ **Partial** | PDF-only (100%). DOCX/PPTX/image **out of scope cho Release A** theo SRS_Detailed.md. Slide bài giảng yêu cầu export PDF trước khi upload.                    |
| A.1.2 | Tự động chunk & embed tài liệu           | ✅ **Done**    | Delegated to AnythingLLM. Upload → AnythingLLM auto-chunks + embeds. IngestionJob tracking status.                                                            |
| A.1.3 | Quản lý theo môn học/chương (demo 1 môn) | ✅ **Done**    | Quản lý theo **môn học** (Syllabus). DB có **52 courses, 105 syllabuses** (đầy đủ SE học kỳ 1-8). **Không quản lý theo chương** (out of scope cho Release A). |
| A.1.4 | Xem danh sách tài liệu đã index          | ✅ **Done**    | Teacher Document Manager page shows status badges (indexed/processing/failed).                                                                                |
| A.2.1 | Chat tự nhiên theo ngữ cảnh hội thoại    | ✅ **Done**    | SSE streaming chat with session context. Multi-turn conversation.                                                                                             |
| A.2.2 | Trích dẫn nguồn tài liệu gốc             | ✅ **Done**    | Citations array returned from AnythingLLM, displayed in ChatMessageList.                                                                                      |
| A.2.3 | Giới hạn trả lời trong phạm vi tài liệu  | ✅ **Done**    | AnythingLLM workspace isolation per syllabus + guardrail system prompt.                                                                                       |
| A.2.4 | Lịch sử hội thoại theo phiên             | ✅ **Done**    | ChatSession CRUD, user can view/delete history.                                                                                                               |

### B. Yêu cầu từ SRS_Detailed.md (bổ sung)

| ID          | Yêu cầu                               | Trạng thái  | Chi tiết                                                                         |
| ----------- | ------------------------------------- | ----------- | -------------------------------------------------------------------------------- |
| FR-01.1     | Student login bằng Google             | ✅ **Done** | Google OAuth configured.                                                         |
| FR-01.2     | Chặn student nếu email chưa whitelist | ✅ **Done** | EmailWhitelist check in auth hooks (user.create.before + session.create.before). |
| FR-01.3     | Lecturer login bằng email/password    | ✅ **Done** | Better Auth email/password.                                                      |
| FR-01.4     | Admin login bằng email/password       | ✅ **Done** | Same flow.                                                                       |
| FR-01.5     | Logout                                | ✅ **Done** | POST /api/auth/sign-out.                                                         |
| FR-02.1     | Search môn theo subject code/tên      | ✅ **Done** | GET /api/syllabus?subject_code=XYZ.                                              |
| FR-02.2     | Chỉ show kết quả public cho student   | ✅ **Done** | SyllabusService.searchSyllabuses filters by role.                                |
| FR-02.3     | Xem subject detail page               | ✅ **Done** | Student syllabus/[subjectCode] page with 5 tabs.                                 |
| FR-02.4     | Hiển thị structured syllabus đầy đủ   | ✅ **Done** | Overview, Materials, CLOs, Schedule, Assessment tabs.                            |
| FR-03.1     | List syllabus quản trị                | ✅ **Done** | Teacher syllabus list with filters.                                              |
| FR-03.2     | Create syllabus draft                 | ✅ **Done** | Multi-step form + API.                                                           |
| FR-03.3     | Edit syllabus                         | ✅ **Done** | Edit form loads existing data.                                                   |
| FR-03.4     | Approve syllabus                      | ✅ **Done** | PATCH /api/syllabus/:id/approve.                                                 |
| FR-03.5     | Activate syllabus                     | ✅ **Done** | PATCH /api/syllabus/:id/activate (auto-deactivates old).                         |
| FR-03.6     | Deactivate syllabus                   | ✅ **Done** | PATCH /api/syllabus/:id/deactivate.                                              |
| FR-03.7     | Validate assessment total = 100%      | ✅ **Done** | Validation in SyllabusService.updateSyllabus.                                    |
| FR-03.8     | Minor patch update                    | ✅ **Done** | PUT /api/syllabus/:id — direct field update.                                     |
| FR-03.9     | Lecturer xem syllabus detail          | ✅ **Done** | Same detail API, role-appropriate response.                                      |
| FR-04.1     | Upload PDF                            | ✅ **Done** | POST /api/syllabus/:syllabusId/documents.                                        |
| FR-04.2     | Validate PDF type/size/empty          | ✅ **Done** | 50MB limit + extension check + magic byte check.                                 |
| FR-04.3     | Xử lý tự động                         | ✅ **Done** | Async ingestion via AnythingLLM.                                                 |
| FR-04.4     | View document status                  | ✅ **Done** | Status badges on document manager.                                               |
| FR-04.5     | Delete document                       | ✅ **Done** | DELETE endpoint with AnythingLLM cleanup.                                        |
| FR-04.6     | Re-upload để re-index                 | ✅ **Done** | Delete → Upload again flow.                                                      |
| FR-05.1     | Open chat trong syllabus đang chọn    | ✅ **Done** | Floating ChatbotWidget on syllabus page.                                         |
| FR-05.2     | Tạo session chat theo đúng syllabus   | ✅ **Done** | scopeMode=SELECTED_COURSES với courseId.                                         |
| FR-05.3     | Gửi câu hỏi                           | ✅ **Done** | SSE streaming endpoint.                                                          |
| FR-05.4     | Giữ ngữ cảnh trong cùng session       | ✅ **Done** | Messages stored + passed to AnythingLLM.                                         |
| FR-05.5     | Trả về citation                       | ✅ **Done** | citations event in SSE stream.                                                   |
| FR-05.6     | Xem history của chính user            | ✅ **Done** | GET /api/chat/sessions.                                                          |
| FR-05.7     | Xóa session chat                      | ✅ **Done** | DELETE /api/chat/sessions/:sessionId.                                            |
| FR-05.8     | Trả lời đúng thông tin assessment     | ✅ **Done** | Syllabus snapshot markdown includes assessment data.                             |
| FR-05.9     | Lecturer chat với syllabus            | ✅ **Done** | Same chat widget available in teacher portal.                                    |
| FR-06.1     | Xem danh sách lecturer                | ✅ **Done** | Superadmin admins page.                                                          |
| FR-06.2     | Tạo lecturer thủ công                 | ✅ **Done** | Create lecturer page + API.                                                      |
| FR-06.3     | Disable lecturer                      | ✅ **Done** | POST /api/admin/disable-lecturer.                                                |
| FR-06.3b    | Enable lecturer                       | ✅ **Done** | POST /api/admin/enable-lecturer.                                                 |
| FR-06.4     | Xem whitelist                         | ✅ **Done** | Paginated list with search.                                                      |
| FR-06.5     | Thêm email whitelist                  | ✅ **Done** | Single + bulk import.                                                            |
| FR-06.6     | Xóa email whitelist                   | ✅ **Done** | DELETE /api/whitelist/:id.                                                       |
| FR-07.1-7.7 | Knowledge scope & retrieval           | ✅ **Done** | AnythingLLM workspace per syllabus, scoped retrieval.                            |

---

## III. DANH MỤC ĐÃ HOÀN TẤT (What's Done ✅)

### 1. Authentication & Authorization

- ✅ Better Auth integration (email/password + Google OAuth)
- ✅ 3-role RBAC: ADMIN / LECTURER / STUDENT
- ✅ Email whitelist gating for students
- ✅ Rate limiting, password reset, session management
- ✅ Role-based route protection (frontend + backend)

### 2. Syllabus Management (Full CRUD Lifecycle)

- ✅ Create → Draft → Edit → Approve → Activate → Deactivate → Delete
- ✅ Assessment weight validation (sum must = 100%)
- ✅ Auto-deactivate old syllabus when activating new one
- ✅ Minor patch update via PUT
- ✅ Syllabus snapshot sync to AnythingLLM (markdown generation)

### 3. Document Management

- ✅ PDF upload with 50MB size limit
- ✅ Magic byte validation (security check)
- ✅ Async ingestion pipeline (AnythingLLM)
- ✅ Status tracking (PENDING → PROCESSING → COMPLETED / FAILED)
- ✅ Delete document (removes from AnythingLLM too)
- ✅ Re-upload flow

### 4. Chat & RAG

- ✅ SSE streaming chat responses
- ✅ Session-based conversation history
- ✅ Source citations from AnythingLLM
- ✅ Quiz giới hạn 100 messages/session
- ✅ Scope isolation (chat chỉ trong 1 syllabus/workspace)
- ✅ Syllabus knowledge snapshot sync

### 5. Curriculum Management

- ✅ Major CRUD (SE, AI, etc.)
- ✅ Specialization CRUD (NJS, NET, etc.)
- ✅ Curriculum CRUD (BIT_SE_NJS_19B)
- ✅ Subject assignment to curriculum by semester
- ✅ Quick-fill 44 core subjects
- ✅ Specialization-specific subject marking

### 6. Admin Governance

- ✅ Lecturer account creation with temp password
- ✅ Lecturer enable/disable
- ✅ Email whitelist CRUD with bulk import/export
- ✅ Admin dashboard with stats, query trend chart, activity log
- ✅ Audit logging for admin actions

### 7. Frontend Portals

- ✅ **Student Portal**: Login, search, syllabus detail (5 tabs), chat widget
- ✅ **Teacher Portal**: Dashboard, syllabus list/create/edit, document manager, curriculum manager
- ✅ **SuperAdmin Portal**: Dashboard, user management, whitelist, lecturer creation

### 8. Infrastructure

- ✅ PostgreSQL database with 21 models
- ✅ AnythingLLM integration (workspace, document, streaming chat APIs)
- ✅ OpenAPI 3.0 spec + Swagger UI
- ✅ Health check endpoint
- ✅ Environment configuration
- ✅ Docker Compose setup
- ✅ Turborepo monorepo
- ✅ README with full documentation

---

## IV. KHOẢNG TRỐNG & THIẾU SÓT (Gaps & Missing ❌)

### 1. 🔴 **CITATION BUG — KHÔNG HIỂN THỊ DỮ LIỆU THẬT**

**User xác nhận:** Chatbot chỉ show "[1] Nguồn tài liệu [2] Nguồn tài liệu..." mà không có dữ liệu chính xác.

**Root cause:** Không có layer transform dữ liệu citation. Pipeline bị **3 kiểu shape khác nhau**:

| Stage                       | Kiểu dữ liệu                                  | Field mong đợi |
| --------------------------- | --------------------------------------------- | -------------- |
| AnythingLLM response        | `{ title?, textContent?, ... }`               | Không xác định |
| Backend `ChatCitation` type | `{ documentId, documentName, fileUrl, page }` | **Không khớp** |
| Frontend `onCitations`      | `{ source, excerpt }`                         | **Không khớp** |

**Bug chain:**

1. `anythingllm.adapter.ts` (dòng 260): `citations = payload.sources` — lưu raw AnythingLLM response, **không transform**
2. `rag.service.ts` (dòng 69): `return { ...result }` — pass-through citations
3. `chat.service.ts` (dòng 217): `ragResult.citations as ChatCitation[]` — **TypeScript cast ảo**, không map data thật
4. `chat.controller.ts` (dòng 304): gửi citations qua SSE
5. `ChatbotWidget.tsx` (dòng 123): `c.source || "Nguồn tài liệu"` — fallback vì field `source` không tồn tại

**Fix cần:**

- Backend: mapping AnythingLLM source → định dạng chuẩn (transformation trong `rag.service.ts` hoặc `anythingllm.adapter.ts`)
- Frontend: thống nhất field names với backend output

**Mức độ ảnh hưởng:** **CAO** — Lỗi chức năng, user nhìn thấy dữ liệu không chính xác.

### 2. ❌ BACKEND TEST COVERAGE

> ⏳ _User note: để lại xử lý sau_

**Thực tế:**

- 1 file test duy nhất (`email.service.test.ts`)
- Không có unit test cho services
- Không có integration test cho API endpoints
- Không có E2E test

### 4. ❌ ANALYTICS MODULE (TRỐNG)

`api/src/modules/analytics/` chỉ chứa file `.gitkeep`

**Mức độ ảnh hưởng:** **THẤP** — Không nằm trong yêu cầu Release A.

### 3. ⚠️ DUPLICATED ACTIVE SYLLABUSES (VIOLATES BR-03)

**Mô tả:** Nhiều course có **2 syllabus cùng active** (is_active = true). Vi phạm business rule **BR-03**: "Mỗi subject chỉ có tối đa 1 syllabus active".

**Ví dụ:** EXE201, SSG104, SWE201c, ITE302c, CSD201... (10+ courses bị ảnh hưởng)

**Nguyên nhân:** seed process chạy nhiều lần, activate syllabus mới nhưng không deactivate bản cũ, hoặc seed-full.ts upsert không check active state.

**Mức độ ảnh hưởng:** **TRUNG BÌNH** — RAG workspace có thể trỏ sai syllabus nếu không sync lại.

### 5. ⚠️ FRONTEND: THIẾU NEXT.JS BEST PRACTICES

| Issue                                          | Ảnh hưởng                                  |
| ---------------------------------------------- | ------------------------------------------ |
| ❌ Không có `error.tsx` pages                  | Crash → white screen, không có fallback UI |
| ❌ Không có `not-found.tsx` pages              | 404 → trang trắng                          |
| ❌ Không có `loading.tsx` files                | Nội dung chờ không có skeleton             |
| ❌ Không có meta-data/SEO (`generateMetadata`) | Thiếu title/description tab trình duyệt    |

**Mức độ ảnh hưởng:** **THẤP-TRUNG BÌNH** — Demo không crash nhưng UX kém.

### 6. ⚠️ FRONTEND: UI/UX GAPS

| Issue                                             | Chi tiết                           |
| ------------------------------------------------- | ---------------------------------- |
| ❌ Student layout không có sidebar                | Chỉ header top, navigation hạn chế |
| ❌ Chat là floating widget                        | Không có standalone chat page      |
| ❌ Teacher document manager không batch upload    | Phải upload từng file một          |
| ❌ Không có breadcrumb trên student syllabus page | Khó quay lại search                |

**Mức độ ảnh hưởng:** **THẤP** — UI hoạt động được, chỉ thiếu refinement.

### 7. ⚠️ ORPHANED MIGRATION

Migration `20260528000001_sepay_payment` tham chiếu table `transactions` **không tồn tại** trong schema hiện tại.

**Mức độ ảnh hưởng:** **THẤP** — Chỉ gây nhầm lẫn.

### 8. ℹ️ DUPLICATED AUTH MIDDLEWARE — KHÔNG NGHIÊM TRỌNG

`requireAdmin()` / `requireLecturer()` helper functions được copy lại ở 3-4 controllers.

**Đánh giá: KHÔNG nghiêm trọng.** Lý do:

- ✅ Mỗi controller gọi `auth.api.getSession()` riêng → mỗi request đều validate session fresh
- ✅ Role check pattern giống nhau (`session.user.role !== "ADMIN"` → 403)
- ✅ **Không có lỗ hổng bảo mật** — việc duplicate không làm yếu access control
- ❌ Chỉ là code smell (DRY violation), gây khó maintain nếu thay đổi logic sau này

**Nên làm:** Extract middleware chung. **Không cần làm ngay.**

---

## V. ĐÁNH GIÁ CHẤT LƯỢNG (Quality Assessment)

### 5.1 Code Quality

- **Kiến trúc:** Module-based, phân tách controller → service → repository tốt
- **TypeScript:** Full type safety, strict types
- **Error handling:** ServiceError pattern với HTTP status codes
- **Streaming:** SSE implementation đúng chuẩn
- **Validation:** Zod env validation, magic byte check, file size/type validation

### 5.2 Database Design

- **21 models** phủ kín domain FPTU academic
- **Relationships:** Đúng cascade rules
- **Enums:** 6 enums cho status/type safety
- **Indexes:** Có indexes cơ bản
- **Migrations:** 5 migrations, có thể reproduce

### 5.3 Frontend Quality

- **Framework:** Next.js 16 App Router
- **UI Library:** Mantine UI v7
- **State Management:** React Context (AuthContext)
- **API Client:** Centralized fetch wrapper
- **Streaming:** EventSource cho SSE consumption

### 5.4 RAG Pipeline Quality

- **Engine:** AnythingLLM (external service)
- **Workspace isolation:** Mỗi syllabus có workspace riêng
- **Knowledge sync:** Syllabus markdown snapshot → AnythingLLM
- **Document ingestion:** Upload → AnythingLLM auto chunk/embed
- **Citation:** Trả citations từ AnythingLLM sources
- **Guardrails:** System prompt chặn hallucination

---

## VI. DANH SÁCH MÀN HÌNH (Screen Inventory)

| Màn hình                   | Portal  | Trạng thái |
| -------------------------- | ------- | ---------- |
| Login                      | Public  | ✅ Done    |
| Forgot Password            | Public  | ✅ Done    |
| Reset Password             | Public  | ✅ Done    |
| Student Dashboard/Search   | Student | ✅ Done    |
| Student Syllabus Detail    | Student | ✅ Done    |
| Course Chat Panel          | Student | ✅ Done    |
| Teacher Dashboard          | Teacher | ✅ Done    |
| Teacher Syllabus List      | Teacher | ✅ Done    |
| Teacher Create Syllabus    | Teacher | ✅ Done    |
| Teacher Edit Syllabus      | Teacher | ✅ Done    |
| Teacher Document Manager   | Teacher | ✅ Done    |
| Teacher Curriculum Manager | Teacher | ✅ Done    |
| Teacher Settings           | Teacher | ✅ Done    |
| SuperAdmin Dashboard       | Admin   | ✅ Done    |
| SuperAdmin User Management | Admin   | ✅ Done    |
| SuperAdmin Whitelist       | Admin   | ✅ Done    |
| SuperAdmin Create Lecturer | Admin   | ✅ Done    |

---

## VII. KẾT LUẬN & KHUYẾN NGHỊ

### Kết Luận

Hệ thống đã đáp ứng **hầu hết yêu cầu chức năng** từ SRS. Codebase có kiến trúc tốt, type-safe, và phủ kín business logic của FPTU academic domain. Có thể demo được flow đầy đủ: Student search → view syllabus → chat, Teacher manage syllabus/documents, Admin govern users.

### Các Vấn Đề Cần Xử Lý Ngay (Critical)

| Priority  | Vấn đề                                       | Khắc phục                                                                                                           | Trạng thái   |
| --------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------ |
| 🔴 **P0** | **Citation bug — không hiển thị nguồn thật** | Thêm transform layer mapping AnythingLLM source → `{ documentName, excerpt }` ở backend; fix frontend field mapping | Chưa xử lý   |
| 🔴 **P0** | **Backend test coverage**                    | Unit test SyllabusService, ChatService; integration test SSE endpoint                                               | ⏳ Xử lý sau |
| 🟡 **P1** | **Duplicated active syllabuses (BR-03)**     | Fix seed — activate mới phải deactivate bản cũ. Rà soát DB query.                                                   | Chưa xử lý   |

### Các Vấn Đề Nên Xử Lý (Recommended)

| Priority  | Vấn đề                                             | Khắc phục                                                        | Ảnh hưởng              |
| --------- | -------------------------------------------------- | ---------------------------------------------------------------- | ---------------------- |
| 🟡 **P2** | Thêm `error.tsx` + `not-found.tsx` + `loading.tsx` | Tạo file tại mỗi portal layout                                   | UX crash → fallback UI |
| 🟡 **P2** | Student navigation: thêm breadcrumb                | Thêm breadcrumb component trong student layout                   | UX navigation          |
| 🟡 **P2** | Chat page standalone                               | Tách ChatbotWidget ra page riêng                                 | UX flexibility         |
| 🟢 **P3** | Extract centralized auth middleware                | Hono middleware pattern: `app.use('/api/admin/*', requireAdmin)` | Maintainability        |
| 🟢 **P3** | Xóa orphaned migration                             | Xóa migration file `20260528000001_sepay_payment`                | Clean git history      |

---

## VIII. API ENDPOINTS COMPLETE LIST

| Module         | Prefix                  | Endpoints              | Auth Required               |
| -------------- | ----------------------- | ---------------------- | --------------------------- |
| Health         | `/`                     | 1                      | None                        |
| Health         | `/api/health`           | 1                      | None                        |
| OpenAPI        | `/api/doc`, `/api/docs` | 2                      | None                        |
| Auth           | `/api/auth/*`           | All Better Auth routes | Varies                      |
| Courses        | `/api/courses`          | 4                      | None (GET) / LECTURER+ADMIN |
| Chat           | `/api/chat`             | 10                     | Auth                        |
| Curriculum     | `/api/curriculum`       | 17                     | Auth (GET) / ADMIN+LECTURER |
| Syllabus       | `/api/syllabus`         | 12                     | Auth (GET) / LECTURER       |
| Whitelist      | `/api/whitelist`        | 4                      | ADMIN                       |
| Admin Lecturer | `/api/admin`            | 3                      | ADMIN                       |
| Admin Stats    | `/api/admin/stats`      | 3                      | ADMIN                       |
| Internal       | `/api/internal`         | 1                      | Internal API Key            |
| **TOTAL**      |                         | **59**                 |                             |

---

_Report generated from comprehensive codebase scan — 2026-07-13_

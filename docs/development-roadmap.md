# LỘ TRÌNH PHÁT TRIỂN HỆ THỐNG (DEVELOPMENT ROADMAP)

Tài liệu này đóng vai trò là bản thiết kế lộ trình phát triển và kiểm soát tiến độ thực tế của dự án **FPTU Chatbot RAG**. Lộ trình được phân chia thành các giai đoạn rõ ràng để hiện thực hóa sản phẩm kỹ thuật và đáp ứng mục tiêu nghiên cứu.

---

## 🗺️ Tóm Tắt Trạng Thái Các Cột Mốc (Milestones Overview)

| Giai đoạn | Mục tiêu chính | Tiến độ | Trạng thái | Ghi chú |
| :---: | :--- | :---: | :---: | :--- |
| **Phase 1** | Monorepo Setup, Turborepo, Docker, DB Schema | **100%** | ✅ **HOÀN THÀNH** | — |
| **Phase 2** | Better Auth, Whitelist, Role System | **100%** | ✅ **HOÀN THÀNH** | — |
| **Phase 3** | Curriculum/Syllabus CRUD, PDF Upload, RAG Integration | **85%** | 🔄 **ĐANG TRIỂN KHAI** | Còn đồng bộ lại với scope mới |
| **Phase 4** | RAG Chatbot Core, SSE Streaming, Course-Scoped Chat | **70%** | 🔄 **ĐANG TRIỂN KHAI** | Chat UI đã hoạt động |
| **Phase 5** | Frontend Polish (Mantine), Student Portal, Chat UX | **60%** | 🔄 **ĐANG TRIỂN KHAI** | Đang hoàn thiện các trang |
| **Phase 6** | Dashboard Analytics, API Cost Monitoring | **0%** | 📅 **KẾ HOẠCH** | — |

---

## 🔍 Chi Tiết Các Giai Đoạn Phát Triển

### ✅ Phase 1: Thiết Lập Môi Trường & Cơ Sở Dữ Liệu (Hoàn thành)

**Mục tiêu:** Khởi tạo dự án Monorepo tiêu chuẩn, cấu hình DB và API gateway.

- [x] Tạo Monorepo với **Turborepo** — quản lý workspace `api/` và `web/`
- [x] Cấu hình `turbo.json` với pipeline `dev`, `build`, `lint`, `test`
- [x] Docker Compose cho **PostgreSQL + Redis + Qdrant**
- [x] Thiết kế **Prisma schema** đầy đủ 21 models đặc thù FPTU
- [x] API Health Check (`/api/health`) với DB latency + memory metrics
- [x] Global logger middleware (`winston`) + file logging vào `logs/api.log`
- [x] Swagger UI (`/api/docs`) với OpenAPI document tự động sinh
- [x] CORS configuration + static file serving cho `/uploads/*`

**Tiêu chí hoàn thành:** ✅ Server backend khởi chạy, kết nối PostgreSQL thành công, `/api/health` trả về 200.

---

### ✅ Phase 2: Xác Thực & Phân Quyền Better Auth (Hoàn thành)

**Mục tiêu:** Toàn bộ module xác thực, phân quyền và quản lý whitelist.

- [x] Cài đặt `better-auth` phía backend Hono.js với Prisma adapter
- [x] Cấu hình **Admin Plugin** — quản lý users, banning, role management
- [x] **Email Whitelist** — chỉ email trong `EmailWhitelist` mới được đăng ký
- [x] Super Admin tự tạo và quản lý tài khoản giảng viên theo business scope hiện tại
- [x] Xây dựng `whitelistRouter`
- [x] Frontend: trang `/login` với email/password form (Mantine)
- [x] `AuthContext.tsx` quản lý session state + role-based routing
- [x] `ProtectedRoute.tsx` bảo vệ trang yêu cầu xác thực

**Tiêu chí hoàn thành:** ✅ Đăng nhập thành công, phân biệt đúng role `STUDENT`, `LECTURER`, `SUPER_ADMIN`.

---

### 🔄 Phase 3: Curriculum/Syllabus CRUD & Document Management (85%)

**Mục tiêu:** Hoàn thiện quản lý khung chương trình đào tạo và tài liệu bài giảng.

- [x] CRUD **Major, Specialization, Curriculum, CurriculumSubject** (`curriculumRouter`)
- [x] CRUD **Syllabus** đầy đủ — CLOs, Schedules, Assessment, Materials, References (`syllabusRouter`)
- [x] **Phê duyệt / Kích hoạt** Syllabus (`PATCH /approve`, `PATCH /activate`)
- [x] **Upload Document** vào Syllabus (multipart, lưu `/uploads`, trigger worker)
- [x] **Xóa Document** đồng bộ Qdrant (xóa vectors theo `document_id`)
- [x] `DocumentRepository.delete()` — xóa đồng bộ DB + Qdrant
- [x] **Qdrant integration** — upsert vectors với payload filtering
- [x] Frontend: trang `/teacher/documents`, `/teacher/syllabus`, `/teacher/curriculum`
- [ ] Đồng bộ technical design với `AnythingLLM` là narrative chính
- [ ] Dọn legacy manual-RAG/Qdrant docs còn sót

**Tiêu chí hoàn thành (partial):** Giảng viên upload PDF, hệ thống xử lý async, vector lưu thành công trong Qdrant.

---

### 🔄 Phase 4: RAG Chatbot Core & SSE Streaming (70%)

**Mục tiêu:** Xây dựng phần lõi RAG Chatbot theo từng môn học và streaming response.

- [x] Chat session gắn với `1 course`
- [x] Chat chỉ truy xuất dữ liệu trong phạm vi môn học hiện tại
- [x] `ChatSession` CRUD cho lịch sử hội thoại
- [x] **SSE Streaming** — Hono streaming helper + Gemini Flash streaming
- [x] **Citations** — trả về mảng `citations[]` cùng streaming response
- [x] Lưu lịch sử `ChatMessage` với `citations: Json?`
- [ ] **Query Rewriting** — tái cấu trúc câu hỏi dựa trên history context
- [ ] **Prompt Guardrails** — từ chối trả lời khi câu hỏi ngoài tài liệu
- [ ] Frontend chat citation click → mở PDF tại đúng trang

**Tiêu chí hoàn thành (partial):** Student chat được, nhận streaming response kèm citations.

---

### 🔄 Phase 5: Frontend Polish & Student Portal (60%)

**Mục tiêu:** Hoàn thiện giao diện người dùng với Mantine UI, responsive design.

- [x] Trang `/student` — Dashboard với danh sách Syllabus accessible
- [x] Trang `/student/syllabus/:subjectCode` — Chi tiết Syllabus (CLOs, Schedule, Assessment)
- [x] Trang `/teacher/documents` — Quản lý tài liệu upload
- [x] Trang `/superadmin` — Dashboard superadmin
- [x] Trang `/superadmin/admins` — Quản lý tài khoản giảng viên
- [x] Trang `/superadmin/whitelist` — Quản lý whitelist email
- [x] `ChatbotWidget.tsx` — Floating chat widget với SSE streaming
- [ ] Trang `/teacher/syllabus/create` — Tạo Syllabus đầy đủ (form phức tạp)
- [ ] Citation click → PDF viewer / Video player tại đúng timestamp
- [ ] Dark Mode support
- [ ] Responsive mobile design

---

### 📅 Phase 6: Dashboard Analytics & API Cost Monitoring (Kế hoạch)

**Mục tiêu:** Cung cấp insights cho giảng viên và giám sát chi phí API.

- [ ] Dashboard giảng viên: Thống kê câu hỏi phổ biến, downvoted answers
- [ ] Topic clustering từ chat history
- [ ] API token consumption tracking (Gemini API costs)
- [ ] Redis caching cho câu hỏi phổ biến để giảm API calls
- [ ] Export báo cáo CSV

---

> **Last Updated:** 2026-06-05
> **Phiên bản:** 2.0 — Đồng bộ với codebase thực tế

# SRS — RAG Chatbot & Mini FLM (Bản Tóm Tắt)

> **Dự án:** Chatbot hỏi đáp dựa trên tài liệu môn học (RAG) kết hợp trợ lý FLM mini
> **Môn học:** SDN302 — Đại học FPT
> **Phiên bản tài liệu:** 3.0 — 23/05/2026

---

## 1. Tổng Quan Dự Án

| Hạng mục | Mô tả |
|---|---|
| **Mục tiêu** | Ứng dụng web chatbot cho phép sinh viên hỏi đáp dựa trên tài liệu môn học, sử dụng kiến trúc Hybrid RAG (Qdrant cho file phi cấu trúc + PostgreSQL cho dữ liệu syllabus có cấu trúc) |
| **Phạm vi dữ liệu demo** | Toàn bộ môn chuyên ngành SE (Software Engineering) từ học kỳ 1–9 |
| **Thiết kế CSDL** | Bao quát toàn trường (tất cả ngành, chuyên ngành hẹp, combo) |
| **Chính sách scope** | Mở — nhóm tự định nghĩa, tự review và hoàn thiện requirement |

---

## 2. Vai Trò Người Dùng (Actors)

| Actor | Mô tả | Xác thực |
|---|---|---|
| **Super Admin** | Quản trị viên cao nhất, quản lý Admin | SQL seed khi deploy |
| **Admin** | Giảng viên / Biên soạn viên | Email/mật khẩu (Better Auth) |
| **Sinh viên** | Người dùng cuối chatbot | Google OAuth (email whitelist) |

**Cơ chế xác thực:** Better Auth + Prisma + PostgreSQL. Plugins: `organization()`, `admin()`, `openAPI()`. Sinh viên chỉ đăng nhập được nếu email Google có trong whitelist do trường quản lý.

---

## 3. Các Nhóm Tính Năng Chính

### 3.1 Quản Lý Tài Liệu (Admin)

- Upload: PDF, DOCX, PPTX (slide), Hình ảnh
- Video: chỉ gắn URL bên ngoài (YouTube / Google Drive) — không upload video
- Tự động chunking & embedding vào **Qdrant** bằng **Gemini Embedding** (đa ngôn ngữ Việt-Anh)
- Phân loại theo: Môn học → Chương → Chuyên ngành hẹp
- Xem danh sách tài liệu kèm trạng thái index (Đang chờ / Đang xử lý / Đã index / Thất bại)
- Muốn re-index: xóa file cũ → upload file mới (không có tính năng re-index tại chỗ)
- Giới hạn: **50MB/file**, **10 file/subject**

### 3.2 CRUD Syllabus (Admin — Dữ liệu có cấu trúc)

- CRUD thông tin môn học: Subject Code, tên, tín chỉ, mô tả, học kỳ, điều kiện tiên quyết, CLOs, lịch trình, tài liệu tham khảo, assessment scheme
- Dữ liệu syllabus có cấu trúc lưu trong **PostgreSQL** (không phải dạng embedding file)
- Assessment scheme: category, type, weight (%), completion criteria, duration, grading guide
- **1 Subject → N Syllabus** (nhiều phiên bản), tối đa **1 bản active** tại 1 thời điểm
- **Search syllabus**: chỉ cho phép tìm theo Subject Code (fuzzy search, **không list toàn bộ**)
  - Admin: thấy tất cả trạng thái; Sinh viên: chỉ thấy `is_active=True AND is_approved=True`
- **Vòng đời syllabus** dùng 2 flag: `is_active` + `is_approved`

| is_active | is_approved | Ý nghĩa |
|---|---|---|
| False | False | 📝 Bản nháp (mặc định khi tạo mới) |
| False | True | 🔒 Đã duyệt, chưa kích hoạt / bản cũ |
| True | True | ✅ Đang sử dụng (sinh viên thấy, chatbot dùng) |
| ~~True~~ | ~~False~~ | ⛔ **KHÔNG HỢP LỆ** |

### 3.3 Quản Lý Chương Trình Đào Tạo & Chuyên Ngành Hẹp (Admin)

- **Cấu trúc chương trình đào tạo**: 44 môn dùng chung + 4 môn đặc thù theo chuyên ngành hẹp (cho ngành SE)
- Mỗi chương trình đào tạo được xác định bằng ID (VD: `BIT_SE_NJS_19B`, `BIT_SE_NET_19B`)
- Dữ liệu chuyên ngành hẹp là **bí mật** — Admin phải tự thêm qua CRUD
- Tag chuyên ngành hẹp: chỉ gắn cho các môn đặc thù (từ kỳ 5 trở đi)

### 3.4 Chatbot Giới Hạn Theo Môn (Sinh viên)

- Chatbot được **giới hạn phạm vi trong môn đang xem** (syllabus + tài liệu upload)
- Kết hợp dữ liệu PostgreSQL có cấu trúc + vector search Qdrant
- Trích dẫn nguồn: tên file, chương, đoạn văn gốc
- Guardrails: từ chối ngoài phạm vi, không bịa, hỏi lại khi mơ hồ
- Giới hạn: **5.000 ký tự/câu hỏi**, **100 tin nhắn/phiên**, **3 phút timeout**

### 3.5 Xác Thực & Phân Quyền (FR-07)

- **Admin**: email/mật khẩu qua Better Auth
- **Sinh viên**: Google OAuth + email whitelist
- **Super Admin**: SQL seed khi deploy lần đầu
- Session management & quên mật khẩu: Better Auth default

---

## 4. Kiến Trúc Kỹ Thuật (Tóm tắt)

```
┌─────────────┐     ┌──────────────┐     ┌──────────────────────┐
│  Frontend   │────▶│  Backend API │────▶│  PostgreSQL           │
│  (Web App)  │◀────│  (REST/WS)   │     │  (Syllabus + Auth)   │
└─────────────┘     └──────┬───────┘     └──────────────────────┘
                           │
                    ┌──────▼───────┐     ┌──────────────────────┐
                    │  LLM Service │────▶│  Qdrant               │
                    │  (RAG Engine)│     │  (Gemini Embedding)   │
                    └──────────────┘     └──────────────────────┘
```

- **Dữ liệu có cấu trúc** → PostgreSQL → hiển thị trực tiếp trên web
- **Dữ liệu phi cấu trúc** → Qdrant (Gemini Embedding) → tìm kiếm ngữ nghĩa
- **Luồng RAG**: scope theo Subject Code → top-5 chunks Qdrant + structured data → LLM synthesize
- **Auth**: Better Auth + Prisma + PostgreSQL

---

## 5. Sản Phẩm Bàn Giao

| # | Sản phẩm | Mô tả |
|---|---|---|
| 1 | Ứng dụng Web Chatbot | Trang môn học + chatbot giới hạn + Dashboard admin |
| 2 | Mã nguồn + README | GitHub repo kèm hướng dẫn cài đặt |
| 3 | Bộ Test 50 câu hỏi | Happy case & edge case — đo Precision/Recall/F1 |

---

## 6. Tài Liệu Liên Quan

| Tài liệu | Đường dẫn | Mô tả |
|---|---|---|
| SRS Chi Tiết | [SRS_Detailed.md](file:///e:/FPT/Semester_7/SDN302/srs/SRS_Detailed.md) | Edge cases, business rules, data model đầy đủ |
| Use Case Diagrams | [use_case_diagrams.md](file:///e:/FPT/Semester_7/SDN302/srs/docs/use_case_diagrams.md) | Sơ đồ Use Case UML |
| User Flows | [user_flows.md](file:///e:/FPT/Semester_7/SDN302/srs/docs/user_flows.md) | Luồng người dùng chi tiết |
| Sequence Diagrams | [sequence_diagrams.md](file:///e:/FPT/Semester_7/SDN302/srs/docs/sequence_diagrams.md) | Sơ đồ tuần tự cho các luồng chính |
| MoSCoW Priorities | [moscow_priorities.md](file:///e:/FPT/Semester_7/SDN302/srs/docs/moscow_priorities.md) | Phân loại ưu tiên tính năng |
| UI/UX Specifications | [ui_ux_specifications.md](file:///e:/FPT/Semester_7/SDN302/srs/docs/ui_ux_specifications.md) | Mô tả giao diện và trải nghiệm |
| BA Review Report | [SRS_BA_Review_Report.md](file:///e:/FPT/Semester_7/SDN302/srs/docs/SRS_BA_Review_Report.md) | Báo cáo đánh giá SRS |

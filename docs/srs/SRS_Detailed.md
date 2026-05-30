# SRS — RAG Chatbot & Mini FLM (Bản Chi Tiết)

> **Dự án:** Chatbot hỏi đáp dựa trên tài liệu môn học (RAG) kết hợp trợ lý FLM mini
> **Môn học:** SDN302 — Đại học FPT
> **Phiên bản tài liệu:** 3.0 — 23/05/2026

---

## Mục Lục

1. [Tổng Quan Dự Án](#1-tổng-quan-dự-án)
2. [Vai Trò & Phân Quyền](#2-vai-trò--phân-quyền)
3. [Mô Hình Nghiệp Vụ — Logic Chương Trình Đào Tạo FPT](#3-mô-hình-nghiệp-vụ--logic-chương-trình-đào-tạo-fpt)
4. [Yêu Cầu Chức Năng](#4-yêu-cầu-chức-năng)
5. [Quy Tắc Nghiệp Vụ](#5-quy-tắc-nghiệp-vụ)
6. [Trường Hợp Ngoại Lệ & Xử Lý Lỗi](#6-trường-hợp-ngoại-lệ--xử-lý-lỗi)
7. [Yêu Cầu Phi Chức Năng](#7-yêu-cầu-phi-chức-năng)
8. [Mô Hình Dữ Liệu (Khái niệm)](#8-mô-hình-dữ-liệu-khái-niệm)
9. [Sản Phẩm Bàn Giao](#9-sản-phẩm-bàn-giao)
10. [Bảng Thuật Ngữ](#10-bảng-thuật-ngữ)

---

## 1. Tổng Quan Dự Án

### 1.1 Bối cảnh

Sinh viên FPT cần một công cụ hỏi đáp thông minh dựa trên tài liệu chính thức của từng môn học. Hiện tại, việc tra cứu thông tin syllabus, quy chế đánh giá, nội dung bài giảng phải đọc thủ công từ nhiều file PDF/DOCX. Dự án này xây dựng chatbot RAG giúp sinh viên hỏi bằng ngôn ngữ tự nhiên và nhận câu trả lời có trích dẫn nguồn.

### 1.2 Mục tiêu

- Xây dựng ứng dụng web chatbot sử dụng kiến trúc **Hybrid storage**: PostgreSQL (dữ liệu syllabus có cấu trúc) + Qdrant (embedding file phi cấu trúc)
- Hỗ trợ upload, quản lý tài liệu môn học với tự động chunking & embedding
- Chatbot trả lời chính xác **trong phạm vi từng môn học cụ thể** kèm trích dẫn nguồn
- Kiêm vai trò **trợ lý FLM mini** — trả lời về assessment scheme, trọng số điểm, CLOs, điều kiện tiên quyết
- Hiển thị dữ liệu syllabus có cấu trúc trực tiếp trên trang web, chatbot hỗ trợ hỏi đáp bên cạnh

### 1.3 Phạm vi

| Hạng mục | Chi tiết |
|---|---|
| **Thiết kế CSDL** | Bao quát toàn trường: tất cả ngành, chuyên ngành hẹp (combo), chương trình đào tạo |
| **Dữ liệu demo** | Toàn bộ môn chuyên ngành SE, học kỳ 1–9 |
| **Chính sách scope** | Mở — nhóm tự định nghĩa, tự review và hoàn thiện |

### 1.4 Ràng buộc

- Đồ án nhóm, phải demo sản phẩm hoạt động thực tế
- Phải có bộ test 50 câu hỏi + đáp án chuẩn để đánh giá định lượng
- Mã nguồn công khai trên GitHub kèm README

---

## 2. Vai Trò & Phân Quyền

### 2.1 Bảng vai trò

| Vai trò | Mô tả | Xác thực |
|---|---|---|
| **Super Admin** | Quản trị viên cao nhất, quản lý tài khoản Admin khác | Tạo thủ công bằng SQL seed khi deploy lần đầu |
| **Admin** | Giảng viên / Biên soạn viên quản lý môn học, tài liệu, chương trình đào tạo | Đăng nhập (email/mật khẩu) qua Better Auth |
| **Sinh viên** | Người dùng cuối sử dụng chatbot hỏi đáp | Đăng nhập Google OAuth (email `@fpt.edu.vn` được trường whitelist) |
| **Hệ thống** | Các tiến trình tự động (chunking, embedding, indexing) | Nội bộ (service account) |

### 2.2 Cơ chế xác thực

Hệ thống sử dụng **Better Auth** với cấu hình:

- **Adapter**: Prisma + PostgreSQL
- **Plugins**: `organization()`, `admin()`, `openAPI()`
- **Admin**: Đăng nhập bằng email/mật khẩu
- **Sinh viên**: Đăng nhập bằng Google OAuth. Chỉ email có trong danh sách whitelist của trường mới được phép đăng nhập
- **Super Admin đầu tiên**: Tạo thủ công bằng SQL seed khi deploy lần đầu
- **Session management**: Do Better Auth quản lý với cài đặt mặc định (JWT, refresh token, expiry)
- **Quên mật khẩu**: Do Better Auth xử lý với luồng mặc định

### 2.3 Ma trận quyền

| Tính năng | Super Admin | Admin | Sinh viên |
|---|---|---|---|
| Quản lý tài khoản Admin | ✅ | ❌ | ❌ |
| Quản lý danh sách email whitelist | ✅ | ❌ | ❌ |
| CRUD Ngành / Chuyên ngành hẹp | ✅ | ✅ | ❌ |
| CRUD Chương trình đào tạo | ✅ | ✅ | ❌ |
| CRUD Môn học (Syllabus) | ✅ | ✅ | ❌ |
| Phê duyệt / Kích hoạt syllabus | ✅ | ✅ | ❌ |
| Upload tài liệu | ✅ | ✅ | ❌ |
| Xem danh sách tài liệu & trạng thái index | ✅ | ✅ | ❌ |
| Search syllabus (tất cả trạng thái) | ✅ | ✅ | ❌ |
| Xem trang môn học (syllabus active+approved) | ✅ | ✅ | ✅ |
| Chat hỏi đáp (giới hạn theo môn) | ✅ | ✅ | ✅ |
| Xem lịch sử hội thoại | ✅ (tất cả) | ✅ (tất cả) | ✅ (của mình) |
| Xem trích dẫn nguồn | ✅ | ✅ | ✅ |

---

## 3. Mô Hình Nghiệp Vụ — Logic Chương Trình Đào Tạo FPT

### 3.1 Cấu trúc chương trình đào tạo

Chương trình ngành SE của Đại học FPT có cấu trúc như sau:

```
Trường Đại học
└── Ngành (VD: Software Engineering)
    └── Chuyên ngành hẹp / Combo (VD: React/NodeJS, .NET)
        └── Chương trình đào tạo (VD: BIT_SE_NJS_19B)
            └── 48 Môn học (44 môn chung + 4 môn đặc thù theo chuyên ngành hẹp)
                └── Mỗi môn có: Syllabus (nhiều phiên bản) + Tài liệu upload
```

**Các khái niệm chính:**
- **Ngành (Major)**: Lĩnh vực học rộng (VD: Software Engineering, Artificial Intelligence)
- **Chuyên ngành hẹp (Combo/Specialization)**: Nhánh chuyên sâu trong một ngành, sinh viên chọn từ **học kỳ 5**
- **ID Chương trình đào tạo**: Định dạng `BIT_{Ngành}_{Chuyên ngành hẹp}_{Khóa}` (VD: `BIT_SE_NJS_19B`, `BIT_SE_NET_19B`)
- Trước khi chọn chuyên ngành hẹp, có **4 slot môn trống** trong khung chương trình
- Sau khi chọn, 4 slot đó được điền bằng các môn đặc thù của chuyên ngành hẹp đã chọn
- **Không có môn nào thuộc 2 chuyên ngành hẹp khác nhau** — mỗi chuyên ngành hẹp có bộ 4 môn riêng biệt

### 3.2 Phân loại môn học

| Phân loại | Học kỳ | Cần tag chuyên ngành hẹp? | Ví dụ |
|---|---|---|---|
| **Đại cương / Nền tảng** | 0 (Dự bị), 1–4 | ❌ Không cần | PRF192, MAE101, DBI202, PRO192 |
| **Lõi SE (dùng chung)** | 5+ (chung cho mọi chuyên ngành hẹp) | ❌ Không cần | SWR302, SWT301, SWP391, SWD392 |
| **Đặc thù chuyên ngành hẹp** | 5, 7, 8 (chỉ 4 môn) | ✅ Gắn tag chuyên ngành hẹp | FER202 (NJS), PRN212 (.NET) |
| **Giáo dục đại cương (muộn)** | 8–9 | ❌ Không cần | MLN122, VNR202, HCM202 |

### 3.3 Ví dụ so sánh chuyên ngành hẹp (NJS vs .NET)

Dựa trên dữ liệu thực tế từ `BIT_SE_NJS_19B` và `BIT_SE_NET_19B`:

| Học kỳ | Chuyên ngành hẹp NodeJS | Chuyên ngành hẹp .NET |
|---|---|---|
| **Kỳ 5** | FER202 — Front-End web development with React | PRN212 — Basic Cross-Platform App Programming With .NET |
| **Kỳ 7** | SDN302 — Server-Side development with NodeJS | PRN222 — Advanced Cross-Platform App Programming With .NET |
| **Kỳ 7** | MMA301 — Multiplatform Mobile App Development | PRU213 — Game Programming with C# |
| **Kỳ 8** | WDP301 — Web Development Project | PRN232 — Building Cross-Platform Back-End App With .NET |

> **Lưu ý:** Dữ liệu chuyên ngành hẹp là **bí mật**, không thể crawl từ nguồn công khai. Admin phải tự nhập thông qua CRUD.

### 3.4 Vòng Đời Syllabus (Syllabus Lifecycle)

Hệ thống FPT FLM quản lý syllabus theo cơ chế **2 flag độc lập**: `is_active` và `is_approved`.

**Ràng buộc trạng thái:** `is_active=True` chỉ được phép khi `is_approved=True`. Không tồn tại trạng thái `is_active=True, is_approved=False`.

| is_active | is_approved | Trạng thái | Ý nghĩa | Sinh viên thấy? | Chatbot dùng? |
|---|---|---|---|---|---|
| `False` | `False` | 📝 **Bản nháp** | Mặc định khi tạo mới, chưa được phê duyệt | ❌ Không | ❌ Không |
| `False` | `True` | 🔒 **Đã duyệt, chưa kích hoạt** | Đã phê duyệt nhưng chưa public, hoặc bản cũ đã bị thay thế | ❌ Không | ❌ Không |
| `True` | `True` | ✅ **Đang sử dụng** | Syllabus chính thức, hiển thị cho sinh viên và chatbot | ✅ Có | ✅ Có |
| ~~`True`~~ | ~~`False`~~ | ⛔ **Không hợp lệ** | **KHÔNG ĐƯỢC PHÉP** — không thể active mà chưa approved | — | — |

**Nhận xét từ dữ liệu thực tế:**
- Syllabus ID có thể lên tới ~12.000+ vì hệ thống tích lũy từ lâu, bao gồm cả các bản không active/not approved
- FLM **chỉ cho search syllabus theo Subject Code**, không có tính năng list toàn bộ — đây là lý do tại sao search ra rất ít kết quả dù ID lớn
- Khi search `fer`, FLM trả về 2 bản: `FER202` (id=12580, active) và `FER201m` (id=9426) — đây là 2 Subject Code khác nhau, không phải 2 version của cùng 1 môn
- **Xóa vật lý (hard delete)**: chỉ thực hiện khi thực sự muốn xóa khỏi DB. Bình thường chỉ toggle `is_active=False` để ẩn
- Thiết kế 2 flag này **đã đủ tốt** → hệ thống của chúng ta áp dụng logic tương tự, không cần thiết kế lại

**Quan hệ Subject ↔ Syllabus: 1:N** — Mỗi Subject Code có thể có nhiều phiên bản syllabus trong DB (bản cũ inactive + bản mới active), nhưng chỉ **tối đa 1 bản `is_active=True`** tại 1 thời điểm.

**Quy trình tạo syllabus mới trong hệ thống:**
```
Admin tạo bản nháp → is_active=False, is_approved=False (mặc định)
       ↓
Admin/System phê duyệt → is_approved=True
       ↓
Admin kích hoạt → is_active=True (bản chính thức, hiện cho sinh viên)
       ↓
Khi thay thế bằng bản mới → bản cũ set is_active=False (ẩn khỏi hệ thống)
       ↓
Xóa thật sự (nếu cần) → Hard delete khỏi DB
```

### 3.5 Cấu trúc Syllabus (từ dữ liệu thực tế FPT FLM)

Mỗi syllabus môn học chứa các phần có cấu trúc như sau (dựa trên [FER202_details.json](file:///e:/FPT/Semester_7/SDN302/srs/data/20260522_133015_FER202_details.json)):

| Phần | Trường dữ liệu chính | Lưu trữ |
|---|---|---|
| **metadata** | syllabus_id, syllabus_name, subject_code, credits, degree_level, time_allocation, prerequisites, description, student_tasks, tools, scoring_scale, decision_no, is_approved, is_active, approved_date, min_avg_mark_to_pass | PostgreSQL |
| **materials** | description (URL/sách), author, publisher, isbn, is_main_material | PostgreSQL |
| **clos** (Chuẩn đầu ra) | clo_name, clo_details, lo_details | PostgreSQL |
| **schedule** (Kế hoạch giảng dạy) | session, topic, learning_method, lo, student_materials, student_tasks | PostgreSQL |
| **assessment_scheme** | category, type, part, **weight**, completion_criteria, duration, clo, question_type, knowledge_and_skill, grading_guide, note | PostgreSQL |
| **File upload** (PDF, DOCX, PPTX, Hình ảnh) | Nội dung text đã chunk | Qdrant (vector) |

---

## 4. Yêu Cầu Chức Năng

### FR-01: Quản Lý Ngành & Chuyên Ngành Hẹp

> **Actor:** Admin

| ID | Yêu cầu | Mô tả |
|---|---|---|
| FR-01.1 | CRUD Ngành | Tạo, cập nhật, xóa ngành (VD: Software Engineering, AI) |
| FR-01.2 | CRUD Chuyên ngành hẹp | Tạo, cập nhật, xóa chuyên ngành hẹp trong một ngành (VD: React/NodeJS, .NET) |
| FR-01.3 | CRUD Chương trình đào tạo | Tạo chương trình đào tạo với ID định dạng `BIT_{Ngành}_{CNHEP}_{Khóa}` và gán danh sách môn |
| FR-01.4 | Gán môn đặc thù | Gán 4 môn đặc thù của chuyên ngành hẹp vào chương trình đào tạo |
| FR-01.5 | Xem danh sách | Xem tất cả chương trình đào tạo kèm danh sách môn |

**Tiêu chí chấp nhận:**
- ID Chương trình đào tạo là duy nhất trong toàn hệ thống
- Mỗi chuyên ngành hẹp có đúng 4 môn đặc thù, không trùng với chuyên ngành hẹp khác
- Dữ liệu chuyên ngành hẹp chỉ Admin có thể thêm (không crawl được)
- Xóa chuyên ngành hẹp phải kiểm tra không còn môn nào liên kết (hoặc cảnh báo)

---

### FR-02: Quản Lý Môn Học (CRUD Syllabus)

> **Actor:** Admin

| ID | Yêu cầu | Mô tả |
|---|---|---|
| FR-02.1 | Tạo môn học (bản nháp) | Nhập thông tin syllabus có cấu trúc. Khi tạo mới: `is_active=False`, `is_approved=False` (bản nháp) |
| FR-02.2 | Phê duyệt syllabus | Admin phê duyệt bản nháp → `is_approved=True`. Ghi log: ai duyệt, lúc nào |
| FR-02.3 | Kích hoạt syllabus | Chỉ cho phép khi `is_approved=True`. Set `is_active=True`. Tự động deactivate tất cả bản cũ cùng Subject Code |
| FR-02.4 | Cập nhật môn học (sửa nhỏ) | Ghi đè trực tiếp bản ghi hiện tại (sửa typo, chỉnh note) |
| FR-02.5 | Vô hiệu hóa syllabus | Toggle `is_active=False` — ẩn khỏi hệ thống nhưng giữ lại trong DB |
| FR-02.6 | Xóa môn học (hard delete) | Xóa vật lý khỏi DB — chỉ thực hiện khi thực sự muốn xóa hoàn toàn |
| FR-02.7 | Xem chi tiết môn học | Hiển thị đầy đủ thông tin syllabus có cấu trúc trên 1 trang web scrollable (tham khảo UI FLM: `flm.fpt.edu.vn`) |
| FR-02.8 | Search syllabus (Admin) | Search bằng Subject Code (hỗ trợ fuzzy search). Admin thấy TẤT CẢ trạng thái (active, inactive, approved, unapproved). Kết quả dạng bảng với infinity scroll. Cột hiển thị: `Syllabus ID`, `Subject Code`, `Subject Name`, `Syllabus Name` (clickable link dẫn đến detail), `IsActive`, `IsApproved`, `DecisionNo MM/dd/yyyy`. Hỗ trợ sort & filter trên các cột. Frontend gợi ý: TanStack Virtual (`tanstack.com/virtual/latest`) cho infinity scroll |
| FR-02.9 | Search syllabus (Sinh viên) | Search bằng Subject Code. Chỉ thấy syllabus có `is_active=True AND is_approved=True` |
| FR-02.10 | Gắn tag chuyên ngành hẹp | Gắn tag chỉ cho các môn đặc thù của chuyên ngành hẹp (từ kỳ 5 trở đi). Các môn đại cương/nền tảng không cần gắn tag |
| FR-02.11 | Quản lý assessment scheme | Nhập thông tin đánh giá: category, type, weight (%), completion criteria, duration, CLO mapping, grading guide |

**Tiêu chí chấp nhận:**
- Subject Code là duy nhất trong toàn hệ thống
- Mỗi Subject Code chỉ có tối đa 1 syllabus với `is_active=True` tại 1 thời điểm
- Trạng thái `is_active=True, is_approved=False` KHÔNG HỢP LỆ — hệ thống phải block
- Khi tạo mới: khởi tạo với `is_active=False`, `is_approved=False`
- Khi kích hoạt bản mới: hệ thống tự động set `is_active=False` cho tất cả bản cũ cùng Subject Code
- Sửa lớn (thay đổi khung chương trình) → tạo Subject Code mới (VD: FER201m → FER202), bản cũ set `is_active=False`
- Tag chuyên ngành hẹp là tùy chọn — chỉ bắt buộc cho 4 môn đặc thù mỗi chương trình đào tạo
- Assessment scheme: tổng weight của tất cả thành phần phải = 100%
- Trường "weight" dùng định dạng phần trăm (VD: "15.0%", "30.0%")
- Admin search: thấy tất cả trạng thái, fuzzy match trên Subject Code
- Sinh viên search: chỉ thấy `is_active=True AND is_approved=True`

---

### FR-03: Upload & Xử Lý Tài Liệu

> **Actor:** Admin → Hệ thống

| ID | Yêu cầu | Mô tả |
|---|---|---|
| FR-03.1 | Upload file | Định dạng hỗ trợ: **PDF, DOCX, PPTX (slide), Hình ảnh (PNG, JPG, v.v.)** |
| FR-03.2 | Gắn video qua URL | Video KHÔNG upload — Admin dán URL bên ngoài (YouTube, Google Drive). Lưu dạng link, không embedding/chunking |
| FR-03.3 | Liên kết file với môn | Mỗi file upload phải gắn với 1 Subject Code + loại tài liệu (Slide / Tài liệu bổ sung / Hình ảnh) |
| FR-03.4 | Tự động Chunking | Hệ thống tách file thành các chunks ngay sau upload |
| FR-03.5 | Tự động Embedding | Mỗi chunk được chuyển thành vector embedding bằng **Gemini Embedding** và lưu vào **Qdrant** |
| FR-03.6 | Xem danh sách tài liệu | Admin xem file đã upload kèm trạng thái: `Đang chờ` → `Đang xử lý` → `Đã index` / `Thất bại` |
| FR-03.7 | Xóa tài liệu | Xóa file → xóa TOÀN BỘ chunks & embeddings liên quan khỏi Qdrant |
| FR-03.8 | Re-upload để re-index | Muốn re-index: Admin xóa file cũ rồi upload file mới. Không có thao tác re-index tại chỗ |

**Tiêu chí chấp nhận:**
- File upload có giới hạn dung lượng: **tối đa 50MB**
- Số file tối đa per subject: **10 file**
- Hệ thống validate: file không trống, đúng định dạng (kiểm tra MIME type)
- Trạng thái index cập nhật gần realtime
- Khi xóa tài liệu, mọi embedding phải được xóa sạch để chatbot không trả lời từ nội dung đã xóa
- URL video lưu dạng metadata, không đi qua pipeline RAG
- Embedding model: **Gemini Embedding** (`gemini-embedding-001` hoặc `gemini-embedding-2`) — hỗ trợ đa ngôn ngữ Việt-Anh

---

### FR-04: Trang Môn Học & Chatbot Giới Hạn Theo Môn

> **Actor:** Sinh viên

| ID | Yêu cầu | Mô tả |
|---|---|---|
| FR-04.1 | Xem trang môn học | Sinh viên mở một môn → thấy đầy đủ thông tin syllabus có cấu trúc hiển thị trên 1 trang web scrollable (metadata, CLOs, schedule, assessment scheme, tài liệu tham khảo). Layout tham khảo FLM: `flm.fpt.edu.vn/gui/role/student/SyllabusDetails` |
| FR-04.2 | Tạo phiên chat | Trên trang môn học, sinh viên mở chatbot **giới hạn trong môn đó** |
| FR-04.3 | Gửi tin nhắn | Nhập câu hỏi bằng ngôn ngữ tự nhiên (tiếng Việt / Anh). Tối đa **5.000 ký tự** |
| FR-04.4 | Nhận câu trả lời | Chatbot trả lời dựa trên: (a) dữ liệu syllabus có cấu trúc của môn đó + (b) tài liệu upload của môn đó |
| FR-04.5 | Chat có ngữ cảnh | Chatbot nhớ các tin nhắn trước trong cùng phiên để hiểu câu hỏi tiếp nối. Tối đa **100 tin nhắn/phiên** |
| FR-04.6 | Trích dẫn nguồn | Mỗi câu trả lời kèm block trích dẫn: tên file gốc, chương/mục, đoạn văn gốc |
| FR-04.7 | Xem lịch sử hội thoại | Sinh viên xem lại và tiếp tục các phiên chat cũ |
| FR-04.8 | Xóa phiên chat | Sinh viên có thể xóa phiên chat của mình |

**Tiêu chí chấp nhận:**
- Phạm vi chatbot giới hạn chặt chẽ trong dữ liệu của môn đang xem (syllabus + tài liệu)
- Việc giới hạn này tăng độ chính xác, tránh nhầm lẫn giữa các môn
- Thời gian phản hồi ≤ 10 giây trong điều kiện bình thường; timeout tối đa **3 phút**
- Trích dẫn phải dẫn đúng đến file/chương thực tế đã index
- Lịch sử hội thoại lưu trữ qua các lần đăng nhập
- Chỉ hiển thị chatbot cho syllabus có `is_active=True AND is_approved=True`

---

### FR-05: Trợ Lý FLM (Hỏi Đáp Assessment Scheme)

> **Actor:** Sinh viên

| ID | Yêu cầu | Mô tả |
|---|---|---|
| FR-05.1 | Hỏi về đánh giá | "FER202 thi cuối kỳ bao nhiêu %?" → Trả lời từ dữ liệu assessment_scheme có cấu trúc (trường weight) |
| FR-05.2 | Hỏi về điều kiện tiên quyết | "Học FER202 cần học trước môn nào?" → Trả lời từ metadata.prerequisites |
| FR-05.3 | Hỏi về tín chỉ | "FER202 bao nhiêu tín chỉ?" → Trả lời từ metadata.credits |
| FR-05.4 | Hỏi về CLOs | "FER202 có bao nhiêu CLO?" → Trả lời từ mảng clos |
| FR-05.5 | Hỏi về lịch trình | "FER202 session 36 học gì?" → Trả lời từ mảng schedule |
| FR-05.6 | Hỏi về công cụ/tài liệu | "FER202 dùng tool gì?" → Trả lời từ metadata.tools và mảng materials |

**Tiêu chí chấp nhận:**
- Truy vấn dữ liệu có cấu trúc phải chính xác 100% (so với đáp án chuẩn)
- Chatbot kết hợp dữ liệu PostgreSQL có cấu trúc với kết quả tìm kiếm vector Qdrant khi trả lời
- Khi câu hỏi có thể trả lời chỉ từ dữ liệu có cấu trúc, ưu tiên dùng trực tiếp để đảm bảo chính xác
- Dữ liệu đánh giá (assessment scheme) lấy từ PostgreSQL — không phụ thuộc vào vector search riêng cho phần này, nhưng kết hợp với vector search khi câu hỏi cần thêm ngữ cảnh từ tài liệu upload

---

### FR-06: Kiến Trúc RAG

> **Actor:** Hệ thống (nội bộ)

| ID | Yêu cầu | Mô tả |
|---|---|---|
| FR-06.1 | Giới hạn phạm vi | Mọi truy vấn RAG được giới hạn trước tiên theo Subject Code của môn đang xem |
| FR-06.2 | Kết hợp structured + vector | Chatbot kết hợp dữ liệu có cấu trúc từ PostgreSQL (syllabus, CLOs, assessment, schedule) VÀ kết quả tìm kiếm vector từ Qdrant (file upload). Không dùng SQL filtering cho RAG — dữ liệu syllabus show thẳng trên web, chatbot hỏi bên cạnh |
| FR-06.3 | Tìm kiếm vector | Câu hỏi về nội dung bài giảng / tài liệu → tìm **top-5 chunks** liên quan nhất trong Qdrant trong phạm vi môn đó |
| FR-06.4 | Kết hợp ngữ cảnh | Gộp dữ liệu có cấu trúc + kết quả tìm kiếm vector → truyền làm context cho LLM |
| FR-06.5 | Sinh câu trả lời bởi LLM | LLM chỉ sinh câu trả lời từ context được cung cấp. Tuyệt đối không tự bịa thông tin ngoài context |
| FR-06.6 | Hiển thị syllabus trên web | Dữ liệu syllabus có cấu trúc được hiển thị trực tiếp trên trang web — chatbot là công cụ hỏi đáp hỗ trợ bên cạnh, không phải kênh duy nhất để xem syllabus |
| FR-06.7 | Đa ngôn ngữ | Sử dụng Gemini Embedding (`gemini-embedding-001` / `gemini-embedding-2`) hỗ trợ đa ngôn ngữ Việt-Anh. Sinh viên có thể hỏi tiếng Việt về tài liệu tiếng Anh và ngược lại |
| FR-06.8 | Filter embedding theo trạng thái | Mỗi chunk trong Qdrant có metadata field `is_active`. Khi search, filter `is_active=True` → chunks từ syllabus inactive bị bỏ qua. Khi re-activate: chỉ cần update metadata, không cần re-embed |

**Tiêu chí chấp nhận:**
- Vector search trả về top-5 chunks liên quan nhất trong phạm vi môn
- LLM chỉ sinh câu trả lời từ context đã cung cấp (không hallucination)
- Trang môn học hiển thị thông tin syllabus dạng web dễ đọc, chatbot là công cụ hỗ trợ bên cạnh
- Cross-language: hỏi tiếng Việt tìm được tài liệu tiếng Anh và ngược lại

---

### FR-07: Quản Lý Người Dùng & Xác Thực

> **Actor:** Super Admin, Admin, Sinh viên

| ID | Yêu cầu | Mô tả |
|---|---|---|
| FR-07.1 | Đăng nhập Admin | Admin đăng nhập bằng email/mật khẩu qua Better Auth |
| FR-07.2 | Đăng nhập Sinh viên | Sinh viên đăng nhập bằng Google OAuth. Chỉ email trong whitelist mới được phép |
| FR-07.3 | Quản lý whitelist email | Super Admin/Admin quản lý danh sách email sinh viên được phép đăng nhập |
| FR-07.4 | Đăng xuất | Vô hiệu hóa session qua Better Auth |
| FR-07.5 | Quên mật khẩu | Luồng reset password mặc định của Better Auth (chỉ cho Admin) |
| FR-07.6 | Khởi tạo Super Admin | Tạo thủ công bằng SQL seed khi deploy lần đầu |
| FR-07.7 | Quản lý tài khoản Admin | Super Admin có thể tạo/xóa/vô hiệu hóa tài khoản Admin |

**Tiêu chí chấp nhận:**
- Email không có trong whitelist → từ chối đăng nhập Google OAuth, thông báo "Email chưa được trường cấp quyền"
- Session management, token expiry do Better Auth xử lý với cài đặt mặc định
- Super Admin được tạo 1 lần khi deploy, không tạo qua UI

---

## 5. Quy Tắc Nghiệp Vụ

| ID | Quy tắc | Mô tả |
|---|---|---|
| BR-01 | **Subject Code duy nhất** | Mỗi Subject Code là duy nhất trong toàn hệ thống. Không cho phép trùng. |
| BR-02 | **Sửa nhỏ = ghi đè CRUD** | Thay đổi nhỏ (typo, note) → cập nhật bản ghi hiện tại. Nếu thay đổi ảnh hưởng nội dung file upload, admin phải xóa và upload lại file. |
| BR-03 | **Sửa lớn = Subject Code mới** | Tái cấu trúc lớn (đổi khung chương trình, tách/gộp môn) → tạo Subject Code mới để cô lập context. |
| BR-04 | **Tag chuyên ngành hẹp là tùy chọn** | Chỉ các môn đặc thù của chuyên ngành hẹp (thường 4 môn mỗi chương trình đào tạo, từ kỳ 5+) mới cần tag. Các môn đại cương/nền tảng KHÔNG cần tag chuyên ngành hẹp. |
| BR-05 | **Tổng weight assessment = 100%** | Khi nhập assessment scheme, tổng weight của tất cả thành phần phải bằng 100%. Trường "weight" tương ứng với thuộc tính `weight` trong dữ liệu syllabus (VD: "15.0%", "30.0%"). |
| BR-06 | **Chatbot giới hạn theo môn** | Khi sinh viên ở trang một môn học, chatbot chỉ trả lời từ dữ liệu syllabus + tài liệu upload của môn đó. KHÔNG tham chiếu chéo sang môn khác. |
| BR-07 | **Xóa tài liệu = xóa sạch embedding** | Xóa file → tất cả chunks và embeddings trong Qdrant bị xóa. Chatbot không còn trả lời từ file đó. |
| BR-08 | **Vòng đời syllabus: 2 flag** | Mỗi syllabus có 2 flag độc lập: `is_active` và `is_approved`. Chỉ hiện cho sinh viên khi `is_active=True AND is_approved=True`. Hard delete chỉ khi thực sự muốn xóa vật lý khỏi DB. |
| BR-09 | **is_active yêu cầu is_approved** | Trạng thái `is_active=True, is_approved=False` **KHÔNG HỢP LỆ**. Hệ thống phải block. Mặc định khi tạo mới: `is_active=False, is_approved=False`. Chỉ khi `is_approved=True` mới cho phép `is_active=True`. |
| BR-10 | **1 active syllabus per Subject** | Mỗi Subject Code chỉ có tối đa 1 syllabus với `is_active=True` tại 1 thời điểm. Khi kích hoạt bản mới, hệ thống tự động deactivate tất cả bản cũ cùng Subject Code. |
| BR-11 | **Ẩn = vô hiệu hóa (is_active=False)** | Khi thay thế syllabus cũ, bản cũ set `is_active=False` — ẩn khỏi hệ thống nhưng vẫn tồn tại trong DB. |
| BR-12 | **File phải thuộc 1 môn** | Mỗi file upload phải liên kết đến đúng 1 Subject Code. Tối đa **10 file** per subject. |
| BR-13 | **Lịch sử chat theo người dùng** | Sinh viên chỉ xem được lịch sử chat của mình. Admin xem được tất cả. |
| BR-14 | **Video = URL bên ngoài** | Nội dung video lưu dạng URL link (YouTube / Google Drive), không bao giờ upload vào hệ thống hay xử lý qua RAG. |
| BR-15 | **Dữ liệu chuyên ngành hẹp là bí mật** | Thông tin chuyên ngành hẹp/combo không thể crawl từ nguồn công khai. Admin phải tự nhập qua CRUD. |
| BR-16 | **Re-index = xóa + upload lại** | Không có thao tác re-index tại chỗ. Muốn xử lý lại file, admin xóa file cũ rồi upload bản mới. |
| BR-17 | **Chương trình đào tạo = 44 chung + 4 đặc thù** | Mỗi chương trình đào tạo SE gồm 44 môn nền tảng/dùng chung và 4 môn đặc thù theo chuyên ngành hẹp. Không môn nào thuộc nhiều chuyên ngành hẹp cùng lúc. |
| BR-18 | **Embedding đa ngôn ngữ** | Hệ thống sử dụng Gemini Embedding (`gemini-embedding-001` / `gemini-embedding-2`) hỗ trợ đa ngôn ngữ Việt-Anh. Cross-language search hoạt động tự nhiên. |
| BR-19 | **Filter embedding theo trạng thái** | Khi syllabus bị vô hiệu hóa (`is_active=False`), embedding trong Qdrant **không bị xóa** nhưng được đánh dấu `is_active=False` trong metadata. Mọi query RAG đều filter `is_active=True`. Khi re-activate chỉ cần update metadata, không cần re-embed. |
| BR-20 | **Sinh viên phải có email trong whitelist** | Chỉ email Google được trường thêm vào whitelist mới đăng nhập được. Email không có trong whitelist bị từ chối. |

---

## 6. Trường Hợp Ngoại Lệ & Xử Lý Lỗi

### 6.1 Upload & Xử Lý Tài Liệu

| # | Tình huống | Xử lý mong đợi |
|---|---|---|
| EC-01 | File trống (0 byte) | Từ chối upload, lỗi: "File trống, vui lòng chọn file khác" |
| EC-02 | PDF scan ảnh (không có text layer) | Phát hiện khi chunking (text rỗng), đánh trạng thái `Thất bại`, thông báo: "File không chứa văn bản trích xuất được" |
| EC-03 | Sai định dạng (VD: .exe đổi đuôi .pdf) | Kiểm tra MIME type thực tế, từ chối nếu không khớp |
| EC-04 | File quá lớn (> 50MB) | Từ chối, hiển thị: "File vượt quá giới hạn 50MB" |
| EC-05 | Trùng tên file (cùng môn) | Cảnh báo Admin: "File trùng tên đã tồn tại cho môn này. Hãy xóa file cũ trước hoặc đổi tên." |
| EC-06 | Chunking/Embedding thất bại giữa chừng | Đánh trạng thái `Thất bại`, giữ file gốc, cho phép Admin xóa và upload lại |
| EC-07 | Upload nhiều file đồng thời | Hệ thống xử lý theo hàng đợi, mỗi file có trạng thái độc lập |
| EC-08 | URL video không hợp lệ | Validate định dạng URL, từ chối nếu không hợp lệ |
| EC-09 | Upload hình ảnh không có nội dung text | Lưu bình thường (hình ảnh là tài liệu bổ sung hợp lệ dù không có text), embedding mô tả/alt text nếu trích xuất được |
| EC-10 | Số file vượt quá 10 per subject | Từ chối upload, lỗi: "Đã đạt giới hạn 10 file cho môn này. Xóa file cũ trước khi upload thêm." |

### 6.2 Chatbot & RAG

| # | Tình huống | Xử lý mong đợi |
|---|---|---|
| EC-11 | Hỏi ngoài phạm vi môn | Chatbot nhận diện và từ chối khéo: "Mình chỉ trả lời được các câu hỏi về [Tên môn] thôi nhé. Bạn hỏi về nội dung môn này nhé." |
| EC-12 | Tìm kiếm vector không có kết quả | Chatbot báo: "Mình không tìm thấy thông tin liên quan trong tài liệu. Bạn thử hỏi cụ thể hơn nhé." → **Tuyệt đối không bịa** |
| EC-13 | Câu hỏi mơ hồ (không rõ chủ đề) | Chatbot hỏi lại: "Bạn có thể nói rõ hơn về chủ đề hoặc phần nào đang hỏi không?" |
| EC-14 | Dữ liệu cấu trúc và phi cấu trúc mâu thuẫn | Ưu tiên dữ liệu có cấu trúc (PostgreSQL), ghi rõ nguồn cho người dùng |
| EC-15 | Phiên chat quá dài (> 100 tin nhắn) | Thông báo: "Phiên chat đã đạt giới hạn 100 tin nhắn. Hãy tạo phiên mới." |
| EC-16 | Nhiều người dùng chat đồng thời | Mỗi phiên độc lập, không ảnh hưởng lẫn nhau |
| EC-17 | Hỏi về môn chưa có tài liệu upload | Trả lời từ dữ liệu syllabus có cấu trúc. Nếu câu hỏi cần nội dung tài liệu, phản hồi: "Hiện chưa có tài liệu bổ sung nào được upload cho môn này." |
| EC-18 | Sinh viên yêu cầu so sánh 2 môn | Chatbot giới hạn trong môn hiện tại. Phản hồi: "Mình chỉ trả lời được về [môn hiện tại]. Bạn vào trang môn kia để hỏi nhé." |
| EC-19 | Câu hỏi vượt quá 5.000 ký tự | Từ chối, thông báo: "Câu hỏi quá dài. Vui lòng rút gọn dưới 5.000 ký tự." |

### 6.3 Quản Lý Môn Học & Chương Trình Đào Tạo

| # | Tình huống | Xử lý mong đợi |
|---|---|---|
| EC-20 | Xóa chuyên ngành hẹp đang có môn liên kết | Cảnh báo: "Chuyên ngành hẹp này có [N] môn liên kết. Hãy gỡ liên kết trước khi xóa." Chặn xóa. |
| EC-21 | Tạo Subject Code trùng | Từ chối, lỗi: "Subject Code đã tồn tại" |
| EC-22 | Cập nhật dữ liệu syllabus khi chatbot đang hoạt động | Dữ liệu mới có hiệu lực ngay cho các truy vấn tiếp theo. Phiên chat đang hoạt động dùng dữ liệu mới nhất ở tin nhắn kế tiếp. |
| EC-23 | Search syllabus trả về nhiều Subject Code (VD: FER201m và FER202) | Cả 2 là Subject Code khác nhau. Hiển thị đủ cả 2 trong kết quả search, phân biệt rõ bằng Subject Code và Decision No. |
| EC-24 | Admin tìm kiếm syllabus nhưng Subject Code không tồn tại | Trả về: "Không tìm thấy syllabus cho mã môn này." Không báo lỗi hệ thống. |
| EC-25 | Admin cố kích hoạt syllabus chưa approved | Block, lỗi: "Syllabus phải được phê duyệt (is_approved=True) trước khi kích hoạt." |
| EC-26 | Kích hoạt syllabus mới khi đã có bản active cùng Subject Code | Tự động deactivate bản cũ, kích hoạt bản mới. Ghi log AuditLog. |
| EC-27 | Xóa môn có tài liệu đã upload | Xóa môn → tất cả file liên kết và embedding Qdrant cũng bị xóa |
| EC-28 | Tổng weight assessment scheme ≠ 100% | Từ chối lưu, lỗi: "Tổng weight phải bằng 100%. Hiện tại: [X]%" |
| EC-29 | Chương trình đào tạo có ít hơn hoặc nhiều hơn 4 môn đặc thù | Cảnh báo nếu ≠ 4, nhưng cho phép lưu (linh hoạt cho các trường hợp đặc biệt) |

### 6.4 Xác Thực & Phân Quyền

| # | Tình huống | Xử lý mong đợi |
|---|---|---|
| EC-30 | Sinh viên đăng nhập Google nhưng email không trong whitelist | Từ chối: "Email chưa được trường cấp quyền truy cập. Liên hệ admin để được hỗ trợ." |
| EC-31 | Token hết hạn | Better Auth tự động refresh. Nếu refresh token cũng hết hạn, redirect về trang đăng nhập. |
| EC-32 | Sinh viên cố truy cập API quản lý | Trả về HTTP 403 Forbidden |

### 6.5 Lỗi Hạ Tầng (Infrastructure Errors)

| # | Tình huống | Xử lý mong đợi |
|---|---|---|
| EC-33 | Qdrant không phản hồi | Chatbot hiển thị: "Dịch vụ tìm kiếm tạm thời không hoạt động. Bạn vẫn có thể xem thông tin syllabus trên trang." Trang syllabus vẫn hoạt động bình thường. |
| EC-34 | LLM timeout (> 3 phút) | Trả về lỗi: "Hệ thống đang xử lý lâu hơn bình thường. Vui lòng thử lại." Không treo UI vô hạn. |
| EC-35 | LLM rate limit | Hiển thị: "Hệ thống đang bận, vui lòng thử lại sau vài giây." |
| EC-36 | Chunking/Embedding queue bị tắc | Tự động đánh trạng thái `Thất bại` sau 10 phút. Admin có thể xóa và upload lại. |

---

## 7. Yêu Cầu Phi Chức Năng

| ID | Hạng mục | Yêu cầu |
|---|---|---|
| NFR-01 | **Hiệu năng** | Chatbot phản hồi ≤ 10 giây trong điều kiện bình thường; timeout tối đa 3 phút |
| NFR-02 | **Khả năng mở rộng** | Lược đồ CSDL hỗ trợ thêm ngành, chuyên ngành hẹp, chương trình đào tạo mà không cần thay đổi cấu trúc |
| NFR-03 | **Bảo mật** | Phân quyền theo vai trò: Super Admin / Admin / Sinh viên. Sinh viên không truy cập được API quản lý |
| NFR-04 | **Độ chính xác RAG** | Đo bằng bộ test 50 câu: Precision & Recall ≥ 80% (mục tiêu) |
| NFR-05 | **Xử lý bất đồng bộ** | Upload & indexing chạy async, không block giao diện |
| NFR-06 | **Trải nghiệm người dùng** | Giao diện chat responsive, hỗ trợ di động |
| NFR-07 | **Truy vết** | Mọi câu trả lời phải truy vết được đến file gốc + vị trí chunk |
| NFR-08 | **Toàn vẹn dữ liệu** | Dữ liệu syllabus có cấu trúc phải khớp chính xác với định dạng FPT FLM chính thức |
| NFR-09 | **Giới hạn kỹ thuật** | File upload: ≤ 50MB; Số file/subject: ≤ 10; Câu hỏi: ≤ 5.000 ký tự; Chat: ≤ 100 tin nhắn/phiên; Top-K RAG: 5 chunks; LLM timeout: 3 phút |
| NFR-10 | **Đa ngôn ngữ embedding** | Sử dụng Gemini Embedding (`gemini-embedding-001` / `gemini-embedding-2`) hỗ trợ đa ngôn ngữ Việt-Anh. Tham khảo: `ai.google.dev/gemini-api/docs/embeddings` |

---

## 8. Mô Hình Dữ Liệu (Khái niệm)

### 8.1 Tổng quan quan hệ thực thể

```
┌──────────────┐     1:N      ┌──────────────────┐
│  Ngành       │─────────────▶│  Chuyên ngành hẹp │
│  (Major)     │              │  (Specialization) │
└──────────────┘              └────────┬─────────┘
                                       │ 1:N
                              ┌────────▼─────────┐
                              │  Chương trình ĐT  │
                              │  (Curriculum)     │
                              │  BIT_SE_NJS_19B   │
                              └────────┬─────────┘
                                       │ N:M
┌──────────────┐              ┌────────▼─────────┐
│  Môn học     │◀────────────▶│ CurriculumSubject │
│  (Subject)   │              │ (slot theo kỳ)    │
└──────┬───────┘              └──────────────────┘
       │
       ├── 1:N ──▶ Syllabus (nhiều phiên bản, tối đa 1 active)
       │              ├── 1:N ──▶ CLO (chuẩn đầu ra)
       │              ├── 1:N ──▶ Schedule (kế hoạch giảng dạy)
       │              ├── 1:N ──▶ Material (tài liệu tham khảo)
       │              └── 1:N ──▶ AssessmentItem (weight, category...)
       │
       ├── 1:N ──▶ Document (file upload → Qdrant)
       │              └── 1:N ──▶ Chunk (vector embedding trong Qdrant)
       └── 0:N ──▶ VideoLink (URL bên ngoài)

┌──────────────┐     1:N      ┌──────────────┐
│  Người dùng  │─────────────▶│  Phiên Chat   │
│  (User)      │              │  (theo môn)   │
└──────┬───────┘              └──────┬───────┘
       │                             │ 1:N
       │                      ┌──────▼───────┐
       │                      │  Tin nhắn     │
       │                      │  (kèm trích dẫn)│
       │                      └──────────────┘
       │
       └── 1:N ──▶ AuditLog (lịch sử hành động)

┌──────────────┐
│  EmailWhitelist │ (danh sách email được phép đăng nhập)
└──────────────┘
```

### 8.2 Các thực thể chính

| Thực thể | Mô tả | Trường chính |
|---|---|---|
| **Major** | Ngành học | `id`, `code`, `name`, `description` |
| **Specialization** | Chuyên ngành hẹp trong một ngành | `id`, `majorId`, `code`, `name`, `description` |
| **Curriculum** | Chương trình đào tạo đầy đủ cho chuyên ngành hẹp+khóa | `id`, `curriculumId` (VD: `BIT_SE_NJS_19B`), `specializationId`, `batchCode` |
| **Subject** | Môn học | `id`, `subjectCode` (duy nhất), `name`, `credits`, `description`, `degreeLevel` |
| **CurriculumSubject** | N:M liên kết chương trình ĐT ↔ môn | `curriculumId`, `subjectId`, `semesterNo`, `isSpecializationSpecific` (boolean) |
| **Syllabus** | Phiên bản syllabus (1 Subject → N Syllabus) | `id`, `syllabusId` (từ FLM), `subjectId`, `syllabusName`, `timeAllocation`, `prerequisites`, `description`, `studentTasks`, `tools`, `scoringScale`, `decisionNo`, `isApproved`, `isActive`, `approvedDate`, `minAvgMarkToPass`, `approvedBy` (FK→User), `approvedAt` (timestamp), `createdBy` (FK→User), `createdAt`, `updatedAt` |
| **CLO** | Chuẩn đầu ra môn học | `id`, `syllabusId`, `cloName`, `cloDetails`, `loDetails` |
| **Schedule** | Kế hoạch giảng dạy theo session | `id`, `syllabusId`, `session`, `topic`, `learningMethod`, `lo`, `studentMaterials`, `studentTasks` |
| **Material** | Tài liệu tham khảo | `id`, `syllabusId`, `description`, `author`, `publisher`, `isbn`, `isMainMaterial` |
| **AssessmentItem** | Thành phần assessment scheme | `id`, `syllabusId`, `category` (Assignment/Labs/Exam/...), `type` (on-going/Final), `part`, `weight` (%), `completionCriteria`, `duration`, `clo`, `questionType`, `gradingGuide`, `note` |
| **Document** | File đã upload | `id`, `subjectId`, `fileName`, `fileType` (PDF/DOCX/PPTX/Image), `fileSize`, `docType` (Slide/Bổ sung/Hình ảnh), `status` (Đang chờ/Đang xử lý/Đã index/Thất bại), `uploadedAt`, `uploadedBy` |
| **Chunk** | Đoạn text từ tài liệu (lưu trong Qdrant) | `id`, `documentId`, `subjectCode`, `content`, `embedding` (vector), `chapterRef`, `pageRef`, `isActive` (mirror từ syllabus), `metadata` |
| **VideoLink** | Tham chiếu video bên ngoài | `id`, `subjectId`, `url`, `title`, `description` |
| **User** | Người dùng hệ thống | `id`, `email`, `name`, `role` (SuperAdmin/Admin/Student), `passwordHash`, `isActive` |
| **EmailWhitelist** | Email được phép đăng nhập | `id`, `email`, `addedBy` (FK→User), `addedAt` |
| **ChatSession** | Phiên hội thoại | `id`, `userId`, `subjectCode` (trường giới hạn phạm vi), `title`, `createdAt`, `updatedAt` |
| **Message** | Tin nhắn chat | `id`, `sessionId`, `role` (user/assistant), `content`, `citations[]`, `createdAt` |
| **AuditLog** | Lịch sử hành động | `id`, `userId`, `action` (APPROVE/DEACTIVATE/DELETE/UPLOAD...), `entityType` (Syllabus/Document/Subject), `entityId`, `details` (JSON), `createdAt` |

### 8.3 Kiến trúc lưu trữ

| Loại dữ liệu | Lưu trữ | Mục đích |
|---|---|---|
| Syllabus có cấu trúc (metadata, CLOs, schedule, assessment, materials) | **PostgreSQL** | Truy vấn chính xác, hiển thị web, trợ lý FLM trả lời |
| Nội dung file upload (PDF, DOCX, PPTX, text từ hình ảnh) | **Qdrant** (CSDL vector) | Tìm kiếm ngữ nghĩa cho hỏi đáp dựa trên tài liệu |
| Metadata file & trạng thái | **PostgreSQL** | Theo dõi trạng thái upload, liên kết với môn |
| Phiên chat & tin nhắn | **PostgreSQL** | Lưu trữ lịch sử hội thoại |
| Audit log | **PostgreSQL** | Ghi lịch sử hành động quản trị |

---

## 9. Sản Phẩm Bàn Giao

| # | Sản phẩm | Chi tiết |
|---|---|---|
| 1 | **Ứng dụng Web Chatbot** | Ứng dụng web hoạt động thực tế: trang môn học hiển thị syllabus + chatbot giới hạn theo môn. Dashboard admin cho CRUD & quản lý tài liệu. Backend PostgreSQL + Qdrant. |
| 2 | **Mã nguồn + README** | GitHub repo kèm README: hướng dẫn cài đặt CSDL, cấu hình env, chạy ứng dụng, tổng quan kiến trúc |
| 3 | **Bộ Test 50 câu hỏi** | Câu hỏi + đáp án chuẩn (do con người chuẩn bị). Bao phủ: Happy Case (câu hỏi bình thường về syllabus, assessment, nội dung bài giảng) + Edge Case (ngoài phạm vi, mơ hồ, không có dữ liệu). Chỉ số: Precision, Recall, F1 |

---

## 10. Bảng Thuật Ngữ

| Thuật ngữ | Giải thích |
|---|---|
| **RAG** | Retrieval-Augmented Generation — kiến trúc kết hợp tìm kiếm tài liệu + sinh câu trả lời bằng LLM |
| **Qdrant** | Cơ sở dữ liệu vector mã nguồn mở dùng để lưu trữ và tìm kiếm embedding tài liệu |
| **Chunking** | Chia tài liệu thành các đoạn text nhỏ (chunk) để embedding |
| **Embedding** | Chuyển đổi text thành vector số để tìm kiếm ngữ nghĩa |
| **Gemini Embedding** | Model embedding đa ngôn ngữ của Google (`gemini-embedding-001`, `gemini-embedding-2`) hỗ trợ Việt-Anh |
| **FLM** | Faculty Lecturing Management — hệ thống quản lý bài giảng và syllabus của Đại học FPT |
| **Better Auth** | Framework xác thực TypeScript dùng cho hệ thống, hỗ trợ JWT, OAuth, plugins |
| **Syllabus** | Tài liệu có cấu trúc mô tả nội dung, lịch trình, đánh giá, CLOs, tài liệu tham khảo của một môn |
| **Assessment Scheme** | Cơ cấu đánh giá của một môn: các thành phần (Assignment, Labs, Exam...), trọng số weight (%), tiêu chí hoàn thành |
| **CLO** | Course Learning Outcome — chuẩn đầu ra cụ thể của một môn học |
| **Ground Truth** | Bộ đáp án chuẩn do con người chuẩn bị dùng để đánh giá độ chính xác chatbot |
| **Hallucination** | LLM bịa ra thông tin không có trong tài liệu nguồn — phải ngăn chặn |
| **Subject Code** | Mã môn học duy nhất (VD: SDN302, FER202, SWP391) |
| **Chuyên ngành hẹp (Combo)** | Nhánh chuyên sâu trong một ngành gồm 4 môn đặc thù (VD: React/NodeJS, .NET) |
| **ID Chương trình đào tạo** | Mã định danh duy nhất cho toàn bộ khung chương trình: định dạng `BIT_{Ngành}_{CNHEP}_{Khóa}` (VD: `BIT_SE_NJS_19B`) |
| **Chatbot giới hạn theo môn** | Chatbot chỉ trả lời trong phạm vi dữ liệu của một môn học cụ thể |
| **Weight** | Trọng số phần trăm đóng góp của một thành phần đánh giá vào điểm cuối kỳ (VD: "30.0%") |
| **AuditLog** | Bảng ghi lại mọi hành động quản trị (phê duyệt, xóa, kích hoạt) để truy vết |
| **Email Whitelist** | Danh sách email Google được trường cấp quyền đăng nhập hệ thống |
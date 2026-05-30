# MoSCoW Priorities — RAG Chatbot & Mini FLM

> **Phiên bản:** 1.0 — 23/05/2026
> **Tham chiếu:** [SRS_Detailed.md](file:///e:/FPT/Semester_7/SDN302/srs/SRS_Detailed.md) | [BA Review Report](file:///e:/FPT/Semester_7/SDN302/srs/docs/SRS_BA_Review_Report.md)

---

## Phương pháp

Phân loại **MoSCoW** chia các tính năng thành 4 mức ưu tiên:

| Mức | Ý nghĩa | Dev nên làm khi nào? |
|---|---|---|
| **Must** | Bắt buộc — sản phẩm không chạy được nếu thiếu | Sprint 1–2, phải hoàn thành trước demo |
| **Should** | Nên có — quan trọng nhưng có giải pháp tạm thay thế | Sprint 2–3, hoàn thành trước final |
| **Could** | Có thể có — tăng chất lượng nhưng không ảnh hưởng core | Sprint 3+, nếu còn thời gian |
| **Won't (v1)** | Không làm trong phiên bản 1 — để cho tương lai | Backlog, không lên kế hoạch |

---

## 1. Must — Bắt Buộc

> Không có các tính năng này, sản phẩm không hoạt động được.

| FR | Tên | Lý do Must | Độ phức tạp |
|---|---|---|---|
| **FR-07** | Xác thực & Phân quyền | Không có auth → ai cũng truy cập mọi thứ | 🟡 Trung bình |
| FR-07.1 | Đăng nhập Admin | Admin cần đăng nhập để quản lý | 🟢 Thấp |
| FR-07.2 | Đăng nhập Sinh viên (Google OAuth) | SV cần đăng nhập để dùng chatbot | 🟡 Trung bình |
| FR-07.6 | Khởi tạo Super Admin (SQL seed) | Phải có Admin đầu tiên | 🟢 Thấp |
| **FR-02** | CRUD Syllabus | Core data — không có syllabus thì không có gì để hiển thị | 🔴 Cao |
| FR-02.1 | Tạo syllabus (bản nháp) | Phải có cách nhập dữ liệu | 🟡 Trung bình |
| FR-02.7 | Xem chi tiết syllabus | Trang chính của sinh viên | 🟡 Trung bình |
| FR-02.9 | Search syllabus (Sinh viên) | SV cần tìm được môn | 🟢 Thấp |
| **FR-03** | Upload & Xử Lý Tài Liệu | Không có tài liệu → chatbot không có gì để trả lời | 🔴 Cao |
| FR-03.1 | Upload file (PDF/DOCX/PPTX/Image) | Input chính cho RAG | 🟡 Trung bình |
| FR-03.4 | Auto Chunking | Pipeline RAG bắt buộc | 🔴 Cao |
| FR-03.5 | Auto Embedding (Gemini → Qdrant) | Pipeline RAG bắt buộc | 🔴 Cao |
| **FR-04** | Chatbot Giới Hạn Theo Môn | Sản phẩm chính — chatbot hỏi đáp | 🔴 Cao |
| FR-04.1 | Xem trang môn học | Màn hình chính SV | 🟡 Trung bình |
| FR-04.2 | Tạo phiên chat | Bắt đầu hỏi đáp | 🟢 Thấp |
| FR-04.3 | Gửi câu hỏi | Core chatbot | 🟢 Thấp |
| FR-04.4 | Nhận câu trả lời + trích dẫn | Core chatbot | 🔴 Cao |
| FR-04.5 | Chat có ngữ cảnh | Quan trọng cho UX | 🟡 Trung bình |
| **FR-06** | Kiến trúc RAG | Không có RAG → chatbot là chatGPT wrapper | 🔴 Cao |
| FR-06.1 | Giới hạn scope theo Subject Code | Accuracy yêu cầu | 🟡 Trung bình |
| FR-06.2 | Kết hợp structured + vector | Core architecture | 🔴 Cao |
| FR-06.3 | Vector search (top-5 chunks) | Core RAG | 🔴 Cao |
| FR-06.5 | LLM sinh câu trả lời | Core chatbot | 🟡 Trung bình |

**Tổng Must: 21 items**

---

## 2. Should — Nên Có

> Quan trọng nhưng sản phẩm vẫn demo được nếu thiếu.

| FR | Tên | Lý do Should | Độ phức tạp |
|---|---|---|---|
| FR-02.2 | Phê duyệt syllabus | Workflow quản lý — có thể skip ban đầu (trực tiếp set approved) | 🟢 Thấp |
| FR-02.3 | Kích hoạt syllabus | Lifecycle management | 🟢 Thấp |
| FR-02.5 | Vô hiệu hóa syllabus | Soft delete workflow | 🟢 Thấp |
| FR-02.8 | Search syllabus (Admin — full features) | Admin cần quản lý hiệu quả | 🟡 Trung bình |
| FR-03.6 | Xem danh sách tài liệu + trạng thái | Admin theo dõi upload | 🟢 Thấp |
| FR-03.7 | Xóa tài liệu + cleanup embedding | Quản lý nội dung | 🟡 Trung bình |
| FR-04.6 | Trích dẫn nguồn | Tăng trust, nhưng chatbot vẫn chạy được nếu thiếu | 🟡 Trung bình |
| FR-04.7 | Xem lịch sử hội thoại | UX quan trọng | 🟡 Trung bình |
| **FR-05** | Trợ lý FLM (assessment/prerequisites) | Giá trị gia tăng lớn nhưng chatbot RAG vẫn hoạt động nếu thiếu | 🟡 Trung bình |
| FR-06.7 | Đa ngôn ngữ (cross-language search) | Gemini Embedding hỗ trợ sẵn, nhưng cần test | 🟢 Thấp |
| FR-06.8 | Filter embedding theo trạng thái | Cần cho lifecycle đúng | 🟡 Trung bình |
| FR-07.3 | Quản lý whitelist email | Có thể seed bằng SQL ban đầu | 🟢 Thấp |
| FR-07.5 | Quên mật khẩu | Better Auth default, ít effort | 🟢 Thấp |

**Tổng Should: 13 items**

---

## 3. Could — Có Thể Có

> Nice-to-have — chỉ làm nếu còn thời gian.

| FR | Tên | Lý do Could | Độ phức tạp |
|---|---|---|---|
| **FR-01** | CRUD Ngành / Chuyên ngành hẹp / Chương trình ĐT | Demo chỉ cần SE, có thể seed data trực tiếp DB | 🟡 Trung bình |
| FR-02.4 | Cập nhật syllabus (sửa nhỏ) | Có thể sửa trực tiếp DB trong demo | 🟢 Thấp |
| FR-02.6 | Xóa syllabus (hard delete) | Ít dùng, deactivate là đủ | 🟢 Thấp |
| FR-02.10 | Gắn tag chuyên ngành hẹp | Chỉ cần cho 4 môn đặc thù | 🟢 Thấp |
| FR-02.11 | Quản lý assessment scheme (CRUD UI) | Có thể seed data, chưa cần CRUD UI | 🟡 Trung bình |
| FR-03.2 | Gắn video URL | Nice-to-have, chỉ metadata | 🟢 Thấp |
| FR-04.8 | Xóa phiên chat | UX nhỏ | 🟢 Thấp |
| FR-07.7 | Quản lý tài khoản Admin (CRUD UI) | Có thể dùng SQL | 🟢 Thấp |
| — | AuditLog (BR-19) | Ghi log quan trọng nhưng không ảnh hưởng core | 🟡 Trung bình |

**Tổng Could: 9 items**

---

## 4. Won't (v1) — Không Làm Trong Phiên Bản 1

> Để cho tương lai hoặc phiên bản nâng cấp.

| Tính năng | Lý do Won't |
|---|---|
| Search cross-subject (hỏi về nhiều môn 1 lúc) | Mâu thuẫn với BR-06 (chatbot giới hạn theo môn) |
| Multi-language UI (giao diện đa ngôn ngữ) | Scope quá lớn, nội dung hiện tại song ngữ tự nhiên |
| Analytics dashboard (thống kê sử dụng chatbot) | Nice-to-have, không phải core |
| Import/Export syllabus dạng JSON/CSV | Data seeding bằng script, không cần UI |
| Admin mobile app | Web responsive là đủ |
| Push notification | Không cần cho chatbot học thuật |
| AI-powered syllabus suggestion | Scope quá lớn |
| Integration với FLM thực tế (SSO) | Cần quan hệ với trường, ngoài scope đồ án |

---

## 5. Sprint Planning (Đề xuất)

### Sprint 1 (Week 1–2): Foundation

```
Must:
☐ FR-07.1: Đăng nhập Admin (Better Auth)
☐ FR-07.2: Đăng nhập SV (Google OAuth + whitelist)
☐ FR-07.6: SQL seed Super Admin
☐ FR-02.1: Tạo syllabus (bản nháp) — backend API
☐ FR-02.7: Xem chi tiết syllabus — trang web
☐ FR-02.9: Search syllabus (SV)
☐ Database schema + seed data
```

### Sprint 2 (Week 3–4): RAG Pipeline

```
Must:
☐ FR-03.1: Upload file
☐ FR-03.4: Auto Chunking
☐ FR-03.5: Auto Embedding (Gemini → Qdrant)
☐ FR-06.1–06.5: RAG pipeline (scope, search, merge, generate)
☐ FR-04.2–04.5: Chatbot UI + logic

Should:
☐ FR-04.6: Trích dẫn nguồn
☐ FR-03.6: Danh sách tài liệu + trạng thái
```

### Sprint 3 (Week 5–6): Polish + Test

```
Should:
☐ FR-05: Trợ lý FLM (assessment queries)
☐ FR-02.2, 02.3, 02.5: Lifecycle syllabus
☐ FR-02.8: Search Admin (full features)
☐ FR-03.7: Xóa tài liệu + cleanup
☐ FR-04.7: Lịch sử chat
☐ FR-06.7, 06.8: Multilingual + filter

Could:
☐ FR-01: CRUD Ngành/CNHEP/Chương trình ĐT
☐ AuditLog
☐ FR-07.3: Whitelist email UI
```

### Sprint 4 (Week 7–8): Test Suite + Demo

```
☐ Bộ Test 50 câu hỏi
☐ Đo Precision/Recall/F1
☐ Bug fixes & polish
☐ README + deployment guide
☐ Demo preparation
```

---

## 6. Bảng Tổng Hợp

| Mức ưu tiên | Số lượng | % tổng | Mô tả |
|---|---|---|---|
| **Must** | 21 | 49% | Core features — phải hoàn thành |
| **Should** | 13 | 30% | Important features — hoàn thành trước final |
| **Could** | 9 | 21% | Nice-to-have — nếu còn thời gian |
| **Won't** | 8 | — | Để cho v2 |
| **Tổng** | **43 + 8** | | |

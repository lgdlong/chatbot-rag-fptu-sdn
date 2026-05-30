# Báo Cáo Đánh Giá SRS — Business Analyst Review

> **Tài liệu được review:**
> - [SRS_Summary.md](file:///e:/FPT/Semester_7/SDN302/srs/SRS_Summary.md) — Bản tóm tắt
> - [SRS_Detailed.md](file:///e:/FPT/Semester_7/SDN302/srs/SRS_Detailed.md) — Bản chi tiết
>
> **Ngày review:** 22/05/2026
> **Phương pháp:** 7-Dimension SRS Quality Assessment (IEEE 830-based)
> **Dữ liệu tham chiếu thực tế:**
> - [`data/20260522_133015_FER202_details.json`](file:///e:/FPT/Semester_7/SDN302/srs/data/20260522_133015_FER202_details.json) — Syllabus FER202 đang active
> - [`data/20260522_223218_PRN232_details.json`](file:///e:/FPT/Semester_7/SDN302/srs/data/20260522_223218_PRN232_details.json) — Syllabus PRN232 inactive/unapproved
> - [`data/search_syllabus.md`](file:///e:/FPT/Semester_7/SDN302/srs/data/search_syllabus.md) — Kết quả search FLM thực tế
> - [`docs/curriculum_comparison_report.md`](file:///e:/FPT/Semester_7/SDN302/srs/docs/curriculum_comparison_report.md) — So sánh curriculum NJS vs .NET

---

## Mục Lục

1. [Đánh Giá Tổng Quan](#1-đánh-giá-tổng-quan)
2. [Lỗ Hổng Nghiêm Trọng (Critical Gaps)](#2-lỗ-hổng-nghiêm-trọng-critical-gaps)
3. [Lỗ Hổng Quan Trọng (Major Gaps)](#3-lỗ-hổng-quan-trọng-major-gaps)
4. [Cải Thiện Nên Có (Recommended Improvements)](#4-cải-thiện-nên-có-recommended-improvements)
5. [Ma Trận Tác Động](#5-ma-trận-tác-động)
6. [Điểm Mạnh Cần Giữ](#6-điểm-mạnh-cần-giữ)
7. [Kế Hoạch Hành Động](#7-kế-hoạch-hành-động)

---

## 1. Đánh Giá Tổng Quan

### 1.1 Bảng Điểm Theo 7 Chiều

| Chiều đánh giá | Điểm | Nhận xét |
|---|---|---|
| **Tính đầy đủ** (Completeness) | 7/10 | Tốt nhưng thiếu một số luồng nghiệp vụ quan trọng: auth flow, import data, UI layout |
| **Tính nhất quán** (Consistency) | 6/10 | Mâu thuẫn giữa data model (1:1) và business logic thực tế (1:N syllabus per subject) |
| **Tính rõ ràng** (Clarity) | 8/10 | Viết rõ, dễ hiểu, có ví dụ thực tế từ dữ liệu FLM crawl được |
| **Tính khả thi** (Feasibility) | 7/10 | Một số yêu cầu kỹ thuật chưa có giá trị cụ thể (giới hạn file, context window...) |
| **Tính kiểm chứng** (Testability) | 6/10 | Nhiều Acceptance Criteria còn định tính, thiếu giá trị đo lường cụ thể |
| **Tính truy vết** (Traceability) | 5/10 | Chưa có ma trận FR → Test Case; edge case numbering bị lộn xộn |
| **Tính ưu tiên** (Prioritization) | 4/10 | Chưa phân loại MoSCoW; dev không biết nên làm tính năng nào trước |

**Tổng điểm: 6.1 / 10**

> [!NOTE]
> Điểm 6.1/10 là mức tốt cho một SRS ở giai đoạn khởi đầu dựa trên dữ liệu thực tế crawl được. Tài liệu cần bổ sung trước khi bàn giao chính thức cho Frontend và Backend.

### 1.2 Phân Bổ Lỗ Hổng

```
🔴 Critical Gaps:   3 vấn đề (cần fix ngay trước khi dev bắt đầu)
🟠 Major Gaps:      6 vấn đề (cần fix trước khi giao team)
🟡 Improvements:   6 điểm cần cải thiện (nên có trong vòng tiếp theo)
```

---

## 2. Lỗ Hổng Nghiêm Trọng (Critical Gaps)

> [!CAUTION]
> Các lỗ hổng dưới đây nếu không được giải quyết có thể dẫn đến thiết kế sai kiến trúc hoặc phải refactor lớn sau này.

---

### GAP-01 — Thiếu Luồng Xác Thực & Phân Quyền Chi Tiết

**Mức độ:** 🔴 Critical | **Ảnh hưởng:** Frontend + Backend

#### Vấn đề phát hiện

Section 2.2 (Ma trận quyền) liệt kê quyền nhưng **không mô tả cơ chế xác thực** và vòng đời phiên làm việc:

| Câu hỏi chưa được trả lời | Lý do quan trọng |
|---|---|
| Ai tạo tài khoản Admin đầu tiên? | Backend cần biết để implement seed/init |
| Sinh viên Guest được làm gì? | Frontend cần biết để điều hướng trang |
| Session management: JWT hay Cookie? | Ảnh hưởng toàn bộ kiến trúc auth |
| Token hết hạn sau bao lâu? | UX & security design |
| Có tính năng "Quên mật khẩu" không? | Frontend cần thêm màn hình |
| Có Super Admin để quản lý Admin khác? | Thiếu có thể gây mất kiểm soát hệ thống |

#### Hiện trạng SRS

```
Mục 2.1 chỉ ghi:
- Admin: "Đăng nhập (email/mật khẩu)"
- Sinh viên: "Đăng nhập hoặc Guest (tùy cấu hình)"
```

Cụm từ **"tùy cấu hình"** không đủ rõ ràng để thiết kế.

#### Đề xuất bổ sung

Thêm FR mới: **FR-07: Quản Lý Người Dùng & Xác Thực**

```markdown
| FR-07.1 | Đăng nhập | Admin và Sinh viên đăng nhập bằng email/mật khẩu. Trả về JWT token. |
| FR-07.2 | Đăng xuất | Vô hiệu hóa token phía server. |
| FR-07.3 | Khởi tạo Admin đầu tiên | Seeded qua biến môi trường hoặc CLI script khi deploy lần đầu. |
| FR-07.4 | Quyền truy cập Guest | Guest (chưa đăng nhập) chỉ được xem trang môn học (syllabus). KHÔNG được chat. |
| FR-07.5 | Token management | JWT access token hết hạn sau [X] giờ. Refresh token hết hạn sau [Y] ngày. |
```

---

### GAP-02 — Quan Hệ Subject ↔ Syllabus Sai (1:1 → Nên Là 1:N)

**Mức độ:** 🔴 Critical | **Ảnh hưởng:** Backend (Database Schema)

#### Vấn đề phát hiện

Data Model (Section 8.1) khai báo:
```
Subject ── 1:1 ──▶ SyllabusMetadata
```

Nhưng dữ liệu thực tế từ FPT FLM chứng minh điều ngược lại:

| Subject Code | Syllabus ID | is_active | is_approved | Ghi chú |
|---|---|---|---|---|
| `FER202` | `12580` | True | True | Bản đang dùng |
| `FER201m` | `9426` | ? | ? | Bản cũ cùng tên môn |

Hơn nữa, **vòng đời syllabus** (Section 3.4) mô tả rõ cơ chế:
- Admin tạo bản nháp mới → `is_active=True`, `is_approved=False`
- Bản cũ được deactivate → `is_active=False`

Điều này có nghĩa **tại cùng 1 thời điểm, 1 Subject Code có thể có nhiều bản Syllabus** trong DB (chỉ 1 bản active tại 1 lúc). Quan hệ 1:1 là sai.

#### Mô hình đúng

```
Subject ── 1:N ──▶ Syllabus (nhiều phiên bản)
                      │
                      ├── ràng buộc: chỉ 1 bản có is_active=True tại 1 thời điểm
                      └── sort by: created_at DESC để lấy bản mới nhất
```

#### Đề xuất bổ sung Business Rule

> **BR-15 (mới):** Mỗi Subject Code chỉ được có tối đa **1 Syllabus** với `is_active=True` tại 1 thời điểm. Khi phê duyệt và kích hoạt bản mới, hệ thống tự động set `is_active=False` cho tất cả bản cũ của cùng Subject Code.

---

### GAP-03 — Entity SyllabusMetadata Thiếu Trường `is_approved`

**Mức độ:** 🔴 Critical | **Ảnh hưởng:** Backend (Database Schema)

#### Vấn đề phát hiện

**Section 3.4** và **BR-08** đều mô tả rõ cơ chế 2 flag:
```
is_active + is_approved → quyết định trạng thái syllabus
```

Nhưng Entity `SyllabusMetadata` trong **Section 8.2** chỉ có trường `isActive`, **thiếu hoàn toàn `isApproved`**.

#### Hiện trạng

```markdown
| SyllabusMetadata | ... | `subjectId`, `syllabusId`, `syllabusName`, ..., `isActive` |
                                                                          ↑
                                                               Thiếu isApproved ở đây!
```

#### Đề xuất bổ sung trường

Cập nhật entity `SyllabusMetadata` với các trường:

| Trường mới | Kiểu | Mô tả |
|---|---|---|
| `isApproved` | boolean | Đã được phê duyệt chính thức |
| `approvedBy` | FK → User | ID của người phê duyệt |
| `approvedAt` | timestamp | Thời điểm phê duyệt |
| `createdBy` | FK → User | ID của người tạo bản nháp |
| `createdAt` | timestamp | Thời điểm tạo |
| `updatedAt` | timestamp | Lần cập nhật cuối |

> Các trường audit này còn phục vụ cho EC-27 (ghi log phê duyệt) và BR-15.

---

## 3. Lỗ Hổng Quan Trọng (Major Gaps)

> [!WARNING]
> Các lỗ hổng dưới đây cần được làm rõ trước khi bàn giao tài liệu cho Frontend và Backend bắt đầu thiết kế.

---

### GAP-04 — Thiếu Use Case Diagram / User Flow

**Mức độ:** 🟠 Major | **Ảnh hưởng:** Frontend

#### Vấn đề

SRS chưa có bất kỳ **sơ đồ luồng nào** (Use Case, User Flow, Sequence Diagram). Frontend cần biết màn hình nào kết nối với màn hình nào, luồng điều hướng ra sao.

#### Ba luồng chính cần mô tả

**Luồng 1 — Admin quản lý tài liệu:**
```
Đăng nhập Admin
  → Dashboard Admin
  → Chọn môn học
  → Trang quản lý môn
  → Upload tài liệu
  → Xem trạng thái indexing (realtime)
  → Xem danh sách file đã index
```

**Luồng 2 — Sinh viên hỏi đáp:**
```
Trang chủ (danh sách môn học)
  → Chọn môn
  → Trang chi tiết môn (hiển thị syllabus có cấu trúc)
  → Mở chatbot (scoped theo môn)
  → Gửi câu hỏi
  → Nhận câu trả lời kèm trích dẫn
  → Xem lịch sử chat
```

**Luồng 3 — Admin quản lý syllabus:**
```
Đăng nhập Admin
  → Tạo bản nháp syllabus (is_active=True, is_approved=False)
  → Xem preview
  → Phê duyệt → is_approved=True (sinh viên thấy)
  → (Sau này) Vô hiệu hóa → is_active=False
```

#### Đề xuất

Bổ sung sơ đồ Mermaid vào SRS hoặc tạo file `docs/user_flows.md` riêng.

---

### GAP-05 — FR-02.7 Search Syllabus Còn Nhiều Điểm Mờ

**Mức độ:** 🟠 Major | **Ảnh hưởng:** Frontend + Backend

#### Câu hỏi chưa được trả lời

| Câu hỏi | Hiện tại trong SRS | Cần làm rõ |
|---|---|---|
| Admin search thấy bản nào? | Không rõ | Admin thấy TẤT CẢ (kể cả inactive/unapproved). Sinh viên chỉ thấy active+approved |
| Có hỗ trợ search gần đúng (fuzzy)? | Không đề cập | Quan trọng cho UX — VD gõ "fer" ra "FER202" |
| Có search bằng tên môn không? | Không đề cập | FLM thực tế chỉ search bằng Subject Code |
| Kết quả search hiển thị gì? | Không đề cập | Subject Code, tên, trạng thái, Decision No |
| Bao nhiêu kết quả tối đa? | Không đề cập | Pagination hay infinite scroll? |

#### Đề xuất cập nhật FR-02.7

```markdown
FR-02.7 | Search syllabus
- Admin: search bằng Subject Code (partial match), thấy TẤT CẢ trạng thái
- Sinh viên: search bằng Subject Code hoặc tên môn, chỉ thấy bản is_active=True AND is_approved=True
- Kết quả hiển thị: Subject Code, Tên môn, Trạng thái, Decision No, Ngày phê duyệt
- Không có trang list toàn bộ — phải search mới thấy (giống FLM thực tế)
```

---

### GAP-06 — Thiếu Giá Trị Kỹ Thuật Cụ Thể

**Mức độ:** 🟠 Major | **Ảnh hưởng:** Backend + RAG/AI

#### Danh sách giới hạn chưa xác định

| Giới hạn | Hiện tại | Cần xác định |
|---|---|---|
| Kích thước file upload tối đa | "VD: 50MB" | Giá trị thật? |
| Số file tối đa per subject | Không đề cập | Giới hạn để tránh lạm dụng |
| Độ dài câu hỏi tối đa | Không đề cập | Ảnh hưởng đến LLM prompt |
| Số tin nhắn tối đa per session | Không đề cập | Quản lý context window |
| Context window size LLM | Không đề cập | Kiến trúc RAG phụ thuộc vào đây |
| Số lượng phiên chat đồng thời | Không đề cập | Capacity planning |
| Top-K chunks trong vector search | Không đề cập | Ảnh hưởng chất lượng + latency |
| Thời gian timeout LLM | Không đề cập | UX khi LLM chậm |

#### Đề xuất

Thêm mục vào SRS_Detailed Section 7 (NFR):

```markdown
| NFR-09 | Giới hạn kỹ thuật | File upload: ≤ 50MB; Câu hỏi: ≤ 2.000 ký tự;
                               Top-K RAG: 5 chunks; LLM timeout: 30s;
                               Phiên chat tối đa: 100 tin nhắn/phiên |
```

---

### GAP-07 — Thiếu Edge Case Cho Infrastructure Failure

**Mức độ:** 🟠 Major | **Ảnh hưởng:** Backend + RAG/AI

#### Vấn đề

Hệ thống phụ thuộc vào **3 dịch vụ ngoài**: PostgreSQL, Qdrant, LLM Service. SRS không mô tả hành vi khi bất kỳ dịch vụ nào trong số này gặp sự cố.

#### Các tình huống thiếu

| Tình huống | Hành vi mong đợi (đề xuất) |
|---|---|
| Qdrant không phản hồi | Chatbot thông báo: "Dịch vụ tìm kiếm tạm thời không hoạt động. Bạn vẫn có thể xem thông tin syllabus trực tiếp trên trang." |
| LLM service timeout (> 30s) | Thông báo: "Hệ thống đang xử lý lâu hơn bình thường. Vui lòng thử lại." Không treo vô hạn. |
| LLM rate limit | Queue request hoặc thông báo "Hệ thống đang bận, thử lại sau X giây" |
| PostgreSQL downtime | Toàn bộ hệ thống không hoạt động. Hiển thị maintenance page. |
| Chunking queue bị tắc | Alert Admin qua dashboard, file giữ trạng thái "Đang xử lý" quá [Y] phút |

#### Đề xuất bổ sung

Thêm nhóm EC mới vào Section 6.4:

```markdown
### 6.4 Lỗi Hạ Tầng (Infrastructure Errors)

| EC-28 | Qdrant không phản hồi | Chatbot hiển thị thông báo lỗi thân thiện, trang syllabus vẫn hoạt động |
| EC-29 | LLM timeout | Trả về lỗi sau [30]s, không treo UI |
| EC-30 | LLM rate limit | Hiển thị thời gian chờ, queue request |
| EC-31 | Chunking stuck | Tự động đánh Failed sau [10] phút, cho phép Admin retry |
```

---

### GAP-08 — Hành Vi Cross-Language Chưa Được Xác Định

**Mức độ:** 🟠 Major | **Ảnh hưởng:** RAG/AI

#### Vấn đề

**FR-04.3** ghi sinh viên có thể hỏi bằng "tiếng Việt / Anh". Nhưng:

1. **Dữ liệu syllabus song ngữ:** Từ FPT FLM thực tế, trường `syllabus_name` chứa: `"Front-End web development with React_Phát triển web Front-End với React"` — text lẫn hai ngôn ngữ.

2. **Tài liệu upload chủ yếu bằng tiếng Anh** (slide, sách tham khảo từ FER202 đều là tiếng Anh).

3. **Sinh viên hỏi tiếng Việt → tìm kiếm trong tài liệu tiếng Anh** — cross-language embedding có thể ảnh hưởng chất lượng RAG nếu không xử lý đúng.

4. **Embedding model nào?** Multilingual model (VD: `multilingual-e5`) hay English-only? Ảnh hưởng trực tiếp đến độ chính xác.

#### Đề xuất bổ sung

Thêm vào SRS:
- **BR-16 (mới):** Hệ thống sử dụng embedding model đa ngôn ngữ hỗ trợ tiếng Việt và tiếng Anh. Khi tìm kiếm, query được embedding và so sánh với chunks bất kể ngôn ngữ.
- **NFR-10 (mới):** Embedding model phải hỗ trợ song ngữ Việt-Anh. Đề xuất: `multilingual-e5-large` hoặc tương đương.

---

### GAP-12 — Mâu Thuẫn Giữa EC-25 và BR-08a

**Mức độ:** 🟠 Major | **Ảnh hưởng:** Backend + RAG/AI

#### Vấn đề

Hai quy tắc đang **mâu thuẫn trực tiếp**:

| Nguồn | Nội dung |
|---|---|
| **BR-08a** | "Ẩn khỏi hệ thống nhưng **vẫn tồn tại trong DB**" khi `is_active=False` |
| **EC-25** | "**Khuyến nghị: xóa embedding** khi `is_active=False`" |

**Hệ quả của mâu thuẫn:**
- Nếu xóa embedding khi `is_active=False`: khi Admin muốn kích hoạt lại syllabus (`is_active=True`), toàn bộ embedding đã mất — phải re-upload và re-index toàn bộ file.
- Nếu giữ embedding: tốn storage nhưng có thể khôi phục ngay lập tức.

#### Quyết định đề xuất

**Không xóa embedding, chỉ filter bằng metadata trong Qdrant:**
- Mỗi chunk trong Qdrant có metadata field `is_active` (mirror từ syllabus)
- Khi search, thêm filter `is_active=True` vào query Qdrant → chunks từ syllabus inactive bị bỏ qua
- Khi re-activate syllabus: chỉ cần update metadata trong Qdrant, không cần re-embed

Cập nhật SRS:
- **Xóa khuyến nghị "xóa embedding" trong EC-25**
- **Bổ sung BR-17:** "Khi `is_active=False`, embedding trong Qdrant **không bị xóa** nhưng được đánh dấu `is_active=False` trong metadata. Mọi query RAG đều filter `is_active=True`."

---

### GAP-13 — Hành Vi Chatbot Với Syllabus Chưa Phê Duyệt

**Mức độ:** 🟠 Major | **Ảnh hưởng:** Frontend + Backend

#### Vấn đề

Khi syllabus ở trạng thái `is_active=True, is_approved=False` (bản nháp đang hoạt động), SRS không rõ:

| Câu hỏi | Chưa được trả lời |
|---|---|
| Sinh viên có thấy môn này trong danh sách không? | ❓ |
| Sinh viên có vào được trang môn học không? | ❓ |
| Chatbot có trả lời từ dữ liệu bản nháp không? | ❓ |
| Admin có thể preview bản nháp từ góc nhìn sinh viên không? | ❓ |

#### Đề xuất bổ sung Business Rules

```markdown
BR-18 (mới): HIỂN THỊ THEO TRẠNG THÁI SYLLABUS

| Trạng thái | Sinh viên thấy? | Admin thấy? | Chatbot dùng? |
|---|---|---|---|
| is_active=T, is_approved=T | ✅ Có | ✅ Có | ✅ Có |
| is_active=T, is_approved=F | ❌ Không | ✅ Có (preview) | ❌ Không |
| is_active=F, is_approved=T | ❌ Không | ✅ Có (archived) | ❌ Không |
| is_active=F, is_approved=F | ❌ Không | ✅ Có (draft cũ) | ❌ Không |
```

---

## 4. Cải Thiện Nên Có (Recommended Improvements)

> [!NOTE]
> Các điểm dưới đây không phải lỗi nghiêm trọng nhưng sẽ cải thiện đáng kể chất lượng tài liệu và quá trình phát triển.

---

### GAP-09 — Thiếu Phân Loại Ưu Tiên MoSCoW

**Mức độ:** 🟡 | **Ảnh hưởng:** Kế hoạch phát triển

SRS hiện tại không phân biệt tính năng nào bắt buộc, nên có, hay có thể bỏ. Đề xuất phân loại:

| MoSCoW | Tính năng |
|---|---|
| **Must (Bắt buộc)** | FR-02 (CRUD Syllabus + Lifecycle), FR-03 (Upload & Indexing), FR-04 (Subject Page + Chatbot), FR-06 (RAG Architecture) |
| **Should (Nên có)** | FR-01 (Ngành/CNHEP CRUD), FR-05 (FLM Assistant), FR-07 (Auth) |
| **Could (Có thể có)** | FR-02.2 (Phê duyệt syllabus đầy đủ), Video URL, AuditLog |
| **Won't (v1 không làm)** | Search cross-subject, Multi-language UI, Analytics dashboard |

---

### GAP-10 — Data Model Thiếu Entity AuditLog

**Mức độ:** 🟡 | **Ảnh hưởng:** Backend

EC-27 yêu cầu "ghi log hành động phê duyệt" nhưng không có entity `AuditLog` trong data model.

**Đề xuất thêm entity:**

```markdown
| AuditLog | Lịch sử hành động | `id`, `userId`, `action` (APPROVE/DEACTIVATE/DELETE/UPLOAD...),
                                 `entityType` (Syllabus/Document/Subject),
                                 `entityId`, `details` (JSON), `createdAt` |
```

---

### GAP-11 — Thiếu FR Cho Import Dữ Liệu Ban Đầu

**Mức độ:** 🟡 | **Ảnh hưởng:** Backend

Scope yêu cầu ingest toàn bộ môn SE kỳ 1–9. Dữ liệu đã crawl sẵn dạng JSON trong thư mục `data/`. Nhưng không có FR nào mô tả:
- Import bulk từ JSON (sử dụng file đã crawl)
- Validate dữ liệu import
- Xử lý trùng lặp khi import

**Đề xuất:** Thêm ghi chú vào SRS: "Việc seed dữ liệu ban đầu sẽ thực hiện bằng migration script đọc từ `data/*.json`, không qua UI. Script phải validate Subject Code unique, xử lý duplicate."

---

### GAP-14 — Thiếu Mô Tả UI Layout Cho Trang Môn Học

**Mức độ:** 🟡 | **Ảnh hưởng:** Frontend

FR-04.1 yêu cầu "hiển thị đầy đủ thông tin syllabus" nhưng dữ liệu thực tế từ FER202 cho thấy syllabus rất dài:

| Section | Độ dài ước tính |
|---|---|
| metadata | ~15 trường |
| CLOs | 9 CLOs |
| schedule | 60 sessions (rất dài!) |
| assessment_scheme | 5 thành phần |
| materials | 3+ tài liệu |

Frontend cần biết cách xử lý dữ liệu dài này:
- Tất cả trên 1 trang scrollable?
- Dùng tabs (Overview / Schedule / Assessment / Materials)?
- Schedule có pagination hay accordion?

**Đề xuất:** Thêm mô tả layout vào FR-04.1 hoặc tạo file `docs/ui_wireframes.md`.

---

### GAP-15 — Edge Case Numbering Bị Lộn Xộn

**Mức độ:** 🟡 Cosmetic | **Ảnh hưởng:** Đọc tài liệu

Thứ tự EC trong Section 6.3 không liên tục: `EC-18, EC-19, EC-20, EC-24, EC-25, EC-26, EC-27, EC-21, EC-22, EC-23`

EC-24→27 được chèn giữa EC-20 và EC-21 do được bổ sung sau.

**Đề xuất:** Sắp xếp lại thứ tự EC từ EC-18 đến EC-27 liên tục.

---

## 5. Ma Trận Tác Động

| GAP | Mức độ | Frontend | Backend | RAG/AI | Ưu tiên |
|---|---|---|---|---|---|
| GAP-01 (Auth flow) | 🔴 | Cao | Cao | Không | **P1** |
| GAP-02 (1:1 → 1:N) | 🔴 | Không | Rất Cao | Trung bình | **P1** |
| GAP-03 (isApproved thiếu) | 🔴 | Không | Cao | Không | **P1** |
| GAP-04 (Use Case Diagram) | 🟠 | Cao | Trung bình | Không | **P2** |
| GAP-05 (Search spec) | 🟠 | Cao | Cao | Không | **P2** |
| GAP-06 (Kỹ thuật limits) | 🟠 | Trung bình | Trung bình | Cao | **P2** |
| GAP-07 (Infrastructure EC) | 🟠 | Trung bình | Cao | Cao | **P2** |
| GAP-08 (Cross-language) | 🟠 | Không | Không | Rất Cao | **P2** |
| GAP-12 (EC-25 vs BR-08a) | 🟠 | Không | Cao | Cao | **P2** |
| GAP-13 (Draft visibility) | 🟠 | Cao | Cao | Trung bình | **P2** |
| GAP-09 (MoSCoW) | 🟡 | Trung bình | Trung bình | Không | **P3** |
| GAP-10 (AuditLog) | 🟡 | Không | Trung bình | Không | **P3** |
| GAP-11 (Import FR) | 🟡 | Không | Trung bình | Không | **P3** |
| GAP-14 (UI Layout) | 🟡 | Cao | Không | Không | **P3** |
| GAP-15 (EC numbering) | 🟡 | Không | Không | Không | **P4** |

---

## 6. Điểm Mạnh Cần Giữ

> [!TIP]
> Những điểm dưới đây là điểm mạnh thực sự của SRS hiện tại — không cần thay đổi, chỉ cần bảo tồn khi cập nhật.

| # | Điểm mạnh | Lý do đánh giá cao |
|---|---|---|
| 1 | **Domain model FPT rất chính xác** | Dựa trực tiếp trên dữ liệu crawl từ FLM thực tế (FER202, PRN232, curriculum JSON) |
| 2 | **Edge cases phong phú (27 trường hợp)** | Cover nhiều tình huống thực tế: PDF scan không có text, context overflow, chat đồng thời |
| 3 | **Vòng đời syllabus 2-flag** | Phân tích đúng logic FPT FLM (is_active + is_approved) dựa trên bằng chứng thực tế |
| 4 | **Business Rules có ID rõ ràng** | 14+ rules với ID dễ trace, dễ tham chiếu trong code review |
| 5 | **Chatbot scoped per-subject** | Quyết định thiết kế đúng đắn — tăng accuracy, giảm hallucination |
| 6 | **Phân tách storage đúng** | PostgreSQL cho structured data, Qdrant cho unstructured — hợp lý về kỹ thuật |
| 7 | **Curriculum model 44+4** | Mô tả chính xác cơ chế chuyên ngành hẹp FPT với bằng chứng từ data thực |
| 8 | **Thuật ngữ nhất quán** | Có Bảng Thuật Ngữ riêng, các khái niệm được định nghĩa rõ |

---

## 7. Kế Hoạch Hành Động

> **Cập nhật 23/05/2026:** Tất cả GAP đã được fix trong SRS v3.0 và các tài liệu bổ sung.

### Giai đoạn 1 — Trước khi dev bắt đầu (P1) ✅ HOÀN TẤT

```
☑ Fix GAP-02: Đổi Subject ↔ Syllabus từ 1:1 thành 1:N → SRS_Detailed.md Section 8
☑ Fix GAP-03: Thêm isApproved, approvedBy, approvedAt → SRS_Detailed.md Section 8.2
☑ Fix GAP-01: Bổ sung FR-07 (Auth) → Better Auth + Google OAuth whitelist
☑ Thêm BR-09, BR-10 (is_active requires is_approved, 1 active per Subject)
```

### Giai đoạn 2 — Trước khi giao Frontend (P2) ✅ HOÀN TẤT

```
☑ Fix GAP-04: docs/use_case_diagrams.md + docs/user_flows.md + docs/sequence_diagrams.md
☑ Fix GAP-13: Thêm BR-09 (is_active=T, is_approved=F KHÔNG HỢP LỆ) + visibility matrix
☑ Fix GAP-14: docs/ui_ux_specifications.md (single scrollable page, wireframes)
☑ Fix GAP-05: FR-02.8 + FR-02.9 (Admin vs Student search, fuzzy, table columns)
```

### Giai đoạn 3 — Trước khi giao Backend & RAG team (P2) ✅ HOÀN TẤT

```
☑ Fix GAP-06: NFR-09 (50MB, 10 files, 5000 chars, 100 msgs, top-5, 3min timeout)
☑ Fix GAP-07: EC-33 đến EC-36 (Qdrant down, LLM timeout, rate limit, queue stuck)
☑ Fix GAP-08: BR-18 + NFR-10 (Gemini Embedding multilingual)
☑ Fix GAP-12: BR-19 (filter approach — không xóa embedding, chỉ filter metadata)
```

### Giai đoạn 4 — Nice to have (P3-P4) ✅ HOÀN TẤT

```
☑ GAP-09: docs/moscow_priorities.md (MoSCoW + sprint planning)
☑ GAP-10: AuditLog entity trong SRS_Detailed.md Section 8.2
☑ GAP-11: Ghi chú: data seeding do user tự xử lý, DB schema validate business rules
☑ GAP-15: EC numbering liên tục EC-01 → EC-36
```

### Tài liệu bổ sung đã tạo

| Tài liệu | Đường dẫn |
|---|---|
| Use Case Diagrams | [use_case_diagrams.md](file:///e:/FPT/Semester_7/SDN302/srs/docs/use_case_diagrams.md) |
| User Flows | [user_flows.md](file:///e:/FPT/Semester_7/SDN302/srs/docs/user_flows.md) |
| Sequence Diagrams | [sequence_diagrams.md](file:///e:/FPT/Semester_7/SDN302/srs/docs/sequence_diagrams.md) |
| MoSCoW Priorities | [moscow_priorities.md](file:///e:/FPT/Semester_7/SDN302/srs/docs/moscow_priorities.md) |
| UI/UX Specifications | [ui_ux_specifications.md](file:///e:/FPT/Semester_7/SDN302/srs/docs/ui_ux_specifications.md) |

---

*Tài liệu review này được tạo ngày 22/05/2026. Cập nhật: 23/05/2026 — Tất cả GAP đã được fix.*


# SRS Detailed — Academic RAG Assistant

> Phiên bản: 1.0  
> Cập nhật: 2026-06-23

## 1. Mục tiêu

Xây dựng một trợ lý học tập cho sinh viên FPT, kết hợp:

- syllabus dạng web dễ đọc
- syllabus-scoped chat dùng RAG
- quản trị học liệu và syllabus có business logic nghiêm túc

## 2. Scope chính thức

### In scope

- syllabus mini theo môn học
- quản lý theo `môn học`, không quản lý theo `chương`
- search bằng `subject code` hoặc tên môn
- chat theo `1 selected syllabus/workspace`
- upload `PDF`
- lecturer quản trị nội dung, xem syllabus và chat theo syllabus được chọn
- admin quản trị tài khoản lecturer và whitelist student

### Out of scope

- lecturer request / self-registration như một legacy route bị khóa, không còn flow chính thức
- video RAG
- DOCX/PPTX/Image trong release A
- quản lý tài liệu theo chương
- document versioning riêng
- payment / subscription
- cross-subject chat

## 3. Actors và quyền

| Role | Login | Quyền |
|---|---|---|
| `ADMIN` | Email/password | Tạo lecturer, disable lecturer, quản whitelist |
| `LECTURER` | Email/password | CRUD syllabus, view syllabus detail, open chat theo syllabus được chọn, upload/delete PDF |
| `STUDENT` | Google OAuth + whitelist | Search, xem syllabus, chat, xem history |
| `SYSTEM` | Nội bộ | Tạo snapshot syllabus từ DB, sync AnythingLLM, retrieval, answer/refusal |

## 4. Business model

### 4.1 Subject và syllabus

- Một `subject` có nhiều `syllabus version`
- Chỉ tối đa `1 syllabus active` tại một thời điểm
- Student chỉ thấy syllabus `approved + active`

### 4.2 Lifecycle

| Trạng thái | isApproved | isActive |
|---|---:|---:|
| Draft | false | false |
| Approved but hidden | true | false |
| Published | true | true |

### 4.3 Document scope

- Mỗi `syllabus` có đúng `1 snapshot markdown canonical` sinh từ dữ liệu DB
- Mỗi `PDF` gắn với đúng một syllabus
- Snapshot syllabus và các PDF của syllabus đó cùng nằm trong đúng `1 workspace` của syllabus
- Chatbot chỉ truy xuất trong phạm vi syllabus/workspace đang mở
- Không quản lý document theo `chương`
- Không có version riêng cho document trong Release A

## 5. Functional requirements

### FR-01. Authentication

| ID | Requirement |
|---|---|
| FR-01.1 | Student login bằng Google |
| FR-01.2 | Chặn student nếu email chưa whitelist |
| FR-01.3 | Lecturer login bằng email/password |
| FR-01.4 | Admin login bằng email/password |
| FR-01.5 | Logout |

### FR-02. Student learning flow

| ID | Requirement |
|---|---|
| FR-02.1 | Search môn theo subject code hoặc tên môn |
| FR-02.2 | Chỉ show kết quả public cho student |
| FR-02.3 | Xem subject detail page |
| FR-02.4 | Hiển thị structured syllabus đầy đủ |

### FR-03. Syllabus management

| ID | Requirement |
|---|---|
| FR-03.1 | List syllabus quản trị |
| FR-03.2 | Create syllabus draft |
| FR-03.3 | Edit syllabus |
| FR-03.4 | Approve syllabus |
| FR-03.5 | Activate syllabus |
| FR-03.6 | Deactivate syllabus |
| FR-03.7 | Validate assessment total = 100% |
| FR-03.8 | Minor patch update | Cho phép sửa nhỏ bằng cách cập nhật trực tiếp một số field của syllabus hiện tại |
| FR-03.9 | Lecturer xem syllabus detail theo từng syllabus được chọn |

### FR-04. Document management

| ID | Requirement |
|---|---|
| FR-04.1 | Upload PDF |
| FR-04.2 | Validate PDF type/size/empty |
| FR-04.3 | Async ingest |
| FR-04.4 | View document status |
| FR-04.5 | Delete document |
| FR-04.6 | Re-upload để re-index |

### FR-05. Syllabus chat

| ID | Requirement |
|---|---|
| FR-05.1 | Open chat trong trang syllabus đang chọn |
| FR-05.2 | Tạo session chat theo đúng syllabus/workspace đang mở |
| FR-05.3 | Gửi câu hỏi |
| FR-05.4 | Giữ ngữ cảnh trong cùng session |
| FR-05.5 | Trả về citation |
| FR-05.6 | Xem history của chính user |
| FR-05.7 | Xóa session chat |
| FR-05.8 | Trả lời đúng thông tin assessment | Nếu câu hỏi hỏi về assessment, hệ thống trả lời đúng theo dữ liệu assessment đang lưu trong snapshot syllabus hiện hành của workspace |
| FR-05.9 | Lecturer có thể open chat cho syllabus được chọn để phục vụ tra cứu/biên soạn/chỉnh sửa |

### FR-06. Admin governance

| ID | Requirement |
|---|---|
| FR-06.1 | Xem danh sách lecturer |
| FR-06.2 | Tạo lecturer thủ công |
| FR-06.3 | Disable lecturer |
| FR-06.4 | Xem whitelist |
| FR-06.5 | Thêm email whitelist |
| FR-06.6 | Xóa email whitelist |

### FR-07. RAG internal

| ID | Requirement |
|---|---|
| FR-07.1 | Mỗi syllabus có workspace/scope riêng trong AnythingLLM |
| FR-07.2 | Hệ thống sinh `snapshot markdown` từ dữ liệu syllabus trong DB |
| FR-07.3 | Snapshot syllabus được sync vào AnythingLLM như một loại document trong workspace của syllabus |
| FR-07.4 | PDF được sync vào đúng workspace của syllabus |
| FR-07.5 | Retrieval chỉ trong phạm vi syllabus/workspace đang mở |
| FR-07.6 | Trả lời từ snapshot syllabus và/hoặc tài liệu PDF của đúng syllabus đang mở | Nếu câu hỏi hỏi về assessment, snapshot syllabus là nguồn chuẩn trong workspace |
| FR-07.7 | Từ chối an toàn nếu không có context phù hợp |

## 6. Business rules

| ID | Rule |
|---|---|
| BR-01 | Chat chỉ theo `1 selected syllabus/workspace` |
| BR-02 | Student chỉ thấy syllabus `approved + active` |
| BR-03 | Mỗi subject chỉ có tối đa `1 syllabus active` |
| BR-04 | Activate mới phải auto deactivate bản cũ |
| BR-05 | `lecturer request` chỉ còn là legacy route bị khóa, không phải flow nghiệp vụ chính thức |
| BR-06 | Chỉ `ADMIN` được quản whitelist |
| BR-07 | Release A chỉ cho user upload `PDF`; `syllabus snapshot` do hệ thống tự sinh từ DB |
| BR-08 | Không có video trong core |
| BR-09 | Delete document thì chatbot không được dùng lại nội dung đó |
| BR-10 | Update syllabus phải regenerate và replace `snapshot markdown` tương ứng trong workspace |
| BR-11 | Nếu syllabus thay đổi lớn thì tạo `subject code` mới |
| BR-12 | Nếu thay đổi nhỏ thì patch trực tiếp các field của syllabus hiện tại |
| BR-13 | Assessment phải được trả lời đúng theo dữ liệu đang lưu trong snapshot syllabus hiện hành, không suy diễn thêm |
| BR-14 | Nếu snapshot syllabus và PDF mâu thuẫn nhau thì syllabus snapshot được xem là nguồn chuẩn hơn cho thông tin syllabus |

## 7. Edge cases

| ID | Tình huống | Kỳ vọng |
|---|---|---|
| EC-01 | Student chưa whitelist | Từ chối login |
| EC-02 | Assessment total != 100% | Chặn lưu |
| EC-03 | Upload không phải PDF | Từ chối upload |
| EC-04 | PDF quá lớn | Từ chối upload |
| EC-05 | PDF không trích xuất được text | Failed ingest |
| EC-06 | AnythingLLM ingest lỗi | File ở trạng thái failed |
| EC-07 | Hỏi ngoài phạm vi môn | Refusal chuyên biệt |
| EC-08 | Không tìm thấy context | Fallback an toàn |
| EC-09 | Session chat quá dài | Yêu cầu tạo phiên mới |
| EC-10 | Lecturer bị disable | Không login được |
| EC-11 | Câu hỏi assessment nhưng dữ liệu assessment thiếu | Trả lời theo phần dữ liệu hiện có, không tự bịa phần còn thiếu |
| EC-12 | Update syllabus nhưng sync snapshot sang AnythingLLM lỗi | Workspace tạm thời chưa dùng bản syllabus mới, hệ thống phải báo trạng thái sync lỗi để retry |

## 8. NFR

| ID | Yêu cầu |
|---|---|
| NFR-01 | Role-based access đúng |
| NFR-02 | Subject detail phải dùng được ngay cả khi không mở chat |
| NFR-03 | Upload/index phải async |
| NFR-04 | Câu trả lời phải truy nguồn được |
| NFR-05 | Kiến trúc mở rộng được sang multi-format ở Release B |
| NFR-06 | Snapshot syllabus trong workspace phải đồng bộ kịp thời sau khi syllabus thay đổi |

### Giới hạn kỹ thuật Release A

| Hạng mục | Giá trị |
|---|---|
| File type | PDF |
| File size | <= 50MB |
| Documents per syllabus | <= 10 |
| Question length | <= 5000 ký tự |
| Messages per session | <= 100 |

## 9. Screen inventory

- `Login`
- `Student Search`
- `Student Subject Detail`
- `Course Chat Panel`
- `Lecturer Syllabus List`
- `Lecturer Syllabus Detail`
- `Create Syllabus`
- `Edit Syllabus`
- `Document Manager`
- `Lecturer Management`
- `Student Whitelist Management`

## 10. Demo data scope

- Database design hỗ trợ mở rộng toàn trường
- Demo data chốt ở các môn chuyên ngành `SE`, học kỳ `1-8`

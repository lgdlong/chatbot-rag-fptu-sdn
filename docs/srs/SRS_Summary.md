# SRS Summary — Academic RAG Assistant

> Phiên bản: 1.0  
> Cập nhật: 2026-06-23

## 1. Product chính thức của Release A

Web app cho phép:

- `STUDENT` tìm môn học theo `subject code` hoặc tên môn
- `STUDENT` xem syllabus public
- `STUDENT` chat hỏi đáp trong phạm vi đúng `1 syllabus/workspace` public đang mở
- `LECTURER` tạo, sửa, duyệt, kích hoạt syllabus
- `LECTURER` xem syllabus và chat với syllabus đang chọn để phục vụ tra cứu/chỉnh sửa
- `LECTURER` upload tài liệu `PDF`
- `SUPER_ADMIN` quản lecturer và whitelist student

## 2. Source of truth

| Hạng mục | Chốt chính thức |
|---|---|
| RAG engine | `AnythingLLM` |
| Chat scope | `1 selected syllabus/workspace only` |
| Upload core | `PDF only` |
| Tổ chức tài liệu | Chỉ theo `môn học`, không theo `chương` |
| Syllabus trong RAG | `Snapshot markdown` sinh từ DB và sync vào workspace |
| Video | Không thuộc core |
| Document versioning | Không có version riêng trong Release A |
| Lecturer onboarding | `SUPER_ADMIN` tạo thủ công |
| Payment | Loại khỏi scope |

## 3. Role model

| Role | Trách nhiệm |
|---|---|
| `SUPER_ADMIN` | Tạo/disable lecturer, quản whitelist student |
| `LECTURER` | Quản syllabus, xem syllabus, chat theo syllabus đã chọn, quản document |
| `STUDENT` | Search, xem syllabus, chat |
| `SYSTEM` | Đồng bộ snapshot syllabus + PDF vào AnythingLLM và xử lý chat |

## 4. Screen inventory cần có

### Student

- `Login`
- `Student Search`
- `Student Subject Detail`
- `Course Chat Panel`

### Lecturer

- `Lecturer Syllabus List`
- `Lecturer Syllabus Detail`
- `Create Syllabus`
- `Edit Syllabus`
- `Document Manager`

### Super Admin

- `Lecturer Management`
- `Student Whitelist Management`

## 5. Release boundary

### Release A

- Auth theo role
- Search môn
- Subject detail page
- Syllabus/workspace-scoped chat
- PDF upload
- Syllabus snapshot sync vào AnythingLLM
- Manual lecturer management
- Student whitelist management
- Minor patch update cho syllabus hiện tại
- Trả lời chính xác thông tin assessment đang có

### Release B

- Multi-format upload
- Video knowledge
- Curriculum UI
- Audit UI nâng cao

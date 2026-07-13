# FPT FLM Syllabus Data

Tập dữ liệu syllabus được crawl từ hệ thống FLM (flm.fpt.edu.vn) của Đại học FPT.

## Cấu trúc thư mục

```
subjects/
├── README.md                    ← File này
├── manifest.json                ← Trạng thái toàn bộ subjects
├── docs/                        ← Tài liệu hướng dẫn gốc
│   ├── HUONG_DAN_SU_DUNG.md     ← Hướng dẫn crawl
│   ├── BAO_CAO_GIAI_PHAP.md     ← Báo cáo giải pháp kỹ thuật
│   ├── THIET_KE_CSDL.md         ← Thiết kế database (PostgreSQL + MongoDB)
│   └── schema.dbml              ← Sơ đồ ERD (dbdiagram.io)
│
├── <SubjectCode>/               ← Mỗi môn học 1 folder
│   ├── <Timestamp>_<Code>_details.json    ← Dữ liệu cấu trúc
│   └── <Timestamp>_<Code>_details.xlsx    ← Excel 7 sheets
│
├── EXE101/
│   ├── 20260522_132151_EXE101_details.json
│   ├── 20260522_132151_EXE101_details.xlsx
│   └── ...
├── PRF192/
├── SDN302/
└── ...
```

## File naming

- `<YYYYMMDD>_<HHMMSS>_<SubjectCode>_details.json` — Giữ nguyên tên từ lúc crawl
- Mỗi subject có thể có nhiều file (nhiều lần crawl khác nhau)
- File có timestamp mới nhất là bản crawl gần đây nhất

## Cấu trúc JSON (7 sections)

| Key | Mô tả | Số lượng field |
|-----|-------|:---:|
| `metadata` | Thông tin chung môn học | 18 fields |
| `materials` | Tài liệu giáo cụ | 10 fields/item |
| `clos` | Chuẩn đầu ra môn học (CLO) | 3 fields/item |
| `schedule` | Lịch trình buổi học | 9 fields/item |
| `constructive_questions` | Câu hỏi kiến tạo (Edunext) | 3 fields/item |
| `assessment_scheme` | Bảng phân bổ điểm | 12 fields/item |
| `references` | Tài liệu tham khảo | list of strings |

### Metadata fields (18)

`syllabus_id`, `syllabus_name`, `syllabus_name_english`, `subject_code`, `credits`, `degree_level`, `time_allocation`, `prerequisites`, `description`, `student_tasks`, `tools`, `scoring_scale`, `decision_no`, `approved_date`, `min_avg_mark_to_pass`, `is_active`, `is_approved`, `note`

### Assessment Scheme fields (12)

`category`, `type`, `part`, `weight`, `completion_criteria`, `duration`, `clo`, `question_type`, `no_question`, `knowledge_and_skill`, `grading_guide`, `note`

### Schedule fields (9)

`session`, `topic`, `learning_method`, `lo`, `itu`, `student_materials`, `s_download`, `student_tasks`, `urls`

## manifest.json

File `manifest.json` tracking toàn bộ subjects đã crawl, bao gồm trạng thái (`crawled`/`failed`/`pending`), thời gian, phương pháp crawl, và đường dẫn file.

## Seed vào project khác

Copy toàn bộ thư mục `subjects/` này vào project mới, tham khảo `docs/` để biết chi tiết import vào database (PostgreSQL / MongoDB theo `THIET_KE_CSDL.md`).

---

**Nguồn**: FLM (flm.fpt.edu.vn) — Hệ thống Quản lý Syllabus Đại học FPT
**Crawl date**: July 2026

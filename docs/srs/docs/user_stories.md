# User Stories

> Phiên bản: 1.0  
> Cập nhật: 2026-06-23

## Student

| ID | Story |
|---|---|
| US-ST-01 | Là `STUDENT`, tôi muốn login bằng Google để dùng hệ thống |
| US-ST-02 | Là `STUDENT`, tôi muốn tìm môn bằng subject code |
| US-ST-03 | Là `STUDENT`, tôi muốn đọc syllabus trên web |
| US-ST-04 | Là `STUDENT`, tôi muốn mở chat ngay trong trang môn |
| US-ST-05 | Là `STUDENT`, tôi muốn nhận câu trả lời có citation |
| US-ST-06 | Là `STUDENT`, tôi muốn chat giữ ngữ cảnh trong cùng phiên |
| US-ST-07 | Là `STUDENT`, tôi muốn xem lại lịch sử chat |
| US-ST-08 | Là `STUDENT`, tôi muốn hệ thống từ chối khi tôi hỏi ra ngoài môn hiện tại |

## Lecturer

| ID | Story |
|---|---|
| US-LE-01 | Là `LECTURER`, tôi muốn login bằng tài khoản được cấp |
| US-LE-02 | Là `LECTURER`, tôi muốn tạo syllabus draft |
| US-LE-03 | Là `LECTURER`, tôi muốn sửa syllabus |
| US-LE-04 | Là `LECTURER`, tôi muốn approve syllabus |
| US-LE-05 | Là `LECTURER`, tôi muốn activate syllabus |
| US-LE-06 | Là `LECTURER`, tôi muốn upload PDF |
| US-LE-07 | Là `LECTURER`, tôi muốn thấy trạng thái ingest file |
| US-LE-08 | Là `LECTURER`, tôi muốn xóa document cũ |
| US-LE-09 | Là `LECTURER`, tôi muốn hệ thống validate assessment total = 100% |

## Super Admin

| ID | Story |
|---|---|
| US-SA-01 | Là `SUPER_ADMIN`, tôi muốn tạo lecturer thủ công |
| US-SA-02 | Là `SUPER_ADMIN`, tôi muốn disable lecturer |
| US-SA-03 | Là `SUPER_ADMIN`, tôi muốn xem danh sách lecturer |
| US-SA-04 | Là `SUPER_ADMIN`, tôi muốn thêm email student vào whitelist |
| US-SA-05 | Là `SUPER_ADMIN`, tôi muốn xóa email khỏi whitelist |

## System

| ID | Story |
|---|---|
| US-SYS-01 | Là `SYSTEM`, tôi muốn sync PDF vào AnythingLLM theo scope môn |
| US-SYS-02 | Là `SYSTEM`, tôi muốn retrieval chỉ trong phạm vi một môn |
| US-SYS-03 | Là `SYSTEM`, tôi muốn từ chối an toàn nếu không có context |

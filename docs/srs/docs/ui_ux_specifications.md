# Screen Inventory Cho Frontend

> Phiên bản: 1.0  
> Cập nhật: 2026-06-23

## 1. Login

### Mục tiêu

- Cho `STUDENT` login Google
- Cho `LECTURER` và `SUPER_ADMIN` login email/password

### Thành phần

- Google login CTA
- Email input
- Password input
- Quản trị login CTA
- Error area

## 2. Student Search

### Mục tiêu

Search theo `subject code` hoặc tên môn

### Thành phần

- Search input
- Result list
- Empty state

## 3. Student Subject Detail

### Mục tiêu

Đọc syllabus đầy đủ trên web

### Thành phần

- Metadata
- CLOs
- Schedule
- Assessment
- Materials
- Nút mở chat

## 4. Course Chat Panel

### Mục tiêu

Hỏi đáp trong đúng một syllabus/workspace đang chọn

### Thành phần

- Header có `subject code` + trạng thái syllabus
- Session list/history
- Message list
- Citation block
- Input/send

### Ghi chú role

- `STUDENT` chỉ mở panel này từ syllabus public `approved + active`
- `LECTURER` mở panel này từ syllabus đang chọn để tra cứu/chỉnh sửa

### States

- idle
- loading
- answered
- refusal
- error

## 5. Lecturer Syllabus List

### Mục tiêu

Landing page của lecturer

### Thành phần

- Search/filter
- Table syllabus
- Create button
- Row actions: view, edit, approve, activate, deactivate, documents

## 6. Create Syllabus

### Mục tiêu

Tạo draft mới

### Form sections

- Metadata
- CLOs
- Schedule
- Assessment
- Materials

### CTA

- Lưu draft
- Hủy

## 7. Edit Syllabus

### Mục tiêu

Chỉnh sửa nội dung và lifecycle

### Điểm khác với create

- Hiển thị trạng thái draft/approved/active
- Có action approve
- Có action activate/deactivate
- Có link sang document manager

## 8. Lecturer Syllabus Detail

### Mục tiêu

Cho `LECTURER` xem syllabus theo dạng đọc và mở chat trên đúng syllabus đang làm việc

### Thành phần

- Metadata
- CLOs
- Schedule
- Assessment
- Materials
- Nút mở chat

## 9. Document Manager

### Mục tiêu

Quản lý tài liệu `PDF` của đúng syllabus đang chọn

### Thành phần

- Upload zone
- PDF constraints hint
- Document list
- Status badges
- Delete action

### Status

- PENDING
- PROCESSING
- COMPLETED
- FAILED

### Ghi chú

- `Syllabus snapshot markdown` là tài liệu hệ thống sinh tự động, không phải file user upload

## 10. Lecturer Management

### Role

`SUPER_ADMIN only`

### Mục tiêu

Thay thế hoàn toàn flow lecturer request

### Thành phần

- Lecturer table
- Create lecturer button
- Create lecturer modal/form
- Disable lecturer action

### Form fields

- Full name
- Email
- Temporary password
- Notes

## 11. Student Whitelist Management

### Role

`SUPER_ADMIN only`

### Mục tiêu

Kiểm soát student access

### Thành phần

- Email search
- Whitelist table
- Add email form
- Bulk import mock option
- Remove action

# API Reference Index

Trang này là mục lục ngắn cho `docs/api/`.

> [!IMPORTANT]
> Scope sản phẩm chính thức nằm ở [../srs/README.md](../srs/README.md).
> Không dùng `docs/api/` để suy ra feature scope nếu chưa đối chiếu SRS.

## Modules

1. [00_auth.md](./00_auth.md) - Xác thực Better Auth & Quản lý Whitelist.
2. [00_system.md](./00_system.md) - Kiểm tra trạng thái máy chủ (Healthcheck).
3. [00_courses.md](./00_courses.md) - Quản lý Danh mục Môn học.
4. [00_curriculum.md](./00_curriculum.md) - Khung Chương Trình Đào Tạo (Major, Spec, Curriculum).
5. [00_syllabus.md](./00_syllabus.md) - Đề cương chi tiết môn học (Syllabus).
6. [00_documents.md](./00_documents.md) - Tài liệu bài giảng PDF & Ingestion RAG.
7. [00_chat.md](./00_chat.md) - Hội thoại Chatbot RAG.

## Ghi Chú

- flow `lecturer request` đã bị loại khỏi business scope
- payment/subscription đã bị loại khỏi business scope
- nếu backend còn route legacy, không tự động xem đó là feature chính thức

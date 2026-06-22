# HỆ THỐNG CHATBOT RAG HỖ TRỢ HỌC TẬP FPTU
## Bản Đồ Tài Liệu Chính Thức

Thư mục `docs/` hiện được chia thành hai lớp:

- `docs/srs/`: source of truth cho business scope, role model, feature list, user flows, màn hình
- các file còn lại trong `docs/`: tài liệu kỹ thuật tham khảo cho codebase và vận hành

---

## Source Of Truth

> [!IMPORTANT]
> Bộ BA/SRS chính thức nằm ở [srs/README.md](./srs/README.md).
> Nếu có mâu thuẫn giữa tài liệu kỹ thuật cũ trong `docs/` và bộ file trong `docs/srs/`, luôn ưu tiên `docs/srs/`.

Các quyết định đã chốt:

- `AnythingLLM` là engine RAG chính thức
- `PDF-only` trong `Release A`
- chat chỉ theo `1 môn học`
- role business chuẩn là `SUPER_ADMIN / LECTURER / STUDENT`
- không còn `lecturer request`
- payment/subscription bị loại khỏi SDN scope

---

## Thứ Tự Đọc Khuyến Nghị

1. [srs/README.md](./srs/README.md)
2. [srs/SRS_Summary.md](./srs/SRS_Summary.md)
3. [srs/SRS_Detailed.md](./srs/SRS_Detailed.md)
4. [srs/docs/traceability_matrix.md](./srs/docs/traceability_matrix.md)
5. [srs/docs/ui_ux_specifications.md](./srs/docs/ui_ux_specifications.md)
6. [api/README.md](./api/README.md)
7. [system_architecture.md](./system_architecture.md)
8. [code-standards.md](./code-standards.md)

---

## Bản Đồ Tài Liệu

| Nhóm | File | Vai trò |
|---|---|---|
| Business | [srs/](./srs/) | Bộ BA/SRS chính thức cho frontend và backend |
| API | [api/](./api/) | Chỉ mục và hướng dẫn đọc tài liệu API |
| Kiến trúc | [system_architecture.md](./system_architecture.md) | Tài liệu kỹ thuật về kiến trúc hiện có |
| Coding | [code-standards.md](./code-standards.md) | Quy ước code và guardrails kỹ thuật |
| Roadmap | [development-roadmap.md](./development-roadmap.md) | Theo dõi tiến độ và backlog |
| Codebase | [codebase-summary.md](./codebase-summary.md) | Tóm tắt cấu trúc code hiện tại |
| Vận hành | [running_guide.md](./running_guide.md) | Cài đặt và chạy local |

---

## Ghi Chú Dọn Repo

- Các tài liệu business cũ lệch scope đã được gỡ khỏi `docs/`.
- Một số tài liệu nghiên cứu hoặc kỹ thuật cũ vẫn được giữ làm tham khảo lịch sử, nhưng không phải source of truth cho feature scope.
- Không tạo thêm một bộ BA/SRS song song ngoài `docs/srs/`.

---

**Last Updated:** 2026-06-23

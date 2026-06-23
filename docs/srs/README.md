# Chatbot RAG FPTU - Tài Liệu Đặc Tả Yêu Cầu & Thiết Kế Hệ Thống (SRS)

Thư mục `docs/srs/` là bộ SRS chính thức hiện hành cho dự án. Team frontend và backend phải bám theo đúng cấu trúc hiện tại tại đây, không dùng thêm nhánh tài liệu song song.

---

## Source Of Truth Đã Chốt

- `AnythingLLM` là RAG engine chính thức
- `PDF-only` trong `Release A`
- chat chỉ theo `1 selected syllabus/workspace`
- role business chuẩn là `SUPER_ADMIN / LECTURER / STUDENT`
- không còn flow `lecturer request`
- payment/subscription bị loại khỏi SDN scope
- syllabus được sync sang AnythingLLM bằng `snapshot markdown` sinh từ DB

---

## Thứ Tự Đọc Cho Team

1. `Requirements_Raw.md`
2. `SRS_Summary.md`
3. `SRS_Detailed.md`
4. `docs/user_stories.md`
5. `docs/use_case_diagrams.md`
6. `docs/traceability_matrix.md`
7. `docs/ui_ux_specifications.md`
8. `docs/user_flows.md`
9. `docs/moscow_priorities.md`
10. `docs/sequence_diagrams.md`

---

## Vai Trò Của Từng Tài Liệu

- `Requirements_Raw.md`: nguồn requirement đầu vào và ghi chú gốc
- `SRS_Summary.md`: bản tóm tắt để stakeholder nắm phạm vi nhanh
- `SRS_Detailed.md`: tài liệu nền tảng về role, FR/NFR, business rules, scope, edge cases
- `docs/user_stories.md`: nhu cầu người dùng theo từng actor
- `docs/use_case_diagrams.md`: tập use case chính thức
- `docs/traceability_matrix.md`: nối actor, story, FR và màn hình
- `docs/ui_ux_specifications.md`: screen inventory và mô tả màn hình cho frontend mock
- `docs/user_flows.md`: luồng nghiệp vụ chính theo role
- `docs/moscow_priorities.md`: ưu tiên triển khai
- `docs/sequence_diagrams.md`: sequence cho các flow trọng yếu

---

## Ghi Chú

- `docs/SRS_BA_Review_Report.md` là tài liệu review lịch sử, không phải source of truth hiện hành.
- Nếu có mâu thuẫn giữa tài liệu cũ khác trong repo và bộ file ở `docs/srs/` + `docs/srs/docs/`, ưu tiên bộ file này.

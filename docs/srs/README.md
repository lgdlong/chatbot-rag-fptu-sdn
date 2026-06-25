# Chatbot RAG FPTU - SRS

> Status: Current
> Audience: Stakeholder / BA / PM
> Canonical: Yes
> Owner: Business

`docs/srs/` là bộ SRS chính thức hiện hành cho dự án. Không tạo thêm nhánh business truth song song.

## Source of truth
- `AnythingLLM` là RAG engine chính thức.
- `PDF-only` trong `Release A`.
- Chat chỉ theo `1 selected syllabus/workspace`.
- Role business chuẩn là `ADMIN / LECTURER / STUDENT`.
- `lecturer request` là legacy route bị khóa, không còn là flow chính thức.
- Payment/subscription bị loại khỏi SDN scope.
- Syllabus được sync sang AnythingLLM bằng snapshot sinh từ DB.

## Thứ tự đọc
1. `Requirements_Raw.md`
2. `SRS_Summary.md`
3. `SRS_Detailed.md`
4. `analysis/user_stories.md`
5. `analysis/use_case_diagrams.md`
6. `traceability/traceability_matrix.md`
7. `analysis/ui_ux_specifications.md`
8. `analysis/user_flows.md`
9. `analysis/moscow_priorities.md`

## Vai trò từng nhóm tài liệu
- `Requirements_Raw.md`: requirement đầu vào và ghi chú gốc
- `SRS_Summary.md`: tóm tắt phạm vi cho stakeholder
- `SRS_Detailed.md`: role, FR/NFR, business rules, scope, edge cases
- `analysis/`: user stories, flows, priorities, UI inventory
- `traceability/`: nối actor, story, FR và màn hình
- `diagrams/`: use-case diagram
- `reviews/`: review lịch sử, không phải source of truth

## Ghi chú
- `sequence_diagrams.md` đã bị loại khỏi active docs set.
- `docs/srs/data/` đã chuyển sang `docs/research/`.
- Nếu có mâu thuẫn với tài liệu cũ, ưu tiên bộ file này và `docs/README.md`.

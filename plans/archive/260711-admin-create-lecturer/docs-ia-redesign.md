# Plan: Tái Cấu Trúc Information Architecture cho `docs/`

**Status:** Active Plan  
**Audience:** BA/PM / Developer / Maintainer  
**Created:** 2026-06-24  
**Owner:** Technical  

---

## 1. Vấn Đề

`docs/` hiện tại trộn lẫn **5 tầng tài liệu** trong cùng một mặt bằng thư mục, gây đọc nhầm scope và khó bảo trì:

| Tầng | Ví dụ | Vấn đề |
|---|---|---|
| **Business canon** (SRS) | `docs/srs/*` | Ổn, nhưng `docs/srs/docs/` là misc chứa lẫn historical review với spec |
| **Technical design** | `system_architecture.md` | Tên gợi ý "kiến trúc chính thức" nhưng nội dung còn narrative Qdrant/manual-RAG cũ, lệch với SRS đã chốt (AnythingLLM + PDF-only + 1 syllabus) |
| **Operations/runbook** | `running_guide.md`, `docker-build-push.md` | Lẫn với technical và business |
| **Planning/roadmap** | `development-roadmap.md` | Đo tiến độ theo paradigm cũ, chưa được gắn nhãn "non-canonical" |
| **Historical/archive** | `scope-realignment-report.md`, `anythingllm-syllabus-agent-research.md` | Không có nơi chứa rõ ràng, dễ bị nhầm là tài liệu hiện hành |

Hậu quả: **developer đọc `system_architecture.md` tưởng là source of truth kiến trúc**, trong khi business scope thật nằm ở `docs/srs/`.

---

## 2. Target Taxonomy

```
docs/
├── README.md                         # Reader journey hub (cần rewrite)
│
├── srs/                              # SOURCE OF TRUTH - Business canon
│   ├── README.md                     # SRS reader journey
│   ├── Requirements_Raw.md           # (giữ nguyên)
│   ├── SRS_Summary.md                # (giữ nguyên)
│   ├── SRS_Detailed.md               # (giữ nguyên)
│   ├── analysis/                     # MỚI - tách từ srs/docs/
│   │   ├── user_stories.md
│   │   ├── user_flows.md
│   │   ├── moscow_priorities.md
│   │   └── ui_ux_specifications.md
│   ├── traceability/                 # MỚI
│   │   └── traceability_matrix.md
│   ├── diagrams/                     # MỚI
│   │   ├── use_case_diagrams.md
│   │   └── sequence_diagrams.md
│   ├── reviews/                      # MỚI
│   │   └── SRS_BA_Review_Report.md   # (historical - giữ nhưng không phải canon)
│   └── data/                         # (giữ nguyên - raw research artifacts)
│
├── technical/                        # MỚI
│   ├── README.md
│   ├── architecture/
│   │   └── system_architecture.md    # REWRITE theo scope mới hoặc archive
│   ├── backend/
│   │   ├── auth-guide.md             # (từ better_auth_guide.md)
│   │   ├── db-query-guide.md         # (từ db-query-guild.md)
│   │   └── hono-guide.md             # (từ hono_guide.md)
│   ├── rag/
│   │   └── anythingllm-research.md   # (từ anythingllm-syllabus-agent-research.md)
│   └── standards/
│       └── code-standards.md         # (từ code-standards.md)
│
├── operations/                       # MỚI
│   ├── running-guide.md              # (từ running_guide.md)
│   ├── docker-build-push.md          # (từ docker-build-push.md)
│   └── env-config.md                 # (nếu cần)
│
├── planning/                         # MỚI
│   ├── README.md
│   └── development-roadmap.md        # (từ development-roadmap.md, cần update scope)
│
└── archive/                          # MỚI
    ├── README.md
    ├── scope-realignment-report.md
    ├── legacy-system-architecture.md # (nếu system_architecture.md chưa được rewrite)
    └── curriculum-comparison.md      # (từ srs/data/curriculum_comparison_report.md)
```

---

## 3. Migration Steps

### Phase 1 — Tạo khung thư mục (ước lượng: 15 phút)

| Step | Action | Mô tả |
|---|---|---|
| 1.1 | Tạo `docs/technical/` + `docs/operations/` + `docs/planning/` + `docs/archive/` | 4 thư mục mới |
| 1.2 | Tạo `docs/srs/analysis/` + `traceability/` + `diagrams/` + `reviews/` | 4 thư mục con trong srs |
| 1.3 | Tạo `docs/technical/architecture/` + `backend/` + `rag/` + `standards/` | 4 thư mục con trong technical |

### Phase 2 — Di chuyển file không cần sửa nội dung (ước lượng: 15 phút)

| Step | File cũ | → File mới | Ghi chú |
|---|---|---|---|
| 2.1 | `docs/running_guide.md` | → `docs/operations/running-guide.md` | rename để consistent |
| 2.2 | `docs/docker-build-push.md` | → `docs/operations/docker-build-push.md` | giữ nguyên |
| 2.3 | `docs/better_auth_guide.md` | → `docs/technical/backend/auth-guide.md` | rename |
| 2.4 | `docs/db-query-guild.md` | → `docs/technical/backend/db-query-guide.md` | sửa typo "guild" → "guide" |
| 2.5 | `docs/hono_guide.md` | → `docs/technical/backend/hono-guide.md` | rename |
| 2.6 | `docs/code-standards.md` | → `docs/technical/standards/code-standards.md` | giữ nguyên |
| 2.7 | `docs/development-roadmap.md` | → `docs/planning/development-roadmap.md` | giữ nguyên |
| 2.8 | `docs/scope-realignment-report.md` | → `docs/archive/scope-realignment-report.md` | archive |
| 2.9 | `docs/anythingllm-syllabus-agent-research.md` | → `docs/technical/rag/anythingllm-research.md` | technical research |
| 2.10 | `docs/codebase-summary.md` | → `docs/technical/standards/codebase-summary.md` | giữ nguyên |

### Phase 3 — Tái cấu trúc `docs/srs/docs/` (ước lượng: 20 phút)

| Step | File cũ | → File mới |
|---|---|---|
| 3.1 | `docs/srs/docs/user_stories.md` | → `docs/srs/analysis/user_stories.md` |
| 3.2 | `docs/srs/docs/user_flows.md` | → `docs/srs/analysis/user_flows.md` |
| 3.3 | `docs/srs/docs/moscow_priorities.md` | → `docs/srs/analysis/moscow_priorities.md` |
| 3.4 | `docs/srs/docs/ui_ux_specifications.md` | → `docs/srs/analysis/ui_ux_specifications.md` |
| 3.5 | `docs/srs/docs/traceability_matrix.md` | → `docs/srs/traceability/traceability_matrix.md` |
| 3.6 | `docs/srs/docs/use_case_diagrams.md` | → `docs/srs/diagrams/use_case_diagrams.md` |
| 3.7 | `docs/srs/docs/sequence_diagrams.md` | → `docs/srs/diagrams/sequence_diagrams.md` |
| 3.8 | `docs/srs/docs/SRS_BA_Review_Report.md` | → `docs/srs/reviews/SRS_BA_Review_Report.md` |
| 3.9 | `docs/srs/docs/THIET_KE_CSDL.md` | → `docs/technical/backend/database-design.md` |
| 3.10 | `docs/srs/docs/curriculum_comparison_report.md` | → `docs/archive/curriculum-comparison.md` |
| 3.11 | Xoá `docs/srs/docs/` | Sau khi đã move hết |

### Phase 4 — Xử lý `system_architecture.md` (ước lượng: 30 phút)

**Option A (khuyến nghị):** Rewrite nội dung theo scope đã chốt (AnythingLLM + PDF-only + 1 syllabus) → đặt tại `docs/technical/architecture/system-architecture.md`.

**Option B (nhanh hơn):** Archive bản cũ → `docs/archive/legacy-system-architecture.md`. Tạo file mới tối thiểu tại `docs/technical/architecture/system-architecture.md` ghi rõ "cần rewrite chi tiết".

Quyết định: chọn **Option A** nếu có đủ context, **Option B** nếu cần move nhanh.

### Phase 5 — Rewrite reader journey (ước lượng: 15 phút)

| Step | File | Hành động |
|---|---|---|
| 5.1 | `docs/README.md` | Rewrite: cập nhật đường dẫn mới, reader journey cho từng audience |
| 5.2 | `docs/srs/README.md` | Cập nhật thứ tự đọc: đường dẫn `analysis/`, `traceability/`, `diagrams/` thay vì `docs/` |

---

## 4. Dependencies

```
Phase 1 → Phase 2 → Phase 3
                 ↘ Phase 4 (độc lập với Phase 3)
Phase 1 + 2 + 3 + 4 → Phase 5
```

- Phase 1, 2, 3, 4 có thể chạy tuần tự nhưng mỗi phase trong có thể parallel.
- Phase 5 phải đợi tất cả phase trước xong.

---

## 5. Risks & Mitigation

| Risk | Impact | Mitigation |
|---|---|---|
| `system_architecture.md` chưa được rewrite → vẫn gây hiểu lầm | High | Option B: archive ngay + link đến SRS. Rewrite sau. |
| File di chuyển → git mất history | Medium | Dùng `git mv` thay vì copy+delete để giữ blame history |
| `docs/srs/docs/` có file nào còn link/reference từ ngoài | Medium | Grep toàn repo trước khi xoá thư mục |
| `docs/README.md` link đến file cũ → 404 | High | Phase 5 bắt buộc verify từng link |

---

## 6. Tài Liệu Liên Quan

- `docs/README.md` (hiện tại): [docs/README.md](./docs/README.md)
- `docs/srs/README.md` (hiện tại): [docs/srs/README.md](./docs/srs/README.md)
- Root README.md cũng có link đến `docs/` → cần update ở Phase 5

---

## 7. Execution

- Mỗi phase là 1 todo riêng.
- Dùng `git mv` để giữ history.
- Sau mỗi phase chạy `lsp_diagnostics` kiểm tra file hợp lệ.
- Cuối cùng verify toàn bộ link trong `docs/README.md` và `docs/srs/README.md`.

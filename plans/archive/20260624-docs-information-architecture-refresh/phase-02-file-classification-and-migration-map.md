## Context links
- Parent plan: [plan.md](./plan.md)
- Depends on: [phase-01-taxonomy-and-governance.md](./phase-01-taxonomy-and-governance.md)

## Overview
- Date: 2026-06-24
- Description: Map every current doc to its future home, status, and required rewrite/archive action.
- Priority: high
- Implementation status: pending
- Review status: pending

## Key Insights
- The repo already contains most of the right content; it is just in the wrong places and under the wrong implied authority.
- Some files need movement only; some need movement plus banner; some need rewrite or archival.

## Requirements
- Produce a file-by-file migration table before moving anything.
- Mark conflicting current docs as `rewrite-before-current` or `archive-as-legacy`.
- Keep link breakage manageable by sequencing high-traffic docs first.
- Include every in-scope file under `docs/` and `docs/srs/`, excluding `docs/api/*` from relocation work because that subtree remains unchanged in this plan.

## Architecture
Migration policy categories:
1. `move-as-current`
2. `move-and-add-banner`
3. `rewrite-then-move`
4. `archive-as-legacy`
5. `delete-approved` (remove from the docs set after explicit decision)

Mandatory full-inventory columns:
- `current_path`
- `current_title`
- `audience`
- `current_role`
- `problem`
- `action`
- `target_path`
- `source_of_truth`
- `rewrite_required`
- `link_update_required`
- `verification_notes`

Proposed initial mapping:

| Current path | Action | Target |
|---|---|---|
| `docs/srs/docs/user_stories.md` | move-as-current | `docs/srs/analysis/user_stories.md` |
| `docs/srs/docs/user_flows.md` | move-as-current | `docs/srs/analysis/user_flows.md` |
| `docs/srs/docs/moscow_priorities.md` | move-as-current | `docs/srs/analysis/moscow_priorities.md` |
| `docs/srs/docs/ui_ux_specifications.md` | move-as-current | `docs/srs/analysis/ui_ux_specifications.md` |
| `docs/srs/docs/traceability_matrix.md` | move-as-current | `docs/srs/traceability/traceability_matrix.md` |
| `docs/srs/docs/use_case_diagrams.md` | move-as-current | `docs/srs/diagrams/use_case_diagrams.md` |
| `docs/srs/docs/sequence_diagrams.md` | delete-approved | removed from active docs set after approval |
| `docs/srs/docs/SRS_BA_Review_Report.md` | archive-as-legacy | `docs/archive/srs/SRS_BA_Review_Report.md` |
| `docs/srs/data/*` | move-as-research | `docs/research/srs-data/` |
| `docs/system_architecture.md` | rewrite-then-move | `docs/technical/architecture/system_architecture.md` |
| `docs/folder_structure.md` | move-and-add-banner | `docs/technical/architecture/folder_structure_future_state.md` |
| `docs/anythingllm-syllabus-agent-research.md` | move-as-current | `docs/technical/rag/anythingllm-syllabus-agent-research.md` |
| `docs/better_auth_guide.md` | move-as-current | `docs/technical/backend/better_auth_guide.md` |
| `docs/hono_guide.md` | move-as-current | `docs/technical/backend/hono_guide.md` |
| `docs/code-standards.md` | move-as-current | `docs/technical/standards/code-standards.md` |
| `docs/codebase-summary.md` | move-as-current | `docs/technical/standards/codebase-summary.md` |
| `docs/development-roadmap.md` | move-and-add-banner | `docs/planning/development-roadmap.md` |
| `docs/running_guide.md` | move-as-current | `docs/operations/running_guide.md` |
| `docs/docker-build-push.md` | move-as-current | `docs/operations/docker-build-push.md` |
| `docs/scope-realignment-report.md` | archive-as-legacy | `docs/archive/scope-realignment-report.md` |
| `docs/api/*` | keep-in-place | `docs/api/` |

Known stakeholder-doc rewrite check:

| Stakeholder-facing doc | Backend-detail check | Required action |
|---|---|---|
| `docs/srs/SRS_Summary.md` | check for implementation mechanics | rewrite to keep user-facing capability only |
| `docs/srs/SRS_Detailed.md` | check business sections for backend mechanics | keep business rules, move technical mechanisms elsewhere |
| `docs/srs/analysis/ui_ux_specifications.md` | check for technical/system-internal language | keep user-visible behavior only |
| `docs/srs/analysis/user_stories.md` | check story wording for implementation detail | preserve actor outcomes only |

## Related code files
- `docs/`
- `docs/srs/`

## Implementation Steps
1. Build the migration table with one row per current doc.
2. Mark each row with target location, target status, and rewrite/archive need.
3. Confirm any remaining ambiguous files before moving.
4. Use the table as the execution checklist for the reorg pass.
5. Add a dedicated subtable for stakeholder-doc cleanup and backend-detail stripping.

## Todo list
- [ ] Complete full inventory table.
- [ ] Identify docs safe to delete instead of archive.
- [ ] Record `docs/api/*` as unchanged and out of relocation scope.
- [ ] Mark every stakeholder-facing doc with rewrite-needed yes/no.

## Success Criteria
- Every doc has a single future home and status.
- No file is left in a folder that implies the wrong authority.

## Risk Assessment
- Moving files without a migration table will create broken links and forgotten legacy artifacts.
- Over-archiving may hide useful context from maintainers.

## Security Considerations
- Review operations docs and reference files for secrets/examples before relocation.

## Next steps
- After classification, rewrite navigation and banner conventions to match the target map.

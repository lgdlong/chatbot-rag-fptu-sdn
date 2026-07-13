## Context links
- Parent plan: [plan.md](./plan.md)
- Inputs: `docs/README.md`, `docs/srs/README.md`, Oracle/docs audit findings from 2026-06-24
- Dependencies: none

## Overview
- Date: 2026-06-24
- Description: Define the target documentation taxonomy and canonical ownership model before any file move.
- Priority: high
- Implementation status: pending
- Review status: pending

## Key Insights
- Current confusion is structural, not just editorial.
- Root `docs/` mixes business truth, technical truth, operations, planning, and historical evidence.
- `docs/srs/docs/` is a vague nested bucket that weakens discoverability inside the business canon.

## Requirements
- Preserve exactly one business source of truth.
- Separate documents by audience and ownership, not by accident of history.
- Prevent root-level docs from redefining business scope.
- Define audience contracts strongly enough that stakeholder docs cannot regress into backend-detail lists.

## Architecture
Target taxonomy:

```text
docs/
  README.md
  srs/
    README.md
    Requirements_Raw.md
    SRS_Summary.md
    SRS_Detailed.md
    analysis/
    traceability/
    diagrams/
    reviews/
  technical/
    README.md
    architecture/
    backend/
    standards/
    rag/
  operations/
    README.md
  planning/
    README.md
  research/
    README.md
  archive/
    README.md
```

Governance rules:
1. `docs/srs/` owns product behavior, scope, actors, priorities, and stakeholder-readable requirements.
2. `docs/technical/` owns implementation details, architecture, API behavior, and integration mechanics.
3. `docs/operations/` owns setup, runbooks, and deployment/maintenance instructions.
4. `docs/planning/` owns active roadmaps and non-canonical delivery planning.
5. `docs/research/` owns raw evidence, exploratory material, and supporting artifacts that are not active source-of-truth docs.
6. `docs/archive/` owns historical audits, superseded narratives, and legacy references.

Audience taxonomy:
1. Stakeholder/business → `docs/srs/`
2. Architecture/system-design → `docs/technical/architecture/`
3. Developer/API → `docs/api/` and `docs/technical/backend/`
4. Planning/delivery → `docs/planning/`
5. Research/evidence → `docs/research/`
6. Historical/audit → `docs/archive/`

Forbidden-content rules:
- Stakeholder docs must not contain backend task wording, DB operations, ingestion mechanics, snapshot-generation steps, manual Qdrant pipeline detail, or implementation TODOs.
- Architecture docs may explain system design but must not contradict the current baseline of AnythingLLM + PDF-only + one syllabus/workspace.
- Planning docs must not present themselves as canonical product truth.
- Research docs must not be confused with approved business or technical decisions.

Naming rules:
- Use purpose-based folder names, not catch-all buckets.
- Use lowercase kebab-case filenames for living docs wherever rename is practical.
- Do not create ambiguous folders such as `docs/`, `misc/`, `old/`, `temp/`, or duplicated nesting like `docs/docs`.
- Archive paths must retain enough context to explain why the file is historical.

Rewrite-vs-archive policy:
1. Rewrite a doc if it remains a living current reference but contains stale or misplaced content.
2. Archive a doc if it is historical, superseded, audit-only, or no longer authoritative.
3. Move a doc to research if it is active supporting evidence but not normative documentation.
4. Never keep a stale document in the active reader path “for reference” without a historical label.

## Related code files
- `docs/README.md`
- `docs/srs/README.md`
- `docs/system_architecture.md`
- `docs/development-roadmap.md`
- `docs/scope-realignment-report.md`

## Implementation Steps
1. Create the target folder taxonomy and corresponding README ownership notes.
2. Write a short canonical ownership rule set into `docs/README.md` and `docs/srs/README.md`.
3. Define the mandatory metadata banner format for all major docs.
4. Approve one rule for handling “future-state” docs versus “historical” docs.
5. Approve the forbidden-content and rewrite-vs-archive rules before any file move.

## Todo list
- [ ] Finalize folder taxonomy names.
- [ ] Finalize ownership rules.
- [ ] Finalize banner format.
- [ ] Decide policy for future-state docs.
- [ ] Finalize naming rules for living vs archived docs.
- [ ] Finalize forbidden-content rules for stakeholder docs.
- [ ] Finalize rewrite-vs-archive rules.

## Success Criteria
- Folder taxonomy is explicit and audience-first.
- Ownership rules make it impossible to mistake technical docs for product truth.

## Risk Assessment
- If taxonomy is overdesigned, migration cost rises with little benefit.
- If taxonomy is too shallow, current confusion survives in new folders.

## Security Considerations
- None beyond preserving warnings against exposing environment or credential information in ops docs.

## Next steps
- Move to file-by-file classification only after taxonomy and ownership are locked.

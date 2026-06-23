## Context links
- Parent plan: [plan.md](./plan.md)
- Depends on all prior phases

## Overview
- Date: 2026-06-24
- Description: Execute the docs reorganization in safe stages and verify that audience confusion and canonical conflicts are removed.
- Priority: high
- Implementation status: pending
- Review status: pending

## Key Insights
- The high-risk failure mode is not broken markdown links; it is preserving misleading authority in renamed docs.
- Verification must test reader journeys, not only file presence.

## Requirements
- Move files in batches that preserve readability.
- Update internal links after each batch.
- Verify that no active doc outside `docs/srs/` defines product scope.
- Maintain a rename map and archive log so moved files remain traceable.

## Architecture
Staged execution order:
1. Create new folders and READMEs.
2. Move/archive historical and obviously non-canonical files.
3. Move business support docs out of `docs/srs/docs/` into purpose folders.
4. Rewrite and relocate high-risk current docs (`system_architecture.md`, roadmap, folder structure).
5. Final pass on links, banners, and reader journeys.

Verification checklist:
- Stakeholder route: `docs/README.md` → `docs/srs/SRS_Summary.md`
- BA route: `docs/srs/README.md` → `SRS_Detailed.md` → analysis/traceability
- Developer route: `docs/README.md` → technical/architecture/current docs
- Maintainer route: `docs/archive/README.md` → historical audit materials
- Search audit: grep for legacy phrases like `Qdrant` as primary engine, `ALL_COURSES`, `subscription/payment`, `lecturer request` in current docs
- Search audit: grep stakeholder-facing docs for backend-detail phrases such as `generate snapshot markdown from DB`
- Verify `docs/api/` remains represented in the developer journey while staying untouched by relocation work
- Verify `docs/research/` exists and contains former `docs/srs/data/` artifacts with non-canonical labeling
- Verify `docs/srs/docs/` no longer exists as an active ambiguous bucket after migration
- Verify `docs/development-roadmap.md` is not presented as canonical truth
- Verify `docs/scope-realignment-report.md` is archived with a historical banner
- Verify `sequence_diagrams.md` has been removed from the repository docs set after approval and is not referenced by any active reader path

## Related code files
- Entire `docs/` tree

## Implementation Steps
1. Create destination folders and scaffold READMEs.
2. Batch-move unambiguous files.
3. Archive historical files with explicit banners.
4. Rewrite misleading current docs before labeling them `Current`.
5. Run link and terminology verification.
6. Produce a short post-migration report.
7. Keep a rename map from old path to new path and record any delete/merge candidates separately for approval.

## Todo list
- [ ] Create destination folders.
- [ ] Move low-risk files.
- [ ] Rewrite high-risk files.
- [ ] Verify links and terminology.
- [ ] Publish post-migration summary.
- [ ] Produce rename map and archive log.
- [ ] Run stakeholder-doc backend-detail audit.

## Success Criteria
- Current docs align with the SRS baseline and no longer imply dual-primary architectures.
- Historical files remain discoverable without contaminating current reader paths.
- The doc tree is explainable in under one minute to a new contributor.
- No stakeholder-facing current doc contains backend implementation mechanics.

## Risk Assessment
- Partial migration could increase confusion temporarily if links and READMEs lag behind moves.
- Rewriting architecture docs without explicit source references could reintroduce scope drift.

## Security Considerations
- Ensure archived docs do not surface sensitive local paths or stale environment instructions without warning banners.

## Next steps
- After execution, ask for a short validation review from stakeholder-facing and developer-facing readers.

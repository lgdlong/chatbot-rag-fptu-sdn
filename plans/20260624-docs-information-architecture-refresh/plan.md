---
title: "Docs information architecture refresh"
description: "Reorganize docs/ and docs/srs/ into clear business, technical, operations, planning, and archive layers."
status: pending
priority: P2
effort: 8h
branch: main
tags: [docs, information-architecture, srs, taxonomy]
created: 2026-06-24
---

# Docs information architecture refresh

## Goal
Restructure `docs/` so reader journeys, canonical ownership, and historical boundaries are obvious. Keep `docs/srs/` as the single business source of truth and remove audience confusion caused by mixed technical and legacy narratives.

## Scope
- In scope: `docs/`, `docs/srs/`, file moves/renames, README/navigation rewrites, doc status banners, archive rules.
- Out of scope: product scope changes, code changes, feature implementation, API behavior changes.

## Non-negotiable documentation governance
- `docs/srs/` remains the only business/product source of truth.
- Stakeholder-facing docs must describe user-visible capability, scope, decisions, and acceptance meaning; they must not contain backend implementation mechanics.
- Backend/API/implementation details belong in developer or architecture docs, not SRS feature lists.
- No new parallel business-truth folder or alternate business-canon document set may be introduced.
- This plan becomes execution-ready only after every in-scope file under `docs/` and `docs/srs/` has a recorded target state and action. `docs/api/*` remains in place unless a later plan explicitly expands scope.

## Phases
| Phase | Status | Purpose | File |
|---|---|---|---|
| 01 | pending | Freeze target taxonomy and canonical ownership rules | [phase-01-taxonomy-and-governance.md](./phase-01-taxonomy-and-governance.md) |
| 02 | pending | Classify every existing doc and define exact move/relabel actions | [phase-02-file-classification-and-migration-map.md](./phase-02-file-classification-and-migration-map.md) |
| 03 | pending | Rewrite reader navigation and document metadata/banner conventions | [phase-03-navigation-and-document-contracts.md](./phase-03-navigation-and-document-contracts.md) |
| 04 | pending | Execute staged migration and verify no canonical conflicts remain | [phase-04-migration-and-verification.md](./phase-04-migration-and-verification.md) |

## Key constraints
- `docs/srs/` remains the only business/product source of truth.
- Customer-facing feature docs must describe user-visible value, not backend mechanics.
- `docs/system_architecture.md` cannot remain a misleading “current” architecture doc if it still describes legacy/manual-Qdrant scope.
- Historical audits and superseded narratives must move out of the active reader path.
- `docs/api/*` stays unchanged in this plan and is treated as an existing developer-facing/API doc surface.

## Success criteria
- A stakeholder, BA, developer, and maintainer each have a clear starting path from `docs/README.md`.
- No active doc outside `docs/srs/` redefines product scope.
- Every major doc declares `Status`, `Audience`, `Canonical`, and `Owner`.
- Legacy/manual-Qdrant and other superseded narratives are either rewritten or archived.
- Every current file under `docs/` has one documented action: keep, move, rewrite, split, merge, archive, or approved delete-candidate.
- Stakeholder-facing docs have been checked for backend-detail pollution, including phrases like `generate snapshot markdown from DB`.
- `docs/srs/data/` is no longer mixed into active SRS structure and is clearly located under research.

## Open questions
- None blocking. Decisions already fixed for this plan: `sequence_diagrams.md` is deleted from the active docs set, `docs/srs/data/` belongs under research, and `docs/api/*` stays untouched.

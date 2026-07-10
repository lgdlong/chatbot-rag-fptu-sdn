# Phase 01 — Schema + Contracts

## Context links
- Parent plan: `plans/260625-1234-rag-backend-release-a/plan.md`
- Depends on: `docs/srs/README.md`, `docs/api/00_auth.md`, `docs/api/00_documents.md`, `docs/api/00_chat.md`

## Overview
- Date: 2026-06-25
- Description: lock course/version/workspace mapping and core persistence shapes.
- Priority: high
- Implementation status: done
- Review status: not started

## Key Insights
- Course is business container; syllabus version is RAG snapshot.
- 1 workspace per syllabus version avoids citation drift.
- Citation payload stays opaque; no page deep-link logic in backend.

## Requirements
- Add stable mapping for course -> syllabus version -> workspace.
- Persist document, job, session, message, citation, callback event.
- Keep schema strict, typed, and Prisma-map aligned.

## Architecture
- Prisma domain tables only.
- No retrieval logic here.
- Status flow: `PENDING -> PROCESSING -> SUCCESS|FAILED`.

## Related code files
- `api/prisma/schema.prisma`
- `api/src/modules/rag/*`
- `api/src/modules/chat/*`
- `api/src/modules/documents/*`

## Implementation Steps
1. confirm missing entities / migrations.
2. define workspace mapping table.
3. define ingestion job + citation storage.
4. align enums and status constants.

## Todo list
- [x] map current Prisma models
- [x] add versioned workspace fields
- [x] add job/citation fields
- [x] review cascade rules

## Success Criteria
- schema can represent one syllabus snapshot and its workspace.
- citation blob can persist without normalization.

## Risk Assessment
- skipping versioning now causes traceability pain later.
- bad cascade delete can orphan docs/jobs.

## Security Considerations
- internal callback rows must not expose secrets.
- role-sensitive fields must stay server-only.

## Next steps
- move to document ingest pipeline.

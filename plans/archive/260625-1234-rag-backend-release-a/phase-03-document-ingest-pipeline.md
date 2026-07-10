# Phase 03 — Document Ingest Pipeline

## Context links
- Parent plan: `plans/260625-1234-rag-backend-release-a/plan.md`
- Depends on: `phase-01-schema-and-contracts.md`, `phase-02-anythingllm-adapter.md`, `docs/api/00_documents.md`

## Overview
- Date: 2026-06-25
- Description: implement PDF upload, job lifecycle, callback, and cleanup.
- Priority: high
- Implementation status: done
- Review status: not started

## Key Insights
- Release A is PDF-only.
- Upload should create job first, ingest async, then callback update status.
- Delete must clean local file and AnythingLLM state.

## Requirements
- validate PDF MIME/size.
- store file locally.
- create `Document` + `IngestionJob`.
- update status through internal callback.

## Architecture
- controller validates + stores.
- repository persists metadata.
- adapter handles AnythingLLM sync.
- internal callback owns final status flip.

## Related code files
- `api/src/modules/syllabus/syllabus.controller.ts`
- `api/src/modules/documents/document.internal.controller.ts`
- `api/src/modules/documents/document.repository.ts`
- `api/src/modules/rag/rag.controller.ts`

## Implementation Steps
1. lock upload validation.
2. create job row before adapter call.
3. sync file to AnythingLLM workspace.
4. handle callback success/failure.
5. delete local file + remote doc cleanup.

## Todo list
- [x] upload validation
- [x] local storage handling
- [x] job state transitions
- [x] internal callback update
- [x] delete sync path

## Success Criteria
- upload -> PROCESSING -> SUCCESS/FAILED works end to end.
- delete removes local file and remote doc.

## Risk Assessment
- orphaned PROCESSING jobs if callback lost.
- delete/reindex race if cleanup order wrong.

## Security Considerations
- callback route must require `INTERNAL_API_KEY`.
- role check needed for lecturer/admin mutations.

## Next steps
- implement chat SSE / citation sync if any drift remains.

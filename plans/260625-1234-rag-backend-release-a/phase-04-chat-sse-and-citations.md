# Phase 04 — Chat SSE + Citations

## Context links
- Parent plan: `plans/260625-1234-rag-backend-release-a/plan.md`
- Depends on: `phase-01-schema-and-contracts.md`, `phase-02-anythingllm-adapter.md`, `docs/api/00_chat.md`

## Overview
- Date: 2026-06-25
- Description: stream chat through backend, persist session history, forward raw citations.
- Priority: high
- Implementation status: done
- Review status: not started

## Key Insights
- Backend is SSE proxy + guardrail layer.
- Citation payload stays raw AnythingLLM output.
- Session title can auto-summarize on first message.

## Requirements
- session CRUD.
- course-scoped chat.
- SSE message stream.
- persist assistant/user messages + citations.

## Architecture
- route loads active syllabus/workspace.
- adapter streams answer chunks.
- backend stores raw response and citation blob.

## Related code files
- `api/src/modules/chat/chat.controller.ts`
- `api/src/modules/chat/chat.repository.ts`
- `api/src/modules/chat/services/chat-scope.service.ts`
- `api/src/modules/rag/rag.service.ts`

## Implementation Steps
1. confirm session scope rules.
2. wire SSE send endpoint to adapter.
3. persist raw citations after stream end.
4. add auto-title for first message.
5. support session history endpoints.

## Todo list
- [x] session CRUD
- [x] SSE stream proxy
- [x] raw citation persistence
- [x] auto-title logic
- [x] out-of-scope refusal

## Success Criteria
- frontend receives streamed answer.
- session detail reopens with citations intact.

## Risk Assessment
- stream schema mismatch.
- citation payload drift across AnythingLLM versions.

## Security Considerations
- scope check before every send.
- do not stream cross-course data.

## Next steps
- add ops, health, and test gates.

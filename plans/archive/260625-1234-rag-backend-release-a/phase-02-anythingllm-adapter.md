# Phase 02 — AnythingLLM Adapter

## Context links
- Parent plan: `plans/260625-1234-rag-backend-release-a/plan.md`
- Depends on: `phase-01-schema-and-contracts.md`, `docs/technical/rag/anythingllm-syllabus-agent-research.md`

## Overview
- Date: 2026-06-25
- Description: wrap local AnythingLLM in a thin internal client.
- Priority: high
- Implementation status: done
- Review status: not started

## Key Insights
- AnythingLLM owns retrieval plane.
- Backend should call it like internal service, not second AI stack.
- Fail fast if service unavailable.

## Requirements
- workspace lookup/create/update/delete.
- document upload/reindex call.
- chat stream call.
- raw citation pass-through.

## Architecture
- thin HTTP client only.
- no custom reranker or embedder.
- adapter returns opaque payloads to backend services.

## Related code files
- `api/src/modules/rag/rag.controller.ts`
- `api/src/modules/rag/rag.service.ts`
- `api/src/modules/chat/chat.controller.ts`

## Implementation Steps
1. identify current AnythingLLM endpoints.
2. define request/response DTOs.
3. add timeout/retry/error mapping.
4. expose adapter methods for upload/chat/delete.

## Todo list
- [x] confirm endpoint names
- [x] define adapter DTOs
- [x] map error classes
- [ ] add health probe call

## Success Criteria
- backend can upload PDF and stream chat via local AnythingLLM.
- adapter keeps citations opaque.

## Risk Assessment
- API drift between local AnythingLLM versions.
- unstable stream schema if coupled too hard.

## Security Considerations
- internal token required for admin/callback calls.
- no public exposure of workspace management APIs.

## Next steps
- wire document ingest pipeline on top of adapter.

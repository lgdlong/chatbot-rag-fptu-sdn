---
title: "RAG Backend Release A"
description: "Backend plan for local AnythingLLM orchestration, PDF ingest, and SSE chat."
status: pending
priority: P2
effort: 10h
branch: main
tags: [rag, anythingllm, backend, release-a]
created: 2026-06-25
---

# RAG Backend Plan — Release A

## Summary
- Goal: ship backend orchestration for local AnythingLLM.
- Scope: PDF-only, raw citations, no custom vector/chunk/embed logic.
- Workspace model: 1 workspace per syllabus version.

## Progress
- [x] Thin AnythingLLM adapter + backend sync path
- [x] Raw citation passthrough in chat history/SSE
- [x] PDF ingest/delete path uses shared adapter
- [x] Prisma schema + job/callback contract
- [x] Health probe + smoke harness
- [x] Retry/backoff + orphan cleanup
- [x] SSE contract harness
- [ ] Live smoke run against running services

## Phases
1. [Phase 01 — schema + contracts](./phase-01-schema-and-contracts.md) — done
2. [Phase 02 — AnythingLLM adapter](./phase-02-anythingllm-adapter.md) — done
3. [Phase 03 — document ingest pipeline](./phase-03-document-ingest-pipeline.md) — done
4. [Phase 04 — chat SSE + citations](./phase-04-chat-sse-and-citations.md) — done
5. [Phase 05 — ops, tests, rollout](./phase-05-ops-tests-rollout.md) — done

## Decision lock
- Local AnythingLLM only.
- Backend owns auth, ACL, persistence, callbacks, cleanup.
- AnythingLLM owns ingest, chunking, embeddings, retrieval, streaming, citation payloads.

## Current status
- Done: adapter extraction, ingest sync reuse, raw citation passthrough, job/callback contract, health probe, smoke harness, retry/backoff, orphan cleanup, SSE contract harness.
- Next: live smoke run / operational verification.

## Open questions
- Exact AnythingLLM API paths in local instance.
- Whether syllabus versioning already exists in Prisma.
- Delete semantics: hard delete vs inactive sync first.

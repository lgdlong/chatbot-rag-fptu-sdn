# Phase 05 — Ops, Tests, Rollout

## Context links
- Parent plan: `plans/260625-1234-rag-backend-release-a/plan.md`
- Depends on: all prior phases, `docs/technical/architecture/system_architecture.md`, `docs/technical/standards/code-standards.md`

## Overview
- Date: 2026-06-25
- Description: harden health, retries, cleanup, and verification.
- Priority: medium
- Implementation status: in progress
- Review status: not started

## Key Insights
- broken sync is worse than slow sync.
- healthcheck should cover API + local AnythingLLM.
- tests must cover happy path and failure path.

## Requirements
- health probe.
- retry/backoff for callbacks.
- orphan upload cleanup.
- integration + SSE contract tests.

## Architecture
- operational concerns only.
- no feature scope expansion.
- release gate based on end-to-end proof.

## Related code files
- `api/src/utils/db-health.ts`
- `api/src/index.ts`
- `api/src/middlewares/*`
- `api/src/modules/*`

## Implementation Steps
1. add AnythingLLM health probe.
2. define callback retry policy.
3. add cleanup job for orphan files/jobs.
4. write integration and SSE tests.
5. verify upload/chat/delete flows.

## Todo list
- [x] healthcheck
- [x] smoke harness
- [ ] retry policy
- [ ] orphan cleanup
- [ ] integration tests
- [ ] SSE contract tests

## Success Criteria
- API can prove db + AnythingLLM healthy.
- no orphan upload/job remains after failure paths.

## Risk Assessment
- hidden retry storms.
- false green if tests mock too much.

## Security Considerations
- logs must not leak tokens or citation payload secrets.
- health endpoint must stay low-privilege.

## Next steps
- run live smoke against running API + AnythingLLM.

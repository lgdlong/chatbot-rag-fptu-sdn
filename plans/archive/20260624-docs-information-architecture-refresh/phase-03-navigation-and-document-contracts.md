## Context links
- Parent plan: [plan.md](./plan.md)
- Depends on: [phase-01-taxonomy-and-governance.md](./phase-01-taxonomy-and-governance.md), [phase-02-file-classification-and-migration-map.md](./phase-02-file-classification-and-migration-map.md)

## Overview
- Date: 2026-06-24
- Description: Rewrite top-level navigation and standardize per-document contracts so readers always know what they are reading.
- Priority: medium
- Implementation status: pending
- Review status: pending

## Key Insights
- Reader confusion persists even with better folders unless README entry points are rewritten.
- The current two-README model works only if each README owns a distinct audience path.

## Requirements
- `docs/README.md` becomes the master router by audience.
- `docs/srs/README.md` becomes the business-canon router only.
- Every major current doc gets a standard banner.
- Each living doc must have one primary audience and one parent section in navigation.

## Architecture
Recommended banner:

```md
> Status: Current | Future-State | Historical
> Audience: Stakeholder | BA/PM | Developer | Maintainer
> Canonical: Yes | No
> Owner: Business | Technical | Operations | Planning | Archive
```

README contract:
1. Root README explains folder taxonomy and audience routes.
2. SRS README explains business-canon reading order only.
3. Technical, operations, planning, and archive folders each get a README with one-sentence scope boundaries.

Document contracts by audience:
1. SRS/business docs answer: what capability exists, who it is for, what scope and constraints apply.
2. Architecture docs answer: how the system is structured at design level.
3. API/developer docs answer: how to integrate, call endpoints, or understand implementation-facing behavior.
4. Planning docs answer: what may happen, what is proposed, or what was scheduled.
5. Research docs answer: what evidence or exploratory material supports later decisions.
6. Archive docs answer: what was historically true or previously audited.

Reader journeys:
1. Stakeholder journey starts in `docs/srs/` and must not require backend/API docs.
2. Developer/API journey includes `docs/api/` and current technical docs.
3. Architecture journey routes to the corrected current architecture doc only.
4. Research journey routes to `docs/research/` only when supporting evidence is needed.
5. Historical journey routes to archive only when explicitly needed.

## Related code files
- `docs/README.md`
- `docs/srs/README.md`
- future `docs/technical/README.md`
- future `docs/operations/README.md`
- future `docs/planning/README.md`
- future `docs/research/README.md`
- future `docs/archive/README.md`

## Implementation Steps
1. Rewrite `docs/README.md` as an audience-first index.
2. Rewrite `docs/srs/README.md` to remove any mixed technical reading path.
3. Create folder READMEs for technical, operations, planning, research, and archive.
4. Add banners to high-risk docs first: architecture, roadmap, historical audits, future-state docs.
5. Ensure no stakeholder journey page links to implementation details as required reading.

## Todo list
- [ ] Draft new root README structure.
- [ ] Draft new SRS README structure.
- [ ] Create subfolder README templates.
- [ ] Add banner text template.

## Success Criteria
- A stakeholder cannot accidentally land in a technical or legacy doc first.
- A developer can find current architecture without reading business-review history.
- `docs/api/` is visible from the developer journey but absent from the stakeholder-required path.
- `docs/research/` is visible only as supporting evidence, not as canonical truth.

## Risk Assessment
- If root README is too verbose, readers will skip it and browse raw folders again.
- If banners are optional, inconsistent authority signals will return.

## Security Considerations
- None beyond keeping operations docs explicit about env-file safety.

## Next steps
- After navigation is rewritten, execute staged moves and verify canonical boundaries hold.

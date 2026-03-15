## Context

ResearchBot has two implementation tracks:
- **Claude (Backend)**: `backend-api-implementation` — FastAPI + SQLite + 6 search APIs + Gemini LLM (35 tasks)
- **Antigravity (Frontend)**: `frontend-ui-implementation` — Next.js 16 + React 19 + shadcn/ui (18 tasks, based on PRD v1)

PRD was updated from v1 to v2 on 2026-03-15. The backend plan follows v2; the frontend plan is partially stale.

## Goals / Non-Goals

**Goals:**
- Document all plan mismatches clearly
- Create actionable coordination channel
- Define setup checklist for project bootstrap
- Identify API contract delivery milestones

**Non-Goals:**
- Rewriting the frontend plan (Antigravity's responsibility)
- Implementing any code
- Making frontend technology decisions

## Decisions

### 1. Coordination via shared markdown document

**Choice**: Create `docs/COORDINATION.md` as the single source of truth for Claude ↔ Antigravity communication.

**Rationale**: Both sides work asynchronously with the user as mediator. A persistent document is better than ephemeral chat. User can share this file with Antigravity directly.

### 2. API contract first, then frontend

**Choice**: Backend delivers Pydantic model definitions and example responses before frontend builds API integration.

**Rationale**: Frontend with mock data can proceed independently, but integration requires agreed-upon response shapes. Pydantic models serve as the contract.

### 3. Frontend plan update is Antigravity's responsibility

**Choice**: We document what needs to change; Antigravity makes the actual updates to `frontend-ui-implementation`.

**Rationale**: We don't modify another implementor's artifacts. We provide clear requirements and let them adapt.

## Risks / Trade-offs

- **Risk: Antigravity builds against stale spec** → Mitigation: COORDINATION.md clearly marks what's changed
- **Risk: API contract changes during development** → Mitigation: Version API models, communicate changes via COORDINATION.md
- **Risk: User becomes bottleneck for communication** → Mitigation: COORDINATION.md reduces need for real-time mediation

## Plan Alignment Review

### Mismatches Found

```
┌─────────────────────────────┬─────────────────────┬─────────────────────┐
│  Feature                    │ Frontend Plan (v1)  │ Backend Plan (v2)   │
├─────────────────────────────┼─────────────────────┼─────────────────────┤
│ Review Sessions UI          │ ✓ Full (3 tasks)    │ ✗ REMOVED           │
│ Agent pipeline tracking     │ ✓ SSE/polling       │ ✗ REMOVED           │
│ Project management          │ ✗ Not planned       │ ✓ Core feature      │
│ Include/Exclude workflow    │ ✗ Not planned       │ ✓ Core feature      │
│ Keyword management UI       │ ✗ Not planned       │ ✓ Core feature      │
│ Export UI (CSV/Zotero)      │ ✗ Not planned       │ ✓ Planned           │
│ Auto-select threshold       │ ✗ Not planned       │ ✓ Planned           │
│ Paper "Save" button         │ ✓ In search results │ → "Include" toggle  │
│ Paper "Summarize" button    │ ✓ In search results │ ✗ REMOVED (AI auto) │
│ Search "Feedback" (up/down) │ ✓ In search results │ ✗ REMOVED           │
│ Search modes               │ quick/std/deep/semantic│ quick/std/deep     │
│ Taxonomy tags UI            │ ✓ Planned           │ → Keyword mgmt      │
│ Relationship graph          │ ✓ Planned           │ ✗ NOT in v2 scope   │
│ Dashboard/stats             │ ✓ Planned           │ → Project summary   │
│ Pipeline control            │ ✓ Planned           │ ✗ REMOVED           │
│ Topics management           │ ✓ Planned           │ → Projects          │
├─────────────────────────────┼─────────────────────┼─────────────────────┤
│ STALE specs (file missing)  │ paper-library       │ —                   │
│                             │ review-session-mgmt │ —                   │
├─────────────────────────────┼─────────────────────┼─────────────────────┤
│ Tech stack alignment        │ ✓ Match             │ ✓ Match             │
│ (Next.js, shadcn, TanStack) │                     │                     │
└─────────────────────────────┴─────────────────────┴─────────────────────┘
```

### Frontend Spec Files Status

| Spec File | Status |
|-----------|--------|
| `specs/interactive-search/spec.md` | EXISTS — needs update (remove Summarize/Feedback, add Include toggle) |
| `specs/paper-library/spec.md` | MISSING (file doesn't exist) — was planned but never created |
| `specs/review-session-management/spec.md` | MISSING (file doesn't exist) — should be DELETED from plan |
| `specs/frontend-architecture/spec.md` | EXISTS — mostly valid, remove /review route |

### Frontend Tasks That Need Updating

| Task | Current | Should Be |
|------|---------|-----------|
| 2.3 Search Result Card | "Save, Summarize, Feedback buttons" | "Include/Exclude toggle, score display" |
| 3.x Paper Library | Generic library view | Project-scoped DB management with keyword editing |
| 4.x Review Sessions | Full section (3 tasks) | **DELETE entire section** |
| NEW | — | Project management pages (create, list, detail) |
| NEW | — | Keyword management UI |
| NEW | — | Export UI (CSV download, Zotero sync trigger) |
| NEW | — | Auto-select controls (threshold slider) |
| NEW | — | Paper bulk operations UI |

### API Endpoints the Frontend Needs

| Priority | Endpoint Group | Frontend Dependency |
|----------|---------------|-------------------|
| P0 (blocks UI skeleton) | `GET /api/projects` | Project list page |
| P0 | `POST /api/projects/{id}/search` | Search functionality |
| P0 | `GET /api/projects/{id}/papers` | Paper list/DB view |
| P1 (blocks core UX) | `PATCH /api/papers/{id}/include` | Include/exclude toggle |
| P1 | `PUT /api/papers/{id}` | Paper editing |
| P1 | `POST /api/projects/{id}/auto-select` | Auto-select button |
| P1 | `GET/POST /api/keywords` | Keyword management |
| P2 (blocks export) | `GET /api/projects/{id}/export/csv` | CSV download |
| P2 | `POST /api/projects/{id}/export/zotero` | Zotero sync |

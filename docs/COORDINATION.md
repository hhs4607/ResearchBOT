# ResearchBot — Coordination Channel

**Claude (Backend)** ↔ **Antigravity (Frontend)**
**Last Updated**: 2026-03-15
**Authoritative PRD**: `memory/plans/2026-03-15-prd.md` (v2)

---

## 1. Plan Alignment: PRD v1 → v2 Changes

> **IMPORTANT**: The frontend plan (`frontend-ui-implementation`) was created against PRD v1.
> PRD v2 made significant changes. Antigravity must update the frontend plan accordingly.

### Features REMOVED (delete from frontend plan)

| Feature | Old Location | Reason |
|---------|-------------|--------|
| Review Sessions UI | tasks 4.1–4.3 | Agent pipeline removed; all interaction is interactive via web |
| Review Session tracking (SSE/polling) | design.md risk section | No background agent runs to track |
| "Summarize" button on search results | spec interactive-search | AI extracts OMR automatically at search time |
| "Feedback" (thumbs up/down) | spec interactive-search | Search feedback system deprioritized |
| Pipeline control page | tasks (implied) | No pipeline to control |
| /review route | design.md component hierarchy | No review sessions |
| Semantic search mode | spec interactive-search | Only quick/standard/deep remain |

### Features ADDED (must add to frontend plan)

| Feature | Priority | API Dependency | Description |
|---------|----------|---------------|-------------|
| **Project management pages** | P0 | `GET/POST/PUT/DELETE /api/projects` | Create, list, rename, delete review projects. Project is the top-level container. |
| **Project-scoped search** | P0 | `POST /api/projects/{id}/search` | Search happens within a project context. Results accumulate. |
| **Include/Exclude toggle** | P0 | `PATCH /api/papers/{id}/include` | Each paper has a 3-state toggle: undecided/include/exclude. This replaces "Save" button. |
| **Paper DB management view** | P0 | `GET /api/projects/{id}/papers` | Replaces "Paper Library". Project-scoped, with rich filtering, sorting, pagination. Core screen. |
| **Paper keyword editing** | P1 | `PUT /api/papers/{id}` | Add/remove/edit keywords on individual papers. Tag-style UI. |
| **Keyword management page** | P1 | `GET/POST/PUT/DELETE /api/keywords` | Canonical keyword dictionary with variants. Normalization rules. |
| **Auto-select controls** | P1 | `POST /api/projects/{id}/auto-select` | Threshold slider + "Auto-select" button. Marks undecided papers above threshold as included. |
| **Bulk operations** | P1 | `POST /api/projects/{id}/papers/bulk-*` | Multi-select papers → bulk include/exclude, bulk keyword assign. |
| **CSV export** | P2 | `GET /api/projects/{id}/export/csv` | Download button with column selector. |
| **Zotero sync** | P2 | `POST /api/projects/{id}/export/zotero` | Sync button + status display. |
| **Paper detail editing** | P1 | `PUT /api/papers/{id}` | Edit AI-generated fields (keywords, objective, method, result), user notes. |

### Features CHANGED (update in frontend plan)

| Feature | Was (v1) | Now (v2) |
|---------|----------|----------|
| Search result card buttons | Save, Summarize, Feedback | Include toggle, score display, detail link |
| Paper library | Global library, all papers | **Project-scoped** paper database |
| Topics management | Separate topics page | → Projects (topics concept merged into projects) |
| Taxonomy tags | 5-axis taxonomy UI | → Keywords (simplified canonical + variants) |
| Dashboard | Global stats | → Project summary (per-project stats) |
| Navigation | Home, Search, Papers, Review, Pipeline, Graph, Topics, Tags | Home, Projects, Search (within project), Papers (within project), Keywords, Export |

---

## 2. API Contract

### Endpoint Status

| Method | Path | Pydantic Models | Status | Notes |
|--------|------|----------------|--------|-------|
| **Projects** | | | | |
| GET | `/api/projects` | → `ProjectListOut` | Not started | Returns list with paper counts |
| POST | `/api/projects` | `ProjectIn` → `ProjectOut` | Not started | |
| GET | `/api/projects/{id}` | → `ProjectDetailOut` | Not started | Includes summary stats |
| PUT | `/api/projects/{id}` | `ProjectIn` → `ProjectOut` | Not started | |
| DELETE | `/api/projects/{id}` | → 204 | Not started | Cascade deletes all data |
| **Search** | | | | |
| POST | `/api/projects/{id}/search` | `SearchIn` → `SearchResultOut` | Not started | Keywords + mode, returns scored results |
| GET | `/api/projects/{id}/searches` | → `SearchLogListOut` | Not started | Search history |
| POST | `/api/projects/{id}/auto-select` | `AutoSelectIn` → `AutoSelectOut` | Not started | Threshold-based |
| **Papers** | | | | |
| GET | `/api/projects/{id}/papers` | → `PaperListOut` | Not started | Filter, sort, paginate |
| GET | `/api/papers/{id}` | → `PaperDetailOut` | Not started | Full metadata + keywords |
| PUT | `/api/papers/{id}` | `PaperUpdateIn` → `PaperOut` | Not started | Edit fields |
| PATCH | `/api/papers/{id}/include` | `IncludeIn` → `PaperOut` | Not started | {is_included: true/false/null} |
| POST | `/api/papers/{id}/refetch` | → `PaperOut` | Not started | Re-enrich metadata |
| DELETE | `/api/papers/{id}` | → 204 | Not started | |
| POST | `/api/projects/{id}/papers/bulk-include` | `BulkIncludeIn` → `BulkResultOut` | Not started | |
| POST | `/api/projects/{id}/papers/bulk-keywords` | `BulkKeywordIn` → `BulkResultOut` | Not started | |
| **Keywords** | | | | |
| GET | `/api/keywords` | → `KeywordListOut` | Not started | All canonical keywords |
| POST | `/api/keywords` | `KeywordIn` → `KeywordOut` | Not started | |
| PUT | `/api/keywords/{id}` | `KeywordIn` → `KeywordOut` | Not started | |
| DELETE | `/api/keywords/{id}` | → 204 | Not started | |
| GET | `/api/projects/{id}/keyword-stats` | → `KeywordStatsOut` | Not started | Frequency per project |
| **Export** | | | | |
| GET | `/api/projects/{id}/export/csv` | query params → CSV file | Not started | |
| POST | `/api/projects/{id}/export/zotero` | → `ZoteroSyncOut` | Not started | |
| GET | `/api/projects/{id}/export/zotero/status` | → `ZoteroStatusOut` | Not started | |

### Pydantic Model Delivery

Models will be defined in `src/api/models.py`. Once ready, Antigravity can use these as TypeScript type definitions (or we generate OpenAPI spec → TypeScript types).

**Delivery plan**: Models published as part of backend Task 5.3.

---

## 3. Blocking Dependencies

### Frontend blocked by Backend

| Blocker | Backend Task | Priority | Notes |
|---------|-------------|----------|-------|
| Project list page needs API | 5.4 (projects router) | P0 | Can use mock data until ready |
| Search needs API | 5.5 (search router) | P0 | Complex — parallel search + scoring |
| Paper list needs API | 5.6 (papers router) | P0 | Filtering/sorting/pagination |
| Include toggle needs API | 5.6 (papers router) | P1 | Simple PATCH |
| Keyword CRUD needs API | 5.7 (keywords router) | P1 | |
| Export needs API | 5.8 (export router) | P2 | |

### Backend blocked by Frontend

| Blocker | Notes |
|---------|-------|
| (none) | Backend can be fully developed and tested independently via curl/httpie |

### Suggested Frontend Development Order

1. **Mock data + UI skeleton** (no backend dependency)
   - Project list/create page
   - Paper DB view with mock data
   - Include/exclude toggle UI
2. **Integrate P0 endpoints** (when backend tasks 5.4-5.6 complete)
   - Real project CRUD
   - Real search
   - Real paper list
3. **Integrate P1 endpoints** (when backend tasks 5.5-5.7 complete)
   - Keyword management
   - Paper editing
   - Auto-select
   - Bulk operations
4. **Integrate P2 endpoints** (when backend task 5.8 completes)
   - CSV export
   - Zotero sync

---

## 4. Open Questions

| # | Question | Owner | Status | Resolution |
|---|----------|-------|--------|------------|
| 1 | Should search return results immediately (sync) or stream progressively (SSE)? | Backend | **Resolved** | Sync first. SSE for Phase 2 if needed. |
| 2 | What TypeScript type generation approach? Manual or OpenAPI auto-gen? | Both | **Resolved** | Manual Zod + TypeScript (Antigravity confirmed) |
| 3 | Frontend framework still Next.js 16, or has Antigravity preference changed? | Frontend | **Resolved** | Next.js 16 + React 19 confirmed |
| 4 | How to handle long-running deep searches (all 6 sources, could take 10-30s)? | Both | **Resolved** | Loading skeleton "Searching 6 sources..." |
| 5 | Paper detail: side panel or full page? | Frontend | **Resolved** | Full page `/papers/[id]` |
| 6 | Mobile/responsive required or desktop-only? | Frontend | **Resolved** | Desktop-first, mobile P3 |

---

## 5. Integration Milestones

| # | Milestone | Backend Ready | Frontend Ready | Status |
|---|-----------|--------------|----------------|--------|
| M1 | Project CRUD works end-to-end | ✅ Done | ✅ Done (mock) | **Ready for integration** |
| M2 | Search → results displayed | ✅ Done (OpenAlex tested) | ✅ Done (mock) | **Ready for integration** |
| M3 | Paper list with include/exclude | ✅ Done | ✅ Done (mock) | **Ready for integration** |
| M4 | Keyword editing works | ✅ Done | ✅ Done (mock) | **Ready for integration** |
| M5 | CSV export downloads | ✅ Done | ✅ Done (mock) | **Ready for integration** |
| M6 | Full workflow test | ✅ 28/28 endpoints | ✅ 19/19 UI tasks | **Awaiting integration** |

---

## 6. Antigravity Next Steps (Integration)

Antigravity's frontend is complete with mock data. The following steps are needed to connect to the real backend:

### Step 1: API Proxy Setup
- Configure Next.js to proxy `/api/*` requests to FastAPI at `localhost:8000`
- Backend starts with: `python -m src.api` (from project root)

### Step 2: Replace Mock → Real (Priority Order)

| Priority | Mock to Replace | Real Endpoint | Notes |
|----------|----------------|---------------|-------|
| P0 | Project list/create | `GET/POST /api/projects` | Simplest, start here |
| P0 | Search execution | `POST /api/projects/{id}/search` | Returns temp results (see payload in api-contract-sync.md 5.2) |
| P0 | Save papers | `POST /api/projects/{id}/papers/save` | Must pass `search_id` + `selections` |
| P0 | Paper list | `GET /api/projects/{id}/papers` | Rich query params for filtering |
| P1 | Include/exclude | `PATCH /api/papers/{id}/include` | `{is_included: true/false/null}` |
| P1 | Paper detail | `GET /api/papers/{id}` | Full metadata with keywords |
| P1 | Paper update | `PUT /api/papers/{id}` | Keywords, notes, OMR |
| P1 | Keyword list | `GET /api/keywords` | 81 seeded keywords |
| P2 | CSV export | `GET /api/projects/{id}/export/csv` | Returns CSV file download |
| P2 | Auto-select | `POST /api/projects/{id}/auto-select` | `{threshold: 0.7}` |

### Step 3: Key Differences from Mock

- **Search results are TEMPORARY**: `POST /search` returns `temp_index` (not `id`). Papers don't have DB `id` until `POST /papers/save`.
- **Gemini extraction is separate**: AI keywords/OMR are empty after save. Must call `POST /papers/{id}/extract` to populate.
- **Keyword dual model**: `ai_keywords` is read-only raw string. `keywords[]` array in paper detail comes from `paper_keywords` junction table.

### Step 4: Verify Payload Shapes
- All request/response JSON is defined in `.claude/patterns/api-contract-sync.md` Section 5
- FastAPI auto-generates OpenAPI docs at `http://localhost:8000/docs`

---

## 7. Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-03-15 | Claude | Initial creation. Documented PRD v1→v2 mismatches. Created API contract table. |
| 2026-03-15 | Claude | All 28 backend endpoints implemented and tested. Updated contract checklist. Added Antigravity integration guide. |

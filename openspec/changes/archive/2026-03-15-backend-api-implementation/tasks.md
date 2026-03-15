## 1. Project Setup & Configuration

- [x] 1.1 Create `pyproject.toml` with all dependencies (fastapi, uvicorn, httpx, google-genai, arxiv, scholarly, pyzotero, pandas, rapidfuzz, pyyaml, python-dotenv, tenacity)
- [x] 1.2 Create `config.yaml` with default settings (search modes, scoring weights, LLM model)
- [x] 1.3 Create `.env.example` with all environment variables documented
- [x] 1.4 Create `src/config.py` — YAML + env config loader (merge from 07_RB + PRB config patterns)
- [x] 1.5 Set up Python virtual environment with `uv` and verify all packages install
- [x] 1.6 Clean up stale directories: remove `src/shared/`, `src/agent/` (PRD v1 remnants)

## 2. Database Layer

- [x] 2.1 Create `src/db.py` — SQLite connection manager with WAL mode, schema creation for all 8 tables
- [x] 2.2 Implement keyword dictionary seed function (merged 66+ 07_RB + 25+ PRB abbreviation mappings)
- [x] 2.3 Verify schema creation + seed on fresh database

## 3. Search API Clients

- [x] 3.1 Create `src/search/__init__.py` — SearchResult dataclass (unified format), search_all() dispatcher
- [x] 3.2 Port `src/search/openalex.py` from 07_RB — add journal and author_keywords extraction
- [x] 3.3 Port `src/search/semantic_scholar.py` from 07_RB (refs/cited_by extraction for refetch, NOT during search)
- [x] 3.4 Port `src/search/arxiv_search.py` from 07_RB
- [x] 3.5 Extract `src/search/crossref.py` from PRB/pipeline/collect.py — convert requests to httpx
- [x] 3.6 Extract `src/search/pubmed.py` from PRB/pipeline/collect.py — convert requests to httpx
- [x] 3.7 Extract `src/search/google_scholar.py` from PRB/pipeline/collect.py — standalone module
- [x] 3.8 Test each client individually with sample queries

## 4. Core Services

- [x] 4.1 Create `src/services/dedup_service.py` — port UnionFind + DOI/fuzzy-title dedup from PRB/pipeline/filter.py
- [x] 4.2 Create `src/services/screening_service.py` — 7-signal composite scoring (Phase 3 config). NO Gemini call here.
- [x] 4.3 Create `src/services/keyword_service.py` — normalization, CRUD, frequency stats (merge 07_RB acronyms + PRB ABBREVIATION_MAP)
- [x] 4.4 Create `src/llm/gemini.py` — port from 07_RB, adapt for keyword/OMR extraction only (called separately, not during search)
- [x] 4.5 Create `src/services/extraction_service.py` — Gemini-based keyword + OMR extraction, auto-normalize to paper_keywords
- [x] 4.6 Create `src/services/project_service.py` — project CRUD with paper count aggregation
- [x] 4.7 Create `src/services/search_service.py` — orchestrate multi-source search, dedup, score. Returns TEMPORARY results (not saved to DB). Logs search to search_logs.
- [x] 4.8 Create `src/services/paper_service.py` — save from search results, CRUD, filtering, sorting, pagination, bulk ops, refetch (incl. refs/cited_by), copy across projects
- [x] 4.9 Create `src/services/export_service.py` — CSV export (pandas) + Zotero sync (pyzotero)

## 5. FastAPI Application & Routers

- [x] 5.1 Create `src/api/app.py` — FastAPI factory with CORS, lifespan (DB init + seed)
- [x] 5.2 Create `src/api/deps.py` — dependency injection (get_db, get_config)
- [x] 5.3 Create `src/api/models.py` — Pydantic request/response schemas (per api-contract-sync.md Section 5)
- [x] 5.4 Create `src/api/routers/projects.py` — CRUD + summary stats
- [x] 5.5 Create `src/api/routers/search.py` — POST search (temp results), GET history, POST auto-select
- [x] 5.6 Create `src/api/routers/papers.py`:
  - POST /projects/{id}/papers/save (save from search)
  - GET list/detail, PUT update, PATCH include, DELETE
  - POST /papers/{id}/extract (Gemini single)
  - POST /projects/{id}/papers/extract (Gemini bulk)
  - POST /papers/{id}/refetch (metadata + refs/cited_by)
  - POST /papers/{id}/copy (cross-project)
  - POST bulk-include, bulk-keywords
- [x] 5.7 Create `src/api/routers/keywords.py` — CRUD + project stats
- [x] 5.8 Create `src/api/routers/export.py` — CSV export, Zotero sync + status
- [x] 5.9 Add uvicorn entry point

## 6. Integration Testing

- [x] 6.1 Test: create project → search → save selected papers → verify in DB
- [x] 6.2 Test: search same keywords twice → save → verify no duplicates
- [x] 6.3 Test: trigger Gemini extraction → ai_keywords + paper_keywords (DT, IoT auto-linked)
- [x] 6.4 Test: keyword normalization — "physics-informed neural network" → "PINN" in paper_keywords
- [x] 6.5 Test: auto-select threshold on saved papers
- [x] 6.6 Test: refetch enriches refs/cited_by (50 refs, 2 cited_by fetched)
- [x] 6.7 Test: copy paper to another project
- [x] 6.8 Test: CSV export with column selection
- [x] 6.9 Test: Zotero sync (118 papers synced to collection SUQSF253)

## 7. Data Migration

- [x] 7.1 Create `scripts/migrate_paperreviewbot.py` — CSV column mapping, authors parsing, score normalization
- [x] 7.2 Import output/ session → "PINN-based Digital Twin for Fatigue Analysis" (145 papers)
- [x] 7.3 Import output_bayesian_composite/ session → "Bayesian Optimization-based Composite Material Design" (122 papers)
- [x] 7.4 Verify migrated data via API (267 papers, 2 projects, keywords linked)

## 8. Documentation & Handoff

- [x] 8.1 Update api-contract-sync.md checklist as endpoints are completed
- [x] 8.2 Notify Antigravity of design decisions (temp search results, deferred Gemini, paper copy)

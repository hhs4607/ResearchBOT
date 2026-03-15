## Context

ResearchBot is a greenfield backend project that merges code from two existing projects:
- **07_Research_Bot** (`~/Projects/Code/07_Research_Bot/`): FastAPI web app with 3 search APIs (OpenAlex, S2, arXiv), 7-signal composite scoring, Gemini LLM, and a Next.js frontend. DB is empty (0 papers). Code lives in nested `src/cases/web/` structure.
- **PaperReviewBot** (`~/Projects/PaperReviewBot/`): CLI pipeline with 5 search APIs (S2, arXiv, CrossRef, PubMed, Google Scholar), CSV-based state, keyword normalization, Zotero sync. Has ~267 reviewed papers across 2 CSV sessions.

The backend serves a REST API consumed by a frontend built separately by Antigravity. There is no agent pipeline — all interaction is through the web UI.

**Stakeholders:**
- Claude Code: Implements the backend (this change)
- Antigravity: Implements the frontend (separate change, needs PRD v2 alignment)
- User: Researcher writing review papers

## Goals / Non-Goals

**Goals:**
- Implement a working backend that supports the full paper curation workflow: search → screen → select → manage → export
- Port and unify search clients from both source projects into consistent httpx-based modules
- Provide a well-documented REST API for frontend consumption
- Ensure keyword normalization is robust from day one
- Migrate existing PaperReviewBot data into the new schema

**Non-Goals:**
- Frontend implementation (Antigravity's responsibility)
- Agent/batch pipeline (removed in PRD v2)
- Obsidian output (removed from v1 scope)
- Chrome crawling (Phase 2, future)
- SPECTER2 semantic embeddings (reserved signal, weight=0)
- Benchmark/experiment framework (deprioritized)

## Decisions

### 1. Flat module structure (no `cases/` nesting)

**Choice**: `src/search/`, `src/services/`, `src/api/` at top level.

**Rationale**: 07_Research_Bot used a `cases/web/` nesting because it had 4 implementation variants (standalone, langgraph, n8n, claude_skill). We only need the web variant. Flat structure is simpler and avoids deep import paths.

**Alternative**: Keep `cases/web/` for compatibility → rejected (no backward compatibility needed).

### 2. httpx for all HTTP clients (not requests, not SDK packages)

**Choice**: Use httpx throughout for all API calls.

**Rationale**:
- 07_Research_Bot already uses httpx (async-ready, consistent with FastAPI)
- PaperReviewBot uses `requests` + `semanticscholar` SDK → must convert
- Unified HTTP layer simplifies error handling, retry logic, and testing

**Alternative**: Keep `semanticscholar` SDK for S2 → rejected (07_RB's direct httpx client extracts richer metadata including embeddings and recommendations).

### 3. 07_Research_Bot search clients as base (for S2 and arXiv conflicts)

**Choice**: Use 07_RB's standalone module implementations, augment with PaperReviewBot's missing field extraction (journal, author_keywords).

**Rationale**: 07_RB clients are already standalone files with richer metadata extraction. PaperReviewBot's implementations are embedded in a monolithic `collect.py` and would need significant refactoring anyway.

### 4. Composite scoring in backend, not LLM-per-paper

**Choice**: Use 7-signal weighted scoring (from 07_RB Phase 3 optimized config) for initial relevance. Reserve Gemini for keyword/OMR extraction only.

**Rationale**:
- Composite scoring is fast, deterministic, and already benchmarked (0.942 accuracy)
- LLM-per-paper scoring (PaperReviewBot's approach) is slow, expensive, and had no benchmark validation
- Gemini is better used for structured extraction (keywords, objective/method/result) than binary relevance judgment

**Alternative**: LLM relevance scoring → reserved for future "deep screening" mode.

### 5. SQLite with WAL mode (not PostgreSQL)

**Choice**: Single-file SQLite database with WAL mode for concurrent reads.

**Rationale**: Single-user application, no multi-server deployment, simple backup (copy file), zero-config. WAL mode allows concurrent reads from API while writes happen.

**Alternative**: PostgreSQL → overkill for single-user research tool.

### 6. Keyword normalization at write time

**Choice**: When AI extracts keywords or user adds keywords, immediately map to canonical forms before storing in paper_keywords junction.

**Rationale**: Prevents fragmentation ("PINN" vs "physics-informed neural network") at the source. Cheaper than post-hoc deduplication. User can always add new canonical forms.

**Flow**:
```
AI extracts "physics-informed neural network"
→ keyword_service.normalize("physics-informed neural network")
→ matches variant in keywords table → canonical "PINN"
→ stored as paper_keywords(paper_id, keyword_id=PINN)
```

### 7. Deduplication strategy: DOI first, then fuzzy title

**Choice**: Port PaperReviewBot's UnionFind-based dedup with DOI exact match (primary) and rapidfuzz title match >= 90 (secondary).

**Rationale**: Proven approach. DOI is authoritative. Title fuzzy match catches papers from sources without DOI (arXiv, Google Scholar). Threshold 90 avoids false positives per PRB experience.

### 8. API versioning: no prefix initially

**Choice**: `/api/projects/...`, `/api/papers/...` — no `/api/v1/` prefix.

**Rationale**: Single-consumer API (Antigravity frontend). When breaking changes are needed, we coordinate directly. Version prefix adds complexity without benefit for now.

## Risks / Trade-offs

- **Risk: Google Scholar rate limiting / IP blocking** → Mitigation: Best-effort source with graceful fallback. scholarly library handles proxies. Never block other sources on Scholar failure.
- **Risk: Gemini API cost for large searches** → Mitigation: Only call Gemini for keyword/OMR extraction on papers that pass composite scoring threshold. Batch requests where possible.
- **Risk: Frontend-backend API contract drift** → Mitigation: Share Pydantic models as API documentation. Antigravity must update frontend plan to match PRD v2 before integration.
- **Risk: SQLite write contention during parallel search** → Mitigation: WAL mode + write serialization in service layer. Searches are read-heavy; writes only on save.
- **Risk: Fuzzy title dedup false positives** → Mitigation: Keep threshold at 90 (conservative). Log all dedup decisions for user review.
- **Trade-off: No real-time search progress** → SSE/WebSocket for search progress would improve UX but adds complexity. Start with synchronous search, add streaming later if needed.

## Open Questions

1. **Search timeout strategy**: What's the maximum wait time for a deep search (all 6 sources)? Need to benchmark actual API response times.
2. **Gemini batch vs. per-paper**: Should keyword/OMR extraction be batched (send 10 abstracts at once) or per-paper? Depends on Gemini's context window and cost model.
3. **Frontend API contract review**: When will Antigravity update their plan to match PRD v2? Backend can start independently, but integration testing needs alignment.

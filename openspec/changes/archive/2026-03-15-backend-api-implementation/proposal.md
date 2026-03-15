## Why

ResearchBot needs a complete backend (FastAPI + SQLite + Gemini LLM) that serves as the foundation for a review-paper database builder. The frontend (handled by Antigravity) depends entirely on this REST API for search, paper curation, keyword management, and export. No backend exists yet — only an empty project skeleton and a finalized PRD v2.

## What Changes

- Create SQLite database with 8-table schema (projects, papers, keywords, paper_keywords, search_logs, search_papers, paper_sources, zotero_sync)
- Port 6 academic search API clients from two existing projects (07_Research_Bot, PaperReviewBot) into unified httpx-based modules
- Implement Gemini LLM integration for abstract screening and keyword extraction (7-signal composite scoring)
- Build service layer: project, search, paper, screening, keyword, deduplication, export services
- Create FastAPI REST API with 5 router groups (~20 endpoints): projects, search, papers, keywords, export
- Implement CSV and Zotero export
- Create migration script for importing existing PaperReviewBot CSV data

## Capabilities

### New Capabilities

- `database-schema`: SQLite WAL database with 8 tables — projects, papers, keywords, paper_keywords, search_logs, search_papers, paper_sources, zotero_sync. Includes deduplication constraints and cascading deletes.
- `search-engine`: Multi-source academic paper search across 6 APIs (OpenAlex, Semantic Scholar, arXiv, CrossRef, PubMed, Google Scholar). Parallel execution, unified result format, configurable search modes (quick/standard/deep).
- `ai-screening`: Gemini-based abstract screening with 7-signal composite relevance scoring (text_match, relevance, citations, multi_source, recency, abstract, semantic). Keyword extraction and OMR (objective/method/result) generation.
- `paper-management`: Paper CRUD with rich filtering (keyword, year, include/exclude status, score range), sorting, pagination. Bulk operations (include/exclude, keyword assignment). Metadata re-fetch from sources.
- `keyword-management`: Canonical keyword dictionary with variant normalization. Auto-mapping of AI-extracted keywords to canonical forms. CRUD operations. Seeded from merged abbreviation dictionaries (66+ from 07_RB + 25+ from PRB).
- `export-system`: CSV export with configurable columns. Zotero collection sync via pyzotero. Per-project sync tracking.
- `project-management`: Project CRUD for organizing paper collections by review topic. Project-level settings and accumulated search history.
- `data-migration`: One-time script to import PaperReviewBot CSV runs (2 sessions, ~267 papers) into the new DB schema with column mapping.

### Modified Capabilities

- (none — greenfield backend)

## Impact

- **Code**: Populates `src/` with all backend modules (search/, services/, api/, db.py, config.py, llm/)
- **APIs**: Creates the REST API contract that Antigravity's frontend will consume. API spec must be shared with Antigravity for frontend alignment.
- **Dependencies**: Adds ~12 Python packages (fastapi, uvicorn, httpx, google-genai, arxiv, scholarly, pyzotero, pandas, rapidfuzz, pyyaml, python-dotenv, tenacity)
- **Data**: Creates `data/research_bot.db` as single source of truth
- **External Services**: Requires API keys for Gemini (required), OpenAlex email (required), S2 (recommended), others optional
- **Frontend Coordination**: Antigravity's existing frontend plan (based on PRD v1) must be updated to match PRD v2 — review sessions removed, project-based workflow added, include/exclude curation flow added

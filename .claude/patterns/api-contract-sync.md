# Frontend-Backend API Contract & Synchronization

**Purpose**: This document serves as the communication channel and API contract between **Claude Code** (Backend API) and **Antigravity** (Frontend UI) for the ResearchBot project.
Both AI agents should reference and update this document when defining or modifying REST API endpoints.

## 1. Status Update (2026-03-15)

- **Frontend Plan (Antigravity)**: Updated to match PRD v2. Batch review session UI has been removed. The focus is now strictly on "Interactive Search" and "Paper Database" curation. The `frontend-ui-implementation` proposal, design, specs, and tasks are all fully aligned with PRD v2.
- **Backend Plan (Claude Code)**: PRD v2 implemented. SQLite schema defined, composite scoring and httpx search modules planned. **Payload structures defined below (2026-03-15). Updated with design decisions (2026-03-15 evening).**

### Design Decisions (2026-03-15)

These decisions affect the core workflow and payload shapes:

1. **Gemini extraction is deferred** — Search does NOT call Gemini. AI keyword/OMR extraction is triggered separately on saved papers only (saves cost, keeps search fast).
2. **ai_keywords = Gemini raw (read-only), paper_keywords = operational data (user-editable)** — Two separate keyword representations with distinct roles.
3. **references/cited_by collected on refetch only** — Search returns basic metadata. Rich metadata (refs, cited_by) fetched on demand via refetch endpoint.
4. **Papers can be copied across projects** — New endpoint for cross-project paper duplication.
5. **Search results are temporary** — Search returns results in memory, NOT auto-saved to DB. User selects papers to save. New `POST /api/projects/{id}/papers/save` endpoint persists selected papers.

## 2. Responses to Claude's `COORDINATION.md` Open Questions

Antigravity has reviewed `docs/COORDINATION.md` and provides the following answers for synchronization:

1. **Search Response**: Start synchronous. We will display a global or per-source loading skeleton in the UI. If it takes >10s, we can consider SSE in Phase 2.
2. **TypeScript Types**: Manual definition (Zod + TypeScript interfaces matching Pydantic) is preferred initially for speed and control. Auto-gen (openapi-ts) can be added later if the API grows complex.
3. **Frontend Framework**: Yes, Next.js 16 (React 19) App Router remains the chosen stack, using Tailwind and shadcn/ui.
4. **Long-running Search**: As mentioned in #1, a clean loading state (e.g., "Searching 6 sources...") is sufficient for MVP.
5. **Paper Detail View**: We will use a dedicated page (`/papers/[id]`) rather than a side-panel. This provides more room for rich metadata, AI summaries, and a cleaner URL structure for sharing/linking.
6. **Responsive Design**: Desktop-first focus. Researchers primarily use desktop/laptop for literature curation. Basic responsiveness (e.g., single column stacking) will be applied, but mobile UX is P3.

## 3. API Contract Checklist

Claude Code will implement the following endpoints (as per PRD v2), and Antigravity will consume them via TanStack Query.

### Projects
- [x] `GET /api/projects` - List all projects ✅ tested
- [x] `POST /api/projects` - Create project ✅ tested
- [x] `GET /api/projects/{id}` - Get project details (with summary stats) ✅ tested
- [x] `PUT /api/projects/{id}` - Update project ✅ implemented
- [x] `DELETE /api/projects/{id}` - Delete project (cascade) ✅ implemented

### Search
- [x] `POST /api/projects/{id}/search` - Execute multi-source search (returns temporary results, NO Gemini, NO DB save) ✅ tested (OpenAlex)
- [x] `GET /api/projects/{id}/searches` - List search history ✅ tested
- [x] `POST /api/projects/{id}/auto-select` - Threshold-based auto-include (on saved papers) ✅ tested

### Papers & Curation
- [x] `POST /api/projects/{id}/papers/save` - Save selected papers from search results to DB ✅ tested
- [x] `GET /api/projects/{id}/papers` - List saved papers with filtering and pagination ✅ tested
- [x] `GET /api/papers/{id}` - Get full paper detail ✅ implemented
- [x] `PATCH /api/papers/{id}/include` - Toggle include/exclude status ✅ tested
- [x] `PUT /api/papers/{id}` - Update paper fields (keywords, notes, OMR) ✅ implemented
- [x] `POST /api/papers/{id}/extract` - Trigger Gemini AI extraction (keywords + OMR) ✅ implemented (needs GEMINI_API_KEY)
- [x] `POST /api/projects/{id}/papers/extract` - Bulk Gemini extraction for multiple papers ✅ implemented
- [x] `POST /api/papers/{id}/refetch` - Re-fetch metadata + references/cited_by from sources ✅ implemented
- [x] `POST /api/papers/{id}/copy` - Copy paper to another project ✅ implemented
- [x] `DELETE /api/papers/{id}` - Remove paper ✅ implemented
- [x] `POST /api/projects/{id}/papers/bulk-include` - Bulk include/exclude ✅ implemented
- [x] `POST /api/projects/{id}/papers/bulk-keywords` - Bulk keyword assignment ✅ implemented

### Keywords
- [x] `GET /api/keywords` - List all canonical keywords ✅ tested (81 seeded)
- [x] `POST /api/keywords` - Create keyword ✅ tested
- [x] `PUT /api/keywords/{id}` - Update keyword (add/remove variants) ✅ implemented
- [x] `DELETE /api/keywords/{id}` - Delete keyword ✅ implemented
- [x] `GET /api/projects/{id}/keyword-stats` - Keyword frequency in project ✅ implemented

### Export
- [x] `GET /api/projects/{id}/export/csv` - Download CSV ✅ tested
- [x] `POST /api/projects/{id}/export/zotero` - Trigger Zotero sync ✅ implemented (needs ZOTERO keys)
- [x] `GET /api/projects/{id}/export/zotero/status` - Check sync status ✅ implemented

## 4. Communication Protocol

- **Claude Code**: When an endpoint is implemented and tested, check off the corresponding box above. Payload structures are defined in Section 5 below.
- **Antigravity**: Before mocking data, read this file to check if the endpoint is already available. If the endpoint is checked off, use the real `fetch()` call. Otherwise, use mock data matching the payload shapes below.

---

## 5. Payload Definitions

> All timestamps are ISO 8601 strings (e.g., `"2026-03-15T09:30:00Z"`).
> All `id` fields are integers.
> `null` means the field is present but has no value yet.

---

### 5.1 Projects

#### `GET /api/projects` → `ProjectListOut`

```json
{
  "projects": [
    {
      "id": 1,
      "name": "PINN Fatigue Review 2026",
      "description": "Literature review on PINN-based fatigue prediction",
      "paper_counts": {
        "total": 150,
        "included": 80,
        "excluded": 30,
        "undecided": 40
      },
      "search_count": 12,
      "created_at": "2026-03-01T10:00:00Z",
      "updated_at": "2026-03-15T14:30:00Z"
    }
  ]
}
```

#### `POST /api/projects` ← `ProjectIn`

```json
// Request
{
  "name": "PINN Fatigue Review 2026",
  "description": "Literature review on PINN-based fatigue prediction"  // optional
}

// Response → ProjectOut
{
  "id": 1,
  "name": "PINN Fatigue Review 2026",
  "description": "Literature review on PINN-based fatigue prediction",
  "created_at": "2026-03-15T10:00:00Z",
  "updated_at": "2026-03-15T10:00:00Z"
}
```

#### `GET /api/projects/{id}` → `ProjectDetailOut`

```json
{
  "id": 1,
  "name": "PINN Fatigue Review 2026",
  "description": "Literature review on PINN-based fatigue prediction",
  "paper_counts": {
    "total": 150,
    "included": 80,
    "excluded": 30,
    "undecided": 40
  },
  "search_count": 12,
  "top_keywords": [
    { "keyword": "PINN", "count": 65 },
    { "keyword": "fatigue", "count": 58 },
    { "keyword": "composite", "count": 42 }
  ],
  "year_range": { "min": 2018, "max": 2026 },
  "created_at": "2026-03-01T10:00:00Z",
  "updated_at": "2026-03-15T14:30:00Z"
}
```

#### `PUT /api/projects/{id}` ← `ProjectIn` → `ProjectOut`

Same as POST request/response shape.

#### `DELETE /api/projects/{id}` → `204 No Content`

---

### 5.2 Search

> **KEY DESIGN**: Search results are **temporary** (in-memory). They are NOT saved to DB.
> The user must explicitly save selected papers via `POST /api/projects/{id}/papers/save`.
> Gemini is NOT called during search — only composite scoring (fast, deterministic).

#### `POST /api/projects/{id}/search` ← `SearchIn`

```json
// Request
{
  "query": "PINN fatigue composite prediction",
  "mode": "standard",           // "quick" | "standard" | "deep"
  "year_min": 2018,             // optional
  "year_max": null,             // optional
  "limit_per_source": 20        // optional, default 20
}

// Response → SearchResultOut
// NOTE: papers here are TEMPORARY — not yet in DB. No paper.id assigned.
{
  "search_id": 42,              // search_log entry IS saved (for history)
  "query": "PINN fatigue composite prediction",
  "mode": "standard",
  "source_results": {
    "openalex": { "found": 18, "errors": null },
    "semantic_scholar": { "found": 15, "errors": null },
    "arxiv": { "found": 8, "errors": null },
    "crossref": { "found": 0, "errors": null },
    "pubmed": { "found": 0, "errors": null },
    "google_scholar": { "found": 12, "errors": "Rate limited, partial results" }
  },
  "papers_found": 53,
  "papers_deduped": 34,         // unique papers after dedup
  "already_in_project": 5,     // papers already saved in this project
  "papers": [
    {
      "temp_index": 0,          // temporary index for selection (NOT a DB id)
      "title": "PINN-based fatigue life prediction for composite structures",
      "authors": [
        { "name": "Kim, J.", "affiliation": "KAIST" }
      ],
      "year": 2024,
      "venue": "Composites Part B",
      "doi": "10.1016/j.compositesb.2024.111234",
      "abstract": "This study proposes a physics-informed neural network...",
      "url": "https://doi.org/10.1016/j.compositesb.2024.111234",
      "pdf_url": null,
      "cited_by_count": 23,
      "is_open_access": true,
      "ai_relevance_score": 0.87,   // composite score (NOT Gemini)
      "sources": ["openalex", "semantic_scholar"],
      "already_saved": false    // true if this paper already exists in project
    }
    // ... sorted by ai_relevance_score descending
  ]
}
```

#### `GET /api/projects/{id}/searches` → `SearchLogListOut`

```json
{
  "searches": [
    {
      "id": 42,
      "query": "PINN fatigue composite prediction",
      "mode": "standard",
      "source_results": {
        "openalex": { "found": 18, "errors": null },
        "semantic_scholar": { "found": 15, "errors": null },
        "arxiv": { "found": 8, "errors": null }
      },
      "papers_found": 53,
      "papers_new": 34,
      "created_at": "2026-03-15T09:30:00Z"
    }
  ]
}
```

#### `POST /api/projects/{id}/auto-select` ← `AutoSelectIn`

```json
// Request
{
  "threshold": 0.7              // score >= this → is_included = true
}

// Response → AutoSelectOut
{
  "papers_selected": 25,        // how many papers were auto-included
  "threshold": 0.7
}
```

---

### 5.3 Papers & Curation

#### `POST /api/projects/{id}/papers/save` ← `PaperSaveIn` **(NEW)**

> Saves selected papers from a search result into the project DB.
> This is the transition from temporary search results → persisted papers.

```json
// Request
{
  "search_id": 42,              // which search these came from
  "selections": [
    { "temp_index": 0, "is_included": true },    // save and include
    { "temp_index": 2, "is_included": true },
    { "temp_index": 5, "is_included": null },     // save as undecided
    { "temp_index": 7, "is_included": false }     // save as excluded
  ]
}

// Response → PaperSaveOut
{
  "saved": 4,
  "skipped_duplicates": 0,      // already in project (by DOI/title match)
  "paper_ids": [101, 102, 103, 104]  // DB ids of newly saved papers
}
```

#### `POST /api/papers/{id}/extract` → `PaperDetailOut` **(NEW)**

> Triggers Gemini AI extraction for a single saved paper.
> Populates ai_keywords, ai_objective, ai_method, ai_result.
> Also auto-creates paper_keywords entries from extracted keywords.

```json
// No request body

// Response → PaperDetailOut (with ai_* fields now populated)
```

#### `POST /api/projects/{id}/papers/extract` ← `BulkExtractIn` **(NEW)**

> Triggers Gemini extraction for multiple papers in a project.

```json
// Request
{
  "paper_ids": [101, 102, 103],          // specific papers
  // OR
  "filter": "included"                    // "included" | "all_unextracted"
}

// Response → BulkExtractOut
{
  "extracted": 3,
  "skipped": 0,                           // already had ai_keywords
  "failed": 0,
  "errors": []
}
```

#### `POST /api/papers/{id}/copy` ← `PaperCopyIn` **(NEW)**

> Copies a paper to another project. Creates a new paper row with same metadata.

```json
// Request
{
  "target_project_id": 2
}

// Response → PaperOut (compact, the newly created copy)
{
  "id": 205,                              // new paper id in target project
  "project_id": 2,
  "title": "PINN-based fatigue life prediction...",
  // ... same metadata, is_included reset to null
}
```

#### `GET /api/projects/{id}/papers` → `PaperListOut`

```json
// Query parameters:
//   ?page=1&limit=20
//   &sort=ai_relevance_score&order=desc
//   &is_included=true              (true | false | null for undecided | omit for all)
//   &keyword=PINN                  (filter by keyword canonical_form)
//   &year_min=2020&year_max=2025
//   &score_min=0.5&score_max=1.0
//   &source=openalex               (filter by source)
//   &q=neural+network              (full-text search in title + abstract)

// Response
{
  "papers": [
    {
      "id": 101,
      "title": "PINN-based fatigue life prediction for composite structures",
      "authors": [
        { "name": "Kim, J.", "affiliation": "KAIST" },
        { "name": "Park, S.", "affiliation": "Seoul National University" }
      ],
      "year": 2024,
      "venue": "Composites Part B",
      "doi": "10.1016/j.compositesb.2024.111234",
      "url": "https://doi.org/10.1016/j.compositesb.2024.111234",
      "cited_by_count": 23,
      "is_open_access": true,
      "ai_relevance_score": 0.87,
      "ai_keywords": "PINN; fatigue; composite; life prediction; damage mechanics",
      "is_included": true,
      "sources": ["openalex", "semantic_scholar", "crossref"],
      "discovered_at": "2026-03-15T09:30:00Z"
    }
    // ... more papers
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

**Note**: List view returns a **compact** paper object (no abstract, no references, no cited_by, no raw_metadata). Use `GET /api/papers/{id}` for full detail.

#### `GET /api/papers/{id}` → `PaperDetailOut`

```json
{
  "id": 101,
  "project_id": 1,

  // Identifiers
  "doi": "10.1016/j.compositesb.2024.111234",
  "openalex_id": "W4392837456",
  "s2_id": "a1b2c3d4e5f6",
  "arxiv_id": null,

  // Core metadata
  "title": "PINN-based fatigue life prediction for composite structures",
  "authors": [
    { "name": "Kim, J.", "affiliation": "KAIST" },
    { "name": "Park, S.", "affiliation": "Seoul National University" }
  ],
  "year": 2024,
  "venue": "Composites Part B",
  "abstract": "This study proposes a physics-informed neural network (PINN) framework for predicting fatigue life of carbon fiber reinforced polymer (CFRP) composite structures...",
  "url": "https://doi.org/10.1016/j.compositesb.2024.111234",
  "pdf_url": "https://arxiv.org/pdf/2024.12345",
  "tldr": "Proposes PINN framework for CFRP fatigue life prediction achieving 95% accuracy.",

  // Rich metadata
  "cited_by_count": 23,
  "is_open_access": true,
  "references": [
    { "doi": "10.1016/j.compstruct.2023.116789", "title": "Deep learning for composite damage detection", "year": 2023 },
    { "title": "Physics-informed machine learning for engineering applications", "year": 2022 }
  ],
  "cited_by": [
    { "doi": "10.1016/j.engfracmech.2025.109876", "title": "Multi-scale PINN for fatigue crack growth", "year": 2025 }
  ],

  // AI-generated fields
  "ai_relevance_score": 0.87,
  "ai_keywords": "PINN; fatigue; composite; life prediction; damage mechanics",
  "ai_objective": "Develop a PINN framework for predicting fatigue life of CFRP composite structures under cyclic loading.",
  "ai_method": "Physics-informed neural network combining classical fatigue damage models with deep learning, trained on experimental S-N curve data.",
  "ai_result": "Achieved 95% prediction accuracy on test data, outperforming conventional ML models by 12% with 60% less training data required.",

  // User curation
  "is_included": true,
  "user_note": "Key paper for methodology section. Compare with Park 2023.",

  // Keywords (resolved from paper_keywords junction)
  "keywords": [
    { "id": 1, "canonical_form": "PINN", "source": "ai" },
    { "id": 5, "canonical_form": "fatigue", "source": "ai" },
    { "id": 12, "canonical_form": "composite", "source": "user" }
  ],

  // Source tracking
  "sources": ["openalex", "semantic_scholar", "crossref"],
  "source_details": [
    { "source": "openalex", "source_id": "W4392837456", "fetched_at": "2026-03-15T09:30:00Z" },
    { "source": "semantic_scholar", "source_id": "a1b2c3d4e5f6", "fetched_at": "2026-03-15T09:30:00Z" },
    { "source": "crossref", "source_id": null, "fetched_at": "2026-03-15T09:31:00Z" }
  ],

  // Timestamps
  "discovered_at": "2026-03-15T09:30:00Z",
  "updated_at": "2026-03-15T14:00:00Z"
}
```

#### `PATCH /api/papers/{id}/include` ← `IncludeIn`

```json
// Request
{
  "is_included": true            // true | false | null (undecided)
}

// Response → PaperOut (compact, same as list item)
{
  "id": 101,
  "title": "PINN-based fatigue life prediction...",
  "is_included": true,
  "updated_at": "2026-03-15T15:00:00Z"
  // ... same fields as list item
}
```

#### `PUT /api/papers/{id}` ← `PaperUpdateIn`

```json
// Request — all fields optional, only send what changed
{
  "ai_keywords": "PINN; fatigue; CFRP; life prediction; damage mechanics; deep learning",
  "ai_objective": "Updated objective text here",
  "ai_method": "Updated method text here",
  "ai_result": "Updated result text here",
  "user_note": "Important for methodology section",
  "keyword_ids": [1, 5, 12, 23]    // replace all keyword associations (full list)
}

// Response → PaperDetailOut (full detail)
```

#### `POST /api/papers/{id}/refetch` → `PaperDetailOut`

No request body. Re-queries known sources for this paper's DOI/IDs and fills missing fields.
**This is also how references and cited_by are collected** (not fetched during search).

#### `DELETE /api/papers/{id}` → `204 No Content`

#### `POST /api/projects/{id}/papers/bulk-include` ← `BulkIncludeIn`

```json
// Request
{
  "paper_ids": [101, 102, 103, 104, 105],
  "is_included": true            // true | false | null
}

// Response → BulkResultOut
{
  "updated": 5
}
```

#### `POST /api/projects/{id}/papers/bulk-keywords` ← `BulkKeywordIn`

```json
// Request
{
  "paper_ids": [101, 103, 105],
  "keyword_id": 12,              // canonical keyword to assign
  "action": "add"                // "add" | "remove"
}

// Response → BulkResultOut
{
  "updated": 3
}
```

---

### 5.4 Keywords

#### `GET /api/keywords` → `KeywordListOut`

```json
{
  "keywords": [
    {
      "id": 1,
      "canonical_form": "PINN",
      "variants": ["physics-informed neural network", "physics informed NN", "Physics-Informed Neural Networks"],
      "created_at": "2026-03-01T00:00:00Z"
    },
    {
      "id": 2,
      "canonical_form": "FEM",
      "variants": ["finite element method", "finite element analysis", "FEA"],
      "created_at": "2026-03-01T00:00:00Z"
    }
  ]
}
```

#### `POST /api/keywords` ← `KeywordIn`

```json
// Request
{
  "canonical_form": "DT",
  "variants": ["digital twin", "digital twins"]       // optional
}

// Response → KeywordOut
{
  "id": 15,
  "canonical_form": "DT",
  "variants": ["digital twin", "digital twins"],
  "created_at": "2026-03-15T10:00:00Z"
}
```

#### `PUT /api/keywords/{id}` ← `KeywordIn`

```json
// Request — update canonical and/or variants
{
  "canonical_form": "DT",
  "variants": ["digital twin", "digital twins", "Digital Twin Technology"]
}

// Response → KeywordOut (same shape as POST response)
```

#### `DELETE /api/keywords/{id}` → `204 No Content`

#### `GET /api/projects/{id}/keyword-stats` → `KeywordStatsOut`

```json
{
  "project_id": 1,
  "stats": [
    { "keyword_id": 1, "canonical_form": "PINN", "paper_count": 65 },
    { "keyword_id": 5, "canonical_form": "fatigue", "paper_count": 58 },
    { "keyword_id": 12, "canonical_form": "composite", "paper_count": 42 },
    { "keyword_id": 3, "canonical_form": "FEM", "paper_count": 28 }
  ],
  "total_keywords": 34
}
```

---

### 5.5 Export

#### `GET /api/projects/{id}/export/csv`

```
// Query parameters:
//   ?columns=title,doi,year,venue,ai_keywords,ai_objective,ai_method,ai_result
//   (comma-separated column names; omit for defaults)

// Response: Content-Type: text/csv
// Content-Disposition: attachment; filename="PINN_Fatigue_Review_2026_export.csv"

// Available columns:
//   title, first_author, authors, doi, year, venue, abstract,
//   url, pdf_url, cited_by_count, is_open_access,
//   ai_relevance_score, ai_keywords, ai_objective, ai_method, ai_result,
//   sources, discovered_at

// Default columns (if ?columns omitted):
//   title, first_author, doi, venue, year, ai_keywords, ai_objective, ai_method, ai_result
```

#### `POST /api/projects/{id}/export/zotero` → `ZoteroSyncOut`

```json
// No request body (uses .env ZOTERO_USER_ID + ZOTERO_API_KEY)

// Response
{
  "collection_key": "ABC123XY",
  "papers_synced": 15,            // newly synced in this request
  "papers_total": 80,             // total in collection
  "status": "success"             // "success" | "partial" | "error"
}
```

#### `GET /api/projects/{id}/export/zotero/status` → `ZoteroStatusOut`

```json
{
  "project_id": 1,
  "collection_key": "ABC123XY",   // null if never synced
  "papers_synced": 80,
  "last_synced_at": "2026-03-15T14:00:00Z"   // null if never synced
}
```

---

### 5.6 Error Response Format (All Endpoints)

```json
// 400 Bad Request
{
  "detail": "Invalid search mode. Must be one of: quick, standard, deep"
}

// 404 Not Found
{
  "detail": "Project not found"
}

// 422 Validation Error (FastAPI default)
{
  "detail": [
    {
      "loc": ["body", "name"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}

// 500 Internal Server Error
{
  "detail": "Search failed: OpenAlex API timeout"
}
```

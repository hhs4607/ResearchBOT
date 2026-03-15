"""Pydantic request/response schemas (per api-contract-sync.md Section 5)."""

from __future__ import annotations

from pydantic import BaseModel


# --- Projects ---

class ProjectIn(BaseModel):
    name: str
    description: str | None = None


class PaperCounts(BaseModel):
    total: int = 0
    included: int = 0
    excluded: int = 0
    undecided: int = 0


class ProjectOut(BaseModel):
    id: int
    name: str
    description: str | None = None
    created_at: str | None = None
    updated_at: str | None = None


class ProjectListItem(ProjectOut):
    paper_counts: PaperCounts = PaperCounts()
    search_count: int = 0


class KeywordCount(BaseModel):
    keyword: str
    count: int


class YearRange(BaseModel):
    min: int | None = None
    max: int | None = None


class ProjectDetailOut(ProjectListItem):
    top_keywords: list[KeywordCount] = []
    year_range: YearRange = YearRange()


# --- Search ---

class SearchIn(BaseModel):
    query: str
    mode: str = "standard"
    year_min: int | None = None
    year_max: int | None = None
    limit_per_source: int | None = None


class SourceResult(BaseModel):
    found: int = 0
    errors: str | None = None


class SearchPaperOut(BaseModel):
    temp_index: int
    title: str
    authors: list[dict] = []
    year: int | None = None
    venue: str = ""
    doi: str | None = None
    abstract: str = ""
    url: str = ""
    pdf_url: str | None = None
    cited_by_count: int = 0
    is_open_access: bool = False
    ai_relevance_score: float = 0
    sources: list[str] = []
    already_saved: bool = False


class SearchResultOut(BaseModel):
    search_id: int
    query: str
    mode: str
    source_results: dict[str, SourceResult] = {}
    papers_found: int = 0
    papers_deduped: int = 0
    already_in_project: int = 0
    papers: list[SearchPaperOut] = []


class AutoSelectIn(BaseModel):
    threshold: float


class AutoSelectOut(BaseModel):
    papers_selected: int
    threshold: float


# --- Papers ---

class PaperSaveSelection(BaseModel):
    temp_index: int
    is_included: bool | None = None


class PaperSaveIn(BaseModel):
    search_id: int
    selections: list[PaperSaveSelection]


class PaperSaveOut(BaseModel):
    saved: int
    skipped_duplicates: int
    paper_ids: list[int] = []


class IncludeIn(BaseModel):
    is_included: bool | None = None


class PaperUpdateIn(BaseModel):
    ai_keywords: str | None = None
    ai_objective: str | None = None
    ai_method: str | None = None
    ai_result: str | None = None
    user_note: str | None = None
    keyword_ids: list[int] | None = None


class PaperCopyIn(BaseModel):
    target_project_id: int


class BulkIncludeIn(BaseModel):
    paper_ids: list[int]
    is_included: bool | None = None


class BulkKeywordIn(BaseModel):
    paper_ids: list[int]
    keyword_id: int
    action: str = "add"


class BulkResultOut(BaseModel):
    updated: int


class BulkExtractIn(BaseModel):
    paper_ids: list[int] | None = None
    filter: str | None = None  # "included" | "all_unextracted"


class BulkExtractOut(BaseModel):
    extracted: int
    skipped: int
    failed: int
    errors: list[str] = []


class Pagination(BaseModel):
    page: int
    limit: int
    total: int
    total_pages: int


# --- Keywords ---

class KeywordIn(BaseModel):
    canonical_form: str
    variants: list[str] | None = None


class KeywordOut(BaseModel):
    id: int
    canonical_form: str
    variants: list[str] = []
    created_at: str | None = None


class KeywordStatItem(BaseModel):
    keyword_id: int
    canonical_form: str
    paper_count: int


class KeywordStatsOut(BaseModel):
    project_id: int
    stats: list[KeywordStatItem] = []
    total_keywords: int = 0


# --- Export ---

class ZoteroSyncOut(BaseModel):
    collection_key: str | None = None
    papers_synced: int = 0
    papers_total: int = 0
    status: str = "success"


class ZoteroStatusOut(BaseModel):
    project_id: int
    collection_key: str | None = None
    papers_synced: int = 0
    last_synced_at: str | None = None

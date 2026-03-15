export interface ProjectListOut {
  projects: ProjectOut[];
}

export interface ProjectOut {
  id: number;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
  // Included in list view:
  paper_counts?: {
    total: number;
    included: number;
    excluded: number;
    undecided: number;
  };
  search_count?: number;
}

export interface ProjectDetailOut extends ProjectOut {
  top_keywords: { keyword: string; count: number }[];
  year_range: { min: number; max: number };
}

export interface ProjectIn {
  name: string;
  description?: string;
}

export interface SearchIn {
  query: string;
  mode: "quick" | "standard" | "deep";
  year_min?: number;
  year_max?: number | null;
  limit_per_source?: number;
}

export interface SearchResultOut {
  search_id: number;
  query: string;
  mode: string;
  source_results: Record<string, { found: number; errors: string | null }>;
  papers_found: number;
  papers_new: number;
  papers_duplicate: number;
  papers: PaperOut[];
}

export interface SearchLogListOut {
  searches: Omit<SearchResultOut, "papers" | "papers_duplicate">[];
}

export interface AutoSelectIn {
  threshold: number;
}

export interface AutoSelectOut {
  papers_selected: number;
  threshold: number;
}

export interface PaperOut {
  id: number;
  title: string;
  authors: { name: string; affiliation?: string }[];
  year: number;
  venue: string;
  doi?: string | null;
  url?: string | null;
  cited_by_count: number;
  is_open_access: boolean;
  ai_relevance_score: number;
  ai_keywords: string;
  is_included: boolean | number | null;
  sources: string[];
  discovered_at: string;
  updated_at?: string;
}

export interface PaperListOut {
  papers: PaperOut[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface PaperDetailOut extends PaperOut {
  project_id: number;
  openalex_id?: string | null;
  s2_id?: string | null;
  arxiv_id?: string | null;
  abstract: string;
  pdf_url?: string | null;
  tldr?: string | null;
  references: { doi?: string; title: string; year?: number }[];
  cited_by: { doi?: string; title: string; year?: number }[];
  ai_objective?: string | null;
  ai_method?: string | null;
  ai_result?: string | null;
  user_note?: string | null;
  keywords: { id: number; canonical_form: string; source: "ai" | "user" | "manual" }[];
  source_details: { source: string; source_id: string | null; fetched_at: string }[];
}

export interface IncludeIn {
  is_included: boolean | number | null;
}

export interface PaperUpdateIn {
  ai_keywords?: string;
  ai_objective?: string;
  ai_method?: string;
  ai_result?: string;
  user_note?: string;
  keyword_ids?: number[];
}

export interface BulkIncludeIn {
  paper_ids: number[];
  is_included: boolean | number | null;
}

export interface BulkKeywordIn {
  paper_ids: number[];
  keyword_id: number;
  action: "add" | "remove";
}

export interface BulkResultOut {
  updated: number;
}

export interface KeywordOut {
  id: number;
  canonical_form: string;
  variants: string[];
  created_at: string;
}

export interface KeywordListOut {
  keywords: KeywordOut[];
}

export interface KeywordIn {
  canonical_form: string;
  variants?: string[];
}

export interface KeywordStatsOut {
  project_id: number;
  stats: { keyword_id: number; canonical_form: string; paper_count: number }[];
  total_keywords: number;
}

export interface ZoteroSyncOut {
  collection_key: string;
  papers_synced: number;
  papers_total: number;
  status: "success" | "partial" | "error";
}

export interface ZoteroStatusOut {
  project_id: number;
  collection_key: string | null;
  papers_synced: number;
  last_synced_at: string | null;
}

export interface ApiError {
  detail: string | Array<{ loc: string[]; msg: string; type: string }>;
}

import { z } from "zod";

export const ProjectSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  paper_counts: z
    .object({
      total: z.number(),
      included: z.number(),
      excluded: z.number(),
      undecided: z.number(),
    })
    .optional(),
  search_count: z.number().optional(),
});

export const ProjectListSchema = z.object({
  projects: z.array(ProjectSchema),
});

export const ProjectDetailSchema = ProjectSchema.extend({
  top_keywords: z.array(
    z.object({
      keyword: z.string(),
      count: z.number(),
    })
  ),
  year_range: z.object({
    min: z.number(),
    max: z.number(),
  }),
});

export const ProjectCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

export const SearchModeEnum = z.enum(["quick", "standard", "deep"]);

export const SearchTriggerSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  mode: SearchModeEnum.default("standard"),
  year_min: z.number().optional(),
  year_max: z.number().nullable().optional(),
  limit_per_source: z.number().optional().default(20),
});

export const PaperCompactSchema = z.object({
  id: z.number(),
  title: z.string(),
  authors: z.array(
    z.object({
      name: z.string(),
      affiliation: z.string().optional(),
    })
  ),
  year: z.number(),
  venue: z.string(),
  doi: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  cited_by_count: z.number(),
  is_open_access: z.boolean(),
  ai_relevance_score: z.number(),
  ai_keywords: z.string(),
  is_included: z.boolean().nullable(),
  sources: z.array(z.string()),
  discovered_at: z.string(),
  updated_at: z.string().optional(),
});

export const SearchResultSchema = z.object({
  search_id: z.number(),
  query: z.string(),
  mode: z.string(),
  source_results: z.record(
    z.string(),
    z.object({
      found: z.number(),
      errors: z.string().nullable(),
    })
  ),
  papers_found: z.number(),
  papers_new: z.number(),
  papers_duplicate: z.number(),
  papers: z.array(PaperCompactSchema),
});

export const SearchLogSchema = SearchResultSchema.omit({
  papers: true,
  papers_duplicate: true,
});

export const SearchLogListSchema = z.object({
  searches: z.array(SearchLogSchema),
});

export const PaperDetailSchema = PaperCompactSchema.extend({
  project_id: z.number(),
  openalex_id: z.string().nullable().optional(),
  s2_id: z.string().nullable().optional(),
  arxiv_id: z.string().nullable().optional(),
  abstract: z.string(),
  pdf_url: z.string().nullable().optional(),
  tldr: z.string().nullable().optional(),
  references: z.array(
    z.object({
      doi: z.string().optional(),
      title: z.string(),
      year: z.number().optional(),
    })
  ),
  cited_by: z.array(
    z.object({
      doi: z.string().optional(),
      title: z.string(),
      year: z.number().optional(),
    })
  ),
  ai_objective: z.string().nullable().optional(),
  ai_method: z.string().nullable().optional(),
  ai_result: z.string().nullable().optional(),
  user_note: z.string().nullable().optional(),
  keywords: z.array(
    z.object({
      id: z.number(),
      canonical_form: z.string(),
      source: z.enum(["ai", "user", "manual"]),
    })
  ),
  source_details: z.array(
    z.object({
      source: z.string(),
      source_id: z.string().nullable(),
      fetched_at: z.string(),
    })
  ),
});

export const PaperListSchema = z.object({
  papers: z.array(PaperCompactSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    total_pages: z.number(),
  }),
});

export const KeywordSchema = z.object({
  id: z.number(),
  canonical_form: z.string(),
  variants: z.array(z.string()),
  created_at: z.string(),
});

export const KeywordListSchema = z.object({
  keywords: z.array(KeywordSchema),
});

export const KeywordStatsSchema = z.object({
  project_id: z.number(),
  stats: z.array(
    z.object({
      keyword_id: z.number(),
      canonical_form: z.string(),
      paper_count: z.number(),
    })
  ),
  total_keywords: z.number(),
});

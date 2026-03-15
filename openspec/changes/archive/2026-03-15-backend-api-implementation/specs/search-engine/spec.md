## ADDED Requirements

### Requirement: Multi-source parallel search
The system SHALL search across 6 academic APIs in parallel: OpenAlex, Semantic Scholar, arXiv, CrossRef, PubMed, Google Scholar. Each source runs independently; failure in one MUST NOT block others.

#### Scenario: Standard search (3 sources)
- **WHEN** user searches with mode "standard" and keywords "PINN fatigue"
- **THEN** the system queries OpenAlex, Semantic Scholar, and arXiv in parallel and returns merged results

#### Scenario: Deep search (all 6 sources)
- **WHEN** user searches with mode "deep" and keywords "PINN fatigue"
- **THEN** the system queries all 6 sources in parallel and returns merged results

#### Scenario: Quick search (1 source)
- **WHEN** user searches with mode "quick" and keywords "PINN fatigue"
- **THEN** the system queries OpenAlex only and returns results

#### Scenario: Source failure graceful handling
- **WHEN** Google Scholar returns an error during a deep search
- **THEN** the other 5 sources' results are still returned, and the error is logged in source_results

### Requirement: Unified search result format
Each source client SHALL normalize results to a common dataclass with fields: title, authors (list of {name, affiliation?}), year, venue, abstract, doi, url, pdf_url, arxiv_id, cited_by_count, is_open_access, tldr, references, cited_by, author_keywords, raw_metadata, source_name, source_id.

#### Scenario: OpenAlex result normalization
- **WHEN** OpenAlex returns a paper with its native format
- **THEN** the result is converted to the unified format with source_name="openalex"

### Requirement: Deduplication on merge
The system SHALL deduplicate results from multiple sources by: (1) exact DOI match, (2) fuzzy title match with rapidfuzz ratio >= 90, (3) cross-source ID match (same openalex_id, s2_id, or arxiv_id). When duplicates are found, metadata SHALL be merged (richest version of each field).

#### Scenario: Same paper from OpenAlex and S2
- **WHEN** both sources return a paper with DOI "10.1234/example"
- **THEN** a single merged result is returned combining metadata from both sources

#### Scenario: Fuzzy title match
- **WHEN** OpenAlex returns "PINN-based fatigue prediction" and Scholar returns "PINN based fatigue prediction"
- **THEN** these are identified as the same paper (ratio >= 90) and merged

### Requirement: Domain-specific acronym expansion
The system SHALL expand domain-specific acronyms in search queries. The expansion dictionary SHALL contain the merged union of 07_Research_Bot (66+) and PaperReviewBot (25+) mappings.

#### Scenario: Acronym expansion in search
- **WHEN** user searches for "PINN fatigue"
- **THEN** the system also searches for "physics-informed neural network fatigue"

### Requirement: Search results saved to project
The system SHALL save search results to the project database. New papers are inserted; existing papers (by dedup match) have their metadata merged. A search_log entry tracks the search, and search_papers junction links the search to found papers.

#### Scenario: Repeated search adds only new papers
- **WHEN** user searches "PINN fatigue" twice with the same project
- **THEN** the second search only adds papers not already in the project, and papers_new reflects the count of truly new additions

### Requirement: Source-specific API clients
Each source SHALL be implemented as a standalone module in `src/search/`:

- **OpenAlex**: REST via httpx, polite pool with email header, 0.5s delay
- **Semantic Scholar**: REST via httpx, optional API key, 1 req/sec rate limit, exponential backoff on 429
- **arXiv**: via `arxiv` Python library, 1 req/3sec
- **CrossRef**: REST via httpx, polite pool with email header
- **PubMed**: Entrez REST via httpx, optional NCBI API key, 3 req/sec
- **Google Scholar**: via `scholarly` library, best-effort, ~1 req/3sec

#### Scenario: Rate limiting compliance
- **WHEN** multiple searches are executed rapidly
- **THEN** each source client respects its rate limit (delays between requests)

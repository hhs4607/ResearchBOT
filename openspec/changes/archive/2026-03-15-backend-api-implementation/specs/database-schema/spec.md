## ADDED Requirements

### Requirement: SQLite database with WAL mode
The system SHALL use SQLite with WAL (Write-Ahead Logging) mode as the single data store. The database file SHALL be located at `data/research_bot.db`.

#### Scenario: Database initialization
- **WHEN** the application starts and no database file exists
- **THEN** the system creates the database with all 8 tables and enables WAL mode

#### Scenario: Concurrent read access
- **WHEN** a search is writing results while the user queries the paper list
- **THEN** both operations succeed without blocking (WAL mode)

### Requirement: Projects table
The system SHALL store review projects with fields: id (PK), name (NOT NULL), description, created_at, updated_at.

#### Scenario: Create project
- **WHEN** a project is created with name "PINN Fatigue Review 2026"
- **THEN** a row is inserted with auto-generated id and current timestamps

### Requirement: Papers table with rich metadata
The system SHALL store papers with identifiers (doi, openalex_id, s2_id, arxiv_id), core metadata (title, authors JSON, year, venue, abstract, url, pdf_url, tldr), rich metadata (cited_by_count, is_open_access, references JSON, cited_by JSON), AI fields (ai_relevance_score, ai_keywords, ai_objective, ai_method, ai_result), user curation (is_included, user_note), and source tracking (sources JSON, raw_metadata JSON). Each paper MUST belong to a project_id.

#### Scenario: Paper uniqueness within project
- **WHEN** a paper with the same DOI already exists in the project
- **THEN** the insert is rejected (UNIQUE constraint on project_id + doi)

#### Scenario: Paper with duplicate title
- **WHEN** a paper with the same title already exists in the project
- **THEN** the insert is rejected (UNIQUE constraint on project_id + title)

### Requirement: Keywords table for normalization
The system SHALL store canonical keywords with fields: id (PK), canonical_form (UNIQUE, NOT NULL), variants (JSON array of alternative forms), created_at.

#### Scenario: Canonical keyword creation
- **WHEN** keyword "PINN" is created with variants ["physics-informed neural network", "physics informed NN"]
- **THEN** a row is stored with canonical_form="PINN" and variants as JSON array

### Requirement: Paper-keyword junction table
The system SHALL maintain a paper_keywords junction table with paper_id, keyword_id, and source ('ai'|'author'|'user'). Cascading deletes on both foreign keys.

#### Scenario: Delete paper removes keyword associations
- **WHEN** a paper is deleted
- **THEN** all paper_keywords rows for that paper are also deleted

### Requirement: Search logs tracking
The system SHALL log every search with fields: id, project_id, query, search_mode, source_results (JSON per-source counts), papers_found, papers_new, created_at. A search_papers junction table tracks which papers each search found.

#### Scenario: Search history query
- **WHEN** user requests search history for a project
- **THEN** all searches are returned with their query, mode, result counts, and timestamps

### Requirement: Paper sources tracking
The system SHALL track per-source metadata for each paper in paper_sources table with paper_id, source, source_id, metadata (JSON), fetched_at. Primary key is (paper_id, source).

#### Scenario: Multi-source paper
- **WHEN** a paper is found in both OpenAlex and Semantic Scholar
- **THEN** two rows exist in paper_sources with source-specific IDs and metadata

### Requirement: Zotero sync tracking
The system SHALL track Zotero sync status per project in zotero_sync table with id, project_id, collection_key, papers_synced, last_synced_at.

#### Scenario: Sync status query
- **WHEN** user requests Zotero sync status for a project
- **THEN** the system returns the collection key, papers synced count, and last sync timestamp

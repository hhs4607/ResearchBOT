## ADDED Requirements

### Requirement: CSV export with configurable columns
The system SHALL export included papers (is_included=1) from a project as a CSV file. The user SHALL be able to select which columns to include. Default columns: title, first_author (parsed from authors JSON), doi, venue, year, ai_keywords, ai_objective, ai_method, ai_result.

#### Scenario: Default CSV export
- **WHEN** user requests CSV export for project 1 with default columns
- **THEN** a CSV file is returned containing all included papers with the 9 default columns

#### Scenario: Custom column selection
- **WHEN** user requests CSV export with columns ["title", "doi", "year", "cited_by_count"]
- **THEN** a CSV file is returned with only those 4 columns

#### Scenario: No included papers
- **WHEN** user requests CSV export but no papers have is_included=1
- **THEN** an empty CSV with headers only is returned

### Requirement: Zotero collection sync
The system SHALL sync included papers to a Zotero collection: create a collection per project (if not exists), push papers by DOI using pyzotero. Sync is non-blocking (failures do not affect other operations).

#### Scenario: First Zotero sync
- **WHEN** user triggers Zotero sync for project 1 (no prior sync)
- **THEN** a Zotero collection is created with the project name, included papers are pushed by DOI, and zotero_sync table is updated

#### Scenario: Incremental sync
- **WHEN** user triggers Zotero sync for project 1 (previously synced 50 papers, now 60 included)
- **THEN** only the 10 new papers are pushed to the existing collection

#### Scenario: Zotero API failure
- **WHEN** Zotero API returns an error
- **THEN** the error is logged, sync status is not updated, and the user is informed of the failure

### Requirement: Zotero sync status
The system SHALL provide sync status per project: collection key, papers synced count, last sync timestamp.

#### Scenario: Check sync status
- **WHEN** user requests Zotero sync status for project 1
- **THEN** the system returns collection_key, papers_synced, and last_synced_at

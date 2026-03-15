## ADDED Requirements

### Requirement: Paper listing with filtering and pagination
The system SHALL provide a paper list endpoint that supports: filtering by keyword, year range, include/exclude status (NULL/true/false), relevance score range, and source; sorting by relevance_score, year, cited_by_count, title, discovered_at; pagination with offset and limit.

#### Scenario: Filter included papers only
- **WHEN** user requests papers with is_included=true for project 1
- **THEN** only papers where is_included=1 are returned

#### Scenario: Filter by keyword
- **WHEN** user requests papers with keyword "PINN" for project 1
- **THEN** only papers linked to the "PINN" keyword via paper_keywords are returned

#### Scenario: Paginated results
- **WHEN** user requests page 2 with limit 20
- **THEN** papers 21-40 are returned with total count in response

### Requirement: Paper detail with full metadata
The system SHALL return complete paper metadata including all identifiers, core metadata, rich metadata (references, cited_by), AI fields, user curation fields, source details, and associated keywords.

#### Scenario: Get paper detail
- **WHEN** user requests paper with id=42
- **THEN** all fields including references list, cited_by list, and keywords are returned

### Requirement: Paper field editing
The system SHALL allow editing of: ai_keywords, ai_objective, ai_method, ai_result, user_note, and keyword associations. Editing ai_keywords SHALL trigger re-normalization against the keyword dictionary.

#### Scenario: Edit AI objective
- **WHEN** user updates ai_objective for paper 42 to "Predict fatigue life using PINN"
- **THEN** the field is updated and updated_at is refreshed

#### Scenario: Add keyword to paper
- **WHEN** user adds keyword "fatigue" to paper 42
- **THEN** a paper_keywords row is created with source='user'

### Requirement: Include/exclude toggle
The system SHALL allow toggling is_included between NULL (undecided), true (include), and false (exclude) for individual papers.

#### Scenario: Mark paper as included
- **WHEN** user sets paper 42 as included
- **THEN** is_included is set to 1 and updated_at is refreshed

#### Scenario: Mark paper as excluded
- **WHEN** user sets paper 42 as excluded
- **THEN** is_included is set to 0

### Requirement: Bulk operations
The system SHALL support bulk include/exclude (set is_included for multiple paper IDs) and bulk keyword assignment (add a keyword to multiple papers).

#### Scenario: Bulk include 10 papers
- **WHEN** user sends bulk include request with paper IDs [1,2,3,...,10]
- **THEN** all 10 papers have is_included set to 1

#### Scenario: Bulk keyword assignment
- **WHEN** user assigns keyword "composite" to papers [1,3,5]
- **THEN** paper_keywords rows are created for all 3 papers with source='user'

### Requirement: Auto-select by threshold
The system SHALL support auto-selecting papers: set is_included=1 for all papers in a project where ai_relevance_score >= user-specified threshold and is_included IS NULL (undecided only).

#### Scenario: Auto-select above 0.7
- **WHEN** user triggers auto-select with threshold 0.7 for project 1
- **THEN** all undecided papers with score >= 0.7 are set to is_included=1; already decided papers are not changed

### Requirement: Metadata re-fetch
The system SHALL allow re-fetching a paper's metadata from its known sources to fill in missing fields (e.g., references, cited_by, pdf_url that were not available at initial search time).

#### Scenario: Re-fetch enriches missing fields
- **WHEN** user triggers re-fetch for paper 42 which has no references
- **THEN** the system queries OpenAlex and S2 for that paper's DOI and fills in references and cited_by if available

### Requirement: Paper deletion
The system SHALL allow deleting a paper from a project. Deletion cascades to paper_keywords, search_papers, and paper_sources.

#### Scenario: Delete paper with cascade
- **WHEN** user deletes paper 42
- **THEN** the paper row and all associated junction table rows are removed

### Requirement: Full-text search within project
The system SHALL support searching within paper titles and abstracts using LIKE queries for a given project.

#### Scenario: Search "neural network" within project
- **WHEN** user searches "neural network" within project 1
- **THEN** papers whose title or abstract contains "neural network" are returned

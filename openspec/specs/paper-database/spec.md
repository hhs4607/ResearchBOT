## ADDED Requirements

### Requirement: Paper Database Listing & Filtering
The frontend SHALL display a list of all papers in a project with pagination. It SHALL allow filtering by keyword, year range, include/exclude status, relevance score, and source.

#### Scenario: User filters papers
- **WHEN** user selects the "Include Only" filter and a specific score range
- **THEN** system updates the data table to display only the papers matching those criteria

### Requirement: Paper Detail View
The system SHALL provide a detailed view of a selected paper including full metadata, AI-extracted fields (objective, method, result), and user notes.

#### Scenario: Viewing paper details
- **WHEN** user clicks on a paper in the list
- **THEN** a detailed view is presented containing the paper's canonical URL, PDF link, and AI generated summary

### Requirement: Manual Curation Controls
The frontend SHALL provide controls for the user to manually toggle the include/exclude status of a paper, edit AI-extracted keywords, and add a custom memo.

#### Scenario: Curating a paper
- **WHEN** user clicks the "Include" button on a specific paper's detail view
- **THEN** the paper's status is toggled and saved via the backend API

### Requirement: AI Extraction Triggers
The frontend SHALL provide buttons to manually trigger Gemini AI extraction (for objective, method, result, and keywords) on saved papers, both individually and in bulk.

#### Scenario: Triggering extraction on a paper
- **WHEN** user clicks "Extract AI Summary" on a paper detail view
- **THEN** the system calls the `/api/papers/{id}/extract` endpoint and updates the UI with the generated fields

### Requirement: Cross-Project Copying
The system SHALL allow users to copy a saved paper to a different project.

#### Scenario: Copying a paper
- **WHEN** user selects "Copy to Project" and chooses a destination project
- **THEN** the system calls the `/api/papers/{id}/copy` endpoint to duplicate the paper reference

### Requirement: Bulk Operations
The system SHALL support bulk operations allowing users to select multiple papers and apply "bulk include/exclude", "auto-select" based on a score threshold, or "bulk extract".

#### Scenario: Auto-selecting top papers
- **WHEN** user sets an auto-select threshold (e.g., score >= 0.70)
- **THEN** all papers in the current project exceeding that threshold are automatically marked as included

## MODIFIED Requirements

### Requirement: Search state resets on new query
The search results page SHALL reset the `savedAll` flag when a new search query is submitted, ensuring the "Save all" button reappears for new results.

#### Scenario: New search shows save button
- **WHEN** user performs a new search after previously saving all results
- **THEN** the "Save all N to DB" button SHALL appear for the new results

### Requirement: Paper cards are keyboard-accessible
Search result PaperCard components SHALL be operable via keyboard (Enter/Space to expand, Tab to navigate between cards).

#### Scenario: Keyboard expand abstract
- **WHEN** user focuses a PaperCard and presses Enter
- **THEN** the card SHALL expand to show the full abstract

## ADDED Requirements

### Requirement: CopyProjectDialog calls real API
The Copy to Project dialog SHALL call `POST /api/papers/{id}/copy` with `{ target_project_id }` instead of a mock timeout.

#### Scenario: Paper copy to another project
- **WHEN** user selects a destination project and clicks "Copy Paper"
- **THEN** the system SHALL make a real API call and show success/error feedback via toast

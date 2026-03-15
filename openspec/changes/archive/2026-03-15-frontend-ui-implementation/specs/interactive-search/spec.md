## ADDED Requirements

### Requirement: Interactive Search UI
The frontend SHALL provide a Google-style search interface with an autocomplete search bar.

#### Scenario: User performs a search
- **WHEN** user enters a query "papers by Kim about PINN 2024"
- **THEN** system navigates to the results page displaying filtered papers

### Requirement: Search Result Cards (Temporary)
The system SHALL display search results as temporary cards featuring title, authors, year, abstract snippet, and the initial composite relevance score. 

#### Scenario: Interacting with a temporary result card
- **WHEN** user views a search result
- **THEN** the card SHALL provide a prominent "Save to Project" button to persist the paper in the database

### Requirement: Saving Search Results
The frontend SHALL allow users to persist one or more temporary search results into the project's SQLite database via the `/api/projects/{id}/papers/save` endpoint.

#### Scenario: Saving a paper
- **WHEN** user clicks "Save to Project" on a search result
- **THEN** the system triggers the save API and visually confirms the paper is now tracked in the project's Paper Database

### Requirement: Sorting and Filtering Controls
The search results page SHALL provide controls to sort results by relevance, date, citations, or best match, and filter by search modes (quick, standard, deep, semantic).

#### Scenario: Changing sort order
- **WHEN** user selects "Sort by Date"
- **THEN** the displayed results list updates to show the newest papers first

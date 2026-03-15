## ADDED Requirements

### Requirement: Canonical keyword CRUD
The system SHALL provide CRUD operations for canonical keywords: create (canonical_form + optional variants), read (list all), update (modify canonical_form or add/remove variants), delete (with cascade to paper_keywords).

#### Scenario: Create keyword with variants
- **WHEN** user creates keyword with canonical_form="PINN" and variants=["physics-informed neural network", "physics informed NN"]
- **THEN** a keyword row is created with canonical_form="PINN" and variants stored as JSON

#### Scenario: Add variant to existing keyword
- **WHEN** user adds variant "Physics Informed Neural Networks" to keyword "PINN"
- **THEN** the variants JSON array is updated to include the new variant

#### Scenario: Delete keyword
- **WHEN** user deletes keyword "PINN"
- **THEN** the keyword row is removed and all paper_keywords referencing it are deleted

### Requirement: Keyword normalization function
The system SHALL provide a normalization function that: lowercases the input, strips whitespace, checks against all variant lists in the keywords table, and returns the canonical_form if a match is found, or the original string if no match.

#### Scenario: Normalize known variant
- **WHEN** normalizing "Physics-Informed Neural Network"
- **THEN** returns "PINN" (matched via variants list)

#### Scenario: Normalize unknown term
- **WHEN** normalizing "multi-fidelity surrogate"
- **THEN** returns "multi-fidelity surrogate" unchanged (no match in dictionary)

### Requirement: Keyword frequency statistics per project
The system SHALL compute keyword frequency (how many papers in a project are associated with each keyword) and return sorted results.

#### Scenario: Keyword frequency query
- **WHEN** user requests keyword stats for project 1
- **THEN** returns list of keywords with paper counts, sorted by frequency descending

### Requirement: Seed keyword dictionary
The system SHALL seed the keyword dictionary on first run from merged abbreviation mappings: 66+ from 07_Research_Bot and 25+ from PaperReviewBot. Duplicates are deduplicated by canonical form.

#### Scenario: Initial seed
- **WHEN** the database is initialized for the first time
- **THEN** the keywords table is populated with the merged abbreviation dictionary

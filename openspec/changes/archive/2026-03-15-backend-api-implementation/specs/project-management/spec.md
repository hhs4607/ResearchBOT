## ADDED Requirements

### Requirement: Project CRUD
The system SHALL support creating, reading, updating, and deleting review projects. Each project has a name (required), description (optional), and timestamps.

#### Scenario: Create project
- **WHEN** user creates a project with name "PINN Fatigue Review 2026"
- **THEN** a project row is created with auto-generated id and current timestamps

#### Scenario: List projects
- **WHEN** user requests all projects
- **THEN** all projects are returned with paper counts (total, included, excluded, undecided)

#### Scenario: Update project
- **WHEN** user renames project 1 to "PINN Fatigue Review — Final"
- **THEN** the name is updated and updated_at is refreshed

#### Scenario: Delete project with cascade
- **WHEN** user deletes project 1
- **THEN** the project and ALL associated papers, search_logs, search_papers, paper_sources, paper_keywords, and zotero_sync rows are deleted

### Requirement: Project summary statistics
The system SHALL provide per-project summary: total papers, included count, excluded count, undecided count, top keywords, search count, date range of papers.

#### Scenario: Project summary
- **WHEN** user requests summary for project 1
- **THEN** returns counts (total=150, included=80, excluded=30, undecided=40), top 10 keywords by frequency, total searches performed, and year range of papers

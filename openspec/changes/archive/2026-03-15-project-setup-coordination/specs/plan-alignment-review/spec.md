## ADDED Requirements

### Requirement: Plan mismatch documentation
The system SHALL maintain a documented comparison of backend and frontend plans in `docs/COORDINATION.md`, listing every feature mismatch between PRD v1 (frontend) and PRD v2 (backend).

#### Scenario: User checks plan alignment
- **WHEN** user or Antigravity opens COORDINATION.md
- **THEN** they see a clear table of what changed, what was removed, and what was added between v1 and v2

### Requirement: Frontend plan update requirements
The coordination document SHALL list specific actions Antigravity must take to align the frontend plan with PRD v2: tasks to remove, tasks to add, specs to update, and specs to delete.

#### Scenario: Antigravity reviews update requirements
- **WHEN** Antigravity reads the "Frontend Plan Updates Required" section
- **THEN** they have a clear checklist of changes to make to `frontend-ui-implementation`

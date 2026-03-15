## ADDED Requirements

### Requirement: Shared coordination document
The system SHALL have a `docs/COORDINATION.md` file that serves as the communication channel between Claude (backend) and Antigravity (frontend). This document is the single source of truth for cross-team decisions.

#### Scenario: New coordination item
- **WHEN** either side discovers something that affects the other (API change, new requirement, blocker)
- **THEN** it is recorded in COORDINATION.md with date, owner, status, and description

### Requirement: API contract section
The coordination document SHALL include an API Contract section listing: every endpoint path, HTTP method, request/response Pydantic model names, and delivery status (not started / in progress / ready / changed).

#### Scenario: Frontend checks API readiness
- **WHEN** Antigravity wants to integrate a real endpoint instead of mock
- **THEN** they check the API Contract section to see if the endpoint is marked "ready"

### Requirement: Blocking dependencies section
The coordination document SHALL list blocking dependencies: what backend must deliver before frontend can proceed, and what frontend must deliver before backend can test integration.

#### Scenario: Identify blockers
- **WHEN** either side is blocked waiting for the other
- **THEN** the blocker is logged with expected delivery date

### Requirement: Open questions section
The coordination document SHALL track open questions that require user decisions or cross-team discussion, with status (open / resolved) and resolution notes.

#### Scenario: Resolve open question
- **WHEN** user makes a decision about an open question
- **THEN** the question is marked resolved with the decision recorded

### Requirement: Integration milestones
The coordination document SHALL define integration milestones: points where backend and frontend connect for the first time on each feature area.

#### Scenario: First integration test
- **WHEN** backend search endpoint is ready AND frontend search UI is ready
- **THEN** they are tested together as the "Search Integration" milestone

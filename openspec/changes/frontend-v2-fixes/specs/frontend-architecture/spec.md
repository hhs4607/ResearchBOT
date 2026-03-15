## MODIFIED Requirements

### Requirement: Project context provides global project state
The ProjectContext SHALL persist `projectId` to localStorage and restore it on mount. When the stored project no longer exists in the fetched list, it SHALL fall back to the first available project.

#### Scenario: Page refresh preserves project
- **WHEN** user selects project "PINN Fatigue Review" and refreshes the page
- **THEN** the same project SHALL be selected after reload

#### Scenario: Deleted project fallback
- **WHEN** the stored projectId references a deleted project
- **THEN** the context SHALL select the first available project and update localStorage

### Requirement: Export page uses dynamic project context
The Export page SHALL read `projectId` from ProjectContext instead of hardcoding. CSV download URL and Zotero sync SHALL target the active project.

#### Scenario: Export targets active project
- **WHEN** user navigates to Export with "Composite Material Design" selected
- **THEN** CSV download and Zotero sync SHALL operate on that project (not project 1)

### Requirement: ExtractionDialog uses dynamic project context
The bulk extraction dialog SHALL receive `projectId` as a prop or read from context, not hardcode to 1.

#### Scenario: Bulk extract targets active project
- **WHEN** user selects papers in project 2 and clicks Extract AI
- **THEN** the bulk extraction API call SHALL target project 2

## ADDED Requirements

### Requirement: Toast notification system
The root layout SHALL include `<Toaster />` from sonner. All async operation feedback SHALL use `toast()` instead of `alert()`.

#### Scenario: Toast displays after auto-select
- **WHEN** auto-select completes
- **THEN** a toast SHALL show "Auto-selected N papers above X% threshold"

### Requirement: Dead imports removed
The API client SHALL not import unused mock data modules.

#### Scenario: Clean imports
- **WHEN** `client.ts` is loaded
- **THEN** it SHALL not import `MOCK_PROJECTS` or `MOCK_PAPERS`

### Requirement: Sidebar shows active page
The sidebar navigation SHALL visually indicate the current page using active styling and `aria-current="page"`.

#### Scenario: Database page active indicator
- **WHEN** user is on the /papers page
- **THEN** the "Database" sidebar item SHALL have distinct active styling

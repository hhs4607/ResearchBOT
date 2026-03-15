## ADDED Requirements

### Requirement: Icon buttons MUST have aria-label
All icon-only buttons (back navigation, pagination, expand/collapse, theme toggle) SHALL have an `aria-label` describing the action.

#### Scenario: Back button accessibility
- **WHEN** a screen reader encounters the back navigation button
- **THEN** it SHALL announce the aria-label (e.g., "Go back")

#### Scenario: Pagination buttons accessibility
- **WHEN** a screen reader encounters pagination buttons
- **THEN** it SHALL announce "Previous page" or "Next page"

### Requirement: Decorative icons MUST have aria-hidden
All decorative Lucide icons (not conveying unique information) SHALL have `aria-hidden="true"`.

#### Scenario: Decorative icon in label
- **WHEN** a FolderOpen icon appears next to "Active Project" text
- **THEN** it SHALL have `aria-hidden="true"` and screen readers skip it

### Requirement: Interactive cards MUST be keyboard-accessible
Clickable Card components SHALL respond to Enter/Space key presses and have `role="button"` and `tabIndex={0}`.

#### Scenario: Paper card keyboard activation
- **WHEN** user presses Enter on a focused PaperCard
- **THEN** the card SHALL expand/collapse the abstract

### Requirement: Form inputs MUST have labels and attributes
All form inputs SHALL have associated `<label>` (via `htmlFor` or wrapping) and appropriate `name`/`autocomplete` attributes.

#### Scenario: Search input accessibility
- **WHEN** a screen reader encounters the search input
- **THEN** it SHALL announce "Search papers" via associated label or aria-label

### Requirement: Navigation links MUST use semantic elements
Navigation that changes the URL SHALL use `<Link>` or `<a>` (not `<button>` with `onClick` + `router.push`), enabling Cmd+click/middle-click.

#### Scenario: Home button in search header
- **WHEN** user Cmd+clicks the Home button on search results page
- **THEN** it SHALL open the home page in a new tab

### Requirement: Loading text MUST use proper ellipsis
All loading/placeholder strings SHALL use `…` (U+2026) not `...` (three periods).

#### Scenario: Search loading indicator
- **WHEN** search is in progress
- **THEN** the loading text SHALL display "Searching…" not "Searching..."

### Requirement: Number displays MUST use tabular-nums
Score percentages and metric counts SHALL use `font-variant-numeric: tabular-nums` for consistent column alignment.

#### Scenario: Score column alignment
- **WHEN** papers table displays score badges
- **THEN** numbers SHALL align vertically using tabular-nums

### Requirement: Dark mode colors MUST have explicit variants
Semantic color badges (green/yellow/red for scores and statuses) SHALL include `dark:` text color variants for adequate contrast.

#### Scenario: Score badge in dark mode
- **WHEN** dark mode is active
- **THEN** green score badge SHALL use `dark:text-green-400` (not light-only `text-green-700`)

### Requirement: Theme metadata MUST be set
Root layout SHALL include `<meta name="theme-color">` and `color-scheme` property for proper browser chrome theming.

#### Scenario: Dark mode browser chrome
- **WHEN** dark mode is active
- **THEN** the browser tab bar SHALL match the dark background color

### Requirement: DialogTrigger MUST use proper button elements
Dialog triggers SHALL use `<Button>` component, not `<div>` with button-like styles.

#### Scenario: Extraction dialog trigger
- **WHEN** user tabs to the AI Extract trigger
- **THEN** it SHALL be focusable as a proper button element

### Requirement: Feedback MUST use toast not alert
User feedback for async operations SHALL use toast notifications (sonner) with `aria-live="polite"`, not native `alert()`.

#### Scenario: Auto-select completion
- **WHEN** auto-select completes successfully
- **THEN** a toast notification SHALL appear showing the result count

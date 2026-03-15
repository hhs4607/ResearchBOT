## MODIFIED Requirements

### Requirement: Paper detail Include/Exclude buttons are functional
The Include and Exclude buttons on the paper detail page SHALL call `PATCH /api/papers/{id}/include` with the appropriate `is_included` value and update the UI optimistically.

#### Scenario: Include a paper
- **WHEN** user clicks "Include" on an undecided paper
- **THEN** the system SHALL call the API with `is_included: true` and update the badge to "Included"

#### Scenario: Exclude a paper
- **WHEN** user clicks "Exclude" on an included paper
- **THEN** the system SHALL call the API with `is_included: false` and update the badge to "Excluded"

### Requirement: Save Note button persists notes
The Save Note button SHALL call `PUT /api/papers/{id}` with `{ user_note }` and show toast feedback.

#### Scenario: Save user note
- **WHEN** user edits the note textarea and clicks "Save Note"
- **THEN** the system SHALL persist the note via API and show a success toast

### Requirement: User note initializes from fetched data
The note textarea SHALL initialize its value from the fetched paper data, not from an empty default state.

#### Scenario: Note loads existing content
- **WHEN** paper detail page loads with an existing user_note
- **THEN** the textarea SHALL display the saved note content

### Requirement: Score badges have dark mode contrast
Score color badges in the papers table SHALL include `dark:` text color variants matching the paper-card component pattern.

#### Scenario: Dark mode score readability
- **WHEN** dark mode is active on the papers table
- **THEN** score badges SHALL use `dark:text-green-400`/`dark:text-yellow-400`/`dark:text-red-400`

### Requirement: Papers table is mobile-responsive
The papers table SHALL be wrapped in a horizontal scroll container to prevent column clipping on narrow viewports.

#### Scenario: Mobile table scrolling
- **WHEN** user views papers page on a 375px-wide screen
- **THEN** the table SHALL be horizontally scrollable with all columns accessible

### Requirement: Pagination buttons have accessible labels
Previous/Next pagination buttons SHALL have `aria-label` attributes.

#### Scenario: Screen reader pagination
- **WHEN** a screen reader encounters the pagination previous button
- **THEN** it SHALL announce "Previous page"

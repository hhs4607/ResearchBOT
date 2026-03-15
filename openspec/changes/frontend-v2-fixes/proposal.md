## Why

The ResearchBot v1 frontend deployed on Vercel has 3 critical bugs (hardcoded projectId, mock API calls), 7 high-severity feature gaps (non-functional buttons, no state persistence), and ~40 Web Interface Guidelines violations (accessibility, keyboard navigation, dark mode). These issues make multi-project workflows broken, paper curation incomplete, and the app inaccessible to keyboard/screen-reader users.

## What Changes

### Critical Fixes
- Fix hardcoded `projectId = 1` in Export page and ExtractionDialog — use global project context
- Replace mock `setTimeout` in CopyProjectDialog with real API call to `POST /api/papers/{id}/copy`
- Wire Include/Exclude and Save Note buttons on Paper Detail page to actual API calls

### State & Navigation
- Persist `projectId` to localStorage in ProjectContext (survives refresh)
- Add sidebar active page indicator with `aria-current="page"`
- Reset `savedAll` flag on new search query
- Fix `useState(paper?.user_note)` initialization timing bug

### Accessibility & Web Guidelines Compliance
- Add `aria-label` to all icon-only buttons (back, pagination, expand toggle)
- Add `aria-hidden="true"` to decorative icons throughout
- Replace `alert()` with toast notifications
- Replace `<div>` click handlers with proper `<button>` or `<Link>` elements
- Add keyboard handlers to Card click interactions
- Replace `"..."` with `"…"` in all loading/placeholder text
- Add `name` and `autocomplete` attributes to form inputs
- Add `tabular-nums` to score/metric number displays

### Dark Mode & Theming
- Add `dark:` color variants to all semantic color badges
- Add `<meta name="theme-color">` and `color-scheme: dark` to layout
- Fix ModeToggle animation (list properties explicitly instead of `transition-all`)

### Responsive & Layout
- Add horizontal scroll wrapper to Papers table for mobile
- Fix Home page project selector overflow at mobile widths
- Ensure Export page shows current project name

### Code Cleanup
- Remove dead `MOCK_PROJECTS, MOCK_PAPERS` import from api/client.ts
- Replace `any` types with proper `ProjectOut`/`PaperOut` types
- Replace `("indeterminate" as any)` with proper type

## Capabilities

### New Capabilities
- `web-guidelines-compliance`: Accessibility (WCAG), keyboard navigation, semantic HTML, and dark mode compliance rules for all frontend components

### Modified Capabilities
- `frontend-architecture`: Add state persistence (localStorage), proper error boundaries, and toast notification system
- `interactive-search`: Fix savedAll reset, search result card keyboard accessibility
- `paper-database`: Fix filter panel, Include/Exclude/Save Note button handlers, pagination aria-labels, score dark mode colors

## Impact

- **Files affected**: ~15 component/page files in `web/src/`
- **No API changes**: All backend APIs already exist and are verified working
- **No new dependencies**: Uses existing shadcn/ui toast (sonner), existing types
- **Breaking changes**: None — all fixes are backwards-compatible UX improvements
- **Deploy**: Vercel auto-deploys on push to main

# ResearchBot UI/UX Audit Report

**Date:** 2026-03-16
**Auditor:** Claude (automated via dev-browser)
**Pages Audited:** Home, Papers (Database), Export, Settings, Paper Detail (code only)
**Viewports Tested:** Desktop (1440x900), Mobile (375x812)
**Modes Tested:** Light, Dark

---

## Critical Findings

### C1. Dark Mode Toggle Not Persisting Across Navigation
- **Severity:** Critical
- **File:** `web/src/components/mode-toggle.tsx:10-24`
- **Description:** The ModeToggle button click did not visually toggle the theme in the headless browser test (theme toggle button clicked but no visual change occurred until DOM was forced). The `next-themes` setup appears correct but the toggle may have a state hydration issue. When forced via `document.documentElement.classList.add("dark")`, the dark mode applied correctly but was lost on navigation.
- **Guideline Violation:** Section 1 - "Dark/Light mode complete support required"

### C2. Export Page Hardcoded projectId = 1
- **Severity:** Critical
- **File:** `web/src/app/export/page.tsx:9`
- **Description:** `const projectId = 1; // Defaulting to 1 for MVP` -- Export page ignores the active project context. Users will always export data from project 1 regardless of which project is selected.
- **Fix:** Use `useProject()` hook like other pages.

### C3. ExtractionDialog Hardcoded projectId = 1
- **Severity:** Critical
- **File:** `web/src/components/extraction-dialog.tsx:31`
- **Description:** `await apiClient.papers.bulkExtract(1, { paper_ids: paperIds });` -- Bulk extraction always targets project 1.
- **Fix:** Pass projectId as prop or use context.

---

## High Severity Findings

### H1. Mobile Home Page - Project Selector and Search Mode Overflow
- **Severity:** High
- **File:** `web/src/app/page.tsx:48`
- **Description:** On mobile (375px), the Active Project + New Project button and Search Mode selector are laid out horizontally in a single row. The "Search Mode" section is pushed off-screen or hidden entirely. The "New P..." button text is clipped.
- **Guideline Violation:** Section 2 - Responsive design not adequate at mobile breakpoint.
- **Fix:** Stack the project selector and search mode vertically on small screens using `flex-col` at mobile.

### H2. Mobile Papers Page - Table Columns Truncated
- **Severity:** High
- **File:** `web/src/app/papers/page.tsx:186-261`
- **Description:** On mobile, the table only shows "Paper" column header and checkbox. Keywords, Score, Status, and Actions columns are all hidden/clipped due to horizontal overflow. The table has no horizontal scroll container.
- **Guideline Violation:** Section 2 - Grid/responsive system should adapt. A card-based layout would be better for mobile.
- **Fix:** Switch to card layout on mobile or wrap table in a horizontal scroll container.

### H3. Sidebar Navigation Has No Active State Indicator
- **Severity:** High
- **File:** `web/src/components/app-sidebar.tsx:55-64`
- **Description:** The sidebar navigation links do not indicate which page is currently active. There is no `isActive` prop, no visual highlight, and no aria-current attribute. Users cannot tell which page they are on from the sidebar.
- **ARIA Issue:** Missing `aria-current="page"` on active nav item.
- **Fix:** Use `usePathname()` to determine active route and apply `data-active` or `isActive` prop to `SidebarMenuButton`.

### H4. Papers Page - `alert()` Used for Auto-Select Feedback
- **Severity:** High
- **File:** `web/src/app/papers/page.tsx:78`
- **Description:** `alert(\`Auto-selected ${result.papers_selected} papers...\`)` -- Uses browser native alert which breaks the premium UX. Should use toast/sonner notification.
- **Guideline Violation:** Section 4 - Micro-interactions should use designed feedback patterns.

### H5. Duplicate Checkbox Rendered in Table Headers and Cells
- **Severity:** High
- **File:** `web/src/app/papers/page.tsx:191-196, 209-214`
- **ARIA Issue:** The ARIA snapshot shows TWO checkboxes in both the header cell and each data cell (e.g., `checkbox "Select all" [ref=e66]` and `checkbox [ref=e67]`). This is confusing for screen readers.
- **Description:** Likely a rendering issue where both a visual and hidden checkbox are being emitted.

---

## Medium Severity Findings

### M1. Export Page Header Missing Glassmorphism Consistency
- **Severity:** Medium
- **File:** `web/src/app/export/page.tsx:35`
- **Description:** The export header uses `text-xl font-bold` while other pages use `text-2xl font-bold tracking-tight`. Inconsistent heading hierarchy.
- **Guideline Violation:** Section 3 - Typography hierarchy (`text-2xl font-bold tracking-tight`).

### M2. Settings Page - Hardcoded Semantic Colors Without Dark Mode Variants
- **Severity:** Medium
- **File:** `web/src/app/settings/page.tsx:49-56`
- **Description:** The Included/Excluded count badges use `text-green-700` and `text-red-700` without dark mode variants like `dark:text-green-400`. In the dark mode screenshot (settings-mobile), these colors appear with adequate contrast, but the green-on-dark and red-on-dark could be improved.
- **Guideline Violation:** Section 1 - No hardcoded colors; should use dark: variants for semantic colors.

### M3. Papers Page Score Badge Colors Missing Dark Mode Variants
- **Severity:** Medium
- **File:** `web/src/app/papers/page.tsx:51-55`
- **Description:** `getScoreColor()` returns `text-green-700`, `text-yellow-700`, `text-red-700` without `dark:` variants. The paper-card.tsx component handles this correctly with `dark:text-green-400` etc., but the papers table does not.
- **Guideline Violation:** Section 1 - Consistent dark mode support.

### M4. Paper Detail Page - Include/Exclude Buttons Non-Functional
- **Severity:** Medium
- **File:** `web/src/app/papers/[id]/page.tsx:81-86`
- **Description:** The "Include" and "Exclude" buttons in the paper detail header have no `onClick` handlers. They are rendered but do nothing when clicked.

### M5. Paper Detail Page - Save Note Button Non-Functional
- **Severity:** Medium
- **File:** `web/src/app/papers/[id]/page.tsx:181`
- **Description:** The "Save Note" button has no `onClick` handler. The note textarea captures input but cannot persist it.

### M6. ModeToggle Label Text Hidden With Non-Standard Class
- **Severity:** Medium
- **File:** `web/src/components/mode-toggle.tsx:22`
- **Description:** Uses `sidebar-expanded:block` which is not a standard Tailwind variant. The "Toggle Theme" label text may never appear.

### M7. Export Page Missing Project Context Awareness
- **Severity:** Medium
- **File:** `web/src/app/export/page.tsx:33-97`
- **Description:** No display of which project is being exported. Users have no visual confirmation of what they are downloading.

### M8. Home Page - Search Button Disabled Without Clear Feedback
- **Severity:** Medium
- **File:** `web/src/app/page.tsx:112, search-bar.tsx:42-44`
- **Description:** The Search button is disabled when the input is empty but has no tooltip explaining why. Guidelines say disabled buttons should have tooltip or clear feedback.
- **Guideline Violation:** Section 4 - Disabled state should have tooltip.

---

## Low Severity Findings

### L1. Export Page Cards Missing hover:shadow-md Transition
- **Severity:** Low
- **File:** `web/src/app/export/page.tsx:50, 66`
- **Description:** Export cards use `shadow-sm` but lack `hover:shadow-md transition-shadow` per the guidelines.
- **Guideline Violation:** Section 3 - Cards should have hover lift effect.

### L2. Settings Page API Connections - Static "Connected" Status
- **Severity:** Low
- **File:** `web/src/app/settings/page.tsx:90-103`
- **Description:** All API connections show as "Connected" with no actual connectivity check. This is misleading.

### L3. Papers Page Pagination Buttons Missing aria-label
- **Severity:** Low
- **File:** `web/src/app/papers/page.tsx:272-276`
- **Description:** Previous/Next pagination buttons contain only icons with no aria-label. Screen readers will announce them as empty buttons.

### L4. Filter Panel Year Range Inputs Too Narrow
- **Severity:** Low
- **File:** `web/src/components/filter-panel.tsx:98-111`
- **Description:** Year inputs use `w-24` which may not be wide enough for 4-digit years with padding, especially on mobile.

### L5. Home Page Logo Icon Has Visible Background Container
- **Severity:** Low
- **File:** `web/src/app/page.tsx:36`
- **Description:** The BookOpen icon sits in a `rounded-2xl bg-primary/10 p-4` container. In the screenshot this appears as a visible gray square behind the icon, which looks slightly unpolished.

### L6. Empty Alert Element in DOM
- **Severity:** Low
- **ARIA Snapshot:** All pages show `alert [ref=eXX]` as the last element, which is an empty alert container (likely from Sonner/toast provider). Not a problem functionally but adds noise to the accessibility tree.

### L7. Mobile Header Lacks Theme Toggle Access
- **Severity:** Low
- **File:** `web/src/app/layout.tsx:46-49`
- **Description:** The mobile header (shown at `lg:hidden`) only contains the SidebarTrigger and "ResearchBot" text. The theme toggle is only in the sidebar footer, requiring users to open the sidebar to toggle theme.

---

## Summary by Category

| Category | Critical | High | Medium | Low |
|----------|----------|------|--------|-----|
| Dark Mode | 1 | 0 | 2 | 0 |
| Responsive | 0 | 2 | 0 | 1 |
| Accessibility | 0 | 2 | 1 | 2 |
| Functionality | 2 | 1 | 2 | 1 |
| Visual Design | 0 | 0 | 1 | 2 |
| UX Flow | 0 | 0 | 2 | 1 |
| **Total** | **3** | **5** | **8** | **7** |

## Recommended Priority Order

1. Fix C2 and C3 (hardcoded projectId) -- immediate data integrity risk
2. Fix C1 (dark mode persistence) -- core feature broken
3. Fix H1 and H2 (mobile responsive) -- usability on mobile devices
4. Fix H3 (sidebar active state) -- basic navigation UX
5. Fix H4 (alert -> toast) -- polish
6. Address Medium findings iteratively

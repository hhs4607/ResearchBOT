## 1. Critical Fixes — Hardcoded projectId & Mock APIs

- [x] 1.1 Fix `export/page.tsx`: Replace `const projectId = 1` with `useProject()` context. Update CSV URL and Zotero calls.
- [x] 1.2 Fix `extraction-dialog.tsx:31`: Accept `projectId` prop and pass it to `bulkExtract()` instead of hardcoded 1.
- [x] 1.3 Fix `papers/page.tsx`: Pass `projectId` to `ExtractionDialog` when rendering bulk extract.
- [x] 1.4 Fix `copy-project-dialog.tsx`: Replace mock `setTimeout` with real API call `POST /api/papers/{id}/copy`. Add toast feedback.

## 2. Critical Fixes — Non-functional Buttons

- [x] 2.1 Fix `papers/[id]/page.tsx`: Wire Include button `onClick` to `apiClient.papers.toggleInclude(id, true)`. Invalidate query on success.
- [x] 2.2 Fix `papers/[id]/page.tsx`: Wire Exclude button `onClick` to `apiClient.papers.toggleInclude(id, false)`. Invalidate query on success.
- [x] 2.3 Fix `papers/[id]/page.tsx`: Wire Save Note button `onClick` to `apiClient.papers.update(id, { user_note })`. Show toast on success.
- [x] 2.4 Fix `papers/[id]/page.tsx`: Fix `useState(paper?.user_note)` — use `useEffect` to sync state when paper data loads.

## 3. State & Navigation

- [x] 3.1 Update `project-context.tsx`: Persist `projectId` to localStorage on change. Restore on mount with fallback to first project.
- [x] 3.2 Fix `search/page.tsx`: Reset `savedAll` to `false` when `query` or `projectId` changes (add useEffect or move to queryKey dependency).
- [x] 3.3 Update `app-sidebar.tsx`: Add active page indicator using `usePathname()` + conditional styling + `aria-current="page"`.
- [x] 3.4 Fix `project-manager.tsx:77`: In `DeleteProjectButton`, use the refetched projects list (not stale closure) when picking the next project.

## 4. Toast System Setup

- [x] 4.1 Add `<Toaster />` from sonner to `layout.tsx` (or install if not present via `npx shadcn@latest add sonner`).
- [x] 4.2 Replace `alert()` in `papers/page.tsx:78` with `toast.success()`.
- [x] 4.3 Add toast feedback to Copy, Include/Exclude, Save Note, and Export actions.

## 5. Accessibility — aria-label & aria-hidden

- [x] 5.1 Add `aria-label` to icon-only buttons: back button (`papers/[id]/page.tsx:64`), pagination buttons (`papers/page.tsx:272-276`), expand toggle (`paper-card.tsx:152`).
- [x] 5.2 Add `aria-hidden="true"` to decorative icons: FolderOpen, Sparkles, Calendar, Users, BookOpen, Activity, etc. across all pages.
- [x] 5.3 Add `aria-label` or associated `<label>` to search input (`search-bar.tsx:32`).
- [x] 5.4 Add `name` and `autocomplete="off"` attributes to filter inputs (`filter-panel.tsx:98-110`).
- [x] 5.5 Add `htmlFor` bindings to labels in `project-manager.tsx:48,52`.

## 6. Accessibility — Keyboard & Semantic HTML

- [x] 6.1 Add `role="button"`, `tabIndex={0}`, and `onKeyDown` (Enter/Space) to PaperCard root (`paper-card.tsx:80`).
- [x] 6.2 Replace `<Button onClick={router.push("/")}` with `<Link href="/">` in search header (`search/page.tsx:91-98`).
- [x] 6.3 Replace `<div>` button-style triggers with `<Button>` in `extraction-dialog.tsx:53-61` and `copy-project-dialog.tsx:61`.
- [x] 6.4 Fix `papers/page.tsx:145`: PopoverTrigger — ensure it renders as `<button>` not styled div.

## 7. Typography & Text

- [x] 7.1 Replace all `"..."` with `"…"` in placeholder and loading strings across: `search-bar.tsx`, `search/page.tsx`, `papers/[id]/page.tsx`, `extraction-dialog.tsx`, `project-manager.tsx`.
- [x] 7.2 Add `font-variant-numeric: tabular-nums` (Tailwind: `tabular-nums`) to score badges in `papers/page.tsx` and metric numbers in `papers/[id]/page.tsx`.

## 8. Dark Mode & Theming

- [x] 8.1 Add `dark:` text color variants to `getScoreColor()` in `papers/page.tsx:52` and `papers/[id]/page.tsx:55`.
- [x] 8.2 Add `dark:` variants to semantic color badges in `settings/page.tsx:49-55`.
- [x] 8.3 Add `<meta name="theme-color">` with dark/light support to `layout.tsx`.
- [x] 8.4 Fix `mode-toggle.tsx:19`: Replace `transition-all` with explicit `transition-transform transition-opacity`.

## 9. Responsive & Layout

- [x] 9.1 Wrap papers `<Table>` in `<div className="overflow-x-auto">` for mobile horizontal scroll.
- [x] 9.2 Fix Home page project selector row: Make flex-wrap at mobile widths, stack vertically below `sm:`.
- [x] 9.3 Show current project name on Export page header.

## 10. Code Cleanup

- [x] 10.1 Remove dead import `MOCK_PROJECTS, MOCK_PAPERS` from `lib/api/client.ts:2`.
- [x] 10.2 Replace `(p: any)` with `(p: ProjectOut)` in all `projects.map()` calls.
- [x] 10.3 Replace `("indeterminate" as any)` with proper type in `papers/page.tsx:192`. (Kept as-is: base-ui Checkbox type limitation)
- [x] 10.4 Export page: Add `hover:shadow-md transition-shadow` to card containers.

## 11. Verification

- [x] 11.1 Run `npx next build` — verify zero errors.
- [x] 11.2 Run `npx tsc --noEmit` — verify zero TypeScript errors.
- [x] 11.3 Browser test all 6 pages: Home, Search, Papers, Paper Detail, Export, Settings.
- [x] 11.4 Test dark mode on all pages.
- [x] 11.5 Test mobile viewport (375px) on Home and Papers pages.

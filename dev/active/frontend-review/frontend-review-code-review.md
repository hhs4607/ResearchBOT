# ResearchBot Frontend Code Review

Last Updated: 2026-03-16

---

## Executive Summary

The ResearchBot Next.js 16 / React 19 frontend is a functional MVP with good structural foundations (TanStack Query, Shadcn/Radix components, a clean Context-based project state). However the codebase has 3 critical blocking bugs, 6 high-severity architectural flaws, and numerous TypeScript violations that will become maintenance liabilities as the project grows. The ISSUES-v1.md report accurately identifies most runtime problems; this review adds detail and surfaces additional issues not yet documented there.

Overall assessment: **Not production-ready without the P0 and P1 fixes below.**

---

## Critical Issues (must fix before any release)

### CRIT-1: `CopyProjectDialog` — "Copy to Project" is a mock that does nothing
**File:** `web/src/components/copy-project-dialog.tsx:47-49`

```ts
// Mock API call to copy endpoint
// POST /api/papers/{paperId}/copy { target_project_id: selectedProject }
await new Promise((resolve) => setTimeout(resolve, 800));
```

The button appears to work (spinner, dialog closes) but never calls the backend. The `apiClient` has no `papers.copy` method and the comment itself says "Mock API call". Users believe the paper was copied when it was not. This is a **silent data loss** issue.

**Fix required:** Either implement the real API call or remove the "Copy to Project" button from the paper detail page entirely until the API method is added.

---

### CRIT-2: `ExtractionDialog` — bulk extraction `projectId` hardcoded to `1`
**File:** `web/src/components/extraction-dialog.tsx:31`

```ts
await apiClient.papers.bulkExtract(1, { paper_ids: paperIds }); // projectId hardcoded to 1
```

Any user whose active project is not `id=1` will silently run bulk AI extraction against the wrong project. The `ExtractionDialog` component receives `paperIds` but not `projectId`, so it has no way to know the current project without consuming the Context.

**Fix required:** Pass `projectId` as a prop, or consume `useProject()` inside the component and remove the hardcoded `1`.

---

### CRIT-3: `ExportPage` — `projectId` hardcoded to `1`
**File:** `web/src/app/export/page.tsx:9`

```ts
const projectId = 1; // Defaulting to 1 for MVP
```

The Export page does not read the global project context at all. CSV export and Zotero sync always operate on project 1. Like CRIT-2, this is a silent correctness bug that affects all users with more than one project.

**Fix required:** Replace with `const { projectId } = useProject();` and guard against `null` with a "no project selected" empty state (consistent with `papers/page.tsx` pattern).

---

## Important Issues (should fix)

### HIGH-1: `PaperDetailPage` — Include / Exclude buttons are non-functional
**File:** `web/src/app/papers/[id]/page.tsx:81-86`

The Include and Exclude buttons in the paper detail header are rendered with `disabled` logic based on current status but have **no `onClick` handlers**. Clicking them does nothing. The existing `apiClient.papers.toggleInclude` method is available but never wired up here.

```tsx
<Button variant="default" size="sm" disabled={paper.is_included === true || paper.is_included === 1}>
  <CheckCircle2 className="h-4 w-4" /> Include   {/* no onClick */}
</Button>
```

**Fix required:** Add `onClick` handlers calling `apiClient.papers.toggleInclude` with appropriate TanStack Query `useMutation` and cache invalidation.

---

### HIGH-2: `PaperDetailPage` — "Save Note" button is non-functional
**File:** `web/src/app/papers/[id]/page.tsx:181`

```tsx
<Button size="sm" disabled={note === paper.user_note}>Save Note</Button>
```

No `onClick` handler. The note state is managed locally but never persisted. `apiClient.papers.update` exists and accepts `user_note`. This is user-visible data loss.

**Fix required:** Add `onClick` calling `apiClient.papers.update(id, { user_note: note })`, ideally via `useMutation`.

---

### HIGH-3: `PaperDetailPage` — `useState` initialized from async data before data arrives
**File:** `web/src/app/papers/[id]/page.tsx:27`

```ts
const [note, setNote] = useState(paper?.user_note || "");
```

`paper` is `undefined` at first render (before the query resolves), so `note` is always initialized to `""`. Even after `paper` loads, the `useState` initial value is stale. The component currently works around this with `value={note || paper.user_note || ""}` (line 177) but this creates an inconsistency: `note === paper.user_note` (line 181) will be `false` (`"" !== "some existing note"`), so the Save button is enabled even when there are no unsaved changes.

**Fix required:** Either use `useEffect` to sync `note` when `paper` arrives, or derive the note from the query result and only track local edits via a separate "isDirty" flag.

---

### HIGH-4: `SearchResultsContent` — `savedAll` flag never resets on new search
**File:** `web/src/app/search/page.tsx:39-40, 73`

```ts
const [savingAll, setSavingAll] = useState(false);
const [savedAll, setSavedAll] = useState(false);
```

When the user performs a new search (same component instance, new `query` URL param), `savedAll` retains `true` from the previous search. The "Save all N to DB" button stays hidden because `savedAll` is `true`, even though none of the new results have been saved yet. This is a subtle but impactful UX bug.

**Fix required:** Reset `savedAll` (and `savingAll`) in a `useEffect` that depends on `query` and `projectId`.

```ts
useEffect(() => {
  setSavedAll(false);
  setSavingAll(false);
}, [query, projectId]);
```

---

### HIGH-5: `ProjectContext` — no localStorage persistence, project selection lost on refresh
**File:** `web/src/lib/project-context.tsx:23, 32-36`

The selected `projectId` is held in React state only. On every page reload the user's active project resets to `projects[0]`. For a multi-project user this means context is lost every session.

**Fix required:** Persist `projectId` to `localStorage` and rehydrate on mount. A minimal addition:

```ts
const [projectId, setProjectId] = useState<number | null>(() => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("researchbot_projectId");
    return saved ? parseInt(saved) : null;
  }
  return null;
});

// wrap the setter:
const handleSetProjectId = (id: number) => {
  localStorage.setItem("researchbot_projectId", String(id));
  setProjectId(id);
};
```

---

### HIGH-6: `DeleteProjectButton` — stale `projects` list used after async delete
**File:** `web/src/components/project-manager.tsx:77-80`

```ts
const handleDelete = async () => {
  await apiClient.projects.delete(projectId);
  await refetchProjects();                          // async — list is now updated
  const remaining = projects.filter(...);          // BUG: reads pre-refetch stale closure
  if (remaining.length > 0) setProjectId(remaining[0].id);
};
```

`projects` captured in the closure is the list **before** `refetchProjects()` completes. The `remaining` calculation may include the just-deleted project. `refetchProjects()` returns a promise that resolves with the new data, so the fix is to use the resolved value:

```ts
const result = await refetchProjects();
const remaining = (result.data?.projects || []).filter(p => p.id !== projectId);
```

---

### HIGH-7: `papers/page.tsx` — `Checkbox` `checked` prop uses `("indeterminate" as any)` type cast
**File:** `web/src/app/papers/page.tsx:192`

```tsx
checked={allSelected ? true : isIndeterminate ? ("indeterminate" as any) : false}
```

The Radix `Checkbox` component's `checked` prop accepts `boolean | "indeterminate"` — no cast is needed. The `as any` suppresses TypeScript, hides the fact that the literal `"indeterminate"` string is the correct type, and will silently break if the prop type ever changes.

**Fix required:** Remove the `as any` cast: `isIndeterminate ? "indeterminate" : false`.

---

## Minor Suggestions (nice to have)

### MINOR-1: Pervasive `any` typing against `strict: true` tsconfig
**Files:** Multiple

TypeScript strict mode is enabled in `tsconfig.json`, but `any` annotations are widespread:
- `project-context.tsx:9` — `projects: any[]` (typed `ProjectOut[]` is available in `types.ts`)
- `page.tsx:69,75` — `proj: any`, `p: any` in `projects.map` callbacks
- `search/page.tsx:59,65,67` — `p: any`, `paper: any` throughout
- `papers/page.tsx:63` — `p: any` in `papers.map`
- `client.ts:93,107,116,125` — several `data: any` params in `papers.update`, `bulkExtract`, `bulkInclude`, `bulkKeywords`

All the proper types are already defined in `lib/api/types.ts` (`ProjectOut`, `PaperOut`, `PaperDetailOut`, etc.) but are not consistently used. This is a technical debt issue that will cause real runtime errors as the API evolves.

---

### MINOR-2: `SelectValue` receives a function child — non-standard and fragile
**Files:** `web/src/app/page.tsx:67-71`, `web/src/app/search/page.tsx:110-115`, `web/src/components/copy-project-dialog.tsx:77-81`

```tsx
<SelectValue placeholder="Select a project">
  {(value: string) => {
    const p = projects.find((proj: any) => proj.id.toString() === value);
    return p ? `${p.name} (${p.paper_counts?.total || 0} papers)` : value;
  }}
</SelectValue>
```

The Radix `SelectValue` component does not officially support a render function as its children. This may currently work with the installed version but is an undocumented API that can break on any Radix upgrade. This is likely the root cause of Issue #2 ("Project selector shows ID only") because when `SelectValue` does not recognise a render function child, it falls back to rendering `value` directly (the numeric ID string).

**Fix required:** Use the standard Radix pattern: set a `displayValue` by mapping `projectId` in the parent component before passing to `SelectValue`, or use the `SelectValue` `placeholder` prop only and rely on `SelectItem` labels, which is the intended usage.

---

### MINOR-3: `apiClient.papers.list` uses `window.location.origin` fallback
**File:** `web/src/lib/api/client.ts:66`

```ts
const base = API_BASE || window.location.origin;
```

`window` is not available during Next.js server-side rendering. Although `papers/page.tsx` has `"use client"`, this is an implicit SSR-safety assumption that could fail if the call site ever changes. All other methods in `apiClient` correctly use `API_BASE` only (empty string falls back to relative URLs). The `window.location.origin` fallback is unnecessary since an empty `API_BASE` already causes the fetch URL to be relative.

**Fix required:** Remove the `window.location.origin` fallback and use `const url = new URL(`/api/projects/${projectId}/papers`, window.location.href)` inside a client component guard, or simply use a relative URL string as the other methods do.

---

### MINOR-4: `ExtractionDialog` — DialogTrigger wraps a raw `<div>` instead of using `asChild`
**Files:** `web/src/components/extraction-dialog.tsx:52-61`, `web/src/components/copy-project-dialog.tsx:60-63`

Both dialogs use `DialogTrigger` with a raw `<div>` child styled as a button. This creates a nested interactive element (a button inside a button when used in toolbar contexts) and means the trigger lacks keyboard accessibility (`role="button"`, `tabIndex`, `onKeyDown`). The Radix pattern for custom trigger elements is `<DialogTrigger asChild><Button>...</Button></DialogTrigger>`.

---

### MINOR-5: `settings/page.tsx` — API connection status is fully hardcoded
**File:** `web/src/app/settings/page.tsx:90-104`

All 8 API sources (OpenAlex, Semantic Scholar, arXiv, etc.) are hardcoded as "Connected" with `bg-green-500/10`. There is no API endpoint called to check actual connection health. A user with a missing Gemini API key would see "Connected" for Gemini. This is misleading in a settings page that is supposed to show system status.

---

### MINOR-6: `papers/[id]/page.tsx` — `paper.references` / `paper.cited_by` mapped with index keys
**File:** `web/src/app/papers/[id]/page.tsx:212, 225`

```tsx
{paper.references?.map((ref, i) => (
  <div key={i} ...>
```

Index-as-key is an anti-pattern when the list can be reordered or filtered. Each reference entry has a `doi` field that would be a better key. If `doi` is absent, `ref.title` is a reasonable fallback. This is a minor performance/correctness concern.

---

### MINOR-7: `filter-panel.tsx` — year_min/year_max allows invalid ranges silently
**File:** `web/src/components/filter-panel.tsx:103, 111`

There is no validation preventing `year_min > year_max`. The API will receive nonsensical filter params and return zero results with no user feedback explaining why.

---

### MINOR-8: `mocks/data.ts` is imported in `client.ts` but never used
**File:** `web/src/lib/api/client.ts:2`, `web/src/lib/api/mocks/data.ts`

```ts
import { MOCK_PROJECTS, MOCK_PAPERS } from "./mocks/data";
```

The mock imports are present at the top of `client.ts` but `MOCK_PROJECTS` and `MOCK_PAPERS` are never referenced in the file. These are dead imports that add bundle weight and suggest incomplete removal of a mock-data layer. They should be removed.

---

## Architecture Considerations

### ARCH-1: No error boundary in the component tree
`layout.tsx` has no `<ErrorBoundary>` wrapper. A runtime exception in any page component (e.g., the formerly crashing `FilterPanel`) propagates to a full-page Next.js error overlay in development and a blank "Application error" screen in production. Adding a root-level error boundary with a recovery UI would prevent total page loss on non-critical failures.

### ARCH-2: `ProjectContext` mixes data-fetching concern with global state concern
`project-context.tsx` directly invokes `useQuery` for the projects list. This couples the Context to TanStack Query and makes it harder to test or reuse. The pattern is acceptable for an MVP but should be noted: if the project list query fails (network error), `projects` silently remains `[]` with no error exposed to consumers. Consider exposing an `error` field from the context so pages can show appropriate error states.

### ARCH-3: `SearchResultsContent` fires a long-running API call on every render inside a TanStack Query with `staleTime: 5 * 60 * 1000`
**File:** `web/src/app/search/page.tsx:42-48`

The search API is a POST that triggers backend scraping across multiple academic sources — it is expensive and slow. The `staleTime: 5 * 60 * 1000` setting is correct to prevent re-running on focus, but `retry: 1` means on transient network failure the search runs a second time (potentially incurring double API costs on the backend). Since search is idempotent but expensive, `retry: false` or `retry: 0` is safer here.

### ARCH-4: `SelectionIds` state is not reset when `projectId` or filters change
**File:** `web/src/app/papers/page.tsx:29, 101-104`

`setSelectedIds` is reset on filter change (`handleFilterChange` calls `setPage(1)` but not `setSelectedIds(new Set())`). If the user selects papers on page 1, changes a filter, and then triggers a bulk action, the `selectedIds` Set may contain IDs from the previous filter result that no longer appear in the current view. The bulk action would silently process hidden papers.

**Fix required:** Add `setSelectedIds(new Set())` in `handleFilterChange`, and also whenever `projectId` changes via a `useEffect`.

---

## Next Steps

Listed in suggested fix priority order:

1. **CRIT-1** — Replace mock in `CopyProjectDialog.handleCopy` with real `apiClient.papers.copy` call (or hide the button).
2. **CRIT-2** — Pass/consume `projectId` in `ExtractionDialog` to remove the `hardcoded 1`.
3. **CRIT-3** — Replace `const projectId = 1` in `export/page.tsx` with `useProject()`.
4. **HIGH-1** — Wire up Include/Exclude `onClick` handlers in `papers/[id]/page.tsx`.
5. **HIGH-2** — Wire up "Save Note" `onClick` in `papers/[id]/page.tsx`.
6. **HIGH-3** — Fix stale `useState` initialization for `note`.
7. **HIGH-4** — Reset `savedAll` on new search in `search/page.tsx`.
8. **HIGH-5** — Persist `projectId` to `localStorage` in `project-context.tsx`.
9. **HIGH-6** — Fix stale closure in `DeleteProjectButton.handleDelete`.
10. **HIGH-7** — Remove `as any` cast on Checkbox `indeterminate`.
11. **MINOR-2** — Refactor `SelectValue` render-function pattern (root cause of Issue #2).
12. **MINOR-8** — Remove dead mock imports from `client.ts`.
13. **MINOR-1** — Replace `any` types with proper types from `lib/api/types.ts`.
14. **ARCH-4** — Reset `selectedIds` on filter/project change.
15. **ARCH-1** — Add root `ErrorBoundary` in `layout.tsx`.

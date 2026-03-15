## Context

ResearchBot v1 frontend is a Next.js 16 App Router application using shadcn/ui (base-ui), Tailwind CSS, and TanStack Query. It connects to a FastAPI backend deployed on Railway. The frontend is deployed on Vercel. A comprehensive audit identified 3 Critical, 7 High, 8 Medium issues plus ~40 Web Interface Guidelines violations. All backend APIs are verified working — this is purely a frontend fix effort.

Current architecture:
- Global state: `ProjectContext` (React Context + TanStack Query)
- Routing: Next.js App Router with client-side pages
- UI: shadcn/ui components built on `@base-ui/react`
- API: `apiClient` object in `lib/api/client.ts`

## Goals / Non-Goals

**Goals:**
- Fix all 3 Critical bugs (hardcoded projectId, mock API calls)
- Fix all 7 High issues (non-functional buttons, state persistence, mobile)
- Achieve Web Interface Guidelines compliance for accessibility, keyboard nav, dark mode
- Zero-downtime deploy via Vercel (no backend changes needed)

**Non-Goals:**
- Backend API changes (all endpoints already work)
- New features beyond what's documented in ISSUES-v1.md
- Full WCAG AAA compliance (targeting AA)
- Performance optimization beyond removing anti-patterns (no virtualization yet — search results rarely exceed 60 items)
- Internationalization

## Decisions

### D1: State Persistence — localStorage in ProjectContext
**Choice**: Store `projectId` in localStorage within the existing `ProjectProvider`, read on mount.
**Why over URL params**: ProjectId is global app state used on every page. URL params would require threading through every route. localStorage is simpler and matches the "active project" mental model.
**Why over zustand/jotai**: One value doesn't justify a new dependency. useState + localStorage effect is sufficient.

### D2: Toast Notifications — sonner (already in shadcn/ui)
**Choice**: Use `sonner` toast library (ships with shadcn/ui) to replace `alert()`.
**Why**: Already available in the stack, no new dependency. Supports `aria-live` regions natively.

### D3: Accessibility Approach — Incremental, file-by-file
**Choice**: Fix each file individually following the Web Interface Guidelines audit checklist. No shared accessibility wrapper or HOC.
**Why**: Issues are scattered across ~15 files with different patterns. A centralized approach would over-engineer. Each fix is 1-3 lines.

### D4: Dark Mode Colors — Explicit `dark:` variants
**Choice**: Add `dark:text-green-400` etc. alongside existing light-mode color classes.
**Why over CSS variables**: The codebase already uses this pattern in `paper-card.tsx`. Consistency > elegance. Only ~6 badge color locations need updating.

### D5: Mobile Table — Horizontal scroll wrapper
**Choice**: Wrap `<Table>` in `<div className="overflow-x-auto">` on Papers page.
**Why over responsive card layout**: Keeps the table view intact (users expect tabular data). Minimal change, proven pattern.

### D6: Copy to Project API — Use existing paper update endpoint
**Choice**: The backend has `POST /api/papers/{id}/copy` endpoint. Replace the mock `setTimeout` with this real call.
**Why**: Zero backend work needed. Endpoint already tested and confirmed working.

## Risks / Trade-offs

- **[Risk] localStorage stale after project deletion** → Mitigation: Clear stored projectId in DeleteProjectButton after successful delete, fallback to first project in list
- **[Risk] sonner toast not yet added to providers** → Mitigation: Add `<Toaster />` to root layout, one-line change
- **[Risk] base-ui SelectValue render function is non-standard** → Mitigation: Already working with the `children` function pattern; this change doesn't modify it
- **[Risk] Bulk edit: many small commits across 15 files** → Mitigation: Group changes into logical commits (critical fixes → functionality → accessibility → cosmetic)

## Open Questions

- None — all decisions are straightforward fixes with clear implementation paths

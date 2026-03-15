## Context

ResearchBot requires an interactive Web UI (Next.js) for users (researchers) to perform real-time paper searches and manage their library. The backend (FastAPI) and data layer (SQLite) will be shared with the Agent CLI (Claude Code), but the core workflow is now focused on interactive curation rather than batch agent processing. As an AI Assistant focused on frontend, I am designing the architecture and component structure for this web interface, specifically avoiding backend API implementation which will be handled by Claude Code.

## Goals / Non-Goals

**Goals:**
- Design a scalable frontend architecture using Next.js 16 (React 19) App Router.
- Establish a consistent design system using Tailwind CSS and `shadcn/ui`.
- Define the client-side data fetching strategy bridging the UI to the FastAPI backend using TanStack Query v5.
- Plan the visual layouts for Key Features: Home (Search), Library (Paper Database incl. Save/Extract/Copy operations).

**Non-Goals:**
- Implementing the FastAPI backend endpoints.
- Implementing the SQLite database schema or connection logic.
- Implementing the Claude Code Agent CLI pipeline scripts.
- Modifying backend logic or scraping infrastructure.

## Decisions

1. **Framework: Next.js App Router (React 19)**
   - *Rationale*: Provides server components for faster initial page loads and SEO (though less critical for an internal tool, good for a search engine feel), and a structured file-system based router.
   - *Alternatives*: Vite + React SPA. Chosen Next.js for better routing conventions and potential server-side data fetching optimizations if needed later.

2. **Styling & Components: Tailwind CSS + shadcn/ui**
   - *Rationale*: Allows for rapid development of a "premium" and modern UI without writing extensive bespoke CSS. `shadcn/ui` provides accessible, customizable components out-of-the-box.
   - *Alternatives*: MUI, Chakra UI. Chosen `shadcn/ui` for its copy-paste nature, giving maximum control over styling and reducing dependency bloat.

3. **Data Fetching & State: TanStack Query v5**
   - *Rationale*: Excellent for caching, synchronizing, and updating server state in React. Handles loading/error states cleanly, crucial for potentially slow external API searches or batch review tracking.
   - *Alternatives*: Redux, Zustand. Chosen TanStack Query as the primary state is server-state (database records).

4. **Component Hierarchy (High Level)**
   - `app/layout.tsx`: Global providers (QueryClient, Theme), Main Navigation Sidebar/Header.
   - `app/(home)/page.tsx`: Center search bar, logo, search modes.
   - `app/search/page.tsx`: Search results layout, filter sidebar, result cards.
   - `app/papers/page.tsx`: Database/Library data table, pagination, detail side-panel.
   - `components/ui/*`: Reusable `shadcn` components.
   - `components/search/`: Search bar, Result Card, Filter Panel.

## Risks / Trade-offs

- **Risk: Backend Dependency Blockers** → *Mitigation*: The frontend must be developed using Mock Service Worker (MSW) or mock data JSON files initially, allowing independent progress until Claude Code completes the backend API endpoints.

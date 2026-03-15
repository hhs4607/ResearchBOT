## Why

ResearchBot aims to be a unified academic paper discovery, review, and analysis platform. The platform is designed as a backend-first system (FastAPI + SQLite), allowing researchers to perform real-time paper exploration and manage their library. We need a robust, interactive Web UI (Next.js) for researchers to interface with this system. This proposal outlines the frontend implementation to ensure a seamless user experience that strictly focuses on UI while the backend is handled by Claude Code.

## What Changes

- Scaffold a Next.js 16 (React 19) application in the `web/` directory.
- Implement the core layout and routing structure (Home, Search, Papers/Library).
- Develop the "Interactive Search" interface (Google-style home page, search results with composite scoring, filtering).
- Develop the "Paper Database" interface (pagination, detail view, taxonomy tag management, list curation).
- Integrate Tailwind CSS and `shadcn/ui` for a premium, consistent, and responsive design system.
- Ensure all frontend state management and API data fetching (via TanStack Query v5) align with the shared SQLite data model.

## Capabilities

### New Capabilities

- `interactive-search`: The web interface for real-time paper exploration across multiple sources with advanced filtering. Search results are temporary until explicitly saved.
- `paper-database`: The web interface for managing saved papers, viewing detailed metadata, mapping cross-project duplicates (copying), managing taxonomy/keywords, and curating lists. Includes triggering AI keyword/OMR extraction on-demand.
- `frontend-architecture`: The core Next.js setup, styling (Tailwind/shadcn), state management, and API integration layer.

### Modified Capabilities

- 

## Impact

- **Code**: Fully populates the currently empty `web/` directory with a Next.js application.
- **APIs**: The frontend will depend heavily on the yet-to-be-implemented FastAPI backend endpoints (`/api/search`, `/api/papers`, `/api/review`, etc.). Frontend development must either mock these endpoints initially or co-evolve with backend development.
- **Systems**: Establishes the user-facing portion of the "One DB, Two Interfaces" architecture principle.

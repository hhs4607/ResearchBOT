## 1. Project Initialization & Setup

- [x] 1.1 Scaffold Next.js 16 App Router project in `web/` directory
- [x] 1.2 Install and configure Tailwind CSS
- [x] 1.3 Install and configure `shadcn/ui` foundation
- [x] 1.4 Install TanStack Query v5 and setup global `QueryClientProvider`
- [x] 1.5 Setup basic layout structure (Navigation Sidebar/Header)

## 2. Interactive Search Implementation

- [x] 2.1 Develop Home Search Component (`app/(home)/page.tsx`)
- [x] 2.2 Develop Search Results Layout (`app/search/page.tsx`)
- [x] 2.3 Implement Search Result Card component (Title, Authors, Abstract, initial Score)
- [x] 2.4 Implement Filter panel and Sorting controls
- [x] 2.5 Implement "Save to Project" action for temporary search results

## 3. Paper Database Implementation

- [x] 3.1 Develop Database List View (`app/papers/page.tsx`) with data table structure
- [x] 3.2 Implement pagination, bulk select, and advanced filtering for the Database
- [x] 3.3 Develop Paper Detail Page (`app/papers/[id]/page.tsx`)
- [x] 3.4 Implement Manual Curation UI (Include/Exclude toggles, AI Keyword editing, custom notes)
- [x] 3.5 Implement AI Extraction triggers (Single and Bulk)
- [x] 3.6 Implement Cross-Project Copying UI
- [x] 3.7 Implement Auto-select threshold control

## 4. Integration Preparation (Mocking)

- [x] 4.1 Create mock data files for Search Results and Library Papers based on the SQLite schema
- [x] 4.2 Hook up UI components to mock data via TanStack Query (pending actual FastAPI endpoints)

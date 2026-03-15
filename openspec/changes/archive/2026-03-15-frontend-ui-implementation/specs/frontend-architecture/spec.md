## ADDED Requirements

### Requirement: Frontend Routing Structure
The frontend SHALL utilize Next.js App Router to separate functional areas into distinct routes (e.g., /, /search, /papers, /review).

#### Scenario: Navigating between features
- **WHEN** user clicks on navigation links in the persistent sidebar
- **THEN** system loads the requested route without a full page refresh

### Requirement: Global Design System
The frontend SHALL implement a global design system based on Tailwind CSS and `shadcn/ui` for consistent styling.

#### Scenario: Viewing the UI
- **WHEN** user interacts with any page element (buttons, inputs, cards)
- **THEN** the elements share a consistent visual language, color scheme, and typography

### Requirement: Client-Side State Management
The system SHALL manage remote server state using TanStack Query v5 to handle caching, loading states, and background synchronization.

#### Scenario: Fetching data from an endpoint
- **WHEN** the frontend requests data from the backend (e.g., search results)
- **THEN** TanStack Query manages the loading UI, caches the response, and handles background refetching if necessary

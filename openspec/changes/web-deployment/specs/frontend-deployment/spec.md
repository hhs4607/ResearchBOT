## ADDED Requirements

### Requirement: Vercel deployment configuration
The frontend SHALL have a vercel.json (or next.config.ts rewrites) that proxies /api/* requests to the Railway backend URL.

#### Scenario: API proxy works on Vercel
- **WHEN** frontend makes a request to /api/projects
- **THEN** the request is proxied to the Railway backend and returns data

### Requirement: Environment-based API URL
The frontend SHALL use `NEXT_PUBLIC_API_URL` environment variable to determine the backend URL. Default to `http://localhost:8000` for local development.

#### Scenario: Local development
- **WHEN** NEXT_PUBLIC_API_URL is not set
- **THEN** frontend calls localhost:8000

#### Scenario: Production
- **WHEN** NEXT_PUBLIC_API_URL is set to Railway URL
- **THEN** frontend calls the Railway backend

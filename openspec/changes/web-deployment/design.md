## Context

ResearchBot has a FastAPI backend (port 8000) and Next.js frontend (port 3000). Currently localhost only. User has existing Vercel and Railway accounts.

## Goals / Non-Goals

**Goals:**
- Deploy to web with minimal cost ($5/mo)
- GitHub push → auto-deploy
- Persistent DB across Railway redeploys
- HTTPS on both frontend and backend

**Non-Goals:**
- Custom domain (can add later)
- CI/CD testing pipeline (deploy only)
- Database migration to PostgreSQL (keep SQLite)

## Decisions

### 1. Vercel for frontend, Railway for backend

**Rationale**: User already has both accounts. Vercel free tier handles Next.js perfectly. Railway $5/mo Hobby plan has enough resources for a single-user research tool.

### 2. Railway Volume for SQLite persistence

**Rationale**: Railway's filesystem is ephemeral — redeploys wipe files. A Volume mount at `/data` keeps the SQLite DB file persistent. $0 extra cost on Hobby plan.

### 3. CORS configuration for cross-origin

**Rationale**: Frontend on `*.vercel.app` needs to call backend on `*.railway.app`. Backend CORS must allow the Vercel origin. Frontend API calls must use the full Railway URL (not localhost).

### 4. Environment-based API URL

**Rationale**: Frontend needs `NEXT_PUBLIC_API_URL` to know where the backend is. Set to Railway URL in Vercel env vars. Locally, set to `http://localhost:8000`.

## Risks / Trade-offs

- **Risk: SQLite concurrent writes on Railway** → Single user, not a problem.
- **Risk: Railway cold starts** → Hobby plan keeps service running, no cold start.
- **Risk: Large search requests timeout** → Railway default timeout is 300s, sufficient for deep search.

## Why

ResearchBot runs on localhost only. Need to deploy to the web so it's accessible from any device without keeping a local PC running.

## What Changes

- Deploy frontend to Vercel (free)
- Deploy backend (FastAPI + SQLite) to Railway ($5/mo Hobby plan)
- Configure cross-origin API communication
- Set up persistent storage for SQLite on Railway
- Configure environment variables on both platforms
- Set up GitHub-based auto-deployment

## Capabilities

### New Capabilities

- `backend-deployment`: Dockerfile + Railway config for FastAPI backend with persistent SQLite volume
- `frontend-deployment`: Vercel config for Next.js frontend with API proxy to Railway backend
- `ci-deployment`: GitHub push → auto-deploy pipeline for both services

### Modified Capabilities

- (none)

## Impact

- **Infrastructure**: Two new cloud services (Vercel free + Railway $5/mo)
- **Code**: Dockerfile, railway.json, vercel.json, next.config.ts update, CORS config update
- **Environment**: API keys must be set on Railway (not local .env)
- **Database**: SQLite file on Railway Volume (persistent across deploys)

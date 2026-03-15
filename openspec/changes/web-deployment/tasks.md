## 1. Backend Docker 세팅

- [x] 1.1 Create `Dockerfile` for FastAPI backend (Python 3.12, uvicorn production mode)
- [x] 1.2 Create `.dockerignore` (exclude .venv, node_modules, .git, .next, *.db)
- [x] 1.3 Update `src/config.py` — DB path from `DATABASE_PATH` env var (default: `data/research_bot.db`)
- [x] 1.4 Update `src/api/app.py` CORS — read `FRONTEND_URL` env var for allowed origins
- [x] 1.5 Test Docker build locally: `docker build -t researchbot-api .`
- [x] 1.6 Test Docker run locally: `docker run -p 8000:8000 researchbot-api`
- [x] 1.7 Verify API works via Docker: `curl localhost:8000/api/projects` (0 projects, 81 keywords)

## 2. Frontend Vercel 세팅

- [x] 2.1 Update `web/src/lib/api/client.ts` — use `NEXT_PUBLIC_API_URL` env var for API base URL
- [x] 2.2 Update `web/next.config.ts` — direct fetch to API_BASE (no proxy needed)
- [x] 2.3 Build test passed with API_BASE changes
- [x] 2.4 Frontend connects to backend via env var (API_BASE="" for local, full URL for prod)

## 3. GitHub Repository

- [x] 3.1 Create GitHub repository (or use existing) — https://github.com/hhs4607/ResearchBOT
- [x] 3.2 Push all code to GitHub main branch
- [x] 3.3 Verify all files are present in remote

## 4. Railway 배포

- [x] 4.1 Create Railway project, connect GitHub repo
- [x] 4.2 Set root directory to `/` (backend) — auto-detected Dockerfile
- [x] 4.3 Create Railway Volume, mount at `/data`
- [x] 4.4 Set Railway env vars (7 vars: GEMINI, OPENALEX, S2, ZOTERO x2, DATABASE_PATH, FRONTEND_URL)
- [x] 4.5 Deploy backend on Railway
- [x] 4.6 Verify backend: https://researchbot-production-113e.up.railway.app/api/projects ✅
- [x] 4.7 Railway public URL: researchbot-production-113e.up.railway.app (port 8080)

## 5. Vercel 배포

- [x] 5.1 Create Vercel project, connect GitHub repo
- [x] 5.2 Set root directory to `web/`
- [x] 5.3 Set Vercel env var: NEXT_PUBLIC_API_URL=https://researchbot-production-113e.up.railway.app
- [x] 5.4 Deploy frontend on Vercel
- [x] 5.5 Verify frontend: https://research-bot-azure.vercel.app ✅
- [x] 5.6 Railway FRONTEND_URL updated with Vercel URL → CORS working

## 6. End-to-End 검증

- [x] 6.1 Open Vercel URL in browser — homepage loads with project selector
- [x] 6.2 Test: Create project — "Deploy Test" created
- [x] 6.3 Test: Search papers — "digital twin fatigue" → 60 papers, 3 sources
- [x] 6.4 Test: Save papers to project — 3 papers saved
- [x] 6.5 Test: Paper detail view — keywords, abstract, scores displayed
- [x] 6.6 Test: Include/Exclude toggle — Status badges working
- [x] 6.7 Test: CSV export — download working
- [x] 6.8 Test: Gemini AI extraction — keywords+OMR extracted, auto-normalized

## 7. 마무리

- [ ] 7.1 Run data migration on Railway (if needed)
- [ ] 7.2 Commit deployment config files
- [ ] 7.3 Update docs/COORDINATION.md with deployed URLs

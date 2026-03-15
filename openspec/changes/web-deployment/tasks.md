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

- [ ] 3.1 Create GitHub repository (or use existing)
- [ ] 3.2 Push all code to GitHub main branch
- [ ] 3.3 Verify all files are present in remote

## 4. Railway 배포

- [ ] 4.1 Create Railway project, connect GitHub repo
- [ ] 4.2 Set root directory to `/` (backend)
- [ ] 4.3 Create Railway Volume, mount at `/data`
- [ ] 4.4 Set Railway env vars: GEMINI_API_KEY, OPENALEX_EMAIL, S2_API_KEY, ZOTERO_USER_ID, ZOTERO_API_KEY, DATABASE_PATH=/data/research_bot.db, FRONTEND_URL=(Vercel URL, set after step 5)
- [ ] 4.5 Deploy backend on Railway
- [ ] 4.6 Verify backend: `curl https://<railway-url>/api/projects`
- [ ] 4.7 Note the Railway public URL for frontend config

## 5. Vercel 배포

- [ ] 5.1 Create Vercel project, connect GitHub repo
- [ ] 5.2 Set root directory to `web/`
- [ ] 5.3 Set Vercel env var: NEXT_PUBLIC_API_URL=https://<railway-url>
- [ ] 5.4 Deploy frontend on Vercel
- [ ] 5.5 Verify frontend loads at Vercel URL
- [ ] 5.6 Go back to Railway → update FRONTEND_URL env var with Vercel URL

## 6. End-to-End 검증

- [ ] 6.1 Open Vercel URL in browser
- [ ] 6.2 Test: Create project
- [ ] 6.3 Test: Search papers (OpenAlex at minimum)
- [ ] 6.4 Test: Save papers to project
- [ ] 6.5 Test: Paper detail view
- [ ] 6.6 Test: Include/Exclude toggle
- [ ] 6.7 Test: CSV export download
- [ ] 6.8 Test: Gemini AI extraction (if API key set)

## 7. 마무리

- [ ] 7.1 Run data migration on Railway (if needed): `python scripts/migrate_paperreviewbot.py`
- [ ] 7.2 Commit deployment config files
- [ ] 7.3 Update docs/COORDINATION.md with deployed URLs

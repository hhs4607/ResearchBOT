## ADDED Requirements

### Requirement: Dockerfile for FastAPI backend
The project SHALL have a Dockerfile that builds the FastAPI backend with all Python dependencies and runs uvicorn in production mode.

#### Scenario: Docker build succeeds
- **WHEN** `docker build -t researchbot-api .` is run
- **THEN** the image builds without errors and contains all dependencies

### Requirement: Railway Volume for SQLite
The backend SHALL store the SQLite database at a configurable path (default `/data/research_bot.db`) that maps to a Railway Volume for persistence.

#### Scenario: Database survives redeploy
- **WHEN** Railway redeploys the backend service
- **THEN** the SQLite database file is preserved with all existing data

### Requirement: CORS allows Vercel origin
The FastAPI CORS middleware SHALL allow requests from the Vercel frontend URL (configurable via `FRONTEND_URL` env var).

#### Scenario: Frontend API call succeeds
- **WHEN** the Vercel frontend calls the Railway backend API
- **THEN** the request succeeds without CORS errors

### Requirement: Environment variables on Railway
All API keys (GEMINI, S2, ZOTERO, etc.) SHALL be configured as Railway environment variables, not in files.

#### Scenario: Backend reads API keys
- **WHEN** the backend starts on Railway
- **THEN** it reads API keys from environment variables (not .env file)

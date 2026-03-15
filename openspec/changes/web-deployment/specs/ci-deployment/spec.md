## ADDED Requirements

### Requirement: GitHub repository for auto-deploy
The project SHALL be pushed to a GitHub repository that both Vercel and Railway connect to for auto-deployment.

#### Scenario: Push triggers deploy
- **WHEN** code is pushed to main branch
- **THEN** both Vercel (frontend) and Railway (backend) auto-deploy

### Requirement: Monorepo configuration
Both services SHALL deploy from the same repository with different root directories: `/` for backend, `/web` for frontend.

#### Scenario: Vercel deploys frontend only
- **WHEN** Vercel detects a push
- **THEN** it builds only the web/ directory

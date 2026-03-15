## Why

Two separate implementation plans exist (backend by Claude, frontend by Antigravity) but they are out of sync. The frontend plan (`frontend-ui-implementation`) was written against PRD v1 while the backend plan (`backend-api-implementation`) follows PRD v2. Key mismatches include: frontend still references Agent review sessions (removed), lacks project-based workflow (new core feature), and has no include/exclude curation flow (new core UX). Before any code is written, both plans must be aligned and a communication channel established.

## What Changes

- Review and document all mismatches between the two plans
- Create a coordination checklist covering: project setup, API contract, shared types, environment config
- Establish a communication channel document for ongoing Claude ↔ Antigravity coordination
- Identify blocking dependencies (what backend must deliver before frontend can build)

## Capabilities

### New Capabilities

- `plan-alignment-review`: Systematic comparison of backend and frontend plans, identifying mismatches, stale artifacts, and required updates against PRD v2.
- `coordination-channel`: A shared coordination document that tracks API contract agreements, blocking dependencies, integration milestones, and open questions between Claude (backend) and Antigravity (frontend).
- `setup-checklist`: Project-level setup tasks that must be completed before either side begins implementation — environment, tooling, shared config, directory structure.

### Modified Capabilities

- (none)

## Impact

- **Process**: Both implementors (Claude + Antigravity) have a single source of truth for coordination
- **Frontend plan**: `frontend-ui-implementation` change needs significant updates (review sessions removed, project workflow added, include/exclude UI added, keyword management UI added, export UI added)
- **No code changes**: This is a planning/coordination change only

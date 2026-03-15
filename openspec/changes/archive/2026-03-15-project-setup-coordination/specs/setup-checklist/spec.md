## ADDED Requirements

### Requirement: Project directory structure
The project SHALL have the following directory structure ready before implementation begins:
- `src/` — Python backend (search/, services/, api/, llm/)
- `web/` — Next.js frontend (Antigravity's workspace)
- `data/` — SQLite database
- `scripts/` — Migration and utility scripts
- `docs/` — Coordination and documentation
- `config.yaml` — Shared configuration
- `.env` / `.env.example` — Environment variables

#### Scenario: Fresh clone setup
- **WHEN** a developer clones the repository
- **THEN** they can see the directory structure and understand where each concern lives

### Requirement: Python environment setup
The backend SHALL use Python 3.12 with `uv` as package manager. `pyproject.toml` SHALL list all dependencies. A `.python-version` file SHALL specify the Python version.

#### Scenario: Backend developer setup
- **WHEN** developer runs `uv sync`
- **THEN** all Python dependencies are installed and the backend is ready to run

### Requirement: Environment variable documentation
A `.env.example` file SHALL document all required and optional environment variables with comments explaining each one.

#### Scenario: New developer configuration
- **WHEN** developer copies `.env.example` to `.env`
- **THEN** they see clear instructions for which API keys are required vs optional

### Requirement: Gitignore coverage
The `.gitignore` SHALL exclude: `.env`, `*.db`, `__pycache__/`, `*.pyc`, `.venv/`, `node_modules/`, `.next/`, `output/`

#### Scenario: Sensitive files protection
- **WHEN** developer runs `git status`
- **THEN** `.env` and database files are not shown as untracked

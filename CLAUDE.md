# ARGOS - Plateforme de Veille

## Stack
- Backend: FastAPI + Python 3.12 + Supabase
- Frontend: React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui
- Infra: Docker Compose

## Commands
- Backend: `cd backend && uvicorn app.main:app --reload`
- Frontend: `cd frontend && npm run dev`
- Tests: `scripts/preflight.sh`
- Docker: `docker-compose up --build`

## Code Style
- Python: Ruff, type hints obligatoires, fonctions < 30 lignes
- TypeScript: ESLint + Prettier, composants fonctionnels + hooks
- Commits: conventional commits (feat|fix|refactor|docs|test|chore)

## Structure
- Backend routes: `backend/app/routers/`
- Frontend pages: `frontend/src/pages/`
- Skills: `.claude/skills/`
- Specs: `_specs/phases/`

## Rules
- ALWAYS read file before modifying
- NEVER secrets in code
- Tests E2E > Unit tests
- Logging on every feature
- Comments explain WHY, not WHAT

## Workflow
1. Read spec → 2. Plan → 3. Code → 4. preflight.sh → 5. E2E test → 6. Commit

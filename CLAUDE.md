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

## BMAD Artifacts
- PRD: `_bmad-output/planning-artifacts/prd.md`
- Epics: `_bmad-output/planning-artifacts/epics.md`
- Stories: `_bmad-output/implementation-artifacts/stories/`
- Sprint Status: `_bmad-output/implementation-artifacts/sprint-status.yaml`
- Handoff: `_bmad-output/HANDOFF.md`

## Rules
- ALWAYS read file before modifying
- NEVER secrets in code
- Tests E2E > Unit tests
- Logging on every feature
- Comments explain WHY, not WHAT

## Workflow (BMAD)
1. `/bmad:bmm:workflows:sprint-status` → Check current state
2. Pick story from sprint-status.yaml
3. Read story file → Plan → Code
4. preflight.sh → E2E test → Commit
5. Update sprint-status.yaml

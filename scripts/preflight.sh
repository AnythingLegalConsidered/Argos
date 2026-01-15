#!/bin/bash
set -e

echo "=== ARGOS PREFLIGHT CHECK ==="
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# Backend checks
echo "[1/4] Backend: Ruff lint..."
if command -v ruff &> /dev/null; then
    cd backend && ruff check app/ --fix || echo "  Warning: Ruff issues found"
    cd ..
else
    echo "  Skipped: ruff not installed"
fi

echo ""
echo "[2/4] Backend: Type check..."
if command -v mypy &> /dev/null; then
    cd backend && mypy app/ --ignore-missing-imports || echo "  Warning: Type issues found"
    cd ..
else
    echo "  Skipped: mypy not installed"
fi

# Frontend checks
echo ""
echo "[3/4] Frontend: ESLint..."
if [ -d "frontend/node_modules" ]; then
    cd frontend && npm run lint || echo "  Warning: Lint issues found"
    cd ..
else
    echo "  Skipped: node_modules not installed"
fi

echo ""
echo "[4/4] Frontend: TypeScript..."
if [ -d "frontend/node_modules" ]; then
    cd frontend && npm run type-check || echo "  Warning: Type issues found"
    cd ..
else
    echo "  Skipped: node_modules not installed"
fi

echo ""
echo "=== PREFLIGHT COMPLETE ==="

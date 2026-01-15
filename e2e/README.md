# Argos E2E Tests

Tests end-to-end avec Playwright.

## Setup

```bash
cd e2e
npm install
npx playwright install
```

## Exécution

```bash
# Tous les tests
npm test

# Avec interface UI
npm run test:ui

# Mode headed (voir le navigateur)
npm run test:headed

# Voir le rapport
npm run report
```

## Structure

```
e2e/
├── tests/
│   ├── auth.spec.ts      # Tests authentification
│   ├── dashboard.spec.ts # Tests dashboard
│   ├── sources.spec.ts   # Tests gestion sources
│   └── search.spec.ts    # Tests recherche
├── playwright.config.ts  # Configuration Playwright
└── package.json
```

## Notes

- Les tests marqués `test.skip` nécessitent un fixture d'authentification
- Pour l'instant, seuls les tests publics (login/register) fonctionnent
- TODO: Implémenter auth fixture avec utilisateur de test

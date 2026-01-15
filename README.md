<p align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/eye.svg" width="80" height="80" alt="Argos Logo"/>
</p>

<h1 align="center">Argos</h1>

<p align="center">
  <strong>Plateforme de veille intelligente</strong><br>
  Agrégez, recherchez et organisez vos sources d'information avec authentification et recherche full-text.
</p>

<p align="center">
  <a href="#fonctionnalités">Fonctionnalités</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api-reference">API</a> •
  <a href="#déploiement">Déploiement</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI"/>
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/>
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase"/>
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker"/>
</p>

---

## Fonctionnalités

| Feature | Description |
|---------|-------------|
| **Multi-sources** | RSS feeds, subreddits Reddit |
| **Recherche full-text** | PostgreSQL tsvector avec ranking et highlighting |
| **Authentification** | Supabase Auth avec JWT validation |
| **Capture manuelle** | Sauvegarder n'importe quelle page web |
| **Export** | Exportez vos articles en JSON |
| **Sources suggérées** | Bibliothèque de sources de qualité pré-configurées |
| **Rate limiting** | Protection contre les abus (20 req/min) |
| **Row Level Security** | Isolation des données par utilisateur |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         NGINX (Reverse Proxy)                    │
│                              :80                                 │
└─────────────────────────────┬───────────────────────────────────┘
                              │
          ┌───────────────────┴───────────────────┐
          │                                       │
          ▼                                       ▼
┌─────────────────────┐             ┌─────────────────────┐
│   Frontend (React)  │             │  Backend (FastAPI)  │
│       :3000         │ ─────────►  │       :8000         │
│                     │   REST API  │                     │
│  • React 18         │             │  • Python 3.12      │
│  • TypeScript 5.7   │             │  • Pydantic v2      │
│  • TailwindCSS      │             │  • JWT Auth         │
│  • React Router 7   │             │  • Rate Limiting    │
└─────────────────────┘             └──────────┬──────────┘
                                               │
                                               ▼
                                  ┌─────────────────────┐
                                  │      Supabase       │
                                  │    (PostgreSQL)     │
                                  │                     │
                                  │  • RLS Policies     │
                                  │  • Full-text Search │
                                  │  • Auth Service     │
                                  └─────────────────────┘
```

---

## Stack Technique

### Backend

| Technologie | Version | Usage |
|-------------|---------|-------|
| Python | 3.12+ | Runtime |
| FastAPI | 0.115+ | Framework API REST |
| Pydantic | 2.x | Validation & Schemas |
| Supabase-py | 2.x | Client PostgreSQL |
| httpx | - | HTTP async client |
| feedparser | - | Parsing RSS/Atom |
| beautifulsoup4 | - | Extraction contenu web |

### Frontend

| Technologie | Version | Usage |
|-------------|---------|-------|
| React | 18.3 | Framework UI |
| TypeScript | 5.7 | Typage statique |
| Vite | 6.x | Build tool |
| TailwindCSS | 3.4 | Styling |
| React Router | 7.x | Routing |
| Lucide React | - | Icons |
| Sonner | - | Toast notifications |

### Infrastructure

| Composant | Technologie |
|-----------|-------------|
| Base de données | Supabase (PostgreSQL 15) |
| Auth | Supabase Auth (JWT) |
| Conteneurs | Docker + Docker Compose |
| Reverse Proxy | Nginx Alpine |

---

## Quick Start

### Prérequis

- Python 3.12+
- Node.js 20+
- Docker & Docker Compose (optionnel)
- Compte [Supabase](https://supabase.com/)

### 1. Clone

```bash
git clone https://github.com/AnythingLegalConsidered/Argos.git
cd Argos
```

### 2. Configuration Supabase

1. Créer un projet sur [Supabase](https://supabase.com/dashboard)
2. Exécuter les migrations SQL (voir `supabase/migrations/`)
3. Copier les credentials depuis **Settings > API**

### 3. Variables d'environnement

Créer `.env` à la racine :

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret
```

### 4. Développement

<details>
<summary><strong>Backend</strong></summary>

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API disponible sur http://localhost:8000/docs

</details>

<details>
<summary><strong>Frontend</strong></summary>

```bash
cd frontend
npm install
npm run dev
```

App disponible sur http://localhost:5173

</details>

<details>
<summary><strong>Docker Compose</strong></summary>

```bash
docker-compose up --build
```

Services :
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Nginx: http://localhost:80

</details>

---

## API Reference

### Authentification

Toutes les routes `/api/*` nécessitent un JWT Supabase :

```
Authorization: Bearer <supabase_access_token>
```

### Endpoints

#### Sources

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/sources` | Liste des sources |
| `POST` | `/api/sources` | Créer une source |
| `GET` | `/api/sources/{id}` | Détail d'une source |
| `DELETE` | `/api/sources/{id}` | Supprimer une source |
| `PATCH` | `/api/sources/{id}/toggle` | Activer/désactiver |
| `GET` | `/api/sources/suggested` | Sources recommandées |
| `POST` | `/api/sources/suggested` | Ajouter sources suggérées |

#### Articles

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/articles` | Liste paginée |
| `GET` | `/api/articles/{id}` | Détail complet |
| `GET` | `/api/articles/search?q=...` | Recherche full-text |
| `GET` | `/api/articles/export` | Export JSON |
| `POST` | `/api/articles/capture` | Capture URL |

#### Fetch

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/api/fetch` | Fetch toutes les sources |
| `POST` | `/api/fetch/{source_id}` | Fetch une source |

#### System

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/docs` | Swagger UI |
| `GET` | `/redoc` | ReDoc |

### Paramètres de filtrage (Articles)

```
GET /api/articles?offset=0&limit=20&source_id=xxx&category=Tech&tag=python
```

| Paramètre | Type | Description |
|-----------|------|-------------|
| `offset` | int | Pagination (défaut: 0) |
| `limit` | int | Items/page (défaut: 20, max: 100) |
| `source_id` | UUID | Filtrer par source |
| `category` | string | Filtrer par catégorie |
| `tag` | string | Filtrer par tag |
| `from_date` | datetime | Articles après date |
| `to_date` | datetime | Articles avant date |

---

## Structure du Projet

```
Argos/
├── backend/
│   ├── app/
│   │   ├── main.py              # Entry point FastAPI
│   │   ├── config.py            # Settings Pydantic
│   │   ├── auth.py              # JWT validation
│   │   ├── database.py          # Supabase client
│   │   ├── routers/             # API endpoints
│   │   │   ├── sources.py
│   │   │   ├── articles.py
│   │   │   └── fetch.py
│   │   ├── services/            # Business logic
│   │   │   ├── rss_fetcher.py
│   │   │   └── article_capture.py
│   │   ├── schemas/             # Pydantic models
│   │   └── data/
│   │       └── seed_sources.json
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Router + Layout
│   │   ├── pages/               # Views
│   │   ├── components/          # UI components
│   │   │   └── ui/              # shadcn primitives
│   │   ├── hooks/               # Custom hooks
│   │   ├── contexts/            # React contexts
│   │   └── services/            # API clients
│   ├── Dockerfile
│   └── package.json
│
├── nginx/
│   └── nginx.conf
├── scripts/
│   └── preflight.sh             # Pre-commit checks
├── e2e/                         # Tests Playwright
├── _specs/                      # Project specs
├── docker-compose.yml
└── README.md
```

---

## Modèle de Données

```
┌─────────────────┐       ┌─────────────────┐
│     sources     │       │    articles     │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │◄──┐   │ id (PK)         │
│ user_id (FK)    │   │   │ user_id (FK)    │
│ type            │   │   │ source_id (FK)  │──┘
│ url (UNIQUE)    │   │   │ title           │
│ name            │   │   │ url             │
│ category        │   │   │ content         │
│ is_active       │   │   │ author          │
│ last_fetch_at   │   │   │ published_at    │
│ created_at      │   │   │ captured_at     │
└─────────────────┘   │   │ tags[]          │
                      │   │ metadata{}      │
                      └───│ search_vector   │
                          └─────────────────┘
```

**Types de sources** : `rss` | `reddit`

---

## Déploiement

### Production avec Docker

```yaml
# docker-compose.prod.yml
services:
  backend:
    build: ./backend
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_KEY=${SUPABASE_KEY}
      - SUPABASE_JWT_SECRET=${SUPABASE_JWT_SECRET}
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.prod.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
```

### Checklist Production

- [ ] Variables d'environnement sécurisées
- [ ] HTTPS via Let's Encrypt
- [ ] Rate limiting configuré
- [ ] Logs centralisés
- [ ] Health checks actifs
- [ ] Backups Supabase

---

## Développement

### Scripts

```bash
# Backend - Linting
cd backend && ruff check . && ruff format .

# Frontend - Lint & Types
cd frontend && npm run lint && npm run type-check

# Pre-commit (all)
./scripts/preflight.sh
```

### Conventions

- **Commits** : [Conventional Commits](https://www.conventionalcommits.org/)
- **Python** : Type hints, Ruff
- **TypeScript** : Strict mode, ESLint

---

## Troubleshooting

| Problème | Solution |
|----------|----------|
| CORS errors | Vérifier `CORS_ORIGINS` dans `.env` backend |
| Auth 401/403 | Vérifier `SUPABASE_JWT_SECRET` |
| Database errors | Vérifier migrations Supabase + RLS |
| Fetch vide | Vérifier `is_active: true` sur sources |

---

## Roadmap

- [x] **Phase 1** : Fondations (Auth, CRUD, RSS)
- [x] **Phase 2** : Recherche full-text, capture manuelle
- [ ] **Phase 3** : Tags automatiques (NLP/LLM)
- [ ] **Phase 4** : Dashboard analytics
- [ ] **Phase 5** : PWA + notifications

---

## Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amazing-feature`)
3. Commit (`git commit -m 'feat: add amazing feature'`)
4. Push (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

---

## License

[MIT](LICENSE)

---

<p align="center">
  <strong>Argos</strong> — Votre sentinelle de veille technologique
</p>

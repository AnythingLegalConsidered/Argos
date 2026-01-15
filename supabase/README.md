# Supabase Migrations - Argos

## Application des migrations

### Option 1: Via Supabase Dashboard (recommandé pour dev)

1. Ouvrir le projet Supabase : https://supabase.com/dashboard
2. Aller dans **SQL Editor**
3. Copier-coller le contenu de `migrations/001_create_sources_articles.sql`
4. Exécuter

### Option 2: Via Supabase CLI

```bash
# Installer Supabase CLI si pas déjà fait
npm install -g supabase

# Se connecter
supabase login

# Lier le projet
supabase link --project-ref <project-id>

# Appliquer la migration
supabase db push
```

## Migrations

| Fichier | Description | Status |
|---------|-------------|--------|
| `001_create_sources_articles.sql` | Tables sources, articles, user_preferences + RLS | Ready |

## Schema

### Tables

- **sources** : Sources RSS/Reddit de l'utilisateur
- **articles** : Articles capturés avec search vector
- **user_preferences** : Préférences utilisateur

### RLS Policies

Toutes les tables ont des policies RLS pour l'isolation multi-tenant :
- SELECT/INSERT/UPDATE/DELETE limités à `auth.uid() = user_id`

### Full-Text Search

La fonction `search_articles(query, user_id, limit, offset)` permet la recherche avec :
- Ranking par pertinence
- Highlighting des termes trouvés

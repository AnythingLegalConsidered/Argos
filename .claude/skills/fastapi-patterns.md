# FastAPI Patterns pour ARGOS

## Structure Router
- Un fichier par domaine (sources.py, articles.py)
- Préfixe `/api/v1/`
- Tags pour documentation OpenAPI

## Exemple Router
```python
from fastapi import APIRouter, Depends, HTTPException
from app.deps import get_current_user, get_supabase

router = APIRouter(prefix="/api/v1/sources", tags=["sources"])

@router.get("/")
async def list_sources(
    category: str | None = None,
    supabase = Depends(get_supabase)
):
    query = supabase.table("sources").select("*").eq("is_validated", True)
    if category:
        query = query.eq("category", category)
    return query.execute().data
```

## Gestion d'erreurs
- HTTPException pour erreurs client (400, 404)
- Logging pour erreurs serveur (500)
- Toujours retourner des messages clairs

## Dépendances (deps.py)
```python
from fastapi import Depends, HTTPException
from app.config import get_settings

async def get_supabase():
    settings = get_settings()
    from supabase import create_client
    return create_client(settings.supabase_url, settings.supabase_key)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    # Validate JWT with Supabase
    pass
```

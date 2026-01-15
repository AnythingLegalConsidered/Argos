"""Articles API endpoints."""

import json
import logging
from datetime import datetime, timezone
from io import BytesIO
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from supabase import Client

from app.auth import CurrentUser
from app.database import get_db
from app.schemas.article import (
    ArticleDetailResponse,
    ArticleListItem,
    ArticleListResponse,
    ArticleResponse,
    CaptureRequest,
    SearchResponse,
    SearchResultItem,
)
from app.services.article_capture import ArticleCaptureService
from app.utils.rate_limiter import rate_limit_by_user
from app.utils.validators import UUIDPath

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/articles", tags=["articles"])

# Constants
DEFAULT_LIMIT = 20
MAX_LIMIT = 100
EXCERPT_LENGTH = 200


def _truncate_content(content: str | None, length: int = EXCERPT_LENGTH) -> str | None:
    """Truncate content to create an excerpt."""
    if not content:
        return None
    if len(content) <= length:
        return content
    return content[:length].rsplit(" ", 1)[0] + "..."


@router.get("/search", response_model=SearchResponse)
async def search_articles(
    current_user: CurrentUser,
    db: Annotated[Client, Depends(get_db)],
    q: str = Query(..., min_length=1, max_length=200, description="Search query"),
    offset: int = Query(default=0, ge=0, description="Number of items to skip"),
    limit: int = Query(default=DEFAULT_LIMIT, ge=1, le=MAX_LIMIT, description="Number of items to return"),
) -> SearchResponse:
    """
    Full-text search across articles.

    Uses PostgreSQL tsvector for efficient search with ranking and highlighting.
    Results are ordered by relevance (rank descending).

    - **q**: Search query (supports natural language queries)
    - **offset**: Number of items to skip (default: 0)
    - **limit**: Number of items to return (default: 20, max: 100)
    """
    logger.info(f"Search query: '{q}' for user {current_user.id}")

    # Call the search_articles PostgreSQL function via RPC
    result = db.rpc(
        "search_articles",
        {
            "search_query": q,
            "p_user_id": current_user.id,
            "p_limit": limit + 1,  # Fetch one extra to check has_more
            "p_offset": offset,
        },
    ).execute()

    # Get source info for results
    source_ids = list(set(r["source_id"] for r in result.data if r.get("source_id")))
    sources_map = {}
    if source_ids:
        sources_result = (
            db.table("sources")
            .select("id, name, type")
            .in_("id", source_ids)
            .execute()
        )
        sources_map = {s["id"]: s for s in sources_result.data}

    # Check if there are more results
    has_more = len(result.data) > limit
    data = result.data[:limit]

    # Transform results
    results = []
    for row in data:
        source = sources_map.get(row.get("source_id"), {})
        results.append(
            SearchResultItem(
                id=str(row["id"]),
                title=row["title"],
                url=row.get("url"),
                author=row.get("author"),
                published_at=row.get("published_at"),
                captured_at=row["captured_at"],
                source_id=str(row["source_id"]) if row.get("source_id") else None,
                source_name=source.get("name"),
                source_type=source.get("type"),
                tags=row.get("tags", []),
                rank=row["rank"],
                headline=row["headline"],
            )
        )

    # Get accurate total count via RPC
    count_result = db.rpc(
        "count_search_articles",
        {"search_query": q, "p_user_id": current_user.id},
    ).execute()
    total_count = count_result.data if isinstance(count_result.data, int) else 0

    return SearchResponse(
        results=results,
        query=q,
        total_count=total_count,
        has_more=has_more,
        offset=offset,
        limit=limit,
    )


@router.get("/export")
async def export_articles(
    current_user: CurrentUser,
    db: Annotated[Client, Depends(get_db)],
    format: str = Query(default="json", description="Export format (only json supported)"),
) -> StreamingResponse:
    """
    Export all articles for the authenticated user.

    Returns a downloadable JSON file containing all articles with full content.

    - **format**: Export format (currently only 'json' is supported)
    """
    if format != "json":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JSON format is supported",
        )

    # Fetch all articles with source info
    result = (
        db.table("articles")
        .select("*, sources(name, type, category)")
        .eq("user_id", current_user.id)
        .order("captured_at", desc=True)
        .execute()
    )

    # Transform data for export
    articles = []
    for row in result.data:
        source_data = row.get("sources") or {}
        articles.append({
            "id": row["id"],
            "title": row["title"],
            "url": row.get("url"),
            "content": row.get("content"),
            "author": row.get("author"),
            "published_at": row.get("published_at"),
            "captured_at": row["captured_at"],
            "source_name": source_data.get("name"),
            "source_type": source_data.get("type"),
            "source_category": source_data.get("category"),
            "tags": row.get("tags", []),
            "metadata": row.get("metadata", {}),
        })

    export_data = {
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "total_articles": len(articles),
        "articles": articles,
    }

    # Create JSON file
    json_bytes = json.dumps(export_data, indent=2, ensure_ascii=False).encode("utf-8")
    buffer = BytesIO(json_bytes)

    filename = f"argos_export_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.json"

    logger.info(f"Exported {len(articles)} articles for user {current_user.id}")

    return StreamingResponse(
        buffer,
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("", response_model=ArticleListResponse)
async def list_articles(
    current_user: CurrentUser,
    db: Annotated[Client, Depends(get_db)],
    offset: int = Query(default=0, ge=0, description="Number of items to skip"),
    limit: int = Query(default=DEFAULT_LIMIT, ge=1, le=MAX_LIMIT, description="Number of items to return"),
    source_id: str | None = Query(default=None, description="Filter by source ID"),
    category: str | None = Query(default=None, description="Filter by source category"),
    tag: str | None = Query(default=None, description="Filter by tag"),
    from_date: datetime | None = Query(default=None, description="Filter articles captured after this date"),
    to_date: datetime | None = Query(default=None, description="Filter articles captured before this date"),
) -> ArticleListResponse:
    """
    List articles for the authenticated user with pagination and filtering.

    - **offset**: Number of items to skip (default: 0)
    - **limit**: Number of items to return (default: 20, max: 100)
    - **source_id**: Filter by source ID
    - **category**: Filter by source category (e.g., "Tech", "Science")
    - **tag**: Filter by tag (exact match)
    - **from_date**: Filter articles captured after this date
    - **to_date**: Filter articles captured before this date

    Results are sorted by captured_at descending (newest first).
    """
    # Helper to apply filters consistently
    def apply_filters(q):
        if source_id:
            q = q.eq("source_id", source_id)
        if category:
            q = q.eq("sources.category", category)
        if tag:
            q = q.contains("tags", [tag])
        if from_date:
            q = q.gte("captured_at", from_date.isoformat())
        if to_date:
            q = q.lte("captured_at", to_date.isoformat())
        return q

    # Get total count
    count_query = apply_filters(
        db.table("articles")
        .select("id, sources!inner(category)", count="exact")
        .eq("user_id", current_user.id)
    )
    count_result = count_query.execute()
    total_count = count_result.count if count_result.count is not None else len(count_result.data)

    # Build data query with source info
    query = apply_filters(
        db.table("articles")
        .select("*, sources(name, type, category)")
        .eq("user_id", current_user.id)
    )

    # Apply pagination and ordering
    query = query.order("captured_at", desc=True).range(offset, offset + limit - 1)

    result = query.execute()

    # Transform to response format
    articles = []
    for row in result.data:
        source_data = row.get("sources") or {}
        articles.append(
            ArticleListItem(
                id=row["id"],
                title=row["title"],
                url=row.get("url"),
                excerpt=_truncate_content(row.get("content")),
                author=row.get("author"),
                published_at=row.get("published_at"),
                captured_at=row["captured_at"],
                source_id=row.get("source_id"),
                source_name=source_data.get("name"),
                source_type=source_data.get("type"),
                source_category=source_data.get("category"),
                tags=row.get("tags", []),
                metadata=row.get("metadata", {}),
            )
        )

    has_more = offset + len(articles) < total_count

    return ArticleListResponse(
        articles=articles,
        total_count=total_count,
        has_more=has_more,
        offset=offset,
        limit=limit,
    )


@router.get("/{article_id}", response_model=ArticleDetailResponse)
async def get_article(
    article_id: UUIDPath,
    current_user: CurrentUser,
    db: Annotated[Client, Depends(get_db)],
) -> ArticleDetailResponse:
    """
    Get a specific article by ID with full content.

    Returns 404 if the article doesn't exist or doesn't belong to the user.
    """
    result = (
        db.table("articles")
        .select("*, sources(name, type, category)")
        .eq("id", article_id)
        .eq("user_id", current_user.id)
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found",
        )

    row = result.data[0]
    source_data = row.get("sources") or {}

    return ArticleDetailResponse(
        id=row["id"],
        title=row["title"],
        url=row.get("url"),
        content=row.get("content"),
        author=row.get("author"),
        published_at=row.get("published_at"),
        captured_at=row["captured_at"],
        source_id=row.get("source_id"),
        source_name=source_data.get("name"),
        source_type=source_data.get("type"),
        source_category=source_data.get("category"),
        tags=row.get("tags", []),
        metadata=row.get("metadata", {}),
    )


@router.post("/capture", response_model=ArticleResponse, status_code=status.HTTP_201_CREATED)
@rate_limit_by_user(max_requests=20, window_seconds=60)  # 20 captures per minute
async def capture_article(
    request: CaptureRequest,
    current_user: CurrentUser,
    db: Annotated[Client, Depends(get_db)],
) -> ArticleResponse:
    """
    Capture an article from a URL.

    Fetches the page, extracts the content, and saves it to your library.
    If the URL has already been captured, returns the existing article.

    - **url**: The full URL of the article to capture
    """
    capture_service = ArticleCaptureService(db)

    try:
        article = await capture_service.capture_url(str(request.url), current_user.id)
        return ArticleResponse(**article)

    except ValueError as e:
        # Validation/extraction errors
        logger.warning(f"Capture failed for {request.url}: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    except Exception as e:
        # Network or other errors - log full error but return generic message
        logger.error(f"Error capturing {request.url}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to capture article. Please try again later.",
        )

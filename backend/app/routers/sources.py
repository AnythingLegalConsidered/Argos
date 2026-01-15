"""Sources CRUD API endpoints."""

import json
import logging
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from supabase import Client

from app.auth import CurrentUser
from app.database import get_db
from app.schemas.source import SourceCreate, SourceList, SourceResponse, SourceType
from app.services.reddit_fetcher import check_subreddit_exists
from app.utils.validators import UUIDPath


class SuggestedSource(BaseModel):
    """Schema for a suggested source."""

    type: str
    url: str
    name: str
    category: str


class SuggestedSourcesList(BaseModel):
    """Schema for list of suggested sources."""

    sources: list[SuggestedSource]


class AddSuggestedRequest(BaseModel):
    """Request to add suggested sources."""

    urls: list[str]

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/sources", tags=["sources"])

# Load suggested sources from JSON file
SEED_SOURCES_PATH = Path(__file__).parent.parent / "data" / "seed_sources.json"


def _load_suggested_sources() -> list[SuggestedSource]:
    """Load suggested sources from seed file."""
    try:
        with open(SEED_SOURCES_PATH) as f:
            data = json.load(f)
        return [SuggestedSource(**s) for s in data["sources"]]
    except Exception as e:
        logger.error(f"Failed to load seed sources: {e}")
        return []


@router.get("/suggested", response_model=SuggestedSourcesList)
async def get_suggested_sources(
    current_user: CurrentUser,
    db: Annotated[Client, Depends(get_db)],
) -> SuggestedSourcesList:
    """
    Get list of suggested quality sources.

    Returns curated sources that are not already in the user's library.
    """
    suggested = _load_suggested_sources()

    # Get user's existing source URLs
    existing = db.table("sources").select("url").eq("user_id", current_user.id).execute()
    existing_urls = {s["url"] for s in existing.data}

    # Filter out sources user already has
    available = [s for s in suggested if s.url not in existing_urls]

    return SuggestedSourcesList(sources=available)


@router.post("/suggested", response_model=SourceList, status_code=status.HTTP_201_CREATED)
async def add_suggested_sources(
    request: AddSuggestedRequest,
    current_user: CurrentUser,
    db: Annotated[Client, Depends(get_db)],
) -> SourceList:
    """
    Add selected suggested sources to user's library.

    - **urls**: List of URLs from suggested sources to add
    """
    suggested = _load_suggested_sources()
    suggested_map = {s.url: s for s in suggested}

    # Validate all URLs are from suggested list
    invalid = [url for url in request.urls if url not in suggested_map]
    if invalid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid source URLs: {invalid}",
        )

    # Get existing URLs to avoid duplicates
    existing = db.table("sources").select("url").eq("user_id", current_user.id).execute()
    existing_urls = {s["url"] for s in existing.data}

    # Filter out already existing
    to_add = [url for url in request.urls if url not in existing_urls]

    if not to_add:
        return SourceList(sources=[], total=0)

    # Insert new sources
    records = [
        {
            "user_id": current_user.id,
            "type": suggested_map[url].type,
            "url": url,
            "name": suggested_map[url].name,
            "category": suggested_map[url].category,
        }
        for url in to_add
    ]

    result = db.table("sources").insert(records).execute()

    sources = [SourceResponse(**s) for s in result.data]
    logger.info(f"Added {len(sources)} suggested sources for user {current_user.id}")

    return SourceList(sources=sources, total=len(sources))


@router.post("", response_model=SourceResponse, status_code=status.HTTP_201_CREATED)
async def create_source(
    source: SourceCreate,
    current_user: CurrentUser,
    db: Annotated[Client, Depends(get_db)],
) -> SourceResponse:
    """
    Create a new source for the authenticated user.

    - **type**: Source type (rss or reddit)
    - **url**: Feed URL or subreddit (e.g., /r/programming)
    - **name**: Display name for the source
    - **category**: Optional category for grouping
    """
    # Check subreddit existence for Reddit sources (fail gracefully)
    if source.type == SourceType.REDDIT:
        # Extract subreddit name from normalized URL (/r/subreddit -> subreddit)
        subreddit = source.url.lstrip("/r/")
        exists, error_msg = await check_subreddit_exists(subreddit)
        if not exists:
            logger.warning(f"Subreddit check failed for {source.url}: {error_msg}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg or f"Subreddit {source.url} does not exist or is inaccessible",
            )

    try:
        result = (
            db.table("sources")
            .insert(
                {
                    "user_id": current_user.id,
                    "type": source.type.value,
                    "url": source.url,
                    "name": source.name,
                    "category": source.category,
                }
            )
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create source",
            )

        logger.info(f"Source created: {result.data[0]['id']} for user {current_user.id}")
        return SourceResponse(**result.data[0])

    except Exception as e:
        # Handle duplicate URL constraint
        if "duplicate key" in str(e).lower() or "unique constraint" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="You already have a source with this URL",
            )
        logger.error(f"Error creating source: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create source",
        )


@router.get("", response_model=SourceList)
async def list_sources(
    current_user: CurrentUser,
    db: Annotated[Client, Depends(get_db)],
    category: str | None = Query(None, description="Filter by category"),
    source_type: str | None = Query(None, alias="type", description="Filter by type (rss/reddit)"),
    is_active: bool | None = Query(None, description="Filter by active status"),
) -> SourceList:
    """
    List all sources for the authenticated user.

    Results are sorted by created_at descending (newest first).
    RLS policies ensure users only see their own sources.
    """
    query = db.table("sources").select("*").eq("user_id", current_user.id)

    # Apply filters
    if category:
        query = query.eq("category", category)
    if source_type:
        query = query.eq("type", source_type)
    if is_active is not None:
        query = query.eq("is_active", is_active)

    # Sort by created_at desc
    query = query.order("created_at", desc=True)

    result = query.execute()

    sources = [SourceResponse(**s) for s in result.data]
    return SourceList(sources=sources, total=len(sources))


@router.get("/{source_id}", response_model=SourceResponse)
async def get_source(
    source_id: UUIDPath,
    current_user: CurrentUser,
    db: Annotated[Client, Depends(get_db)],
) -> SourceResponse:
    """Get a specific source by ID."""
    result = (
        db.table("sources")
        .select("*")
        .eq("id", source_id)
        .eq("user_id", current_user.id)
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source not found",
        )

    return SourceResponse(**result.data[0])


@router.delete("/{source_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_source(
    source_id: UUIDPath,
    current_user: CurrentUser,
    db: Annotated[Client, Depends(get_db)],
) -> None:
    """
    Delete a source by ID.

    Only the owner can delete their sources.
    Associated articles are cascade deleted (via DB constraint).
    """
    # First check if source exists and belongs to user
    check = (
        db.table("sources")
        .select("id")
        .eq("id", source_id)
        .eq("user_id", current_user.id)
        .execute()
    )

    if not check.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source not found",
        )

    # Delete the source
    db.table("sources").delete().eq("id", source_id).execute()

    logger.info(f"Source deleted: {source_id} by user {current_user.id}")


@router.patch("/{source_id}/toggle", response_model=SourceResponse)
async def toggle_source_active(
    source_id: UUIDPath,
    current_user: CurrentUser,
    db: Annotated[Client, Depends(get_db)],
) -> SourceResponse:
    """Toggle the is_active status of a source."""
    # Get current state
    current = (
        db.table("sources")
        .select("*")
        .eq("id", source_id)
        .eq("user_id", current_user.id)
        .execute()
    )

    if not current.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source not found",
        )

    # Toggle is_active
    new_active = not current.data[0]["is_active"]

    result = (
        db.table("sources")
        .update({"is_active": new_active})
        .eq("id", source_id)
        .execute()
    )

    logger.info(f"Source {source_id} is_active toggled to {new_active}")
    return SourceResponse(**result.data[0])

"""Fetch API endpoints - Manual and scheduled content fetching."""

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, BackgroundTasks
from supabase import Client

from app.auth import CurrentUser
from app.database import get_db
from app.schemas.fetch import FetchSummary
from app.services.fetch_service import FetchService
from app.utils.rate_limiter import rate_limit_by_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/fetch", tags=["fetch"])


@router.post("", response_model=FetchSummary)
@rate_limit_by_user(max_requests=5, window_seconds=300)  # 5 fetches per 5 minutes
async def trigger_fetch(
    current_user: CurrentUser,
    db: Annotated[Client, Depends(get_db)],
) -> FetchSummary:
    """
    Trigger a manual fetch of all active sources for the current user.

    Fetches RSS feeds and Reddit subreddits, saving new articles to the database.
    Returns a summary of the fetch operation including:
    - Number of sources processed
    - Number of new articles added
    - Per-source results with success/error status
    """
    fetch_service = FetchService(db)

    try:
        summary = await fetch_service.fetch_all_sources(current_user.id)
        return summary
    finally:
        await fetch_service.close()


@router.post("/background", status_code=202)
@rate_limit_by_user(max_requests=5, window_seconds=300)  # 5 fetches per 5 minutes
async def trigger_fetch_background(
    current_user: CurrentUser,
    db: Annotated[Client, Depends(get_db)],
    background_tasks: BackgroundTasks,
) -> dict:
    """
    Trigger a fetch in the background (non-blocking).

    Returns immediately with status 202 Accepted.
    The fetch runs asynchronously in the background.
    """

    async def run_fetch(user_id: str) -> None:
        fetch_service = FetchService(db)
        try:
            await fetch_service.fetch_all_sources(user_id)
        finally:
            await fetch_service.close()

    background_tasks.add_task(run_fetch, current_user.id)

    logger.info(f"Background fetch triggered for user {current_user.id}")

    return {
        "status": "accepted",
        "message": "Fetch job started in background",
    }

"""Background scheduler for periodic fetch jobs.

Uses APScheduler to run fetch jobs on a configurable interval.
Default: every hour for all active users.
"""

import asyncio
import logging
from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.database import get_supabase_client
from app.services.fetch_service import FetchService

logger = logging.getLogger(__name__)

# Default fetch interval in minutes (1 hour)
FETCH_INTERVAL_MINUTES = 60

# Global scheduler instance
_scheduler: AsyncIOScheduler | None = None


async def fetch_all_users_sources() -> None:
    """
    Fetch all sources for all active users.

    This is the main scheduled job that runs periodically.
    """
    logger.info("Starting scheduled fetch job for all users")

    db = get_supabase_client()

    try:
        # Get all distinct user_ids with active sources
        result = (
            db.table("sources")
            .select("user_id")
            .eq("is_active", True)
            .execute()
        )

        if not result.data:
            logger.info("No active sources found, skipping fetch")
            return

        # Get unique user IDs
        user_ids = list(set(row["user_id"] for row in result.data))
        logger.info(f"Found {len(user_ids)} users with active sources")

        # Fetch for each user
        total_articles = 0
        total_errors = 0

        for user_id in user_ids:
            fetch_service = FetchService(db)
            try:
                summary = await fetch_service.fetch_all_sources(user_id)
                total_articles += summary.total_articles_added
                total_errors += summary.sources_failed
            except Exception as e:
                logger.error(f"Error fetching for user {user_id}: {e}")
                total_errors += 1
            finally:
                await fetch_service.close()

        logger.info(
            f"Scheduled fetch completed: {len(user_ids)} users, "
            f"{total_articles} articles added, {total_errors} errors"
        )

    except Exception as e:
        logger.error(f"Scheduled fetch job failed: {e}")


def get_scheduler() -> AsyncIOScheduler:
    """Get or create the global scheduler instance."""
    global _scheduler
    if _scheduler is None:
        _scheduler = AsyncIOScheduler()
    return _scheduler


def start_scheduler(interval_minutes: int = FETCH_INTERVAL_MINUTES) -> None:
    """
    Start the background scheduler.

    Args:
        interval_minutes: How often to run the fetch job (default: 60 minutes)
    """
    scheduler = get_scheduler()

    if scheduler.running:
        logger.warning("Scheduler already running")
        return

    # Add the periodic fetch job
    scheduler.add_job(
        fetch_all_users_sources,
        trigger=IntervalTrigger(minutes=interval_minutes),
        id="fetch_all_sources",
        name="Fetch all sources for all users",
        replace_existing=True,
    )

    scheduler.start()
    logger.info(f"Scheduler started - fetch job runs every {interval_minutes} minutes")


def stop_scheduler() -> None:
    """Stop the background scheduler gracefully."""
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped")
    _scheduler = None


@asynccontextmanager
async def lifespan_scheduler(interval_minutes: int = FETCH_INTERVAL_MINUTES):
    """
    Context manager for scheduler lifecycle.

    Usage with FastAPI lifespan:
        @asynccontextmanager
        async def lifespan(app: FastAPI):
            async with lifespan_scheduler():
                yield
    """
    start_scheduler(interval_minutes)
    try:
        yield
    finally:
        stop_scheduler()

"""Fetch Service - Orchestrates RSS and Reddit fetchers.

Provides a unified interface for fetching content from all sources.
"""

import logging
import time

from supabase import Client

from app.schemas.fetch import FetchResult, FetchSummary
from app.services.rss_fetcher import RSSFetcher
from app.services.reddit_fetcher import RedditFetcher

logger = logging.getLogger(__name__)


class FetchService:
    """Orchestrates content fetching from all source types."""

    def __init__(self, db: Client):
        self.db = db
        self.rss_fetcher = RSSFetcher(db)
        self.reddit_fetcher = RedditFetcher(db)

    async def close(self) -> None:
        """Clean up resources."""
        await self.reddit_fetcher.close()

    async def fetch_source(self, source: dict) -> FetchResult:
        """
        Fetch a single source, routing to the appropriate fetcher.

        Args:
            source: Source dict with type, url, id, user_id, etc.

        Returns:
            FetchResult with articles_added count and status
        """
        source_id = source["id"]
        source_name = source["name"]
        source_type = source["type"]

        logger.info(f"Fetching source: {source_name} ({source_type})")

        try:
            if source_type == "rss":
                articles = await self.rss_fetcher.fetch_source(source)
            elif source_type == "reddit":
                articles = await self.reddit_fetcher.fetch_source(source)
            else:
                logger.warning(f"Unknown source type: {source_type}")
                return FetchResult(
                    source_id=source_id,
                    source_name=source_name,
                    source_type=source_type,
                    articles_added=0,
                    success=False,
                    error=f"Unknown source type: {source_type}",
                )

            return FetchResult(
                source_id=source_id,
                source_name=source_name,
                source_type=source_type,
                articles_added=len(articles),
                success=True,
            )

        except Exception as e:
            logger.error(f"Error fetching source {source_name}: {e}")
            return FetchResult(
                source_id=source_id,
                source_name=source_name,
                source_type=source_type,
                articles_added=0,
                success=False,
                error=str(e),
            )

    async def fetch_all_sources(self, user_id: str) -> FetchSummary:
        """
        Fetch all active sources for a user.

        Args:
            user_id: UUID of the user

        Returns:
            FetchSummary with aggregated results
        """
        start_time = time.time()

        logger.info(f"Starting fetch job for user {user_id}")

        # Get all active sources for user
        sources_result = (
            self.db.table("sources")
            .select("*")
            .eq("user_id", user_id)
            .eq("is_active", True)
            .execute()
        )

        sources = sources_result.data or []
        total_sources = len(sources)

        if not sources:
            logger.info("No active sources to fetch")
            return FetchSummary(
                total_sources=0,
                sources_processed=0,
                sources_failed=0,
                total_articles_added=0,
                duration_seconds=0.0,
                results=[],
            )

        # Fetch each source
        results: list[FetchResult] = []
        for source in sources:
            result = await self.fetch_source(source)
            results.append(result)

        # Calculate summary
        sources_processed = sum(1 for r in results if r.success)
        sources_failed = sum(1 for r in results if not r.success)
        total_articles = sum(r.articles_added for r in results)
        duration = time.time() - start_time

        summary = FetchSummary(
            total_sources=total_sources,
            sources_processed=sources_processed,
            sources_failed=sources_failed,
            total_articles_added=total_articles,
            duration_seconds=round(duration, 2),
            results=results,
        )

        logger.info(
            f"Fetch job completed: {sources_processed}/{total_sources} sources, "
            f"{total_articles} articles added in {duration:.2f}s"
        )

        return summary

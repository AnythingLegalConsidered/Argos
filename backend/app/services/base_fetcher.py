"""Base fetcher class with shared methods for RSS and Reddit fetchers."""

import logging
from abc import ABC, abstractmethod
from datetime import datetime, timezone

from supabase import Client

logger = logging.getLogger(__name__)


class BaseFetcher(ABC):
    """
    Abstract base class for content fetchers.

    Provides common functionality for saving articles and updating sources.
    """

    def __init__(self, db: Client):
        self.db = db

    @abstractmethod
    async def fetch_source(self, source: dict) -> list[dict]:
        """
        Fetch articles from a source.

        Args:
            source: Source dict with id, url, user_id, category

        Returns:
            List of newly created articles
        """
        pass

    async def save_article(self, article_data: dict) -> dict | None:
        """
        Save article to database, handling duplicates.

        Returns the article dict if created, None if duplicate.
        """
        try:
            # Check for duplicate by URL
            if article_data.get("url"):
                existing = (
                    self.db.table("articles")
                    .select("id")
                    .eq("user_id", article_data["user_id"])
                    .eq("url", article_data["url"])
                    .execute()
                )
                if existing.data:
                    # Article already exists
                    return None

            # Insert new article
            result = self.db.table("articles").insert(article_data).execute()

            if result.data:
                return result.data[0]
            return None

        except Exception as e:
            # Handle race condition duplicates
            error_str = str(e).lower()
            if "duplicate key" in error_str or "unique constraint" in error_str:
                logger.debug(f"Duplicate article skipped: {article_data.get('url')}")
                return None
            logger.error(f"Error saving article: {e}")
            return None

    async def update_source_last_fetched(self, source_id: str) -> None:
        """Update the last_fetched_at timestamp on the source."""
        try:
            self.db.table("sources").update(
                {"last_fetched_at": datetime.now(timezone.utc).isoformat()}
            ).eq("id", source_id).execute()
        except Exception as e:
            logger.error(f"Error updating source last_fetched_at: {e}")

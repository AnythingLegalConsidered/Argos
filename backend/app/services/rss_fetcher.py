"""RSS Feed Fetcher Service.

Fetches and parses RSS feeds, saving articles to the database.
"""

import logging
import re
from datetime import datetime, timezone
from time import mktime
from typing import Any

import feedparser

from app.services.base_fetcher import BaseFetcher

logger = logging.getLogger(__name__)


class RSSFetcher(BaseFetcher):
    """Service for fetching and parsing RSS feeds."""

    async def fetch_source(self, source: dict) -> list[dict]:
        """
        Fetch articles from an RSS source.

        Args:
            source: Source dict with id, url, user_id, category

        Returns:
            List of newly created articles
        """
        source_id = source["id"]
        source_url = source["url"]
        user_id = source["user_id"]
        category = source.get("category")

        logger.info(f"Fetching RSS feed: {source_url}")

        try:
            # Parse the RSS feed
            feed = feedparser.parse(source_url)

            if feed.bozo and not feed.entries:
                # Feed parsing failed completely
                logger.error(
                    f"Failed to parse feed {source_url}: {feed.bozo_exception}"
                )
                return []

            # Process entries
            new_articles = []
            for entry in feed.entries:
                article_data = self._parse_entry(entry, source_id, user_id, category)
                if article_data:
                    result = await self.save_article(article_data)
                    if result:
                        new_articles.append(result)

            # Update last_fetched_at on source
            await self.update_source_last_fetched(source_id)

            logger.info(
                f"Fetched {len(new_articles)} new articles from {source_url} "
                f"(total entries: {len(feed.entries)})"
            )
            return new_articles

        except Exception as e:
            logger.error(f"Error fetching RSS feed {source_url}: {e}")
            return []

    def _parse_entry(
        self,
        entry: Any,
        source_id: str,
        user_id: str,
        category: str | None,
    ) -> dict | None:
        """
        Parse a feedparser entry into an article dict.

        Returns None if entry is invalid (missing required fields).
        """
        # Title is required
        title = getattr(entry, "title", None)
        if not title:
            return None

        # URL (link) - important for deduplication
        url = getattr(entry, "link", None)

        # Content: try summary first, then content array
        content = self._extract_content(entry)

        # Author
        author = getattr(entry, "author", None)

        # Published date
        published_at = self._parse_published_date(entry)

        # Auto-tags based on category
        tags = []
        if category:
            tags.append(category.lower())

        return {
            "source_id": source_id,
            "user_id": user_id,
            "title": self._clean_text(title),
            "content": self._clean_text(content) if content else None,
            "url": url,
            "author": author,
            "published_at": published_at.isoformat() if published_at else None,
            "metadata": {},
            "tags": tags,
        }

    def _extract_content(self, entry: Any) -> str | None:
        """Extract content from entry, preferring full content over summary."""
        # Try content array first (full content)
        if hasattr(entry, "content") and entry.content:
            for content_item in entry.content:
                if hasattr(content_item, "value") and content_item.value:
                    return self._strip_html(content_item.value)

        # Fallback to summary
        if hasattr(entry, "summary") and entry.summary:
            return self._strip_html(entry.summary)

        # Try description as last resort
        if hasattr(entry, "description") and entry.description:
            return self._strip_html(entry.description)

        return None

    def _parse_published_date(self, entry: Any) -> datetime | None:
        """Parse published date from various feedparser formats."""
        # Try published_parsed (struct_time)
        if hasattr(entry, "published_parsed") and entry.published_parsed:
            try:
                return datetime.fromtimestamp(
                    mktime(entry.published_parsed), tz=timezone.utc
                )
            except (ValueError, OverflowError):
                pass

        # Try updated_parsed
        if hasattr(entry, "updated_parsed") and entry.updated_parsed:
            try:
                return datetime.fromtimestamp(
                    mktime(entry.updated_parsed), tz=timezone.utc
                )
            except (ValueError, OverflowError):
                pass

        return None

    def _strip_html(self, text: str) -> str:
        """Remove HTML tags from text."""
        if not text:
            return text
        # Simple HTML tag removal
        clean = re.sub(r"<[^>]+>", "", text)
        # Decode common HTML entities
        clean = clean.replace("&nbsp;", " ")
        clean = clean.replace("&amp;", "&")
        clean = clean.replace("&lt;", "<")
        clean = clean.replace("&gt;", ">")
        clean = clean.replace("&quot;", '"')
        clean = clean.replace("&#39;", "'")
        # Normalize whitespace
        clean = re.sub(r"\s+", " ", clean).strip()
        return clean

    def _clean_text(self, text: str | None) -> str | None:
        """Clean and normalize text."""
        if not text:
            return None
        # Truncate very long content (safety measure)
        max_length = 50000
        if len(text) > max_length:
            text = text[:max_length] + "..."
        return text.strip()

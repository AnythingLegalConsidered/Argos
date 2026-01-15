"""RSS Feed Fetcher Service.

Fetches and parses RSS feeds, saving articles to the database.
"""

import html
import logging
import re
from datetime import datetime, timezone
from time import mktime
from typing import Any

import feedparser
import httpx

from app.services.base_fetcher import BaseFetcher

logger = logging.getLogger(__name__)

# Timeout for HTTP requests (seconds)
FETCH_TIMEOUT = 30.0

# Max entries to process per feed (prevent OOM on malformed feeds)
MAX_ENTRIES = 100


class RSSFetcher(BaseFetcher):
    """Service for fetching and parsing RSS feeds."""

    def __init__(self, db):
        super().__init__(db)
        self._http_client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client with timeout."""
        if self._http_client is None or self._http_client.is_closed:
            self._http_client = httpx.AsyncClient(
                timeout=FETCH_TIMEOUT,
                follow_redirects=True,
            )
        return self._http_client

    async def close(self) -> None:
        """Close HTTP client."""
        if self._http_client and not self._http_client.is_closed:
            await self._http_client.aclose()

    async def fetch_source(self, source: dict) -> list[dict]:
        """
        Fetch articles from an RSS source.

        Uses httpx for async HTTP fetching, then feedparser for XML parsing.
        This prevents blocking the event loop during I/O.

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
            # Fetch feed content asynchronously (non-blocking)
            client = await self._get_client()
            response = await client.get(source_url)
            response.raise_for_status()
            feed_content = response.text

            # Parse the fetched content (CPU-bound, fast)
            feed = feedparser.parse(feed_content)

            if feed.bozo and not feed.entries:
                # Feed parsing failed completely
                logger.error(
                    f"Failed to parse feed {source_url}: {feed.bozo_exception}"
                )
                return []

            # Process entries (limited to prevent OOM)
            new_articles = []
            entries_to_process = feed.entries[:MAX_ENTRIES]

            for entry in entries_to_process:
                article_data = self._parse_entry(entry, source_id, user_id, category)
                if article_data:
                    result = await self.save_article(article_data)
                    if result:
                        new_articles.append(result)

            # Update last_fetched_at on source
            await self.update_source_last_fetched(source_id)

            logger.info(
                f"Fetched {len(new_articles)} new articles from {source_url} "
                f"(processed {len(entries_to_process)}/{len(feed.entries)} entries)"
            )
            return new_articles

        except httpx.TimeoutException:
            logger.warning(f"Timeout fetching RSS feed {source_url}")
            return []
        except httpx.HTTPStatusError as e:
            logger.warning(f"HTTP error {e.response.status_code} fetching {source_url}")
            return []
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
        """Remove HTML tags and decode entities from text."""
        if not text:
            return text
        # Remove HTML tags
        clean = re.sub(r"<[^>]+>", "", text)
        # Decode ALL HTML entities (handles &nbsp;, &amp;, &#8217;, etc.)
        clean = html.unescape(clean)
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

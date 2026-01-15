"""Article Capture Service.

Captures and extracts content from arbitrary URLs for manual saving.
"""

import json
import logging
import re
from datetime import datetime, timezone
from urllib.parse import urlparse

import httpx
import trafilatura
from supabase import Client

from app.utils.url_validator import validate_url_for_ssrf

logger = logging.getLogger(__name__)

# User-Agent for web requests
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)


class ArticleCaptureService:
    """Service for capturing articles from arbitrary URLs."""

    def __init__(self, db: Client):
        self.db = db

    async def capture_url(self, url: str, user_id: str) -> dict:
        """
        Capture and save an article from a URL.

        Args:
            url: The URL to capture
            user_id: The user's ID

        Returns:
            The created article dict

        Raises:
            ValueError: If URL is invalid or content cannot be extracted
            Exception: For other errors (network, etc.)
        """
        # SSRF protection: validate URL before fetching
        is_safe, error_msg = validate_url_for_ssrf(url)
        if not is_safe:
            logger.warning(f"SSRF blocked for user {user_id}: {url} - {error_msg}")
            raise ValueError(f"URL not allowed: {error_msg}")

        logger.info(f"Capturing article from: {url}")

        # Check for duplicate
        existing = await self._check_duplicate(url, user_id)
        if existing:
            logger.info(f"Article already exists: {existing['id']}")
            return existing

        # Fetch the page
        html = await self._fetch_url(url)

        # Extract content
        extracted = self._extract_content(html, url)

        if not extracted.get("title"):
            raise ValueError("Could not extract title from page")

        # Build article data
        article_data = self._build_article_data(extracted, url, user_id)

        # Save to database
        result = self.db.table("articles").insert(article_data).execute()

        if not result.data:
            raise Exception("Failed to save article")

        logger.info(f"Article captured: {result.data[0]['id']}")
        return result.data[0]

    async def _fetch_url(self, url: str) -> str:
        """Fetch HTML content from URL."""
        async with httpx.AsyncClient(
            headers={"User-Agent": USER_AGENT},
            timeout=30.0,
            follow_redirects=True,
        ) as client:
            response = await client.get(url)

            if response.status_code == 403:
                raise ValueError("Access denied (403). Site may block automated access.")
            if response.status_code == 404:
                raise ValueError("Page not found (404)")

            response.raise_for_status()
            return response.text

    def _extract_content(self, html: str, url: str) -> dict:
        """
        Extract article content using trafilatura.

        Returns dict with title, content, author, date.
        """
        # Try trafilatura with JSON output for metadata
        result = trafilatura.extract(
            html,
            output_format="json",
            include_comments=False,
            include_tables=True,
            favor_precision=True,
            url=url,
        )

        if result:
            try:
                data = json.loads(result)
                return {
                    "title": data.get("title"),
                    "content": data.get("text"),
                    "author": data.get("author"),
                    "date": data.get("date"),
                    "sitename": data.get("sitename"),
                }
            except json.JSONDecodeError:
                pass

        # Fallback: try basic text extraction
        text = trafilatura.extract(html, include_comments=False)

        # Try to get title from HTML
        title = self._extract_title_fallback(html)

        return {
            "title": title,
            "content": text,
            "author": None,
            "date": None,
            "sitename": None,
        }

    def _extract_title_fallback(self, html: str) -> str | None:
        """Extract title from HTML as fallback."""
        # Try <title> tag
        match = re.search(r"<title[^>]*>([^<]+)</title>", html, re.IGNORECASE)
        if match:
            title = match.group(1).strip()
            # Clean common suffixes
            title = re.sub(r"\s*[|\-–—]\s*[^|\-–—]+$", "", title)
            return title

        # Try <h1> tag
        match = re.search(r"<h1[^>]*>([^<]+)</h1>", html, re.IGNORECASE)
        if match:
            return match.group(1).strip()

        return None

    def _build_article_data(self, extracted: dict, url: str, user_id: str) -> dict:
        """Build article data dict for database insertion."""
        # Parse domain for tagging
        parsed_url = urlparse(url)
        domain = parsed_url.netloc.lower()
        # Remove www. prefix
        if domain.startswith("www."):
            domain = domain[4:]

        # Auto-tags
        tags = ["manual", domain]

        # Parse date if available
        published_at = None
        if extracted.get("date"):
            try:
                # trafilatura returns dates in various formats
                date_str = extracted["date"]
                # Try ISO format first
                if "T" in date_str:
                    published_at = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                else:
                    # Try simple date format
                    published_at = datetime.strptime(date_str, "%Y-%m-%d").replace(
                        tzinfo=timezone.utc
                    )
            except (ValueError, TypeError):
                pass

        return {
            "source_id": None,  # Manual capture has no source
            "user_id": user_id,
            "title": extracted["title"],
            "content": extracted.get("content"),
            "url": url,
            "author": extracted.get("author"),
            "published_at": published_at.isoformat() if published_at else None,
            "metadata": {
                "manual_capture": True,
                "sitename": extracted.get("sitename"),
                "domain": domain,
            },
            "tags": tags,
        }

    async def _check_duplicate(self, url: str, user_id: str) -> dict | None:
        """Check if URL has already been captured by user."""
        result = (
            self.db.table("articles")
            .select("*")
            .eq("user_id", user_id)
            .eq("url", url)
            .execute()
        )

        if result.data:
            return result.data[0]
        return None

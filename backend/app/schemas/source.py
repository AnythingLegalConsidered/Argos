"""Pydantic schemas for Source CRUD operations."""

import re
from datetime import datetime
from enum import Enum
from typing import Annotated

from pydantic import BaseModel, Field, field_validator, HttpUrl


class SourceType(str, Enum):
    """Supported source types."""

    RSS = "rss"
    REDDIT = "reddit"


class SourceCreate(BaseModel):
    """Schema for creating a new source."""

    type: SourceType
    url: str = Field(..., min_length=1, max_length=2048)
    name: str = Field(..., min_length=1, max_length=255)
    category: str | None = Field(None, max_length=100)

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str, info) -> str:
        """Validate and normalize URL based on source type."""
        v = v.strip()

        # Get type from values if available
        source_type = info.data.get("type")

        if source_type == SourceType.REDDIT:
            return cls._normalize_reddit_url(v)
        else:
            return cls._validate_rss_url(v)

    @staticmethod
    def _normalize_reddit_url(url: str) -> str:
        """
        Normalize Reddit subreddit URL.

        Accepts: r/programming, /r/programming, programming
        Returns: /r/programming
        """
        # Remove common prefixes
        url = url.lower().strip()

        # Handle full Reddit URLs
        reddit_pattern = r"(?:https?://)?(?:www\.)?reddit\.com(/r/\w+)"
        match = re.match(reddit_pattern, url)
        if match:
            return match.group(1)

        # Handle /r/subreddit or r/subreddit
        if url.startswith("/r/"):
            subreddit = url[3:]
        elif url.startswith("r/"):
            subreddit = url[2:]
        else:
            subreddit = url

        # Validate subreddit name (alphanumeric + underscore, 3-21 chars)
        if not re.match(r"^[a-zA-Z0-9_]{2,21}$", subreddit):
            raise ValueError(
                f"Invalid subreddit name: {subreddit}. "
                "Must be 2-21 alphanumeric characters or underscores."
            )

        return f"/r/{subreddit}"

    @staticmethod
    def _validate_rss_url(url: str) -> str:
        """Validate RSS feed URL format."""
        # Basic URL validation
        if not url.startswith(("http://", "https://")):
            raise ValueError("RSS URL must start with http:// or https://")

        # Could add more validation here (check if valid RSS)
        return url


class SourceResponse(BaseModel):
    """Schema for source response."""

    id: str
    user_id: str
    type: SourceType
    url: str
    name: str
    category: str | None
    created_at: datetime
    last_fetched_at: datetime | None
    is_active: bool

    class Config:
        from_attributes = True


class SourceList(BaseModel):
    """Schema for list of sources response."""

    sources: list[SourceResponse]
    total: int

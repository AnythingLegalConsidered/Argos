"""Pydantic schemas for Fetch operations."""

from pydantic import BaseModel


class FetchResult(BaseModel):
    """Result of fetching a single source."""

    source_id: str
    source_name: str
    source_type: str
    articles_added: int
    success: bool
    error: str | None = None


class FetchSummary(BaseModel):
    """Summary of a fetch job."""

    total_sources: int
    sources_processed: int
    sources_failed: int
    total_articles_added: int
    duration_seconds: float
    results: list[FetchResult]

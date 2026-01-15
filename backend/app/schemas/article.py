"""Pydantic schemas for Article operations."""

from datetime import datetime

from pydantic import BaseModel, Field, HttpUrl


class ArticleBase(BaseModel):
    """Base article fields."""

    title: str = Field(..., min_length=1, max_length=500)
    content: str | None = None
    url: str | None = Field(None, max_length=2048)
    author: str | None = Field(None, max_length=255)
    published_at: datetime | None = None


class ArticleCreate(ArticleBase):
    """Schema for creating a new article (internal use)."""

    source_id: str | None = None
    user_id: str
    metadata: dict = Field(default_factory=dict)
    tags: list[str] = Field(default_factory=list)


class ArticleResponse(BaseModel):
    """Schema for article response (full content)."""

    id: str
    source_id: str | None
    user_id: str
    title: str
    content: str | None
    url: str | None
    author: str | None
    published_at: datetime | None
    captured_at: datetime
    metadata: dict
    tags: list[str]

    class Config:
        from_attributes = True


class ArticleListItem(BaseModel):
    """Schema for article in list view (truncated content)."""

    id: str
    title: str
    url: str | None
    excerpt: str | None = None
    author: str | None
    published_at: datetime | None
    captured_at: datetime
    source_id: str | None
    source_name: str | None = None
    source_type: str | None = None
    source_category: str | None = None
    tags: list[str]
    metadata: dict

    class Config:
        from_attributes = True


class ArticleListResponse(BaseModel):
    """Schema for paginated article list with metadata."""

    articles: list[ArticleListItem]
    total_count: int
    has_more: bool
    offset: int
    limit: int


class ArticleDetailResponse(BaseModel):
    """Schema for full article detail with source info."""

    id: str
    title: str
    url: str | None
    content: str | None
    author: str | None
    published_at: datetime | None
    captured_at: datetime
    source_id: str | None
    source_name: str | None = None
    source_type: str | None = None
    source_category: str | None = None
    tags: list[str]
    metadata: dict

    class Config:
        from_attributes = True


class CaptureRequest(BaseModel):
    """Schema for manual article capture request."""

    url: HttpUrl


class SearchResultItem(BaseModel):
    """Schema for a single search result with highlighting."""

    id: str
    title: str
    url: str | None
    author: str | None
    published_at: datetime | None
    captured_at: datetime
    source_id: str | None
    source_name: str | None = None
    source_type: str | None = None
    tags: list[str]
    rank: float
    headline: str  # Highlighted snippet with <mark> tags

    class Config:
        from_attributes = True


class SearchResponse(BaseModel):
    """Schema for search results with pagination."""

    results: list[SearchResultItem]
    query: str
    total_count: int
    has_more: bool
    offset: int
    limit: int

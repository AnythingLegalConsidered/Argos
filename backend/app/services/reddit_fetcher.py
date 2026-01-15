"""Reddit Fetcher Service.

Fetches posts and top comments from subreddits using Reddit JSON API.
"""

import asyncio
import logging
import re
from datetime import datetime, timezone

import httpx
from supabase import Client

from .base_fetcher import BaseFetcher

logger = logging.getLogger(__name__)

# Reddit requires a proper User-Agent
USER_AGENT = "Argos/1.0 (Veille Platform; https://github.com/argos)"

# Rate limiting: 1 request per second minimum
REQUEST_DELAY = 1.0

# Limits
MAX_POSTS = 25
MAX_COMMENTS = 5


class RedditFetcher(BaseFetcher):
    """Service for fetching posts and comments from Reddit subreddits."""

    def __init__(self, db: Client):
        super().__init__(db)
        self._http_client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._http_client is None or self._http_client.is_closed:
            self._http_client = httpx.AsyncClient(
                headers={"User-Agent": USER_AGENT},
                timeout=30.0,
                follow_redirects=True,
            )
        return self._http_client

    async def close(self) -> None:
        """Close HTTP client."""
        if self._http_client and not self._http_client.is_closed:
            await self._http_client.aclose()

    async def fetch_source(self, source: dict) -> list[dict]:
        """
        Fetch posts from a Reddit subreddit source.

        Args:
            source: Source dict with id, url, user_id, category

        Returns:
            List of newly created articles
        """
        source_id = source["id"]
        source_url = source["url"]  # Format: /r/subreddit
        user_id = source["user_id"]
        category = source.get("category")

        # Extract subreddit name from URL
        subreddit = self._parse_subreddit(source_url)
        if not subreddit:
            logger.error(f"Invalid subreddit URL: {source_url}")
            return []

        logger.info(f"Fetching Reddit posts from r/{subreddit}")

        try:
            # Fetch posts
            posts = await self._fetch_posts(subreddit)
            if not posts:
                return []

            # Process each post
            new_articles = []
            for post in posts:
                article_data = await self._process_post(
                    post, subreddit, source_id, user_id, category
                )
                if article_data:
                    result = await self.save_article(article_data)
                    if result:
                        new_articles.append(result)

                # Rate limiting between posts (for comment fetching)
                await asyncio.sleep(REQUEST_DELAY)

            # Update last_fetched_at on source
            await self.update_source_last_fetched(source_id)

            logger.info(
                f"Fetched {len(new_articles)} new articles from r/{subreddit} "
                f"(total posts: {len(posts)})"
            )
            return new_articles

        except Exception as e:
            logger.error(f"Error fetching Reddit r/{subreddit}: {e}")
            return []

    def _parse_subreddit(self, url: str) -> str | None:
        """
        Extract subreddit name from normalized URL format /r/subreddit.

        Note: Input should already be normalized by SourceCreate schema validation.
        This method handles the normalized format (/r/subreddit) and extracts
        just the subreddit name for API calls.
        """
        # Handle normalized format /r/subreddit (from schema validation)
        # Also handles r/subreddit for backwards compatibility
        match = re.match(r"^/?r/([a-zA-Z0-9_]{3,21})$", url.strip().lower())
        if match:
            return match.group(1)
        return None

    async def _fetch_posts(self, subreddit: str) -> list[dict]:
        """Fetch hot posts from a subreddit."""
        client = await self._get_client()
        url = f"https://www.reddit.com/r/{subreddit}/hot.json?limit={MAX_POSTS}"

        try:
            response = await client.get(url)

            if response.status_code == 403:
                logger.warning(f"r/{subreddit} is private or quarantined")
                return []
            if response.status_code == 404:
                logger.warning(f"r/{subreddit} not found (deleted/banned)")
                return []
            if response.status_code == 429:
                logger.warning("Reddit rate limit hit, backing off")
                await asyncio.sleep(60)
                return []

            response.raise_for_status()
            data = response.json()

            # Extract posts from Reddit API response
            posts = []
            for child in data.get("data", {}).get("children", []):
                if child.get("kind") == "t3":  # t3 = link/post
                    posts.append(child.get("data", {}))

            return posts

        except httpx.HTTPError as e:
            logger.error(f"HTTP error fetching r/{subreddit}: {e}")
            return []

    async def _fetch_comments(self, subreddit: str, post_id: str) -> list[dict]:
        """Fetch top comments for a post."""
        client = await self._get_client()
        url = f"https://www.reddit.com/r/{subreddit}/comments/{post_id}.json?limit={MAX_COMMENTS}&sort=top"

        try:
            response = await client.get(url)
            if response.status_code != 200:
                return []

            data = response.json()

            # Comments are in the second element of the response array
            if len(data) < 2:
                return []

            comments = []
            for child in data[1].get("data", {}).get("children", []):
                if child.get("kind") == "t1":  # t1 = comment
                    comment_data = child.get("data", {})
                    if comment_data.get("body") and comment_data.get("author"):
                        comments.append({
                            "body": comment_data.get("body", ""),
                            "author": comment_data.get("author", "[deleted]"),
                            "score": comment_data.get("score", 0),
                        })

            # Return top comments sorted by score
            return sorted(comments, key=lambda x: x["score"], reverse=True)[:MAX_COMMENTS]

        except Exception as e:
            logger.debug(f"Error fetching comments for post {post_id}: {e}")
            return []

    async def _process_post(
        self,
        post: dict,
        subreddit: str,
        source_id: str,
        user_id: str,
        category: str | None,
    ) -> dict | None:
        """Process a Reddit post into an article dict."""
        # Skip stickied posts (usually mod announcements)
        if post.get("stickied"):
            return None

        title = post.get("title")
        if not title:
            return None

        post_id = post.get("id")
        permalink = post.get("permalink", "")
        selftext = post.get("selftext", "")
        author = post.get("author", "[deleted]")
        score = post.get("score", 0)
        num_comments = post.get("num_comments", 0)
        created_utc = post.get("created_utc")
        is_self = post.get("is_self", False)

        # Full URL for the post
        url = f"https://reddit.com{permalink}" if permalink else None

        # Fetch top comments
        comments = []
        if post_id and num_comments > 0:
            comments = await self._fetch_comments(subreddit, post_id)

        # Build content
        content = self._build_content(selftext, comments)

        # Parse published date
        published_at = None
        if created_utc:
            try:
                published_at = datetime.fromtimestamp(created_utc, tz=timezone.utc)
            except (ValueError, OSError):
                pass

        # Auto-tags
        tags = [f"r/{subreddit}"]
        if category:
            tags.append(category.lower())

        # Reddit-specific metadata
        metadata = {
            "reddit": {
                "score": score,
                "num_comments": num_comments,
                "author": author,
                "permalink": permalink,
                "subreddit": subreddit,
                "is_self": is_self,
                "post_id": post_id,
            }
        }

        return {
            "source_id": source_id,
            "user_id": user_id,
            "title": title,
            "content": content,
            "url": url,
            "author": f"u/{author}",
            "published_at": published_at.isoformat() if published_at else None,
            "metadata": metadata,
            "tags": tags,
        }

    def _build_content(self, selftext: str, comments: list[dict]) -> str:
        """Build article content from selftext and comments."""
        parts = []

        # Add selftext if present
        if selftext and selftext.strip():
            parts.append(selftext.strip())

        # Add top comments
        if comments:
            if parts:
                parts.append("\n\n---\n")
            parts.append("**Top Comments:**\n")

            for comment in comments:
                body = comment["body"]
                # Truncate very long comments
                if len(body) > 500:
                    body = body[:500] + "..."
                author = comment["author"]
                score = comment["score"]
                parts.append(f"\n> {body}\n> — u/{author} ({score} points)\n")

        return "".join(parts) if parts else ""

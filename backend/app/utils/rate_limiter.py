"""Simple in-memory rate limiter for API endpoints."""

import time
import logging
from collections import defaultdict
from functools import wraps
from typing import Callable

from fastapi import HTTPException, Request, status

logger = logging.getLogger(__name__)


class RateLimiter:
    """
    Simple token bucket rate limiter.

    Thread-safe for async usage with in-memory storage.
    For production with multiple workers, use Redis instead.
    """

    def __init__(self):
        # {key: [(timestamp, tokens_used), ...]}
        self._requests: dict[str, list[tuple[float, int]]] = defaultdict(list)

    def _cleanup_old_requests(self, key: str, window_seconds: float) -> None:
        """Remove requests older than the window."""
        now = time.time()
        cutoff = now - window_seconds
        self._requests[key] = [
            (ts, tokens) for ts, tokens in self._requests[key] if ts > cutoff
        ]

    def is_allowed(
        self,
        key: str,
        max_requests: int,
        window_seconds: float,
        tokens: int = 1,
    ) -> tuple[bool, int]:
        """
        Check if a request is allowed under the rate limit.

        Args:
            key: Unique identifier (user_id, IP, etc.)
            max_requests: Maximum requests allowed in window
            window_seconds: Time window in seconds
            tokens: Number of tokens this request costs (default 1)

        Returns:
            Tuple of (is_allowed, remaining_requests)
        """
        self._cleanup_old_requests(key, window_seconds)

        current_usage = sum(t for _, t in self._requests[key])
        remaining = max(0, max_requests - current_usage)

        if current_usage + tokens > max_requests:
            return False, remaining

        self._requests[key].append((time.time(), tokens))
        return True, remaining - tokens

    def reset(self, key: str) -> None:
        """Reset rate limit for a key."""
        if key in self._requests:
            del self._requests[key]


# Global rate limiter instance
_rate_limiter = RateLimiter()


def get_rate_limiter() -> RateLimiter:
    """Get the global rate limiter instance."""
    return _rate_limiter


def rate_limit(
    max_requests: int = 60,
    window_seconds: float = 60.0,
    key_func: Callable[[Request], str] | None = None,
    tokens: int = 1,
):
    """
    Rate limiting decorator for FastAPI endpoints.

    Args:
        max_requests: Maximum requests per window (default: 60)
        window_seconds: Window duration in seconds (default: 60)
        key_func: Function to extract rate limit key from request (default: client IP)
        tokens: Cost of this endpoint in tokens (default: 1)

    Usage:
        @router.post("/expensive-operation")
        @rate_limit(max_requests=10, window_seconds=60)
        async def expensive_operation(request: Request):
            ...
    """

    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Find Request object in args or kwargs
            request = kwargs.get("request")
            if request is None:
                for arg in args:
                    if isinstance(arg, Request):
                        request = arg
                        break

            if request is None:
                # No request object, skip rate limiting
                logger.warning(f"Rate limit skipped for {func.__name__}: no Request object")
                return await func(*args, **kwargs)

            # Extract rate limit key
            if key_func:
                rate_key = key_func(request)
            else:
                # Default: use client IP
                client_ip = request.client.host if request.client else "unknown"
                rate_key = f"ip:{client_ip}:{func.__name__}"

            limiter = get_rate_limiter()
            allowed, remaining = limiter.is_allowed(
                rate_key, max_requests, window_seconds, tokens
            )

            if not allowed:
                logger.warning(f"Rate limit exceeded for {rate_key}")
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Rate limit exceeded. Please try again later.",
                    headers={
                        "X-RateLimit-Limit": str(max_requests),
                        "X-RateLimit-Remaining": "0",
                        "X-RateLimit-Reset": str(int(time.time() + window_seconds)),
                        "Retry-After": str(int(window_seconds)),
                    },
                )

            # Call the actual endpoint
            response = await func(*args, **kwargs)
            return response

        return wrapper

    return decorator


def rate_limit_by_user(
    max_requests: int = 60,
    window_seconds: float = 60.0,
    tokens: int = 1,
):
    """
    Rate limit decorator that uses user_id from CurrentUser dependency.

    Must be used with endpoints that have CurrentUser parameter named 'current_user'.
    """

    def key_extractor(request: Request) -> str:
        # User ID will be extracted in wrapper
        return f"user:{request.state.rate_limit_user_id}:{request.url.path}"

    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get current_user from kwargs
            current_user = kwargs.get("current_user")
            request = kwargs.get("request")

            if current_user is None:
                # Fallback to IP-based limiting
                return await rate_limit(max_requests, window_seconds, tokens=tokens)(func)(*args, **kwargs)

            # Store user_id in request state for key extraction
            if request:
                request.state.rate_limit_user_id = current_user.id

            rate_key = f"user:{current_user.id}:{func.__name__}"

            limiter = get_rate_limiter()
            allowed, remaining = limiter.is_allowed(
                rate_key, max_requests, window_seconds, tokens
            )

            if not allowed:
                logger.warning(f"Rate limit exceeded for user {current_user.id} on {func.__name__}")
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Rate limit exceeded. Please try again later.",
                    headers={
                        "X-RateLimit-Limit": str(max_requests),
                        "X-RateLimit-Remaining": "0",
                        "Retry-After": str(int(window_seconds)),
                    },
                )

            return await func(*args, **kwargs)

        return wrapper

    return decorator

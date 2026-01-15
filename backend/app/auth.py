"""Authentication utilities for Supabase JWT validation."""

import logging
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import get_settings

logger = logging.getLogger(__name__)

security = HTTPBearer()


class AuthenticatedUser:
    """Represents an authenticated user from JWT."""

    def __init__(self, user_id: str, email: str | None = None):
        self.id = user_id
        self.email = email


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
) -> AuthenticatedUser:
    """
    Validate JWT token and extract user info.

    Raises HTTPException 401 if token is invalid.
    """
    settings = get_settings()
    token = credentials.credentials

    try:
        # Decode JWT using Supabase secret
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user ID",
            )

        return AuthenticatedUser(
            user_id=user_id,
            email=payload.get("email"),
        )

    except jwt.ExpiredSignatureError:
        logger.warning("Authentication failed: token expired")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
        )
    except jwt.InvalidTokenError:
        # Don't log exception details - may contain token fragments
        logger.warning("Authentication failed: invalid token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )


# Type alias for dependency injection
CurrentUser = Annotated[AuthenticatedUser, Depends(get_current_user)]

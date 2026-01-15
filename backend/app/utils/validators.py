"""Common validators for API parameters."""

import re
from typing import Annotated

from fastapi import Path, HTTPException, status

# UUID v4 pattern
UUID_PATTERN = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
    re.IGNORECASE,
)


def validate_uuid(value: str) -> str:
    """
    Validate that a string is a valid UUID v4.

    Raises HTTPException 400 if invalid.
    """
    if not UUID_PATTERN.match(value):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid UUID format: {value}",
        )
    return value


# Annotated types for FastAPI path parameters
UUIDPath = Annotated[
    str,
    Path(
        ...,
        description="UUID identifier",
        pattern=r"^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
        examples=["550e8400-e29b-41d4-a716-446655440000"],
    ),
]

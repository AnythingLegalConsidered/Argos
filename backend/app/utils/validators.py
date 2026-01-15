"""Common validators for API parameters."""

from typing import Annotated

from fastapi import Path


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

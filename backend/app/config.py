"""Application configuration from environment variables."""

from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment."""

    # Supabase
    supabase_url: str
    supabase_key: str  # anon key for client-side
    supabase_jwt_secret: str

    # API
    api_title: str = "Argos API"
    api_version: str = "0.1.0"
    debug: bool = False

    # CORS - comma-separated origins, defaults to localhost dev servers
    cors_origins: str = "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()

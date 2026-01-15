"""Argos API - FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import sources, fetch, articles
from app.scheduler import start_scheduler, stop_scheduler

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - start/stop background services."""
    # Startup: start the scheduler
    start_scheduler()
    logger.info("Background scheduler started")
    yield
    # Shutdown: stop the scheduler
    stop_scheduler()
    logger.info("Background scheduler stopped")


app = FastAPI(
    title=settings.api_title,
    version=settings.api_version,
    description="Argos - Intelligent Veille Platform API",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS middleware - origins configurable via CORS_ORIGINS env var
cors_origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(sources.router)
app.include_router(fetch.router)
app.include_router(articles.router)


@app.get("/health")
async def health_check():
    """Health check endpoint for Docker/monitoring."""
    return {"status": "healthy", "version": settings.api_version}


@app.get("/")
async def root():
    """Root endpoint with API info."""
    return {
        "name": settings.api_title,
        "version": settings.api_version,
        "docs": "/docs",
    }


logger.info(f"Argos API v{settings.api_version} initialized")

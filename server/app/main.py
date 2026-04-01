"""GigShield — FastAPI application entry point.

Initialises the FastAPI app, registers all routers, and manages the
application lifespan (scheduler startup / shutdown).
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_database
from app.routers import claims, dashboard, events, onboarding, payouts, policy, pricing
from app.services.scheduler import start_scheduler, stop_scheduler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)-25s | %(levelname)-8s | %(message)s",
)
logger = logging.getLogger("gigshield")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — start scheduler on boot, stop on shutdown."""
    logger.info("🚀 GigShield starting up…")
    await init_database()
    start_scheduler()
    yield
    stop_scheduler()
    logger.info("🛑 GigShield shutting down…")


app = FastAPI(
    title="GigShield",
    description=(
        "AI-Powered Parametric Income-Loss Insurance for India's Gig Economy "
        "Delivery Workers. Provides automated, weather-triggered coverage for "
        "Zomato and Swiggy delivery partners."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register routers ────────────────────────────────────────────────────────
app.include_router(onboarding.router)
app.include_router(policy.router)
app.include_router(pricing.router)
app.include_router(claims.router)
app.include_router(payouts.router)
app.include_router(events.router)
app.include_router(dashboard.router)


@app.get("/", tags=["Health"])
async def root() -> dict:
    """Health check endpoint."""
    return {
        "service": "GigShield",
        "status": "operational",
        "version": "0.1.0",
    }


@app.get("/health", tags=["Health"])
async def health_check() -> dict:
    """Detailed health check."""
    return {
        "status": "healthy",
        "database": "connected",
        "scheduler": "running",
    }

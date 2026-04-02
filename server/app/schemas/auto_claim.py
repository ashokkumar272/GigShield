"""Pydantic schemas for auto-claim scan requests and responses."""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class AutoClaimScanRequest(BaseModel):
    """Request payload for POST /api/v1/auto-claims/scan."""

    cities: list[str] | None = Field(
        default=None,
        description=(
            "Explicit list of cities to scan. "
            "If omitted, all cities with active policies are scanned."
        ),
        examples=[["Mumbai", "Delhi"]],
    )
    dry_run: bool = Field(
        default=False,
        description=(
            "When true, assesses conditions and calculates severity scores "
            "but does NOT create any claims."
        ),
    )


class CityClaimResult(BaseModel):
    """Auto-claim assessment result for a single city."""

    city: str
    weather_score: float = Field(
        ..., ge=0.0, le=100.0, description="Weather severity score (0–100)"
    )
    traffic_score: float = Field(
        ..., ge=0.0, le=100.0, description="Traffic severity score (0–100)"
    )
    news_score: float = Field(
        ..., ge=0.0, le=100.0, description="News/disruption severity score (0–100)"
    )
    combined_score: float = Field(
        ..., ge=0.0, le=100.0, description="Combined weighted severity score (0–100)"
    )
    severity: str = Field(
        ...,
        description="Derived severity level: low / medium / high / critical",
    )
    dominant_event_type: str = Field(
        ...,
        description="Primary event type driving the score: rainfall / aqi / traffic / curfew_strike",
    )
    triggered: bool = Field(
        ..., description="Whether the threshold was crossed and claims were created"
    )
    claims_created: int = Field(..., description="Number of new claims created")
    claim_ids: list[uuid.UUID] = Field(default_factory=list)


class AutoClaimScanResponse(BaseModel):
    """Response from POST /api/v1/auto-claims/scan."""

    scanned_at: datetime
    dry_run: bool
    scanned_cities: int
    total_claims_created: int
    results: list[CityClaimResult]

"""Pydantic schemas for insurance policies."""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class PolicyCreate(BaseModel):
    """Payload for POST /policies — creates a new weekly policy for the
    authenticated worker.  The pricing engine is invoked server-side."""

    pass  # No user input needed — worker_id comes from JWT, pricing is auto-calculated


class PolicyResponse(BaseModel):
    """Policy detail returned by the API."""

    id: uuid.UUID
    worker_id: uuid.UUID
    status: str
    weekly_premium_inr: float
    coverage_amount_inr: float
    risk_score: float
    risk_factors: str | None = None
    start_date: datetime
    end_date: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PremiumBreakdownResponse(BaseModel):
    """Detailed premium calculation returned by the pricing engine."""

    weekly_premium_inr: float = Field(..., description="Calculated weekly premium in INR")
    coverage_amount_inr: float = Field(
        ..., description="80% income replacement coverage"
    )
    risk_score: float = Field(..., ge=0.0, le=10.0)
    risk_factors: list[str] = Field(default_factory=list)
    base_premium: float
    zone_risk_multiplier: float
    weather_risk_factor: float

"""Pydantic schemas for claims and disruption events.

Enforces the domain rule that claim_type is ALWAYS 'income_loss'. No health,
life, accident, or vehicle repair claims are permitted.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class EventTrigger(BaseModel):
    """Payload for POST /events/trigger — admin/scheduler pushes a disruption
    event that auto-creates claims for eligible workers."""

    event_type: str = Field(
        ...,
        pattern=r"^(rainfall|aqi|curfew_strike|traffic|news)$",
        examples=["rainfall"],
        description="Type of disruption event",
    )
    city: str = Field(..., min_length=2, max_length=60, examples=["Mumbai"])
    severity: str = Field(
        ...,
        pattern=r"^(low|medium|high|critical)$",
        examples=["high"],
    )
    timestamp: datetime = Field(..., description="When the event occurred")


class ManualClaimCreate(BaseModel):
    """Payload for temporary manual claim creation by worker."""

    severity: str = Field(
        ...,
        pattern=r"^(low|medium|high|critical)$",
        examples=["high"],
        description="Selected severity used to compute payout ratio",
    )


class ClaimResponse(BaseModel):
    """Claim detail returned by the API."""

    id: uuid.UUID
    worker_id: uuid.UUID
    policy_id: uuid.UUID
    claim_type: str
    event_type: str
    event_severity: str
    event_description: str | None = None
    status: str
    payout_amount_inr: float
    fraud_flag: str | None = None
    triggered_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}

    @field_validator("claim_type")
    @classmethod
    def enforce_income_loss_only(cls, v: str) -> str:
        """Domain Rule #1: Coverage is income loss ONLY.

        No health, life, accident, or vehicle repair payouts are allowed.
        """
        if v != "income_loss":
            raise ValueError(
                "Only 'income_loss' claims are supported. "
                "Health, life, accident, and vehicle repair are excluded."
            )
        return v


class EventTriggerResponse(BaseModel):
    """Response from the event trigger endpoint."""

    event_type: str
    city: str
    severity: str
    claims_created: int
    claim_ids: list[uuid.UUID]

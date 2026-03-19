"""Tests for the event trigger — disruption events auto-creating claims."""

import json
from datetime import datetime, timedelta, timezone

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.policy import Policy
from app.models.worker import Worker
from app.utils.auth import create_access_token, hash_otp


@pytest.mark.asyncio
async def test_event_trigger_creates_claim(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    """Test POST /api/v1/events/trigger — high-severity event auto-creates claims.

    Flow:
    1. Register a worker in Mumbai
    2. Create an active policy for them
    3. Trigger a high-severity rainfall event in Mumbai
    4. Verify that a claim was created
    """
    # Step 1: Register worker
    reg_resp = await client.post(
        "/api/v1/workers/register",
        json={
            "name": "Event Test Worker",
            "phone": "+919222222222",
            "city": "Mumbai",
            "pincode": "400001",
            "platform": "zomato",
            "avg_weekly_income_inr": 8000.0,
            "vehicle_type": "bike",
        },
    )
    assert reg_resp.status_code == 201
    worker_id = reg_resp.json()["id"]

    # Step 2: Login and create policy
    login_resp = await client.post(
        "/api/v1/workers/login",
        json={"phone": "+919222222222", "otp": "1234"},
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    policy_resp = await client.post("/api/v1/policies", headers=headers)
    assert policy_resp.status_code == 201
    policy_data = policy_resp.json()
    assert policy_data["status"] == "active"
    assert policy_data["coverage_amount_inr"] == 6400.0  # 8000 × 0.80

    # Step 3: Trigger event
    event_resp = await client.post(
        "/api/v1/events/trigger",
        json={
            "event_type": "rainfall",
            "city": "Mumbai",
            "severity": "high",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )
    assert event_resp.status_code == 200
    event_data = event_resp.json()
    assert event_data["claims_created"] >= 1
    assert len(event_data["claim_ids"]) >= 1

    # Step 4: Verify claim exists for the worker
    claims_resp = await client.get("/api/v1/claims/me", headers=headers)
    assert claims_resp.status_code == 200
    claims = claims_resp.json()
    assert len(claims) >= 1
    assert claims[0]["event_type"] == "rainfall"
    assert claims[0]["claim_type"] == "income_loss"
    assert claims[0]["payout_amount_inr"] > 0


@pytest.mark.asyncio
async def test_low_severity_event_no_claims(
    client: AsyncClient,
) -> None:
    """Test that low-severity events do NOT create claims."""
    # Register and create policy
    reg_resp = await client.post(
        "/api/v1/workers/register",
        json={
            "name": "Low Event Worker",
            "phone": "+919333333333",
            "city": "Delhi",
            "pincode": "110001",
            "platform": "swiggy",
            "avg_weekly_income_inr": 6000.0,
            "vehicle_type": "scooter",
        },
    )
    assert reg_resp.status_code == 201

    login_resp = await client.post(
        "/api/v1/workers/login",
        json={"phone": "+919333333333", "otp": "1234"},
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    await client.post("/api/v1/policies", headers=headers)

    # Trigger low-severity event
    event_resp = await client.post(
        "/api/v1/events/trigger",
        json={
            "event_type": "rainfall",
            "city": "Delhi",
            "severity": "low",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )
    assert event_resp.status_code == 200
    assert event_resp.json()["claims_created"] == 0

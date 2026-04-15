"""Tests for the event trigger — disruption events auto-creating claims."""

import json
import uuid
from datetime import datetime, timedelta, timezone

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.policy import Policy
from app.models.worker import Worker
from app.utils.auth import create_access_token, hash_otp


async def _force_activate_policy(
    db_session: AsyncSession,
    policy_id: str,
) -> None:
    """Force a just-created weekly policy into currently-active state for event tests."""
    policy = await db_session.get(Policy, uuid.UUID(policy_id))
    assert policy is not None

    now = datetime.now(timezone.utc)
    policy.status = "active"
    policy.start_date = now - timedelta(minutes=5)
    policy.end_date = now + timedelta(days=6, hours=23, minutes=59)
    await db_session.commit()


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
    assert policy_data["status"] == "scheduled"
    assert policy_data["coverage_amount_inr"] == 6400.0  # 8000 × 0.80
    await _force_activate_policy(db_session=db_session, policy_id=policy_data["id"])

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
    assert claims[0]["status"] == "paid"
    assert claims[0]["payout_amount_inr"] > 0

    payouts_resp = await client.get("/api/v1/payouts/me", headers=headers)
    assert payouts_resp.status_code == 200
    payouts = payouts_resp.json()
    assert len(payouts) >= 1
    assert payouts[0]["status"] == "processed"
    assert payouts[0]["amount_inr"] == claims[0]["payout_amount_inr"]


@pytest.mark.asyncio
async def test_low_severity_event_no_claims(
    client: AsyncClient,
    db_session: AsyncSession,
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

    created_policy = await client.post("/api/v1/policies", headers=headers)
    assert created_policy.status_code == 201
    await _force_activate_policy(
        db_session=db_session,
        policy_id=created_policy.json()["id"],
    )

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


@pytest.mark.asyncio
async def test_duplicate_claim_flag_does_not_overflow_column(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    """Second trigger in 48h should create a rejected claim without DB truncation errors."""
    reg_resp = await client.post(
        "/api/v1/workers/register",
        json={
            "name": "Duplicate Flag Worker",
            "phone": "+919777777777",
            "city": "Bangalore",
            "pincode": "560001",
            "platform": "zomato",
            "avg_weekly_income_inr": 9000.0,
            "vehicle_type": "bike",
        },
    )
    assert reg_resp.status_code == 201

    login_resp = await client.post(
        "/api/v1/workers/login",
        json={"phone": "+919777777777", "otp": "1234"},
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    policy_resp = await client.post("/api/v1/policies", headers=headers)
    assert policy_resp.status_code == 201
    await _force_activate_policy(
        db_session=db_session,
        policy_id=policy_resp.json()["id"],
    )

    first_event_resp = await client.post(
        "/api/v1/events/trigger",
        json={
            "event_type": "curfew_strike",
            "city": "Bangalore",
            "severity": "high",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )
    assert first_event_resp.status_code == 200
    assert first_event_resp.json()["claims_created"] >= 1

    second_event_resp = await client.post(
        "/api/v1/events/trigger",
        json={
            "event_type": "curfew_strike",
            "city": "Bangalore",
            "severity": "high",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )
    assert second_event_resp.status_code == 200
    assert second_event_resp.json()["claims_created"] >= 1

    claims_resp = await client.get("/api/v1/claims/me", headers=headers)
    assert claims_resp.status_code == 200
    claims = claims_resp.json()
    duplicate_claim = next(
        (
            claim
            for claim in claims
            if claim["event_type"] == "curfew_strike" and claim["fraud_flag"] is not None
        ),
        None,
    )

    assert duplicate_claim is not None
    assert duplicate_claim["status"] == "rejected"
    assert duplicate_claim["fraud_flag"].startswith("DUPLICATE_CLAIM")
    assert len(duplicate_claim["fraud_flag"]) <= 100


@pytest.mark.asyncio
async def test_event_trigger_matches_city_with_whitespace_and_case(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    """High-severity trigger should match legacy city values with extra spaces."""
    reg_resp = await client.post(
        "/api/v1/workers/register",
        json={
            "name": "City Match Worker",
            "phone": "+919666666666",
            "city": "Mumbai",
            "pincode": "400001",
            "platform": "zomato",
            "avg_weekly_income_inr": 8500.0,
            "vehicle_type": "bike",
        },
    )
    assert reg_resp.status_code == 201
    worker_id = reg_resp.json()["id"]

    login_resp = await client.post(
        "/api/v1/workers/login",
        json={"phone": "+919666666666", "otp": "1234"},
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    policy_resp = await client.post("/api/v1/policies", headers=headers)
    assert policy_resp.status_code == 201
    await _force_activate_policy(
        db_session=db_session,
        policy_id=policy_resp.json()["id"],
    )

    worker = await db_session.get(Worker, uuid.UUID(worker_id))
    assert worker is not None
    worker.city = "Mumbai   "
    await db_session.commit()

    event_resp = await client.post(
        "/api/v1/events/trigger",
        json={
            "event_type": "rainfall",
            "city": "mumbai",
            "severity": "high",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )
    assert event_resp.status_code == 200
    assert event_resp.json()["claims_created"] >= 1


@pytest.mark.asyncio
async def test_mock_simulation_randomly_triggers_and_creates_claims(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    """Simulation endpoint should eventually cross threshold and create claims."""
    reg_resp = await client.post(
        "/api/v1/workers/register",
        json={
            "name": "Mock Simulation Worker",
            "phone": "+919444444444",
            "city": "Mumbai",
            "pincode": "400001",
            "platform": "zomato",
            "avg_weekly_income_inr": 9000.0,
            "vehicle_type": "bike",
        },
    )
    assert reg_resp.status_code == 201

    login_resp = await client.post(
        "/api/v1/workers/login",
        json={"phone": "+919444444444", "otp": "1234"},
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    policy_resp = await client.post("/api/v1/policies", headers=headers)
    assert policy_resp.status_code == 201
    await _force_activate_policy(
        db_session=db_session,
        policy_id=policy_resp.json()["id"],
    )

    sim_resp = await client.post(
        "/api/v1/events/simulate/mock",
        json={
            "max_events": 8,
            "seed": 7,
        },
    )
    assert sim_resp.status_code == 200

    data = sim_resp.json()
    assert "event_type" in data["parameters_used"]
    assert "city" in data["parameters_used"]
    assert "severity" in data["parameters_used"]
    assert "timestamp" in data["parameters_used"]
    assert "weather_condition" in data["parameters_used"]
    assert "traffic_level" in data["parameters_used"]
    assert "precipitation_mm" in data["parameters_used"]

    assert len(data["mock_data"]) >= 1
    assert len(data["triggered_sequence"]) >= 1
    assert "weather_condition" in data["mock_data"][0]
    assert "traffic_level" in data["mock_data"][0]
    assert "precipitation_mm" in data["mock_data"][0]
    assert data["first_threshold_cross_index"] is not None
    assert any(step["threshold_crossed"] for step in data["triggered_sequence"])
    assert data["total_claims_created"] >= 1
    assert any(step["claims_created"] >= 1 for step in data["triggered_sequence"])


@pytest.mark.asyncio
async def test_dashboard_simulator_pauses_after_claim_and_restarts_on_new_policy(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    """Risk ticker should pause after claim for current policy and restart with next policy."""
    reg_resp = await client.post(
        "/api/v1/workers/register",
        json={
            "name": "Weekly Restart Worker",
            "phone": "+919555555555",
            "city": "Mumbai",
            "pincode": "400001",
            "platform": "zomato",
            "avg_weekly_income_inr": 8200.0,
            "vehicle_type": "bike",
        },
    )
    assert reg_resp.status_code == 201

    login_resp = await client.post(
        "/api/v1/workers/login",
        json={"phone": "+919555555555", "otp": "1234"},
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    first_policy_resp = await client.post("/api/v1/policies", headers=headers)
    assert first_policy_resp.status_code == 201
    first_policy_id = first_policy_resp.json()["id"]
    await _force_activate_policy(db_session=db_session, policy_id=first_policy_id)

    triggered_snapshot = None
    for _ in range(8):
        dashboard_resp = await client.get("/api/v1/dashboard/worker", headers=headers)
        assert dashboard_resp.status_code == 200
        risk_today = dashboard_resp.json()["risk_today"]
        if risk_today["claims_created"] > 0:
            triggered_snapshot = risk_today
            break

    assert triggered_snapshot is not None

    paused_resp = await client.get("/api/v1/dashboard/worker", headers=headers)
    assert paused_resp.status_code == 200
    paused_risk = paused_resp.json()["risk_today"]
    assert paused_risk["sample_index"] == triggered_snapshot["sample_index"]
    assert paused_risk["claims_created"] == 0
    assert "paused" in (paused_risk["note"] or "").lower()

    first_policy = await db_session.get(Policy, uuid.UUID(first_policy_id))
    assert first_policy is not None
    first_policy.status = "expired"
    await db_session.commit()

    second_policy_resp = await client.post("/api/v1/policies", headers=headers)
    assert second_policy_resp.status_code == 201
    await _force_activate_policy(
        db_session=db_session,
        policy_id=second_policy_resp.json()["id"],
    )

    resumed_resp = await client.get("/api/v1/dashboard/worker", headers=headers)
    assert resumed_resp.status_code == 200
    resumed_risk = resumed_resp.json()["risk_today"]
    assert resumed_risk["sample_index"] == 1
    assert "paused" not in (resumed_risk["note"] or "").lower()

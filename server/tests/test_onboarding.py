"""Tests for worker onboarding — registration and login."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_worker(client: AsyncClient) -> None:
    """Test POST /api/v1/workers/register — successful registration."""
    payload = {
        "name": "Rajesh Kumar",
        "phone": "+919876543210",
        "city": "Mumbai",
        "pincode": "400001",
        "platform": "zomato",
        "avg_weekly_income_inr": 8000.0,
        "vehicle_type": "bike",
    }
    response = await client.post("/api/v1/workers/register", json=payload)

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Rajesh Kumar"
    assert data["phone"] == "+919876543210"
    assert data["city"] == "Mumbai"
    assert data["platform"] == "zomato"
    assert data["avg_weekly_income_inr"] == 8000.0
    assert "id" in data


@pytest.mark.asyncio
async def test_register_duplicate_phone(client: AsyncClient) -> None:
    """Test that duplicate phone registration returns 409."""
    payload = {
        "name": "Worker A",
        "phone": "+919999999999",
        "city": "Delhi",
        "pincode": "110001",
        "platform": "swiggy",
        "avg_weekly_income_inr": 6000.0,
        "vehicle_type": "scooter",
    }
    # First registration
    resp1 = await client.post("/api/v1/workers/register", json=payload)
    assert resp1.status_code == 201

    # Duplicate
    resp2 = await client.post("/api/v1/workers/register", json=payload)
    assert resp2.status_code == 409


@pytest.mark.asyncio
async def test_login_and_get_profile(client: AsyncClient) -> None:
    """Test POST /api/v1/workers/login → GET /api/v1/workers/me flow."""
    # Register
    register_payload = {
        "name": "Login Test Worker",
        "phone": "+919111111111",
        "city": "Bangalore",
        "pincode": "560001",
        "platform": "zomato",
        "avg_weekly_income_inr": 7000.0,
        "vehicle_type": "bike",
    }
    reg_resp = await client.post("/api/v1/workers/register", json=register_payload)
    assert reg_resp.status_code == 201

    # Login with default OTP
    login_resp = await client.post(
        "/api/v1/workers/login",
        json={"phone": "+919111111111", "otp": "1234"},
    )
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]

    # Get profile
    profile_resp = await client.get(
        "/api/v1/workers/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert profile_resp.status_code == 200
    assert profile_resp.json()["name"] == "Login Test Worker"

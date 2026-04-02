"""Tests for policy recommendation endpoint and selection flow."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_policy_recommendations_returns_exact_three_plans(
    client: AsyncClient,
    auth_headers: dict,
) -> None:
    """Should always return Basic, Standard, High with expected-value fields."""
    response = await client.get(
        "/api/v1/policies/recommendations",
        headers=auth_headers,
    )

    assert response.status_code == 200
    data = response.json()
    recommendations = data["recommendations"]

    assert len(recommendations) == 3
    assert [item["plan_type"] for item in recommendations] == [
        "Basic",
        "Standard",
        "High",
    ]

    for item in recommendations:
        assert item["premium"] > 0
        assert item["max_payout"] > 0
        assert item["expected_payout"] >= 0
        assert item["value_score"] >= 0
        assert isinstance(item["why_recommended"], str)
        assert len(item["why_recommended"].strip()) > 0


@pytest.mark.asyncio
async def test_create_policy_from_selected_recommendation_payload(
    client: AsyncClient,
    auth_headers: dict,
) -> None:
    """Creating a policy with selected_recommendation should map premium and payout."""
    rec_resp = await client.get(
        "/api/v1/policies/recommendations",
        headers=auth_headers,
    )
    assert rec_resp.status_code == 200
    selected = rec_resp.json()["recommendations"][1]  # Standard

    create_resp = await client.post(
        "/api/v1/policies",
        headers=auth_headers,
        json={"selected_recommendation": selected},
    )

    assert create_resp.status_code == 201
    policy = create_resp.json()
    assert policy["weekly_premium_inr"] == selected["premium"]
    assert policy["coverage_amount_inr"] == selected["max_payout"]

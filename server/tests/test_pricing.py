"""Tests for the pricing engine — premium calculation with known inputs."""

import pytest

from app.services.pricing_engine import PremiumBreakdown, RiskFactor, calculate_premium


@pytest.mark.asyncio
async def test_premium_calculation_mumbai() -> None:
    """Test premium for a Mumbai worker earning ₹8,000/week.

    Expected (with default season risk):
        base_premium = 8000 × 0.03 = 240
        zone_risk = 1.50 (Mumbai)
        weather_risk = depends on current season
        weekly_premium = 240 × 1.50 × weather_risk
        coverage = 8000 × 0.80 = 6400
    """
    breakdown = calculate_premium(
        avg_weekly_income_inr=8000.0,
        city="Mumbai",
        pincode="400001",
    )

    assert isinstance(breakdown, PremiumBreakdown)
    assert breakdown.base_premium == 240.0
    assert breakdown.zone_risk_multiplier == 1.50
    assert breakdown.coverage_amount_inr == 6400.0
    assert breakdown.weekly_premium_inr >= 240.0 * 1.50  # at least base × zone
    assert 0.0 <= breakdown.risk_score <= 10.0
    assert any(rf.name == "flood_zone_history" for rf in breakdown.risk_factors)


@pytest.mark.asyncio
async def test_premium_calculation_unknown_city() -> None:
    """Test premium for a city not in the risk map — should use defaults."""
    breakdown = calculate_premium(
        avg_weekly_income_inr=5000.0,
        city="Jaipur",
        pincode="302001",
    )

    assert breakdown.base_premium == 150.0  # 5000 × 0.03
    assert breakdown.zone_risk_multiplier == 1.0
    assert breakdown.coverage_amount_inr == 4000.0  # 5000 × 0.80
    assert len(breakdown.risk_factors) == 0 or all(
        rf.name != "flood_zone_history" for rf in breakdown.risk_factors
    )


@pytest.mark.asyncio
async def test_risk_factor_dataclass() -> None:
    """Test RiskFactor immutability and fields."""
    rf = RiskFactor(
        name="test_factor",
        value=1.5,
        description="Test risk factor",
    )
    assert rf.name == "test_factor"
    assert rf.value == 1.5

    # Frozen dataclass — should not allow mutation
    with pytest.raises(AttributeError):
        rf.name = "changed"  # type: ignore

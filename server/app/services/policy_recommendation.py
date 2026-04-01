"""Policy recommendation service.

Generates 2-3 policy plan recommendations tailored to the worker profile.
Each recommendation includes randomised parameter scores for onboarding
decision support.
"""

from __future__ import annotations

import random

from app.models.worker import Worker
from app.schemas.policy import PolicyRecommendation
from app.services.pricing_engine import calculate_premium


def _score_parameter(base: float, spread: float = 12.0) -> float:
    value = base + random.uniform(-spread, spread)
    return round(max(20.0, min(98.0, value)), 2)


def generate_policy_recommendations(worker: Worker) -> list[PolicyRecommendation]:
    """Return 2-3 policy recommendations based on worker profile choices."""
    base_breakdown = calculate_premium(
        avg_weekly_income_inr=worker.avg_weekly_income_inr,
        city=worker.city,
        pincode=worker.pincode,
    )

    city_bonus_map = {
        "bangalore": 5.0,
        "hyderabad": 4.0,
        "chennai": 6.0,
        "pune": 4.5,
        "kolkata": 3.5,
        "ahmedabad": 3.0,
        "surat": 3.0,
        "jaipur": 2.5,
    }
    platform_bonus_map = {
        "swiggy": 5.0,
        "zomato": 5.0,
        "dunzo": 3.0,
        "ola": 2.5,
        "uber": 2.5,
        "rapido": 4.0,
    }
    vehicle_bonus_map = {
        "bike": 4.0,
        "scooter": 3.0,
        "cycle": 1.5,
    }

    city_bonus = city_bonus_map.get(worker.city.lower(), 0.0)
    platform_bonus = platform_bonus_map.get(worker.platform.lower(), 0.0)
    vehicle_bonus = vehicle_bonus_map.get(worker.vehicle_type.lower(), 0.0)

    plan_templates = [
        ("Starter Shield", 0.9, 0.65),
        ("Balanced Shield", 1.0, 0.8),
        ("Max Shield", 1.2, 0.95),
    ]

    selected_templates = random.sample(plan_templates, k=random.randint(2, 3))
    recommendations: list[PolicyRecommendation] = []

    for plan_name, premium_multiplier, coverage_ratio in selected_templates:
        demand_score = _score_parameter(65.0 + platform_bonus + city_bonus)
        weather_score = _score_parameter(62.0 + city_bonus)
        vehicle_risk_score = _score_parameter(58.0 + vehicle_bonus)
        claim_likelihood_score = _score_parameter(56.0 + platform_bonus / 2)

        recommendation_score = round(
            (demand_score * 0.3)
            + (weather_score * 0.25)
            + ((100.0 - vehicle_risk_score) * 0.2)
            + ((100.0 - claim_likelihood_score) * 0.25),
            2,
        )

        weekly_premium = round(base_breakdown.weekly_premium_inr * premium_multiplier, 2)
        coverage_amount = round(worker.avg_weekly_income_inr * coverage_ratio, 2)

        risk_score = round(
            min(
                10.0,
                max(
                    0.0,
                    base_breakdown.risk_score
                    + ((claim_likelihood_score + vehicle_risk_score) / 200.0),
                ),
            ),
            2,
        )

        recommendations.append(
            PolicyRecommendation(
                plan_name=plan_name,
                recommendation_score=recommendation_score,
                parameter_scores={
                    "demand_score": demand_score,
                    "weather_score": weather_score,
                    "vehicle_risk_score": vehicle_risk_score,
                    "claim_likelihood_score": claim_likelihood_score,
                },
                weekly_premium_inr=weekly_premium,
                coverage_amount_inr=coverage_amount,
                risk_score=risk_score,
                summary=(
                    f"Designed for {worker.platform.title()} workers in {worker.city} "
                    f"using {worker.vehicle_type}."
                ),
            )
        )

    recommendations.sort(key=lambda item: item.recommendation_score, reverse=True)
    return recommendations

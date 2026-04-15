"""Policy management router.

Allows workers to create new weekly insurance policies (which triggers the
pricing engine internally) and view their active policies.
"""

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.claim import Claim
from app.models.policy import Policy
from app.models.worker import Worker
from app.schemas.policy import PolicyCreate, PolicyRecommendationResponse, PolicyResponse
from app.services.policy_window import (
    can_purchase_for_start,
    coverage_end_for_start,
    next_coverage_start,
    purchase_cutoff_for_start,
    sync_worker_policy_statuses,
)
from app.services.policy_recommendation import generate_policy_recommendations
from app.services.pricing_engine import calculate_premium
from app.utils.deps import get_current_worker, get_db

router = APIRouter(prefix="/api/v1/policies", tags=["Policies"])


@router.post(
    "",
    response_model=PolicyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new weekly insurance policy",
)
async def create_policy(
    payload: PolicyCreate | None = Body(default=None),
    db: AsyncSession = Depends(get_db),
    current_worker: Worker = Depends(get_current_worker),
) -> Policy:
    """Create a new weekly income-loss insurance policy for the logged-in worker.

    The pricing engine is called internally to compute the premium, coverage,
    and risk score. Coverage starts in the next weekly window.
    """
    now = datetime.now(timezone.utc)
    await sync_worker_policy_statuses(db=db, worker_id=current_worker.id, reference=now)

    coverage_start = next_coverage_start(now)
    purchase_cutoff = purchase_cutoff_for_start(coverage_start)
    if not can_purchase_for_start(now, coverage_start):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Purchase window closed for upcoming coverage week. "
                f"Cutoff: {purchase_cutoff.isoformat()}"
            ),
        )

    # Block duplicate bookings for the same upcoming coverage window.
    result = await db.execute(
        select(Policy).where(
            Policy.worker_id == current_worker.id,
            Policy.status.in_(["active", "scheduled"]),
            Policy.start_date == coverage_start,
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Coverage for next week is already booked.",
        )
    coverage_end = coverage_end_for_start(coverage_start)
    policy_status = "active" if coverage_start <= now else "scheduled"

    if payload and payload.selected_recommendation:
        selected = payload.selected_recommendation
        selected_risk_score = {
            "Basic": 3.5,
            "Standard": 6.0,
            "High": 8.0,
        }.get(selected.plan_type, 5.0)
        risk_factor_names = [
            f"plan:{selected.plan_type}",
            f"expected_payout:{selected.expected_payout}",
            f"value_score:{selected.value_score}",
        ]

        policy = Policy(
            worker_id=current_worker.id,
            status=policy_status,
            weekly_premium_inr=selected.premium,
            coverage_amount_inr=selected.max_payout,
            risk_score=selected_risk_score,
            risk_factors=json.dumps(risk_factor_names),
            start_date=coverage_start,
            end_date=coverage_end,
        )
    else:
        # Default flow uses pricing engine when no recommendation was selected.
        breakdown = calculate_premium(
            avg_weekly_income_inr=current_worker.avg_weekly_income_inr,
            city=current_worker.city,
            pincode=current_worker.pincode,
        )
        risk_factor_names = [rf.name for rf in breakdown.risk_factors]

        policy = Policy(
            worker_id=current_worker.id,
            status=policy_status,
            weekly_premium_inr=breakdown.weekly_premium_inr,
            coverage_amount_inr=breakdown.coverage_amount_inr,
            risk_score=breakdown.risk_score,
            risk_factors=json.dumps(risk_factor_names) if risk_factor_names else None,
            start_date=coverage_start,
            end_date=coverage_end,
        )
    db.add(policy)
    await db.flush()
    await db.refresh(policy)
    return policy


@router.get(
    "/recommendations",
    response_model=PolicyRecommendationResponse,
    summary="Get suggested policy plans for current worker",
)
async def get_policy_recommendations(
    current_worker: Worker = Depends(get_current_worker),
) -> dict:
    """Return exactly 3 personalized plans: Basic, Standard, and High."""
    recommendations = await generate_policy_recommendations(current_worker)
    return {"recommendations": recommendations}


@router.get(
    "/me",
    response_model=list[PolicyResponse],
    summary="Get all policies for the logged-in worker",
)
async def get_my_policies(
    db: AsyncSession = Depends(get_db),
    current_worker: Worker = Depends(get_current_worker),
) -> list[Policy]:
    """Return all policies (active, expired, cancelled) for the worker."""
    await sync_worker_policy_statuses(db=db, worker_id=current_worker.id)
    result = await db.execute(
        select(Policy)
        .where(Policy.worker_id == current_worker.id)
        .order_by(Policy.created_at.desc())
    )
    return list(result.scalars().all())


@router.get(
    "/{policy_id}",
    response_model=PolicyResponse,
    summary="Get policy detail by ID",
)
async def get_policy(
    policy_id: str,
    db: AsyncSession = Depends(get_db),
    current_worker: Worker = Depends(get_current_worker),
) -> Policy:
    """Return details of a specific policy.

    Workers can only view their own policies.
    """
    import uuid as _uuid

    try:
        pid = _uuid.UUID(policy_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid policy ID format",
        )

    await sync_worker_policy_statuses(db=db, worker_id=current_worker.id)
    result = await db.execute(
        select(Policy).where(
            Policy.id == pid,
            Policy.worker_id == current_worker.id,
        )
    )
    policy = result.scalar_one_or_none()
    if policy is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found",
        )
    return policy


@router.delete(
    "/{policy_id}",
    response_model=PolicyResponse,
    summary="Delete policy by ID",
)
async def delete_policy(
    policy_id: str,
    db: AsyncSession = Depends(get_db),
    current_worker: Worker = Depends(get_current_worker),
) -> Policy:
    """Delete a specific policy owned by the current worker."""
    import uuid as _uuid

    try:
        pid = _uuid.UUID(policy_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid policy ID format",
        )

    result = await db.execute(
        select(Policy).where(
            Policy.id == pid,
            Policy.worker_id == current_worker.id,
        )
    )
    policy = result.scalar_one_or_none()
    if policy is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found",
        )

    linked_claim = await db.execute(
        select(Claim.id).where(Claim.policy_id == policy.id).limit(1)
    )
    if linked_claim.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Policy cannot be deleted because claims are linked to it",
        )

    await db.delete(policy)
    await db.flush()
    return policy

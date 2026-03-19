"""Payouts router — view payout history and process payments.

Workers can view their payout history.  The process endpoint triggers the
mock payment gateway to disburse funds for an approved claim.
"""

import uuid as _uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.claim import Claim
from app.models.payout import Payout
from app.models.worker import Worker
from app.schemas.payout import PayoutProcessResponse, PayoutResponse
from app.services.payment_service import disburse_payment
from app.utils.deps import get_current_worker, get_db

router = APIRouter(prefix="/api/v1/payouts", tags=["Payouts"])


@router.get(
    "/me",
    response_model=list[PayoutResponse],
    summary="Get payout history for the logged-in worker",
)
async def get_my_payouts(
    db: AsyncSession = Depends(get_db),
    current_worker: Worker = Depends(get_current_worker),
) -> list[Payout]:
    """Return all payouts (pending, processed, failed) for the worker."""
    result = await db.execute(
        select(Payout)
        .where(Payout.worker_id == current_worker.id)
        .order_by(Payout.created_at.desc())
    )
    return list(result.scalars().all())


@router.post(
    "/{claim_id}/process",
    response_model=PayoutProcessResponse,
    summary="Process payout for an approved claim",
)
async def process_payout(
    claim_id: str,
    db: AsyncSession = Depends(get_db),
    current_worker: Worker = Depends(get_current_worker),
) -> dict:
    """Trigger payment disbursement for a pending claim.

    1. Validates the claim belongs to the worker and is in ``pending`` status.
    2. Calls the mock payment gateway.
    3. Creates a ``Payout`` record and updates the claim status.
    """
    try:
        cid = _uuid.UUID(claim_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid claim ID format",
        )

    # Fetch the claim
    result = await db.execute(
        select(Claim).where(
            Claim.id == cid,
            Claim.worker_id == current_worker.id,
        )
    )
    claim = result.scalar_one_or_none()
    if claim is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found",
        )

    if claim.status == "paid":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Claim has already been paid out",
        )

    if claim.fraud_flag is not None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Claim is flagged for fraud review: {claim.fraud_flag}",
        )

    # Check for existing payout
    existing_payout = await db.execute(
        select(Payout).where(Payout.claim_id == cid)
    )
    if existing_payout.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Payout already exists for this claim",
        )

    # Disburse via payment gateway
    payment_result = await disburse_payment(
        claim_id=cid,
        amount_inr=claim.payout_amount_inr,
    )

    # Create payout record
    payout = Payout(
        claim_id=cid,
        worker_id=current_worker.id,
        amount_inr=payment_result.amount_inr,
        status=payment_result.status,
        transaction_id=payment_result.transaction_id,
        payment_method="upi",
        processed_at=payment_result.processed_at,
    )
    db.add(payout)

    # Update claim status
    claim.status = "paid" if payment_result.status == "processed" else "pending"
    await db.flush()

    return {
        "transaction_id": payment_result.transaction_id,
        "status": payment_result.status,
        "amount_inr": payment_result.amount_inr,
    }

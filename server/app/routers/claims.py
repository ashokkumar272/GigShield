"""Claims router — view auto-generated parametric insurance claims.

Claims are NOT manually filed by workers; they are created by the event
engine when a parametric trigger fires.  This router only provides read
access for workers to check their claim status.
"""

import uuid as _uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.claim import Claim
from app.models.worker import Worker
from app.schemas.claim import ClaimResponse
from app.utils.deps import get_current_worker, get_db

router = APIRouter(prefix="/api/v1/claims", tags=["Claims"])


@router.get(
    "/me",
    response_model=list[ClaimResponse],
    summary="Get all claims for the logged-in worker",
)
async def get_my_claims(
    db: AsyncSession = Depends(get_db),
    current_worker: Worker = Depends(get_current_worker),
) -> list[Claim]:
    """Return all claims (pending, approved, paid) for the authenticated worker."""
    result = await db.execute(
        select(Claim)
        .where(Claim.worker_id == current_worker.id)
        .order_by(Claim.created_at.desc())
    )
    return list(result.scalars().all())


@router.get(
    "/{claim_id}",
    response_model=ClaimResponse,
    summary="Get claim detail by ID",
)
async def get_claim(
    claim_id: str,
    db: AsyncSession = Depends(get_db),
    current_worker: Worker = Depends(get_current_worker),
) -> Claim:
    """Return details of a specific claim.

    Workers can only view their own claims.
    """
    try:
        cid = _uuid.UUID(claim_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid claim ID format",
        )

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
    return claim

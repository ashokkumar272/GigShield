"""Policy purchase window and weekly coverage helpers."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.policy import Policy
from app.utils.constants import (
    POLICY_COVERAGE_DURATION,
    POLICY_COVERAGE_START_HOUR,
    POLICY_COVERAGE_START_MINUTE,
    POLICY_COVERAGE_START_SECOND,
    POLICY_COVERAGE_START_WEEKDAY,
    POLICY_MIN_PURCHASE_LEAD_HOURS,
)


def _as_utc(dt: datetime) -> datetime:
    """Normalize both naive and aware datetimes to UTC-aware values."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def utc_now() -> datetime:
    """Return timezone-aware current UTC datetime."""
    return datetime.now(timezone.utc)


def next_coverage_start(reference: datetime) -> datetime:
    """Return the next weekly coverage start (Monday 00:00 UTC by default)."""
    ref_utc = _as_utc(reference)
    start_this_week = ref_utc.replace(
        hour=POLICY_COVERAGE_START_HOUR,
        minute=POLICY_COVERAGE_START_MINUTE,
        second=POLICY_COVERAGE_START_SECOND,
        microsecond=0,
    ) - timedelta(days=(ref_utc.weekday() - POLICY_COVERAGE_START_WEEKDAY) % 7)

    if ref_utc >= start_this_week:
        return start_this_week + POLICY_COVERAGE_DURATION
    return start_this_week


def coverage_end_for_start(start_date: datetime) -> datetime:
    """Return inclusive weekly coverage end (Sunday 23:59:59 UTC by default)."""
    return start_date + POLICY_COVERAGE_DURATION - timedelta(seconds=1)


def purchase_cutoff_for_start(start_date: datetime) -> datetime:
    """Return deadline to buy policy for a given coverage start."""
    return start_date - timedelta(hours=POLICY_MIN_PURCHASE_LEAD_HOURS)


def can_purchase_for_start(reference: datetime, start_date: datetime) -> bool:
    """Return whether purchase is allowed for the given start date."""
    return reference < purchase_cutoff_for_start(start_date)


def is_policy_active_now(policy: Policy, reference: datetime) -> bool:
    """Return True when policy is currently within active coverage dates."""
    if policy.status != "active":
        return False
    reference_utc = _as_utc(reference)
    start_utc = _as_utc(policy.start_date)
    if start_utc > reference_utc:
        return False
    if policy.end_date and _as_utc(policy.end_date) < reference_utc:
        return False
    return True


async def sync_worker_policy_statuses(
    db: AsyncSession,
    worker_id: UUID,
    reference: datetime | None = None,
) -> bool:
    """Normalize policy status values (scheduled/active/expired) for a worker."""
    now = _as_utc(reference or utc_now())

    result = await db.execute(
        select(Policy).where(
            Policy.worker_id == worker_id,
            Policy.status.in_(["active", "scheduled"]),
        )
    )
    policies = list(result.scalars().all())

    changed = False
    for policy in policies:
        start_utc = _as_utc(policy.start_date)
        end_utc = _as_utc(policy.end_date) if policy.end_date else None

        if end_utc and end_utc < now:
            if policy.status != "expired":
                policy.status = "expired"
                changed = True
            continue

        if start_utc > now:
            if policy.status != "scheduled":
                policy.status = "scheduled"
                changed = True
            continue

        if policy.status != "active":
            policy.status = "active"
            changed = True

    if changed:
        await db.flush()

    return changed

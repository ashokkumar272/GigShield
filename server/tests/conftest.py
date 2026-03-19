"""Shared pytest fixtures for GigShield tests.

Overrides the database with an in-memory SQLite async engine so tests run
without PostgreSQL.  Provides pre-built fixtures for authenticated workers
and httpx AsyncClient.
"""

import uuid

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.database import Base
from app.models.worker import Worker  # noqa: F401
from app.models.policy import Policy  # noqa: F401
from app.models.claim import Claim  # noqa: F401
from app.models.payout import Payout  # noqa: F401
from app.utils.auth import create_access_token, hash_otp
from app.utils.deps import get_db

# ── In-memory SQLite for tests ──────────────────────────────────────────────
# StaticPool ensures all sessions share the same connection, which is
# required for in-memory SQLite (otherwise each connection gets its own DB).

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
test_session_factory = async_sessionmaker(
    bind=test_engine, class_=AsyncSession, expire_on_commit=False
)


async def override_get_db():
    async with test_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


@pytest_asyncio.fixture(autouse=True)
async def setup_database():
    """Create all tables before each test, drop after."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db_session() -> AsyncSession:
    """Provide a clean database session for tests."""
    async with test_session_factory() as session:
        yield session


@pytest_asyncio.fixture
async def client():
    """Provide an httpx AsyncClient pointed at the test app."""
    from app.main import app

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def registered_worker(db_session: AsyncSession) -> Worker:
    """Create and return a registered worker in the test DB."""
    worker = Worker(
        id=uuid.uuid4(),
        name="Test Worker",
        phone="+919876543210",
        city="Mumbai",
        pincode="400001",
        platform="zomato",
        avg_weekly_income_inr=8000.0,
        vehicle_type="bike",
        hashed_otp=hash_otp("1234"),
    )
    db_session.add(worker)
    await db_session.commit()
    await db_session.refresh(worker)
    return worker


@pytest_asyncio.fixture
async def auth_headers(registered_worker: Worker) -> dict:
    """Return Authorization headers with a valid JWT for the test worker."""
    token = create_access_token(data={"sub": str(registered_worker.id)})
    return {"Authorization": f"Bearer {token}"}

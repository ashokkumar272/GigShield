"""SQLAlchemy async engine and session factory.

Provides `async_engine`, `async_session_factory`, and the declarative `Base`
used by all ORM models throughout the GigShield platform.
"""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

async_engine = create_async_engine(
    settings.database_url,
    echo=False,
    future=True,
)

async_session_factory = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Declarative base for all GigShield ORM models."""
    pass

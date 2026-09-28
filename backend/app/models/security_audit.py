from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class SecurityAudit(Base):
    """
    Sentinel-X security posture audit result.

    Each record represents one evaluated security control
    and preserves its status, score and recommendation.
    """

    __tablename__ = "security_audits"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    audit_run_id: Mapped[str] = mapped_column(
        String(100),
        index=True,
        nullable=False,
    )

    control_id: Mapped[str] = mapped_column(
        String(50),
        index=True,
        nullable=False,
    )

    control_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    category: Mapped[str] = mapped_column(
        String(100),
        index=True,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        index=True,
        nullable=False,
    )

    score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    finding: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    recommendation: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
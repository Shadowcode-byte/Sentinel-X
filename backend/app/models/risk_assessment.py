from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class RiskAssessment(Base):
    """
    Explainable Sentinel-X cyber-risk assessment.

    Risk assessments are linked to security incidents and
    preserve the factors used to calculate the final score.
    """

    __tablename__ = "risk_assessments"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    incident_id: Mapped[int] = mapped_column(
        Integer,
        index=True,
        nullable=False,
    )

    severity: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    severity_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    asset_criticality: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="HIGH",
    )

    asset_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    detection_confidence: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="HIGH",
    )

    confidence_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    status_factor: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    risk_score: Mapped[float] = mapped_column(
        Float,
        index=True,
        nullable=False,
    )

    risk_level: Mapped[str] = mapped_column(
        String(20),
        index=True,
        nullable=False,
    )

    rationale: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
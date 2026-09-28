from datetime import datetime, timezone

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ForensicEvidence(Base):
    """
    Sentinel-X preserved forensic evidence record.

    Stores normalized evidence metadata and its SHA-256
    integrity hash so the evidence can later be verified.
    """

    __tablename__ = "forensic_evidence"

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

    linked_event_id: Mapped[int | None] = mapped_column(
        Integer,
        index=True,
        nullable=True,
    )

    evidence_type: Mapped[str] = mapped_column(
        String(100),
        index=True,
        nullable=False,
    )

    source: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    target: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    evidence_data: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    sha256_hash: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True,
    )

    integrity_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="VERIFIED",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
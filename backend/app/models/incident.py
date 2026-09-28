from datetime import datetime, timezone

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Incident(Base):
    """
    Sentinel-X security incident.

    An incident represents an investigated security condition
    created from one or more security detections/events.
    """

    __tablename__ = "incidents"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    incident_type: Mapped[str] = mapped_column(
        String(100),
        index=True,
        nullable=False,
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    severity: Mapped[str] = mapped_column(
        String(20),
        index=True,
        nullable=False,
        default="INFO",
    )

    status: Mapped[str] = mapped_column(
        String(30),
        index=True,
        nullable=False,
        default="OPEN",
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

    linked_event_id: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
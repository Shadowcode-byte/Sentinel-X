from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.security_event import SecurityEvent
from app.schemas.security_event import (
    SecurityEventCreate,
    SecurityEventResponse,
)


router = APIRouter(
    prefix="/api/v1/events",
    tags=["Security Events"],
)


@router.post(
    "",
    response_model=SecurityEventResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_security_event(
    event: SecurityEventCreate,
    db: Session = Depends(get_db),
):
    security_event = SecurityEvent(
        event_type=event.event_type,
        source=event.source,
        target=event.target,
        severity=event.severity.upper(),
        description=event.description,
    )

    db.add(security_event)
    db.commit()
    db.refresh(security_event)

    return security_event


@router.get(
    "",
    response_model=list[SecurityEventResponse],
)
def get_security_events(
    db: Session = Depends(get_db),
):
    statement = select(SecurityEvent).order_by(
        SecurityEvent.created_at.desc()
    )

    events = db.scalars(statement).all()

    return events
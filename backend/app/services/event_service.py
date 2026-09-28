from app.core.database import SessionLocal
from app.models.security_event import SecurityEvent


def create_security_event(
    event_type: str,
    source: str,
    target: str | None,
    severity: str,
    description: str,
):
    """
    Persist a Sentinel-X security event.

    A fresh SQLAlchemy session is created for every event so
    packet-capture and detection threads never reuse the
    FastAPI request database session.
    """

    db = SessionLocal()

    try:
        security_event = SecurityEvent(
            event_type=event_type,
            source=source,
            target=target,
            severity=severity.upper(),
            description=description,
        )

        db.add(security_event)
        db.commit()
        db.refresh(security_event)

        return {
            "id": security_event.id,
            "event_type": security_event.event_type,
            "source": security_event.source,
            "target": security_event.target,
            "severity": security_event.severity,
            "description": security_event.description,
            "created_at": security_event.created_at.isoformat(),
        }

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()
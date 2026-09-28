from app.core.database import SessionLocal
from app.models.incident import Incident


def create_incident(
    incident_type: str,
    title: str,
    severity: str,
    source: str,
    target: str | None,
    description: str,
    linked_event_id: int | None = None,
):
    """
    Create and persist a Sentinel-X security incident.

    A fresh SQLAlchemy session is used so this function
    can safely be called from the packet/detection pipeline.
    """

    db = SessionLocal()

    try:
        incident = Incident(
            incident_type=incident_type.upper(),
            title=title,
            severity=severity.upper(),
            status="OPEN",
            source=source,
            target=target,
            description=description,
            linked_event_id=linked_event_id,
        )

        db.add(incident)

        db.commit()

        db.refresh(incident)


        return {
            "id": incident.id,

            "incident_type":
                incident.incident_type,

            "title":
                incident.title,

            "severity":
                incident.severity,

            "status":
                incident.status,

            "source":
                incident.source,

            "target":
                incident.target,

            "description":
                incident.description,

            "linked_event_id":
                incident.linked_event_id,

            "created_at":
                incident.created_at.isoformat(),

            "updated_at":
                incident.updated_at.isoformat(),
        }


    except Exception:

        db.rollback()

        raise


    finally:

        db.close()
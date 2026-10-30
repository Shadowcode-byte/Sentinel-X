from datetime import datetime, timedelta, timezone

from app.core.database import SessionLocal
from app.models.incident import Incident


# ---------------------------------------------------------
# Sentinel-X Incident Correlation Configuration
# ---------------------------------------------------------

INCIDENT_CORRELATION_SECONDS = 60


SEVERITY_RANK = {
    "INFO": 0,
    "LOW": 1,
    "MEDIUM": 2,
    "HIGH": 3,
    "CRITICAL": 4,
}


def _incident_to_dict(incident):
    """
    Convert an Incident model into the dictionary format
    expected by the Sentinel-X response pipeline.
    """

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

        "correlated":
            False,

        "severity_escalated":
            False,
    }


# ---------------------------------------------------------
# Create Incident
# ---------------------------------------------------------

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
    Create and persist a new Sentinel-X security incident.

    This preserves the original explicit incident-creation
    behavior for callers that require a new incident.
    """

    db = SessionLocal()

    try:

        incident = Incident(
            incident_type=
                incident_type.upper(),

            title=
                title,

            severity=
                severity.upper(),

            status=
                "OPEN",

            source=
                source,

            target=
                target,

            description=
                description,

            linked_event_id=
                linked_event_id,
        )

        db.add(incident)

        db.commit()

        db.refresh(incident)

        return _incident_to_dict(
            incident
        )


    except Exception:

        db.rollback()

        raise


    finally:

        db.close()


# ---------------------------------------------------------
# Create Or Escalate Correlated Incident
# ---------------------------------------------------------

def create_or_escalate_incident(
    incident_type: str,
    title: str,
    severity: str,
    source: str,
    target: str | None,
    description: str,
    linked_event_id: int | None = None,
):
    """
    Create or correlate a Sentinel-X detection with a recent
    active incident.

    Correlation requires all of the following:

        - Same incident type / rule
        - Same source
        - Same target
        - Incident is not RESOLVED
        - Incident was updated within the correlation window

    The time boundary prevents a historical unresolved
    incident from absorbing a completely new scan campaign.

    Within one current campaign:

        LOW -> MEDIUM -> HIGH -> CRITICAL

    can reuse one incident.

    Severity can only increase. It is never downgraded.

    Incident lifecycle state is preserved:

        OPEN
        INVESTIGATING
        CONTAINED
        RESOLVED
    """

    normalized_type = (
        incident_type
        .strip()
        .upper()
    )

    normalized_severity = (
        severity
        .strip()
        .upper()
    )

    now = datetime.now(
        timezone.utc
    )

    correlation_start = (
        now
        - timedelta(
            seconds=
                INCIDENT_CORRELATION_SECONDS
        )
    )


    db = SessionLocal()

    try:

        # -------------------------------------------------
        # Find newest matching unresolved incident.
        #
        # Time filtering is handled after retrieval because
        # SQLite may return naive datetime objects even when
        # DateTime(timezone=True) is used.
        # -------------------------------------------------

        query = (
            db.query(Incident)
            .filter(
                Incident.incident_type
                == normalized_type,

                Incident.source
                == source,

                Incident.status
                != "RESOLVED",
            )
        )


        if target is None:

            query = query.filter(
                Incident.target.is_(None)
            )

        else:

            query = query.filter(
                Incident.target == target
            )


        candidate = (
            query
            .order_by(
                Incident.updated_at.desc()
            )
            .first()
        )


        incident = None


        # -------------------------------------------------
        # Validate correlation age
        # -------------------------------------------------

        if candidate is not None:

            candidate_updated_at = (
                candidate.updated_at
            )


            # SQLite commonly returns naive datetime values.
            # Interpret those values as UTC because all
            # Sentinel-X timestamps are generated in UTC.
            if (
                candidate_updated_at.tzinfo
                is None
            ):

                candidate_updated_at = (
                    candidate_updated_at.replace(
                        tzinfo=timezone.utc
                    )
                )


            if (
                candidate_updated_at
                >= correlation_start
            ):

                incident = candidate


        # -------------------------------------------------
        # No recent active match -> create new incident
        # -------------------------------------------------

        if incident is None:

            incident = Incident(
                incident_type=
                    normalized_type,

                title=
                    title,

                severity=
                    normalized_severity,

                status=
                    "OPEN",

                source=
                    source,

                target=
                    target,

                description=
                    description,

                linked_event_id=
                    linked_event_id,

                created_at=
                    now,

                updated_at=
                    now,
            )

            db.add(incident)

            db.commit()

            db.refresh(incident)


            result = _incident_to_dict(
                incident
            )

            result[
                "correlated"
            ] = False

            result[
                "severity_escalated"
            ] = False

            return result


        # -------------------------------------------------
        # Recent active incident found
        # -------------------------------------------------

        current_severity = (
            incident.severity
            .strip()
            .upper()
        )

        current_rank = (
            SEVERITY_RANK.get(
                current_severity,
                0,
            )
        )

        new_rank = (
            SEVERITY_RANK.get(
                normalized_severity,
                0,
            )
        )


        severity_escalated = (
            new_rank > current_rank
        )


        # -------------------------------------------------
        # Escalate only. Never downgrade.
        # -------------------------------------------------

        if severity_escalated:

            incident.severity = (
                normalized_severity
            )

            incident.description = (
                description
            )


        # -------------------------------------------------
        # Link newest correlated security event
        # -------------------------------------------------

        if linked_event_id is not None:

            incident.linked_event_id = (
                linked_event_id
            )


        # Refresh campaign activity timestamp even if the
        # severity remained unchanged.
        incident.updated_at = now


        db.commit()

        db.refresh(incident)


        result = _incident_to_dict(
            incident
        )

        result[
            "correlated"
        ] = True

        result[
            "severity_escalated"
        ] = severity_escalated


        return result


    except Exception:

        db.rollback()

        raise


    finally:

        db.close()
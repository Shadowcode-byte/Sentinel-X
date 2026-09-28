from datetime import datetime, timezone

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.incident import Incident
from app.schemas.incident import (
    IncidentCreate,
    IncidentResponse,
    IncidentStatusUpdate,
)
from app.services.risk_service import create_risk_assessment


router = APIRouter(
    prefix="/api/v1/incidents",
    tags=["Incidents"],
)


# ---------------------------------------------------------
# Allowed Incident States
# ---------------------------------------------------------

ALLOWED_STATUSES = {
    "OPEN",
    "INVESTIGATING",
    "CONTAINED",
    "RESOLVED",
}


# ---------------------------------------------------------
# Valid State Transitions
# ---------------------------------------------------------

NEXT_STATUS = {
    "OPEN": "INVESTIGATING",
    "INVESTIGATING": "CONTAINED",
    "CONTAINED": "RESOLVED",
}


# ---------------------------------------------------------
# Create Incident
# ---------------------------------------------------------

@router.post(
    "",
    response_model=IncidentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_incident(
    incident: IncidentCreate,
    db: Session = Depends(get_db),
):
    """
    Create a Sentinel-X security incident.

    Automatic SCAN-001 incidents normally come from the
    detection pipeline. This endpoint remains available
    for controlled API use.
    """

    new_incident = Incident(
        incident_type=incident.incident_type.upper(),
        title=incident.title,
        severity=incident.severity.upper(),
        status="OPEN",
        source=incident.source,
        target=incident.target,
        description=incident.description,
        linked_event_id=incident.linked_event_id,
    )

    db.add(new_incident)

    db.commit()

    db.refresh(new_incident)

    return new_incident


# ---------------------------------------------------------
# Get All Incidents
# ---------------------------------------------------------

@router.get(
    "",
    response_model=list[IncidentResponse],
)
def get_incidents(
    db: Session = Depends(get_db),
):
    """
    Return Sentinel-X incidents newest first.
    """

    statement = (
        select(Incident)
        .order_by(
            Incident.created_at.desc()
        )
    )

    incidents = db.scalars(
        statement
    ).all()

    return incidents


# ---------------------------------------------------------
# Get One Incident
# ---------------------------------------------------------

@router.get(
    "/{incident_id}",
    response_model=IncidentResponse,
)
def get_incident(
    incident_id: int,
    db: Session = Depends(get_db),
):
    """
    Return one Sentinel-X incident.
    """

    incident = db.get(
        Incident,
        incident_id,
    )

    if incident is None:
        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,
            detail=
                "Incident not found.",
        )

    return incident


# ---------------------------------------------------------
# Update Incident Status
# ---------------------------------------------------------

@router.patch(
    "/{incident_id}/status",
    response_model=IncidentResponse,
)
def update_incident_status(
    incident_id: int,
    update: IncidentStatusUpdate,
    db: Session = Depends(get_db),
):
    """
    Advance an incident through the Sentinel-X response
    lifecycle.

    OPEN
      ->
    INVESTIGATING
      ->
    CONTAINED
      ->
    RESOLVED

    Every successful state transition generates a fresh
    risk assessment so Risk Intelligence reflects the
    current response state.
    """

    incident = db.get(
        Incident,
        incident_id,
    )


    if incident is None:
        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,
            detail=
                "Incident not found.",
        )


    new_status = (
        update.status
        .strip()
        .upper()
    )


    # -----------------------------------------------------
    # Validate status value
    # -----------------------------------------------------

    if new_status not in ALLOWED_STATUSES:
        raise HTTPException(
            status_code=
                status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid incident status. "
                "Allowed values: "
                "OPEN, INVESTIGATING, "
                "CONTAINED, RESOLVED."
            ),
        )


    current_status = (
        incident.status
        .strip()
        .upper()
    )


    # -----------------------------------------------------
    # Prevent unnecessary duplicate transition
    # -----------------------------------------------------

    if new_status == current_status:
        return incident


    # -----------------------------------------------------
    # Enforce forward lifecycle
    # -----------------------------------------------------

    expected_status = (
        NEXT_STATUS.get(
            current_status
        )
    )


    if expected_status is None:
        raise HTTPException(
            status_code=
                status.HTTP_400_BAD_REQUEST,
            detail=(
                "This incident is already resolved "
                "and cannot be advanced further."
            ),
        )


    if new_status != expected_status:
        raise HTTPException(
            status_code=
                status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Invalid transition: "
                f"{current_status} -> {new_status}. "
                f"Expected next state: "
                f"{expected_status}."
            ),
        )


    # -----------------------------------------------------
    # Update Incident
    # -----------------------------------------------------

    incident.status = (
        new_status
    )


    incident.updated_at = (
        datetime.now(
            timezone.utc
        )
    )


    db.commit()

    db.refresh(
        incident
    )


    # -----------------------------------------------------
    # Recalculate Risk
    #
    # A fresh assessment is preserved rather than
    # overwriting the previous assessment. This gives
    # Sentinel-X a risk history for the incident.
    # -----------------------------------------------------

    try:

        risk = create_risk_assessment(
            incident_id=
                incident.id,

            severity=
                incident.severity,

            incident_status=
                incident.status,

            asset_criticality=
                "HIGH",

            detection_confidence=
                "HIGH",
        )


        print(
            "[SENTINEL-X RISK] "
            f"INCIDENT #{incident.id} | "
            f"STATUS {incident.status} | "
            f"RISK {risk['risk_score']}/100 | "
            f"{risk['risk_level']}"
        )


    except Exception as exc:

        # Incident transition has already been persisted.
        # Risk failure should be visible in the backend
        # logs rather than silently hiding the transition.

        print(
            "[SENTINEL-X ERROR] "
            f"INCIDENT #{incident.id} "
            "status updated, but risk "
            "recalculation failed: "
            f"{exc}"
        )


    return incident
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db

from app.models.forensic_evidence import ForensicEvidence
from app.models.incident import Incident
from app.models.security_event import SecurityEvent
from app.models.risk_assessment import RiskAssessment

from app.schemas.forensic_evidence import (
    ForensicEvidenceResponse,
    IntegrityVerificationResponse,
)

from app.services.forensics_service import (
    create_forensic_evidence,
    verify_forensic_evidence,
)


router = APIRouter(
    prefix="/api/v1/forensics",
    tags=["Forensics"],
)


# ---------------------------------------------------------
# Get All Forensic Evidence
# ---------------------------------------------------------

@router.get(
    "",
    response_model=list[ForensicEvidenceResponse],
)
def get_forensic_evidence(
    db: Session = Depends(get_db),
):
    statement = (
        select(ForensicEvidence)
        .order_by(
            ForensicEvidence.created_at.desc()
        )
    )

    return db.scalars(
        statement
    ).all()


# ---------------------------------------------------------
# Preserve Existing Incident
# ---------------------------------------------------------

@router.post(
    "/preserve/incident/{incident_id}",
    response_model=ForensicEvidenceResponse,
    status_code=status.HTTP_201_CREATED,
)
def preserve_incident_evidence(
    incident_id: int,
    db: Session = Depends(get_db),
):
    """
    Preserve evidence from an existing genuine
    Sentinel-X incident.

    This is useful for incidents created before the
    automatic forensic pipeline was enabled.
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


    # -----------------------------------------------------
    # Prevent Duplicate Evidence
    # -----------------------------------------------------

    existing_statement = (
        select(ForensicEvidence)
        .where(
            ForensicEvidence.incident_id
            == incident_id
        )
        .order_by(
            ForensicEvidence.created_at.desc()
        )
    )


    existing_evidence = (
        db.scalars(
            existing_statement
        ).first()
    )


    if existing_evidence is not None:

        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,

            detail=(
                "Forensic evidence already exists "
                "for this incident."
            ),
        )


    # -----------------------------------------------------
    # Linked Security Event
    # -----------------------------------------------------

    security_event = None


    if incident.linked_event_id is not None:

        security_event = db.get(
            SecurityEvent,
            incident.linked_event_id,
        )


    # -----------------------------------------------------
    # Latest Risk Assessment
    # -----------------------------------------------------

    risk_statement = (
        select(RiskAssessment)
        .where(
            RiskAssessment.incident_id
            == incident.id
        )
        .order_by(
            RiskAssessment.created_at.desc()
        )
    )


    risk = db.scalars(
        risk_statement
    ).first()


    # -----------------------------------------------------
    # Evidence Payload
    # -----------------------------------------------------

    evidence_payload = {
        "incident_id":
            incident.id,

        "incident_type":
            incident.incident_type,

        "incident_title":
            incident.title,

        "incident_status":
            incident.status,

        "severity":
            incident.severity,

        "source":
            incident.source,

        "target":
            incident.target,

        "incident_description":
            incident.description,

        "incident_created_at":
            incident.created_at.isoformat(),

        "linked_event_id":
            incident.linked_event_id,

        "event_type":
            (
                security_event.event_type
                if security_event
                else None
            ),

        "event_description":
            (
                security_event.description
                if security_event
                else None
            ),

        "event_created_at":
            (
                security_event.created_at.isoformat()
                if security_event
                else None
            ),

        "risk_assessment_id":
            (
                risk.id
                if risk
                else None
            ),

        "risk_score":
            (
                risk.risk_score
                if risk
                else None
            ),

        "risk_level":
            (
                risk.risk_level
                if risk
                else None
            ),
    }


    # -----------------------------------------------------
    # Preserve + SHA-256
    # -----------------------------------------------------

    try:

        evidence = create_forensic_evidence(
            incident_id=
                incident.id,

            linked_event_id=
                incident.linked_event_id,

            evidence_type=
                "INCIDENT_SNAPSHOT",

            source=
                incident.source,

            target=
                incident.target,

            description=(
                "Preserved Sentinel-X incident "
                "snapshot with linked event and "
                "risk context."
            ),

            evidence_payload=
                evidence_payload,
        )


    except Exception as exc:

        raise HTTPException(
            status_code=
                status.HTTP_500_INTERNAL_SERVER_ERROR,

            detail=(
                "Evidence preservation failed: "
                f"{exc}"
            ),
        )


    return evidence


# ---------------------------------------------------------
# Get Evidence Linked To Incident
#
# IMPORTANT:
# This route appears before /{evidence_id} so
# /incident/1 cannot be interpreted as evidence_id.
# ---------------------------------------------------------

@router.get(
    "/incident/{incident_id}",
    response_model=list[ForensicEvidenceResponse],
)
def get_incident_evidence(
    incident_id: int,
    db: Session = Depends(get_db),
):
    statement = (
        select(ForensicEvidence)
        .where(
            ForensicEvidence.incident_id
            == incident_id
        )
        .order_by(
            ForensicEvidence.created_at.desc()
        )
    )

    return db.scalars(
        statement
    ).all()


# ---------------------------------------------------------
# Verify SHA-256 Integrity
# ---------------------------------------------------------

@router.post(
    "/{evidence_id}/verify",
    response_model=IntegrityVerificationResponse,
)
def verify_evidence(
    evidence_id: int,
):
    result = (
        verify_forensic_evidence(
            evidence_id
        )
    )


    if result is None:

        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,

            detail=
                "Forensic evidence not found.",
        )


    return result


# ---------------------------------------------------------
# Get One Evidence Record
# ---------------------------------------------------------

@router.get(
    "/{evidence_id}",
    response_model=ForensicEvidenceResponse,
)
def get_evidence(
    evidence_id: int,
    db: Session = Depends(get_db),
):
    evidence = db.get(
        ForensicEvidence,
        evidence_id,
    )


    if evidence is None:

        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,

            detail=
                "Forensic evidence not found.",
        )


    return evidence
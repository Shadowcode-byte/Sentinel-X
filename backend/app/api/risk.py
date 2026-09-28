from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.risk_assessment import RiskAssessment
from app.schemas.risk_assessment import RiskAssessmentResponse


router = APIRouter(
    prefix="/api/v1/risk",
    tags=["Risk Intelligence"],
)


# ---------------------------------------------------------
# Get All Risk Assessments
# ---------------------------------------------------------

@router.get(
    "",
    response_model=list[RiskAssessmentResponse],
)
def get_risk_assessments(
    db: Session = Depends(get_db),
):
    """
    Return Sentinel-X risk assessments newest first.
    """

    statement = (
        select(RiskAssessment)
        .order_by(
            RiskAssessment.created_at.desc()
        )
    )

    assessments = db.scalars(
        statement
    ).all()

    return assessments


# ---------------------------------------------------------
# Get One Risk Assessment
# ---------------------------------------------------------

@router.get(
    "/{assessment_id}",
    response_model=RiskAssessmentResponse,
)
def get_risk_assessment(
    assessment_id: int,
    db: Session = Depends(get_db),
):
    """
    Return one Sentinel-X risk assessment.
    """

    assessment = db.get(
        RiskAssessment,
        assessment_id,
    )


    if assessment is None:

        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,

            detail=
                "Risk assessment not found.",
        )


    return assessment


# ---------------------------------------------------------
# Get Risk Assessments For One Incident
# ---------------------------------------------------------

@router.get(
    "/incident/{incident_id}",
    response_model=list[RiskAssessmentResponse],
)
def get_incident_risk(
    incident_id: int,
    db: Session = Depends(get_db),
):
    """
    Return risk assessments linked to one incident.
    """

    statement = (
        select(RiskAssessment)
        .where(
            RiskAssessment.incident_id
            == incident_id
        )
        .order_by(
            RiskAssessment.created_at.desc()
        )
    )


    assessments = db.scalars(
        statement
    ).all()


    return assessments
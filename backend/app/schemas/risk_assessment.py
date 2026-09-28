from datetime import datetime

from pydantic import BaseModel, ConfigDict


class RiskAssessmentResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int

    incident_id: int

    severity: str
    severity_score: float

    asset_criticality: str
    asset_score: float

    detection_confidence: str
    confidence_score: float

    status_factor: float

    risk_score: float
    risk_level: str

    rationale: str

    created_at: datetime
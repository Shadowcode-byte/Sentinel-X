from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ForensicEvidenceResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int

    incident_id: int

    linked_event_id: int | None

    evidence_type: str

    source: str

    target: str | None

    description: str

    evidence_data: str

    sha256_hash: str

    integrity_status: str

    created_at: datetime


class IntegrityVerificationResponse(BaseModel):
    evidence_id: int

    verified: bool

    integrity_status: str

    stored_hash: str

    calculated_hash: str
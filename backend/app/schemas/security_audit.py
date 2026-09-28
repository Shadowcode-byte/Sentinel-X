from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SecurityAuditResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int

    audit_run_id: str

    control_id: str

    control_name: str

    category: str

    status: str

    score: float

    finding: str

    recommendation: str

    created_at: datetime


class SecurityAuditRunResponse(BaseModel):
    audit_run_id: str

    overall_score: float

    overall_status: str

    controls_evaluated: int

    passed: int

    warnings: int

    failed: int

    results: list[SecurityAuditResponse]
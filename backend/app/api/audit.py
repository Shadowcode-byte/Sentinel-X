from fastapi import (
    APIRouter,
    Depends,
)

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.security_audit import SecurityAudit
from app.schemas.security_audit import (
    SecurityAuditResponse,
    SecurityAuditRunResponse,
)
from app.services.audit_service import (
    run_security_audit,
)


router = APIRouter(
    prefix="/api/v1/audit",
    tags=["Security Audit"],
)


# ---------------------------------------------------------
# Run Security Audit
# ---------------------------------------------------------

@router.post(
    "/run",
    response_model=SecurityAuditRunResponse,
)
def execute_security_audit():
    """
    Run a fresh Sentinel-X security posture audit.

    The audit evaluates real persisted platform data
    across detection, incident response, risk intelligence,
    forensic preservation and evidence integrity.
    """

    return run_security_audit()


# ---------------------------------------------------------
# Get Complete Audit History
# ---------------------------------------------------------

@router.get(
    "",
    response_model=list[SecurityAuditResponse],
)
def get_audit_history(
    db: Session = Depends(get_db),
):
    """
    Return all persisted Sentinel-X audit control results,
    newest first.
    """

    statement = (
        select(SecurityAudit)
        .order_by(
            SecurityAudit.created_at.desc()
        )
    )

    return db.scalars(
        statement
    ).all()


# ---------------------------------------------------------
# Get Latest Audit Run
#
# IMPORTANT:
# This route is declared before /{audit_run_id}
# so "latest" cannot be interpreted as an audit run ID.
# ---------------------------------------------------------

@router.get(
    "/latest",
    response_model=list[SecurityAuditResponse],
)
def get_latest_audit(
    db: Session = Depends(get_db),
):
    """
    Return every control result belonging to the latest
    Sentinel-X audit execution.
    """

    latest_statement = (
        select(SecurityAudit)
        .order_by(
            SecurityAudit.created_at.desc()
        )
        .limit(1)
    )


    latest = db.scalars(
        latest_statement
    ).first()


    if latest is None:
        return []


    statement = (
        select(SecurityAudit)
        .where(
            SecurityAudit.audit_run_id
            == latest.audit_run_id
        )
        .order_by(
            SecurityAudit.control_id.asc()
        )
    )


    return db.scalars(
        statement
    ).all()


# ---------------------------------------------------------
# Get One Audit Run
# ---------------------------------------------------------

@router.get(
    "/{audit_run_id}",
    response_model=list[SecurityAuditResponse],
)
def get_audit_run(
    audit_run_id: str,
    db: Session = Depends(get_db),
):
    """
    Return all control results belonging to one audit run.
    """

    statement = (
        select(SecurityAudit)
        .where(
            SecurityAudit.audit_run_id
            == audit_run_id
        )
        .order_by(
            SecurityAudit.control_id.asc()
        )
    )


    return db.scalars(
        statement
    ).all()
from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import select

from app.core.database import SessionLocal

from app.models.security_event import SecurityEvent
from app.models.incident import Incident
from app.models.risk_assessment import RiskAssessment
from app.models.forensic_evidence import ForensicEvidence
from app.models.security_audit import SecurityAudit

from app.services.forensics_service import calculate_sha256


# ---------------------------------------------------------
# Audit Helpers
# ---------------------------------------------------------

def build_audit_run_id() -> str:
    """
    Generate a unique identifier for one Sentinel-X
    security audit execution.
    """

    timestamp = datetime.now(
        timezone.utc
    ).strftime(
        "%Y%m%dT%H%M%SZ"
    )

    suffix = uuid4().hex[:8].upper()

    return (
        f"AUDIT-{timestamp}-{suffix}"
    )


def create_control_result(
    control_id: str,
    control_name: str,
    category: str,
    status: str,
    score: float,
    finding: str,
    recommendation: str,
):
    """
    Build one normalized audit-control result.
    """

    return {
        "control_id":
            control_id,

        "control_name":
            control_name,

        "category":
            category,

        "status":
            status,

        "score":
            float(score),

        "finding":
            finding,

        "recommendation":
            recommendation,
    }


# ---------------------------------------------------------
# Sentinel-X Security Audit
# ---------------------------------------------------------

def run_security_audit():
    """
    Evaluate the current Sentinel-X security posture using
    real persisted platform data.

    Controls:

    AUD-001 - Detection Capability
    AUD-002 - Incident Response
    AUD-003 - Risk Intelligence
    AUD-004 - Forensic Preservation
    AUD-005 - Evidence Integrity
    """

    db = SessionLocal()

    audit_run_id = (
        build_audit_run_id()
    )

    results = []


    try:

        # -------------------------------------------------
        # Load Current Security Data
        # -------------------------------------------------

        events = db.scalars(
            select(
                SecurityEvent
            )
        ).all()


        incidents = db.scalars(
            select(
                Incident
            )
        ).all()


        risks = db.scalars(
            select(
                RiskAssessment
            )
        ).all()


        evidence_records = db.scalars(
            select(
                ForensicEvidence
            )
        ).all()


        # -------------------------------------------------
        # AUD-001
        # Detection Capability
        # -------------------------------------------------

        scan_events = [
            event
            for event in events
            if (
                event.event_type.upper()
                == "SCAN-001"
            )
        ]


        if scan_events:

            results.append(
                create_control_result(
                    control_id=
                        "AUD-001",

                    control_name=
                        "Detection Capability",

                    category=
                        "DETECTION",

                    status=
                        "PASS",

                    score=
                        100,

                    finding=(
                        f"Sentinel-X has persisted "
                        f"{len(scan_events)} SCAN-001 "
                        "security detection(s)."
                    ),

                    recommendation=(
                        "Continue monitoring detection "
                        "coverage and expand rule support "
                        "for additional threat patterns."
                    ),
                )
            )

        else:

            results.append(
                create_control_result(
                    control_id=
                        "AUD-001",

                    control_name=
                        "Detection Capability",

                    category=
                        "DETECTION",

                    status=
                        "WARNING",

                    score=
                        60,

                    finding=(
                        "No persisted SCAN-001 detection "
                        "is currently available to validate "
                        "the detection-response pipeline."
                    ),

                    recommendation=(
                        "Perform an authorized controlled "
                        "detection test to validate the "
                        "SCAN-001 rule."
                    ),
                )
            )


        # -------------------------------------------------
        # AUD-002
        # Incident Response
        # -------------------------------------------------

        linked_incidents = [
            incident
            for incident in incidents
            if (
                incident.linked_event_id
                is not None
            )
        ]


        if linked_incidents:

            results.append(
                create_control_result(
                    control_id=
                        "AUD-002",

                    control_name=
                        "Incident Response",

                    category=
                        "INCIDENT RESPONSE",

                    status=
                        "PASS",

                    score=
                        100,

                    finding=(
                        f"{len(linked_incidents)} incident(s) "
                        "are linked to persisted security "
                        "events and available for response "
                        "lifecycle management."
                    ),

                    recommendation=(
                        "Continue progressing incidents "
                        "through investigation, containment "
                        "and resolution when appropriate."
                    ),
                )
            )

        elif scan_events:

            results.append(
                create_control_result(
                    control_id=
                        "AUD-002",

                    control_name=
                        "Incident Response",

                    category=
                        "INCIDENT RESPONSE",

                    status=
                        "FAIL",

                    score=
                        25,

                    finding=(
                        "Security detections exist but no "
                        "linked incident record is available."
                    ),

                    recommendation=(
                        "Review automatic incident creation "
                        "and confirm detected threats enter "
                        "the response lifecycle."
                    ),
                )
            )

        else:

            results.append(
                create_control_result(
                    control_id=
                        "AUD-002",

                    control_name=
                        "Incident Response",

                    category=
                        "INCIDENT RESPONSE",

                    status=
                        "WARNING",

                    score=
                        60,

                    finding=(
                        "Incident-response linkage cannot "
                        "yet be validated because no genuine "
                        "detection is available."
                    ),

                    recommendation=(
                        "Validate incident creation during "
                        "the next authorized detection test."
                    ),
                )
            )


        # -------------------------------------------------
        # AUD-003
        # Risk Intelligence
        # -------------------------------------------------

        incident_ids = {
            incident.id
            for incident in incidents
        }


        linked_risks = [
            risk
            for risk in risks
            if (
                risk.incident_id
                in incident_ids
            )
        ]


        if (
            incidents
            and linked_risks
        ):

            covered_incident_ids = {
                risk.incident_id
                for risk in linked_risks
            }


            uncovered_count = len(
                incident_ids
                - covered_incident_ids
            )


            if uncovered_count == 0:

                risk_status = "PASS"
                risk_score = 100

                risk_finding = (
                    "All persisted incidents have at "
                    "least one linked explainable risk "
                    "assessment."
                )

            else:

                risk_status = "WARNING"
                risk_score = 70

                risk_finding = (
                    f"{uncovered_count} incident(s) "
                    "do not currently have a linked "
                    "risk assessment."
                )


            results.append(
                create_control_result(
                    control_id=
                        "AUD-003",

                    control_name=
                        "Risk Intelligence",

                    category=
                        "RISK",

                    status=
                        risk_status,

                    score=
                        risk_score,

                    finding=
                        risk_finding,

                    recommendation=(
                        "Maintain explainable risk "
                        "assessment coverage for every "
                        "security incident."
                    ),
                )
            )

        elif incidents:

            results.append(
                create_control_result(
                    control_id=
                        "AUD-003",

                    control_name=
                        "Risk Intelligence",

                    category=
                        "RISK",

                    status=
                        "FAIL",

                    score=
                        25,

                    finding=(
                        "Incident records exist but no "
                        "risk assessments are available."
                    ),

                    recommendation=(
                        "Review the Sentinel-X risk engine "
                        "and automatic assessment pipeline."
                    ),
                )
            )

        else:

            results.append(
                create_control_result(
                    control_id=
                        "AUD-003",

                    control_name=
                        "Risk Intelligence",

                    category=
                        "RISK",

                    status=
                        "WARNING",

                    score=
                        60,

                    finding=(
                        "Risk-assessment coverage cannot "
                        "yet be validated because there "
                        "are no incidents."
                    ),

                    recommendation=(
                        "Validate risk generation when "
                        "an incident becomes available."
                    ),
                )
            )


        # -------------------------------------------------
        # AUD-004
        # Forensic Preservation
        # -------------------------------------------------

        evidence_incident_ids = {
            evidence.incident_id
            for evidence
            in evidence_records
        }


        if incidents:

            missing_evidence = (
                incident_ids
                - evidence_incident_ids
            )


            if not missing_evidence:

                evidence_status = "PASS"
                evidence_score = 100

                evidence_finding = (
                    "All persisted incidents have "
                    "preserved forensic evidence."
                )

            elif evidence_records:

                evidence_status = "WARNING"
                evidence_score = 70

                evidence_finding = (
                    f"{len(missing_evidence)} incident(s) "
                    "do not currently have preserved "
                    "forensic evidence."
                )

            else:

                evidence_status = "FAIL"
                evidence_score = 25

                evidence_finding = (
                    "Incident records exist but no "
                    "forensic evidence has been preserved."
                )


            results.append(
                create_control_result(
                    control_id=
                        "AUD-004",

                    control_name=
                        "Forensic Preservation",

                    category=
                        "FORENSICS",

                    status=
                        evidence_status,

                    score=
                        evidence_score,

                    finding=
                        evidence_finding,

                    recommendation=(
                        "Preserve traceable forensic "
                        "artifacts for every confirmed "
                        "security incident."
                    ),
                )
            )

        else:

            results.append(
                create_control_result(
                    control_id=
                        "AUD-004",

                    control_name=
                        "Forensic Preservation",

                    category=
                        "FORENSICS",

                    status=
                        "WARNING",

                    score=
                        60,

                    finding=(
                        "Forensic preservation coverage "
                        "cannot yet be evaluated because "
                        "there are no incidents."
                    ),

                    recommendation=(
                        "Validate evidence preservation "
                        "during the next incident."
                    ),
                )
            )


        # -------------------------------------------------
        # AUD-005
        # Evidence Integrity
        #
        # Recalculate SHA-256 directly from every stored
        # evidence artifact. Do not trust only the saved
        # integrity_status value.
        # -------------------------------------------------

        if evidence_records:

            failed_integrity = []


            for evidence in evidence_records:

                calculated_hash = (
                    calculate_sha256(
                        evidence.evidence_data
                    )
                )


                if (
                    calculated_hash
                    != evidence.sha256_hash
                ):

                    failed_integrity.append(
                        evidence.id
                    )


            if not failed_integrity:

                integrity_status = "PASS"
                integrity_score = 100

                integrity_finding = (
                    f"SHA-256 integrity verification "
                    f"passed for all "
                    f"{len(evidence_records)} preserved "
                    "evidence record(s)."
                )

            else:

                integrity_status = "FAIL"
                integrity_score = 0

                integrity_finding = (
                    "SHA-256 integrity verification "
                    "failed for evidence ID(s): "
                    + ", ".join(
                        str(evidence_id)
                        for evidence_id
                        in failed_integrity
                    )
                    + "."
                )


            results.append(
                create_control_result(
                    control_id=
                        "AUD-005",

                    control_name=
                        "Evidence Integrity",

                    category=
                        "INTEGRITY",

                    status=
                        integrity_status,

                    score=
                        integrity_score,

                    finding=
                        integrity_finding,

                    recommendation=(
                        "Investigate any SHA-256 mismatch "
                        "immediately and preserve the "
                        "affected evidence chain."
                    ),
                )
            )

        else:

            results.append(
                create_control_result(
                    control_id=
                        "AUD-005",

                    control_name=
                        "Evidence Integrity",

                    category=
                        "INTEGRITY",

                    status=
                        "WARNING",

                    score=
                        60,

                    finding=(
                        "No forensic evidence is available "
                        "for SHA-256 integrity validation."
                    ),

                    recommendation=(
                        "Preserve forensic evidence before "
                        "performing integrity validation."
                    ),
                )
            )


        # -------------------------------------------------
        # Overall Audit Score
        # -------------------------------------------------

        overall_score = round(
            sum(
                result["score"]
                for result in results
            )
            / len(results),
            2,
        )


        if overall_score >= 90:

            overall_status = "PASS"

        elif overall_score >= 60:

            overall_status = "WARNING"

        else:

            overall_status = "FAIL"


        # -------------------------------------------------
        # Persist Audit Results
        # -------------------------------------------------

        stored_results = []


        for result in results:

            audit = SecurityAudit(
                audit_run_id=
                    audit_run_id,

                control_id=
                    result[
                        "control_id"
                    ],

                control_name=
                    result[
                        "control_name"
                    ],

                category=
                    result[
                        "category"
                    ],

                status=
                    result[
                        "status"
                    ],

                score=
                    result[
                        "score"
                    ],

                finding=
                    result[
                        "finding"
                    ],

                recommendation=
                    result[
                        "recommendation"
                    ],
            )


            db.add(
                audit
            )

            stored_results.append(
                audit
            )


        db.commit()


        for audit in stored_results:

            db.refresh(
                audit
            )


        return {
            "audit_run_id":
                audit_run_id,

            "overall_score":
                overall_score,

            "overall_status":
                overall_status,

            "controls_evaluated":
                len(results),

            "passed":
                sum(
                    1
                    for result in results
                    if result["status"]
                    == "PASS"
                ),

            "warnings":
                sum(
                    1
                    for result in results
                    if result["status"]
                    == "WARNING"
                ),

            "failed":
                sum(
                    1
                    for result in results
                    if result["status"]
                    == "FAIL"
                ),

            "results":
                [
                    {
                        "id":
                            audit.id,

                        "audit_run_id":
                            audit.audit_run_id,

                        "control_id":
                            audit.control_id,

                        "control_name":
                            audit.control_name,

                        "category":
                            audit.category,

                        "status":
                            audit.status,

                        "score":
                            audit.score,

                        "finding":
                            audit.finding,

                        "recommendation":
                            audit.recommendation,

                        "created_at":
                            audit.created_at.isoformat(),
                    }

                    for audit
                    in stored_results
                ],
        }


    except Exception:

        db.rollback()

        raise


    finally:

        db.close()
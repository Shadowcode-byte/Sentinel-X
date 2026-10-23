from datetime import datetime, timezone

from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.security_event import SecurityEvent
from app.models.incident import Incident
from app.models.risk_assessment import RiskAssessment
from app.models.forensic_evidence import ForensicEvidence
from app.models.security_audit import SecurityAudit


def generate_security_report():
    """
    Build a live Sentinel-X security report from persisted
    security events, incidents, risk assessments, forensic
    evidence and the latest security audit.

    No synthetic security data is generated here.
    """

    db = SessionLocal()

    try:

        # -------------------------------------------------
        # Security Events
        # -------------------------------------------------

        events = db.scalars(
            select(SecurityEvent)
            .order_by(
                SecurityEvent.created_at.desc()
            )
        ).all()


        # -------------------------------------------------
        # Incidents
        # -------------------------------------------------

        incidents = db.scalars(
            select(Incident)
            .order_by(
                Incident.created_at.desc()
            )
        ).all()


        # -------------------------------------------------
        # Risk Assessments
        # -------------------------------------------------

        risks = db.scalars(
            select(RiskAssessment)
            .order_by(
                RiskAssessment.created_at.desc()
            )
        ).all()


        # -------------------------------------------------
        # Forensic Evidence
        # -------------------------------------------------

        evidence = db.scalars(
            select(ForensicEvidence)
            .order_by(
                ForensicEvidence.created_at.desc()
            )
        ).all()


        # -------------------------------------------------
        # Latest Audit Run
        # -------------------------------------------------

        latest_audit_record = db.scalars(
            select(SecurityAudit)
            .order_by(
                SecurityAudit.created_at.desc()
            )
            .limit(1)
        ).first()


        latest_audit = []


        if latest_audit_record is not None:

            latest_audit = db.scalars(
                select(SecurityAudit)
                .where(
                    SecurityAudit.audit_run_id
                    == latest_audit_record.audit_run_id
                )
                .order_by(
                    SecurityAudit.control_id.asc()
                )
            ).all()


        # -------------------------------------------------
        # Event Metrics
        # -------------------------------------------------

        high_events = sum(
            1
            for event in events
            if event.severity.upper()
            in {
                "HIGH",
                "CRITICAL",
            }
        )


        scan_events = sum(
            1
            for event in events
            if event.event_type.upper()
            == "SCAN-001"
        )


        # -------------------------------------------------
        # Incident Metrics
        # -------------------------------------------------

        open_incidents = sum(
            1
            for incident in incidents
            if incident.status.upper()
            != "RESOLVED"
        )


        resolved_incidents = sum(
            1
            for incident in incidents
            if incident.status.upper()
            == "RESOLVED"
        )


        # -------------------------------------------------
        # Risk Metrics
        # -------------------------------------------------

        latest_risk_by_incident = {}


        for risk in risks:

            if (
                risk.incident_id
                not in latest_risk_by_incident
            ):

                latest_risk_by_incident[
                    risk.incident_id
                ] = risk


        current_risks = list(
            latest_risk_by_incident.values()
        )


        high_risk = sum(
            1
            for risk in current_risks
            if risk.risk_level.upper()
            in {
                "HIGH",
                "CRITICAL",
            }
        )


        # -------------------------------------------------
        # Evidence Metrics
        # -------------------------------------------------

        verified_evidence = sum(
            1
            for item in evidence
            if item.integrity_status.upper()
            == "VERIFIED"
        )


        failed_evidence = sum(
            1
            for item in evidence
            if item.integrity_status.upper()
            == "FAILED"
        )


        # -------------------------------------------------
        # Audit Metrics
        # -------------------------------------------------

        audit_score = None
        audit_status = "NOT_RUN"


        if latest_audit:

            audit_score = round(
                sum(
                    item.score
                    for item in latest_audit
                )
                / len(latest_audit),
                2,
            )


            if any(
                item.status.upper()
                == "FAIL"
                for item in latest_audit
            ):

                audit_status = "FAIL"

            elif any(
                item.status.upper()
                == "WARNING"
                for item in latest_audit
            ):

                audit_status = "WARNING"

            else:

                audit_status = "PASS"


        # -------------------------------------------------
        # Serialize Security Events
        # -------------------------------------------------

        event_records = [
            {
                "id":
                    event.id,

                "event_type":
                    event.event_type,

                "source":
                    event.source,

                "target":
                    event.target,

                "severity":
                    event.severity,

                "description":
                    event.description,

                "created_at":
                    event.created_at.isoformat(),
            }

            for event in events
        ]


        # -------------------------------------------------
        # Serialize Incidents
        # -------------------------------------------------

        incident_records = [
            {
                "id":
                    incident.id,

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

            for incident in incidents
        ]


        # -------------------------------------------------
        # Serialize Risk Assessments
        # -------------------------------------------------

        risk_records = [
            {
                "id":
                    risk.id,

                "incident_id":
                    risk.incident_id,

                "severity":
                    risk.severity,

                "asset_criticality":
                    risk.asset_criticality,

                "detection_confidence":
                    risk.detection_confidence,

                "status_factor":
                    risk.status_factor,

                "risk_score":
                    risk.risk_score,

                "risk_level":
                    risk.risk_level,

                "rationale":
                    risk.rationale,

                "created_at":
                    risk.created_at.isoformat(),
            }

            for risk in risks
        ]


        # -------------------------------------------------
        # Serialize Forensic Evidence
        # -------------------------------------------------

        evidence_records = [
            {
                "id":
                    item.id,

                "incident_id":
                    item.incident_id,

                "linked_event_id":
                    item.linked_event_id,

                "evidence_type":
                    item.evidence_type,

                "source":
                    item.source,

                "target":
                    item.target,

                "description":
                    item.description,

                "sha256_hash":
                    item.sha256_hash,

                "integrity_status":
                    item.integrity_status,

                "created_at":
                    item.created_at.isoformat(),
            }

            for item in evidence
        ]


        # -------------------------------------------------
        # Serialize Latest Audit
        # -------------------------------------------------

        audit_records = [
            {
                "id":
                    item.id,

                "audit_run_id":
                    item.audit_run_id,

                "control_id":
                    item.control_id,

                "control_name":
                    item.control_name,

                "category":
                    item.category,

                "status":
                    item.status,

                "score":
                    item.score,

                "finding":
                    item.finding,

                "recommendation":
                    item.recommendation,

                "created_at":
                    item.created_at.isoformat(),
            }

            for item in latest_audit
        ]


        # -------------------------------------------------
        # Report
        # -------------------------------------------------

        return {
            "platform":
                "Sentinel-X",

            "report_type":
                "UNIFIED_SECURITY_REPORT",

            "generated_at":
                datetime.now(
                    timezone.utc
                ).isoformat(),

            "executive_summary": {
                "security_events":
                    len(events),

                "high_severity_events":
                    high_events,

                "scan_detections":
                    scan_events,

                "incidents":
                    len(incidents),

                "open_incidents":
                    open_incidents,

                "resolved_incidents":
                    resolved_incidents,

                "current_high_risk":
                    high_risk,

                "forensic_evidence":
                    len(evidence),

                "verified_evidence":
                    verified_evidence,

                "failed_evidence":
                    failed_evidence,

                "latest_audit_score":
                    audit_score,

                "latest_audit_status":
                    audit_status,
            },

            "security_events":
                event_records,

            "incidents":
                incident_records,

            "risk_assessments":
                risk_records,

            "forensic_evidence":
                evidence_records,

            "latest_audit":
                audit_records,
        }


    finally:

        db.close()
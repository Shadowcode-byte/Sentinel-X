from datetime import datetime, timedelta, timezone

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.incident import Incident
from app.models.security_event import SecurityEvent
from app.models.risk_assessment import RiskAssessment
from app.models.forensic_evidence import ForensicEvidence

import app.services.event_service as event_service
import app.services.incident_service as incident_service
import app.services.risk_service as risk_service
import app.services.forensics_service as forensics_service
import app.services.response_pipeline as response_pipeline


SOURCE = "192.168.137.36"
TARGET = "192.168.137.1"


def make_detection(severity, port_count):
    detection = {
        "rule_id": "SCAN-001",
        "rule_name": "TCP MULTI-PORT SCAN",
        "severity": severity,
        "source": SOURCE,
        "target": TARGET,
        "protocol": "TCP",
        "detection_method": "TCP_SYN_MULTI_PORT",
        "unique_ports": list(
            range(20, 20 + port_count)
        ),
        "port_count": port_count,
        "window_seconds": 10,
        "detected_at":
            datetime.now(timezone.utc).isoformat(),
        "description": (
            f"SCAN-001 test {severity} detection "
            f"with {port_count} unique ports."
        ),
    }

    if severity == "CRITICAL":
        detection["critical_reason"] = (
            "REPEATED_HIGH_SCAN"
        )

    return detection


def configure_test_database(
    tmp_path,
    monkeypatch,
):
    """
    Create an isolated SQLite database and redirect every
    response-pipeline service to it.
    """

    database_path = (
        tmp_path
        / "sentinel_test.db"
    )

    engine = create_engine(
        f"sqlite:///{database_path.as_posix()}",
        connect_args={
            "check_same_thread": False,
        },
    )

    TestSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine,
    )

    Base.metadata.create_all(
        bind=engine,
        tables=[
            SecurityEvent.__table__,
            Incident.__table__,
            RiskAssessment.__table__,
            ForensicEvidence.__table__,
        ],
    )

    monkeypatch.setattr(
        event_service,
        "SessionLocal",
        TestSessionLocal,
    )

    monkeypatch.setattr(
        incident_service,
        "SessionLocal",
        TestSessionLocal,
    )

    monkeypatch.setattr(
        risk_service,
        "SessionLocal",
        TestSessionLocal,
    )

    monkeypatch.setattr(
        forensics_service,
        "SessionLocal",
        TestSessionLocal,
    )

    return TestSessionLocal


def test_full_scan_escalation_pipeline(
    tmp_path,
    monkeypatch,
):
    """
    One current SCAN-001 campaign should escalate:

        LOW -> MEDIUM -> HIGH -> CRITICAL

    while reusing one incident.
    """

    TestSessionLocal = configure_test_database(
        tmp_path,
        monkeypatch,
    )

    low_result = (
        response_pipeline.process_detection_response(
            make_detection("LOW", 3)
        )
    )

    incident_id = low_result["incident_id"]

    assert incident_id is not None
    assert low_result["risk_score"] == 62.0
    assert low_result["risk_level"] == "MEDIUM"


    medium_result = (
        response_pipeline.process_detection_response(
            make_detection("MEDIUM", 5)
        )
    )

    assert medium_result["incident_id"] == incident_id
    assert medium_result["incident_correlated"] is True
    assert medium_result["severity_escalated"] is True
    assert medium_result["risk_score"] == 72.0
    assert medium_result["risk_level"] == "HIGH"


    high_result = (
        response_pipeline.process_detection_response(
            make_detection("HIGH", 8)
        )
    )

    assert high_result["incident_id"] == incident_id
    assert high_result["incident_correlated"] is True
    assert high_result["severity_escalated"] is True
    assert high_result["risk_score"] == 84.0
    assert high_result["risk_level"] == "HIGH"


    critical_result = (
        response_pipeline.process_detection_response(
            make_detection("CRITICAL", 8)
        )
    )

    assert critical_result["incident_id"] == incident_id
    assert critical_result["incident_correlated"] is True
    assert critical_result["severity_escalated"] is True
    assert critical_result["risk_score"] == 92.0
    assert critical_result["risk_level"] == "CRITICAL"

    assert critical_result["evidence_id"] is not None
    assert critical_result["evidence_sha256"] is not None
    assert len(critical_result["evidence_sha256"]) == 64
    assert critical_result["evidence_integrity"] is not None


    db = TestSessionLocal()

    try:

        incidents = (
            db.query(Incident)
            .order_by(Incident.id)
            .all()
        )

        events = (
            db.query(SecurityEvent)
            .order_by(SecurityEvent.id)
            .all()
        )

        risks = (
            db.query(RiskAssessment)
            .order_by(RiskAssessment.id)
            .all()
        )

        evidence_records = (
            db.query(ForensicEvidence)
            .order_by(ForensicEvidence.id)
            .all()
        )

        assert len(incidents) == 1
        assert incidents[0].severity == "CRITICAL"
        assert incidents[0].status == "OPEN"

        assert len(events) == 4

        assert [
            event.severity
            for event in events
        ] == [
            "LOW",
            "MEDIUM",
            "HIGH",
            "CRITICAL",
        ]

        assert len(risks) == 4

        assert [
            risk.risk_score
            for risk in risks
        ] == [
            62.0,
            72.0,
            84.0,
            92.0,
        ]

        assert len(evidence_records) == 4

        for evidence in evidence_records:
            assert evidence.sha256_hash is not None
            assert len(evidence.sha256_hash) == 64

    finally:
        db.close()


def test_old_unresolved_incident_does_not_absorb_new_scan(
    tmp_path,
    monkeypatch,
):
    """
    An old unresolved SCAN-001 incident must NOT absorb a
    new scan campaign merely because rule/source/target are
    identical.

    A historical incident older than the correlation window
    should remain unchanged and a new incident should be
    created for the new LOW detection.
    """

    TestSessionLocal = configure_test_database(
        tmp_path,
        monkeypatch,
    )

    db = TestSessionLocal()

    try:

        old_time = (
            datetime.now(timezone.utc)
            - timedelta(minutes=10)
        )

        old_incident = Incident(
            incident_type="SCAN-001",
            title="Historical TCP Multi-Port Scan",
            severity="HIGH",
            status="OPEN",
            source=SOURCE,
            target=TARGET,
            description="Historical scan incident.",
            linked_event_id=None,
            created_at=old_time,
            updated_at=old_time,
        )

        db.add(old_incident)
        db.commit()
        db.refresh(old_incident)

        old_incident_id = old_incident.id

    finally:
        db.close()


    result = (
        response_pipeline.process_detection_response(
            make_detection("LOW", 3)
        )
    )


    # The new LOW campaign must create a NEW incident.
    assert result["incident_id"] != old_incident_id
    assert result["incident_correlated"] is False
    assert result["severity_escalated"] is False

    # Because this is genuinely LOW, its own risk should
    # be calculated from LOW rather than inherited HIGH.
    assert result["risk_score"] == 62.0
    assert result["risk_level"] == "MEDIUM"


    db = TestSessionLocal()

    try:

        incidents = (
            db.query(Incident)
            .order_by(Incident.id)
            .all()
        )

        assert len(incidents) == 2

        historical = incidents[0]
        current = incidents[1]

        # Historical record remains intact.
        assert historical.id == old_incident_id
        assert historical.severity == "HIGH"
        assert historical.status == "OPEN"

        # New campaign receives its own incident.
        assert current.id == result["incident_id"]
        assert current.severity == "LOW"
        assert current.status == "OPEN"
        assert current.source == SOURCE
        assert current.target == TARGET

    finally:
        db.close()
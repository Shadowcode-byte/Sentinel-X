from app.services.risk_service import calculate_risk


# ---------------------------------------------------------
# Sentinel-X Dynamic Risk Model v2 Tests
# ---------------------------------------------------------


def risk(
    severity,
    port_count,
    *,
    critical_reason=None,
    incident_status="OPEN",
):
    """
    Helper for SCAN-001 dynamic-risk tests.
    """

    return calculate_risk(
        severity=severity,
        incident_status=incident_status,
        asset_criticality="HIGH",
        detection_confidence="HIGH",
        port_count=port_count,
        window_seconds=10,
        critical_reason=critical_reason,
    )


# ---------------------------------------------------------
# LOW
# ---------------------------------------------------------


def test_low_risk_increases_with_scan_intensity():
    """
    Two LOW scans should not necessarily receive the same
    numerical risk score.

    4 unique ports represents greater scan intensity than
    3 unique ports.
    """

    three_ports = risk(
        "LOW",
        3,
    )

    four_ports = risk(
        "LOW",
        4,
    )

    assert (
        three_ports["risk_score"]
        < four_ports["risk_score"]
    )

    assert 1 <= three_ports["risk_score"] <= 100
    assert 1 <= four_ports["risk_score"] <= 100


# ---------------------------------------------------------
# MEDIUM
# ---------------------------------------------------------


def test_medium_risk_increases_with_scan_intensity():
    """
    MEDIUM risk should increase as the number of unique
    destination ports increases.
    """

    five_ports = risk(
        "MEDIUM",
        5,
    )

    seven_ports = risk(
        "MEDIUM",
        7,
    )

    assert (
        five_ports["risk_score"]
        < seven_ports["risk_score"]
    )


# ---------------------------------------------------------
# HIGH
# ---------------------------------------------------------


def test_high_risk_is_not_one_fixed_number():
    """
    HIGH is a categorical detection level.

    The numerical risk score should still distinguish an
    8-port scan from substantially broader scans.
    """

    eight_ports = risk(
        "HIGH",
        8,
    )

    twenty_ports = risk(
        "HIGH",
        20,
    )

    hundred_ports = risk(
        "HIGH",
        100,
    )

    assert (
        eight_ports["risk_score"]
        < twenty_ports["risk_score"]
        < hundred_ports["risk_score"]
    )


# ---------------------------------------------------------
# CRITICAL BEHAVIOR
# ---------------------------------------------------------


def test_repeated_high_behavior_increases_risk():
    """
    A repeated HIGH-strength burst contains additional
    behavioral evidence and must therefore score above an
    equivalent standalone HIGH scan.
    """

    high = risk(
        "HIGH",
        8,
    )

    critical = risk(
        "CRITICAL",
        8,
        critical_reason="REPEATED_HIGH_SCAN",
    )

    assert (
        critical["risk_score"]
        > high["risk_score"]
    )

    assert (
        critical["risk_level"]
        == "CRITICAL"
    )


# ---------------------------------------------------------
# BOUNDARIES
# ---------------------------------------------------------


def test_dynamic_risk_always_stays_between_1_and_100():
    """
    Extreme input must never produce an invalid risk score.
    """

    cases = [
        risk("LOW", 3),
        risk("LOW", 4),
        risk("MEDIUM", 5),
        risk("MEDIUM", 7),
        risk("HIGH", 8),
        risk("HIGH", 20),
        risk("HIGH", 100),
        risk(
            "CRITICAL",
            1000,
            critical_reason="REPEATED_HIGH_SCAN",
        ),
    ]

    for assessment in cases:

        assert (
            1
            <= assessment["risk_score"]
            <= 100
        )


# ---------------------------------------------------------
# DETERMINISM
# ---------------------------------------------------------


def test_same_evidence_produces_same_risk_score():
    """
    Sentinel-X risk must be evidence-based and deterministic,
    never random.
    """

    first = risk(
        "HIGH",
        20,
    )

    second = risk(
        "HIGH",
        20,
    )

    assert (
        first["risk_score"]
        == second["risk_score"]
    )

    assert (
        first["risk_level"]
        == second["risk_level"]
    )


# ---------------------------------------------------------
# INCIDENT RESPONSE EFFECT
# ---------------------------------------------------------


def test_incident_response_reduces_risk():
    """
    Risk should decrease as defenders move an incident
    through containment and resolution.
    """

    open_risk = risk(
        "HIGH",
        20,
        incident_status="OPEN",
    )

    investigating_risk = risk(
        "HIGH",
        20,
        incident_status="INVESTIGATING",
    )

    contained_risk = risk(
        "HIGH",
        20,
        incident_status="CONTAINED",
    )

    resolved_risk = risk(
        "HIGH",
        20,
        incident_status="RESOLVED",
    )

    assert (
        open_risk["risk_score"]
        > investigating_risk["risk_score"]
        > contained_risk["risk_score"]
        > resolved_risk["risk_score"]
    )


# ---------------------------------------------------------
# EXPLAINABILITY
# ---------------------------------------------------------


def test_dynamic_risk_preserves_explainability():
    """
    The assessment must expose the traffic factors used by
    the model so the dashboard/report can explain the score.
    """

    assessment = risk(
        "HIGH",
        20,
    )

    assert (
        assessment["port_count"]
        == 20
    )

    assert (
        assessment["window_seconds"]
        == 10
    )

    assert (
        "traffic_intensity_score"
        in assessment
    )

    assert (
        assessment["rationale"]
    )


# ---------------------------------------------------------
# SEVERITY ORDERING
# ---------------------------------------------------------


def test_minimum_thresholds_preserve_severity_order():
    """
    At their minimum thresholds, progressively more serious
    detections should produce progressively greater risk.
    """

    low = risk(
        "LOW",
        3,
    )

    medium = risk(
        "MEDIUM",
        5,
    )

    high = risk(
        "HIGH",
        8,
    )

    critical = risk(
        "CRITICAL",
        8,
        critical_reason="REPEATED_HIGH_SCAN",
    )

    assert (
        low["risk_score"]
        < medium["risk_score"]
        < high["risk_score"]
        < critical["risk_score"]
    )
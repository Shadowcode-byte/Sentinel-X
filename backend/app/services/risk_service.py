from app.core.database import SessionLocal
from app.models.risk_assessment import RiskAssessment


# ---------------------------------------------------------
# Sentinel-X Dynamic Risk Intelligence v2
# ---------------------------------------------------------

ASSET_SCORES = {
    "LOW": 25,
    "MEDIUM": 50,
    "HIGH": 80,
    "CRITICAL": 100,
}


CONFIDENCE_SCORES = {
    "LOW": 40,
    "MEDIUM": 65,
    "HIGH": 90,
}


STATUS_FACTORS = {
    "OPEN": 100,
    "INVESTIGATING": 85,
    "CONTAINED": 45,
    "RESOLVED": 15,
}


# ---------------------------------------------------------
# Severity Configuration
#
# The detection severity remains categorical, but the
# numerical risk inside each severity is dynamic.
# ---------------------------------------------------------

SEVERITY_BASE = {
    "INFO": 10,
    "LOW": 20,
    "MEDIUM": 40,
    "HIGH": 65,
    "CRITICAL": 85,
}


SEVERITY_MAX = {
    "INFO": 19,
    "LOW": 39,
    "MEDIUM": 64,
    "HIGH": 84,
    "CRITICAL": 100,
}


# ---------------------------------------------------------
# Risk Classification
# ---------------------------------------------------------

def classify_risk(score: float) -> str:
    """
    Convert numerical risk into an operational risk level.
    """

    if score >= 85:
        return "CRITICAL"

    if score >= 65:
        return "HIGH"

    if score >= 40:
        return "MEDIUM"

    return "LOW"


# ---------------------------------------------------------
# Helpers
# ---------------------------------------------------------

def _clamp(
    value: float,
    minimum: float,
    maximum: float,
) -> float:
    return max(
        minimum,
        min(
            maximum,
            value,
        ),
    )


def calculate_traffic_intensity(
    severity: str,
    port_count: int | None,
    window_seconds: int | None,
    critical_reason: str | None = None,
):
    """
    Calculate a deterministic 0-100 traffic-intensity score.

    For SCAN-001, unique destination-port count is currently
    the strongest available traffic measurement.

    The detector currently reports a fixed observation window
    rather than the exact elapsed duration of the burst, so
    this model does NOT pretend to know packet speed that has
    not actually been measured.

    A future detector version can provide actual burst
    duration / SYN rate and extend this calculation.
    """

    severity = (
        severity
        .strip()
        .upper()
    )

    try:
        ports = int(
            port_count
            if port_count is not None
            else 0
        )
    except (TypeError, ValueError):
        ports = 0

    ports = max(
        0,
        ports,
    )


    # -----------------------------------------------------
    # Port-intensity normalization
    #
    # These ranges intentionally distinguish traffic inside
    # the same categorical severity.
    # -----------------------------------------------------

    if severity == "LOW":

        # LOW normally represents 3-4 unique ports.
        if ports <= 3:
            port_intensity = 20.0
        else:
            port_intensity = 35.0


    elif severity == "MEDIUM":

        # MEDIUM normally represents 5-7 unique ports.
        port_intensity = (
            40.0
            + (
                _clamp(
                    ports - 5,
                    0,
                    2,
                )
                / 2.0
            )
            * 20.0
        )


    elif severity == "HIGH":

        # HIGH begins at 8 ports.
        #
        # Continue increasing gradually for broader scans.
        # Saturate at 100 ports so extreme scans cannot push
        # the model beyond its defined range.
        normalized = (
            _clamp(
                ports - 8,
                0,
                92,
            )
            / 92.0
        )

        port_intensity = (
            65.0
            + normalized * 35.0
        )


    elif severity == "CRITICAL":

        # CRITICAL already contains behavioral evidence
        # beyond a single scan burst.
        normalized = (
            _clamp(
                ports - 8,
                0,
                92,
            )
            / 92.0
        )

        port_intensity = (
            85.0
            + normalized * 15.0
        )


    else:

        port_intensity = 10.0


    # -----------------------------------------------------
    # Repeated HIGH behavioral evidence
    # -----------------------------------------------------

    repeated_behavior_bonus = 0.0

    if (
        critical_reason
        == "REPEATED_HIGH_SCAN"
    ):
        repeated_behavior_bonus = 10.0


    traffic_intensity_score = (
        port_intensity
        + repeated_behavior_bonus
    )

    traffic_intensity_score = _clamp(
        traffic_intensity_score,
        0.0,
        100.0,
    )


    return {
        "port_count":
            ports,

        "window_seconds":
            window_seconds,

        "port_intensity_score":
            round(
                port_intensity,
                2,
            ),

        "repeated_behavior_bonus":
            repeated_behavior_bonus,

        "traffic_intensity_score":
            round(
                traffic_intensity_score,
                2,
            ),
    }


# ---------------------------------------------------------
# Dynamic Risk Calculation
# ---------------------------------------------------------

def calculate_risk(
    severity: str,
    incident_status: str,
    asset_criticality: str = "HIGH",
    detection_confidence: str = "HIGH",
    port_count: int | None = None,
    window_seconds: int | None = None,
    critical_reason: str | None = None,
):
    """
    Calculate Sentinel-X Dynamic Risk v2.

    Risk is deterministic and evidence-based.

    Inputs:

    - detection severity
    - unique destination-port intensity
    - repeated HIGH behavior
    - asset criticality
    - detection confidence
    - incident response status

    No random values are used.

    Traffic-aware detections receive granular scores inside
    their severity band.

    Calls without traffic information remain supported so
    incident lifecycle recalculation does not break.
    """

    severity = (
        severity
        .strip()
        .upper()
    )

    incident_status = (
        incident_status
        .strip()
        .upper()
    )

    asset_criticality = (
        asset_criticality
        .strip()
        .upper()
    )

    detection_confidence = (
        detection_confidence
        .strip()
        .upper()
    )


    asset_score = (
        ASSET_SCORES.get(
            asset_criticality,
            50,
        )
    )

    confidence_score = (
        CONFIDENCE_SCORES.get(
            detection_confidence,
            40,
        )
    )

    status_factor = (
        STATUS_FACTORS.get(
            incident_status,
            100,
        )
    )


    severity_base = (
        SEVERITY_BASE.get(
            severity,
            10,
        )
    )

    severity_max = (
        SEVERITY_MAX.get(
            severity,
            39,
        )
    )


    traffic = (
        calculate_traffic_intensity(
            severity=severity,
            port_count=port_count,
            window_seconds=window_seconds,
            critical_reason=critical_reason,
        )
    )


    traffic_score = (
        traffic[
            "traffic_intensity_score"
        ]
    )


    # -----------------------------------------------------
    # Dynamic score inside severity band
    #
    # Traffic controls the position inside the severity
    # range.
    # -----------------------------------------------------

    if severity == "LOW":
        traffic_min = 20.0

    elif severity == "MEDIUM":
        traffic_min = 40.0

    elif severity == "HIGH":
        traffic_min = 65.0

    elif severity == "CRITICAL":
        traffic_min = 85.0

    else:
        traffic_min = 10.0


    traffic_span = max(
        1.0,
        100.0 - traffic_min,
    )


    normalized_traffic = (
        (
            traffic_score
            - traffic_min
        )
        / traffic_span
    )

    normalized_traffic = _clamp(
        normalized_traffic,
        0.0,
        1.0,
    )


    band_span = (
        severity_max
        - severity_base
    )


    traffic_based_score = (
        severity_base
        + normalized_traffic
        * band_span
    )


    # -----------------------------------------------------
    # Context adjustment
    #
    # HIGH asset + HIGH confidence + OPEN status represents
    # the neutral reference state for a newly detected
    # attack.
    #
    # Different asset/confidence/status values move the
    # score within safe bounds.
    # -----------------------------------------------------

    asset_adjustment = (
        (
            asset_score - 80
        )
        * 0.08
    )

    confidence_adjustment = (
        (
            confidence_score - 90
        )
        * 0.06
    )

    status_adjustment = (
        (
            status_factor - 100
        )
        * 0.12
    )


    raw_score = (
        traffic_based_score
        + asset_adjustment
        + confidence_adjustment
        + status_adjustment
    )


    # -----------------------------------------------------
    # For OPEN incidents, preserve severity ordering.
    #
    # Once defenders investigate/contain/resolve an incident,
    # the score is allowed to fall below its original
    # detection band because response actions reduce current
    # operational risk.
    # -----------------------------------------------------

    if incident_status == "OPEN":

        raw_score = _clamp(
            raw_score,
            severity_base,
            severity_max,
        )

    else:

        raw_score = _clamp(
            raw_score,
            1.0,
            100.0,
        )


    risk_score = round(
        raw_score,
        2,
    )


    risk_level = classify_risk(
        risk_score
    )


    rationale_parts = [
        (
            f"{severity} detection severity"
        ),
        (
            f"{traffic['port_count']} unique "
            f"destination ports"
        ),
        (
            f"traffic intensity "
            f"{traffic_score}/100"
        ),
        (
            f"{asset_criticality} asset "
            f"criticality ({asset_score})"
        ),
        (
            f"{detection_confidence} detection "
            f"confidence ({confidence_score})"
        ),
        (
            f"{incident_status} incident status "
            f"({status_factor})"
        ),
    ]


    if (
        critical_reason
        == "REPEATED_HIGH_SCAN"
    ):

        rationale_parts.append(
            "repeated HIGH-strength scan behavior"
        )


    rationale = (
        f"Dynamic risk score {risk_score}/100 "
        f"calculated from "
        + ", ".join(
            rationale_parts
        )
        + "."
    )


    return {
        "severity":
            severity,

        # Preserve the existing database field. It now
        # represents the categorical severity baseline.
        "severity_score":
            float(
                severity_base
            ),

        "asset_criticality":
            asset_criticality,

        "asset_score":
            asset_score,

        "detection_confidence":
            detection_confidence,

        "confidence_score":
            confidence_score,

        "status_factor":
            status_factor,

        "port_count":
            traffic[
                "port_count"
            ],

        "window_seconds":
            traffic[
                "window_seconds"
            ],

        "port_intensity_score":
            traffic[
                "port_intensity_score"
            ],

        "repeated_behavior_bonus":
            traffic[
                "repeated_behavior_bonus"
            ],

        "traffic_intensity_score":
            traffic_score,

        "critical_reason":
            critical_reason,

        "risk_score":
            risk_score,

        "risk_level":
            risk_level,

        "rationale":
            rationale,
    }


# ---------------------------------------------------------
# Persist Risk Assessment
# ---------------------------------------------------------

def create_risk_assessment(
    incident_id: int,
    severity: str,
    incident_status: str,
    asset_criticality: str = "HIGH",
    detection_confidence: str = "HIGH",
    port_count: int | None = None,
    window_seconds: int | None = None,
    critical_reason: str | None = None,
):
    """
    Calculate and persist a Sentinel-X risk assessment.

    Traffic parameters are optional for backward
    compatibility with incident lifecycle recalculation.
    """

    assessment = calculate_risk(
        severity=severity,

        incident_status=
            incident_status,

        asset_criticality=
            asset_criticality,

        detection_confidence=
            detection_confidence,

        port_count=
            port_count,

        window_seconds=
            window_seconds,

        critical_reason=
            critical_reason,
    )


    db = SessionLocal()


    try:

        risk = RiskAssessment(
            incident_id=
                incident_id,

            severity=
                assessment[
                    "severity"
                ],

            severity_score=
                assessment[
                    "severity_score"
                ],

            asset_criticality=
                assessment[
                    "asset_criticality"
                ],

            asset_score=
                assessment[
                    "asset_score"
                ],

            detection_confidence=
                assessment[
                    "detection_confidence"
                ],

            confidence_score=
                assessment[
                    "confidence_score"
                ],

            status_factor=
                assessment[
                    "status_factor"
                ],

            risk_score=
                assessment[
                    "risk_score"
                ],

            risk_level=
                assessment[
                    "risk_level"
                ],

            rationale=
                assessment[
                    "rationale"
                ],
        )


        db.add(risk)

        db.commit()

        db.refresh(risk)


        return {
            "id":
                risk.id,

            "incident_id":
                risk.incident_id,

            "severity":
                risk.severity,

            "severity_score":
                risk.severity_score,

            "asset_criticality":
                risk.asset_criticality,

            "asset_score":
                risk.asset_score,

            "detection_confidence":
                risk.detection_confidence,

            "confidence_score":
                risk.confidence_score,

            "status_factor":
                risk.status_factor,

            "port_count":
                assessment[
                    "port_count"
                ],

            "window_seconds":
                assessment[
                    "window_seconds"
                ],

            "port_intensity_score":
                assessment[
                    "port_intensity_score"
                ],

            "repeated_behavior_bonus":
                assessment[
                    "repeated_behavior_bonus"
                ],

            "traffic_intensity_score":
                assessment[
                    "traffic_intensity_score"
                ],

            "critical_reason":
                assessment[
                    "critical_reason"
                ],

            "risk_score":
                risk.risk_score,

            "risk_level":
                risk.risk_level,

            "rationale":
                risk.rationale,

            "created_at":
                risk.created_at.isoformat(),
        }


    except Exception:

        db.rollback()

        raise


    finally:

        db.close()
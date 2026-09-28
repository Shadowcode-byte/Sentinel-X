from app.core.database import SessionLocal
from app.models.risk_assessment import RiskAssessment


# ---------------------------------------------------------
# Sentinel-X Risk Intelligence Configuration
# ---------------------------------------------------------

SEVERITY_SCORES = {
    "INFO": 10,
    "LOW": 25,
    "MEDIUM": 50,
    "HIGH": 80,
    "CRITICAL": 100,
}


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
# Risk Level Classification
# ---------------------------------------------------------

def classify_risk(score: float) -> str:
    """
    Convert a numerical Sentinel-X risk score into
    an explainable operational risk level.
    """

    if score >= 85:
        return "CRITICAL"

    if score >= 65:
        return "HIGH"

    if score >= 40:
        return "MEDIUM"

    return "LOW"


# ---------------------------------------------------------
# Risk Score Calculation
# ---------------------------------------------------------

def calculate_risk(
    severity: str,
    incident_status: str,
    asset_criticality: str = "HIGH",
    detection_confidence: str = "HIGH",
):
    """
    Calculate an explainable Sentinel-X cyber-risk score.

    Weighting:

    Severity              40%
    Asset Criticality     30%
    Detection Confidence  20%
    Incident Status       10%
    """

    severity = severity.upper()

    incident_status = (
        incident_status.upper()
    )

    asset_criticality = (
        asset_criticality.upper()
    )

    detection_confidence = (
        detection_confidence.upper()
    )


    severity_score = (
        SEVERITY_SCORES.get(
            severity,
            10,
        )
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


    risk_score = (
        severity_score * 0.40
        + asset_score * 0.30
        + confidence_score * 0.20
        + status_factor * 0.10
    )


    risk_score = round(
        risk_score,
        2,
    )


    risk_level = classify_risk(
        risk_score
    )


    rationale = (
        f"Risk score {risk_score}/100 calculated from "
        f"{severity} severity ({severity_score}), "
        f"{asset_criticality} asset criticality "
        f"({asset_score}), "
        f"{detection_confidence} detection confidence "
        f"({confidence_score}), and "
        f"{incident_status} incident status "
        f"({status_factor})."
    )


    return {
        "severity":
            severity,

        "severity_score":
            severity_score,

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

        "risk_score":
            risk_score,

        "risk_level":
            risk_level,

        "rationale":
            rationale,
    }


# ---------------------------------------------------------
# Create Risk Assessment
# ---------------------------------------------------------

def create_risk_assessment(
    incident_id: int,
    severity: str,
    incident_status: str,
    asset_criticality: str = "HIGH",
    detection_confidence: str = "HIGH",
):
    """
    Calculate and persist a Sentinel-X risk assessment
    linked to a security incident.
    """

    assessment = calculate_risk(
        severity=severity,

        incident_status=
            incident_status,

        asset_criticality=
            asset_criticality,

        detection_confidence=
            detection_confidence,
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
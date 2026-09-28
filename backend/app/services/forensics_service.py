import hashlib
import json

from app.core.database import SessionLocal
from app.models.forensic_evidence import ForensicEvidence


# ---------------------------------------------------------
# SHA-256
# ---------------------------------------------------------

def calculate_sha256(
    evidence_data: str,
) -> str:
    """
    Calculate the SHA-256 hash of normalized evidence data.
    """

    return hashlib.sha256(
        evidence_data.encode(
            "utf-8"
        )
    ).hexdigest()


# ---------------------------------------------------------
# Create Evidence
# ---------------------------------------------------------

def create_forensic_evidence(
    incident_id: int,
    linked_event_id: int | None,
    evidence_type: str,
    source: str,
    target: str | None,
    description: str,
    evidence_payload: dict,
):
    """
    Normalize, hash and persist a Sentinel-X forensic
    evidence artifact.
    """

    evidence_data = json.dumps(
        evidence_payload,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    )


    sha256_hash = calculate_sha256(
        evidence_data
    )


    db = SessionLocal()


    try:

        evidence = ForensicEvidence(
            incident_id=
                incident_id,

            linked_event_id=
                linked_event_id,

            evidence_type=
                evidence_type.upper(),

            source=
                source,

            target=
                target,

            description=
                description,

            evidence_data=
                evidence_data,

            sha256_hash=
                sha256_hash,

            integrity_status=
                "VERIFIED",
        )


        db.add(evidence)

        db.commit()

        db.refresh(evidence)


        return {
            "id":
                evidence.id,

            "incident_id":
                evidence.incident_id,

            "linked_event_id":
                evidence.linked_event_id,

            "evidence_type":
                evidence.evidence_type,

            "source":
                evidence.source,

            "target":
                evidence.target,

            "description":
                evidence.description,

            "evidence_data":
                evidence.evidence_data,

            "sha256_hash":
                evidence.sha256_hash,

            "integrity_status":
                evidence.integrity_status,

            "created_at":
                evidence.created_at.isoformat(),
        }


    except Exception:

        db.rollback()

        raise


    finally:

        db.close()


# ---------------------------------------------------------
# Verify Evidence Integrity
# ---------------------------------------------------------

def verify_forensic_evidence(
    evidence_id: int,
):
    """
    Recalculate the evidence SHA-256 hash and compare it
    with the hash stored when the evidence was preserved.
    """

    db = SessionLocal()


    try:

        evidence = db.get(
            ForensicEvidence,
            evidence_id,
        )


        if evidence is None:

            return None


        calculated_hash = (
            calculate_sha256(
                evidence.evidence_data
            )
        )


        verified = (
            calculated_hash
            == evidence.sha256_hash
        )


        evidence.integrity_status = (
            "VERIFIED"
            if verified
            else "FAILED"
        )


        db.commit()

        db.refresh(evidence)


        return {
            "evidence_id":
                evidence.id,

            "verified":
                verified,

            "integrity_status":
                evidence.integrity_status,

            "stored_hash":
                evidence.sha256_hash,

            "calculated_hash":
                calculated_hash,
        }


    except Exception:

        db.rollback()

        raise


    finally:

        db.close()
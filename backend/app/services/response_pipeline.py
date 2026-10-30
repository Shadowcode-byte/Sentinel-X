from app.services.event_service import create_security_event
from app.services.incident_service import create_or_escalate_incident
from app.services.risk_service import create_risk_assessment
from app.services.forensics_service import create_forensic_evidence


def process_detection_response(detection: dict):
    """
    Execute the Sentinel-X post-detection response pipeline.

    Detection
        ->
    Security Event
        ->
    Correlated Incident
        ->
    Dynamic Risk Assessment
        ->
    Forensic Evidence + SHA-256

    A correlated SCAN-001 campaign reuses the same active
    incident while preserving separate security events,
    risk assessments and forensic evidence for meaningful
    severity escalations.

    Dynamic Risk v2 additionally uses traffic evidence:

        - port_count
        - window_seconds
        - critical_reason

    Returns the enriched detection record containing IDs
    created or correlated by each stage.
    """

    result = {
        **detection,
    }

    stored_event = None
    stored_incident = None
    stored_risk = None
    stored_evidence = None


    # -----------------------------------------------------
    # 1. SECURITY EVENT
    # -----------------------------------------------------

    try:

        stored_event = create_security_event(
            event_type=detection[
                "rule_id"
            ],

            source=detection[
                "source"
            ],

            target=detection[
                "target"
            ],

            severity=detection[
                "severity"
            ],

            description=detection[
                "description"
            ],
        )


        result.update(
            {
                "event_id":
                    stored_event[
                        "id"
                    ],

                "persisted":
                    True,
            }
        )


    except Exception as exc:

        result.update(
            {
                "event_id":
                    None,

                "persisted":
                    False,

                "persistence_error":
                    str(exc),
            }
        )


        print(
            "[SENTINEL-X ERROR] "
            "Detection generated but "
            "security-event persistence failed: "
            f"{exc}"
        )


        return result


    # -----------------------------------------------------
    # 2. CORRELATED INCIDENT
    #
    # LOW -> MEDIUM -> HIGH -> CRITICAL detections from
    # the same active SCAN-001 campaign reuse one incident
    # rather than creating a new incident at every
    # severity threshold.
    # -----------------------------------------------------

    try:

        stored_incident = create_or_escalate_incident(
            incident_type=detection[
                "rule_id"
            ],

            title=(
                "TCP Multi-Port Scan Detected"
            ),

            severity=detection[
                "severity"
            ],

            source=detection[
                "source"
            ],

            target=detection[
                "target"
            ],

            description=detection[
                "description"
            ],

            linked_event_id=
                stored_event[
                    "id"
                ],
        )


        result.update(
            {
                "incident_id":
                    stored_incident[
                        "id"
                    ],

                "incident_status":
                    stored_incident[
                        "status"
                    ],

                "incident_correlated":
                    stored_incident.get(
                        "correlated",
                        False,
                    ),

                "severity_escalated":
                    stored_incident.get(
                        "severity_escalated",
                        False,
                    ),
            }
        )


    except Exception as exc:

        result.update(
            {
                "incident_id":
                    None,

                "incident_status":
                    None,

                "incident_correlated":
                    False,

                "severity_escalated":
                    False,

                "incident_error":
                    str(exc),
            }
        )


        print(
            "[SENTINEL-X ERROR] "
            "Security event persisted, "
            "but incident correlation failed: "
            f"{exc}"
        )


        return result


    # -----------------------------------------------------
    # 3. DYNAMIC RISK ASSESSMENT v2
    #
    # Preserve a fresh assessment for every meaningful
    # detection/escalation.
    #
    # Unlike Risk Model v1, the numerical score is no
    # longer determined only by categorical values.
    #
    # Dynamic Risk v2 receives actual SCAN-001 evidence:
    #
    #   - unique destination-port count
    #   - observation window
    #   - repeated HIGH behavior
    #
    # This allows attacks of the same categorical severity
    # to receive different numerical risk scores.
    # -----------------------------------------------------

    try:

        stored_risk = create_risk_assessment(
            incident_id=
                stored_incident[
                    "id"
                ],

            severity=
                stored_incident[
                    "severity"
                ],

            incident_status=
                stored_incident[
                    "status"
                ],

            asset_criticality=
                "HIGH",

            detection_confidence=
                "HIGH",

            port_count=
                detection.get(
                    "port_count"
                ),

            window_seconds=
                detection.get(
                    "window_seconds"
                ),

            critical_reason=
                detection.get(
                    "critical_reason"
                ),
        )


        result.update(
            {
                "risk_assessment_id":
                    stored_risk[
                        "id"
                    ],

                "risk_score":
                    stored_risk[
                        "risk_score"
                    ],

                "risk_level":
                    stored_risk[
                        "risk_level"
                    ],

                "traffic_intensity_score":
                    stored_risk.get(
                        "traffic_intensity_score"
                    ),

                "port_intensity_score":
                    stored_risk.get(
                        "port_intensity_score"
                    ),

                "repeated_behavior_bonus":
                    stored_risk.get(
                        "repeated_behavior_bonus"
                    ),

                "risk_rationale":
                    stored_risk.get(
                        "rationale"
                    ),
            }
        )


    except Exception as exc:

        result.update(
            {
                "risk_assessment_id":
                    None,

                "risk_score":
                    None,

                "risk_level":
                    None,

                "traffic_intensity_score":
                    None,

                "port_intensity_score":
                    None,

                "repeated_behavior_bonus":
                    None,

                "risk_rationale":
                    None,

                "risk_error":
                    str(exc),
            }
        )


        print(
            "[SENTINEL-X ERROR] "
            "Incident created/correlated, but "
            "dynamic risk assessment failed: "
            f"{exc}"
        )


        return result


    # -----------------------------------------------------
    # 4. FORENSIC EVIDENCE
    # -----------------------------------------------------

    try:

        evidence_payload = {
            "rule_id":
                detection[
                    "rule_id"
                ],

            "rule_name":
                detection.get(
                    "rule_name"
                ),

            "severity":
                detection.get(
                    "severity"
                ),

            "detection_method":
                detection.get(
                    "detection_method"
                ),

            "protocol":
                detection.get(
                    "protocol"
                ),

            "source":
                detection[
                    "source"
                ],

            "target":
                detection[
                    "target"
                ],

            "unique_ports":
                detection.get(
                    "unique_ports",
                    [],
                ),

            "port_count":
                detection.get(
                    "port_count",
                    0,
                ),

            "window_seconds":
                detection.get(
                    "window_seconds"
                ),

            "detected_at":
                detection.get(
                    "detected_at"
                ),

            "critical_reason":
                detection.get(
                    "critical_reason"
                ),

            "security_event_id":
                stored_event[
                    "id"
                ],

            "incident_id":
                stored_incident[
                    "id"
                ],

            "incident_correlated":
                stored_incident.get(
                    "correlated",
                    False,
                ),

            "severity_escalated":
                stored_incident.get(
                    "severity_escalated",
                    False,
                ),

            "initial_risk_assessment_id":
                stored_risk[
                    "id"
                ],

            "initial_risk_score":
                stored_risk[
                    "risk_score"
                ],

            "initial_risk_level":
                stored_risk[
                    "risk_level"
                ],

            "traffic_intensity_score":
                stored_risk.get(
                    "traffic_intensity_score"
                ),

            "port_intensity_score":
                stored_risk.get(
                    "port_intensity_score"
                ),

            "repeated_behavior_bonus":
                stored_risk.get(
                    "repeated_behavior_bonus"
                ),

            "risk_rationale":
                stored_risk.get(
                    "rationale"
                ),
        }


        stored_evidence = create_forensic_evidence(
            incident_id=
                stored_incident[
                    "id"
                ],

            linked_event_id=
                stored_event[
                    "id"
                ],

            evidence_type=
                "SCAN_DETECTION",

            source=detection[
                "source"
            ],

            target=detection[
                "target"
            ],

            description=(
                "Preserved Sentinel-X "
                f"{detection['severity']} "
                "SCAN-001 detection artifact."
            ),

            evidence_payload=
                evidence_payload,
        )


        result.update(
            {
                "evidence_id":
                    stored_evidence[
                        "id"
                    ],

                "evidence_sha256":
                    stored_evidence[
                        "sha256_hash"
                    ],

                "evidence_integrity":
                    stored_evidence[
                        "integrity_status"
                    ],
            }
        )


    except Exception as exc:

        result.update(
            {
                "evidence_id":
                    None,

                "evidence_sha256":
                    None,

                "evidence_integrity":
                    None,

                "forensics_error":
                    str(exc),
            }
        )


        print(
            "[SENTINEL-X ERROR] "
            "Risk assessment created, "
            "but forensic preservation failed: "
            f"{exc}"
        )


        return result


    # -----------------------------------------------------
    # PIPELINE SUCCESS
    # -----------------------------------------------------

    correlation_label = (
        "CORRELATED"
        if stored_incident.get(
            "correlated",
            False,
        )
        else "NEW"
    )


    print(
        "[SENTINEL-X RESPONSE] "
        f"{detection['rule_id']} | "
        f"{detection['severity']} | "
        f"{detection['source']} -> "
        f"{detection['target']} | "
        f"PORTS "
        f"{detection.get('port_count', 0)} | "
        f"EVENT #{stored_event['id']} | "
        f"INCIDENT #{stored_incident['id']} "
        f"({correlation_label}) | "
        f"RISK {stored_risk['risk_score']}/100 "
        f"{stored_risk['risk_level']} | "
        f"INTENSITY "
        f"{stored_risk.get('traffic_intensity_score')} | "
        f"EVIDENCE #{stored_evidence['id']} | "
        f"SHA256 "
        f"{stored_evidence['sha256_hash'][:12]}..."
    )


    return result
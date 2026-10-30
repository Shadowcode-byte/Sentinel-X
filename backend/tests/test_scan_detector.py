from datetime import timedelta

from app.detection.scan_detector import ScanDetector


# =========================================================
# Sentinel-X SCAN-001 Test Configuration
# =========================================================

ATTACKER = "192.168.137.36"
TARGET = "192.168.137.1"


def inspect(
    detector,
    port,
    *,
    source=ATTACKER,
    destination=TARGET,
    protocol="TCP",
    direction="INBOUND",
    tcp_syn=True,
    tcp_ack=False,
):
    """
    Send one deterministic packet observation into SCAN-001.
    """

    return detector.inspect(
        source=source,
        destination=destination,
        destination_port=port,
        protocol=protocol,
        direction=direction,
        monitored_host=TARGET,
        tcp_syn=tcp_syn,
        tcp_ack=tcp_ack,
    )


# =========================================================
# Original SCAN-001 Filtering Tests
# =========================================================


def test_non_tcp_does_not_trigger():
    """
    Non-TCP traffic must never trigger SCAN-001.
    """

    detector = ScanDetector()

    result = None

    for port in range(20, 40):

        current = inspect(
            detector,
            port,
            protocol="UDP",
        )

        if current is not None:
            result = current

    assert result is None


def test_outbound_does_not_trigger():
    """
    SCAN-001 evaluates inbound traffic only.
    """

    detector = ScanDetector()

    result = None

    for port in range(20, 40):

        current = inspect(
            detector,
            port,
            direction="OUTBOUND",
        )

        if current is not None:
            result = current

    assert result is None


def test_syn_ack_does_not_trigger():
    """
    SYN/ACK packets are responses rather than initial
    connection attempts and must not trigger SCAN-001.
    """

    detector = ScanDetector()

    result = None

    for port in range(20, 40):

        current = inspect(
            detector,
            port,
            tcp_syn=True,
            tcp_ack=True,
        )

        if current is not None:
            result = current

    assert result is None


def test_duplicate_port_does_not_increase_unique_count():
    """
    Repeated SYN packets to one destination port must not
    increase the unique destination-port count.
    """

    detector = ScanDetector()

    detections = []

    for _ in range(20):

        result = inspect(
            detector,
            22,
        )

        if result is not None:
            detections.append(result)

    assert detections == []


# =========================================================
# Original HIGH Threshold Compatibility
# =========================================================


def test_seven_unique_ports_do_not_trigger_original_high():
    """
    Seven unique ports must not trigger HIGH.

    LOW and MEDIUM detections may occur while reaching seven
    ports, but HIGH must still require eight.
    """

    detector = ScanDetector()

    detections = []

    for port in range(20, 27):

        result = inspect(
            detector,
            port,
        )

        if result is not None:
            detections.append(result)

    high_detections = [
        detection
        for detection in detections
        if detection["severity"] == "HIGH"
    ]

    assert high_detections == []


def test_eight_unique_ports_trigger_high_scan001():
    """
    Preserve the original SCAN-001 HIGH threshold:

        8 unique inbound TCP SYN ports / 10 seconds.
    """

    detector = ScanDetector()

    detections = []

    for port in range(20, 28):

        result = inspect(
            detector,
            port,
        )

        if result is not None:
            detections.append(result)

    high_detections = [
        detection
        for detection in detections
        if (
            detection["severity"] == "HIGH"
            and detection["port_count"] == 8
        )
    ]

    assert len(high_detections) == 1

    high = high_detections[0]

    assert high["rule_id"] == "SCAN-001"
    assert high["source"] == ATTACKER
    assert high["target"] == TARGET
    assert high["protocol"] == "TCP"
    assert high["port_count"] == 8


# =========================================================
# Multi-Severity Threshold Tests
# =========================================================


def test_three_unique_ports_trigger_low():
    """
    LOW threshold:

        3 unique inbound TCP SYN destination ports.
    """

    detector = ScanDetector()

    detections = []

    for port in range(20, 23):

        result = inspect(
            detector,
            port,
        )

        if result is not None:
            detections.append(result)

    low = [
        detection
        for detection in detections
        if (
            detection["severity"] == "LOW"
            and detection["port_count"] == 3
        )
    ]

    assert len(low) == 1


def test_five_unique_ports_trigger_medium():
    """
    MEDIUM threshold:

        5 unique inbound TCP SYN destination ports.
    """

    detector = ScanDetector()

    detections = []

    for port in range(20, 25):

        result = inspect(
            detector,
            port,
        )

        if result is not None:
            detections.append(result)

    medium = [
        detection
        for detection in detections
        if (
            detection["severity"] == "MEDIUM"
            and detection["port_count"] == 5
        )
    ]

    assert len(medium) == 1


def test_eight_unique_ports_still_reach_high():
    """
    LOW and MEDIUM escalation must not suppress the original
    HIGH threshold.
    """

    detector = ScanDetector()

    detections = []

    for port in range(20, 28):

        result = inspect(
            detector,
            port,
        )

        if result is not None:
            detections.append(result)

    assert any(
        detection["severity"] == "LOW"
        for detection in detections
    )

    assert any(
        detection["severity"] == "MEDIUM"
        for detection in detections
    )

    assert any(
        detection["severity"] == "HIGH"
        for detection in detections
    )


# =========================================================
# CRITICAL Behavioral Tests
# =========================================================


def test_single_high_scan_does_not_become_critical():
    """
    A single HIGH scan must remain HIGH.

    CRITICAL requires additional behavioral evidence.
    """

    detector = ScanDetector()

    detections = []

    for port in range(20, 28):

        result = inspect(
            detector,
            port,
        )

        if result is not None:
            detections.append(result)

    assert any(
        detection["severity"] == "HIGH"
        for detection in detections
    )

    assert not any(
        detection["severity"] == "CRITICAL"
        for detection in detections
    )


def test_more_ports_in_same_window_do_not_automatically_become_critical():
    """
    A larger port count during one observation window must
    not automatically convert HIGH into CRITICAL.

    CRITICAL requires a distinct repeated HIGH burst.
    """

    detector = ScanDetector()

    detections = []

    for port in range(20, 40):

        result = inspect(
            detector,
            port,
        )

        if result is not None:
            detections.append(result)

    critical_detections = [
        detection
        for detection in detections
        if detection["severity"] == "CRITICAL"
    ]

    assert critical_detections == []


def test_repeated_high_scan_can_escalate_to_critical():
    """
    Two distinct HIGH-strength bursts from the same source
    provide behavioral evidence for CRITICAL.
    """

    detector = ScanDetector()

    first_detections = []

    for port in range(20, 28):

        result = inspect(
            detector,
            port,
        )

        if result is not None:
            first_detections.append(result)

    assert any(
        detection["severity"] == "HIGH"
        for detection in first_detections
    )

    detector.reset_observation_window(
        ATTACKER
    )

    second_detections = []

    for port in range(100, 108):

        result = inspect(
            detector,
            port,
        )

        if result is not None:
            second_detections.append(result)

    critical = [
        detection
        for detection in second_detections
        if detection["severity"] == "CRITICAL"
    ]

    assert len(critical) == 1

    assert (
        critical[0]["critical_reason"]
        == "REPEATED_HIGH_SCAN"
    )


def test_expired_window_automatically_starts_new_burst():
    """
    Live operation must automatically recognize a new scan
    burst after the previous 10-second observation window
    expires.

    The packet collector must not need to manually call
    reset_observation_window().
    """

    detector = ScanDetector()

    first_detections = []

    for port in range(20, 28):

        result = inspect(
            detector,
            port,
        )

        if result is not None:
            first_detections.append(result)

    assert any(
        detection["severity"] == "HIGH"
        for detection in first_detections
    )

    # Simulate expiration of the previous burst.
    for observation in detector._observations[
        ATTACKER
    ]:

        observation["time"] = (
            observation["time"]
            - timedelta(seconds=11)
        )

    second_detections = []

    for port in range(100, 108):

        result = inspect(
            detector,
            port,
        )

        if result is not None:
            second_detections.append(result)

    critical = [
        detection
        for detection in second_detections
        if detection["severity"] == "CRITICAL"
    ]

    assert len(critical) == 1

    assert (
        critical[0]["critical_reason"]
        == "REPEATED_HIGH_SCAN"
    )


# =========================================================
# Dynamic Risk v2
# Same-Severity Intensity Checkpoints
# =========================================================


def test_low_intensity_checkpoint_at_four_ports():
    """
    LOW initially triggers at 3 ports.

    Port 4 is still LOW but represents greater traffic
    intensity, so it should produce one controlled update.
    """

    detector = ScanDetector()

    detections = []

    for port in range(20, 24):

        result = inspect(
            detector,
            port,
        )

        if result is not None:
            detections.append(result)

    low_counts = [
        detection["port_count"]
        for detection in detections
        if detection["severity"] == "LOW"
    ]

    assert low_counts == [
        3,
        4,
    ]


def test_medium_does_not_emit_every_additional_port():
    """
    MEDIUM starts at 5 ports.

    Port 6 must not generate another detection because that
    would create unnecessary event/risk/evidence flooding.
    """

    detector = ScanDetector()

    detections = []

    for port in range(20, 26):

        result = inspect(
            detector,
            port,
        )

        if result is not None:
            detections.append(result)

    medium_counts = [
        detection["port_count"]
        for detection in detections
        if detection["severity"] == "MEDIUM"
    ]

    assert medium_counts == [5]


def test_medium_intensity_checkpoint_at_seven_ports():
    """
    MEDIUM produces controlled updates at 5 and 7 ports,
    but not at port 6.
    """

    detector = ScanDetector()

    detections = []

    for port in range(20, 27):

        result = inspect(
            detector,
            port,
        )

        if result is not None:
            detections.append(result)

    medium_counts = [
        detection["port_count"]
        for detection in detections
        if detection["severity"] == "MEDIUM"
    ]

    assert medium_counts == [
        5,
        7,
    ]


def test_high_intensity_checkpoints_are_controlled():
    """
    HIGH begins at 8 ports.

    Large scans generate selected intensity updates instead
    of creating an event for every destination port.

    Checkpoints:

        8
        12
        20
        35
        50
        75
        100
    """

    detector = ScanDetector()

    detections = []

    for port in range(1000, 1100):

        result = inspect(
            detector,
            port,
        )

        if result is not None:
            detections.append(result)

    high_counts = [
        detection["port_count"]
        for detection in detections
        if detection["severity"] == "HIGH"
    ]

    assert high_counts == [
        8,
        12,
        20,
        35,
        50,
        75,
        100,
    ]


def test_high_does_not_emit_between_checkpoints():
    """
    A 20-port scan must not produce HIGH events for every
    port between the selected intensity checkpoints.
    """

    detector = ScanDetector()

    detections = []

    for port in range(2000, 2020):

        result = inspect(
            detector,
            port,
        )

        if result is not None:
            detections.append(result)

    high_counts = [
        detection["port_count"]
        for detection in detections
        if detection["severity"] == "HIGH"
    ]

    assert high_counts == [
        8,
        12,
        20,
    ]


def test_same_severity_checkpoint_marks_intensity_update():
    """
    Same-severity checkpoint detections explicitly identify
    themselves as traffic-intensity updates.
    """

    detector = ScanDetector()

    detections = []

    for port in range(20, 24):

        result = inspect(
            detector,
            port,
        )

        if result is not None:
            detections.append(result)

    assert len(detections) == 2

    initial_low = detections[0]
    stronger_low = detections[1]

    assert initial_low["port_count"] == 3

    assert (
        initial_low.get(
            "intensity_update",
            False,
        )
        is False
    )

    assert stronger_low["port_count"] == 4

    assert (
        stronger_low["intensity_update"]
        is True
    )


def test_severity_escalation_is_not_marked_as_intensity_update():
    """
    LOW -> MEDIUM and MEDIUM -> HIGH are actual severity
    escalations, not same-severity intensity updates.
    """

    detector = ScanDetector()

    detections = []

    for port in range(20, 29):

        result = inspect(
            detector,
            port,
        )

        if result is not None:
            detections.append(result)

    medium = next(
        detection
        for detection in detections
        if (
            detection["severity"] == "MEDIUM"
            and detection["port_count"] == 5
        )
    )

    high = next(
        detection
        for detection in detections
        if (
            detection["severity"] == "HIGH"
            and detection["port_count"] == 8
        )
    )

    assert (
        medium.get(
            "intensity_update",
            False,
        )
        is False
    )

    assert (
        high.get(
            "intensity_update",
            False,
        )
        is False
    )


def test_intensity_checkpoints_do_not_break_critical_behavior():
    """
    HIGH intensity checkpoints in one burst must never
    produce CRITICAL.

    CRITICAL still requires a second distinct HIGH-strength
    burst from the same source.
    """

    detector = ScanDetector()

    first_burst = []

    for port in range(20, 40):

        result = inspect(
            detector,
            port,
        )

        if result is not None:
            first_burst.append(result)

    assert not any(
        detection["severity"] == "CRITICAL"
        for detection in first_burst
    )

    detector.reset_observation_window(
        ATTACKER
    )

    second_burst = []

    for port in range(100, 108):

        result = inspect(
            detector,
            port,
        )

        if result is not None:
            second_burst.append(result)

    critical = [
        detection
        for detection in second_burst
        if detection["severity"] == "CRITICAL"
    ]

    assert len(critical) == 1

    assert (
        critical[0]["critical_reason"]
        == "REPEATED_HIGH_SCAN"
    )


def test_checkpoint_detection_preserves_scan_evidence():
    """
    Intensity updates must preserve normal SCAN-001
    evidence fields for downstream risk and forensics.
    """

    detector = ScanDetector()

    detections = []

    for port in range(20, 24):

        result = inspect(
            detector,
            port,
        )

        if result is not None:
            detections.append(result)

    checkpoint = detections[-1]

    assert checkpoint["rule_id"] == "SCAN-001"
    assert checkpoint["severity"] == "LOW"
    assert checkpoint["source"] == ATTACKER
    assert checkpoint["target"] == TARGET
    assert checkpoint["protocol"] == "TCP"
    assert checkpoint["port_count"] == 4
    assert checkpoint["window_seconds"] == 10

    assert checkpoint["unique_ports"] == [
        20,
        21,
        22,
        23,
    ]
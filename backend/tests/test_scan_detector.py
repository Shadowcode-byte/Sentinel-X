from datetime import timedelta

from app.detection.scan_detector import ScanDetector


MONITORED_HOST = "192.168.137.1"
ATTACKER = "192.168.137.36"


def inspect(detector, port, **overrides):
    values = {
        "source": ATTACKER,
        "destination": MONITORED_HOST,
        "destination_port": port,
        "protocol": "TCP",
        "direction": "INBOUND",
        "monitored_host": MONITORED_HOST,
        "tcp_syn": True,
        "tcp_ack": False,
    }

    values.update(overrides)

    return detector.inspect(**values)


# ---------------------------------------------------------
# BASELINE / FALSE-POSITIVE TESTS
# ---------------------------------------------------------

def test_non_tcp_does_not_trigger():
    detector = ScanDetector()

    result = inspect(
        detector,
        80,
        protocol="UDP",
    )

    assert result is None


def test_outbound_does_not_trigger():
    detector = ScanDetector()

    result = inspect(
        detector,
        80,
        direction="OUTBOUND",
    )

    assert result is None


def test_syn_ack_does_not_trigger():
    detector = ScanDetector()

    result = inspect(
        detector,
        80,
        tcp_ack=True,
    )

    assert result is None


def test_duplicate_port_does_not_increase_unique_count():
    detector = ScanDetector()

    result = None

    for _ in range(10):
        result = inspect(detector, 80)

    assert result is None


# ---------------------------------------------------------
# ORIGINAL SCAN-001 HIGH BASELINE
# ---------------------------------------------------------

def test_seven_unique_ports_do_not_trigger_original_high():
    """
    Fewer than 8 unique ports must never produce HIGH.

    LOW and MEDIUM detections are allowed.
    """

    detector = ScanDetector()

    detections = []

    for port in range(20, 27):
        result = inspect(detector, port)

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
    Preserve the verified original SCAN-001 rule:

    8 unique TCP SYN destination ports
    within 10 seconds = HIGH.
    """

    detector = ScanDetector()

    detections = []

    for port in range(20, 28):
        result = inspect(detector, port)

        if result is not None:
            detections.append(result)

    high_detections = [
        detection
        for detection in detections
        if detection["severity"] == "HIGH"
    ]

    assert len(high_detections) == 1

    result = high_detections[0]

    assert result["rule_id"] == "SCAN-001"
    assert result["severity"] == "HIGH"
    assert result["detection_method"] == "TCP_SYN_MULTI_PORT"
    assert result["port_count"] == 8


# ---------------------------------------------------------
# MULTI-SEVERITY TESTS
# ---------------------------------------------------------

def test_three_unique_ports_trigger_low():
    """
    LOW:
    3 unique inbound TCP SYN destination ports.
    """

    detector = ScanDetector()

    detections = []

    for port in range(20, 23):
        result = inspect(detector, port)

        if result is not None:
            detections.append(result)

    low_detections = [
        detection
        for detection in detections
        if detection["severity"] == "LOW"
    ]

    assert len(low_detections) == 1

    result = low_detections[0]

    assert result["rule_id"] == "SCAN-001"
    assert result["severity"] == "LOW"
    assert result["port_count"] == 3


def test_five_unique_ports_trigger_medium():
    """
    MEDIUM:
    5 unique inbound TCP SYN destination ports.
    """

    detector = ScanDetector()

    detections = []

    for port in range(20, 25):
        result = inspect(detector, port)

        if result is not None:
            detections.append(result)

    medium_detections = [
        detection
        for detection in detections
        if detection["severity"] == "MEDIUM"
    ]

    assert len(medium_detections) == 1

    result = medium_detections[0]

    assert result["rule_id"] == "SCAN-001"
    assert result["severity"] == "MEDIUM"
    assert result["port_count"] == 5


def test_eight_unique_ports_still_reach_high():
    """
    LOW and MEDIUM must not prevent the same scan from
    escalating to the original HIGH threshold.
    """

    detector = ScanDetector()

    detections = []

    for port in range(20, 28):
        result = inspect(detector, port)

        if result is not None:
            detections.append(result)

    high_detections = [
        detection
        for detection in detections
        if detection["severity"] == "HIGH"
    ]

    assert len(high_detections) == 1

    result = high_detections[0]

    assert result["rule_id"] == "SCAN-001"
    assert result["severity"] == "HIGH"
    assert result["port_count"] == 8


# ---------------------------------------------------------
# CRITICAL ESCALATION TESTS
# ---------------------------------------------------------

def test_single_high_scan_does_not_become_critical():
    """
    A single HIGH scan must remain HIGH.

    CRITICAL requires additional behavioral evidence.
    """

    detector = ScanDetector()

    detections = []

    for port in range(20, 28):
        result = inspect(detector, port)

        if result is not None:
            detections.append(result)

    critical_detections = [
        detection
        for detection in detections
        if detection["severity"] == "CRITICAL"
    ]

    high_detections = [
        detection
        for detection in detections
        if detection["severity"] == "HIGH"
    ]

    assert critical_detections == []
    assert len(high_detections) == 1


def test_more_ports_in_same_window_do_not_automatically_become_critical():
    """
    Sending additional ports during the same scan window
    must not automatically convert HIGH into CRITICAL.

    CRITICAL requires a distinct repeated HIGH burst.
    """

    detector = ScanDetector()

    detections = []

    for port in range(20, 40):
        result = inspect(detector, port)

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
    Two distinct HIGH-strength scan bursts from the same
    source provide additional evidence for CRITICAL.

    This test explicitly separates the two observation
    windows while preserving recent HIGH history.
    """

    detector = ScanDetector()

    # First HIGH-strength burst.
    first_detections = []

    for port in range(20, 28):
        result = inspect(detector, port)

        if result is not None:
            first_detections.append(result)

    assert any(
        detection["severity"] == "HIGH"
        for detection in first_detections
    )

    # End the first short observation window while
    # preserving HIGH behavioral history.
    detector.reset_observation_window(ATTACKER)

    # Second distinct HIGH-strength burst.
    second_detections = []

    for port in range(100, 108):
        result = inspect(detector, port)

        if result is not None:
            second_detections.append(result)

    critical_detections = [
        detection
        for detection in second_detections
        if detection["severity"] == "CRITICAL"
    ]

    assert len(critical_detections) == 1

    result = critical_detections[0]

    assert result["rule_id"] == "SCAN-001"
    assert result["severity"] == "CRITICAL"
    assert result["detection_method"] == "TCP_SYN_MULTI_PORT"
    assert result["critical_reason"] == "REPEATED_HIGH_SCAN"


# ---------------------------------------------------------
# AUTOMATIC LIVE-WINDOW TEST
# ---------------------------------------------------------

def test_expired_window_automatically_starts_new_burst():
    """
    Live operation must automatically recognize a new scan
    burst after the previous 10-second observation window
    has expired.

    The packet collector should not need to manually call
    reset_observation_window().
    """

    detector = ScanDetector()

    # -----------------------------------------------------
    # First burst reaches HIGH
    # -----------------------------------------------------

    first_detections = []

    for port in range(20, 28):
        result = inspect(detector, port)

        if result is not None:
            first_detections.append(result)

    assert any(
        detection["severity"] == "HIGH"
        for detection in first_detections
    )


    # -----------------------------------------------------
    # Simulate passage of more than 10 seconds
    #
    # Move the stored observations into the past so the
    # detector should automatically expire them when the
    # next packet arrives.
    # -----------------------------------------------------

    for observation in detector._observations[ATTACKER]:

        observation["time"] = (
            observation["time"]
            - timedelta(seconds=11)
        )


    # -----------------------------------------------------
    # Second distinct burst
    # -----------------------------------------------------

    second_detections = []

    for port in range(100, 108):
        result = inspect(detector, port)

        if result is not None:
            second_detections.append(result)


    # -----------------------------------------------------
    # The new HIGH burst should correlate with the earlier
    # HIGH burst and produce CRITICAL automatically.
    # -----------------------------------------------------

    critical_detections = [
        detection
        for detection in second_detections
        if detection["severity"] == "CRITICAL"
    ]

    assert len(critical_detections) == 1

    result = critical_detections[0]

    assert result["rule_id"] == "SCAN-001"
    assert result["severity"] == "CRITICAL"

    assert (
        result["critical_reason"]
        == "REPEATED_HIGH_SCAN"
    )
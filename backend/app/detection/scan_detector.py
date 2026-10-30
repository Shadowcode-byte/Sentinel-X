from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from threading import Lock


# ---------------------------------------------------------
# Sentinel-X Detection Rule
# SCAN-001 // TCP Multi-Port Scan
# ---------------------------------------------------------

RULE_ID = "SCAN-001"
RULE_NAME = "TCP MULTI-PORT SCAN"

WINDOW_SECONDS = 10
ALERT_COOLDOWN_SECONDS = 60
CRITICAL_HISTORY_SECONDS = 60

LOW_PORT_THRESHOLD = 3
MEDIUM_PORT_THRESHOLD = 5
HIGH_PORT_THRESHOLD = 8


SEVERITY_RANK = {
    "LOW": 1,
    "MEDIUM": 2,
    "HIGH": 3,
    "CRITICAL": 4,
}


class ScanDetector:
    """
    Sentinel-X SCAN-001 multi-severity detector.

    LOW:
        3 unique TCP SYN destination ports / 10 seconds

    MEDIUM:
        5 unique TCP SYN destination ports / 10 seconds

    HIGH:
        8 unique TCP SYN destination ports / 10 seconds

    CRITICAL:
        A second distinct HIGH-strength scan burst from the
        same source within 60 seconds.

    Only inbound initial TCP SYN packets are evaluated:

        SYN = 1
        ACK = 0
    """

    def __init__(self):
        self._lock = Lock()

        # Short-term packet observations.
        self._observations = defaultdict(deque)

        # Detection suppression / escalation state.
        self._last_alert = {}
        self._last_severity = {}

        # Previous HIGH-burst history used for CRITICAL
        # correlation.
        self._last_high_burst = {}

        # True once the current observation burst has
        # already reached HIGH.
        self._high_recorded_in_current_burst = {}


    def inspect(
        self,
        source,
        destination,
        destination_port,
        protocol,
        direction,
        monitored_host,
        tcp_syn=False,
        tcp_ack=False,
    ):
        """
        Inspect one observed packet.

        Returns a detection when a new severity threshold
        is reached.

        Otherwise returns None.
        """

        # -------------------------------------------------
        # Basic filtering
        # -------------------------------------------------

        if protocol != "TCP":
            return None

        if direction != "INBOUND":
            return None

        if destination != monitored_host:
            return None

        if destination_port is None:
            return None


        # -------------------------------------------------
        # Count only initial connection attempts
        #
        # SYN = 1
        # ACK = 0
        # -------------------------------------------------

        if not tcp_syn:
            return None

        if tcp_ack:
            return None


        now = datetime.now(timezone.utc)

        window_start = (
            now
            - timedelta(
                seconds=WINDOW_SECONDS
            )
        )


        with self._lock:

            observations = self._observations[source]


            # ---------------------------------------------
            # Determine whether the PREVIOUS burst has
            # completely expired BEFORE adding this packet.
            #
            # If every previous observation is older than
            # the active window, this packet begins a new
            # distinct scan burst.
            # ---------------------------------------------

            previous_burst_expired = False

            if observations:

                newest_previous_observation = (
                    observations[-1]["time"]
                )

                if (
                    newest_previous_observation
                    < window_start
                ):
                    previous_burst_expired = True


            # ---------------------------------------------
            # Remove expired observations
            # ---------------------------------------------

            while (
                observations
                and observations[0]["time"] < window_start
            ):
                observations.popleft()


            # ---------------------------------------------
            # Automatically reset CURRENT-burst state when
            # the old observation window has expired.
            #
            # Important:
            # _last_high_burst is intentionally preserved.
            # It provides the historical evidence needed
            # for CRITICAL correlation.
            # ---------------------------------------------

            if previous_burst_expired:

                self._last_alert.pop(
                    source,
                    None,
                )

                self._last_severity.pop(
                    source,
                    None,
                )

                self._high_recorded_in_current_burst.pop(
                    source,
                    None,
                )


            # ---------------------------------------------
            # Add current packet
            # ---------------------------------------------

            observations.append(
                {
                    "time": now,
                    "port": int(destination_port),
                }
            )


            # ---------------------------------------------
            # Unique destination ports
            # ---------------------------------------------

            unique_ports = sorted(
                {
                    observation["port"]
                    for observation in observations
                }
            )

            port_count = len(unique_ports)


            # ---------------------------------------------
            # Base severity
            # ---------------------------------------------

            if port_count >= HIGH_PORT_THRESHOLD:

                severity = "HIGH"

            elif port_count >= MEDIUM_PORT_THRESHOLD:

                severity = "MEDIUM"

            elif port_count >= LOW_PORT_THRESHOLD:

                severity = "LOW"

            else:

                return None


            critical_reason = None


            # ---------------------------------------------
            # CRITICAL correlation
            #
            # Only evaluate repeated-HIGH behavior the
            # FIRST time the CURRENT burst reaches HIGH.
            # ---------------------------------------------

            current_burst_already_high = (
                self._high_recorded_in_current_burst.get(
                    source,
                    False,
                )
            )


            if (
                severity == "HIGH"
                and not current_burst_already_high
            ):

                previous_high = (
                    self._last_high_burst.get(
                        source
                    )
                )


                if previous_high is not None:

                    critical_history_start = (
                        now
                        - timedelta(
                            seconds=
                            CRITICAL_HISTORY_SECONDS
                        )
                    )


                    if (
                        previous_high
                        >= critical_history_start
                    ):

                        severity = "CRITICAL"

                        critical_reason = (
                            "REPEATED_HIGH_SCAN"
                        )


                # Current burst has reached HIGH.
                self._high_recorded_in_current_burst[
                    source
                ] = True


                # Store HIGH history for a FUTURE distinct
                # burst.
                #
                # If this burst became CRITICAL, preserve
                # the previous HIGH evidence rather than
                # replacing it.
                if severity == "HIGH":

                    self._last_high_burst[
                        source
                    ] = now


            # ---------------------------------------------
            # Cooldown / severity escalation
            # ---------------------------------------------

            previous_alert = (
                self._last_alert.get(
                    source
                )
            )

            previous_severity = (
                self._last_severity.get(
                    source
                )
            )


            if previous_alert is not None:

                cooldown_end = (
                    previous_alert
                    + timedelta(
                        seconds=
                        ALERT_COOLDOWN_SECONDS
                    )
                )


                if now < cooldown_end:

                    if previous_severity is not None:

                        previous_rank = (
                            SEVERITY_RANK.get(
                                previous_severity,
                                0,
                            )
                        )

                        current_rank = (
                            SEVERITY_RANK.get(
                                severity,
                                0,
                            )
                        )


                        # Same/lower severity is duplicate.
                        # Higher severity is escalation.
                        if current_rank <= previous_rank:
                            return None


            self._last_alert[
                source
            ] = now

            self._last_severity[
                source
            ] = severity


            # ---------------------------------------------
            # Detection result
            # ---------------------------------------------

            detection = {
                "rule_id":
                    RULE_ID,

                "rule_name":
                    RULE_NAME,

                "severity":
                    severity,

                "source":
                    source,

                "target":
                    monitored_host,

                "protocol":
                    "TCP",

                "detection_method":
                    "TCP_SYN_MULTI_PORT",

                "unique_ports":
                    unique_ports,

                "port_count":
                    port_count,

                "window_seconds":
                    WINDOW_SECONDS,

                "detected_at":
                    now.isoformat(),

                "description": (
                    f"{RULE_ID}: {severity} TCP multi-port "
                    f"scan activity detected from {source} "
                    f"against {monitored_host}. "
                    f"{port_count} unique TCP destination "
                    f"ports received initial SYN connection "
                    f"attempts within {WINDOW_SECONDS} "
                    f"seconds."
                ),
            }


            if critical_reason is not None:

                detection[
                    "critical_reason"
                ] = critical_reason

                detection[
                    "description"
                ] = (
                    f"{RULE_ID}: CRITICAL repeated TCP "
                    f"multi-port scanning detected from "
                    f"{source} against {monitored_host}. "
                    f"A second distinct HIGH-strength "
                    f"scan burst was observed within "
                    f"{CRITICAL_HISTORY_SECONDS} seconds."
                )


            return detection


    def reset_observation_window(
        self,
        source=None,
    ):
        """
        Manually end the current short observation burst
        while preserving previous HIGH behavioral history.

        Live operation does not require this method because
        expired windows are detected automatically.

        It remains useful for deterministic tests.
        """

        with self._lock:

            if source is None:

                self._observations.clear()

                self._last_alert.clear()

                self._last_severity.clear()

                self._high_recorded_in_current_burst.clear()

            else:

                self._observations.pop(
                    source,
                    None,
                )

                self._last_alert.pop(
                    source,
                    None,
                )

                self._last_severity.pop(
                    source,
                    None,
                )

                self._high_recorded_in_current_burst.pop(
                    source,
                    None,
                )


    def reset(self):
        """
        Completely reset all SCAN-001 detector state.
        """

        with self._lock:

            self._observations.clear()

            self._last_alert.clear()

            self._last_severity.clear()

            self._last_high_burst.clear()

            self._high_recorded_in_current_burst.clear()


# ---------------------------------------------------------
# Shared Sentinel-X Detector
# ---------------------------------------------------------

scan_detector = ScanDetector()
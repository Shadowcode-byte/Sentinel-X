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


# ---------------------------------------------------------
# Dynamic Risk v2 intensity checkpoints
# ---------------------------------------------------------

INTENSITY_CHECKPOINTS = {
    "LOW": {
        4,
    },

    "MEDIUM": {
        7,
    },

    "HIGH": {
        12,
        20,
        35,
        50,
        75,
        100,
    },
}


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

    Dynamic Risk v2 intensity checkpoints:

        LOW:
            4

        MEDIUM:
            7

        HIGH:
            12, 20, 35, 50, 75, 100

    Each intensity checkpoint may be emitted only once
    during the current observation burst.

    This prevents Nmap retries or duplicate SYN packets from
    creating duplicate event/risk/evidence records.

    Only inbound initial TCP connection attempts are used:

        SYN = 1
        ACK = 0
    """

    def __init__(self):

        self._lock = Lock()

        # Short-term packet observations.
        self._observations = defaultdict(
            deque
        )

        # Detection suppression / escalation state.
        self._last_alert = {}

        self._last_severity = {}

        # Previous HIGH-burst history used for CRITICAL.
        self._last_high_burst = {}

        # True after the current burst first reaches HIGH.
        self._high_recorded_in_current_burst = {}

        # Same-severity intensity checkpoints already
        # emitted during the current burst.
        #
        # Example:
        #
        # source -> {
        #     ("LOW", 4),
        #     ("MEDIUM", 7),
        #     ("HIGH", 12),
        # }
        self._emitted_intensity_checkpoints = defaultdict(
            set
        )


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

        Returns a detection when:

        - a new severity threshold is reached
        - severity escalates
        - a configured intensity checkpoint is reached

        Each same-severity checkpoint is emitted only once
        during one observation burst.
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
        # Count only initial TCP connection attempts
        #
        # SYN = 1
        # ACK = 0
        # -------------------------------------------------

        if not tcp_syn:
            return None

        if tcp_ack:
            return None


        now = datetime.now(
            timezone.utc
        )


        window_start = (
            now
            - timedelta(
                seconds=
                    WINDOW_SECONDS
            )
        )


        with self._lock:

            observations = (
                self._observations[
                    source
                ]
            )


            # ---------------------------------------------
            # Determine whether the previous burst has
            # completely expired before adding this packet.
            # ---------------------------------------------

            previous_burst_expired = False


            if observations:

                newest_previous_observation = (
                    observations[-1][
                        "time"
                    ]
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
                and observations[0]["time"]
                < window_start
            ):

                observations.popleft()


            # ---------------------------------------------
            # Start a new distinct observation burst.
            #
            # IMPORTANT:
            #
            # _last_high_burst is intentionally preserved.
            # It provides the historical evidence required
            # for repeated-HIGH -> CRITICAL correlation.
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

                self._emitted_intensity_checkpoints.pop(
                    source,
                    None,
                )


            # ---------------------------------------------
            # Add current observation
            # ---------------------------------------------

            observations.append(
                {
                    "time":
                        now,

                    "port":
                        int(
                            destination_port
                        ),
                }
            )


            # ---------------------------------------------
            # Unique destination ports
            # ---------------------------------------------

            unique_ports = sorted(
                {
                    observation[
                        "port"
                    ]
                    for observation
                    in observations
                }
            )


            port_count = len(
                unique_ports
            )


            # ---------------------------------------------
            # Base severity
            # ---------------------------------------------

            if (
                port_count
                >= HIGH_PORT_THRESHOLD
            ):

                severity = "HIGH"


            elif (
                port_count
                >= MEDIUM_PORT_THRESHOLD
            ):

                severity = "MEDIUM"


            elif (
                port_count
                >= LOW_PORT_THRESHOLD
            ):

                severity = "LOW"


            else:

                return None


            critical_reason = None


            # ---------------------------------------------
            # CRITICAL correlation
            #
            # Only evaluate repeated-HIGH behavior the first
            # time the CURRENT distinct burst reaches HIGH.
            #
            # HIGH intensity checkpoints such as 12, 20,
            # 35, etc. must NOT themselves become CRITICAL.
            # ---------------------------------------------

            current_burst_already_high = (
                self
                ._high_recorded_in_current_burst
                .get(
                    source,
                    False,
                )
            )


            if (
                severity == "HIGH"
                and not current_burst_already_high
            ):

                previous_high = (
                    self
                    ._last_high_burst
                    .get(
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

                        severity = (
                            "CRITICAL"
                        )

                        critical_reason = (
                            "REPEATED_HIGH_SCAN"
                        )


                # Current burst has reached HIGH.
                self._high_recorded_in_current_burst[
                    source
                ] = True


                # Store an ordinary HIGH burst for future
                # repeated-HIGH correlation.
                #
                # If this burst became CRITICAL, preserve
                # the earlier HIGH evidence instead.
                if severity == "HIGH":

                    self._last_high_burst[
                        source
                    ] = now


            # ---------------------------------------------
            # Previous emitted state
            # ---------------------------------------------

            previous_severity = (
                self
                ._last_severity
                .get(
                    source
                )
            )


            previous_alert = (
                self
                ._last_alert
                .get(
                    source
                )
            )


            intensity_update = False


            # ---------------------------------------------
            # Determine whether a detection should emit.
            # ---------------------------------------------

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


                # -----------------------------------------
                # Higher severity = valid escalation
                # -----------------------------------------

                if (
                    current_rank
                    > previous_rank
                ):

                    intensity_update = False


                # -----------------------------------------
                # Same severity
                #
                # Only configured checkpoints are allowed.
                # -----------------------------------------

                elif (
                    current_rank
                    == previous_rank
                ):

                    checkpoints = (
                        INTENSITY_CHECKPOINTS
                        .get(
                            severity,
                            set(),
                        )
                    )


                    if (
                        port_count
                        not in checkpoints
                    ):

                        return None


                    checkpoint_key = (
                        severity,
                        port_count,
                    )


                    already_emitted = (
                        checkpoint_key
                        in self
                        ._emitted_intensity_checkpoints[
                            source
                        ]
                    )


                    # -------------------------------------
                    # Duplicate checkpoint protection
                    #
                    # Nmap retries may leave the unique
                    # port count unchanged at 20, 35, etc.
                    #
                    # Emit each checkpoint only once.
                    # -------------------------------------

                    if already_emitted:

                        return None


                    intensity_update = True


                # -----------------------------------------
                # Lower severity = suppress
                # -----------------------------------------

                else:

                    return None


            # ---------------------------------------------
            # Cooldown compatibility
            #
            # Severity escalations and explicit intensity
            # checkpoints are allowed through.
            #
            # Ordinary same/lower severity duplicates remain
            # suppressed.
            # ---------------------------------------------

            if (
                previous_alert is not None
                and previous_severity is not None
            ):

                cooldown_end = (
                    previous_alert
                    + timedelta(
                        seconds=
                            ALERT_COOLDOWN_SECONDS
                    )
                )


                if now < cooldown_end:

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


                    if (
                        current_rank
                        < previous_rank
                    ):

                        return None


                    if (
                        current_rank
                        == previous_rank
                        and not intensity_update
                    ):

                        return None


            # ---------------------------------------------
            # Record emitted intensity checkpoint
            #
            # This MUST happen before returning the
            # detection so retries cannot emit it again.
            # ---------------------------------------------

            if intensity_update:

                checkpoint_key = (
                    severity,
                    port_count,
                )


                self._emitted_intensity_checkpoints[
                    source
                ].add(
                    checkpoint_key
                )


            # ---------------------------------------------
            # Record emitted detection state
            # ---------------------------------------------

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

                "intensity_update":
                    intensity_update,

                "detected_at":
                    now.isoformat(),

                "description": (
                    f"{RULE_ID}: "
                    f"{severity} TCP multi-port "
                    f"scan activity detected from "
                    f"{source} against "
                    f"{monitored_host}. "
                    f"{port_count} unique TCP "
                    f"destination ports received "
                    f"initial SYN connection attempts "
                    f"within {WINDOW_SECONDS} seconds."
                ),
            }


            # ---------------------------------------------
            # Same-severity intensity update description
            # ---------------------------------------------

            if intensity_update:

                detection[
                    "description"
                ] = (
                    f"{RULE_ID}: "
                    f"{severity} TCP multi-port scan "
                    f"intensity increased from "
                    f"{source} against "
                    f"{monitored_host}. "
                    f"The active scan reached "
                    f"{port_count} unique TCP "
                    f"destination ports within "
                    f"{WINDOW_SECONDS} seconds."
                )


            # ---------------------------------------------
            # CRITICAL evidence
            # ---------------------------------------------

            if critical_reason is not None:

                detection[
                    "critical_reason"
                ] = critical_reason


                detection[
                    "description"
                ] = (
                    f"{RULE_ID}: CRITICAL repeated "
                    f"TCP multi-port scanning detected "
                    f"from {source} against "
                    f"{monitored_host}. "
                    f"A second distinct HIGH-strength "
                    f"scan burst was observed within "
                    f"{CRITICAL_HISTORY_SECONDS} "
                    f"seconds."
                )


            return detection


    def reset_observation_window(
        self,
        source=None,
    ):
        """
        Manually end the current short observation burst
        while preserving previous HIGH behavioral history.

        Live operation automatically recognizes expired
        observation windows.

        This method remains useful for deterministic tests.
        """

        with self._lock:

            if source is None:

                self._observations.clear()

                self._last_alert.clear()

                self._last_severity.clear()

                self._high_recorded_in_current_burst.clear()

                self._emitted_intensity_checkpoints.clear()


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

                self._emitted_intensity_checkpoints.pop(
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

            self._emitted_intensity_checkpoints.clear()


# ---------------------------------------------------------
# Shared Sentinel-X Detector
# ---------------------------------------------------------

scan_detector = ScanDetector()
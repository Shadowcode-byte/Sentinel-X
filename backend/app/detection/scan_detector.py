from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from threading import Lock


# ---------------------------------------------------------
# Sentinel-X Detection Rule
# SCAN-001 // TCP Multi-Port Scan
# ---------------------------------------------------------

RULE_ID = "SCAN-001"
RULE_NAME = "TCP MULTI-PORT SCAN"

PORT_THRESHOLD = 8
WINDOW_SECONDS = 10
ALERT_COOLDOWN_SECONDS = 60


class ScanDetector:
    """
    Sentinel-X SCAN-001 detector.

    Detects a remote source attempting to initiate TCP
    connections to multiple destination ports on the
    protected endpoint within a short time window.

    Only initial TCP SYN packets are evaluated:

        SYN = 1
        ACK = 0

    This prevents ordinary TCP response traffic from being
    interpreted as a port scan.
    """

    def __init__(self):
        self._lock = Lock()

        self._observations = defaultdict(
            deque
        )

        self._last_alert = {}


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

        Returns a SCAN-001 detection dictionary when the
        rule threshold is satisfied.

        Otherwise returns None.
        """

        # -------------------------------------------------
        # Only TCP is relevant to SCAN-001
        # -------------------------------------------------

        if protocol != "TCP":
            return None


        # -------------------------------------------------
        # Only remote -> protected endpoint traffic
        # -------------------------------------------------

        if direction != "INBOUND":
            return None


        if destination != monitored_host:
            return None


        if destination_port is None:
            return None


        # -------------------------------------------------
        # CRITICAL FALSE-POSITIVE FILTER
        #
        # A TCP scan normally begins with connection
        # initiation attempts.
        #
        # Count only:
        #
        # SYN = 1
        # ACK = 0
        #
        # Do NOT count SYN/ACK replies or packets belonging
        # to already-established connections.
        # -------------------------------------------------

        if not tcp_syn:
            return None


        if tcp_ack:
            return None


        now = datetime.now(
            timezone.utc
        )


        window_start = (
            now -
            timedelta(
                seconds=WINDOW_SECONDS
            )
        )


        with self._lock:

            observations = (
                self._observations[
                    source
                ]
            )


            observations.append(
                {
                    "time": now,
                    "port": int(
                        destination_port
                    ),
                }
            )


            # ---------------------------------------------
            # Remove expired observations
            # ---------------------------------------------

            while (
                observations
                and observations[0][
                    "time"
                ] < window_start
            ):
                observations.popleft()


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


            if (
                len(unique_ports)
                < PORT_THRESHOLD
            ):
                return None


            # ---------------------------------------------
            # Alert cooldown
            # ---------------------------------------------

            previous_alert = (
                self._last_alert.get(
                    source
                )
            )


            if (
                previous_alert
                is not None
            ):

                cooldown_end = (
                    previous_alert
                    + timedelta(
                        seconds=
                        ALERT_COOLDOWN_SECONDS
                    )
                )


                if now < cooldown_end:
                    return None


            self._last_alert[
                source
            ] = now


            # ---------------------------------------------
            # Detection
            # ---------------------------------------------

            return {
                "rule_id": RULE_ID,

                "rule_name": RULE_NAME,

                "severity": "HIGH",

                "source": source,

                "target": monitored_host,

                "protocol": "TCP",

                "detection_method":
                    "TCP_SYN_MULTI_PORT",

                "unique_ports":
                    unique_ports,

                "port_count":
                    len(
                        unique_ports
                    ),

                "window_seconds":
                    WINDOW_SECONDS,

                "detected_at":
                    now.isoformat(),

                "description": (
                    f"{RULE_ID}: Possible TCP multi-port "
                    f"scan detected from {source} against "
                    f"{monitored_host}. "
                    f"{len(unique_ports)} unique TCP "
                    f"destination ports received initial "
                    f"SYN connection attempts within "
                    f"{WINDOW_SECONDS} seconds."
                ),
            }


    def reset(self):
        """
        Clear detection observations and alert cooldowns.
        """

        with self._lock:

            self._observations.clear()

            self._last_alert.clear()


# ---------------------------------------------------------
# Shared Sentinel-X Detector
# ---------------------------------------------------------

scan_detector = ScanDetector()
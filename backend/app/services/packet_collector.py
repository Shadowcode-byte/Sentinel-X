from datetime import datetime, timezone
from threading import Lock

from scapy.layers.dns import DNS
from scapy.layers.inet import ICMP, IP, TCP, UDP

from app.detection.scan_detector import scan_detector
from app.services.response_pipeline import process_detection_response


# ---------------------------------------------------------
# Sentinel-X Network Configuration
# ---------------------------------------------------------

WIFI_INTERFACE = (
    r"\Device\NPF_{A386622D-F578-4A9D-83EC-7B71EB4C8CB9}"
)

INTERFACE_NAME = "Local Area Connection* 2"

INTERFACE_DESCRIPTION = (
    "Microsoft Wi-Fi Direct Virtual Adapter #2"
)

MONITORED_HOST = "192.168.137.1"

MAX_FLOWS = 100
MAX_DETECTIONS = 25


class PacketCollector:
    """
    Sentinel-X endpoint-focused network telemetry collector.

    Responsibilities:
    - Capture endpoint network metadata
    - Filter unrelated traffic
    - Maintain protocol counters
    - Aggregate packets into flows
    - Extract TCP SYN / ACK state
    - Run SCAN-001 detection
    - Forward detections to the response pipeline

    Response pipeline:
    Detection
        ->
    Security Event
        ->
    Incident
        ->
    Risk Assessment
        ->
    Forensic Evidence
        ->
    SHA-256 Integrity

    Packet payload contents are never stored.
    """

    def __init__(self):
        self._lock = Lock()

        self.capture_active = False

        self.interface = WIFI_INTERFACE
        self.interface_name = INTERFACE_NAME
        self.interface_description = INTERFACE_DESCRIPTION

        self.monitored_host = MONITORED_HOST

        self.total_packets_seen = 0
        self.monitored_packets = 0
        self.ignored_packets = 0

        self.protocols = {
            "TCP": 0,
            "UDP": 0,
            "DNS": 0,
            "ICMP": 0,
        }

        self.mdns_packets = 0

        self.flows = {}

        self.detections = []


    # -----------------------------------------------------
    # Packet Processing
    # -----------------------------------------------------

    def process_packet(self, packet):
        """
        Process one packet captured by Scapy.
        """

        timestamp = datetime.now(
            timezone.utc
        )


        # -------------------------------------------------
        # Count Every Observed Packet
        # -------------------------------------------------

        with self._lock:
            self.total_packets_seen += 1


        # -------------------------------------------------
        # IPv4 Filter
        # -------------------------------------------------

        if IP not in packet:

            with self._lock:
                self.ignored_packets += 1

            return


        source = packet[IP].src
        destination = packet[IP].dst


        # -------------------------------------------------
        # Protected Endpoint Filter
        # -------------------------------------------------

        if (
            source != self.monitored_host
            and destination != self.monitored_host
        ):

            with self._lock:
                self.ignored_packets += 1

            return


        source_port = None
        destination_port = None

        protocol = "OTHER"

        tcp_syn = False
        tcp_ack = False


        # -------------------------------------------------
        # Port + TCP Flag Extraction
        # -------------------------------------------------

        if TCP in packet:

            source_port = int(
                packet[TCP].sport
            )

            destination_port = int(
                packet[TCP].dport
            )


            tcp_flags = int(
                packet[TCP].flags
            )


            # TCP SYN bit = 0x02
            tcp_syn = bool(
                tcp_flags & 0x02
            )


            # TCP ACK bit = 0x10
            tcp_ack = bool(
                tcp_flags & 0x10
            )


        elif UDP in packet:

            source_port = int(
                packet[UDP].sport
            )

            destination_port = int(
                packet[UDP].dport
            )


        # -------------------------------------------------
        # Protocol Classification
        # -------------------------------------------------

        is_mdns = (
            source_port == 5353
            or destination_port == 5353
        )


        is_standard_dns = (
            source_port == 53
            or destination_port == 53
        )


        if is_mdns:

            protocol = "MDNS"


        elif (
            DNS in packet
            and is_standard_dns
        ):

            protocol = "DNS"


        elif TCP in packet:

            protocol = "TCP"


        elif UDP in packet:

            protocol = "UDP"


        elif ICMP in packet:

            protocol = "ICMP"


        # -------------------------------------------------
        # Traffic Direction
        # -------------------------------------------------

        if source == self.monitored_host:

            direction = "OUTBOUND"

        else:

            direction = "INBOUND"


        # -------------------------------------------------
        # SCAN-001 Detection
        # -------------------------------------------------

        detection = scan_detector.inspect(
            source=source,
            destination=destination,
            destination_port=destination_port,
            protocol=protocol,
            direction=direction,
            monitored_host=self.monitored_host,
            tcp_syn=tcp_syn,
            tcp_ack=tcp_ack,
        )


        # -------------------------------------------------
        # Sentinel-X Response Pipeline
        #
        # Detection
        #    ->
        # Security Event
        #    ->
        # Incident
        #    ->
        # Risk Assessment
        #    ->
        # Forensic Evidence
        #    ->
        # SHA-256
        # -------------------------------------------------

        if detection is not None:

            try:

                detection = (
                    process_detection_response(
                        detection
                    )
                )


            except Exception as exc:

                detection = {
                    **detection,

                    "pipeline_error":
                        str(exc),
                }


                print(
                    "[SENTINEL-X ERROR] "
                    "Response pipeline failed: "
                    f"{exc}"
                )


        # -------------------------------------------------
        # Flow Key
        # -------------------------------------------------

        flow_key = (
            source,
            destination,
            source_port,
            destination_port,
            protocol,
            direction,
        )


        # -------------------------------------------------
        # Update Telemetry
        # -------------------------------------------------

        with self._lock:

            self.monitored_packets += 1


            # ---------------------------------------------
            # Protocol Counters
            # ---------------------------------------------

            if protocol == "MDNS":

                self.mdns_packets += 1


            elif protocol in self.protocols:

                self.protocols[
                    protocol
                ] += 1


            # ---------------------------------------------
            # Existing Flow
            # ---------------------------------------------

            if flow_key in self.flows:

                flow = self.flows[
                    flow_key
                ]


                flow[
                    "packets"
                ] += 1


                flow[
                    "last_seen"
                ] = (
                    timestamp.isoformat()
                )


                if TCP in packet:

                    if tcp_syn:

                        flow[
                            "syn_observed"
                        ] = True


                    if tcp_ack:

                        flow[
                            "ack_observed"
                        ] = True


            # ---------------------------------------------
            # New Flow
            # ---------------------------------------------

            else:

                self.flows[
                    flow_key
                ] = {
                    "source":
                        source,

                    "destination":
                        destination,

                    "source_port":
                        source_port,

                    "destination_port":
                        destination_port,

                    "protocol":
                        protocol,

                    "direction":
                        direction,

                    "state":
                        "OBSERVED",

                    "packets":
                        1,

                    "syn_observed":
                        (
                            tcp_syn
                            if TCP in packet
                            else False
                        ),

                    "ack_observed":
                        (
                            tcp_ack
                            if TCP in packet
                            else False
                        ),

                    "first_seen":
                        timestamp.isoformat(),

                    "last_seen":
                        timestamp.isoformat(),
                }


            # ---------------------------------------------
            # Flow Memory Limit
            # ---------------------------------------------

            if (
                len(self.flows)
                > MAX_FLOWS
            ):

                oldest_key = min(
                    self.flows,

                    key=lambda key:
                        self.flows[
                            key
                        ][
                            "last_seen"
                        ],
                )


                del self.flows[
                    oldest_key
                ]


            # ---------------------------------------------
            # Store Detection In Memory
            # ---------------------------------------------

            if detection is not None:

                self.detections.insert(
                    0,
                    detection,
                )


                self.detections = (
                    self.detections[
                        :MAX_DETECTIONS
                    ]
                )


    # -----------------------------------------------------
    # Collector Status
    # -----------------------------------------------------

    def get_status(self):
        """
        Return current Sentinel-X packet sensor status.
        """

        with self._lock:

            return {
                "status": (
                    "capturing"
                    if self.capture_active
                    else "standby"
                ),

                "collector":
                    "scapy",

                "packet_sensor":
                    "ready",

                "capture_active":
                    self.capture_active,

                "interface":
                    self.interface,

                "interface_name":
                    self.interface_name,

                "interface_description":
                    self.interface_description,

                "monitored_host":
                    self.monitored_host,

                "detection_engine":
                    "active",

                "detection_rule":
                    "SCAN-001",

                "detection_method":
                    "TCP_SYN_MULTI_PORT",

                "scan_threshold":
                    (
                        "8 unique SYN destination "
                        "ports / 10 seconds"
                    ),

                "event_persistence":
                    "sqlite",

                "incident_engine":
                    "active",

                "incident_creation":
                    "automatic",

                "risk_engine":
                    "active",

                "risk_creation":
                    "automatic",

                "risk_model":
                    "weighted_explainable_v1",

                "forensics_engine":
                    "active",

                "evidence_creation":
                    "automatic",

                "integrity_algorithm":
                    "SHA-256",

                "response_pipeline":
                    "active",

                "timestamp":
                    datetime.now(
                        timezone.utc
                    ).isoformat(),
            }


    # -----------------------------------------------------
    # Telemetry Snapshot
    # -----------------------------------------------------

    def get_telemetry(self):
        """
        Return endpoint telemetry, aggregated flows and
        recent detections.
        """

        with self._lock:

            flows = list(
                self.flows.values()
            )


            flows.sort(
                key=lambda flow:
                    flow[
                        "last_seen"
                    ],
                reverse=True,
            )


            return {
                "mode":
                    "live",

                "live":
                    self.capture_active,

                "interface":
                    self.interface_name,

                "monitored_host":
                    self.monitored_host,

                "total_packets_seen":
                    self.total_packets_seen,

                "monitored_packets":
                    self.monitored_packets,

                "ignored_packets":
                    self.ignored_packets,

                "tracked_flows":
                    len(flows),

                "active_flows":
                    len(flows),

                "protocols":
                    dict(
                        self.protocols
                    ),

                "mdns_packets":
                    self.mdns_packets,

                "connections":
                    flows[:50],

                "detections":
                    list(
                        self.detections
                    ),

                "detection_count":
                    len(
                        self.detections
                    ),

                "timestamp":
                    datetime.now(
                        timezone.utc
                    ).isoformat(),
            }


    # -----------------------------------------------------
    # Detection Snapshot
    # -----------------------------------------------------

    def get_detections(self):
        """
        Return recent in-memory Sentinel-X detections.
        """

        with self._lock:

            return {
                "rule":
                    "SCAN-001",

                "method":
                    "TCP_SYN_MULTI_PORT",

                "threshold": {
                    "unique_ports":
                        8,

                    "window_seconds":
                        10,
                },

                "incident_creation":
                    "automatic",

                "risk_creation":
                    "automatic",

                "evidence_creation":
                    "automatic",

                "integrity_algorithm":
                    "SHA-256",

                "count":
                    len(
                        self.detections
                    ),

                "detections":
                    list(
                        self.detections
                    ),

                "timestamp":
                    datetime.now(
                        timezone.utc
                    ).isoformat(),
            }


    # -----------------------------------------------------
    # Reset Telemetry
    # -----------------------------------------------------

    def reset(self):
        """
        Reset packet telemetry, flows and in-memory
        detection history.

        Persisted security events, incidents, risk
        assessments and forensic evidence are NOT deleted.
        """

        with self._lock:

            self.total_packets_seen = 0

            self.monitored_packets = 0

            self.ignored_packets = 0


            self.protocols = {
                "TCP": 0,
                "UDP": 0,
                "DNS": 0,
                "ICMP": 0,
            }


            self.mdns_packets = 0


            self.flows.clear()


            self.detections.clear()


        scan_detector.reset()


# ---------------------------------------------------------
# Shared Sentinel-X Collector
# ---------------------------------------------------------

packet_collector = PacketCollector()
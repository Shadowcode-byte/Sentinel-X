from fastapi import APIRouter, HTTPException
from scapy.sendrecv import AsyncSniffer

from app.services.packet_collector import (
    WIFI_INTERFACE,
    packet_collector,
)


router = APIRouter(
    prefix="/api/v1/network",
    tags=["Network Operations"],
)


# ---------------------------------------------------------
# Internal Capture State
# ---------------------------------------------------------

sniffer: AsyncSniffer | None = None


# ---------------------------------------------------------
# Network Status
# ---------------------------------------------------------

@router.get("/status")
def get_network_status():
    """
    Return the current Sentinel-X network sensor status.
    """

    return packet_collector.get_status()


# ---------------------------------------------------------
# Network Telemetry
# ---------------------------------------------------------

@router.get("/telemetry")
def get_network_telemetry():
    """
    Return live packet counters and recent connections.
    """

    return packet_collector.get_telemetry()


# ---------------------------------------------------------
# Start Packet Capture
# ---------------------------------------------------------

@router.post("/capture/start")
def start_capture():
    """
    Start Sentinel-X packet capture on the configured
    Windows Wi-Fi / Npcap interface.
    """

    global sniffer

    if packet_collector.capture_active:
        return {
            "status": "already_running",
            "message": (
                "Sentinel-X packet capture is already active."
            ),
            "interface": packet_collector.interface_name,
        }

    try:
        sniffer = AsyncSniffer(
            iface=WIFI_INTERFACE,
            prn=packet_collector.process_packet,
            store=False,
        )

        sniffer.start()

        packet_collector.capture_active = True

        return {
            "status": "started",
            "message": (
                "Sentinel-X packet capture started."
            ),
            "interface": packet_collector.interface_name,
            "sensor": packet_collector.interface_description,
        }

    except Exception as exc:
        sniffer = None

        packet_collector.capture_active = False

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to start Sentinel-X packet capture: "
                f"{exc}"
            ),
        )


# ---------------------------------------------------------
# Stop Packet Capture
# ---------------------------------------------------------

@router.post("/capture/stop")
def stop_capture():
    """
    Stop the active Sentinel-X packet capture session.
    """

    global sniffer

    if not packet_collector.capture_active:
        return {
            "status": "not_running",
            "message": (
                "Packet capture is not currently active."
            ),
        }

    try:
        if sniffer is not None:
            sniffer.stop()

        sniffer = None

        packet_collector.capture_active = False

        return {
            "status": "stopped",
            "message": (
                "Sentinel-X packet capture stopped."
            ),
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to stop Sentinel-X packet capture: "
                f"{exc}"
            ),
        )


# ---------------------------------------------------------
# Reset Network Telemetry
# ---------------------------------------------------------

@router.post("/telemetry/reset")
def reset_network_telemetry():
    """
    Clear network counters and recent connection records.
    """

    packet_collector.reset()

    return {
        "status": "reset",
        "message": (
            "Sentinel-X network telemetry cleared."
        ),
    }
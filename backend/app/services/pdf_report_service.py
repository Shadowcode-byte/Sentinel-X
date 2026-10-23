from io import BytesIO
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
)

from app.services.report_service import generate_security_report


# ---------------------------------------------------------
# Sentinel-X PDF Theme
# ---------------------------------------------------------

BG = colors.HexColor("#0B0E09")
PANEL = colors.HexColor("#14180F")
LINE = colors.HexColor("#343A2D")

ACID = colors.HexColor("#D7FF57")
PURPLE = colors.HexColor("#9B82FF")
AMBER = colors.HexColor("#FFBD59")
RED = colors.HexColor("#FF6258")

CREAM = colors.HexColor("#ECE8D9")
MUTED = colors.HexColor("#A0A58F")


def safe(value):
    if value is None:
        return "--"

    return str(value)


def format_time(value):
    if not value:
        return "--"

    try:
        date = datetime.fromisoformat(
            value.replace(
                "Z",
                "+00:00",
            )
        )

        return date.strftime(
            "%d %b %Y %H:%M:%S"
        )

    except Exception:
        return str(value)


# ---------------------------------------------------------
# Page Background
# ---------------------------------------------------------

def draw_page(canvas, doc):
    canvas.saveState()

    width, height = A4

    canvas.setFillColor(BG)

    canvas.rect(
        0,
        0,
        width,
        height,
        fill=1,
        stroke=0,
    )

    canvas.setFillColor(ACID)

    canvas.rect(
        0,
        height - 3,
        width,
        3,
        fill=1,
        stroke=0,
    )

    canvas.setStrokeColor(LINE)

    canvas.line(
        15 * mm,
        13 * mm,
        width - 15 * mm,
        13 * mm,
    )

    canvas.setFillColor(MUTED)

    canvas.setFont(
        "Helvetica",
        7,
    )

    canvas.drawString(
        15 * mm,
        8 * mm,
        "SENTINEL-X // UNIFIED SECURITY REPORT",
    )

    canvas.drawRightString(
        width - 15 * mm,
        8 * mm,
        f"PAGE {doc.page}",
    )

    canvas.restoreState()


# ---------------------------------------------------------
# Table Helpers
# ---------------------------------------------------------

def style_table(table):
    table.setStyle(
        TableStyle(
            [
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, -1),
                    PANEL,
                ),
                (
                    "TEXTCOLOR",
                    (0, 0),
                    (-1, -1),
                    CREAM,
                ),
                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.35,
                    LINE,
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "TOP",
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    7,
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    7,
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    7,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    7,
                ),
            ]
        )
    )

    return table


# ---------------------------------------------------------
# PDF Generator
# ---------------------------------------------------------

def generate_security_report_pdf():
    report = generate_security_report()

    buffer = BytesIO()

    document = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=15 * mm,
        leftMargin=15 * mm,
        topMargin=18 * mm,
        bottomMargin=20 * mm,
        title="Sentinel-X Unified Security Report",
        author="Sentinel-X",
    )

    base = getSampleStyleSheet()

    title = ParagraphStyle(
        "SXTitle",
        parent=base["Title"],
        fontName="Helvetica-Bold",
        fontSize=26,
        leading=30,
        textColor=CREAM,
        spaceAfter=8,
    )

    subtitle = ParagraphStyle(
        "SXSubtitle",
        parent=base["Normal"],
        fontSize=10,
        leading=15,
        textColor=MUTED,
        spaceAfter=15,
    )

    section = ParagraphStyle(
        "SXSection",
        parent=base["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=ACID,
        spaceBefore=12,
        spaceAfter=8,
    )

    body = ParagraphStyle(
        "SXBody",
        parent=base["BodyText"],
        fontSize=8,
        leading=12,
        textColor=MUTED,
    )

    small = ParagraphStyle(
        "SXSmall",
        parent=base["BodyText"],
        fontSize=7,
        leading=10,
        textColor=CREAM,
    )

    hash_style = ParagraphStyle(
        "SXHash",
        parent=base["BodyText"],
        fontName="Courier",
        fontSize=6.5,
        leading=9,
        textColor=CREAM,
        wordWrap="CJK",
    )

    story = []

    # -----------------------------------------------------
    # Title
    # -----------------------------------------------------

    story.append(
        Paragraph(
            "SENTINEL-X",
            title,
        )
    )

    story.append(
        Paragraph(
            "UNIFIED SECURITY REPORT",
            ParagraphStyle(
                "SXReportTitle",
                parent=title,
                fontSize=16,
                leading=20,
                textColor=ACID,
            ),
        )
    )

    story.append(
        Paragraph(
            (
                "Threat Detection // Incident Response // "
                "Risk Intelligence // Digital Forensics // "
                "Security Audit"
            ),
            subtitle,
        )
    )

    story.append(
        Paragraph(
            (
                "<b>Generated:</b> "
                + format_time(
                    report.get(
                        "generated_at"
                    )
                )
                + " UTC"
            ),
            body,
        )
    )

    story.append(
        Spacer(
            1,
            8 * mm,
        )
    )


    # -----------------------------------------------------
    # Executive Summary
    # -----------------------------------------------------

    summary = report.get(
        "executive_summary",
        {},
    )

    story.append(
        Paragraph(
            "01 // EXECUTIVE SUMMARY",
            section,
        )
    )

    summary_data = [
        [
            "Security Events",
            safe(
                summary.get(
                    "security_events"
                )
            ),
            "High Severity",
            safe(
                summary.get(
                    "high_severity_events"
                )
            ),
        ],
        [
            "SCAN-001",
            safe(
                summary.get(
                    "scan_detections"
                )
            ),
            "Incidents",
            safe(
                summary.get(
                    "incidents"
                )
            ),
        ],
        [
            "Open Incidents",
            safe(
                summary.get(
                    "open_incidents"
                )
            ),
            "Current High Risk",
            safe(
                summary.get(
                    "current_high_risk"
                )
            ),
        ],
        [
            "Forensic Evidence",
            safe(
                summary.get(
                    "forensic_evidence"
                )
            ),
            "Verified Evidence",
            safe(
                summary.get(
                    "verified_evidence"
                )
            ),
        ],
        [
            "Audit Score",
            safe(
                summary.get(
                    "latest_audit_score"
                )
            ),
            "Audit Status",
            safe(
                summary.get(
                    "latest_audit_status"
                )
            ),
        ],
    ]

    summary_table = Table(
        summary_data,
        colWidths=[
            38 * mm,
            18 * mm,
            38 * mm,
            30 * mm,
        ],
    )

    story.append(
        style_table(
            summary_table
        )
    )


    # -----------------------------------------------------
    # Threat Detection
    # -----------------------------------------------------

    story.append(
        Paragraph(
            "02 // THREAT DETECTION",
            section,
        )
    )

    threat_events = [
        event
        for event in report.get(
            "security_events",
            [],
        )
        if event.get(
            "event_type"
        ) != "SYSTEM_TEST"
    ]

    if threat_events:

        for event in threat_events:

            event_table = Table(
                [
                    [
                        "Event",
                        safe(
                            event.get(
                                "event_type"
                            )
                        ),
                        "Severity",
                        safe(
                            event.get(
                                "severity"
                            )
                        ),
                    ],
                    [
                        "Source",
                        safe(
                            event.get(
                                "source"
                            )
                        ),
                        "Target",
                        safe(
                            event.get(
                                "target"
                            )
                        ),
                    ],
                    [
                        "Created",
                        format_time(
                            event.get(
                                "created_at"
                            )
                        ),
                        "Event ID",
                        "#"
                        + safe(
                            event.get(
                                "id"
                            )
                        ),
                    ],
                ],
                colWidths=[
                    25 * mm,
                    52 * mm,
                    25 * mm,
                    52 * mm,
                ],
            )

            story.append(
                style_table(
                    event_table
                )
            )

            story.append(
                Spacer(
                    1,
                    3 * mm,
                )
            )

            story.append(
                Paragraph(
                    safe(
                        event.get(
                            "description"
                        )
                    ),
                    body,
                )
            )

    else:

        story.append(
            Paragraph(
                "No threat detections are currently available.",
                body,
            )
        )


    # -----------------------------------------------------
    # Incident
    # -----------------------------------------------------

    story.append(
        Paragraph(
            "03 // INCIDENT RESPONSE",
            section,
        )
    )

    incidents = report.get(
        "incidents",
        [],
    )

    if incidents:

        incident = incidents[0]

        incident_table = Table(
            [
                [
                    "Incident",
                    "#"
                    + safe(
                        incident.get(
                            "id"
                        )
                    ),
                    "Status",
                    safe(
                        incident.get(
                            "status"
                        )
                    ),
                ],
                [
                    "Type",
                    safe(
                        incident.get(
                            "incident_type"
                        )
                    ),
                    "Severity",
                    safe(
                        incident.get(
                            "severity"
                        )
                    ),
                ],
                [
                    "Source",
                    safe(
                        incident.get(
                            "source"
                        )
                    ),
                    "Target",
                    safe(
                        incident.get(
                            "target"
                        )
                    ),
                ],
                [
                    "Linked Event",
                    "#"
                    + safe(
                        incident.get(
                            "linked_event_id"
                        )
                    ),
                    "Created",
                    format_time(
                        incident.get(
                            "created_at"
                        )
                    ),
                ],
            ],
            colWidths=[
                25 * mm,
                52 * mm,
                25 * mm,
                52 * mm,
            ],
        )

        story.append(
            style_table(
                incident_table
            )
        )

        story.append(
            Spacer(
                1,
                3 * mm,
            )
        )

        story.append(
            Paragraph(
                safe(
                    incident.get(
                        "description"
                    )
                ),
                body,
            )
        )

    else:

        story.append(
            Paragraph(
                "No incidents are currently available.",
                body,
            )
        )


    # -----------------------------------------------------
    # Risk
    # -----------------------------------------------------

    story.append(
        Paragraph(
            "04 // RISK INTELLIGENCE",
            section,
        )
    )

    risks = report.get(
        "risk_assessments",
        [],
    )

    if risks:

        risk = risks[0]

        risk_table = Table(
            [
                [
                    "Assessment",
                    "#"
                    + safe(
                        risk.get(
                            "id"
                        )
                    ),
                    "Incident",
                    "#"
                    + safe(
                        risk.get(
                            "incident_id"
                        )
                    ),
                ],
                [
                    "Risk Score",
                    safe(
                        risk.get(
                            "risk_score"
                        )
                    )
                    + "/100",
                    "Risk Level",
                    safe(
                        risk.get(
                            "risk_level"
                        )
                    ),
                ],
                [
                    "Severity",
                    safe(
                        risk.get(
                            "severity"
                        )
                    ),
                    "Asset Criticality",
                    safe(
                        risk.get(
                            "asset_criticality"
                        )
                    ),
                ],
                [
                    "Confidence",
                    safe(
                        risk.get(
                            "detection_confidence"
                        )
                    ),
                    "Status Factor",
                    safe(
                        risk.get(
                            "status_factor"
                        )
                    ),
                ],
            ],
            colWidths=[
                30 * mm,
                47 * mm,
                30 * mm,
                47 * mm,
            ],
        )

        story.append(
            style_table(
                risk_table
            )
        )

        story.append(
            Spacer(
                1,
                3 * mm,
            )
        )

        story.append(
            Paragraph(
                "<b>Rationale:</b> "
                + safe(
                    risk.get(
                        "rationale"
                    )
                ),
                body,
            )
        )

    else:

        story.append(
            Paragraph(
                "No risk assessments are currently available.",
                body,
            )
        )


    # -----------------------------------------------------
    # Forensics
    # -----------------------------------------------------

    story.append(
        PageBreak()
    )

    story.append(
        Paragraph(
            "05 // DIGITAL FORENSICS",
            section,
        )
    )

    evidence_records = report.get(
        "forensic_evidence",
        [],
    )

    if evidence_records:

        evidence = (
            evidence_records[0]
        )

        evidence_table = Table(
            [
                [
                    "Evidence",
                    "#"
                    + safe(
                        evidence.get(
                            "id"
                        )
                    ),
                    "Integrity",
                    safe(
                        evidence.get(
                            "integrity_status"
                        )
                    ),
                ],
                [
                    "Type",
                    safe(
                        evidence.get(
                            "evidence_type"
                        )
                    ),
                    "Incident",
                    "#"
                    + safe(
                        evidence.get(
                            "incident_id"
                        )
                    ),
                ],
                [
                    "Source",
                    safe(
                        evidence.get(
                            "source"
                        )
                    ),
                    "Target",
                    safe(
                        evidence.get(
                            "target"
                        )
                    ),
                ],
                [
                    "Linked Event",
                    "#"
                    + safe(
                        evidence.get(
                            "linked_event_id"
                        )
                    ),
                    "Preserved",
                    format_time(
                        evidence.get(
                            "created_at"
                        )
                    ),
                ],
            ],
            colWidths=[
                28 * mm,
                49 * mm,
                28 * mm,
                49 * mm,
            ],
        )

        story.append(
            style_table(
                evidence_table
            )
        )

        story.append(
            Spacer(
                1,
                4 * mm,
            )
        )

        story.append(
            Paragraph(
                "<b>SHA-256 Evidence Hash</b>",
                body,
            )
        )

        story.append(
            Paragraph(
                safe(
                    evidence.get(
                        "sha256_hash"
                    )
                ),
                hash_style,
            )
        )

        story.append(
            Spacer(
                1,
                3 * mm,
            )
        )

        story.append(
            Paragraph(
                safe(
                    evidence.get(
                        "description"
                    )
                ),
                body,
            )
        )

    else:

        story.append(
            Paragraph(
                "No forensic evidence is currently available.",
                body,
            )
        )


    # -----------------------------------------------------
    # Security Audit
    # -----------------------------------------------------

    story.append(
        Paragraph(
            "06 // SECURITY AUDIT",
            section,
        )
    )

    audits = report.get(
        "latest_audit",
        [],
    )

    if audits:

        audit_rows = [
            [
                "Control",
                "Name",
                "Status",
                "Score",
            ]
        ]

        for item in audits:

            audit_rows.append(
                [
                    safe(
                        item.get(
                            "control_id"
                        )
                    ),
                    safe(
                        item.get(
                            "control_name"
                        )
                    ),
                    safe(
                        item.get(
                            "status"
                        )
                    ),
                    safe(
                        item.get(
                            "score"
                        )
                    ),
                ]
            )

        audit_table = Table(
            audit_rows,
            colWidths=[
                24 * mm,
                82 * mm,
                25 * mm,
                23 * mm,
            ],
            repeatRows=1,
        )

        style_table(
            audit_table
        )

        audit_table.setStyle(
            TableStyle(
                [
                    (
                        "TEXTCOLOR",
                        (0, 0),
                        (-1, 0),
                        ACID,
                    ),
                    (
                        "FONTNAME",
                        (0, 0),
                        (-1, 0),
                        "Helvetica-Bold",
                    ),
                ]
            )
        )

        story.append(
            audit_table
        )


        story.append(
            Spacer(
                1,
                6 * mm,
            )
        )


        # Findings + Recommendations

        for item in audits:

            story.append(
                Paragraph(
                    (
                        "<b>"
                        + safe(
                            item.get(
                                "control_id"
                            )
                        )
                        + " // "
                        + safe(
                            item.get(
                                "control_name"
                            )
                        )
                        + "</b>"
                    ),
                    small,
                )
            )

            story.append(
                Paragraph(
                    (
                        "<b>Finding:</b> "
                        + safe(
                            item.get(
                                "finding"
                            )
                        )
                    ),
                    body,
                )
            )

            story.append(
                Paragraph(
                    (
                        "<b>Recommendation:</b> "
                        + safe(
                            item.get(
                                "recommendation"
                            )
                        )
                    ),
                    body,
                )
            )

            story.append(
                Spacer(
                    1,
                    2 * mm,
                )
            )

    else:

        story.append(
            Paragraph(
                "No security audit is currently available.",
                body,
            )
        )


    # -----------------------------------------------------
    # Closing
    # -----------------------------------------------------

    story.append(
        Spacer(
            1,
            7 * mm,
        )
    )

    story.append(
        Paragraph(
            "REPORT CONCLUSION",
            section,
        )
    )

    story.append(
        Paragraph(
            (
                "This report was generated automatically by "
                "Sentinel-X from persisted platform data. "
                "It summarizes currently available threat "
                "detections, incident-response state, "
                "explainable risk intelligence, forensic "
                "evidence integrity and security audit "
                "results."
            ),
            body,
        )
    )

    story.append(
        Paragraph(
            (
                "Sentinel-X is an educational defensive "
                "cybersecurity platform intended for "
                "authorized environments."
            ),
            body,
        )
    )


    # -----------------------------------------------------
    # Build
    # -----------------------------------------------------

    document.build(
        story,
        onFirstPage=draw_page,
        onLaterPages=draw_page,
    )

    pdf_bytes = (
        buffer.getvalue()
    )

    buffer.close()

    filename = (
        "Sentinel-X_Security_Report_"
        + datetime.now().strftime(
            "%Y%m%d_%H%M%S"
        )
        + ".pdf"
    )

    return (
        pdf_bytes,
        filename,
    )
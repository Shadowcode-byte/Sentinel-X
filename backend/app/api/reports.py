from io import BytesIO

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.services.report_service import (
    generate_security_report,
)
from app.services.pdf_report_service import (
    generate_security_report_pdf,
)


router = APIRouter(
    prefix="/api/v1/reports",
    tags=["Security Reports"],
)


# ---------------------------------------------------------
# Generate Unified Security Report
# ---------------------------------------------------------

@router.get(
    "/security",
)
def get_security_report():
    """
    Generate a live Sentinel-X unified security report
    from persisted platform data.
    """

    return generate_security_report()


# ---------------------------------------------------------
# Download Unified Security Report PDF
# ---------------------------------------------------------

@router.get(
    "/security/pdf",
)
def download_security_report_pdf():
    """
    Generate and download a professional Sentinel-X
    unified security report as a PDF document.
    """

    pdf_bytes, filename = (
        generate_security_report_pdf()
    )

    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition":
                f'attachment; filename="{filename}"'
        },
    )
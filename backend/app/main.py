from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.events import router as events_router
from app.api.network import router as network_router
from app.api.incidents import router as incidents_router
from app.api.risk import router as risk_router
from app.api.forensics import router as forensics_router
from app.api.audit import router as audit_router

from app.core.init_db import init_db


# ---------------------------------------------------------
# Application Lifecycle
# ---------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()

    print("Sentinel-X database initialized.")
    print("Sentinel-X Security Engine ONLINE.")

    yield

    print("Sentinel-X Security Engine shutting down.")


# ---------------------------------------------------------
# Sentinel-X FastAPI Application
# ---------------------------------------------------------

app = FastAPI(
    title="Sentinel-X API",
    description=(
        "Unified Cyber Threat Detection, Network Analysis "
        "& Incident Response Platform"
    ),
    version="0.6.0",
    lifespan=lifespan,
)


# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# API Routers
# ---------------------------------------------------------

app.include_router(events_router)
app.include_router(network_router)
app.include_router(incidents_router)
app.include_router(risk_router)
app.include_router(forensics_router)
app.include_router(audit_router)


# ---------------------------------------------------------
# Root Endpoint
# ---------------------------------------------------------

@app.get("/", tags=["System"])
def root():
    return {
        "platform": "Sentinel-X",
        "message": "Unified Security Operations Platform",
        "status": "online",
        "version": "0.6.0",
    }


# ---------------------------------------------------------
# Health Check
# ---------------------------------------------------------

@app.get("/api/v1/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "service": "sentinel-x-api",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# ---------------------------------------------------------
# System Security Status
# ---------------------------------------------------------

@app.get("/api/v1/system/status", tags=["System"])
def system_status():
    return {
        "platform": "Sentinel-X",
        "status": "secure",
        "monitoring": True,
        "threat_level": "LOW",
        "active_incidents": 0,
        "version": "0.6.0",
    }
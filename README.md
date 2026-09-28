# 🛡️ Sentinel-X

### Unified Cyber Threat Detection, Network Analysis & Incident Response Platform

**Sentinel-X** is a full-stack cybersecurity monitoring and response platform built to transform live endpoint network activity into structured, traceable security intelligence.

It combines **network telemetry, behavioral threat detection, incident response, explainable risk assessment, digital forensics, SHA-256 evidence verification, and security auditing** inside a unified Security Operations Center (SOC)-style dashboard.

> **Project Status:** Active Development  
> **Current Version:** v0.6.0  
> **Environment:** Authorized cybersecurity lab / defensive security research

---

## 📌 Overview

Security monitoring is often fragmented across different tools for packet analysis, threat detection, incident management, risk assessment, and digital forensics.

Sentinel-X explores a unified approach.

Instead of stopping after detecting suspicious traffic, Sentinel-X follows the activity through a complete defensive workflow:

```text
Network Traffic
      |
      v
Npcap + Scapy Sensor
      |
      v
Live Network Telemetry
      |
      v
SCAN-001 Detection Engine
      |
      v
Security Event
      |
      v
Incident Response
      |
      v
Explainable Risk Assessment
      |
      v
Forensic Evidence Preservation
      |
      v
SHA-256 Integrity Verification
      |
      v
Security Audit
```

Every major stage is exposed through a dedicated module in the Sentinel-X dashboard.

---

# ✨ Core Capabilities

| Module | Status | Purpose |
|---|:---:|---|
| Command Center | ✅ | Central SOC overview |
| Network Monitor | ✅ | Live endpoint network telemetry |
| Threat Detection | ✅ | Rule-based threat detection |
| Incident Operations | ✅ | Incident investigation and lifecycle |
| Risk Intelligence | ✅ | Explainable cyber-risk assessment |
| Forensics | ✅ | Evidence preservation and integrity verification |
| Security Audit | ✅ | Security-control assessment |
| Reports | 🚧 | Security reporting and export |

---

# 🖥️ Command Center

The **Command Center** provides the central operational view of Sentinel-X.

It brings together:

- Monitoring status
- Security-event counts
- High-severity activity
- Defense engine state
- Live network pulse
- Packet telemetry
- Security topology
- Detection status
- Endpoint information
- Recent security activity

The goal is to provide an immediate picture of the monitored endpoint's security state.

---

# 🌐 Live Network Monitoring

Sentinel-X uses **Scapy** with **Npcap** on Windows to capture and analyze network metadata from a selected interface.

The current collector tracks:

- TCP
- UDP
- DNS
- ICMP
- Source IP
- Destination IP
- Source port
- Destination port
- Traffic direction
- TCP SYN state
- TCP ACK state
- Packet counts
- Network flows
- First-seen timestamps
- Last-seen timestamps

The collector is focused on metadata required for security analysis.

**Packet payload contents are not stored by the current telemetry collector.**

---

# 🎯 Threat Detection

Sentinel-X currently includes the behavioral detection rule:

## SCAN-001 — TCP SYN Multi-Port Scan Detection

SCAN-001 observes inbound initial TCP SYN attempts targeting the protected endpoint.

### Current Detection Threshold

```text
8 unique TCP destination ports
within
10 seconds
```

The detector focuses on initial SYN connection attempts rather than treating every TCP packet as suspicious.

Conceptually:

```text
Inbound TCP packet
       |
       v
Initial SYN?
       |
      YES
       |
       v
Record destination port
       |
       v
8+ unique ports within 10 seconds?
       |
      YES
       |
       v
Generate SCAN-001
Severity: HIGH
```

This helps reduce false positives compared with simply counting arbitrary TCP traffic.

---

# 🚨 Security Events

When a detection rule triggers, Sentinel-X persists a structured security event in SQLite.

A security event can contain:

- Event ID
- Event type
- Source
- Target
- Severity
- Description
- Creation timestamp

Example:

```text
Event Type : SCAN-001
Severity   : HIGH
Source     : <source-ip>
Target     : <protected-endpoint>
```

Persisting the event separates historical security evidence from temporary in-memory packet telemetry.

---

# 🚑 Incident Operations

A qualifying security event can automatically generate a linked incident.

The current incident-response lifecycle is:

```text
OPEN
  |
  v
INVESTIGATING
  |
  v
CONTAINED
  |
  v
RESOLVED
```

Sentinel-X enforces forward lifecycle transitions.

For example:

```text
OPEN -> INVESTIGATING        VALID
INVESTIGATING -> CONTAINED   VALID
CONTAINED -> RESOLVED        VALID

OPEN -> RESOLVED             BLOCKED
RESOLVED -> INVESTIGATING    BLOCKED
```

Each incident can retain its connection to the original security event.

---

# 📊 Explainable Risk Intelligence

Sentinel-X uses an **explainable weighted risk model** rather than generating an unexplained score.

## Current Risk Model

| Factor | Weight |
|---|---:|
| Threat Severity | 40% |
| Asset Criticality | 30% |
| Detection Confidence | 20% |
| Incident Status | 10% |

### Example Initial SCAN-001 Assessment

```text
Threat Severity       HIGH    80 x 40% = 32
Asset Criticality     HIGH    80 x 30% = 24
Detection Confidence  HIGH    90 x 20% = 18
Incident Status       OPEN   100 x 10% = 10
                                      ----
Final Risk Score                       84/100
Risk Level                             HIGH
```

Because the factors are visible, an analyst can understand **why** a particular score was produced.

Risk can also be reassessed as an incident moves through its lifecycle, allowing Sentinel-X to preserve risk history.

---

# 🔬 Digital Forensics

Sentinel-X contains a **Forensic Evidence Vault** for preserving security artifacts associated with incidents.

Evidence records can contain:

- Evidence ID
- Incident ID
- Linked security event
- Evidence type
- Source
- Target
- Detection context
- Incident context
- Risk context
- Normalized evidence data
- Preservation timestamp
- SHA-256 hash
- Integrity status

Example evidence chain:

```text
Security Event
      |
      v
Incident
      |
      v
Risk Assessment
      |
      v
Normalized Evidence Artifact
      |
      v
SHA-256
      |
      v
Evidence Vault
```

---

# 🔐 SHA-256 Evidence Integrity

Sentinel-X uses **SHA-256 cryptographic hashing** to verify preserved evidence.

When evidence is created:

```text
Normalized Evidence Data
          |
          v
       SHA-256
          |
          v
   Stored Hash Digest
```

During integrity verification:

```text
Stored Evidence
       |
       v
Recalculate SHA-256
       |
       v
Compare Digests
       |
       +------ MATCH ------> VERIFIED
       |
       +---- MISMATCH -----> FAILED
```

This means the application does not simply display a `VERIFIED` label.

The verification endpoint recalculates the SHA-256 digest and compares it with the hash stored when the evidence was preserved.

---

# 🛡️ Security Audit Engine

Sentinel-X includes an automated security audit engine that evaluates real persisted platform data.

## Current Audit Controls

| Control | Security Area |
|---|---|
| `AUD-001` | Detection Capability |
| `AUD-002` | Incident Response |
| `AUD-003` | Risk Intelligence |
| `AUD-004` | Forensic Preservation |
| `AUD-005` | Evidence Integrity |

Each control produces:

- Control status
- Score
- Finding
- Recommendation

Possible states:

```text
PASS
WARNING
FAIL
```

The audit engine calculates an overall security posture from the individual control results.

### Evidence Integrity Audit

`AUD-005` independently recalculates the SHA-256 digest of preserved evidence.

It does **not** simply trust the previously stored integrity status.

---

# 🧪 Controlled Lab Validation

Sentinel-X has been tested using an authorized two-device cybersecurity lab.

During development, a Kali Linux system generated controlled TCP SYN activity against the Windows endpoint running Sentinel-X.

Example lab topology:

```text
Kali Linux Lab Host
192.168.137.188
        |
        | Controlled TCP SYN activity
        v
Windows Sentinel-X Endpoint
192.168.137.1
        |
        v
Npcap
        |
        v
Scapy
        |
        v
SCAN-001
```

The controlled test crossed the configured threshold:

```text
8 unique TCP destination ports
within
10 seconds
```

Sentinel-X then produced the following real defensive workflow:

```text
Controlled Kali SYN Activity
          |
          v
SCAN-001 Detection
          |
          v
HIGH Security Event
          |
          v
OPEN Incident
          |
          v
84/100 HIGH Risk Assessment
          |
          v
Forensic Evidence
          |
          v
SHA-256 Integrity Verification
          |
          v
5-Control Security Audit
```

The test validated integration between:

- Packet capture
- Network telemetry
- Detection
- Event persistence
- Incident creation
- Risk assessment
- Evidence preservation
- Integrity verification
- Security auditing

> The addresses shown above are private lab addresses used during development and are not permanent Sentinel-X configuration requirements.

---

# 🧱 System Architecture

```text
+----------------------------------------------------------+
|                     SENTINEL-X                           |
+----------------------------------------------------------+

                    NETWORK LAYER
                         |
                         v
                +----------------+
                | Npcap / Scapy  |
                +----------------+
                         |
                         v
                +----------------+
                | Packet Sensor  |
                +----------------+
                         |
                         v
                +----------------+
                | Flow Telemetry |
                +----------------+
                         |
                         v
                +----------------+
                |    SCAN-001    |
                | Detection Rule |
                +----------------+
                         |
                         v
               +------------------+
               | Response Pipeline|
               +------------------+
                  |      |      |
                  v      v      v
               EVENT  INCIDENT  RISK
                  \      |      /
                   \     |     /
                    v    v    v
                +----------------+
                |    FORENSICS   |
                +----------------+
                         |
                         v
                +----------------+
                |     SHA-256    |
                +----------------+
                         |
                         v
                +----------------+
                | SECURITY AUDIT |
                +----------------+
                         |
                         v
                +----------------+
                | React Dashboard|
                +----------------+
```

---

# 🧰 Technology Stack

## Backend

- Python
- FastAPI
- SQLAlchemy
- SQLite
- Scapy
- Npcap
- Pydantic
- Uvicorn

## Frontend

- React 19
- Vite 8
- React Router
- Motion
- Lucide React
- Recharts

## Security Concepts

- Network telemetry
- TCP/IP analysis
- TCP flag inspection
- SYN-based behavioral detection
- Network flow aggregation
- Incident-response lifecycle
- Explainable risk scoring
- Digital evidence preservation
- SHA-256 integrity verification
- Security-control auditing

---

# 📁 Project Structure

```text
Sentinel-X/
|
+-- backend/
|   |
|   +-- app/
|   |   |
|   |   +-- api/
|   |   |   +-- audit.py
|   |   |   +-- events.py
|   |   |   +-- forensics.py
|   |   |   +-- incidents.py
|   |   |   +-- network.py
|   |   |   +-- risk.py
|   |   |
|   |   +-- core/
|   |   |   +-- database.py
|   |   |   +-- init_db.py
|   |   |
|   |   +-- detection/
|   |   |   +-- scan_detector.py
|   |   |
|   |   +-- models/
|   |   +-- schemas/
|   |   +-- services/
|   |   |
|   |   +-- main.py
|   |
|   +-- requirements.txt
|
+-- frontend/
|   |
|   +-- public/
|   |
|   +-- src/
|   |   +-- components/
|   |   +-- hooks/
|   |   +-- pages/
|   |   +-- services/
|   |   +-- styles/
|   |
|   +-- package.json
|   +-- vite.config.js
|
+-- .gitignore
+-- README.md
```

---

# ⚙️ Installation

## Prerequisites

Recommended development environment:

- Windows 10 or Windows 11
- Python 3
- Node.js
- npm
- Git
- Npcap

Npcap is required for the current Windows packet-capture implementation.

Depending on the local environment, packet capture may require appropriate privileges.

---

# 🐍 Backend Setup

Clone the repository:

```powershell
git clone https://github.com/Shadowcode-byte/Sentinel-X.git
```

Enter the backend:

```powershell
cd Sentinel-X\backend
```

Create a virtual environment:

```powershell
python -m venv .venv
```

Activate it:

```powershell
.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
python -m pip install -r requirements.txt
```

Start the backend:

```powershell
python -m uvicorn app.main:app --reload
```

FastAPI:

```text
http://127.0.0.1:8000
```

Swagger documentation:

```text
http://127.0.0.1:8000/docs
```

---

# ⚛️ Frontend Setup

Open another terminal:

```powershell
cd Sentinel-X\frontend
```

Install dependencies:

```powershell
npm install
```

Start the development server:

```powershell
npm run dev
```

The frontend is normally available at:

```text
http://localhost:5173
```

---

# 📡 Packet Sensor Configuration

The current implementation uses an environment-specific Npcap interface and protected endpoint address.

Configuration is currently located in:

```text
backend/app/services/packet_collector.py
```

Example:

```python
WIFI_INTERFACE = (
    r"\Device\NPF_{YOUR-INTERFACE-GUID}"
)

INTERFACE_NAME = "Your Interface"

INTERFACE_DESCRIPTION = (
    "Your Network Adapter"
)

MONITORED_HOST = "YOUR_WINDOWS_IPV4"
```

These values vary between systems.

Users should configure Sentinel-X for their own authorized monitoring environment instead of copying development-machine values.

Dynamic interface and endpoint discovery are planned improvements.

---

# 🔌 API Overview

Sentinel-X exposes its backend functionality through versioned REST endpoints.

## System

```text
GET /api/v1/health
GET /api/v1/system/status
```

## Security Events

```text
GET  /api/v1/events
POST /api/v1/events
```

## Network Monitoring

```text
GET  /api/v1/network/status
GET  /api/v1/network/telemetry
GET  /api/v1/network/detections

POST /api/v1/network/capture/start
POST /api/v1/network/capture/stop
POST /api/v1/network/telemetry/reset
```

## Incidents

```text
GET   /api/v1/incidents
GET   /api/v1/incidents/{incident_id}
POST  /api/v1/incidents
PATCH /api/v1/incidents/{incident_id}/status
```

## Risk Intelligence

```text
GET /api/v1/risk
```

## Forensics

```text
GET  /api/v1/forensics
GET  /api/v1/forensics/{evidence_id}
GET  /api/v1/forensics/incident/{incident_id}

POST /api/v1/forensics/{evidence_id}/verify
POST /api/v1/forensics/preserve/incident/{incident_id}
```

## Security Audit

```text
GET  /api/v1/audit
GET  /api/v1/audit/latest
GET  /api/v1/audit/{audit_run_id}
POST /api/v1/audit/run
```

Interactive documentation for the exact running API is available through Swagger.

---

# 📸 Dashboard

Sentinel-X currently provides dedicated views for:

### 01 — Command Center

Central SOC-style overview.

### 02 — Network Monitor

Live endpoint telemetry and flow visibility.

### 03 — Threat Detection

Detection rule status and security-event analysis.

### 04 — Incident Operations

Incident investigation and response lifecycle.

### 05 — Risk Intelligence

Explainable cyber-risk scoring and assessment history.

### 06 — Forensics

Evidence preservation and SHA-256 integrity verification.

### 07 — Security Audit

Security posture evaluation, findings, recommendations, and control scoring.

### Reports

Currently under development.

---

# 🔒 Data & Repository Safety

Runtime and machine-specific data are intentionally excluded from Git.

The repository `.gitignore` prevents files such as:

```text
backend/.venv/
backend/data/
frontend/node_modules/
__pycache__/
*.db
.env
```

from being committed.

This keeps virtual environments, runtime databases, generated caches, secrets, and local dependency directories outside the source repository.

---

# ⚠️ Current Limitations

Sentinel-X is an actively developed educational security platform rather than a production SIEM/EDR product.

Current limitations include:

- SCAN-001 is currently the primary implemented behavioral detection rule.
- Packet-capture interface selection is environment-specific.
- Protected-host configuration is environment-specific.
- Current monitoring focuses on one protected endpoint.
- SQLite is used as the local persistence layer.
- Forensic evidence currently preserves normalized security context rather than complete PCAP evidence.
- Authentication and role-based authorization are not yet implemented.
- Automated containment is not yet implemented.
- Reporting is still under development.
- Production deployment hardening has not yet been completed.

These limitations are documented intentionally to distinguish implemented capabilities from planned functionality.

---

# 🗺️ Roadmap

Planned development includes:

- [ ] Reports and security-report generation
- [ ] Exportable incident reports
- [ ] Exportable forensic reports
- [ ] Dynamic network-interface discovery
- [ ] Dynamic protected-host configuration
- [ ] Additional behavioral detection rules
- [ ] Detection-rule management
- [ ] Expanded threat analytics
- [ ] Enhanced incident timelines
- [ ] Additional forensic artifact types
- [ ] PCAP evidence preservation
- [ ] Audit-history comparison
- [ ] Automated containment workflows
- [ ] Authentication
- [ ] Role-based access control
- [ ] Multi-endpoint monitoring
- [ ] Persistent platform configuration
- [ ] Production deployment architecture
- [ ] Live hosted dashboard

---

# 🌐 Deployment Direction

The final Sentinel-X architecture is intended to separate endpoint sensing from the hosted application.

A future deployment model may follow:

```text
Protected Windows Endpoint
        |
        | Npcap + Scapy
        v
Sentinel-X Sensor
        |
        | Security Telemetry
        v
Deployed Sentinel-X Backend
        |
        v
Persistent Security Data
        |
        v
Live Web Dashboard
```

This allows packet sensing to remain close to the monitored endpoint while the dashboard and central services can be accessed remotely.

---

# ⚖️ Ethical Use

Sentinel-X is intended for:

- Cybersecurity education
- Defensive security research
- Authorized security laboratories
- Systems owned by the operator
- Networks where explicit testing permission has been granted

Do not use Sentinel-X or associated testing techniques to scan, monitor, interfere with, or assess systems without authorization.

---

# 🚧 Development Status

```text
OBSERVE      [IMPLEMENTED]
DETECT       [IMPLEMENTED]
INCIDENT     [IMPLEMENTED]
RISK         [IMPLEMENTED]
FORENSICS    [IMPLEMENTED]
AUDIT        [IMPLEMENTED]
REPORT       [IN DEVELOPMENT]
DEPLOYMENT   [PLANNED]
```

Sentinel-X is under active development, and the architecture will continue to evolve as additional defensive capabilities are implemented.

---

# 🛡️ Sentinel-X

### Observe. Detect. Investigate. Assess. Preserve. Verify.

**A unified cybersecurity operations project designed to make the path from network activity to defensible security evidence understandable, explainable, and traceable.**

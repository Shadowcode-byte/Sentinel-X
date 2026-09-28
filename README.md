\# Sentinel-X



\### Unified Cyber Threat Detection, Network Analysis \& Incident Response Platform



Sentinel-X is a full-stack cybersecurity monitoring and response platform designed to observe endpoint network activity, detect suspicious behavior, create security incidents, calculate explainable cyber-risk, preserve forensic evidence, verify evidence integrity using SHA-256, and evaluate security controls through an automated audit engine.



The project combines live network telemetry with a modular security operations workflow, providing a single interface for moving from raw network activity to detection, investigation, risk assessment, digital forensics, and security auditing.



> Sentinel-X is currently an educational cybersecurity project under active development. It is intended for authorized lab environments and defensive security research.



\---



\## Overview



Traditional security monitoring often separates network visibility, threat detection, incident response, risk analysis, and forensic investigation into different systems.



Sentinel-X explores how these capabilities can be integrated into one understandable security operations platform.



The current implementation provides the following workflow:



```text

Network Traffic

&#x20;     |

&#x20;     v

Npcap + Scapy Packet Sensor

&#x20;     |

&#x20;     v

Network Telemetry

&#x20;     |

&#x20;     v

SCAN-001 Detection Engine

&#x20;     |

&#x20;     v

Security Event

&#x20;     |

&#x20;     v

Incident

&#x20;     |

&#x20;     v

Explainable Risk Assessment

&#x20;     |

&#x20;     v

Forensic Evidence

&#x20;     |

&#x20;     v

SHA-256 Integrity Verification

&#x20;     |

&#x20;     v

Security Audit

```



The React dashboard provides dedicated modules for observing and investigating each stage.



\---



\# Key Capabilities



\## Live Network Monitoring



Sentinel-X uses Scapy with Npcap on Windows to observe network metadata from a selected network interface.



The collector currently tracks:



\- TCP traffic

\- UDP traffic

\- DNS activity

\- ICMP traffic

\- Network flows

\- Source and destination addresses

\- Source and destination ports

\- TCP SYN and ACK state

\- Inbound and outbound traffic direction



Packet payload contents are not stored by the current telemetry collector.



\---



\## Threat Detection



Sentinel-X currently implements the detection rule:



\### SCAN-001 — TCP SYN Multi-Port Scan Detection



The rule monitors inbound initial TCP SYN attempts directed toward the protected endpoint.



Current threshold:



```text

8 unique TCP destination ports

within

10 seconds

```



The detector focuses on initial SYN attempts rather than treating every TCP packet as a scan indicator.



When the threshold is reached, Sentinel-X generates a `HIGH` severity security event.



\---



\## Security Events



Detected security activity is persisted in SQLite.



A security event contains information such as:



\- Event type

\- Source

\- Target

\- Severity

\- Description

\- Creation timestamp



This provides a persistent record independent of the in-memory packet telemetry.



\---



\## Incident Response



A qualifying detection can automatically create an incident linked to its originating security event.



Current incident lifecycle:



```text

OPEN

&#x20; |

&#x20; v

INVESTIGATING

&#x20; |

&#x20; v

CONTAINED

&#x20; |

&#x20; v

RESOLVED

```



Sentinel-X enforces forward lifecycle transitions to keep incident state changes consistent.



\---



\## Explainable Risk Intelligence



Sentinel-X calculates an explainable risk score instead of generating an unexplained or random value.



Current weighted model:



| Factor | Weight |

|---|---:|

| Threat Severity | 40% |

| Asset Criticality | 30% |

| Detection Confidence | 20% |

| Incident Status | 10% |



Example initial assessment for the current SCAN-001 configuration:



```text

Severity: HIGH              80 x 40% = 32

Asset Criticality: HIGH     80 x 30% = 24

Detection Confidence: HIGH  90 x 20% = 18

Incident Status: OPEN      100 x 10% = 10

&#x20;                                     ----

Final Risk Score                         84/100

Risk Level                               HIGH

```



A new risk assessment can also be generated as the incident progresses through its response lifecycle, preserving risk history rather than silently overwriting earlier assessments.



\---



\# Digital Forensics



Sentinel-X includes a forensic evidence preservation workflow.



Forensic records can contain security context such as:



\- Incident ID

\- Linked security event

\- Evidence type

\- Source

\- Target

\- Detection description

\- Incident context

\- Risk context

\- Normalized evidence data

\- Preservation timestamp



Evidence data is normalized before hashing to provide deterministic integrity verification.



\---



\## SHA-256 Evidence Integrity



When forensic evidence is preserved, Sentinel-X calculates a SHA-256 digest of the normalized evidence artifact.



```text

Evidence Data

&#x20;     |

&#x20;     v

SHA-256

&#x20;     |

&#x20;     v

Stored Evidence Hash

```



During verification, Sentinel-X recalculates the digest:



```text

Stored SHA-256

&#x20;      |

&#x20;      | compare

&#x20;      v

Recalculated SHA-256



MATCH     -> VERIFIED

MISMATCH  -> FAILED

```



This allows the platform to detect changes to preserved evidence data.



\---



\# Security Audit Engine



Sentinel-X contains a security audit engine that evaluates real persisted platform data.



The current audit contains five controls:



| Control | Security Area |

|---|---|

| AUD-001 | Detection Capability |

| AUD-002 | Incident Response |

| AUD-003 | Risk Intelligence |

| AUD-004 | Forensic Preservation |

| AUD-005 | Evidence Integrity |



Each control produces:



\- Status

\- Score

\- Finding

\- Recommendation



Possible states include:



```text

PASS

WARNING

FAIL

```



The Evidence Integrity control independently recalculates SHA-256 hashes instead of simply trusting the previously stored integrity status.



\---



\# Dashboard Modules



The Sentinel-X interface currently contains:



\### Command Center



High-level security operations overview including:



\- Monitoring state

\- Security event count

\- High-severity activity

\- Defense engine status

\- Network pulse

\- Defense topology

\- Threat matrix

\- Endpoint intelligence

\- Event stream



\### Network Operations



Live network telemetry and flow visibility.



\### Threat Detection



Security-event visibility and detection analysis.



\### Incident Operations



Incident investigation and response lifecycle management.



\### Risk Intelligence



Explainable risk scoring, factor breakdown, linked incident context, and assessment history.



\### Forensic Evidence Vault



Evidence preservation, metadata inspection, normalized evidence visibility, SHA-256 hashes, and live integrity verification.



\### Security Audit



Security posture assessment with control findings, recommendations, scores, and repeatable audit execution.



\### Reports



Reporting is part of the Sentinel-X roadmap and is being developed as the next major module.



\---



\# Technology Stack



\## Backend



\- Python

\- FastAPI

\- SQLAlchemy

\- SQLite

\- Scapy

\- Npcap

\- Pydantic

\- Uvicorn



\## Frontend



\- React 19

\- Vite 8

\- React Router

\- Motion

\- Lucide React

\- Recharts



\## Security / Networking



\- TCP/IP telemetry

\- TCP flag inspection

\- SYN-based scan detection

\- Network flow aggregation

\- SHA-256 cryptographic hashing

\- Incident-response lifecycle

\- Explainable risk scoring



\---



\# Project Structure



```text

Sentinel-X/

|

|-- backend/

|   |-- app/

|   |   |-- api/

|   |   |   |-- audit.py

|   |   |   |-- events.py

|   |   |   |-- forensics.py

|   |   |   |-- incidents.py

|   |   |   |-- network.py

|   |   |   `-- risk.py

|   |   |

|   |   |-- core/

|   |   |   |-- database.py

|   |   |   `-- init\_db.py

|   |   |

|   |   |-- detection/

|   |   |   `-- scan\_detector.py

|   |   |

|   |   |-- models/

|   |   |-- schemas/

|   |   |-- services/

|   |   |

|   |   `-- main.py

|   |

|   `-- requirements.txt

|

|-- frontend/

|   |-- public/

|   |-- src/

|   |   |-- components/

|   |   |-- hooks/

|   |   |-- pages/

|   |   |-- services/

|   |   `-- styles/

|   |

|   |-- package.json

|   `-- vite.config.js

|

|-- .gitignore

`-- README.md

```



\---



\# Installation



\## Prerequisites



Recommended development environment:



\- Windows 10 or Windows 11

\- Python 3

\- Node.js / npm

\- Npcap

\- Git



For packet capture on Windows, Npcap must be installed and the backend may require appropriate privileges to access the selected capture interface.



\---



\# Backend Setup



Clone the repository and enter the backend directory:



```powershell

git clone <repository-url>

cd Sentinel-X\\backend

```



Create a Python virtual environment:



```powershell

python -m venv .venv

```



Activate it:



```powershell

.venv\\Scripts\\Activate.ps1

```



Install dependencies:



```powershell

python -m pip install -r requirements.txt

```



Start the FastAPI backend:



```powershell

python -m uvicorn app.main:app --reload

```



Backend:



```text

http://127.0.0.1:8000

```



Swagger API documentation:



```text

http://127.0.0.1:8000/docs

```



\---



\# Frontend Setup



Open another terminal:



```powershell

cd Sentinel-X\\frontend

```



Install dependencies:



```powershell

npm install

```



Start the Vite development server:



```powershell

npm run dev

```



The frontend is normally available at:



```text

http://localhost:5173

```



\---



\# Network Sensor Configuration



The current packet collector uses a configured Npcap interface and protected host address.



These values are located in:



```text

backend/app/services/packet\_collector.py

```



Example configuration fields:



```python

WIFI\_INTERFACE = (

&#x20;   r"\\Device\\NPF\_{YOUR-INTERFACE-GUID}"

)



INTERFACE\_NAME = "Your Interface"



INTERFACE\_DESCRIPTION = (

&#x20;   "Your Network Adapter"

)



MONITORED\_HOST = "YOUR\_WINDOWS\_IPV4"

```



Network-interface GUIDs and IP addresses vary between machines and networks.



Do not copy development-machine values blindly. Configure Sentinel-X for the interface and endpoint used in your own authorized environment.



Automatic interface discovery is planned for a future version.



\---



\# API Overview



Important API groups currently include:



```text

/api/v1/health

/api/v1/system/status



/api/v1/events



/api/v1/network/status

/api/v1/network/telemetry

/api/v1/network/detections

/api/v1/network/capture/start

/api/v1/network/capture/stop

/api/v1/network/telemetry/reset



/api/v1/incidents



/api/v1/risk



/api/v1/forensics



/api/v1/audit

/api/v1/audit/latest

/api/v1/audit/run

```



Interactive endpoint documentation is available through FastAPI Swagger at `/docs`.



\---



\# Controlled Lab Demonstration



Sentinel-X has been tested in an authorized two-device lab.



Example lab topology used during development:



```text

Kali Linux Lab Host

192.168.137.188

&#x20;       |

&#x20;       | controlled TCP SYN scan

&#x20;       v

Windows Sentinel-X Endpoint

192.168.137.1

```



The test used a restricted set of TCP ports against the owned/authorized Windows lab endpoint.



The resulting pipeline was:



```text

Controlled TCP SYN Activity

&#x20;       |

&#x20;       v

SCAN-001

8 unique SYN destination ports / 10 seconds

&#x20;       |

&#x20;       v

HIGH Security Event

&#x20;       |

&#x20;       v

OPEN Incident

&#x20;       |

&#x20;       v

84/100 HIGH Initial Risk

&#x20;       |

&#x20;       v

Forensic Evidence

&#x20;       |

&#x20;       v

SHA-256 Integrity Verification

&#x20;       |

&#x20;       v

Security Audit

```



The demonstration validated the integration between network telemetry, detection, persistence, incident response, risk analysis, forensic preservation, integrity verification, and security auditing.



The IP addresses above are private lab addresses and are not permanent Sentinel-X configuration requirements.



\---



\# Screenshots



Recommended screenshots for the repository include:



1\. Command Center

2\. Network Operations

3\. Threat Detection showing SCAN-001

4\. Incident Operations showing the linked incident

5\. Risk Intelligence showing the explainable 84/100 assessment

6\. Forensic Evidence Vault showing SHA-256 verification

7\. Security Audit showing the control assessment



A dedicated documentation/screenshots directory can be added as the project documentation evolves.



\---



\# Current Limitations



Sentinel-X is actively being developed.



Current limitations include:



\- SCAN-001 is currently the primary implemented behavioral detection rule.

\- Packet capture interface configuration is currently environment-specific.

\- Protected endpoint IP configuration is currently environment-specific.

\- The current forensic artifact preserves normalized incident/detection metadata rather than a complete packet capture file.

\- SQLite is used as the current local persistence layer.

\- The project currently focuses on a controlled single-endpoint lab environment.

\- Authentication and role-based access control are not yet implemented.

\- Reporting capabilities are still under development.

\- Production deployment hardening has not yet been completed.



These limitations are intentionally documented so the repository clearly distinguishes implemented functionality from future goals.



\---



\# Roadmap



Planned improvements include:



\- Dynamic network-interface discovery

\- Dynamic protected-host configuration

\- Additional detection rules

\- Expanded behavioral analytics

\- Detection-rule management

\- Enhanced incident timelines

\- Automated containment workflows

\- Additional forensic artifact types

\- PCAP evidence support

\- Audit history comparison

\- Security report generation

\- Exportable incident and forensic reports

\- Authentication and authorization

\- Multi-endpoint monitoring

\- Persistent configuration management

\- Production deployment support



\---



\# Ethical Use



Sentinel-X is intended for:



\- Cybersecurity education

\- Defensive security research

\- Authorized security laboratories

\- Networks and systems owned by the operator

\- Environments where explicit testing permission has been granted



Do not use Sentinel-X or associated testing procedures to scan, monitor, interfere with, or assess systems without authorization.



\---



\# Development Status



Sentinel-X is under active development.



Current major pipeline:



```text

OBSERVE     -> Implemented

DETECT      -> Implemented

INCIDENT    -> Implemented

RISK        -> Implemented

FORENSICS   -> Implemented

AUDIT       -> Implemented

REPORT      -> In Development

```



\---



\# Sentinel-X



\*\*Observe. Detect. Investigate. Assess. Preserve. Verify.\*\*



A unified security operations project built to make the path from network activity to defensible security evidence understandable and traceable.


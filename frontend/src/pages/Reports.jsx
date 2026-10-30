import { API_BASE } from "../services/apiConfig";
import {
  useEffect,
  useState,
} from "react";

import { motion } from "motion/react";

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  FileText,
  Fingerprint,
  Gauge,
  RefreshCw,
  ScrollText,
  ShieldCheck,
  Siren,
} from "lucide-react";





function formatDate(value) {
  if (!value) return "--";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleString();
}


function Reports() {
  const [report, setReport] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [online, setOnline] =
    useState(false);

  const [lastUpdated, setLastUpdated] =
    useState(null);


  async function loadReport() {
    try {
      const response = await fetch(
        `${API_BASE}/api/v1/reports/security`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Report API unavailable"
        );
      }

      const data =
        await response.json();

      setReport(data);
      setOnline(true);
      setLastUpdated(new Date());
    } catch (error) {
      console.error(
        "Sentinel-X report error:",
        error
      );

      setOnline(false);
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadReport();

    const interval =
      window.setInterval(
        loadReport,
        5000
      );

    return () =>
      window.clearInterval(
        interval
      );
  }, []);


  const summary =
    report?.executive_summary || {};


  const realThreatEvents =
    (
      report?.security_events || []
    ).filter(
      (event) =>
        event.event_type !==
        "SYSTEM_TEST"
    );


  const latestIncident =
    report?.incidents?.[0];


  const latestRisk =
    report?.risk_assessments?.[0];


  const latestEvidence =
    report?.forensic_evidence?.[0];


  const audit =
    report?.latest_audit || [];


  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 18,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.55,
      }}
      style={{
        "--report-acid":
          "#d7ff57",

        "--report-cream":
          "#ece8d9",

        "--report-muted":
          "#9a9e89",

        "--report-dim":
          "#747966",

        "--report-purple":
          "#9b82ff",

        "--report-red":
          "#ff6258",

        "--report-amber":
          "#ffbd59",

        "--report-line":
          "rgba(232,230,211,.11)",

        width: "100%",
        paddingBottom: "32px",
        color:
          "var(--report-cream)",
      }}
    >
      {/* HERO */}

      <section
        style={{
          minHeight: "215px",
          padding: "34px 36px",

          border:
            "1px solid var(--report-line)",

          background:
            "radial-gradient(circle at 82% 0%, rgba(155,130,255,.08), transparent 32%), linear-gradient(135deg, rgba(18,21,14,.97), rgba(8,9,6,.99))",

          display: "flex",

          alignItems:
            "flex-end",

          justifyContent:
            "space-between",

          gap: "35px",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",

              color:
                "var(--report-purple)",

              fontFamily:
                "var(--font-tech)",

              fontSize: "10px",
              fontWeight: 700,

              letterSpacing:
                ".13em",
            }}
          >
            <ScrollText size={14} />

            08 / SECURITY REPORTS
          </div>


          <h2
            style={{
              margin:
                "18px 0 13px",

              fontSize:
                "clamp(42px,5vw,68px)",

              fontWeight: 420,
              lineHeight: 0.9,

              letterSpacing:
                "-0.05em",
            }}
          >
            SECURITY

            <span
              style={{
                display: "block",
                color: "#969a84",
                fontWeight: 320,
              }}
            >
              REPORTS
            </span>
          </h2>


          <p
            style={{
              maxWidth: "700px",
              margin: 0,

              color:
                "var(--report-muted)",

              fontSize: "13px",
              lineHeight: 1.7,
            }}
          >
            Unified security reporting
            across threat detection,
            incident response, risk
            intelligence, digital
            forensics and security
            auditing.
          </p>
        </div>


        <div
          style={{
            minWidth: "300px",

            border:
              "1px solid var(--report-line)",

            background:
              "rgba(8,10,6,.78)",
          }}
        >
          <StatusRow
            label="REPORT ENGINE"
            value={
              online
                ? "ONLINE"
                : "OFFLINE"
            }
          />

          <StatusRow
            label="REPORT TYPE"
            value="UNIFIED"
          />

          <StatusRow
            label="AUDIT STATUS"
            value={
              summary
                .latest_audit_status ||
              "--"
            }
          />
        </div>
      </section>


      {/* METRICS */}

      <div
        style={{
          marginTop: "15px",

          display: "grid",

          gridTemplateColumns:
            "repeat(auto-fit,minmax(145px,1fr))",

          gap: "10px",
        }}
      >
        <Metric
          icon={Activity}
          label="EVENTS"
          value={
            summary.security_events ??
            0
          }
        />

        <Metric
          icon={AlertTriangle}
          label="HIGH SEVERITY"
          value={
            summary
              .high_severity_events ??
            0
          }
          tone="red"
        />

        <Metric
          icon={Siren}
          label="INCIDENTS"
          value={
            summary.incidents ?? 0
          }
          tone="amber"
        />

        <Metric
          icon={Gauge}
          label="HIGH RISK"
          value={
            summary
              .current_high_risk ??
            0
          }
          tone="purple"
        />

        <Metric
          icon={Fingerprint}
          label="EVIDENCE"
          value={
            summary
              .forensic_evidence ??
            0
          }
        />

        <Metric
          icon={ShieldCheck}
          label="AUDIT SCORE"
          value={
            summary
              .latest_audit_score ??
            "--"
          }
        />
      </div>


      {/* REPORT CONTROL */}

      <section
        style={{
          ...panelStyle,
          marginTop: "15px",
        }}
      >
        <PanelHeader
          eyebrow="REPORT ENGINE"
          title="Unified Security Report"
          icon={FileText}
        />

        <div
          style={{
            padding: "22px",

            display: "flex",

            justifyContent:
              "space-between",

            alignItems: "center",

            gap: "20px",

            flexWrap: "wrap",
          }}
        >
          <div>
            <Label>
              GENERATED
            </Label>

            <strong
              style={{
                display: "block",
                marginTop: "7px",

                fontFamily:
                  "var(--font-tech)",

                fontSize: "11px",
              }}
            >
              {formatDate(
                report?.generated_at
              )}
            </strong>
          </div>


          <div
  style={{
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  }}
>
  <button
    type="button"
    onClick={loadReport}
    style={buttonStyle}
  >
    <RefreshCw size={14} />

    REFRESH REPORT
  </button>

  <button
    type="button"
    onClick={() => {
      window.location.href =
        `${API_BASE}/api/v1/reports/security/pdf`;
    }}
    style={buttonStyle}
  >
    <FileText size={14} />

    DOWNLOAD PDF REPORT
  </button>
</div>
        </div>
      </section>


      {/* INCIDENT + RISK */}

      <div
        style={{
          marginTop: "15px",

          display: "grid",

          gridTemplateColumns:
            "repeat(auto-fit,minmax(330px,1fr))",

          gap: "15px",
        }}
      >
        <section style={panelStyle}>
          <PanelHeader
            eyebrow="INCIDENT SUMMARY"
            title={
              latestIncident
                ? `Incident #${latestIncident.id}`
                : "No Incident"
            }
            icon={Siren}
          />

          {latestIncident ? (
            <div
              style={{
                padding: "22px",

                display: "grid",

                gridTemplateColumns:
                  "repeat(2,minmax(0,1fr))",

                gap: "10px",
              }}
            >
              <Field
                label="TYPE"
                value={
                  latestIncident
                    .incident_type
                }
              />

              <Field
                label="STATUS"
                value={
                  latestIncident.status
                }
              />

              <Field
                label="SEVERITY"
                value={
                  latestIncident
                    .severity
                }
              />

              <Field
                label="EVENT"
                value={
                  `#${latestIncident.linked_event_id}`
                }
              />

              <Field
                label="SOURCE"
                value={
                  latestIncident.source
                }
              />

              <Field
                label="TARGET"
                value={
                  latestIncident.target
                }
              />
            </div>
          ) : (
            <Empty />
          )}
        </section>


        <section style={panelStyle}>
          <PanelHeader
            eyebrow="RISK SUMMARY"
            title={
              latestRisk
                ? `Risk Assessment #${latestRisk.id}`
                : "No Risk Assessment"
            }
            icon={Gauge}
          />

          {latestRisk ? (
            <div
              style={{
                padding: "22px",
              }}
            >
              <div
                style={{
                  display: "flex",

                  alignItems:
                    "center",

                  gap: "22px",
                }}
              >
                <div
                  style={{
                    width: "115px",
                    height: "115px",

                    borderRadius:
                      "50%",

                    border:
                      "1px solid #ffbd59",

                    display: "flex",

                    flexDirection:
                      "column",

                    justifyContent:
                      "center",

                    alignItems:
                      "center",
                  }}
                >
                  <strong
                    style={{
                      fontSize:
                        "28px",

                      color:
                        "#ffbd59",

                      fontFamily:
                        "var(--font-tech)",
                    }}
                  >
                    {
                      latestRisk
                        .risk_score
                    }
                  </strong>

                  <span
                    style={{
                      fontSize: "9px",

                      color:
                        "var(--report-dim)",
                    }}
                  >
                    /100
                  </span>
                </div>


                <div>
                  <Label>
                    RISK LEVEL
                  </Label>

                  <h3
                    style={{
                      margin:
                        "7px 0",

                      color:
                        "#ffbd59",
                    }}
                  >
                    {
                      latestRisk
                        .risk_level
                    }
                  </h3>

                  <p
                    style={{
                      margin: 0,

                      color:
                        "var(--report-muted)",

                      fontSize:
                        "10px",

                      lineHeight: 1.6,
                    }}
                  >
                    {
                      latestRisk
                        .rationale
                    }
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <Empty />
          )}
        </section>
      </div>


      {/* FORENSICS */}

      <section
        style={{
          ...panelStyle,
          marginTop: "15px",
        }}
      >
        <PanelHeader
          eyebrow="FORENSIC SUMMARY"
          title="Evidence Integrity"
          icon={Fingerprint}
        />

        {latestEvidence ? (
          <div
            style={{
              padding: "22px",
            }}
          >
            <div
              style={{
                display: "grid",

                gridTemplateColumns:
                  "repeat(auto-fit,minmax(150px,1fr))",

                gap: "10px",
              }}
            >
              <Field
                label="EVIDENCE"
                value={
                  `#${latestEvidence.id}`
                }
              />

              <Field
                label="TYPE"
                value={
                  latestEvidence
                    .evidence_type
                }
              />

              <Field
                label="INCIDENT"
                value={
                  `#${latestEvidence.incident_id}`
                }
              />

              <Field
                label="INTEGRITY"
                value={
                  latestEvidence
                    .integrity_status
                }
              />
            </div>


            <div
              style={{
                marginTop: "12px",
                padding: "14px",

                border:
                  "1px solid var(--report-line)",
              }}
            >
              <Label>
                SHA-256
              </Label>

              <code
                style={{
                  display: "block",

                  marginTop: "8px",

                  color:
                    "var(--report-cream)",

                  fontSize: "10px",

                  overflowWrap:
                    "anywhere",
                }}
              >
                {
                  latestEvidence
                    .sha256_hash
                }
              </code>
            </div>
          </div>
        ) : (
          <Empty />
        )}
      </section>


      {/* AUDIT */}

      <section
        style={{
          ...panelStyle,
          marginTop: "15px",
        }}
      >
        <PanelHeader
          eyebrow="SECURITY POSTURE"
          title="Latest Audit Controls"
          icon={FileCheck2}
        />

        {audit.length > 0 ? (
          <div
            style={{
              padding: "12px 22px 22px",
            }}
          >
            {audit.map(
              (control) => (
                <div
                  key={control.id}
                  style={{
                    minHeight: "55px",

                    borderBottom:
                      "1px solid var(--report-line)",

                    display: "grid",

                    gridTemplateColumns:
                      "90px 1fr 100px 80px",

                    alignItems:
                      "center",

                    gap: "10px",

                    fontFamily:
                      "var(--font-tech)",

                    fontSize: "10px",
                  }}
                >
                  <strong
                    style={{
                      color:
                        "var(--report-purple)",
                    }}
                  >
                    {
                      control.control_id
                    }
                  </strong>

                  <span>
                    {
                      control.control_name
                    }
                  </span>

                  <span
                    style={{
                      color:
                        "#d7ff57",
                    }}
                  >
                    {
                      control.status
                    }
                  </span>

                  <strong>
                    {
                      control.score
                    }
                  </strong>
                </div>
              )
            )}
          </div>
        ) : (
          <Empty />
        )}
      </section>


      {/* THREAT EVENTS */}

      <section
        style={{
          ...panelStyle,
          marginTop: "15px",
        }}
      >
        <PanelHeader
          eyebrow="THREAT SUMMARY"
          title="Detected Security Activity"
          icon={AlertTriangle}
        />

        {realThreatEvents.length >
        0 ? (
          <div
            style={{
              padding: "22px",
            }}
          >
            {realThreatEvents.map(
              (event) => (
                <div
                  key={event.id}
                  style={{
                    padding: "15px",

                    border:
                      "1px solid var(--report-line)",

                    background:
                      "rgba(255,255,255,.008)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",

                      justifyContent:
                        "space-between",

                      gap: "15px",
                    }}
                  >
                    <strong>
                      {event.event_type}
                    </strong>

                    <strong
                      style={{
                        color:
                          "#ff6258",
                      }}
                    >
                      {event.severity}
                    </strong>
                  </div>

                  <p
                    style={{
                      margin:
                        "10px 0 0",

                      color:
                        "var(--report-muted)",

                      fontSize:
                        "10px",

                      lineHeight: 1.7,
                    }}
                  >
                    {event.description}
                  </p>
                </div>
              )
            )}
          </div>
        ) : (
          <Empty />
        )}
      </section>


      {/* FOOTER */}

      <div
        style={{
          marginTop: "11px",

          display: "flex",

          justifyContent:
            "space-between",

          color:
            "var(--report-dim)",

          fontFamily:
            "var(--font-tech)",

          fontSize: "9px",
        }}
      >
        <span>
          {online
            ? "REPORT CHANNEL ONLINE"
            : "REPORT CHANNEL OFFLINE"}
        </span>

        <span>
          {lastUpdated
            ? `UPDATED ${lastUpdated.toLocaleTimeString()}`
            : loading
              ? "LOADING REPORT"
              : "WAITING"}
        </span>
      </div>
    </motion.section>
  );
}


const panelStyle = {
  border:
    "1px solid var(--report-line)",

  background:
    "linear-gradient(145deg, rgba(17,20,13,.95), rgba(8,9,6,.98))",

  boxShadow:
    "0 18px 50px rgba(0,0,0,.16)",
};


const buttonStyle = {
  minHeight: "40px",

  padding: "0 16px",

  border:
    "1px solid rgba(215,255,87,.28)",

  background:
    "rgba(215,255,87,.035)",

  color: "#d7ff57",

  display: "flex",

  alignItems: "center",

  gap: "8px",

  fontFamily:
    "var(--font-tech)",

  fontSize: "9px",

  fontWeight: 750,

  cursor: "pointer",
};


function Label({
  children,
}) {
  return (
    <span
      style={{
        color:
          "var(--report-dim)",

        fontFamily:
          "var(--font-tech)",

        fontSize: "9px",

        fontWeight: 700,

        letterSpacing:
          ".08em",
      }}
    >
      {children}
    </span>
  );
}


function StatusRow({
  label,
  value,
}) {
  return (
    <div
      style={{
        minHeight: "48px",

        padding: "0 14px",

        borderBottom:
          "1px solid var(--report-line)",

        display: "flex",

        justifyContent:
          "space-between",

        alignItems:
          "center",

        fontFamily:
          "var(--font-tech)",

        fontSize: "9px",
      }}
    >
      <span
        style={{
          color:
            "var(--report-dim)",
        }}
      >
        {label}
      </span>

      <strong
        style={{
          color:
            "#d7ff57",
        }}
      >
        {value}
      </strong>
    </div>
  );
}


function Metric({
  icon: Icon,
  label,
  value,
  tone,
}) {
  let color =
    "#d7ff57";

  if (tone === "red") {
    color = "#ff6258";
  }

  if (tone === "amber") {
    color = "#ffbd59";
  }

  if (tone === "purple") {
    color = "#9b82ff";
  }


  return (
    <div
      style={{
        minHeight: "100px",

        padding: "15px",

        border:
          "1px solid var(--report-line)",

        background:
          "linear-gradient(145deg, rgba(17,20,13,.95), rgba(8,9,6,.98))",

        display: "flex",

        flexDirection:
          "column",

        justifyContent:
          "space-between",
      }}
    >
      <div
        style={{
          display: "flex",

          justifyContent:
            "space-between",
        }}
      >
        <Label>
          {label}
        </Label>

        <Icon
          size={15}
          color={color}
        />
      </div>

      <strong
        style={{
          color,

          fontFamily:
            "var(--font-tech)",

          fontSize: "27px",

          fontWeight: 500,
        }}
      >
        {value}
      </strong>
    </div>
  );
}


function PanelHeader({
  eyebrow,
  title,
  icon: Icon,
}) {
  return (
    <div
      style={{
        minHeight: "72px",

        padding: "18px 22px",

        borderBottom:
          "1px solid var(--report-line)",

        display: "flex",

        justifyContent:
          "space-between",

        alignItems:
          "center",
      }}
    >
      <div>
        <Label>
          {eyebrow}
        </Label>

        <h3
          style={{
            margin:
              "6px 0 0",

            fontSize: "16px",

            fontWeight: 570,
          }}
        >
          {title}
        </h3>
      </div>

      <Icon
        size={18}
        color="#9b82ff"
      />
    </div>
  );
}


function Field({
  label,
  value,
}) {
  return (
    <div
      style={{
        minHeight: "62px",

        padding: "11px",

        border:
          "1px solid var(--report-line)",

        background:
          "rgba(255,255,255,.008)",
      }}
    >
      <Label>
        {label}
      </Label>

      <strong
        style={{
          display: "block",

          marginTop: "7px",

          fontFamily:
            "var(--font-tech)",

          fontSize: "10px",

          overflowWrap:
            "anywhere",
        }}
      >
        {value ?? "--"}
      </strong>
    </div>
  );
}


function Empty() {
  return (
    <div
      style={{
        minHeight: "120px",

        display: "flex",

        justifyContent:
          "center",

        alignItems:
          "center",

        color:
          "var(--report-dim)",

        fontFamily:
          "var(--font-tech)",

        fontSize: "10px",
      }}
    >
      NO REPORT DATA AVAILABLE
    </div>
  );
}


export default Reports;
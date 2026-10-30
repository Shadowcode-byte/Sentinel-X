import { API_BASE } from "../services/apiConfig";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { motion } from "motion/react";

import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Database,
  FileCheck2,
  Gauge,
  Play,
  RefreshCw,
  ShieldCheck,
  ShieldX,
} from "lucide-react";





function normalizeValue(value) {
  return String(
    value || ""
  ).toUpperCase();
}


function formatDateTime(value) {
  if (!value) {
    return "--";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "--";
  }

  return date.toLocaleString(
    [],
    {
      dateStyle: "medium",
      timeStyle: "medium",
    }
  );
}


function SecurityAudit() {
  const [
    auditResults,
    setAuditResults,
  ] = useState([]);


  const [
    apiOnline,
    setApiOnline,
  ] = useState(false);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    runningAudit,
    setRunningAudit,
  ] = useState(false);


  const [
    lastUpdated,
    setLastUpdated,
  ] = useState(null);


  const [
    runSummary,
    setRunSummary,
  ] = useState(null);


  /*
   * =====================================================
   * LOAD LATEST AUDIT
   * =====================================================
   */

  async function loadLatestAudit() {
    try {
      const response =
        await fetch(
          `${API_BASE}/api/v1/audit/latest`,
          {
            cache: "no-store",
          }
        );


      if (!response.ok) {
        throw new Error(
          "Security Audit API unavailable."
        );
      }


      const data =
        await response.json();


      const records =
        Array.isArray(data)
          ? data
          : [];


      setAuditResults(
        records
      );


      setApiOnline(true);

      setLastUpdated(
        new Date()
      );
    } catch (error) {
      console.error(
        "Sentinel-X audit error:",
        error
      );

      setApiOnline(false);
    } finally {
      setLoading(false);
    }
  }


  /*
   * =====================================================
   * INITIAL LOAD
   * =====================================================
   */

  useEffect(() => {
    loadLatestAudit();

    const interval =
      window.setInterval(
        loadLatestAudit,
        5000
      );


    return () => {
      window.clearInterval(
        interval
      );
    };
  }, []);


  /*
   * =====================================================
   * RUN SECURITY AUDIT
   * =====================================================
   */

  async function runSecurityAudit() {
    setRunningAudit(true);


    try {
      const response =
        await fetch(
          `${API_BASE}/api/v1/audit/run`,
          {
            method: "POST",
          }
        );


      if (!response.ok) {
        throw new Error(
          "Security audit execution failed."
        );
      }


      const result =
        await response.json();


      setRunSummary(
        result
      );


      setAuditResults(
        Array.isArray(
          result.results
        )
          ? result.results
          : []
      );


      setApiOnline(true);

      setLastUpdated(
        new Date()
      );
    } catch (error) {
      console.error(
        "Sentinel-X audit execution error:",
        error
      );
    } finally {
      setRunningAudit(false);
    }
  }


  /*
   * =====================================================
   * METRICS
   * =====================================================
   */

  const metrics =
    useMemo(
      () => {
        const result = {
          total:
            auditResults.length,

          passed:
            0,

          warnings:
            0,

          failed:
            0,

          score:
            0,
        };


        for (
          const control
          of auditResults
        ) {
          const state =
            normalizeValue(
              control.status
            );


          if (
            state === "PASS"
          ) {
            result.passed += 1;
          }


          if (
            state === "WARNING"
          ) {
            result.warnings += 1;
          }


          if (
            state === "FAIL"
          ) {
            result.failed += 1;
          }
        }


        if (
          auditResults.length >
          0
        ) {
          result.score =
            Math.round(
              (
                auditResults.reduce(
                  (
                    total,
                    control
                  ) =>
                    total +
                    Number(
                      control.score ||
                      0
                    ),
                  0
                ) /
                auditResults.length
              ) *
                100
            ) /
            100;
        }


        return result;
      },
      [auditResults]
    );


  const overallStatus =
    useMemo(
      () => {
        if (
          runSummary
            ?.overall_status
        ) {
          return normalizeValue(
            runSummary
              .overall_status
          );
        }


        if (
          auditResults.length ===
          0
        ) {
          return "WAITING";
        }


        if (
          metrics.failed > 0
        ) {
          return "FAIL";
        }


        if (
          metrics.warnings > 0
        ) {
          return "WARNING";
        }


        return "PASS";
      },
      [
        runSummary,
        auditResults,
        metrics,
      ]
    );


  const auditRunId =
    auditResults[0]
      ?.audit_run_id ||
    runSummary
      ?.audit_run_id ||
    "--";


  const auditTime =
    auditResults[0]
      ?.created_at ||
    null;


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

        ease: [
          0.16,
          1,
          0.3,
          1,
        ],
      }}
      style={{
        "--audit-acid":
          "#d7ff57",

        "--audit-cream":
          "#ece8d9",

        "--audit-muted":
          "#9a9e89",

        "--audit-dim":
          "#747966",

        "--audit-purple":
          "#9b82ff",

        "--audit-red":
          "#ff6258",

        "--audit-amber":
          "#ffbd59",

        "--audit-line":
          "rgba(232,230,211,0.11)",

        width:
          "100%",

        paddingBottom:
          "32px",

        color:
          "var(--audit-cream)",
      }}
    >
      {/* ===================================================
          HERO
          =================================================== */}

      <section
        style={{
          position:
            "relative",

          minHeight:
            "215px",

          padding:
            "34px 36px",

          overflow:
            "hidden",

          border:
            "1px solid var(--audit-line)",

          background:
            "radial-gradient(circle at 82% 0%, rgba(215,255,87,.07), transparent 32%), linear-gradient(135deg, rgba(18,21,14,.97), rgba(8,9,6,.99))",

          display:
            "flex",

          alignItems:
            "flex-end",

          justifyContent:
            "space-between",

          gap:
            "35px",
        }}
      >
        <div>
          <div
            style={{
              display:
                "flex",

              alignItems:
                "center",

              gap:
                "8px",

              color:
                "var(--audit-acid)",

              fontFamily:
                "var(--font-tech)",

              fontSize:
                "10px",

              fontWeight:
                700,

              letterSpacing:
                ".13em",
            }}
          >
            <ShieldCheck
              size={14}
              strokeWidth={1.5}
            />

            07 / SECURITY AUDIT
          </div>


          <h2
            style={{
              margin:
                "18px 0 13px",

              color:
                "var(--audit-cream)",

              fontSize:
                "clamp(42px,5vw,68px)",

              fontWeight:
                420,

              lineHeight:
                0.9,

              letterSpacing:
                "-0.05em",
            }}
          >
            SECURITY

            <span
              style={{
                display:
                  "block",

                color:
                  "#969a84",

                fontWeight:
                  320,
              }}
            >
              AUDIT
            </span>
          </h2>


          <p
            style={{
              maxWidth:
                "700px",

              margin:
                0,

              color:
                "#a1a58f",

              fontSize:
                "13px",

              lineHeight:
                1.7,
            }}
          >
            Evaluate Sentinel-X
            detection coverage,
            incident-response
            readiness, risk
            intelligence, forensic
            preservation and evidence
            integrity using live
            platform data.
          </p>
        </div>


        <div
          style={{
            minWidth:
              "310px",

            border:
              "1px solid var(--audit-line)",

            background:
              "rgba(8,10,6,.78)",
          }}
        >
          <HeroStatus
            label="AUDIT ENGINE"
            value={
              apiOnline
                ? "ONLINE"
                : "OFFLINE"
            }
            active={
              apiOnline
            }
          />


          <HeroStatus
            label="LATEST STATUS"
            value={
              overallStatus
            }
            active={
              overallStatus ===
              "PASS"
            }
          />


          <HeroStatus
            label="CONTROLS"
            value={
              metrics.total
            }
            active={
              metrics.total >
              0
            }
          />
        </div>
      </section>


      {/* ===================================================
          METRICS
          =================================================== */}

      <div
        style={{
          marginTop:
            "15px",

          display:
            "grid",

          gridTemplateColumns:
            "repeat(auto-fit,minmax(145px,1fr))",

          gap:
            "10px",
        }}
      >
        <MetricCard
          icon={Gauge}
          label="AUDIT SCORE"
          value={
            metrics.total
              ? `${metrics.score}`
              : "--"
          }
        />


        <MetricCard
          icon={ClipboardCheck}
          label="CONTROLS"
          value={
            metrics.total
          }
          tone="purple"
        />


        <MetricCard
          icon={CheckCircle2}
          label="PASSED"
          value={
            metrics.passed
          }
        />


        <MetricCard
          icon={AlertTriangle}
          label="WARNINGS"
          value={
            metrics.warnings
          }
          tone="amber"
        />


        <MetricCard
          icon={ShieldX}
          label="FAILED"
          value={
            metrics.failed
          }
          tone="red"
        />
      </div>


      {/* ===================================================
          AUDIT COMMAND
          =================================================== */}

      <section
        style={{
          ...panelStyle,

          marginTop:
            "15px",
        }}
      >
        <PanelHeading
          eyebrow="POSTURE ASSESSMENT"
          title="Security Audit Control"
          icon={RefreshCw}
        />


        <div
          style={{
            padding:
              "22px",

            display:
              "flex",

            alignItems:
              "center",

            justifyContent:
              "space-between",

            gap:
              "25px",

            flexWrap:
              "wrap",
          }}
        >
          <div>
            <span
              style={
                fieldLabelStyle
              }
            >
              LATEST AUDIT RUN
            </span>


            <strong
              style={{
                display:
                  "block",

                marginTop:
                  "7px",

                color:
                  "var(--audit-cream)",

                fontFamily:
                  "var(--font-tech)",

                fontSize:
                  "11px",

                overflowWrap:
                  "anywhere",
              }}
            >
              {auditRunId}
            </strong>


            <span
              style={{
                display:
                  "block",

                marginTop:
                  "7px",

                color:
                  "var(--audit-dim)",

                fontFamily:
                  "var(--font-tech)",

                fontSize:
                  "9px",
              }}
            >
              {auditTime
                ? formatDateTime(
                    auditTime
                  )
                : "NO AUDIT DATA"}
            </span>
          </div>


          <button
            type="button"
            onClick={
              runSecurityAudit
            }
            disabled={
              runningAudit
            }
            style={{
              minHeight:
                "42px",

              padding:
                "0 18px",

              border:
                "1px solid rgba(215,255,87,.28)",

              color:
                "#d7ff57",

              background:
                "rgba(215,255,87,.035)",

              display:
                "flex",

              alignItems:
                "center",

              gap:
                "8px",

              fontFamily:
                "var(--font-tech)",

              fontSize:
                "9px",

              fontWeight:
                750,

              letterSpacing:
                ".07em",

              cursor:
                runningAudit
                  ? "wait"
                  : "pointer",
            }}
          >
            {runningAudit ? (
              <>
                <RefreshCw
                  size={14}
                />

                RUNNING AUDIT...
              </>
            ) : (
              <>
                <Play
                  size={14}
                />

                RUN SECURITY AUDIT
              </>
            )}
          </button>
        </div>
      </section>


      {/* ===================================================
          OVERALL POSTURE
          =================================================== */}

      <section
        style={{
          ...panelStyle,

          marginTop:
            "15px",
        }}
      >
        <PanelHeading
          eyebrow="CURRENT ASSESSMENT"
          title="Security Posture"
          icon={ShieldCheck}
        />


        {auditResults.length >
        0 ? (
          <div
            style={{
              padding:
                "26px 22px",

              display:
                "grid",

              gridTemplateColumns:
                "190px 1fr",

              gap:
                "28px",

              alignItems:
                "center",
            }}
          >
            <AuditScore
              score={
                metrics.score
              }
              status={
                overallStatus
              }
            />


            <div>
              <span
                style={
                  fieldLabelStyle
                }
              >
                OVERALL RESULT
              </span>


              <h3
                style={{
                  margin:
                    "7px 0 10px",

                  color:
                    getStatusColor(
                      overallStatus
                    ),

                  fontSize:
                    "24px",

                  fontWeight:
                    560,
                }}
              >
                {overallStatus}
              </h3>


              <p
                style={{
                  maxWidth:
                    "650px",

                  margin:
                    0,

                  color:
                    "var(--audit-muted)",

                  fontSize:
                    "11px",

                  lineHeight:
                    1.7,
                }}
              >
                Sentinel-X evaluated{" "}
                {metrics.total} security
                controls using persisted
                detection, incident, risk
                and forensic evidence
                data.
              </p>


              <div
                style={{
                  marginTop:
                    "18px",

                  display:
                    "grid",

                  gridTemplateColumns:
                    "repeat(3,minmax(110px,1fr))",

                  gap:
                    "9px",
                }}
              >
                <SmallStat
                  label="PASS"
                  value={
                    metrics.passed
                  }
                />


                <SmallStat
                  label="WARNING"
                  value={
                    metrics.warnings
                  }
                />


                <SmallStat
                  label="FAIL"
                  value={
                    metrics.failed
                  }
                />
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            loading={
              loading
            }
          />
        )}
      </section>


      {/* ===================================================
          CONTROL RESULTS
          =================================================== */}

      <section
        style={{
          ...panelStyle,

          marginTop:
            "15px",
        }}
      >
        <PanelHeading
          eyebrow="CONTROL ASSESSMENT"
          title="Audit Findings"
          icon={FileCheck2}
        />


        {auditResults.length >
        0 ? (
          <div
            style={{
              padding:
                "12px 22px 22px",
            }}
          >
            {auditResults.map(
              (
                control,
                index
              ) => (
                <motion.article
                  key={
                    control.id
                  }
                  initial={{
                    opacity: 0,
                    y: 7,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay:
                      index *
                      0.035,
                  }}
                  style={{
                    marginTop:
                      "10px",

                    padding:
                      "16px",

                    border:
                      "1px solid var(--audit-line)",

                    background:
                      "rgba(255,255,255,.008)",
                  }}
                >
                  <div
                    style={{
                      display:
                        "flex",

                      alignItems:
                        "center",

                      justifyContent:
                        "space-between",

                      gap:
                        "15px",

                      flexWrap:
                        "wrap",
                    }}
                  >
                    <div
                      style={{
                        display:
                          "flex",

                        alignItems:
                          "center",

                        gap:
                          "12px",
                      }}
                    >
                      <span
                        style={{
                          color:
                            "var(--audit-purple)",

                          fontFamily:
                            "var(--font-tech)",

                          fontSize:
                            "9px",

                          fontWeight:
                            750,
                        }}
                      >
                        {
                          control.control_id
                        }
                      </span>


                      <strong
                        style={{
                          color:
                            "var(--audit-cream)",

                          fontSize:
                            "13px",

                          fontWeight:
                            560,
                        }}
                      >
                        {
                          control.control_name
                        }
                      </strong>
                    </div>


                    <div
                      style={{
                        display:
                          "flex",

                        alignItems:
                          "center",

                        gap:
                          "15px",
                      }}
                    >
                      <strong
                        style={{
                          color:
                            "var(--audit-muted)",

                          fontFamily:
                            "var(--font-tech)",

                          fontSize:
                            "10px",
                        }}
                      >
                        {
                          control.score
                        }
                        /100
                      </strong>


                      <StatusBadge
                        status={
                          control.status
                        }
                      />
                    </div>
                  </div>


                  <div
                    style={{
                      marginTop:
                        "13px",

                      display:
                        "grid",

                      gridTemplateColumns:
                        "1fr 1fr",

                      gap:
                        "10px",
                    }}
                  >
                    <TextPanel
                      label="FINDING"
                      text={
                        control.finding
                      }
                    />


                    <TextPanel
                      label="RECOMMENDATION"
                      text={
                        control.recommendation
                      }
                    />
                  </div>


                  <div
                    style={{
                      marginTop:
                        "10px",

                      display:
                        "flex",

                      justifyContent:
                        "space-between",

                      color:
                        "var(--audit-dim)",

                      fontFamily:
                        "var(--font-tech)",

                      fontSize:
                        "8px",

                      letterSpacing:
                        ".05em",
                    }}
                  >
                    <span>
                      {
                        control.category
                      }
                    </span>


                    <span>
                      {formatDateTime(
                        control.created_at
                      )}
                    </span>
                  </div>
                </motion.article>
              )
            )}
          </div>
        ) : (
          <EmptyData />
        )}
      </section>


      {/* ===================================================
          AUDIT TABLE
          =================================================== */}

      <section
        style={{
          ...panelStyle,

          marginTop:
            "15px",

          overflow:
            "hidden",
        }}
      >
        <PanelHeading
          eyebrow="LATEST AUDIT"
          title="Control Matrix"
          icon={Database}
        />


        <div
          style={{
            overflowX:
              "auto",
          }}
        >
          <div
            style={{
              minWidth:
                "760px",
            }}
          >
            <div
              style={{
                minHeight:
                  "42px",

                padding:
                  "0 22px",

                display:
                  "grid",

                gridTemplateColumns:
                  "110px 1fr 180px 110px 100px",

                alignItems:
                  "center",

                borderBottom:
                  "1px solid var(--audit-line)",

                color:
                  "var(--audit-dim)",

                fontFamily:
                  "var(--font-tech)",

                fontSize:
                  "9px",

                fontWeight:
                  700,

                letterSpacing:
                  ".07em",
              }}
            >
              <span>CONTROL</span>
              <span>NAME</span>
              <span>CATEGORY</span>
              <span>STATUS</span>
              <span>SCORE</span>
            </div>


            {auditResults.map(
              (control) => (
                <div
                  key={
                    `matrix-${control.id}`
                  }
                  style={{
                    minHeight:
                      "50px",

                    padding:
                      "0 22px",

                    display:
                      "grid",

                    gridTemplateColumns:
                      "110px 1fr 180px 110px 100px",

                    alignItems:
                      "center",

                    borderBottom:
                      "1px solid rgba(236,232,217,.055)",

                    color:
                      "var(--audit-muted)",

                    fontFamily:
                      "var(--font-tech)",

                    fontSize:
                      "10px",
                  }}
                >
                  <strong>
                    {
                      control.control_id
                    }
                  </strong>


                  <span>
                    {
                      control.control_name
                    }
                  </span>


                  <span>
                    {
                      control.category
                    }
                  </span>


                  <span
                    style={{
                      color:
                        getStatusColor(
                          control.status
                        ),
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
        </div>


        <div
          style={{
            minHeight:
              "44px",

            padding:
              "0 22px",

            display:
              "flex",

            alignItems:
              "center",

            justifyContent:
              "space-between",

            color:
              "var(--audit-dim)",

            fontFamily:
              "var(--font-tech)",

            fontSize:
              "9px",
          }}
        >
          <span>
            SQLITE // SECURITY_AUDITS
          </span>

          <span>
            {metrics.total} CONTROLS
          </span>
        </div>
      </section>


      {/* ===================================================
          FOOTER
          =================================================== */}

      <div
        style={{
          marginTop:
            "11px",

          display:
            "flex",

          alignItems:
            "center",

          justifyContent:
            "space-between",

          gap:
            "15px",

          color:
            "var(--audit-dim)",

          fontFamily:
            "var(--font-tech)",

          fontSize:
            "9px",
        }}
      >
        <span>
          {apiOnline
            ? "AUDIT CHANNEL ONLINE"
            : "AUDIT CHANNEL OFFLINE"}
        </span>


        <span>
          {lastUpdated
            ? `UPDATED ${lastUpdated.toLocaleTimeString()}`
            : "WAITING FOR AUDIT DATA"}
        </span>
      </div>
    </motion.section>
  );
}


/* =========================================================
   STYLES
   ========================================================= */

const panelStyle = {
  border:
    "1px solid var(--audit-line)",

  background:
    "linear-gradient(145deg, rgba(17,20,13,.95), rgba(8,9,6,.98))",

  boxShadow:
    "0 18px 50px rgba(0,0,0,.16)",
};


const fieldLabelStyle = {
  color:
    "var(--audit-dim)",

  fontFamily:
    "var(--font-tech)",

  fontSize:
    "9px",

  fontWeight:
    700,

  letterSpacing:
    ".08em",
};


/* =========================================================
   HELPERS
   ========================================================= */

function getStatusColor(
  status
) {
  const normalized =
    normalizeValue(
      status
    );


  if (
    normalized === "PASS"
  ) {
    return "#d7ff57";
  }


  if (
    normalized ===
    "WARNING"
  ) {
    return "#ffbd59";
  }


  if (
    normalized === "FAIL"
  ) {
    return "#ff6258";
  }


  return "#9a9e89";
}


/* =========================================================
   COMPONENTS
   ========================================================= */

function PanelHeading({
  eyebrow,
  title,
  icon: Icon,
}) {
  return (
    <div
      style={{
        minHeight:
          "72px",

        padding:
          "18px 22px",

        borderBottom:
          "1px solid var(--audit-line)",

        display:
          "flex",

        alignItems:
          "center",

        justifyContent:
          "space-between",
      }}
    >
      <div>
        <span
          style={
            fieldLabelStyle
          }
        >
          {eyebrow}
        </span>


        <h3
          style={{
            margin:
              "6px 0 0",

            color:
              "var(--audit-cream)",

            fontSize:
              "16px",

            fontWeight:
              570,
          }}
        >
          {title}
        </h3>
      </div>


      <Icon
        size={18}
        strokeWidth={1.4}
        color="#d7ff57"
      />
    </div>
  );
}


function HeroStatus({
  label,
  value,
  active,
}) {
  return (
    <div
      style={{
        minHeight:
          "48px",

        padding:
          "0 14px",

        borderBottom:
          "1px solid var(--audit-line)",

        display:
          "flex",

        alignItems:
          "center",

        justifyContent:
          "space-between",

        fontFamily:
          "var(--font-tech)",
      }}
    >
      <span
        style={{
          color:
            "var(--audit-dim)",

          fontSize:
            "9px",

          fontWeight:
            650,
        }}
      >
        {label}
      </span>


      <strong
        style={{
          color:
            active
              ? "var(--audit-acid)"
              : "var(--audit-muted)",

          fontSize:
            "10px",
        }}
      >
        {value}
      </strong>
    </div>
  );
}


function MetricCard({
  icon: Icon,
  label,
  value,
  tone,
}) {
  let color =
    "var(--audit-acid)";


  if (
    tone === "red"
  ) {
    color =
      "var(--audit-red)";
  }


  if (
    tone === "amber"
  ) {
    color =
      "var(--audit-amber)";
  }


  if (
    tone === "purple"
  ) {
    color =
      "var(--audit-purple)";
  }


  return (
    <div
      style={{
        minHeight:
          "100px",

        padding:
          "15px",

        border:
          "1px solid var(--audit-line)",

        background:
          "linear-gradient(145deg, rgba(17,20,13,.95), rgba(8,9,6,.98))",

        display:
          "flex",

        flexDirection:
          "column",

        justifyContent:
          "space-between",
      }}
    >
      <div
        style={{
          display:
            "flex",

          justifyContent:
            "space-between",
        }}
      >
        <span
          style={
            fieldLabelStyle
          }
        >
          {label}
        </span>


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

          fontSize:
            "27px",

          fontWeight:
            500,
        }}
      >
        {value}
      </strong>
    </div>
  );
}


function AuditScore({
  score,
  status,
}) {
  const color =
    getStatusColor(
      status
    );


  return (
    <div
      style={{
        width:
          "165px",

        height:
          "165px",

        borderRadius:
          "50%",

        border:
          `1px solid ${color}`,

        boxShadow:
          `0 0 35px ${color}18`,

        display:
          "flex",

        flexDirection:
          "column",

        alignItems:
          "center",

        justifyContent:
          "center",
      }}
    >
      <span
        style={
          fieldLabelStyle
        }
      >
        AUDIT SCORE
      </span>


      <strong
        style={{
          marginTop:
            "6px",

          color,

          fontFamily:
            "var(--font-tech)",

          fontSize:
            "34px",

          fontWeight:
            500,
        }}
      >
        {score}
      </strong>


      <span
        style={{
          color:
            "var(--audit-dim)",

          fontFamily:
            "var(--font-tech)",

          fontSize:
            "9px",
        }}
      >
        /100
      </span>


      <strong
        style={{
          marginTop:
            "7px",

          color,

          fontFamily:
            "var(--font-tech)",

          fontSize:
            "9px",
        }}
      >
        {status}
      </strong>
    </div>
  );
}


function SmallStat({
  label,
  value,
}) {
  return (
    <div
      style={{
        minHeight:
          "58px",

        padding:
          "10px",

        border:
          "1px solid var(--audit-line)",

        background:
          "rgba(255,255,255,.008)",
      }}
    >
      <span
        style={
          fieldLabelStyle
        }
      >
        {label}
      </span>


      <strong
        style={{
          display:
            "block",

          marginTop:
            "6px",

          color:
            "var(--audit-cream)",

          fontFamily:
            "var(--font-tech)",

          fontSize:
            "15px",
        }}
      >
        {value}
      </strong>
    </div>
  );
}


function StatusBadge({
  status,
}) {
  const normalized =
    normalizeValue(
      status
    );


  const color =
    getStatusColor(
      normalized
    );


  return (
    <strong
      style={{
        minWidth:
          "72px",

        padding:
          "6px 9px",

        border:
          `1px solid ${color}35`,

        color,

        background:
          `${color}08`,

        fontFamily:
          "var(--font-tech)",

        fontSize:
          "9px",

        textAlign:
          "center",
      }}
    >
      {normalized}
    </strong>
  );
}


function TextPanel({
  label,
  text,
}) {
  return (
    <div
      style={{
        padding:
          "13px",

        border:
          "1px solid var(--audit-line)",

        background:
          "rgba(0,0,0,.12)",
      }}
    >
      <span
        style={
          fieldLabelStyle
        }
      >
        {label}
      </span>


      <p
        style={{
          margin:
            "7px 0 0",

          color:
            "var(--audit-muted)",

          fontSize:
            "10px",

          lineHeight:
            1.65,
        }}
      >
        {text}
      </p>
    </div>
  );
}


function EmptyState({
  loading,
}) {
  return (
    <div
      style={{
        minHeight:
          "240px",

        display:
          "flex",

        flexDirection:
          "column",

        alignItems:
          "center",

        justifyContent:
          "center",

        gap:
          "10px",
      }}
    >
      <ShieldCheck
        size={29}
        color="#d7ff57"
      />


      <strong
        style={{
          color:
            "var(--audit-cream)",

          fontFamily:
            "var(--font-tech)",

          fontSize:
            "11px",
        }}
      >
        {loading
          ? "LOADING AUDIT DATA"
          : "NO AUDIT AVAILABLE"}
      </strong>
    </div>
  );
}


function EmptyData() {
  return (
    <div
      style={{
        minHeight:
          "120px",

        display:
          "flex",

        alignItems:
          "center",

        justifyContent:
          "center",

        color:
          "var(--audit-dim)",

        fontFamily:
          "var(--font-tech)",

        fontSize:
          "10px",
      }}
    >
      NO AUDIT CONTROL DATA AVAILABLE
    </div>
  );
}


export default SecurityAudit;
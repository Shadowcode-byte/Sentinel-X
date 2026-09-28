import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  motion,
} from "motion/react";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Database,
  Gauge,
  Layers3,
  Link2,
  Radar,
  ShieldAlert,
  ShieldCheck,
  Target,
} from "lucide-react";


const API_BASE =
  "http://127.0.0.1:8000";


const RISK_WEIGHTS = [
  {
    label: "SEVERITY",
    weight: 40,
    description:
      "Threat severity assigned by the detection engine.",
  },

  {
    label: "ASSET CRITICALITY",
    weight: 30,
    description:
      "Importance of the protected endpoint.",
  },

  {
    label: "DETECTION CONFIDENCE",
    weight: 20,
    description:
      "Confidence in the detection rule result.",
  },

  {
    label: "INCIDENT STATUS",
    weight: 10,
    description:
      "Current stage of the response lifecycle.",
  },
];


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


function RiskIntelligence() {
  const [
    assessments,
    setAssessments,
  ] = useState([]);


  const [
    incidents,
    setIncidents,
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
    selectedAssessmentId,
    setSelectedAssessmentId,
  ] = useState(null);


  const [
    lastUpdated,
    setLastUpdated,
  ] = useState(null);


  /*
   * =====================================================
   * LOAD RISK DATA
   * =====================================================
   */

  useEffect(() => {
    let mounted = true;


    async function loadRiskData() {
      try {
        const [
          riskResponse,
          incidentResponse,
        ] = await Promise.all([
          fetch(
            `${API_BASE}/api/v1/risk`,
            {
              cache: "no-store",
            }
          ),

          fetch(
            `${API_BASE}/api/v1/incidents`,
            {
              cache: "no-store",
            }
          ),
        ]);


        if (
          !riskResponse.ok ||
          !incidentResponse.ok
        ) {
          throw new Error(
            "Sentinel-X risk services unavailable."
          );
        }


        const riskData =
          await riskResponse.json();


        const incidentData =
          await incidentResponse.json();


        if (!mounted) {
          return;
        }


        setAssessments(
          Array.isArray(
            riskData
          )
            ? riskData
            : []
        );


        setIncidents(
          Array.isArray(
            incidentData
          )
            ? incidentData
            : []
        );


        setApiOnline(true);

        setLastUpdated(
          new Date()
        );


        if (
          Array.isArray(
            riskData
          ) &&
          riskData.length > 0
        ) {
          setSelectedAssessmentId(
            (currentId) => {
              if (
                currentId !== null &&
                riskData.some(
                  (assessment) =>
                    assessment.id ===
                    currentId
                )
              ) {
                return currentId;
              }


              return riskData[0].id;
            }
          );
        }
      } catch (error) {
        console.error(
          "Sentinel-X Risk Intelligence error:",
          error
        );


        if (mounted) {
          setApiOnline(false);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }


    loadRiskData();


    const interval =
      window.setInterval(
        loadRiskData,
        2000
      );


    return () => {
      mounted = false;

      window.clearInterval(
        interval
      );
    };
  }, []);


  /*
   * =====================================================
   * RISK METRICS
   * =====================================================
   */

  const metrics =
    useMemo(
      () => {
        const result = {
          total:
            assessments.length,

          critical:
            0,

          high:
            0,

          medium:
            0,

          low:
            0,
        };


        for (
          const assessment
          of assessments
        ) {
          const level =
            normalizeValue(
              assessment.risk_level
            );


          if (
            level ===
            "CRITICAL"
          ) {
            result.critical += 1;
          } else if (
            level === "HIGH"
          ) {
            result.high += 1;
          } else if (
            level === "MEDIUM"
          ) {
            result.medium += 1;
          } else {
            result.low += 1;
          }
        }


        return result;
      },
      [assessments]
    );


  /*
   * =====================================================
   * SELECTED ASSESSMENT
   * =====================================================
   */

  const selectedAssessment =
    useMemo(
      () =>
        assessments.find(
          (assessment) =>
            assessment.id ===
            selectedAssessmentId
        ) ||
        assessments[0] ||
        null,
      [
        assessments,
        selectedAssessmentId,
      ]
    );


  const linkedIncident =
    useMemo(
      () => {
        if (
          !selectedAssessment
            ?.incident_id
        ) {
          return null;
        }


        return (
          incidents.find(
            (incident) =>
              incident.id ===
              selectedAssessment
                .incident_id
          ) || null
        );
      },
      [
        incidents,
        selectedAssessment,
      ]
    );


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
        "--risk-acid":
          "#d7ff57",

        "--risk-cream":
          "#ece8d9",

        "--risk-muted":
          "#9a9e89",

        "--risk-dim":
          "#747966",

        "--risk-purple":
          "#9b82ff",

        "--risk-red":
          "#ff6258",

        "--risk-amber":
          "#ffbd59",

        "--risk-line":
          "rgba(232,230,211,0.11)",

        width:
          "100%",

        paddingBottom:
          "32px",

        color:
          "var(--risk-cream)",
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
            "1px solid var(--risk-line)",

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
                "var(--risk-acid)",

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
            <Gauge
              size={14}
              strokeWidth={1.5}
            />

            05 / RISK INTELLIGENCE
          </div>


          <h2
            style={{
              margin:
                "18px 0 13px",

              color:
                "var(--risk-cream)",

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
            RISK

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
              INTELLIGENCE
            </span>
          </h2>


          <p
            style={{
              maxWidth:
                "690px",

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
            Explainable cyber-risk
            assessment using threat
            severity, protected asset
            criticality, detection
            confidence and incident
            response state.
          </p>
        </div>


        <div
          style={{
            minWidth:
              "310px",

            border:
              "1px solid var(--risk-line)",

            background:
              "rgba(8,10,6,.78)",
          }}
        >
          <HeroStatus
            label="RISK ENGINE"
            value={
              apiOnline
                ? "ACTIVE"
                : "OFFLINE"
            }
            active={
              apiOnline
            }
          />


          <HeroStatus
            label="MODEL"
            value="WEIGHTED V1"
            active={
              apiOnline
            }
          />


          <HeroStatus
            label="ASSESSMENTS"
            value={
              assessments.length
            }
            active={
              assessments.length >
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
          icon={Database}
          label="ASSESSMENTS"
          value={
            metrics.total
          }
        />


        <MetricCard
          icon={ShieldAlert}
          label="CRITICAL"
          value={
            metrics.critical
          }
          tone="red"
        />


        <MetricCard
          icon={AlertTriangle}
          label="HIGH"
          value={
            metrics.high
          }
          tone="amber"
        />


        <MetricCard
          icon={Activity}
          label="MEDIUM"
          value={
            metrics.medium
          }
          tone="purple"
        />


        <MetricCard
          icon={CheckCircle2}
          label="LOW"
          value={
            metrics.low
          }
        />
      </div>


      {/* ===================================================
          MODEL + LATEST ASSESSMENT
          =================================================== */}

      <div
        style={{
          marginTop:
            "15px",

          display:
            "grid",

          gridTemplateColumns:
            "minmax(330px,.85fr) minmax(0,1.15fr)",

          gap:
            "15px",
        }}
      >
        {/* MODEL */}

        <section
          style={
            panelStyle
          }
        >
          <PanelHeading
            eyebrow="EXPLAINABLE MODEL"
            title="Risk Weighting"
            icon={BrainCircuit}
          />


          <div
            style={{
              padding:
                "20px 22px",
            }}
          >
            {RISK_WEIGHTS.map(
              (factor) => (
                <RiskWeight
                  key={
                    factor.label
                  }
                  {...factor}
                />
              )
            )}


            <div
              style={{
                marginTop:
                  "16px",

                paddingTop:
                  "15px",

                borderTop:
                  "1px solid var(--risk-line)",

                color:
                  "var(--risk-dim)",

                fontFamily:
                  "var(--font-tech)",

                fontSize:
                  "9px",

                lineHeight:
                  1.6,
              }}
            >
              FINAL SCORE =
              WEIGHTED SUM OF ALL
              FOUR FACTORS
            </div>
          </div>
        </section>


        {/* SELECTED RISK */}

        <section
          style={
            panelStyle
          }
        >
          <PanelHeading
            eyebrow="RISK ASSESSMENT"
            title={
              selectedAssessment
                ? `Assessment #${selectedAssessment.id}`
                : "No Assessment Available"
            }
            icon={Gauge}
          />


          {selectedAssessment ? (
            <div
              style={{
                padding:
                  "22px",
              }}
            >
              <div
                style={{
                  display:
                    "grid",

                  gridTemplateColumns:
                    "170px 1fr",

                  gap:
                    "22px",

                  alignItems:
                    "center",
                }}
              >
                <RiskScore
                  score={
                    selectedAssessment
                      .risk_score
                  }
                  level={
                    selectedAssessment
                      .risk_level
                  }
                />


                <div
                  style={{
                    display:
                      "grid",

                    gridTemplateColumns:
                      "repeat(2,minmax(120px,1fr))",

                    gap:
                      "9px",
                  }}
                >
                  <RiskField
                    label="INCIDENT"
                    value={
                      `#${selectedAssessment.incident_id}`
                    }
                  />


                  <RiskField
                    label="SEVERITY"
                    value={
                      selectedAssessment.severity
                    }
                  />


                  <RiskField
                    label="ASSET"
                    value={
                      selectedAssessment.asset_criticality
                    }
                  />


                  <RiskField
                    label="CONFIDENCE"
                    value={
                      selectedAssessment.detection_confidence
                    }
                  />
                </div>
              </div>


              <div
                style={{
                  marginTop:
                    "18px",

                  padding:
                    "15px",

                  border:
                    "1px solid var(--risk-line)",

                  background:
                    "rgba(255,255,255,.008)",
                }}
              >
                <span
                  style={
                    fieldLabelStyle
                  }
                >
                  EXPLAINABLE RATIONALE
                </span>


                <p
                  style={{
                    margin:
                      "8px 0 0",

                    color:
                      "var(--risk-muted)",

                    fontSize:
                      "11px",

                    lineHeight:
                      1.65,
                  }}
                >
                  {
                    selectedAssessment.rationale
                  }
                </p>
              </div>
            </div>
          ) : (
            <div
              style={{
                minHeight:
                  "300px",

                display:
                  "flex",

                flexDirection:
                  "column",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                gap:
                  "11px",

                textAlign:
                  "center",
              }}
            >
              <ShieldCheck
                size={29}
                color="#d7ff57"
              />


              <strong
                style={{
                  color:
                    "var(--risk-cream)",

                  fontFamily:
                    "var(--font-tech)",

                  fontSize:
                    "11px",

                  letterSpacing:
                    ".06em",
                }}
              >
                {loading
                  ? "LOADING RISK DATA"
                  : "NO RISK ASSESSMENTS"}
              </strong>


              <p
                style={{
                  maxWidth:
                    "430px",

                  margin:
                    0,

                  color:
                    "var(--risk-muted)",

                  fontSize:
                    "11px",

                  lineHeight:
                    1.6,
                }}
              >
                No genuine incident has
                generated a risk
                assessment. Future
                SCAN-001 incidents will
                be evaluated
                automatically.
              </p>
            </div>
          )}
        </section>
      </div>


      {/* ===================================================
          FACTOR BREAKDOWN
          =================================================== */}

      <section
        style={{
          ...panelStyle,

          marginTop:
            "15px",
        }}
      >
        <PanelHeading
          eyebrow="ASSESSMENT FACTORS"
          title="Risk Factor Breakdown"
          icon={BarChart3}
        />


        {selectedAssessment ? (
          <div
            style={{
              padding:
                "22px",

              display:
                "grid",

              gridTemplateColumns:
                "repeat(4,minmax(0,1fr))",

              gap:
                "10px",
            }}
          >
            <FactorCard
              label="SEVERITY"
              raw={
                selectedAssessment.severity
              }
              score={
                selectedAssessment.severity_score
              }
              weight="40%"
            />


            <FactorCard
              label="ASSET CRITICALITY"
              raw={
                selectedAssessment.asset_criticality
              }
              score={
                selectedAssessment.asset_score
              }
              weight="30%"
            />


            <FactorCard
              label="CONFIDENCE"
              raw={
                selectedAssessment.detection_confidence
              }
              score={
                selectedAssessment.confidence_score
              }
              weight="20%"
            />


            <FactorCard
              label="STATUS FACTOR"
              raw={
                linkedIncident
                  ?.status ||
                "UNKNOWN"
              }
              score={
                selectedAssessment.status_factor
              }
              weight="10%"
            />
          </div>
        ) : (
          <EmptyPanel
            text="NO FACTOR DATA AVAILABLE"
          />
        )}
      </section>


      {/* ===================================================
          LINKED INCIDENT
          =================================================== */}

      <section
        style={{
          ...panelStyle,

          marginTop:
            "15px",
        }}
      >
        <PanelHeading
          eyebrow="RISK CONTEXT"
          title="Linked Incident"
          icon={Link2}
        />


        {linkedIncident ? (
          <div
            style={{
              padding:
                "22px",

              display:
                "grid",

              gridTemplateColumns:
                "repeat(auto-fit,minmax(150px,1fr))",

              gap:
                "10px",
            }}
          >
            <RiskField
              label="INCIDENT ID"
              value={
                `#${linkedIncident.id}`
              }
            />


            <RiskField
              label="TYPE"
              value={
                linkedIncident.incident_type
              }
            />


            <RiskField
              label="STATUS"
              value={
                linkedIncident.status
              }
            />


            <RiskField
              label="SOURCE"
              value={
                linkedIncident.source
              }
            />


            <RiskField
              label="TARGET"
              value={
                linkedIncident.target ||
                "-"
              }
            />


            <RiskField
              label="CREATED"
              value={
                formatDateTime(
                  linkedIncident.created_at
                )
              }
            />
          </div>
        ) : (
          <EmptyPanel
            text="NO LINKED INCIDENT AVAILABLE"
          />
        )}
      </section>


      {/* ===================================================
          ASSESSMENT HISTORY
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
          eyebrow="RISK DATABASE"
          title="Assessment History"
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
                "850px",
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
                  "70px 100px 110px 120px 120px 120px 1fr",

                alignItems:
                  "center",

                borderBottom:
                  "1px solid var(--risk-line)",

                color:
                  "var(--risk-dim)",

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
              <span>ID</span>
              <span>INCIDENT</span>
              <span>SCORE</span>
              <span>LEVEL</span>
              <span>SEVERITY</span>
              <span>ASSET</span>
              <span>CREATED</span>
            </div>


            {assessments.length ===
            0 ? (
              <EmptyPanel
                text="NO RISK ASSESSMENTS AVAILABLE"
              />
            ) : (
              assessments.map(
                (
                  assessment,
                  index
                ) => (
                  <motion.button
                    key={
                      assessment.id
                    }
                    type="button"
                    onClick={() =>
                      setSelectedAssessmentId(
                        assessment.id
                      )
                    }
                    initial={{
                      opacity:
                        0,

                      y:
                        5,
                    }}
                    animate={{
                      opacity:
                        1,

                      y:
                        0,
                    }}
                    transition={{
                      delay:
                        index *
                        0.025,
                    }}
                    style={{
                      width:
                        "100%",

                      minHeight:
                        "52px",

                      padding:
                        "0 22px",

                      border:
                        "none",

                      borderBottom:
                        "1px solid rgba(236,232,217,.055)",

                      background:
                        selectedAssessment
                          ?.id ===
                        assessment.id
                          ? "rgba(215,255,87,.025)"
                          : "transparent",

                      display:
                        "grid",

                      gridTemplateColumns:
                        "70px 100px 110px 120px 120px 120px 1fr",

                      alignItems:
                        "center",

                      color:
                        "var(--risk-muted)",

                      fontFamily:
                        "var(--font-tech)",

                      fontSize:
                        "10px",

                      textAlign:
                        "left",

                      cursor:
                        "pointer",
                    }}
                  >
                    <strong>
                      #
                      {
                        assessment.id
                      }
                    </strong>


                    <span>
                      #
                      {
                        assessment.incident_id
                      }
                    </span>


                    <strong
                      style={{
                        color:
                          getRiskColor(
                            assessment.risk_level
                          ),
                      }}
                    >
                      {
                        assessment.risk_score
                      }
                      /100
                    </strong>


                    <span
                      style={{
                        color:
                          getRiskColor(
                            assessment.risk_level
                          ),
                      }}
                    >
                      {
                        assessment.risk_level
                      }
                    </span>


                    <span>
                      {
                        assessment.severity
                      }
                    </span>


                    <span>
                      {
                        assessment.asset_criticality
                      }
                    </span>


                    <span>
                      {formatDateTime(
                        assessment.created_at
                      )}
                    </span>
                  </motion.button>
                )
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
              "var(--risk-dim)",

            fontFamily:
              "var(--font-tech)",

            fontSize:
              "9px",
          }}
        >
          <span>
            SQLITE // RISK_ASSESSMENTS
          </span>

          <span>
            {assessments.length} RECORDS
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

          color:
            "var(--risk-dim)",

          fontFamily:
            "var(--font-tech)",

          fontSize:
            "9px",

          letterSpacing:
            ".05em",
        }}
      >
        <span>
          {apiOnline
            ? "RISK CHANNEL ONLINE"
            : "RISK CHANNEL OFFLINE"}
        </span>


        <span>
          {lastUpdated
            ? `UPDATED ${lastUpdated.toLocaleTimeString()}`
            : "WAITING FOR RISK DATA"}
        </span>
      </div>
    </motion.section>
  );
}


/* =========================================================
   SHARED COMPONENTS
   ========================================================= */

const panelStyle = {
  border:
    "1px solid var(--risk-line)",

  background:
    "linear-gradient(145deg, rgba(17,20,13,.95), rgba(8,9,6,.98))",

  boxShadow:
    "0 18px 50px rgba(0,0,0,.16)",
};


const fieldLabelStyle = {
  color:
    "var(--risk-dim)",

  fontFamily:
    "var(--font-tech)",

  fontSize:
    "9px",

  fontWeight:
    700,

  letterSpacing:
    ".08em",
};


function getRiskColor(level) {
  const normalized =
    normalizeValue(
      level
    );


  if (
    normalized ===
    "CRITICAL"
  ) {
    return "#ff6258";
  }


  if (
    normalized ===
    "HIGH"
  ) {
    return "#ffbd59";
  }


  if (
    normalized ===
    "MEDIUM"
  ) {
    return "#9b82ff";
  }


  return "#d7ff57";
}


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
          "1px solid var(--risk-line)",

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
              "var(--risk-cream)",

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
          "1px solid var(--risk-line)",

        display:
          "flex",

        alignItems:
          "center",

        justifyContent:
          "space-between",

        gap:
          "15px",

        fontFamily:
          "var(--font-tech)",
      }}
    >
      <span
        style={{
          color:
            "var(--risk-dim)",

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
              ? "var(--risk-acid)"
              : "var(--risk-muted)",

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
    "var(--risk-acid)";


  if (
    tone === "red"
  ) {
    color =
      "var(--risk-red)";
  }


  if (
    tone === "amber"
  ) {
    color =
      "var(--risk-amber)";
  }


  if (
    tone === "purple"
  ) {
    color =
      "var(--risk-purple)";
  }


  return (
    <div
      style={{
        minHeight:
          "100px",

        padding:
          "15px",

        border:
          "1px solid var(--risk-line)",

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


function RiskWeight({
  label,
  weight,
  description,
}) {
  return (
    <div
      style={{
        padding:
          "13px 0",

        borderBottom:
          "1px solid rgba(236,232,217,.06)",
      }}
    >
      <div
        style={{
          display:
            "flex",

          justifyContent:
            "space-between",

          gap:
            "15px",
        }}
      >
        <strong
          style={{
            color:
              "var(--risk-cream)",

            fontFamily:
              "var(--font-tech)",

            fontSize:
              "10px",
          }}
        >
          {label}
        </strong>


        <strong
          style={{
            color:
              "var(--risk-acid)",

            fontFamily:
              "var(--font-tech)",

            fontSize:
              "11px",
          }}
        >
          {weight}%
        </strong>
      </div>


      <div
        style={{
          height:
            "3px",

          marginTop:
            "9px",

          background:
            "rgba(236,232,217,.06)",
        }}
      >
        <div
          style={{
            width:
              `${weight}%`,

            height:
              "100%",

            background:
              "#d7ff57",
          }}
        />
      </div>


      <p
        style={{
          margin:
            "7px 0 0",

          color:
            "var(--risk-dim)",

          fontSize:
            "9px",

          lineHeight:
            1.5,
        }}
      >
        {description}
      </p>
    </div>
  );
}


function RiskScore({
  score,
  level,
}) {
  const numericScore =
    Number(
      score || 0
    );


  const color =
    getRiskColor(
      level
    );


  return (
    <div
      style={{
        width:
          "150px",

        height:
          "150px",

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
        RISK SCORE
      </span>


      <strong
        style={{
          marginTop:
            "7px",

          color,

          fontFamily:
            "var(--font-tech)",

          fontSize:
            "32px",

          fontWeight:
            500,
        }}
      >
        {numericScore}
      </strong>


      <small
        style={{
          color:
            "var(--risk-dim)",

          fontFamily:
            "var(--font-tech)",

          fontSize:
            "9px",
        }}
      >
        /100
      </small>


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
        {level}
      </strong>
    </div>
  );
}


function RiskField({
  label,
  value,
}) {
  return (
    <div
      style={{
        minHeight:
          "62px",

        padding:
          "11px",

        border:
          "1px solid var(--risk-line)",

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
            "7px",

          color:
            "var(--risk-cream)",

          fontFamily:
            "var(--font-tech)",

          fontSize:
            "10px",

          overflowWrap:
            "anywhere",
        }}
      >
        {value}
      </strong>
    </div>
  );
}


function FactorCard({
  label,
  raw,
  score,
  weight,
}) {
  return (
    <div
      style={{
        minHeight:
          "110px",

        padding:
          "14px",

        border:
          "1px solid var(--risk-line)",

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
            "9px",

          color:
            "var(--risk-cream)",

          fontFamily:
            "var(--font-tech)",

          fontSize:
            "11px",
        }}
      >
        {raw}
      </strong>


      <div
        style={{
          marginTop:
            "13px",

          display:
            "flex",

          justifyContent:
            "space-between",

          color:
            "var(--risk-dim)",

          fontFamily:
            "var(--font-tech)",

          fontSize:
            "9px",
        }}
      >
        <span>
          SCORE {score}
        </span>

        <span>
          WEIGHT {weight}
        </span>
      </div>
    </div>
  );
}


function EmptyPanel({
  text,
}) {
  return (
    <div
      style={{
        minHeight:
          "110px",

        display:
          "flex",

        alignItems:
          "center",

        justifyContent:
          "center",

        gap:
          "8px",

        color:
          "var(--risk-dim)",

        fontFamily:
          "var(--font-tech)",

        fontSize:
          "10px",
      }}
    >
      <Radar
        size={14}
      />

      {text}
    </div>
  );
}


export default RiskIntelligence;
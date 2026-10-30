import { API_BASE } from "../services/apiConfig";
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
  CheckCircle2,
  Clock3,
  Crosshair,
  Database,
  Eye,
  Loader2,
  LockKeyhole,
  Radar,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Target,
} from "lucide-react";





const INCIDENT_STATES = [
  "OPEN",
  "INVESTIGATING",
  "CONTAINED",
  "RESOLVED",
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


function Incidents() {
  const [
    incidents,
    setIncidents,
  ] = useState([]);


  const [
    events,
    setEvents,
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
    updatingId,
    setUpdatingId,
  ] = useState(null);


  const [
    selectedIncidentId,
    setSelectedIncidentId,
  ] = useState(null);


  const [
    lastUpdated,
    setLastUpdated,
  ] = useState(null);


  /*
   * =====================================================
   * LOAD INCIDENT DATA
   * =====================================================
   */

  async function loadIncidentData() {
    try {
      const [
        incidentsResponse,
        eventsResponse,
      ] = await Promise.all([
        fetch(
          `${API_BASE}/api/v1/incidents`,
          {
            cache: "no-store",
          }
        ),

        fetch(
          `${API_BASE}/api/v1/events`,
          {
            cache: "no-store",
          }
        ),
      ]);


      if (
        !incidentsResponse.ok ||
        !eventsResponse.ok
      ) {
        throw new Error(
          "Sentinel-X incident services unavailable."
        );
      }


      const incidentsData =
        await incidentsResponse.json();


      const eventsData =
        await eventsResponse.json();


      setIncidents(
        Array.isArray(
          incidentsData
        )
          ? incidentsData
          : []
      );


      setEvents(
        Array.isArray(
          eventsData
        )
          ? eventsData
          : []
      );


      setApiOnline(true);

      setLastUpdated(
        new Date()
      );


      /*
       * Automatically select the newest incident
       * when incidents exist and nothing is selected.
       */

      if (
        Array.isArray(
          incidentsData
        ) &&
        incidentsData.length > 0
      ) {
        setSelectedIncidentId(
          (currentId) => {
            if (
              currentId !== null &&
              incidentsData.some(
                (incident) =>
                  incident.id ===
                  currentId
              )
            ) {
              return currentId;
            }


            return incidentsData[0].id;
          }
        );
      }
    } catch (error) {
      console.error(
        "Sentinel-X incident error:",
        error
      );

      setApiOnline(false);
    } finally {
      setLoading(false);
    }
  }


  /*
   * =====================================================
   * POLLING
   * =====================================================
   */

  useEffect(() => {
    let mounted = true;


    async function poll() {
      if (!mounted) {
        return;
      }

      await loadIncidentData();
    }


    poll();


    const interval =
      window.setInterval(
        poll,
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
   * METRICS
   * =====================================================
   */

  const metrics = useMemo(
    () => {
      const result = {
        total:
          incidents.length,

        open: 0,

        investigating: 0,

        contained: 0,

        resolved: 0,

        high: 0,

        critical: 0,
      };


      for (
        const incident
        of incidents
      ) {
        const status =
          normalizeValue(
            incident.status
          );


        const severity =
          normalizeValue(
            incident.severity
          );


        if (
          status === "OPEN"
        ) {
          result.open += 1;
        }


        if (
          status ===
          "INVESTIGATING"
        ) {
          result.investigating += 1;
        }


        if (
          status ===
          "CONTAINED"
        ) {
          result.contained += 1;
        }


        if (
          status ===
          "RESOLVED"
        ) {
          result.resolved += 1;
        }


        if (
          severity === "HIGH"
        ) {
          result.high += 1;
        }


        if (
          severity ===
          "CRITICAL"
        ) {
          result.critical += 1;
        }
      }


      return result;
    },
    [incidents]
  );


  /*
   * =====================================================
   * SELECTED INCIDENT
   * =====================================================
   */

  const selectedIncident =
    useMemo(
      () =>
        incidents.find(
          (incident) =>
            incident.id ===
            selectedIncidentId
        ) ||
        incidents[0] ||
        null,
      [
        incidents,
        selectedIncidentId,
      ]
    );


  const linkedEvent =
    useMemo(
      () => {
        if (
          !selectedIncident
            ?.linked_event_id
        ) {
          return null;
        }


        return (
          events.find(
            (event) =>
              event.id ===
              selectedIncident
                .linked_event_id
          ) || null
        );
      },
      [
        events,
        selectedIncident,
      ]
    );


  /*
   * =====================================================
   * INCIDENT STATUS UPDATE
   * =====================================================
   */

  async function updateIncidentStatus(
    incidentId,
    newStatus
  ) {
    setUpdatingId(
      incidentId
    );


    try {
      const response =
        await fetch(
          `${API_BASE}/api/v1/incidents/${incidentId}/status`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              status: newStatus,
            }),
          }
        );


      if (!response.ok) {
        throw new Error(
          "Incident status update failed."
        );
      }


      await loadIncidentData();
    } catch (error) {
      console.error(
        "Sentinel-X incident update error:",
        error
      );
    } finally {
      setUpdatingId(null);
    }
  }


  /*
   * =====================================================
   * NEXT INCIDENT STATE
   * =====================================================
   */

  function getNextState(
    currentStatus
  ) {
    const normalized =
      normalizeValue(
        currentStatus
      );


    const index =
      INCIDENT_STATES.indexOf(
        normalized
      );


    if (
      index < 0 ||
      index ===
        INCIDENT_STATES.length -
          1
    ) {
      return null;
    }


    return INCIDENT_STATES[
      index + 1
    ];
  }


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
        "--inc-acid":
          "#d7ff57",

        "--inc-cream":
          "#ece8d9",

        "--inc-muted":
          "#9a9e89",

        "--inc-dim":
          "#747966",

        "--inc-purple":
          "#9b82ff",

        "--inc-red":
          "#ff6258",

        "--inc-amber":
          "#ffbd59",

        "--inc-line":
          "rgba(232,230,211,0.11)",

        width: "100%",

        paddingBottom:
          "32px",

        color:
          "var(--inc-cream)",
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
            "1px solid var(--inc-line)",

          background:
            "radial-gradient(circle at 82% 0%, rgba(255,189,89,.08), transparent 32%), linear-gradient(135deg, rgba(18,21,14,.97), rgba(8,9,6,.99))",

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
                "var(--inc-amber)",

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
            <Siren
              size={14}
              strokeWidth={1.5}
            />

            04 / INCIDENT OPERATIONS
          </div>


          <h2
            style={{
              margin:
                "18px 0 13px",

              color:
                "var(--inc-cream)",

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
            INCIDENT

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
              OPERATIONS
            </span>
          </h2>


          <p
            style={{
              maxWidth:
                "670px",

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
            Investigate detected
            threats, link supporting
            security events and track
            response activity from
            initial detection through
            containment and resolution.
          </p>
        </div>


        <div
          style={{
            minWidth:
              "300px",

            border:
              "1px solid var(--inc-line)",

            background:
              "rgba(8,10,6,.78)",
          }}
        >
          <HeroStatus
            label="INCIDENT ENGINE"
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
            label="ACTIVE CASES"
            value={
              metrics.open +
              metrics.investigating
            }
            active={
              metrics.open +
                metrics.investigating >
              0
            }
          />


          <HeroStatus
            label="TOTAL INCIDENTS"
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
          INCIDENT METRICS
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
          label="TOTAL"
          value={
            metrics.total
          }
        />


        <MetricCard
          icon={Siren}
          label="OPEN"
          value={
            metrics.open
          }
          tone="amber"
        />


        <MetricCard
          icon={Eye}
          label="INVESTIGATING"
          value={
            metrics.investigating
          }
          tone="purple"
        />


        <MetricCard
          icon={LockKeyhole}
          label="CONTAINED"
          value={
            metrics.contained
          }
        />


        <MetricCard
          icon={CheckCircle2}
          label="RESOLVED"
          value={
            metrics.resolved
          }
        />
      </div>


      {/* ===================================================
          ACTIVE INVESTIGATION
          =================================================== */}

      <section
        style={{
          ...panelStyle,

          marginTop:
            "15px",
        }}
      >
        <PanelHeading
          eyebrow="ACTIVE INVESTIGATION"
          title={
            selectedIncident
              ? `Incident #${selectedIncident.id}`
              : "No Active Incident"
          }
          icon={
            ShieldAlert
          }
        />


        {selectedIncident ? (
          <div
            style={{
              padding:
                "22px",
            }}
          >
            <div
              style={{
                display:
                  "flex",

                alignItems:
                  "flex-start",

                justifyContent:
                  "space-between",

                gap:
                  "20px",

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
                  INCIDENT TITLE
                </span>


                <h3
                  style={{
                    margin:
                      "7px 0 0",

                    color:
                      "var(--inc-cream)",

                    fontSize:
                      "20px",

                    fontWeight:
                      560,
                  }}
                >
                  {
                    selectedIncident.title
                  }
                </h3>
              </div>


              <div
                style={{
                  display:
                    "flex",

                  alignItems:
                    "center",

                  gap:
                    "8px",

                  flexWrap:
                    "wrap",
                }}
              >
                <SeverityBadge
                  severity={
                    selectedIncident.severity
                  }
                />


                <StatusBadge
                  status={
                    selectedIncident.status
                  }
                />
              </div>
            </div>


            <div
              style={{
                marginTop:
                  "22px",

                display:
                  "grid",

                gridTemplateColumns:
                  "repeat(auto-fit,minmax(160px,1fr))",

                gap:
                  "10px",
              }}
            >
              <IncidentField
                label="TYPE"
                value={
                  selectedIncident
                    .incident_type
                }
              />


              <IncidentField
                label="SOURCE"
                value={
                  selectedIncident
                    .source
                }
              />


              <IncidentField
                label="TARGET"
                value={
                  selectedIncident
                    .target ||
                  "-"
                }
              />


              <IncidentField
                label="LINKED EVENT"
                value={
                  selectedIncident
                    .linked_event_id
                    ? `#${selectedIncident.linked_event_id}`
                    : "NONE"
                }
              />


              <IncidentField
                label="CREATED"
                value={
                  formatDateTime(
                    selectedIncident
                      .created_at
                  )
                }
              />


              <IncidentField
                label="UPDATED"
                value={
                  formatDateTime(
                    selectedIncident
                      .updated_at
                  )
                }
              />
            </div>


            {/* DESCRIPTION */}

            <div
              style={{
                marginTop:
                  "18px",

                padding:
                  "16px",

                border:
                  "1px solid var(--inc-line)",

                background:
                  "rgba(255,255,255,.009)",
              }}
            >
              <span
                style={
                  fieldLabelStyle
                }
              >
                INCIDENT DESCRIPTION
              </span>


              <p
                style={{
                  margin:
                    "8px 0 0",

                  color:
                    "var(--inc-muted)",

                  fontSize:
                    "11px",

                  lineHeight:
                    1.65,
                }}
              >
                {
                  selectedIncident.description
                }
              </p>
            </div>


            {/* LINKED SECURITY EVENT */}

            <div
              style={{
                marginTop:
                  "12px",

                padding:
                  "16px",

                border:
                  "1px solid var(--inc-line)",

                background:
                  "rgba(155,130,255,.025)",
              }}
            >
              <div
                style={{
                  display:
                    "flex",

                  alignItems:
                    "center",

                  gap:
                    "9px",
                }}
              >
                <Crosshair
                  size={15}
                  strokeWidth={1.4}
                  color="#9b82ff"
                />


                <span
                  style={
                    fieldLabelStyle
                  }
                >
                  SUPPORTING SECURITY EVENT
                </span>
              </div>


              {linkedEvent ? (
                <div
                  style={{
                    marginTop:
                      "12px",

                    display:
                      "grid",

                    gridTemplateColumns:
                      "repeat(auto-fit,minmax(150px,1fr))",

                    gap:
                      "10px",
                  }}
                >
                  <IncidentField
                    label="EVENT ID"
                    value={
                      `#${linkedEvent.id}`
                    }
                  />


                  <IncidentField
                    label="EVENT TYPE"
                    value={
                      linkedEvent.event_type
                    }
                  />


                  <IncidentField
                    label="SEVERITY"
                    value={
                      linkedEvent.severity
                    }
                  />


                  <IncidentField
                    label="EVENT TIME"
                    value={
                      formatDateTime(
                        linkedEvent.created_at
                      )
                    }
                  />
                </div>
              ) : (
                <p
                  style={{
                    margin:
                      "10px 0 0",

                    color:
                      "var(--inc-dim)",

                    fontFamily:
                      "var(--font-tech)",

                    fontSize:
                      "10px",
                  }}
                >
                  No supporting event
                  record available.
                </p>
              )}
            </div>


            {/* RESPONSE LIFECYCLE */}

            <div
              style={{
                marginTop:
                  "20px",

                paddingTop:
                  "18px",

                borderTop:
                  "1px solid var(--inc-line)",
              }}
            >
              <span
                style={
                  fieldLabelStyle
                }
              >
                RESPONSE LIFECYCLE
              </span>


              <IncidentLifecycle
                currentStatus={
                  selectedIncident.status
                }
              />


              {getNextState(
                selectedIncident.status
              ) && (
                <button
                  type="button"
                  disabled={
                    updatingId ===
                    selectedIncident.id
                  }
                  onClick={() =>
                    updateIncidentStatus(
                      selectedIncident.id,
                      getNextState(
                        selectedIncident.status
                      )
                    )
                  }
                  style={{
                    marginTop:
                      "18px",

                    minHeight:
                      "38px",

                    padding:
                      "0 15px",

                    border:
                      "1px solid rgba(215,255,87,.25)",

                    color:
                      "#d7ff57",

                    background:
                      "rgba(215,255,87,.035)",

                    fontFamily:
                      "var(--font-tech)",

                    fontSize:
                      "9px",

                    fontWeight:
                      700,

                    letterSpacing:
                      ".07em",

                    cursor:
                      "pointer",
                  }}
                >
                  {updatingId ===
                  selectedIncident.id ? (
                    <>
                      UPDATING...
                    </>
                  ) : (
                    <>
                      ADVANCE TO{" "}
                      {getNextState(
                        selectedIncident.status
                      )}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div
            style={{
              minHeight:
                "230px",

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

              color:
                "var(--inc-dim)",
            }}
          >
            {loading ? (
              <Loader2
                size={25}
              />
            ) : (
              <ShieldCheck
                size={28}
                color="#d7ff57"
              />
            )}


            <strong
              style={{
                color:
                  "var(--inc-cream)",

                fontFamily:
                  "var(--font-tech)",

                fontSize:
                  "11px",

                letterSpacing:
                  ".06em",
              }}
            >
              {loading
                ? "LOADING INCIDENT DATA"
                : "NO ACTIVE INCIDENTS"}
            </strong>


            <p
              style={{
                maxWidth:
                  "440px",

                margin:
                  0,

                color:
                  "var(--inc-muted)",

                fontSize:
                  "11px",

                lineHeight:
                  1.6,
              }}
            >
              {loading
                ? "Synchronizing with the Sentinel-X incident engine."
                : "No genuine detection has generated an incident. Future SCAN-001 detections will automatically appear here."}
            </p>
          </div>
        )}
      </section>


      {/* ===================================================
          INCIDENT QUEUE
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
          eyebrow="INCIDENT DATABASE"
          title="Incident Queue"
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
                "900px",
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
                  "70px 120px 100px 130px minmax(150px,1fr) minmax(150px,1fr) 110px",

                alignItems:
                  "center",

                borderBottom:
                  "1px solid var(--inc-line)",

                color:
                  "var(--inc-dim)",

                background:
                  "rgba(255,255,255,.01)",

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
              <span>TYPE</span>
              <span>SEVERITY</span>
              <span>STATUS</span>
              <span>SOURCE</span>
              <span>TARGET</span>
              <span>EVENT</span>
            </div>


            {incidents.length ===
            0 ? (
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
                    "9px",

                  color:
                    "var(--inc-dim)",

                  fontFamily:
                    "var(--font-tech)",

                  fontSize:
                    "10px",
                }}
              >
                <Radar
                  size={15}
                />

                NO INCIDENTS AVAILABLE
              </div>
            ) : (
              incidents.map(
                (
                  incident,
                  index
                ) => (
                  <motion.button
                    type="button"
                    key={
                      incident.id
                    }
                    onClick={() =>
                      setSelectedIncidentId(
                        incident.id
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
                        selectedIncident
                          ?.id ===
                        incident.id
                          ? "rgba(215,255,87,.025)"
                          : "transparent",

                      display:
                        "grid",

                      gridTemplateColumns:
                        "70px 120px 100px 130px minmax(150px,1fr) minmax(150px,1fr) 110px",

                      alignItems:
                        "center",

                      color:
                        "var(--inc-muted)",

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
                        incident.id
                      }
                    </strong>


                    <span>
                      {
                        incident.incident_type
                      }
                    </span>


                    <SeverityBadge
                      severity={
                        incident.severity
                      }
                    />


                    <StatusBadge
                      status={
                        incident.status
                      }
                    />


                    <span>
                      {
                        incident.source
                      }
                    </span>


                    <span>
                      {
                        incident.target ||
                        "-"
                      }
                    </span>


                    <span>
                      {incident.linked_event_id
                        ? `#${incident.linked_event_id}`
                        : "-"}
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

            gap:
              "20px",

            color:
              "var(--inc-dim)",

            fontFamily:
              "var(--font-tech)",

            fontSize:
              "9px",

            letterSpacing:
              ".05em",
          }}
        >
          <span>
            SQLITE // INCIDENTS
          </span>

          <span>
            {incidents.length} RECORDS
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
            "var(--inc-dim)",

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
            ? "INCIDENT CHANNEL ONLINE"
            : "INCIDENT CHANNEL OFFLINE"}
        </span>


        <span>
          {lastUpdated
            ? `UPDATED ${lastUpdated.toLocaleTimeString()}`
            : "WAITING FOR INCIDENT DATA"}
        </span>
      </div>
    </motion.section>
  );
}


/* =========================================================
   COMPONENTS
   ========================================================= */

const panelStyle = {
  position:
    "relative",

  border:
    "1px solid var(--inc-line)",

  background:
    "linear-gradient(145deg, rgba(17,20,13,.95), rgba(8,9,6,.98))",

  boxShadow:
    "0 18px 50px rgba(0,0,0,.16)",
};


const fieldLabelStyle = {
  color:
    "var(--inc-dim)",

  fontFamily:
    "var(--font-tech)",

  fontSize:
    "9px",

  fontWeight:
    700,

  letterSpacing:
    ".08em",
};


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
          "1px solid var(--inc-line)",

        display:
          "flex",

        alignItems:
          "center",

        justifyContent:
          "space-between",

        gap:
          "20px",
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
              "var(--inc-cream)",

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
        color="#ffbd59"
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
          "1px solid var(--inc-line)",

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
            "var(--inc-dim)",

          fontSize:
            "9px",

          fontWeight:
            650,

          letterSpacing:
            ".07em",
        }}
      >
        {label}
      </span>


      <strong
        style={{
          color:
            active
              ? "var(--inc-acid)"
              : "var(--inc-muted)",

          fontSize:
            "10px",

          fontWeight:
            700,
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
    "var(--inc-acid)";


  if (
    tone === "amber"
  ) {
    color =
      "var(--inc-amber)";
  }


  if (
    tone === "purple"
  ) {
    color =
      "var(--inc-purple)";
  }


  return (
    <div
      style={{
        minHeight:
          "100px",

        padding:
          "15px",

        border:
          "1px solid var(--inc-line)",

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

          alignItems:
            "center",

          justifyContent:
            "space-between",
        }}
      >
        <span
          style={{
            color:
              "var(--inc-dim)",

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
          {label}
        </span>


        <Icon
          size={15}
          strokeWidth={1.4}
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


function IncidentField({
  label,
  value,
}) {
  return (
    <div
      style={{
        minHeight:
          "68px",

        padding:
          "12px",

        border:
          "1px solid var(--inc-line)",

        background:
          "rgba(255,255,255,.009)",
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
            "8px",

          color:
            "var(--inc-cream)",

          fontFamily:
            "var(--font-tech)",

          fontSize:
            "10px",

          fontWeight:
            650,

          overflowWrap:
            "anywhere",
        }}
      >
        {value}
      </strong>
    </div>
  );
}


function SeverityBadge({
  severity,
}) {
  const normalized =
    normalizeValue(
      severity
    );


  let color =
    "var(--inc-muted)";


  if (
    normalized ===
    "CRITICAL"
  ) {
    color =
      "var(--inc-red)";
  } else if (
    normalized ===
    "HIGH"
  ) {
    color =
      "var(--inc-amber)";
  } else if (
    normalized ===
    "MEDIUM"
  ) {
    color =
      "var(--inc-acid)";
  }


  return (
    <strong
      style={{
        color,

        fontFamily:
          "var(--font-tech)",

        fontSize:
          "9px",

        fontWeight:
          750,

        letterSpacing:
          ".05em",
      }}
    >
      {normalized ||
        "INFO"}
    </strong>
  );
}


function StatusBadge({
  status,
}) {
  const normalized =
    normalizeValue(
      status
    );


  let color =
    "var(--inc-muted)";


  if (
    normalized === "OPEN"
  ) {
    color =
      "var(--inc-amber)";
  }


  if (
    normalized ===
    "INVESTIGATING"
  ) {
    color =
      "var(--inc-purple)";
  }


  if (
    normalized ===
    "CONTAINED"
  ) {
    color =
      "var(--inc-acid)";
  }


  if (
    normalized ===
    "RESOLVED"
  ) {
    color =
      "var(--inc-muted)";
  }


  return (
    <strong
      style={{
        color,

        fontFamily:
          "var(--font-tech)",

        fontSize:
          "9px",

        fontWeight:
          750,

        letterSpacing:
          ".05em",
      }}
    >
      {normalized}
    </strong>
  );
}


function IncidentLifecycle({
  currentStatus,
}) {
  const normalized =
    normalizeValue(
      currentStatus
    );


  const activeIndex =
    INCIDENT_STATES.indexOf(
      normalized
    );


  return (
    <div
      style={{
        marginTop:
          "14px",

        display:
          "grid",

        gridTemplateColumns:
          "repeat(4,minmax(0,1fr))",

        gap:
          "6px",
      }}
    >
      {INCIDENT_STATES.map(
        (
          state,
          index
        ) => {
          const reached =
            activeIndex >=
            index;


          return (
            <div
              key={
                state
              }
              style={{
                minHeight:
                  "48px",

                padding:
                  "9px",

                border:
                  reached
                    ? "1px solid rgba(215,255,87,.23)"
                    : "1px solid var(--inc-line)",

                background:
                  reached
                    ? "rgba(215,255,87,.025)"
                    : "rgba(255,255,255,.006)",

                display:
                  "flex",

                alignItems:
                  "center",

                gap:
                  "8px",
              }}
            >
              <span
                style={{
                  width:
                    "7px",

                  height:
                    "7px",

                  flex:
                    "0 0 auto",

                  borderRadius:
                    "50%",

                  background:
                    reached
                      ? "#d7ff57"
                      : "#404536",

                  boxShadow:
                    reached
                      ? "0 0 8px rgba(215,255,87,.35)"
                      : "none",
                }}
              />


              <strong
                style={{
                  color:
                    reached
                      ? "var(--inc-cream)"
                      : "var(--inc-dim)",

                  fontFamily:
                    "var(--font-tech)",

                  fontSize:
                    "9px",

                  fontWeight:
                    650,

                  overflow:
                    "hidden",

                  textOverflow:
                    "ellipsis",
                }}
              >
                {state}
              </strong>
            </div>
          );
        }
      )}
    </div>
  );
}


export default Incidents;
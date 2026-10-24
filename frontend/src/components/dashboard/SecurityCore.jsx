import {
  useMemo,
  useState,
} from "react";

import {
  motion,
  useReducedMotion,
} from "motion/react";

import {
  Activity,
  Crosshair,
  Radio,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";


const STATE_CONFIG = {
  SECURE: {
    label: "NOMINAL",
    code: "SYS-00",
    message:
      "Defense systems nominal. No active threat condition detected.",
  },

  ELEVATED: {
    label: "ELEVATED",
    code: "SYS-20",
    message:
      "Elevated activity observed. Sentinel-X has increased monitoring.",
  },

  ATTACK: {
    label: "HIGH",
    code: "SYS-90",
    message:
      "High-severity threat activity detected. Investigation is required.",
  },

  CRITICAL: {
    label: "CRITICAL",
    code: "SYS-99",
    message:
      "Critical threat condition detected. Immediate investigation is required.",
  },

  CONTAINED: {
    label: "CONTAINED",
    code: "SYS-40",
    message:
      "Threat activity contained. Post-incident verification is active.",
  },

  OFFLINE: {
    label: "OFFLINE",
    code: "SYS-OFF",
    message:
      "Sentinel-X defense engine connection is unavailable.",
  },
};


function resolveDefenseState(
  threatLevel,
  backendOnline
) {
  if (!backendOnline) {
    return "OFFLINE";
  }


  const level = String(
    threatLevel || ""
  ).toUpperCase();


  /*
   * Command Center now sends NOMINAL directly.
   * LOW is retained for compatibility with the temporary
   * backend system/status endpoint.
   */

  if (
    level === "NOMINAL" ||
    level === "LOW" ||
    level === "SECURE"
  ) {
    return "SECURE";
  }


  if (
    level === "ELEVATED" ||
    level === "MEDIUM"
  ) {
    return "ELEVATED";
  }


  if (level === "HIGH") {
    return "ATTACK";
  }


  if (level === "CRITICAL") {
    return "CRITICAL";
  }


  if (level === "CONTAINED") {
    return "CONTAINED";
  }


  /*
   * Unknown data should not automatically create an
   * elevated security posture.
   */

  return "SECURE";
}


function calculateDisplayRisk(
  threatLevel,
  backendOnline
) {
  if (!backendOnline) {
    return null;
  }


  const level = String(
    threatLevel || ""
  ).toUpperCase();


  const posture = {
    NOMINAL: 0,
    SECURE: 0,
    LOW: 0,

    ELEVATED: 40,
    MEDIUM: 40,

    HIGH: 75,

    CRITICAL: 95,

    CONTAINED: 20,
  };


  return posture[level] ?? 0;
}


function SecurityCore({
  threatLevel = "UNKNOWN",
  backendOnline = false,
  eventCount = 0,
  captureActive = false,
  networkStatusUnavailable = false,
}) {
  const reduceMotion =
    useReducedMotion();


  const [
    pointer,
    setPointer,
  ] = useState({
    x: 0,
    y: 0,
  });


  const defenseState = useMemo(
    () =>
      resolveDefenseState(
        threatLevel,
        backendOnline
      ),
    [
      threatLevel,
      backendOnline,
    ]
  );


  const config =
    STATE_CONFIG[
      defenseState
    ];


  const risk = useMemo(
    () =>
      calculateDisplayRisk(
        threatLevel,
        backendOnline
      ),
    [
      threatLevel,
      backendOnline,
    ]
  );


  const isAttack =
    defenseState === "ATTACK";

  const isCritical =
    defenseState === "CRITICAL";

  const isSecure =
    defenseState === "SECURE";

  const isContained =
    defenseState === "CONTAINED";

  const isElevated =
    defenseState === "ELEVATED";

  const isOffline =
    defenseState === "OFFLINE";


  const activeThreat =
    isAttack ||
    isCritical;


  const rotationSpeed =
    isCritical
      ? 3.8
      : isAttack
      ? 5
      : isElevated
      ? 9
      : isContained
      ? 13
      : 18;


  function handlePointerMove(
    event
  ) {
    if (reduceMotion) {
      return;
    }


    const bounds =
      event.currentTarget
        .getBoundingClientRect();


    const x =
      (
        event.clientX -
        bounds.left
      ) /
        bounds.width -
      0.5;


    const y =
      (
        event.clientY -
        bounds.top
      ) /
        bounds.height -
      0.5;


    setPointer({
      x: x * 10,
      y: y * 10,
    });
  }


  function resetPointer() {
    setPointer({
      x: 0,
      y: 0,
    });
  }


  function getTrackingMode() {
    if (isOffline) {
      return "OFFLINE";
    }


    if (isCritical) {
      return "LOCKED";
    }


    if (isAttack) {
      return "LOCKED";
    }


    if (isElevated) {
      return "FOCUS";
    }


    if (isContained) {
      return "VERIFY";
    }


    return "AUTO";
  }


  function getPostureMessage() {
    if (risk === null) {
      return "RISK ENGINE UNAVAILABLE";
    }


    if (risk === 0) {
      return "NO ACTIVE THREAT";
    }


    if (isCritical) {
      return "CRITICAL THREAT CONDITION";
    }


    if (isAttack) {
      return "HIGH-SEVERITY THREAT";
    }


    if (isContained) {
      return "POST-INCIDENT VERIFICATION";
    }


    if (isElevated) {
      return "ELEVATED OBSERVATION";
    }


    return "MONITORING";
  }


  return (
    <motion.section
      className={`security-core adaptive-defense-core state-${defenseState.toLowerCase()}`}
      initial={{
        opacity: 0,
        y: 22,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.75,
        ease: [
          0.16,
          1,
          0.3,
          1,
        ],
      }}
      onPointerMove={
        handlePointerMove
      }
      onPointerLeave={
        resetPointer
      }
    >
      {/* =====================================================
          ENVIRONMENT
          ===================================================== */}

      <div className="adc-grid" />

      <div className="adc-noise" />

      <div className="adc-crosshair horizontal" />

      <div className="adc-crosshair vertical" />


      <motion.div
        className="adc-ambient-bloom"
        animate={
          reduceMotion
            ? {}
            : {
                opacity:
                  activeThreat
                    ? [
                        0.08,
                        0.22,
                        0.08,
                      ]
                    : [
                        0.025,
                        0.075,
                        0.025,
                      ],

                scale:
                  activeThreat
                    ? [
                        0.92,
                        1.12,
                        0.92,
                      ]
                    : [
                        1,
                        1.05,
                        1,
                      ],
              }
        }
        transition={{
          duration:
            activeThreat
              ? 1.2
              : 4,

          repeat: Infinity,

          ease: "easeInOut",
        }}
      />


      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="adc-header">
        <div>
          <span className="adc-index">
            01 / DEFENSE CORE
          </span>

          <h2>
            Adaptive Defense
          </h2>
        </div>


        <div className="adc-header-status">
          <motion.i
            animate={
              reduceMotion
                ? {}
                : {
                    opacity: [
                      0.35,
                      1,
                      0.35,
                    ],

                    scale: [
                      1,
                      1.25,
                      1,
                    ],
                  }
            }
            transition={{
              duration:
                activeThreat
                  ? 0.7
                  : 1.8,

              repeat: Infinity,
            }}
          />

          <span>
            {!backendOnline ? "SENSOR OFFLINE" : networkStatusUnavailable ? "SENSOR UNKNOWN" : captureActive ? "SENSOR ACTIVE" : "SENSOR STANDBY"}
          </span>
        </div>
      </div>


      <div className="adc-layout">
        {/* ===================================================
            RADAR / SENSOR INSTRUMENT
            =================================================== */}

        <motion.div
          className="adc-radar-stage"
          animate={{
            x: pointer.x,
            y: pointer.y,
          }}
          transition={{
            type: "spring",
            stiffness: 90,
            damping: 18,
          }}
        >
          {/* Bearing labels */}

          <span className="adc-bearing bearing-north">
            000°
          </span>

          <span className="adc-bearing bearing-east">
            090°
          </span>

          <span className="adc-bearing bearing-south">
            180°
          </span>

          <span className="adc-bearing bearing-west">
            270°
          </span>


          {/* Coordinate axes */}

          <div className="adc-axis adc-axis-x" />

          <div className="adc-axis adc-axis-y" />


          {/* Outer instrument ring */}

          <div className="adc-ring adc-ring-outer">
            <span className="tick tick-1" />
            <span className="tick tick-2" />
            <span className="tick tick-3" />
            <span className="tick tick-4" />
            <span className="tick tick-5" />
            <span className="tick tick-6" />
            <span className="tick tick-7" />
            <span className="tick tick-8" />
          </div>


          {/* Segmented rotating ring */}

          <motion.div
            className="adc-ring adc-ring-segmented"
            animate={
              reduceMotion
                ? {}
                : {
                    rotate: 360,
                  }
            }
            transition={{
              duration:
                rotationSpeed,

              repeat: Infinity,

              ease: "linear",
            }}
          >
            <span className="segment segment-a" />

            <span className="segment segment-b" />

            <span className="segment segment-c" />
          </motion.div>


          {/* Counter-rotating tracker */}

          <motion.div
            className="adc-ring adc-ring-tracker"
            animate={
              reduceMotion
                ? {}
                : {
                    rotate: -360,
                  }
            }
            transition={{
              duration:
                activeThreat
                  ? 8
                  : 24,

              repeat: Infinity,

              ease: "linear",
            }}
          >
            <span className="tracker-node node-a" />

            <span className="tracker-node node-b" />

            <span className="tracker-node node-c" />
          </motion.div>


          {/* Inner sensor orbit */}

          <motion.div
            className="adc-ring adc-ring-inner"
            animate={
              reduceMotion
                ? {}
                : {
                    rotate: 360,
                  }
            }
            transition={{
              duration:
                activeThreat
                  ? 4
                  : 13,

              repeat: Infinity,

              ease: "linear",
            }}
          >
            <span className="sensor-dot sensor-one" />

            <span className="sensor-dot sensor-two" />
          </motion.div>


          {/* Radar sweep */}

          <motion.div
            className="adc-scanner"
            animate={
              reduceMotion
                ? {}
                : {
                    rotate: 360,
                  }
            }
            transition={{
              duration:
                activeThreat
                  ? 2.4
                  : 7.5,

              repeat: Infinity,

              ease: "linear",
            }}
          >
            <div className="adc-scanner-beam" />

            <div className="adc-scanner-line" />
          </motion.div>


          {/* Defensive pulse waves */}

          {!reduceMotion &&
            !isOffline && (
              <>
                <motion.div
                  className="adc-pulse pulse-one"
                  animate={{
                    scale: [
                      0.75,
                      1.35,
                    ],

                    opacity: [
                      0.28,
                      0,
                    ],
                  }}
                  transition={{
                    duration:
                      activeThreat
                        ? 1.2
                        : 3.2,

                    repeat:
                      Infinity,

                    ease:
                      "easeOut",
                  }}
                />


                <motion.div
                  className="adc-pulse pulse-two"
                  animate={{
                    scale: [
                      0.75,
                      1.35,
                    ],

                    opacity: [
                      0.2,
                      0,
                    ],
                  }}
                  transition={{
                    duration:
                      activeThreat
                        ? 1.2
                        : 3.2,

                    delay:
                      activeThreat
                        ? 0.6
                        : 1.6,

                    repeat:
                      Infinity,

                    ease:
                      "easeOut",
                  }}
                />
              </>
            )}


          {/* =================================================
              CENTER CORE
              ================================================= */}

          <motion.div
            className="adc-center-core"
            animate={
              reduceMotion
                ? {}
                : {
                    scale:
                      activeThreat
                        ? [
                            1,
                            1.07,
                            1,
                          ]
                        : [
                            1,
                            1.025,
                            1,
                          ],
                  }
            }
            transition={{
              duration:
                activeThreat
                  ? 0.8
                  : 2.8,

              repeat: Infinity,
            }}
          >
            <div className="adc-center-icon">
              {activeThreat ? (
                <ShieldAlert
                  size={32}
                  strokeWidth={1.25}
                />
              ) : (
                <ShieldCheck
                  size={32}
                  strokeWidth={1.25}
                />
              )}
            </div>


            <span>
              THREAT LEVEL
            </span>


            <motion.strong
              key={config.label}
              initial={{
                opacity: 0,
                y: 8,
                filter:
                  "blur(5px)",
              }}
              animate={{
                opacity: 1,
                y: 0,
                filter:
                  "blur(0px)",
              }}
              transition={{
                duration: 0.45,
              }}
            >
              {config.label}
            </motion.strong>


            <small>
              {config.code}
            </small>
          </motion.div>


          {/* Active target lock */}

          {activeThreat && (
            <motion.div
              className="adc-target-lock"
              initial={{
                opacity: 0,
                scale: 1.25,
              }}
              animate={{
                opacity: [
                  0.35,
                  1,
                  0.35,
                ],

                scale: [
                  1.08,
                  1,
                  1.08,
                ],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
              }}
            >
              <Crosshair
                size={26}
              />

              <span>
                TARGET LOCK
              </span>
            </motion.div>
          )}


          {/* Sensor labels */}

          <div className="adc-sensor-label sensor-label-a">
            <span>
              NODE 01
            </span>

            <strong>
              {!backendOnline ? "OFFLINE" : networkStatusUnavailable ? "UNKNOWN" : captureActive ? "ACTIVE" : "STANDBY"}
            </strong>
          </div>


          <div className="adc-sensor-label sensor-label-b">
            <span>
              TRACK
            </span>

            <strong>
              {getTrackingMode()}
            </strong>
          </div>
        </motion.div>


        {/* ===================================================
            SYSTEM READOUT
            =================================================== */}

        <div className="adc-readout">
          <div className="adc-readout-heading">
            <span>
              SYSTEM POSTURE
            </span>


            <motion.strong
              key={config.label}
              initial={{
                opacity: 0,
                x: 10,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              transition={{
                duration: 0.4,
              }}
            >
              {config.label}
            </motion.strong>
          </div>


          <p>
            {config.message}
          </p>


          {/* =================================================
              POSTURE INDEX
              ================================================= */}

          <div className="adc-risk-block">
            <div>
              <span>
                POSTURE INDEX
              </span>

              <small>
                {getPostureMessage()}
              </small>
            </div>


            <div className="adc-risk-number">
              <motion.strong
                key={
                  risk ??
                  "offline"
                }
                initial={{
                  opacity: 0,
                  y: 12,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.4,
                }}
              >
                {risk === null
                  ? "—"
                  : risk}
              </motion.strong>


              {risk !== null && (
                <span>
                  /100
                </span>
              )}
            </div>
          </div>


          <div className="adc-risk-track">
            <motion.div
              initial={{
                width: 0,
              }}
              animate={{
                width:
                  risk === null
                    ? "0%"
                    : `${risk}%`,
              }}
              transition={{
                duration: 0.9,

                ease: [
                  0.16,
                  1,
                  0.3,
                  1,
                ],
              }}
            />
          </div>


          {/* =================================================
              ENGINE METRICS
              ================================================= */}

          <div className="adc-metrics">
            <div>
              <Activity
                size={13}
              />

              <span>
                ENGINE
              </span>

              <strong>
                {backendOnline
                  ? "ONLINE"
                  : "OFFLINE"}
              </strong>
            </div>


            <div>
              <Radio
                size={13}
              />

              <span>
                EVENTS
              </span>

              <strong>
                {eventCount}
              </strong>
            </div>


            <div>
              <Crosshair
                size={13}
              />

              <span>
                TRACKING
              </span>

              <strong>
                {getTrackingMode()}
              </strong>
            </div>
          </div>


          {/* =================================================
              DEFENSE STATE PIPELINE
              ================================================= */}

          <div className="adc-state-sequence">
            <StateStep
              label="SECURE"
              active={
                isSecure
              }
            />

            <i />


            <StateStep
              label="ELEVATED"
              active={
                isElevated
              }
            />

            <i />


            <StateStep
              label="ATTACK"
              active={
                activeThreat
              }
            />

            <i />


            <StateStep
              label="CONTAINED"
              active={
                isContained
              }
            />
          </div>


          <div className="adc-footnote">
            <span>
              SX // ADAPTIVE DEFENSE INSTRUMENT
            </span>

            <span>
              MODE //{" "}
              {backendOnline
                ? "LIVE"
                : "OFFLINE"}
            </span>
          </div>
        </div>
      </div>
    </motion.section>
  );
}


function StateStep({
  label,
  active,
}) {
  return (
    <div
      className={`adc-state-step ${
        active
          ? "active"
          : ""
      }`}
    >
      <span />

      <strong>
        {label}
      </strong>
    </div>
  );
}


export default SecurityCore;
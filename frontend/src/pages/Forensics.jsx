import { API_BASE } from "../services/apiConfig";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { motion } from "motion/react";

import {
  CheckCircle2,
  Database,
  FileCheck2,
  FileSearch,
  Fingerprint,
  Hash,
  Link2,
  LockKeyhole,
  RefreshCw,
  ScanSearch,
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


function shortenHash(hash) {
  if (!hash) {
    return "--";
  }

  if (hash.length <= 24) {
    return hash;
  }

  return (
    `${hash.slice(0, 12)}...` +
    `${hash.slice(-12)}`
  );
}


function parseEvidenceData(value) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}


function Forensics() {
  const [
    evidence,
    setEvidence,
  ] = useState([]);


  const [
    selectedEvidenceId,
    setSelectedEvidenceId,
  ] = useState(null);


  const [
    apiOnline,
    setApiOnline,
  ] = useState(false);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    verifyingId,
    setVerifyingId,
  ] = useState(null);


  const [
    verification,
    setVerification,
  ] = useState(null);


  const [
    lastUpdated,
    setLastUpdated,
  ] = useState(null);


  /*
   * =====================================================
   * LOAD EVIDENCE
   * =====================================================
   */

  async function loadEvidence() {
    try {
      const response =
        await fetch(
          `${API_BASE}/api/v1/forensics`,
          {
            cache: "no-store",
          }
        );


      if (!response.ok) {
        throw new Error(
          "Forensics API unavailable."
        );
      }


      const data =
        await response.json();


      const records =
        Array.isArray(data)
          ? data
          : [];


      setEvidence(
        records
      );


      setApiOnline(true);

      setLastUpdated(
        new Date()
      );


      if (
        records.length > 0
      ) {
        setSelectedEvidenceId(
          (currentId) => {
            if (
              currentId !== null &&
              records.some(
                (record) =>
                  record.id ===
                  currentId
              )
            ) {
              return currentId;
            }

            return records[0].id;
          }
        );
      }
    } catch (error) {
      console.error(
        "Sentinel-X Forensics error:",
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

      await loadEvidence();
    }


    poll();


    const interval =
      window.setInterval(
        poll,
        3000
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
   * SELECTED EVIDENCE
   * =====================================================
   */

  const selectedEvidence =
    useMemo(
      () =>
        evidence.find(
          (record) =>
            record.id ===
            selectedEvidenceId
        ) ||
        evidence[0] ||
        null,
      [
        evidence,
        selectedEvidenceId,
      ]
    );


  const evidencePayload =
    useMemo(
      () =>
        parseEvidenceData(
          selectedEvidence
            ?.evidence_data
        ),
      [selectedEvidence]
    );


  /*
   * =====================================================
   * METRICS
   * =====================================================
   */

  const metrics =
    useMemo(
      () => {
        let verified = 0;
        let failed = 0;

        for (
          const record
          of evidence
        ) {
          const state =
            normalizeValue(
              record.integrity_status
            );

          if (
            state === "VERIFIED"
          ) {
            verified += 1;
          }

          if (
            state === "FAILED"
          ) {
            failed += 1;
          }
        }

        return {
          total:
            evidence.length,

          verified,

          failed,

          incidents:
            new Set(
              evidence.map(
                (record) =>
                  record.incident_id
              )
            ).size,
        };
      },
      [evidence]
    );


  /*
   * =====================================================
   * VERIFY SHA-256
   * =====================================================
   */

  async function verifyEvidence(
    evidenceId
  ) {
    setVerifyingId(
      evidenceId
    );

    setVerification(null);


    try {
      const response =
        await fetch(
          `${API_BASE}/api/v1/forensics/${evidenceId}/verify`,
          {
            method: "POST",
          }
        );


      if (!response.ok) {
        throw new Error(
          "Evidence verification failed."
        );
      }


      const result =
        await response.json();


      setVerification(
        result
      );


      await loadEvidence();
    } catch (error) {
      console.error(
        "Sentinel-X integrity verification error:",
        error
      );


      setVerification({
        evidence_id:
          evidenceId,

        verified:
          false,

        integrity_status:
          "ERROR",

        stored_hash:
          "",

        calculated_hash:
          "",
      });
    } finally {
      setVerifyingId(null);
    }
  }


  /*
   * =====================================================
   * UI
   * =====================================================
   */

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
        "--for-acid":
          "#d7ff57",

        "--for-cream":
          "#ece8d9",

        "--for-muted":
          "#9a9e89",

        "--for-dim":
          "#747966",

        "--for-purple":
          "#9b82ff",

        "--for-red":
          "#ff6258",

        "--for-amber":
          "#ffbd59",

        "--for-line":
          "rgba(232,230,211,0.11)",

        width:
          "100%",

        paddingBottom:
          "32px",

        color:
          "var(--for-cream)",
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
            "1px solid var(--for-line)",

          background:
            "radial-gradient(circle at 82% 0%, rgba(155,130,255,.08), transparent 32%), linear-gradient(135deg, rgba(18,21,14,.97), rgba(8,9,6,.99))",

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
                "var(--for-purple)",

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
            <FileSearch
              size={14}
              strokeWidth={1.5}
            />

            06 / FORENSICS
          </div>


          <h2
            style={{
              margin:
                "18px 0 13px",

              color:
                "var(--for-cream)",

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
            EVIDENCE

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
              VAULT
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
            Preserve incident artifacts,
            maintain traceable security
            context and verify digital
            evidence integrity using
            SHA-256 cryptographic
            hashing.
          </p>
        </div>


        <div
          style={{
            minWidth:
              "310px",

            border:
              "1px solid var(--for-line)",

            background:
              "rgba(8,10,6,.78)",
          }}
        >
          <HeroStatus
            label="FORENSICS ENGINE"
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
            label="INTEGRITY"
            value="SHA-256"
            active={
              apiOnline
            }
          />


          <HeroStatus
            label="EVIDENCE RECORDS"
            value={
              evidence.length
            }
            active={
              evidence.length >
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
            "repeat(auto-fit,minmax(155px,1fr))",

          gap:
            "10px",
        }}
      >
        <MetricCard
          icon={Database}
          label="EVIDENCE"
          value={
            metrics.total
          }
        />


        <MetricCard
          icon={CheckCircle2}
          label="VERIFIED"
          value={
            metrics.verified
          }
        />


        <MetricCard
          icon={ShieldX}
          label="FAILED"
          value={
            metrics.failed
          }
          tone="red"
        />


        <MetricCard
          icon={Link2}
          label="INCIDENTS"
          value={
            metrics.incidents
          }
          tone="purple"
        />
      </div>


      {/* ===================================================
          SELECTED EVIDENCE
          =================================================== */}

      <section
        style={{
          ...panelStyle,

          marginTop:
            "15px",
        }}
      >
        <PanelHeading
          eyebrow="FORENSIC ARTIFACT"
          title={
            selectedEvidence
              ? `Evidence #${selectedEvidence.id}`
              : "No Evidence Available"
          }
          icon={Fingerprint}
        />


        {selectedEvidence ? (
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
                  EVIDENCE TYPE
                </span>


                <h3
                  style={{
                    margin:
                      "7px 0 0",

                    color:
                      "var(--for-cream)",

                    fontSize:
                      "20px",

                    fontWeight:
                      560,
                  }}
                >
                  {
                    selectedEvidence
                      .evidence_type
                  }
                </h3>
              </div>


              <IntegrityBadge
                status={
                  selectedEvidence
                    .integrity_status
                }
              />
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
              <EvidenceField
                label="INCIDENT"
                value={
                  `#${selectedEvidence.incident_id}`
                }
              />


              <EvidenceField
                label="LINKED EVENT"
                value={
                  selectedEvidence
                    .linked_event_id
                    ? `#${selectedEvidence.linked_event_id}`
                    : "NONE"
                }
              />


              <EvidenceField
                label="SOURCE"
                value={
                  selectedEvidence.source
                }
              />


              <EvidenceField
                label="TARGET"
                value={
                  selectedEvidence.target ||
                  "-"
                }
              />


              <EvidenceField
                label="PRESERVED"
                value={
                  formatDateTime(
                    selectedEvidence
                      .created_at
                  )
                }
              />
            </div>


            {/* DESCRIPTION */}

            <div
              style={{
                marginTop:
                  "14px",

                padding:
                  "15px",

                border:
                  "1px solid var(--for-line)",

                background:
                  "rgba(255,255,255,.008)",
              }}
            >
              <span
                style={
                  fieldLabelStyle
                }
              >
                DESCRIPTION
              </span>


              <p
                style={{
                  margin:
                    "8px 0 0",

                  color:
                    "var(--for-muted)",

                  fontSize:
                    "11px",

                  lineHeight:
                    1.65,
                }}
              >
                {
                  selectedEvidence
                    .description
                }
              </p>
            </div>


            {/* SHA-256 */}

            <div
              style={{
                marginTop:
                  "14px",

                padding:
                  "17px",

                border:
                  "1px solid rgba(155,130,255,.20)",

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
                      "9px",
                  }}
                >
                  <Hash
                    size={16}
                    color="#9b82ff"
                  />


                  <span
                    style={
                      fieldLabelStyle
                    }
                  >
                    SHA-256 EVIDENCE HASH
                  </span>
                </div>


                <span
                  style={{
                    color:
                      "var(--for-purple)",

                    fontFamily:
                      "var(--font-tech)",

                    fontSize:
                      "9px",

                    fontWeight:
                      700,
                  }}
                >
                  256-BIT DIGEST
                </span>
              </div>


              <code
                style={{
                  display:
                    "block",

                  marginTop:
                    "13px",

                  padding:
                    "12px",

                  border:
                    "1px solid var(--for-line)",

                  color:
                    "var(--for-cream)",

                  background:
                    "rgba(0,0,0,.22)",

                  fontSize:
                    "11px",

                  lineHeight:
                    1.6,

                  overflowWrap:
                    "anywhere",

                  userSelect:
                    "text",
                }}
              >
                {
                  selectedEvidence
                    .sha256_hash
                }
              </code>


              <button
                type="button"
                disabled={
                  verifyingId ===
                  selectedEvidence.id
                }
                onClick={() =>
                  verifyEvidence(
                    selectedEvidence.id
                  )
                }
                style={{
                  marginTop:
                    "14px",

                  minHeight:
                    "39px",

                  padding:
                    "0 16px",

                  border:
                    "1px solid rgba(215,255,87,.28)",

                  color:
                    "#d7ff57",

                  background:
                    "rgba(215,255,87,.035)",

                  fontFamily:
                    "var(--font-tech)",

                  fontSize:
                    "9px",

                  fontWeight:
                    750,

                  letterSpacing:
                    ".07em",

                  cursor:
                    "pointer",
                }}
              >
                {verifyingId ===
                selectedEvidence.id
                  ? "VERIFYING SHA-256..."
                  : "VERIFY INTEGRITY"}
              </button>
            </div>


            {/* VERIFICATION RESULT */}

            {verification &&
              verification.evidence_id ===
                selectedEvidence.id && (
                <VerificationResult
                  result={
                    verification
                  }
                />
              )}
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
          PRESERVED SECURITY CONTEXT
          =================================================== */}

      <section
        style={{
          ...panelStyle,

          marginTop:
            "15px",
        }}
      >
        <PanelHeading
          eyebrow="PRESERVED CONTEXT"
          title="Evidence Metadata"
          icon={ScanSearch}
        />


        {evidencePayload ? (
          <div
            style={{
              padding:
                "22px",

              display:
                "grid",

              gridTemplateColumns:
                "repeat(auto-fit,minmax(170px,1fr))",

              gap:
                "10px",
            }}
          >
            <EvidenceField
              label="INCIDENT TYPE"
              value={
                evidencePayload
                  .incident_type ||
                evidencePayload
                  .rule_id ||
                "-"
              }
            />


            <EvidenceField
              label="INCIDENT STATUS"
              value={
                evidencePayload
                  .incident_status ||
                "-"
              }
            />


            <EvidenceField
              label="SEVERITY"
              value={
                evidencePayload
                  .severity ||
                "-"
              }
            />


            <EvidenceField
              label="EVENT TYPE"
              value={
                evidencePayload
                  .event_type ||
                "-"
              }
            />


            <EvidenceField
              label="RISK SCORE"
              value={
                evidencePayload
                  .risk_score !==
                undefined
                  ? `${evidencePayload.risk_score}/100`
                  : "-"
              }
            />


            <EvidenceField
              label="RISK LEVEL"
              value={
                evidencePayload
                  .risk_level ||
                "-"
              }
            />


            <EvidenceField
              label="RISK ASSESSMENT"
              value={
                evidencePayload
                  .risk_assessment_id
                  ? `#${evidencePayload.risk_assessment_id}`
                  : "-"
              }
            />


            <EvidenceField
              label="EVENT TIME"
              value={
                formatDateTime(
                  evidencePayload
                    .event_created_at
                )
              }
            />
          </div>
        ) : (
          <EmptyData
            text="NO PARSED EVIDENCE METADATA"
          />
        )}


        {evidencePayload
          ?.event_description && (
          <div
            style={{
              margin:
                "0 22px 22px",

              padding:
                "15px",

              border:
                "1px solid var(--for-line)",

              background:
                "rgba(255,255,255,.008)",
            }}
          >
            <span
              style={
                fieldLabelStyle
              }
            >
              PRESERVED DETECTION DESCRIPTION
            </span>


            <p
              style={{
                margin:
                  "8px 0 0",

                color:
                  "var(--for-muted)",

                fontSize:
                  "11px",

                lineHeight:
                  1.65,
              }}
            >
              {
                evidencePayload
                  .event_description
              }
            </p>
          </div>
        )}
      </section>


      {/* ===================================================
          RAW EVIDENCE
          =================================================== */}

      <section
        style={{
          ...panelStyle,

          marginTop:
            "15px",
        }}
      >
        <PanelHeading
          eyebrow="IMMUTABLE ARTIFACT"
          title="Normalized Evidence Data"
          icon={LockKeyhole}
        />


        {selectedEvidence ? (
          <div
            style={{
              padding:
                "22px",
            }}
          >
            <pre
              style={{
                margin:
                  0,

                padding:
                  "16px",

                maxHeight:
                  "320px",

                overflow:
                  "auto",

                border:
                  "1px solid var(--for-line)",

                background:
                  "rgba(0,0,0,.22)",

                color:
                  "var(--for-muted)",

                fontSize:
                  "10px",

                lineHeight:
                  1.65,

                whiteSpace:
                  "pre-wrap",

                overflowWrap:
                  "anywhere",
              }}
            >
              {evidencePayload
                ? JSON.stringify(
                    evidencePayload,
                    null,
                    2
                  )
                : selectedEvidence
                    .evidence_data}
            </pre>
          </div>
        ) : (
          <EmptyData
            text="NO EVIDENCE DATA AVAILABLE"
          />
        )}
      </section>


      {/* ===================================================
          EVIDENCE VAULT TABLE
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
          eyebrow="FORENSIC DATABASE"
          title="Evidence Vault"
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
                "950px",
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
                  "70px 155px 100px 100px 150px 150px 120px 1fr",

                alignItems:
                  "center",

                borderBottom:
                  "1px solid var(--for-line)",

                color:
                  "var(--for-dim)",

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
              <span>INCIDENT</span>
              <span>EVENT</span>
              <span>SOURCE</span>
              <span>TARGET</span>
              <span>INTEGRITY</span>
              <span>SHA-256</span>
            </div>


            {evidence.length ===
            0 ? (
              <EmptyData
                text="NO FORENSIC EVIDENCE AVAILABLE"
              />
            ) : (
              evidence.map(
                (
                  record,
                  index
                ) => (
                  <motion.button
                    key={
                      record.id
                    }
                    type="button"
                    onClick={() => {
                      setSelectedEvidenceId(
                        record.id
                      );

                      setVerification(
                        null
                      );
                    }}
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
                        "54px",

                      padding:
                        "0 22px",

                      border:
                        "none",

                      borderBottom:
                        "1px solid rgba(236,232,217,.055)",

                      background:
                        selectedEvidence
                          ?.id ===
                        record.id
                          ? "rgba(155,130,255,.025)"
                          : "transparent",

                      display:
                        "grid",

                      gridTemplateColumns:
                        "70px 155px 100px 100px 150px 150px 120px 1fr",

                      alignItems:
                        "center",

                      color:
                        "var(--for-muted)",

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
                        record.id
                      }
                    </strong>


                    <span>
                      {
                        record.evidence_type
                      }
                    </span>


                    <span>
                      #
                      {
                        record.incident_id
                      }
                    </span>


                    <span>
                      {record.linked_event_id
                        ? `#${record.linked_event_id}`
                        : "-"}
                    </span>


                    <span>
                      {
                        record.source
                      }
                    </span>


                    <span>
                      {
                        record.target ||
                        "-"
                      }
                    </span>


                    <span
                      style={{
                        color:
                          getIntegrityColor(
                            record.integrity_status
                          ),
                      }}
                    >
                      {
                        record.integrity_status
                      }
                    </span>


                    <span
                      title={
                        record.sha256_hash
                      }
                    >
                      {shortenHash(
                        record.sha256_hash
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
              "var(--for-dim)",

            fontFamily:
              "var(--font-tech)",

            fontSize:
              "9px",

            letterSpacing:
              ".05em",
          }}
        >
          <span>
            SQLITE // FORENSIC_EVIDENCE
          </span>

          <span>
            {evidence.length} RECORDS
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
            "var(--for-dim)",

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
            ? "FORENSIC CHANNEL ONLINE"
            : "FORENSIC CHANNEL OFFLINE"}
        </span>


        <span>
          {lastUpdated
            ? `UPDATED ${lastUpdated.toLocaleTimeString()}`
            : "WAITING FOR EVIDENCE DATA"}
        </span>
      </div>
    </motion.section>
  );
}


/* =========================================================
   STYLES
   ========================================================= */

const panelStyle = {
  position:
    "relative",

  border:
    "1px solid var(--for-line)",

  background:
    "linear-gradient(145deg, rgba(17,20,13,.95), rgba(8,9,6,.98))",

  boxShadow:
    "0 18px 50px rgba(0,0,0,.16)",
};


const fieldLabelStyle = {
  color:
    "var(--for-dim)",

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

function getIntegrityColor(
  status
) {
  const normalized =
    normalizeValue(
      status
    );


  if (
    normalized ===
    "VERIFIED"
  ) {
    return "#d7ff57";
  }


  if (
    normalized ===
    "FAILED"
  ) {
    return "#ff6258";
  }


  return "#ffbd59";
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
          "1px solid var(--for-line)",

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
              "var(--for-cream)",

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
        color="#9b82ff"
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
          "1px solid var(--for-line)",

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
            "var(--for-dim)",

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
              ? "var(--for-acid)"
              : "var(--for-muted)",

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
    "var(--for-acid)";


  if (
    tone === "red"
  ) {
    color =
      "var(--for-red)";
  }


  if (
    tone === "purple"
  ) {
    color =
      "var(--for-purple)";
  }


  return (
    <div
      style={{
        minHeight:
          "100px",

        padding:
          "15px",

        border:
          "1px solid var(--for-line)",

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
          style={
            fieldLabelStyle
          }
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


function EvidenceField({
  label,
  value,
}) {
  return (
    <div
      style={{
        minHeight:
          "66px",

        padding:
          "12px",

        border:
          "1px solid var(--for-line)",

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
            "8px",

          color:
            "var(--for-cream)",

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


function IntegrityBadge({
  status,
}) {
  const normalized =
    normalizeValue(
      status
    );


  const color =
    getIntegrityColor(
      normalized
    );


  const Icon =
    normalized ===
    "VERIFIED"
      ? ShieldCheck
      : ShieldX;


  return (
    <div
      style={{
        minHeight:
          "34px",

        padding:
          "0 11px",

        border:
          `1px solid ${color}40`,

        background:
          `${color}0A`,

        display:
          "flex",

        alignItems:
          "center",

        gap:
          "7px",

        color,

        fontFamily:
          "var(--font-tech)",

        fontSize:
          "9px",

        fontWeight:
          750,

        letterSpacing:
          ".06em",
      }}
    >
      <Icon
        size={13}
      />

      {normalized}
    </div>
  );
}


function VerificationResult({
  result,
}) {
  const verified =
    result.verified === true;


  const color =
    verified
      ? "#d7ff57"
      : "#ff6258";


  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 8,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      style={{
        marginTop:
          "14px",

        padding:
          "16px",

        border:
          `1px solid ${color}35`,

        background:
          `${color}08`,
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

          color,
        }}
      >
        {verified ? (
          <FileCheck2
            size={17}
          />
        ) : (
          <ShieldX
            size={17}
          />
        )}


        <strong
          style={{
            fontFamily:
              "var(--font-tech)",

            fontSize:
              "10px",

            letterSpacing:
              ".06em",
          }}
        >
          {verified
            ? "SHA-256 INTEGRITY VERIFIED"
            : "INTEGRITY VERIFICATION FAILED"}
        </strong>
      </div>


      <HashComparison
        label="STORED HASH"
        value={
          result.stored_hash
        }
      />


      <HashComparison
        label="CALCULATED HASH"
        value={
          result.calculated_hash
        }
      />


      {verified && (
        <p
          style={{
            margin:
              "12px 0 0",

            color:
              "var(--for-muted)",

            fontSize:
              "10px",

            lineHeight:
              1.6,
          }}
        >
          Stored and recalculated
          SHA-256 digests match.
          The preserved evidence
          has passed the integrity
          check.
        </p>
      )}
    </motion.div>
  );
}


function HashComparison({
  label,
  value,
}) {
  return (
    <div
      style={{
        marginTop:
          "12px",
      }}
    >
      <span
        style={
          fieldLabelStyle
        }
      >
        {label}
      </span>


      <code
        style={{
          display:
            "block",

          marginTop:
            "5px",

          color:
            "var(--for-cream)",

          fontSize:
            "10px",

          overflowWrap:
            "anywhere",
        }}
      >
        {value || "--"}
      </code>
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
          "260px",

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
      <FileSearch
        size={29}
        color="#9b82ff"
      />


      <strong
        style={{
          color:
            "var(--for-cream)",

          fontFamily:
            "var(--font-tech)",

          fontSize:
            "11px",

          letterSpacing:
            ".06em",
        }}
      >
        {loading
          ? "LOADING EVIDENCE"
          : "NO FORENSIC EVIDENCE"}
      </strong>


      <p
        style={{
          maxWidth:
            "430px",

          margin:
            0,

          color:
            "var(--for-muted)",

          fontSize:
            "11px",

          lineHeight:
            1.6,
        }}
      >
        Preserved Sentinel-X
        incident evidence will
        appear here automatically.
      </p>
    </div>
  );
}


function EmptyData({
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
          "var(--for-dim)",

        fontFamily:
          "var(--font-tech)",

        fontSize:
          "10px",
      }}
    >
      <ScanSearch
        size={14}
      />

      {text}
    </div>
  );
}


export default Forensics;
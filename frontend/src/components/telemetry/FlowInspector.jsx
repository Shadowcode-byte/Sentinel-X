
import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Clock3,
  Filter,
  Network,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";

const PROTOCOLS = ["ALL", "TCP", "UDP", "DNS", "ICMP"];

function formatTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString();
}

function formatPort(value) {
  return value == null ? "—" : String(value);
}

function FlowInspector({
  connections = [],
  captureActive = false,
}) {
  const reduceMotion = useReducedMotion();

  const [searchQuery, setSearchQuery] = useState("");
  const [protocolFilter, setProtocolFilter] = useState("ALL");
  const [expandedFlow, setExpandedFlow] = useState(null);

  const safeConnections = Array.isArray(connections)
    ? connections
    : [];

  const filteredConnections = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return safeConnections.filter((flow) => {
      const protocol = String(
        flow.protocol || "UNKNOWN"
      ).toUpperCase();

      if (
        protocolFilter !== "ALL" &&
        protocol !== protocolFilter
      ) {
        return false;
      }

      if (!query) return true;

      const searchable = [
        flow.source,
        flow.destination,
        flow.source_port,
        flow.destination_port,
        flow.protocol,
        flow.direction,
        flow.state,
      ]
        .map((value) => String(value ?? ""))
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [safeConnections, searchQuery, protocolFilter]);

  function resetFilters() {
    setSearchQuery("");
    setProtocolFilter("ALL");
    setExpandedFlow(null);
  }

  function flowKey(flow) {
    return [
      flow.source,
      flow.destination,
      flow.source_port,
      flow.destination_port,
      flow.protocol,
      flow.direction,
    ].join("|");
  }

  return (
    <motion.section
      className="sx-flow-inspector"
      initial={reduceMotion ? false : { opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      aria-label="Advanced network flow inspection"
    >
      <div className="sx-flow-inspector__header">
        <div>
          <span className="micro-label">
            NETWORK INTELLIGENCE // FLOW ANALYSIS
          </span>

          <h3>Advanced Flow Inspector</h3>

          <p>
            Search and inspect observed network connections,
            protocol metadata and TCP flag indicators.
          </p>
        </div>

        <div className="sx-flow-inspector__status">
          <Activity size={13} />
          {captureActive ? "LIVE" : "STANDBY"}
        </div>
      </div>

      <div className="sx-flow-inspector__toolbar">
        <label className="sx-flow-inspector__search">
          <Search size={16} />

          <input
            type="search"
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(event.target.value)
            }
            placeholder="Search IP, port, protocol, direction..."
            aria-label="Search network flows"
          />
        </label>

        <label className="sx-flow-inspector__select">
          <Filter size={15} />

          <select
            value={protocolFilter}
            onChange={(event) =>
              setProtocolFilter(event.target.value)
            }
            aria-label="Filter inspected flows by protocol"
          >
            {PROTOCOLS.map((protocol) => (
              <option key={protocol} value={protocol}>
                {protocol === "ALL"
                  ? "ALL PROTOCOLS"
                  : protocol}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="sx-flow-inspector__reset"
          onClick={resetFilters}
          disabled={
            !searchQuery &&
            protocolFilter === "ALL" &&
            expandedFlow == null
          }
        >
          <X size={14} />
          RESET
        </button>
      </div>

      <div className="sx-flow-inspector__summary">
        <span>
          <Network size={13} />
          {filteredConnections.length} MATCHING FLOWS
        </span>

        <span>
          {safeConnections.length} OBSERVED RECORDS
        </span>
      </div>

      <div className="sx-flow-inspector__list">
        {filteredConnections.length === 0 ? (
          <div className="sx-flow-inspector__empty">
            <Search size={22} />

            <strong>NO MATCHING FLOWS</strong>

            <span>
              {safeConnections.length === 0
                ? "No network flow records are currently available."
                : "Try another IP address, protocol or port."}
            </span>
          </div>
        ) : (
          filteredConnections.map((flow) => {
            const key = flowKey(flow);
            const expanded = expandedFlow === key;

            return (
              <div
                className="sx-flow-inspector__flow"
                key={key}
              >
                <button
                  type="button"
                  className="sx-flow-inspector__flow-button"
                  onClick={() =>
                    setExpandedFlow(
                      expanded ? null : key
                    )
                  }
                  aria-expanded={expanded}
                >
                  <div className="sx-flow-inspector__flow-main">
                    <span className="sx-flow-inspector__protocol">
                      {flow.protocol || "UNKNOWN"}
                    </span>

                    <div className="sx-flow-inspector__addresses">
                      <strong>
                        {flow.source || "UNKNOWN"}
                      </strong>

                      {String(flow.direction).toUpperCase() ===
                      "INBOUND" ? (
                        <ArrowDownLeft size={14} />
                      ) : (
                        <ArrowUpRight size={14} />
                      )}

                      <strong>
                        {flow.destination || "UNKNOWN"}
                      </strong>
                    </div>
                  </div>

                  <div className="sx-flow-inspector__flow-meta">
                    <span>
                      {Number(flow.packets || 0).toLocaleString()}
                      {" "}PKTS
                    </span>

                    {expanded ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </div>
                </button>

                {expanded && (
                  <div className="sx-flow-inspector__details">
                    <Detail label="SOURCE IP" value={flow.source} />
                    <Detail label="DESTINATION IP" value={flow.destination} />
                    <Detail
                      label="SOURCE PORT"
                      value={formatPort(flow.source_port)}
                    />
                    <Detail
                      label="DESTINATION PORT"
                      value={formatPort(flow.destination_port)}
                    />
                    <Detail label="PROTOCOL" value={flow.protocol} />
                    <Detail label="DIRECTION" value={flow.direction} />
                    <Detail label="FLOW STATE" value={flow.state || "OBSERVED"} />
                    <Detail
                      label="PACKET COUNT"
                      value={Number(flow.packets || 0).toLocaleString()}
                    />

                    <Detail
                      label="TCP SYN OBSERVED"
                      value={
                        flow.syn_observed === true
                          ? "YES"
                          : flow.syn_observed === false
                            ? "NO"
                            : "UNKNOWN"
                      }
                    />

                    <Detail
                      label="TCP ACK OBSERVED"
                      value={
                        flow.ack_observed === true
                          ? "YES"
                          : flow.ack_observed === false
                            ? "NO"
                            : "UNKNOWN"
                      }
                    />

                    <Detail
                      label="FIRST SEEN"
                      value={formatTime(flow.first_seen)}
                      icon={Clock3}
                    />

                    <Detail
                      label="LAST SEEN"
                      value={formatTime(flow.last_seen)}
                      icon={Clock3}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="sx-flow-inspector__footer">
        <span>
          <ShieldCheck size={13} />
          READ-ONLY NETWORK OBSERVATION
        </span>

        <span>
          SOURCE // SENTINEL-X PACKET SENSOR
        </span>
      </div>
    </motion.section>
  );
}

function Detail({ label, value, icon: Icon }) {
  return (
    <div className="sx-flow-inspector__detail">
      <span>
        {Icon && <Icon size={12} />}
        {label}
      </span>

      <strong>{value ?? "—"}</strong>
    </div>
  );
}

export default FlowInspector;

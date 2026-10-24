
import { motion } from "motion/react";
import { Filter, RotateCcw } from "lucide-react";

const PROTOCOLS = [
  { id: "ALL", label: "ALL TRAFFIC" },
  { id: "TCP", label: "TCP" },
  { id: "UDP", label: "UDP" },
  { id: "DNS", label: "DNS" },
  { id: "ICMP", label: "ICMP" },
];

function ProtocolFilter({
  selectedProtocol = "ALL",
  onProtocolChange,
  counts = {},
  disabled = false,
}) {
  const activeProtocol = PROTOCOLS.some(
    (item) => item.id === selectedProtocol
  )
    ? selectedProtocol
    : "ALL";

  function selectProtocol(protocol) {
    if (disabled || !onProtocolChange) return;
    onProtocolChange(protocol);
  }

  return (
    <div
      className="sx-protocol-filter"
      aria-label="Network protocol filters"
    >
      <div className="sx-protocol-filter__heading">
        <div className="sx-protocol-filter__title">
          <Filter size={14} strokeWidth={1.7} />
          <span>PROTOCOL FILTER</span>
        </div>

        <span className="sx-protocol-filter__hint">
          FILTER OBSERVED FLOWS
        </span>
      </div>

      <div
        className="sx-protocol-filter__options"
        role="group"
        aria-label="Filter network flows by protocol"
      >
        {PROTOCOLS.map((protocol) => {
          const isActive =
            activeProtocol === protocol.id;

          const count =
            protocol.id === "ALL"
              ? counts.ALL
              : counts[protocol.id];

          return (
            <motion.button
              key={protocol.id}
              type="button"
              disabled={disabled}
              className={[
                "sx-protocol-filter__button",
                isActive ? "is-active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => selectProtocol(protocol.id)}
              whileHover={
                disabled ? undefined : { y: -2 }
              }
              whileTap={
                disabled ? undefined : { scale: 0.97 }
              }
              aria-pressed={isActive}
            >
              <span>{protocol.label}</span>

              {Number.isFinite(Number(count)) && (
                <span className="sx-protocol-filter__count">
                  {Number(count).toLocaleString()}
                </span>
              )}
            </motion.button>
          );
        })}

        <button
          type="button"
          className="sx-protocol-filter__reset"
          onClick={() => selectProtocol("ALL")}
          disabled={
            disabled || activeProtocol === "ALL"
          }
          aria-label="Reset protocol filter"
          title="Reset protocol filter"
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
}

export default ProtocolFilter;

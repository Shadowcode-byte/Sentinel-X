import { AnimatePresence, motion } from "motion/react";
import { Radio, Terminal } from "lucide-react";

function EventStream({ events = [] }) {
  return (
    <motion.section
      className="event-stream-card"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.7,
        delay: 0.28,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <div className="stream-header">
        <div>
          <span className="micro-label">DETECTION STREAM</span>
          <h3>Live Security Events</h3>
        </div>

        <div className="stream-live">
          <motion.span
            animate={{
              opacity: [0.35, 1, 0.35],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
          />

          LIVE
        </div>
      </div>

      <div className="stream-columns">
        <span>TIME</span>
        <span>SEVERITY</span>
        <span>EVENT</span>
        <span>SOURCE</span>
        <span>TARGET</span>
      </div>

      <div className="stream-body">
        <AnimatePresence initial={false}>
          {events.length === 0 ? (
            <motion.div
              className="stream-empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Radio size={20} />
              Waiting for security telemetry...
            </motion.div>
          ) : (
            events.slice(0, 7).map((event, index) => (
              <motion.div
                className="stream-row"
                key={event.id}
                initial={{
                  opacity: 0,
                  x: -18,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                transition={{
                  delay: index * 0.045,
                }}
              >
                <span className="stream-time">
                  {new Date(event.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>

                <span
                  className={`stream-severity severity-${event.severity.toLowerCase()}`}
                >
                  <i />
                  {event.severity}
                </span>

                <span className="stream-event">
                  <Terminal size={13} />
                  {event.event_type}
                </span>

                <span>{event.source}</span>

                <span>{event.target || "—"}</span>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}

export default EventStream;
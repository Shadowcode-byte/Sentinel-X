import { motion } from "motion/react";
import { ScrollText } from "lucide-react";

function Reports() {
  return (
    <motion.section
      className="module-placeholder"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="module-placeholder-icon">
        <ScrollText size={28} />
      </div>

      <span className="micro-label">
        SENTINEL-X MODULE
      </span>

      <h2>Security Reports</h2>

      <p>
        Generate professional incident, forensic, risk-assessment
        and security-posture reports containing evidence, timelines,
        findings, response actions and recommendations.
      </p>
    </motion.section>
  );
}

export default Reports;
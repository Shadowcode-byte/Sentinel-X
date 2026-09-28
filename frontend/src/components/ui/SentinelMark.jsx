import { motion } from "motion/react";

function SentinelMark({
  size = 42,
  animated = true,
  className = "",
}) {
  return (
    <motion.svg
      className={`sentinel-mark ${className}`}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Sentinel-X"
      initial={animated ? { opacity: 0, scale: 0.9 } : false}
      animate={
        animated
          ? {
              opacity: 1,
              scale: 1,
            }
          : undefined
      }
      transition={{
        duration: 0.45,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {/* Outer angular shield */}
      <motion.path
        d="
          M32 4
          L54 12
          V29
          C54 43 46 53 32 60
          C18 53 10 43 10 29
          V12
          L32 4Z
        "
        className="sentinel-mark-shield"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        initial={
          animated
            ? {
                pathLength: 0,
                opacity: 0,
              }
            : false
        }
        animate={{
          pathLength: 1,
          opacity: 1,
        }}
        transition={{
          duration: 0.9,
          ease: "easeInOut",
        }}
      />

      {/* Inner structural frame */}
      <path
        d="
          M32 10
          L48 16
          V29
          C48 39 42 47 32 53
          C22 47 16 39 16 29
          V16
          L32 10Z
        "
        className="sentinel-mark-inner"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {/* Abstract S */}
      <motion.path
        d="
          M39 20
          H28
          C24 20 22 22 22 25
          C22 28 24 30 28 30
          H35
          C39 30 41 32 41 36
          C41 40 38 43 33 43
          H23
        "
        className="sentinel-mark-s"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="square"
        initial={
          animated
            ? {
                pathLength: 0,
              }
            : false
        }
        animate={{
          pathLength: 1,
        }}
        transition={{
          delay: 0.35,
          duration: 0.7,
        }}
      />

      {/* X slash */}
      <motion.path
        d="M24 42 L40 21"
        className="sentinel-mark-x"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="square"
        initial={
          animated
            ? {
                pathLength: 0,
              }
            : false
        }
        animate={{
          pathLength: 1,
        }}
        transition={{
          delay: 0.65,
          duration: 0.45,
        }}
      />

      {/* Defense node */}
      <motion.rect
        x="29.5"
        y="6.5"
        width="5"
        height="5"
        transform="rotate(45 32 9)"
        className="sentinel-mark-node"
        fill="currentColor"
        initial={
          animated
            ? {
                opacity: 0,
                scale: 0,
              }
            : false
        }
        animate={{
          opacity: 1,
          scale: 1,
        }}
        transition={{
          delay: 0.9,
          duration: 0.3,
        }}
      />
    </motion.svg>
  );
}

export default SentinelMark;
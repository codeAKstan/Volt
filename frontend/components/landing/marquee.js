"use client"

import { useRef } from "react"
import { motion } from "framer-motion"

export function Marquee({ children, direction = "left", speed = 25, pauseOnHover = true }) {
  const containerRef = useRef(null)

  // Calculate the animation duration based on the number of children and speed
  const duration = 20 / (speed / 25) // Base duration adjusted by speed

  return (
    <div ref={containerRef} className="overflow-hidden relative w-full">
      <div className={`inline-flex whitespace-nowrap ${pauseOnHover ? "hover:[animation-play-state:paused]" : ""}`}>
        <motion.div
          className="flex"
          animate={{
            x: direction === "left" ? [0, -1000] : [-1000, 0],
          }}
          transition={{
            x: {
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "loop",
              duration: duration,
              ease: "linear",
            },
          }}
        >
          {children}
        </motion.div>
        <motion.div
          className="flex"
          animate={{
            x: direction === "left" ? [0, -1000] : [-1000, 0],
          }}
          transition={{
            x: {
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "loop",
              duration: duration,
              ease: "linear",
            },
          }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  )
}

"use client";

/**
 * MarqueeSeparator.tsx
 * A full-width horizontal band with an infinite scrolling text animation.
 * Features an ink-dark background with subtle SVG borders for a sketchy feel.
 */
import React from "react";
import { motion } from "framer-motion";

export const MarqueeSeparator = () => {
  const words = [
    "human connection",
    "real teachers",
    "live sessions",
    "learn anything",
    "fewer screens",
    "more voices",
  ];

  // Clone to seamlessly loop
  const loopItems = [...words, ...words, ...words];

  return (
    <div className="relative w-full h-[60px] md:h-[70px] bg-ink overflow-hidden flex items-center justify-center">
      {/* Top Sketchy Edge Mask (cuts into the ink background slightly with warm-white) */}
      <svg
        className="absolute top-0 left-0 w-full h-[4px] text-warm-white z-10 pointer-events-none"
        preserveAspectRatio="none"
        viewBox="0 0 1200 4"
      >
        <path
          d="M 0,0 L 1200,0 L 1200,2 Q 900,4 600,1 T 0,1 Z"
          fill="currentColor"
        />
      </svg>

      {/* Infinite Scrolling Track */}
      <div className="flex w-full overflow-hidden">
        <motion.div
          className="flex whitespace-nowrap items-center text-warm-white text-sm md:text-base font-bold uppercase tracking-[0.2em] px-4"
          initial={{ x: "0%" }}
          animate={{ x: "-33.333%" }}
          transition={{ duration: 25, ease: "linear", repeat: Infinity }}
        >
          {loopItems.map((word, index) => (
            <React.Fragment key={index}>
              <span className="mx-6 md:mx-10 whitespace-nowrap">{word}</span>
              <span className="text-warm-white opacity-40 mx-2 select-none">
                &bull;
              </span>
            </React.Fragment>
          ))}
        </motion.div>
      </div>

      {/* Bottom Sketchy Edge Mask */}
      <svg
        className="absolute bottom-0 left-0 w-full h-[4px] text-warm-white z-10 pointer-events-none"
        preserveAspectRatio="none"
        viewBox="0 0 1200 4"
      >
        <path
          d="M 0,4 L 1200,4 L 1200,2 Q 900,0 600,3 T 0,2 Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
};

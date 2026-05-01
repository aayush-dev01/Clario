/* Purpose: On-brand loading animation (doodle GIF-style). */
"use client";

import React from "react";
import { motion } from "framer-motion";
import { Doodle } from "@/components/ui/Doodle";

type DoodleLoaderProps = {
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const SIZE = {
  sm: { wrap: "w-24 h-24", doodle: "w-16 h-16", text: "text-[12px]" },
  md: { wrap: "w-32 h-32", doodle: "w-20 h-20", text: "text-[13px]" },
  lg: { wrap: "w-44 h-44", doodle: "w-28 h-28", text: "text-[14px]" },
} as const;

export function DoodleLoader({
  label = "Loading…",
  className = "",
  size = "md",
}: DoodleLoaderProps) {
  const s = SIZE[size];

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`relative ${s.wrap}`}>
        <motion.div
          className="absolute inset-0 text-ink/[0.10]"
          animate={{ rotate: 360 }}
          transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
        >
          <Doodle type="circle-scribble" className="w-full h-full" />
        </motion.div>

        <motion.div
          className="absolute inset-0 flex items-center justify-center text-ink"
          animate={{ rotate: [-4, 4, -4], y: [0, -2, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Doodle type="stars-cluster" className={s.doodle} />
        </motion.div>

        <motion.div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-ink/[0.25]"
          animate={{ x: [-10, 10, -10] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <Doodle type="squiggle-underline" className="w-24 h-8" />
        </motion.div>
      </div>

      <motion.div
        className={`mt-6 font-medium text-ink-muted ${s.text}`}
        animate={{ opacity: [0.45, 0.9, 0.45] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      >
        {label}
      </motion.div>
    </div>
  );
}


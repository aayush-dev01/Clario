/* ToggleSwitch.tsx — Animated SVG toggle switch with spring physics. */
"use client";

import React from "react";
import { motion } from "framer-motion";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const ToggleSwitch = ({ checked, onChange }: ToggleSwitchProps) => {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative w-[40px] h-[22px] flex-shrink-0 focus:outline-none"
      role="switch"
      aria-checked={checked}
    >
      <svg viewBox="0 0 40 22" className="w-full h-full">
        {/* Track */}
        <rect
          x="1"
          y="1"
          width="38"
          height="20"
          rx="10"
          fill={checked ? "#1A1916" : "#C4C2BC"}
          className="transition-colors duration-200"
        />
        {/* Thumb */}
        <motion.circle
          cy="11"
          r="7.5"
          fill="#F9F8F6"
          animate={{ cx: checked ? 28 : 12 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </svg>
    </button>
  );
};

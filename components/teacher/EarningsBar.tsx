/* EarningsBar.tsx — A single animated SVG bar for the earnings chart. */
"use client";

import React from "react";
import { motion } from "framer-motion";

interface EarningsBarProps {
  amount: number;
  maxAmount: number;
  label: string;
  index: number;
  barWidth: number;
  maxHeight: number;
}

export const EarningsBar = ({
  amount,
  maxAmount,
  label,
  index,
  barWidth,
  maxHeight,
}: EarningsBarProps) => {
  const barHeight = (amount / maxAmount) * maxHeight;
  const x = index * (barWidth + 16) + 40;
  const y = maxHeight - barHeight + 20;

  return (
    <g>
      <motion.rect
        x={x}
        y={y}
        width={barWidth}
        rx={4}
        ry={4}
        fill="currentColor"
        className="text-ink"
        initial={{ height: 0, y: maxHeight + 20 }}
        animate={{ height: barHeight, y }}
        transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" as const }}
      />
      <text
        x={x + barWidth / 2}
        y={y - 8}
        textAnchor="middle"
        className="fill-ink font-hand text-[13px]"
      >
        ₹{(amount / 1000).toFixed(1)}k
      </text>
      <text
        x={x + barWidth / 2}
        y={maxHeight + 40}
        textAnchor="middle"
        className="fill-ink-muted font-sans text-[11px]"
      >
        {label}
      </text>
    </g>
  );
};

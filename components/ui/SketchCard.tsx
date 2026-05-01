/* SketchCard.tsx — A card with a hand-drawn SVG border overlay and subtle tilt. */
"use client";

import React from "react";
import { motion } from "framer-motion";

interface SketchCardProps {
  children: React.ReactNode;
  tilt?: number;
  className?: string;
  onClick?: () => void;
}

export const SketchCard = ({
  children,
  tilt = 0,
  className = "",
  onClick,
}: SketchCardProps) => {
  return (
    <motion.div
      className={`relative overflow-visible ${className}`}
      style={{ transform: `rotate(${tilt}deg)` }}
      whileHover={{
        y: -4,
        rotate: 0,
        transition: { duration: 0.2, ease: "easeOut" as const },
      }}
      onClick={onClick}
    >
      {children}
      <svg
        className="absolute w-full h-full pointer-events-none overflow-visible"
        style={{ inset: "-1px" }}
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        {/* Imperfect quadrilateral — corners slightly offset from 0/100 */}
        <path
          d="M 2 3 L 98 1 L 99 97 L 1 98 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-ink/[0.15]"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </motion.div>
  );
};

export default SketchCard;

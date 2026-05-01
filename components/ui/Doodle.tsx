"use client";

/**
 * Doodle.tsx
 * A component that renders various hand-drawn SVG doodles using Framer Motion
 * for path drawing animation. Automatically uses the currentColor of its parent.
 */
import React from "react";
import { motion } from "framer-motion";

type DoodleType =
  | "squiggle-underline"
  | "circle-scribble"
  | "arrow-curved"
  | "stars-cluster"
  | "dashed-path"
  | "scribble-line";

interface DoodleProps {
  type: DoodleType;
  className?: string;
}

export const Doodle = ({ type, className = "" }: DoodleProps) => {
  const pathVariants = {
    initial: { pathLength: 0 },
    animate: { pathLength: 1 },
  };

  const getDoodleContent = () => {
    switch (type) {
      case "squiggle-underline":
        return (
          <motion.path
            d="M 5 20 Q 30 5 50 20 T 95 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={pathVariants}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
        );
      case "circle-scribble":
        return (
          <motion.path
            d="M 50 10 A 40 40 0 1 1 45 12 A 35 35 0 1 1 50 15"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={pathVariants}
            initial="initial"
            animate="animate"
            transition={{ duration: 1.0, ease: "easeInOut" }}
          />
        );
      case "arrow-curved":
        return (
          <motion.path
            d="M 10 90 Q 50 10 90 50 M 75 55 L 90 50 L 85 35"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={pathVariants}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.7, ease: "easeInOut" }}
          />
        );
      case "stars-cluster":
        return (
          <motion.g
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <motion.path
              d="M 25 15 L 30 25 L 40 25 L 32 32 L 35 42 L 25 35 L 15 42 L 18 32 L 10 25 L 20 25 Z"
              variants={pathVariants}
              initial="initial"
              animate="animate"
              transition={{ duration: 0.9, ease: "easeInOut" }}
            />
            <motion.path
              d="M 75 65 L 80 75 L 90 75 L 82 82 L 85 92 L 75 85 L 65 92 L 68 82 L 60 75 L 70 75 Z"
              variants={pathVariants}
              initial="initial"
              animate="animate"
              transition={{ duration: 0.9, ease: "easeInOut", delay: 0.3 }}
            />
          </motion.g>
        );
      case "dashed-path":
        return (
          <motion.path
            d="M 10 10 C 30 30, 70 30, 90 90"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="8 8"
            variants={pathVariants}
            initial="initial"
            animate="animate"
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />
        );
      case "scribble-line":
        return (
          <motion.path
            d="M 8 55 C 18 40, 28 70, 38 52 C 48 35, 58 68, 68 50 C 78 32, 88 64, 92 52"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={pathVariants}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.7, ease: "easeInOut" }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
    >
      {getDoodleContent()}
    </svg>
  );
};

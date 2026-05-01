/* Purpose: Tiny prop doodles for negative space (books, pencil, bubbles, clock, cursor, sticky note). */
"use client";

import React from "react";
import { motion } from "framer-motion";

type Props = { className?: string };

export function MicroBook({ className = "" }: Props) {
  return (
    <svg className={className} viewBox="0 0 80 60" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 10 10 Q 24 6 38 10 L 38 50 Q 24 46 10 50 Z" />
      <path d="M 38 10 Q 54 6 70 10 L 70 50 Q 54 46 38 50 Z" />
      <path d="M 38 10 L 38 50" opacity="0.6" />
      <path d="M 16 20 L 32 18" strokeDasharray="4 6" opacity="0.6" />
      <path d="M 46 20 L 64 18" strokeDasharray="4 6" opacity="0.6" />
    </svg>
  );
}

export function MicroPencil({ className = "" }: Props) {
  return (
    <svg className={className} viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 16 64 L 58 22 L 64 28 L 22 70 Z" />
      <path d="M 58 22 L 68 12 L 74 18 L 64 28" />
      <path d="M 18 64 L 12 74 L 22 70" />
      <path d="M 10 54 Q 18 50 26 54" strokeDasharray="3 6" opacity="0.6" />
    </svg>
  );
}

export function MicroBubble({ className = "" }: Props) {
  return (
    <svg className={className} viewBox="0 0 90 70" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 12 18 C 18 8, 72 8, 78 18 C 84 30, 78 52, 58 52 L 42 62 L 44 52 L 26 52 C 10 52, 6 30, 12 18 Z" />
      <circle cx="34" cy="32" r="2" fill="currentColor" stroke="none" opacity="0.6" />
      <circle cx="46" cy="32" r="2" fill="currentColor" stroke="none" opacity="0.6" />
      <circle cx="58" cy="32" r="2" fill="currentColor" stroke="none" opacity="0.6" />
    </svg>
  );
}

export function MicroClock({ className = "" }: Props) {
  return (
    <svg className={className} viewBox="0 0 70 70" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="35" cy="35" r="24" />
      <path d="M 35 20 L 35 36" />
      <path d="M 35 35 L 46 42" />
      <path d="M 18 10 L 12 16" opacity="0.6" />
      <path d="M 52 10 L 58 16" opacity="0.6" />
    </svg>
  );
}

export function MicroCursor({ className = "" }: Props) {
  return (
    <svg className={className} viewBox="0 0 70 70" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 18 12 L 18 54 L 32 44 L 40 62 L 50 58 L 42 40 L 58 36 Z" />
      <path d="M 42 40 L 32 44" opacity="0.6" />
    </svg>
  );
}

export function MicroSticky({ className = "" }: Props) {
  return (
    <svg className={className} viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 16 16 L 64 16 L 64 64 L 28 64 L 16 52 Z" />
      <path d="M 28 64 L 28 52 L 16 52" opacity="0.6" />
      <path d="M 26 30 L 54 30" strokeDasharray="4 6" opacity="0.6" />
      <path d="M 26 42 L 48 42" strokeDasharray="4 6" opacity="0.6" />
    </svg>
  );
}

export function Drift({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <motion.div
      className={className}
      initial={{ y: 0 }}
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      style={{ willChange: "transform" }}
    >
      {children}
    </motion.div>
  );
}


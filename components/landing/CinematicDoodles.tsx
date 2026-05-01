/* Purpose: Cinematic, human-centered sketch doodles for landing scenes. */
"use client";

import React from "react";
import { motion } from "framer-motion";

type Props = { className?: string };

export function TeacherExplaining({ className = "" }: Props) {
  return (
    <svg
      className={className}
      viewBox="0 0 180 220"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* whiteboard */}
      <path d="M 90 18 C 130 10, 162 18, 166 44 C 170 88, 166 132, 162 168 C 150 182, 120 190, 92 188 C 58 186, 30 176, 22 158 C 14 128, 16 70, 22 42 C 34 20, 62 12, 90 18" opacity="0.5" />
      <path d="M 48 62 Q 80 52 118 62" opacity="0.6" />
      <path d="M 44 84 Q 70 74 108 84" strokeDasharray="5 7" opacity="0.6" />
      <path d="M 50 108 Q 78 96 130 110" opacity="0.55" />
      <path d="M 56 132 Q 86 122 124 136" strokeDasharray="4 8" opacity="0.55" />

      {/* teacher */}
      <circle cx="56" cy="74" r="14" />
      <path d="M 36 142 C 38 116, 50 104, 60 104 C 74 104, 90 118, 94 146" />
      {/* raised arm pointing */}
      <path d="M 78 118 Q 112 92 136 78" />
      <path d="M 136 78 L 152 70" strokeDasharray="5 8" opacity="0.7" />
      {/* posture leg line */}
      <path d="M 52 146 L 46 196" opacity="0.7" />
      <path d="M 70 148 L 76 198" opacity="0.7" />
      {/* little sparks */}
      <motion.path
        d="M 144 46 L 160 38 M 150 54 L 168 54 M 142 62 L 158 72"
        strokeDasharray="2 7"
        initial={{ opacity: 0.15 }}
        animate={{ opacity: [0.12, 0.34, 0.12] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      />
    </svg>
  );
}

export function StudentAha({ className = "" }: Props) {
  return (
    <svg
      className={className}
      viewBox="0 0 160 200"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* desk */}
      <path d="M 14 166 Q 80 154 146 166" opacity="0.7" />
      <path d="M 28 166 L 22 196 M 132 166 L 138 196" opacity="0.6" />
      {/* notebook */}
      <path d="M 56 144 L 108 140 L 112 164 L 60 168 Z" opacity="0.55" />
      <path d="M 66 152 L 102 150" strokeDasharray="5 7" opacity="0.55" />
      {/* coffee */}
      <path d="M 18 148 Q 26 142 34 148 Q 34 162 18 162 Z" opacity="0.55" />
      <path d="M 34 152 Q 42 152 40 160" opacity="0.55" />

      {/* student */}
      <circle cx="74" cy="92" r="14" />
      <path d="M 48 166 C 52 132, 66 118, 76 118 C 92 118, 106 132, 110 166" />
      <path d="M 62 122 Q 56 140 50 150" opacity="0.65" />
      <path d="M 90 122 Q 100 142 108 154" opacity="0.65" />

      {/* lightbulb */}
      <motion.path
        d="M 124 58 Q 128 44 114 38 Q 98 36 98 52 Q 98 62 106 66 L 106 74 L 118 74 L 118 66 Q 122 64 124 58 Z"
        fill="none"
        initial={{ opacity: 0.18 }}
        animate={{ opacity: [0.16, 0.36, 0.16] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.path
        d="M 106 78 L 118 78"
        strokeDasharray="3 6"
        initial={{ opacity: 0.18 }}
        animate={{ opacity: [0.12, 0.32, 0.12] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      />
    </svg>
  );
}

export function PairSession({ className = "" }: Props) {
  return (
    <svg
      className={className}
      viewBox="0 0 220 180"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* laptop */}
      <path d="M 44 124 L 176 124" opacity="0.7" />
      <path d="M 64 34 L 156 34 L 166 114 L 54 114 Z" />
      <path d="M 76 46 L 144 46 L 150 106 L 70 106 Z" opacity="0.5" />
      <path d="M 88 66 L 132 66" strokeDasharray="5 7" opacity="0.55" />
      <path d="M 92 84 L 128 84" strokeDasharray="5 7" opacity="0.55" />

      {/* people */}
      <circle cx="62" cy="78" r="12" />
      <circle cx="158" cy="80" r="11" opacity="0.9" />
      <path d="M 38 156 C 40 128, 58 118, 68 118 C 82 118, 94 130, 96 156" />
      <path d="M 136 156 C 138 130, 152 120, 162 120 C 176 120, 186 132, 188 156" opacity="0.9" />
      {/* pointing gesture */}
      <path d="M 80 114 Q 102 98 116 88" />
      <motion.path
        d="M 116 88 L 132 78"
        strokeDasharray="4 7"
        initial={{ opacity: 0.2 }}
        animate={{ opacity: [0.15, 0.35, 0.15] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      />
    </svg>
  );
}

export function ThinkingPerson({ className = "" }: Props) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 160"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="52" cy="54" r="14" />
      <path d="M 28 150 C 30 116, 44 104, 54 104 C 70 104, 84 120, 88 152" />
      {/* chin on hand */}
      <path d="M 60 86 Q 64 90 66 98" />
      <path d="M 66 98 Q 54 104 46 96" opacity="0.7" />
      {/* thought cloud */}
      <motion.path
        d="M 78 36 C 88 20, 114 26, 106 46 C 102 56, 86 56, 82 48 L 72 52 L 74 40 Z"
        strokeDasharray="6 10"
        initial={{ opacity: 0.16 }}
        animate={{ opacity: [0.14, 0.3, 0.14] }}
        transition={{ duration: 4.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <path d="M 90 36 Q 92 32 96 34 Q 100 36 96 40 Q 92 42 90 40" opacity="0.6" />
      {/* tiny stars */}
      <motion.path
        d="M 96 10 L 98 16 L 104 16 L 99 20 L 101 26 L 96 22 L 91 26 L 93 20 L 88 16 L 94 16 Z"
        opacity="0.22"
        initial={{ opacity: 0.12 }}
        animate={{ opacity: [0.1, 0.28, 0.1] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
      />
    </svg>
  );
}

export function CelebrationFigure({ className = "" }: Props) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 140"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="50" cy="34" r="12" />
      <path d="M 26 140 C 28 106, 42 92, 50 92 C 62 92, 72 108, 74 140" />
      {/* arms up */}
      <path d="M 42 96 Q 26 70 18 48" />
      <path d="M 58 96 Q 74 70 82 48" />
      {/* burst */}
      <motion.path
        d="M 12 24 L 24 18 M 12 36 L 26 36 M 14 48 L 26 58 M 88 24 L 76 18 M 88 36 L 74 36 M 86 48 L 74 58"
        strokeDasharray="2 6"
        initial={{ opacity: 0.16 }}
        animate={{ opacity: [0.12, 0.36, 0.12] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />
    </svg>
  );
}


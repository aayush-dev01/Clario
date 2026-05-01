/* Purpose: Storytelling doodles for the landing parallax. */
"use client";

import React from "react";
import { MotionValue, motion, useReducedMotion, useTransform } from "framer-motion";

type StoryDoodleProps = {
  className?: string;
};

type GuidedThreadProps = {
  className?: string;
  /** 0..1 */
  progress: MotionValue<number> | number;
};

export function ThreadPath({ className = "" }: StoryDoodleProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 600 140"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    >
      <motion.path
        d="M 10 70 C 70 20, 140 120, 210 70 S 350 20, 420 70 S 520 120, 590 60"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      />
      <motion.circle
        cx="585"
        cy="60"
        r="6"
        fill="currentColor"
        initial={{ scale: 0.7, opacity: 0.6 }}
        animate={{ scale: [0.8, 1.05, 0.8], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />
    </svg>
  );
}

export function GuidedThread({ className = "", progress = 0 }: GuidedThreadProps) {
  const reduce = useReducedMotion();
  const p: MotionValue<number> =
    typeof progress === "number"
      ? (progress as unknown as MotionValue<number>)
      : progress;

  const safeP = useTransform(p, (v) => Math.max(0, Math.min(1, v)));
  const cx = useTransform(safeP, [0, 1], [40, 860]);
  const cy = useTransform(safeP, [0, 1], [60, 120]);

  return (
    <svg
      className={className}
      viewBox="0 0 900 260"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* faint base path */}
      <path
        d="M 40 60 C 180 10, 260 120, 360 90 S 520 30, 600 80 S 730 160, 860 120"
        opacity="0.18"
      />

      {/* animated draw path (controlled by progress) */}
      <motion.path
        d="M 40 60 C 180 10, 260 120, 360 90 S 520 30, 600 80 S 730 160, 860 120"
        style={{ pathLength: reduce ? 1 : safeP }}
      />

      {/* "cursor" dot (breathing) */}
      <motion.circle
        style={{ cx, cy }}
        r="7"
        fill="currentColor"
        stroke="none"
        initial={{ scale: 0.9, opacity: 0.7 }}
        animate={{ scale: [0.9, 1.08, 0.9], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      />
    </svg>
  );
}

export function PaperPlane({ className = "" }: StoryDoodleProps) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ rotate: -6, y: 0 }}
      animate={{ rotate: [-6, 2, -6], y: [0, -4, 0] }}
      transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
    >
      <path d="M 12 58 L 108 18 L 72 104 L 56 70 L 12 58 Z" />
      <path d="M 56 70 L 108 18" strokeDasharray="5 6" />
    </motion.svg>
  );
}

export function StudioDoor({ className = "" }: StoryDoodleProps) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ opacity: 0.9 }}
      animate={{ opacity: [0.85, 1, 0.85] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
    >
      <path d="M 30 18 L 90 18 L 90 110 L 30 110 Z" />
      <path d="M 42 30 L 78 30 L 78 98 L 42 98 Z" strokeDasharray="6 6" />
      <circle cx="82" cy="64" r="3" fill="currentColor" stroke="none" />
      <path d="M 22 110 Q 60 100 98 110" />
    </motion.svg>
  );
}

export function BookStack({ className = "" }: StoryDoodleProps) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ rotate: -1, y: 0 }}
      animate={{ rotate: [-1.5, 1.5, -1.5], y: [0, -2, 0] }}
      transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
    >
      <path d="M 22 78 Q 60 66 98 78" />
      <path d="M 20 52 Q 60 40 100 52" />
      <path d="M 24 28 Q 60 18 96 28" />

      <path d="M 22 78 L 22 92 Q 60 104 98 92 L 98 78" />
      <path d="M 20 52 L 20 66 Q 60 78 100 66 L 100 52" />
      <path d="M 24 28 L 24 42 Q 60 54 96 42 L 96 28" />

      <motion.path
        d="M 60 18 L 60 104"
        strokeDasharray="6 8"
        initial={{ opacity: 0.25 }}
        animate={{ opacity: [0.15, 0.35, 0.15] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.svg>
  );
}

export function PeopleCluster({ className = "" }: StoryDoodleProps) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 140 120"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ y: 0 }}
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* center */}
      <circle cx="70" cy="34" r="12" />
      <path d="M 46 102 C 46 78, 94 78, 94 102" />
      {/* left */}
      <circle cx="36" cy="44" r="10" opacity="0.8" />
      <path d="M 18 102 C 18 82, 54 82, 54 102" opacity="0.8" />
      {/* right */}
      <circle cx="104" cy="44" r="10" opacity="0.8" />
      <path d="M 86 102 C 86 82, 122 82, 122 102" opacity="0.8" />
      {/* tiny sparks */}
      <motion.path
        d="M 120 18 L 132 12 M 126 26 L 138 26 M 118 32 L 130 40"
        strokeDasharray="2 6"
        initial={{ opacity: 0.2 }}
        animate={{ opacity: [0.15, 0.4, 0.15] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.svg>
  );
}

export function Notebook({ className = "" }: StoryDoodleProps) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ rotate: 1 }}
      animate={{ rotate: [1, -1.2, 1] }}
      transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
    >
      <path d="M 30 18 L 90 18 L 90 104 L 30 104 Z" />
      <path d="M 42 30 L 78 30" />
      <path d="M 42 44 L 78 44" />
      <path d="M 42 58 L 70 58" />
      <path d="M 30 30 L 22 34 L 22 98 L 30 104" opacity="0.6" />
      <motion.path
        d="M 52 76 Q 60 68 70 76 Q 78 84 88 78"
        strokeDasharray="6 8"
        initial={{ pathLength: 0.4, opacity: 0.35 }}
        animate={{ pathLength: [0.3, 1, 0.3], opacity: [0.2, 0.45, 0.2] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.svg>
  );
}

export function TutorPortrait({ className = "" }: StoryDoodleProps) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 140 140"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ rotate: -0.6, y: 0 }}
      animate={{ rotate: [-0.8, 0.8, -0.8], y: [0, -2, 0] }}
      transition={{ duration: 4.4, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* frame */}
      <path d="M 22 26 C 42 18, 98 18, 118 26 C 124 46, 124 94, 118 114 C 98 122, 42 122, 22 114 C 16 94, 16 46, 22 26" opacity="0.35" />
      {/* head */}
      <circle cx="70" cy="56" r="18" />
      {/* hair */}
      <path d="M 52 54 Q 54 30 70 32 Q 88 34 90 56" strokeWidth="3" />
      <path d="M 55 46 Q 70 38 85 46" strokeDasharray="6 7" opacity="0.8" />
      {/* glasses */}
      <rect x="52" y="52" width="14" height="10" rx="2" />
      <rect x="74" y="52" width="14" height="10" rx="2" />
      <path d="M 66 57 L 74 57" />
      {/* smile */}
      <path d="M 62 68 Q 70 74 78 68" />
      {/* body */}
      <path d="M 40 120 C 42 95, 58 84, 70 84 C 82 84, 98 95, 100 120" />
      {/* pointer / pen */}
      <motion.path
        d="M 98 86 L 120 78"
        strokeDasharray="5 8"
        initial={{ opacity: 0.25 }}
        animate={{ opacity: [0.18, 0.42, 0.18] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* tiny spark */}
      <motion.path
        d="M 118 56 L 130 50 M 124 62 L 136 62 M 118 68 L 130 76"
        strokeDasharray="2 6"
        initial={{ opacity: 0.15 }}
        animate={{ opacity: [0.12, 0.35, 0.12] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.svg>
  );
}

export function StudentPortrait({ className = "" }: StoryDoodleProps) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 140 140"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ rotate: 0.6, y: 0 }}
      animate={{ rotate: [0.8, -0.8, 0.8], y: [0, -2, 0] }}
      transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* frame */}
      <path d="M 24 28 C 44 18, 96 18, 116 28 C 124 46, 124 94, 116 112 C 96 122, 44 122, 24 112 C 16 94, 16 46, 24 28" opacity="0.35" />
      {/* head */}
      <circle cx="70" cy="56" r="17" />
      {/* hair (curly-ish) */}
      <path d="M 52 52 C 50 34, 64 30, 70 30 C 82 30, 94 40, 90 58" strokeWidth="3" />
      <path d="M 54 44 C 58 38, 62 40, 66 36 C 70 32, 74 36, 78 34 C 82 32, 88 38, 86 46" strokeDasharray="4 7" opacity="0.85" />
      {/* eyes */}
      <circle cx="63" cy="58" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="77" cy="58" r="1.8" fill="currentColor" stroke="none" />
      {/* mouth */}
      <path d="M 64 68 Q 70 71 76 68" />
      {/* body */}
      <path d="M 42 120 C 44 98, 58 86, 70 86 C 82 86, 96 98, 98 120" />
      {/* tiny note bubble */}
      <motion.path
        d="M 98 44 C 108 34, 126 38, 120 54 C 116 64, 104 62, 100 56 L 92 60 L 94 50 Z"
        opacity="0.8"
        initial={{ opacity: 0.18 }}
        animate={{ opacity: [0.14, 0.32, 0.14] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.svg>
  );
}

export function LiveCallScene({ className = "" }: StoryDoodleProps) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 220 140"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ y: 0 }}
      animate={{ y: [0, -2, 0] }}
      transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* laptop */}
      <path d="M 40 98 L 180 98" />
      <path d="M 60 30 L 160 30 L 170 92 L 50 92 Z" />
      <path d="M 70 40 L 150 40 L 158 84 L 62 84 Z" opacity="0.5" />

      {/* tutor window */}
      <circle cx="98" cy="58" r="10" />
      <path d="M 84 84 C 86 72, 110 72, 112 84" />

      {/* student window */}
      <circle cx="132" cy="60" r="9" opacity="0.9" />
      <path d="M 120 84 C 122 74, 142 74, 144 84" opacity="0.9" />

      {/* call spark */}
      <motion.path
        d="M 166 44 L 176 38 M 170 52 L 184 52 M 166 60 L 176 68"
        strokeDasharray="2 6"
        initial={{ opacity: 0.15 }}
        animate={{ opacity: [0.12, 0.35, 0.12] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.svg>
  );
}


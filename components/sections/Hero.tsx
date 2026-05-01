"use client";

/**
 * Hero.tsx
 * The primary hero section that stops the user mid-scroll. It leverages fluid asymmetric
 * typography, HandText to break the grid, and a hand-drawn SVG illustration with
 * staggered Framer Motion entrance animations.
 */
import React from "react";
import { motion } from "framer-motion";
import { SketchButton } from "../ui/SketchButton";
import { HandText } from "../ui/HandText";
import { Doodle } from "../ui/Doodle";
import { WallpaperBackground } from "@/components/landing/WallpaperBackground";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

const illustrationVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: "easeOut" as const, delay: 0.4 },
  },
};

export const Hero = () => {
  const learnerSignUpUrl = "/sign-up?role=LEARNER";
  const teacherSignUpUrl = "/sign-up?role=TEACHER";

  return (
    <section className="relative w-full min-h-screen bg-warm-white pt-[120px] pb-[100px] px-6 md:px-12 flex items-center justify-center overflow-hidden">
      <WallpaperBackground className="z-[0]" />
      <div className="absolute inset-0 z-[1]" style={{ background: "linear-gradient(to bottom, rgba(249,248,246,0.88), rgba(249,248,246,0.92))" }} />
      <div className="relative z-[2] max-w-7xl w-full mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
        {/* Left Content Area */}
        <motion.div
          className="flex-1 w-full space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1
            className="text-5xl md:text-7xl lg:text-[5.5rem] font-bold text-ink leading-[1.1] tracking-tight"
            variants={itemVariants}
          >
            Learn from
            <br />
            <span className="relative inline-block mt-2">
              <HandText rotate={-3}>real people</HandText>
              <div className="absolute -bottom-3 left-0 w-[110%] h-8 -ml-2 text-ink">
                {/* Relying on Doodle's internal Framer Motion entrance */}
                <Doodle type="squiggle-underline" className="w-full h-full" />
              </div>
            </span>
            <br />
            in real time.
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl text-ink-muted max-w-xl leading-relaxed"
            variants={itemVariants}
          >
            A calm, premium live learning platform. Connect directly with people
            who have the skills you want.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row flex-wrap gap-4 pt-4"
            variants={itemVariants}
          >
            <SketchButton variant="primary" href={learnerSignUpUrl}>Start learning</SketchButton>
            <SketchButton variant="ghost" href={teacherSignUpUrl}>Become a teacher</SketchButton>
          </motion.div>
        </motion.div>

        {/* Right Illustration Area */}
        <motion.div
          className="flex-1 w-full flex justify-center md:justify-end shrink-0"
          variants={illustrationVariants}
          initial="hidden"
          animate="visible"
        >
          <svg
            className="w-full max-w-[450px] aspect-square text-ink overflow-visible"
            viewBox="0 0 400 400"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Ground / Desk */}
            <path d="M 40 370 Q 200 365 360 370" strokeWidth="4" />
            <path d="M 60 370 L 55 400 M 340 370 L 345 400" strokeWidth="4" />

            {/* Soft, rounded Torso */}
            <path
              d="M 120 370 C 110 240, 160 210, 200 210 C 240 210, 290 240, 280 370"
              strokeWidth="5"
            />

            {/* Gesturing Hand / Arm */}
            <path
              d="M 275 300 Q 330 290, 310 360"
              strokeWidth="4"
              strokeDasharray="8 8"
              className="text-ink text-opacity-60"
            />

            {/* Gentle, expressive hand */}
            <path d="M 320 280 C 330 270, 340 290, 330 300" strokeWidth="3" />
            <path d="M 330 285 C 340 280, 350 300, 335 305" strokeWidth="3" />

            {/* Head */}
            <circle cx="200" cy="140" r="45" strokeWidth="6" fill="#F9F8F6" />

            {/* Minimal Face */}
            <path d="M 185 140 Q 190 135 195 140" strokeWidth="4" />
            <path d="M 215 140 Q 210 135 205 140" strokeWidth="4" />
            {/* Little smile */}
            <path d="M 195 155 Q 200 160 205 155" strokeWidth="4" />

            {/* Hand-drawn messy hair */}
            <path
              d="M 160 120 C 140 80, 180 70, 200 70 C 230 70, 260 90, 240 130 C 235 140, 245 140, 248 135"
              strokeWidth="5"
            />

            {/* Thought / Conversation Bubble */}
            <path
              d="M 230 80 C 270 20, 370 30, 350 110 C 340 140, 300 150, 270 120 L 245 135 L 250 105 Z"
              strokeWidth="4"
              fill="#F9F8F6"
            />

            {/* Star inside the bubble mapping to learning/idea */}
            <path
              d="M 295 70 L 305 90 L 325 90 L 310 105 L 315 125 L 295 110 L 275 125 L 280 105 L 265 90 L 285 90 Z"
              strokeWidth="3"
              strokeLinejoin="miter"
            />

            {/* Floating expressive accents in space */}
            <circle cx="90" cy="90" r="4" fill="currentColor" />
            <path d="M 70 120 Q 50 140 70 160" strokeWidth="3" />
            <path d="M 80 140 L 50 140" strokeWidth="3" />
            <path d="M 100 280 L 80 270" strokeWidth="3" />
          </svg>
        </motion.div>
      </div>
    </section>
  );
};

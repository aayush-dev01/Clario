"use client";

/**
 * FinalCTA.tsx
 * The closing section of the landing page. Features a clean layout with
 * loose organic doodles pointing towards the final primary and ghost buttons.
 */
import React from "react";
import { motion } from "framer-motion";
import { HandText } from "../ui/HandText";
import { SketchButton } from "../ui/SketchButton";
import { Doodle } from "../ui/Doodle";
import { CelebrationFigure } from "@/components/landing/CinematicDoodles";

export const FinalCTA = () => {
  const learnerSignUpUrl = "/sign-up?role=LEARNER";
  const teacherSignUpUrl = "/sign-up?role=TEACHER";

  return (
    <section className="w-full bg-warm-white py-[140px] px-6 md:px-12 flex justify-center overflow-hidden relative">
      <motion.div
        className="max-w-2xl w-full flex flex-col items-center text-center relative"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <motion.div
          className="absolute -top-24 left-1/2 -translate-x-1/2 text-ink/15 pointer-events-none"
          initial={{ y: -30, opacity: 0, rotate: -8 }}
          whileInView={{ y: 0, opacity: 1, rotate: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ type: "spring", stiffness: 220, damping: 18 }}
        >
          <CelebrationFigure className="w-[110px] h-[150px]" />
        </motion.div>

        <motion.h2
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-ink mb-6"
          initial={{ y: -30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ type: "spring", stiffness: 240, damping: 18 }}
        >
          Ready to <HandText rotate={-4}>start?</HandText>
        </motion.h2>

        <p className="text-[17px] md:text-lg text-ink-muted max-w-md mx-auto mb-12 leading-relaxed">
          Join thousands of learners making real progress every day through live
          human connection.
        </p>

        <div className="relative flex flex-col sm:flex-row items-center gap-4 z-10">
          <SketchButton variant="primary" href={learnerSignUpUrl}>Start learning</SketchButton>
          <SketchButton variant="ghost" href={teacherSignUpUrl}>Become a teacher</SketchButton>

          {/* Decorative Doodles pointing at CTA */}
          <div className="absolute -top-12 -left-12 w-14 h-14 text-ink pointer-events-none -rotate-[25deg] opacity-70">
            <Doodle type="arrow-curved" className="w-full h-full" />
          </div>

          <div className="absolute -bottom-8 -right-8 w-12 h-12 text-ink pointer-events-none rotate-[10deg] opacity-70">
            <Doodle type="stars-cluster" className="w-full h-full" />
          </div>

          <div className="hidden sm:block absolute -top-4 left-1/2 -translate-x-1/2 w-24 h-4 text-ink pointer-events-none opacity-40">
            <Doodle type="squiggle-underline" className="w-full h-full" />
          </div>

          <div className="absolute -bottom-10 left-8 w-12 h-12 text-ink pointer-events-none opacity-40 rotate-[10deg] hidden sm:block">
            <Doodle type="dashed-path" className="w-full h-full" />
          </div>
        </div>
      </motion.div>
    </section>
  );
};

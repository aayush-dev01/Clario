/* Purpose: Award-style parallax, story-led landing page. */
"use client";

import React, { useMemo, useRef } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import Link from "next/link";
import { SketchButton } from "@/components/ui/SketchButton";
import { Doodle } from "@/components/ui/Doodle";
import { HandText } from "@/components/ui/HandText";
import { FeaturedTeachers } from "@/components/sections/FeaturedTeachers";
import { WhyClario } from "@/components/sections/WhyClario";
import { Testimonial } from "@/components/sections/Testimonial";
import { FinalCTA } from "@/components/sections/FinalCTA";
import {
  BookStack,
  GuidedThread,
  LiveCallScene,
  Notebook,
  PaperPlane,
  PeopleCluster,
  StudioDoor,
  StudentPortrait,
  ThreadPath,
  TutorPortrait,
} from "@/components/landing/StoryDoodles";

export function ParallaxLanding() {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const signatureRef = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: rootRef,
    offset: ["start start", "end end"],
  });

  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 20, mass: 0.5 });

  const { scrollYProgress: sigProgressRaw } = useScroll({
    target: signatureRef,
    offset: ["start end", "end start"],
  });
  const sigProgress = useSpring(sigProgressRaw, { stiffness: 110, damping: 22, mass: 0.45 });

  // Core parallax layers (hero → story → trust).
  const heroY = useTransform(progress, [0, 0.22], [0, reduce ? 0 : -120]);
  const heroFade = useTransform(progress, [0, 0.14, 0.22], [1, 1, 0]);

  const threadY = useTransform(progress, [0.08, 0.45], [reduce ? 0 : 60, reduce ? 0 : -80]);
  const threadOpacity = useTransform(progress, [0.06, 0.18, 0.55], [0, 1, 0]);
  const threadBlur = useTransform(progress, [0, 0.35, 1], ["blur(0px)", "blur(0.6px)", "blur(1.4px)"]);

  const planeY = useTransform(progress, [0.18, 0.55], [reduce ? 0 : 80, reduce ? 0 : -120]);
  const planeX = useTransform(progress, [0.18, 0.55], [reduce ? 0 : -30, reduce ? 0 : 60]);
  const planeOpacity = useTransform(progress, [0.12, 0.22, 0.65], [0, 1, 0]);
  const planeBlur = useTransform(progress, [0, 0.5, 1], ["blur(0.4px)", "blur(0px)", "blur(1.6px)"]);

  const doorY = useTransform(progress, [0.32, 0.75], [reduce ? 0 : 120, reduce ? 0 : -120]);
  const doorOpacity = useTransform(progress, [0.28, 0.38, 0.86], [0, 1, 0]);
  const doorBlur = useTransform(progress, [0, 0.45, 1], ["blur(0.8px)", "blur(0.2px)", "blur(2px)"]);

  const vignetteOpacity = useTransform(progress, [0, 0.2, 0.75, 1], [0.15, 0.22, 0.12, 0.06]);
  const sigFogOpacity = useTransform(sigProgress, [0, 0.18, 0.85, 1], [0, 0.65, 0.65, 0]);
  const sigVignetteOpacity = useTransform(sigProgress, [0, 0.25, 0.75, 1], [0.08, 0.16, 0.14, 0.06]);
  const sigCamX = useTransform(sigProgress, [0, 1], [0, reduce ? 0 : 14]);
  const sigCamY = useTransform(sigProgress, [0, 1], [0, reduce ? 0 : -10]);

  const story = useMemo(
    () => [
      {
        k: "arrive",
        eyebrow: "The quiet beginning",
        title: <>You arrive with a question.</>,
        body: (
          <>
            Not a playlist. Not a feed. A single honest question you’re ready to solve—today.
          </>
        ),
      },
      {
        k: "choose",
        eyebrow: "Choose a human",
        title: (
          <>
            You choose <HandText rotate={-2}>a real person</HandText>.
          </>
        ),
        body: (
          <>
            Someone who’s done the work. Someone whose style fits you. No algorithmic haze—just clarity.
          </>
        ),
      },
      {
        k: "session",
        eyebrow: "A live studio",
        title: <>You step into a calm session room.</>,
        body: (
          <>
            A focused space where you can ask, try, get unstuck, and leave with next steps that actually ship.
          </>
        ),
      },
      {
        k: "after",
        eyebrow: "A trace remains",
        title: <>You leave with a trail.</>,
        body: (
          <>
            Notes. Action items. Momentum. The conversation becomes progress you can hold.
          </>
        ),
      },
    ],
    []
  );

  return (
    <div ref={rootRef} className="w-full bg-warm-white text-ink overflow-hidden">
      {/* Parallax Art Layers (behind content) */}
      <div className="pointer-events-none fixed inset-0 z-0">
        {/* Soft vignette */}
        <motion.div
          className="absolute inset-0"
          style={{
            opacity: vignetteOpacity,
            background:
              "radial-gradient(1200px 700px at 60% 40%, rgba(107,92,231,0.10), transparent 55%), radial-gradient(900px 600px at 20% 70%, rgba(0,0,0,0.06), transparent 58%)",
          }}
        />

        {/* Thread line (the story spine) */}
        <motion.div
          className="absolute left-1/2 top-[12vh] w-[1200px] max-w-[120vw] -translate-x-1/2 text-ink/[0.14]"
          style={{ y: threadY, opacity: threadOpacity, filter: threadBlur }}
        >
          <ThreadPath className="w-full h-auto" />
        </motion.div>

        {/* Paper plane */}
        <motion.div
          className="absolute left-[10vw] top-[52vh] text-ink/[0.18]"
          style={{ x: planeX, y: planeY, opacity: planeOpacity, filter: planeBlur }}
        >
          <PaperPlane className="w-24 h-24 md:w-28 md:h-28" />
        </motion.div>

        {/* Studio door */}
        <motion.div
          className="absolute right-[8vw] top-[78vh] text-ink/[0.14]"
          style={{ y: doorY, opacity: doorOpacity, filter: doorBlur }}
        >
          <StudioDoor className="w-24 h-24 md:w-28 md:h-28" />
        </motion.div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* HERO (parallax) */}
        <section className="relative min-h-[92vh] pt-[120px] pb-[80px] px-6 md:px-12">
          <div className="max-w-7xl mx-auto">
            <motion.div style={{ y: heroY, opacity: heroFade }}>
              <div className="max-w-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-[11px] uppercase tracking-[0.24em] text-ink-muted font-medium">
                    A quiet studio for live learning
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-ink/20" />
                  <span className="text-[11px] uppercase tracking-[0.24em] text-ink-muted font-medium">
                    Real-time mentorship
                  </span>
                </div>

                <h1 className="text-[46px] md:text-[68px] lg:text-[78px] font-bold tracking-tight leading-[1.03]">
                  A story you can{" "}
                  <span className="relative inline-block">
                    finish
                    <span className="absolute left-0 -bottom-3 w-[110%] h-8 -ml-2 text-ink">
                      <Doodle type="squiggle-underline" className="w-full h-full" />
                    </span>
                  </span>
                  .
                </h1>

                <p className="mt-6 text-[17px] md:text-[18px] text-ink-muted leading-relaxed max-w-xl">
                  Clario turns a single question into a live session—then into action items you can ship.
                  Calm, premium, human.
                </p>

                <div className="mt-10 flex flex-col sm:flex-row gap-4 items-start">
                  <Link href="/sign-up">
                    <SketchButton variant="primary" className="!px-6 !py-3 !text-[15px]">
                      Start learning
                    </SketchButton>
                  </Link>
                  <Link href="/sign-up">
                    <SketchButton variant="ghost" className="!px-6 !py-3 !text-[15px]">
                      Become a teacher
                    </SketchButton>
                  </Link>
                </div>

                <div className="mt-12 flex items-center gap-6 text-ink-muted text-[13px]">
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#6B5CE7]/60" />
                    No recorded courses
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#6B5CE7]/60" />
                    No noise
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#6B5CE7]/60" />
                    Just progress
                  </span>
                </div>
              </div>

              {/* Right: hero “story card” */}
              <div className="mt-14 grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
                <div className="lg:col-span-7">
                  <motion.div
                    className="relative rounded-3xl bg-warm-white/70 backdrop-blur-md border border-ink/10 shadow-sm overflow-hidden"
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.35 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                  >
                    <div className="p-7 md:p-10">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-ink-muted font-medium">
                        A micro-scene
                      </p>
                      <h3 className="mt-3 text-[22px] md:text-[26px] font-bold leading-tight">
                        “I’m stuck. Can you watch me do it once?”
                      </h3>
                      <p className="mt-4 text-[14px] md:text-[15px] text-ink-muted leading-relaxed max-w-2xl">
                        The best learning isn’t content. It’s a moment—when a real person helps you see the next move.
                      </p>

                      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                          { t: "Pick a teacher", d: "A person whose style fits you." },
                          { t: "Book a session", d: "A time that respects your life." },
                          { t: "Leave with steps", d: "Notes + action items." },
                        ].map((x, idx) => (
                          <div key={x.t} className="relative p-4 rounded-2xl border border-ink/10 bg-warm-white">
                            <div className="absolute -top-3 -right-3 text-ink/10">
                              <span className="font-hand text-[46px] leading-none">{idx + 1}</span>
                            </div>
                            <p className="text-[13px] font-bold">{x.t}</p>
                            <p className="mt-1 text-[12px] text-ink-muted leading-relaxed">{x.d}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </div>

                <div className="lg:col-span-5">
                  <motion.div
                    className="relative rounded-3xl bg-ink text-warm-white border border-white/10 shadow-md overflow-hidden"
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.35 }}
                    transition={{ duration: 0.7, ease: "easeOut", delay: 0.05 }}
                  >
                    <div className="p-7 md:p-9">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-warm-white/60 font-medium">
                        The feeling
                      </p>
                      <h4 className="mt-3 text-[20px] md:text-[22px] font-bold leading-tight">
                        Premium calm—without the performative hype.
                      </h4>
                      <p className="mt-4 text-[13px] text-warm-white/70 leading-relaxed">
                        Micro-animations guide your eye, never fight it. The parallax is narrative, not noise.
                      </p>
                      <div className="mt-7 flex items-center gap-3 text-warm-white/70">
                        <Doodle type="dashed-path" className="w-20 h-10 opacity-60" />
                        <span className="text-[12px]">
                          Scroll to follow the thread
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Scroll hint */}
            <motion.div
              className="mt-14 flex justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              <motion.div
                className="flex flex-col items-center text-ink/40"
                animate={reduce ? {} : { y: [0, 6, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="text-[11px] uppercase tracking-[0.24em] font-medium">Scroll</span>
                <svg viewBox="0 0 20 20" className="w-4 h-4 mt-2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M 5 8 L 10 13 L 15 8" />
                </svg>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* SIGNATURE STICKY SCENE (guided thread + 3 cards) */}
        <section ref={signatureRef} className="relative px-6 md:px-12 pb-[140px]">
          <div className="max-w-7xl mx-auto">
            <div className="relative h-[220vh]">
              <div className="sticky top-[96px] md:top-[110px]">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                  <div className="lg:col-span-5">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-ink-muted font-medium">
                      Signature scene
                    </p>
                    <h2 className="mt-4 text-[34px] md:text-[46px] font-bold leading-[1.06] tracking-tight">
                      Follow the thread.
                      <br />
                      <span className="text-ink-muted font-medium">
                        Watch it guide your eye.
                      </span>
                    </h2>
                    <p className="mt-6 text-[15px] text-ink-muted leading-relaxed max-w-md">
                      Three quiet steps. Each card is interactive. The parallax is the story—
                      never the distraction.
                    </p>

                    <div className="mt-10 flex flex-col sm:flex-row gap-4 items-start">
                      <Link href="/sign-up">
                        <SketchButton variant="primary" className="!px-6 !py-3 !text-[15px]">
                          Get started
                        </SketchButton>
                      </Link>
                      <Link href="/discover">
                        <SketchButton variant="ghost" className="!px-6 !py-3 !text-[15px]">
                          Browse teachers
                        </SketchButton>
                      </Link>
                    </div>
                  </div>

                  <div className="lg:col-span-7">
                    {/* Thread that literally guides through cards */}
                    <motion.div
                      className="relative rounded-3xl border border-ink/10 bg-warm-white/70 backdrop-blur-md shadow-sm overflow-hidden"
                      initial={{ opacity: 0, y: 18 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.35 }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                    >
                      {/* depth fog: subtle grain + gradient, signature scene only */}
                      <motion.div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          opacity: sigFogOpacity,
                          background:
                            "radial-gradient(900px 420px at 18% 22%, rgba(107,92,231,0.10), transparent 62%), radial-gradient(700px 520px at 80% 70%, rgba(0,0,0,0.06), transparent 62%), repeating-linear-gradient(0deg, rgba(0,0,0,0.012) 0px, rgba(0,0,0,0.012) 1px, rgba(255,255,255,0.012) 2px, rgba(255,255,255,0.012) 3px)",
                          mixBlendMode: "multiply",
                        }}
                      />

                      {/* camera drift vignette (very slow) */}
                      <motion.div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          opacity: sigVignetteOpacity,
                          x: sigCamX,
                          y: sigCamY,
                          background:
                            "radial-gradient(900px 500px at 55% 35%, rgba(107,92,231,0.12), transparent 60%), radial-gradient(700px 420px at 30% 78%, rgba(0,0,0,0.08), transparent 64%)",
                        }}
                      />

                      <div className="p-7 md:p-10">
                        <div className="relative">
                          <motion.div
                            className="absolute -top-6 left-1/2 -translate-x-1/2 w-[900px] max-w-[120%] text-ink/[0.14]"
                            style={{
                              opacity: useTransform(sigProgress, [0, 0.12, 1], [0, 1, 1]),
                              filter: useTransform(sigProgress, [0, 1], ["blur(0px)", "blur(0.6px)"]),
                            }}
                          >
                            <GuidedThread
                              className="w-full h-auto"
                              progress={reduce ? 1 : sigProgress}
                            />
                          </motion.div>

                          {/* extra storytelling doodles (books, people, notes) */}
                          <motion.div
                            className="absolute -left-6 md:-left-10 top-10 text-ink/[0.10]"
                            style={{
                              y: useTransform(sigProgress, [0, 1], [reduce ? 0 : 18, reduce ? 0 : -22]),
                              filter: useTransform(sigProgress, [0, 1], ["blur(0.8px)", "blur(0.2px)"]),
                            }}
                          >
                            <PeopleCluster className="w-28 h-24 md:w-32 md:h-28" />
                          </motion.div>
                          <motion.div
                            className="absolute -right-6 md:-right-10 top-12 text-ink/[0.10]"
                            style={{
                              y: useTransform(sigProgress, [0, 1], [reduce ? 0 : 24, reduce ? 0 : -18]),
                              filter: useTransform(sigProgress, [0, 1], ["blur(1px)", "blur(0.2px)"]),
                            }}
                          >
                            <BookStack className="w-24 h-24 md:w-28 md:h-28" />
                          </motion.div>
                          <motion.div
                            className="absolute right-10 md:right-14 bottom-6 text-ink/[0.08] hidden md:block"
                            style={{
                              y: useTransform(sigProgress, [0, 1], [reduce ? 0 : 18, reduce ? 0 : -10]),
                              filter: useTransform(sigProgress, [0, 1], ["blur(1.4px)", "blur(0.6px)"]),
                            }}
                          >
                            <LiveCallScene className="w-48 h-32" />
                          </motion.div>
                          <motion.div
                            className="absolute left-6 md:left-10 top-24 text-ink/[0.08] hidden md:block"
                            style={{
                              y: useTransform(sigProgress, [0, 1], [reduce ? 0 : 14, reduce ? 0 : -18]),
                              filter: useTransform(sigProgress, [0, 1], ["blur(1.6px)", "blur(0.6px)"]),
                            }}
                          >
                            <TutorPortrait className="w-32 h-32" />
                          </motion.div>
                          <motion.div
                            className="absolute right-4 md:right-8 top-24 text-ink/[0.08] hidden md:block"
                            style={{
                              y: useTransform(sigProgress, [0, 1], [reduce ? 0 : 10, reduce ? 0 : -14]),
                              filter: useTransform(sigProgress, [0, 1], ["blur(1.6px)", "blur(0.6px)"]),
                            }}
                          >
                            <StudentPortrait className="w-32 h-32" />
                          </motion.div>
                          <motion.div
                            className="absolute left-10 bottom-4 text-ink/[0.10] hidden md:block"
                            style={{
                              y: useTransform(sigProgress, [0, 1], [reduce ? 0 : 10, reduce ? 0 : -12]),
                              filter: useTransform(sigProgress, [0, 1], ["blur(1.2px)", "blur(0.4px)"]),
                            }}
                          >
                            <Notebook className="w-24 h-24" />
                          </motion.div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-12">
                            {[
                              {
                                t: "Bring one question",
                                d: "Not a syllabus. A single thing you want to solve.",
                                n: "01",
                              },
                              {
                                t: "Do it live, together",
                                d: "A calm room where you can try, ask, and adjust.",
                                n: "02",
                              },
                              {
                                t: "Leave with next steps",
                                d: "Notes + action items—so the session turns into progress.",
                                n: "03",
                              },
                            ].map((x, i) => (
                              <motion.div
                                key={x.n}
                                className="relative rounded-2xl border border-ink/10 bg-warm-white p-5 overflow-hidden"
                                whileHover={reduce ? {} : { y: -3 }}
                                transition={{ duration: 0.18, ease: "easeOut" }}
                                style={{
                                  boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                                }}
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <p className="text-[11px] uppercase tracking-[0.22em] text-ink-muted font-medium">
                                      {x.n}
                                    </p>
                                    <p className="mt-2 text-[15px] font-bold leading-tight">{x.t}</p>
                                    <p className="mt-2 text-[13px] text-ink-muted leading-relaxed">{x.d}</p>
                                  </div>
                                  <div className="shrink-0 w-10 h-10 text-ink/15">
                                    <Doodle type={i === 0 ? "stars-cluster" : i === 1 ? "arrow-curved" : "circle-scribble"} className="w-full h-full" />
                                  </div>
                                </div>

                                <motion.div
                                  className="absolute inset-0 pointer-events-none"
                                  initial={{ opacity: 0 }}
                                  whileHover={{ opacity: reduce ? 0 : 1 }}
                                  transition={{ duration: 0.2 }}
                                  style={{
                                    background:
                                      "radial-gradient(520px 220px at 20% 20%, rgba(107,92,231,0.11), transparent 60%)",
                                  }}
                                />
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Small calming caption */}
                    <motion.p
                      className="mt-5 text-[12px] text-ink/40"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true, amount: 0.35 }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                    >
                      Designed to feel like a quiet studio—motion that guides, never shouts.
                    </motion.p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STORY (sticky narrative) */}
        <section className="relative px-6 md:px-12 pb-[120px]">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-5">
              <div className="lg:sticky lg:top-[110px]">
                <p className="text-[11px] uppercase tracking-[0.24em] text-ink-muted font-medium">
                  The thread
                </p>
                <h2 className="mt-4 text-[34px] md:text-[44px] font-bold leading-[1.08] tracking-tight">
                  A learning story told in{" "}
                  <span className="relative inline-block">
                    layers
                    <span className="absolute left-0 -bottom-2 w-[110%] h-6 -ml-2 text-ink/80">
                      <Doodle type="squiggle-underline" className="w-full h-full" />
                    </span>
                  </span>
                  .
                </h2>
                <p className="mt-6 text-[15px] text-ink-muted leading-relaxed max-w-md">
                  Parallax isn’t decoration here—it’s how the narrative unfolds. Each scene moves at its own pace, like memory.
                </p>

                <div className="mt-10 flex items-center gap-3 text-ink-muted">
                  <span className="text-[12px] font-medium">Tip:</span>
                  <span className="text-[12px]">Hover cards. Watch the doodles respond.</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="flex flex-col gap-6">
                {story.map((s, idx) => (
                  <motion.article
                    key={s.k}
                    className="relative rounded-3xl border border-ink/10 bg-warm-white/70 backdrop-blur-sm shadow-xs overflow-hidden"
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    whileHover={reduce ? {} : { y: -2 }}
                  >
                    <div className="p-7 md:p-10">
                      <div className="flex items-start justify-between gap-6">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.24em] text-ink-muted font-medium">
                            {s.eyebrow}
                          </p>
                          <h3 className="mt-3 text-[22px] md:text-[28px] font-bold leading-tight">
                            {s.title}
                          </h3>
                          <p className="mt-4 text-[14px] md:text-[15px] text-ink-muted leading-relaxed">
                            {s.body}
                          </p>
                        </div>

                        <div className="hidden sm:flex items-center justify-center shrink-0">
                          <div className="relative w-14 h-14 text-ink/20">
                            <Doodle type="circle-scribble" className="w-full h-full" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="font-hand text-[28px] text-ink/60">
                                {idx + 1}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Subtle purple wash on hover */}
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: reduce ? 0 : 1 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        background:
                          "radial-gradient(700px 220px at 20% 20%, rgba(107,92,231,0.10), transparent 60%)",
                      }}
                    />
                  </motion.article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* TRUST / PROOF — reuse existing sections (already polished) */}
        <FeaturedTeachers />
        <WhyClario />
        <Testimonial />
        <FinalCTA />
      </div>

      {/* Accessibility: ensure focus ring is visible */}
      <style jsx global>{`
        :focus-visible {
          outline: 2px solid rgba(107, 92, 231, 0.55);
          outline-offset: 3px;
        }
      `}</style>
    </div>
  );
}


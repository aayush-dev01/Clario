/* Purpose: Cinematic GSAP ScrollTrigger landing (depth film model). */
"use client";

import React, { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { SketchButton } from "@/components/ui/SketchButton";
import { Doodle } from "@/components/ui/Doodle";
import { HandText } from "@/components/ui/HandText";
import { FeaturedTeachers } from "@/components/sections/FeaturedTeachers";
import { WhyClario } from "@/components/sections/WhyClario";
import { Testimonial } from "@/components/sections/Testimonial";
import { FinalCTA } from "@/components/sections/FinalCTA";
import {
  CelebrationFigure,
  PairSession,
  StudentAha,
  TeacherExplaining,
  ThinkingPerson,
} from "@/components/landing/CinematicDoodles";
import { IPhoneDepth } from "@/components/landing/IPhoneDepth";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Drift, MicroBook, MicroBubble, MicroClock, MicroPencil } from "@/components/landing/MicroDoodles";
import { useMouseParallaxVars } from "@/components/landing/useMouseParallax";

type DepthLayer = 0 | 1 | 2 | 3 | 4;

function qAll(root: Element | Document, sel: string) {
  return Array.from(root.querySelectorAll(sel));
}

function parallaxSection(section: HTMLElement) {
  const layers = {
    0: qAll(section, "[data-depth='0']"),
    1: qAll(section, "[data-depth='1']"),
    2: qAll(section, "[data-depth='2']"),
    3: qAll(section, "[data-depth='3']"),
    4: qAll(section, "[data-depth='4']"),
  } as Record<DepthLayer, Element[]>;

  const factors: Record<DepthLayer, number> = {
    0: 0.05,
    1: 0.15,
    2: 0.3,
    3: 0.0,
    4: -0.1,
  };

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top bottom",
      end: "bottom top",
      scrub: 1.5,
    },
  });

  const travel = window.innerHeight * 0.55;
  (Object.keys(layers) as unknown as DepthLayer[]).forEach((k) => {
    const els = layers[k];
    if (!els.length) return;
    tl.to(
      els,
      {
        y: () => -travel * factors[k],
        ease: "none",
        overwrite: true,
      },
      0
    );
  });

  return tl;
}

export function CinematicLanding() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const heroRef = useRef<HTMLElement | null>(null);
  const followRef = useRef<HTMLElement | null>(null);
  const threadRef = useRef<HTMLElement | null>(null);

  const headlineWords = useMemo(
    () => ["A", "story", "you", "can", "finish"],
    []
  );

  useEffect(() => {
    if (!rootRef.current) return;
    gsap.registerPlugin(ScrollTrigger);

    // Perf: hide heavy decorative doodles when far offscreen.
    const ioTargets = Array.from(
      rootRef.current.querySelectorAll<HTMLElement>("[data-io-hide='true']")
    );
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const el = e.target as HTMLElement;
          el.style.visibility = e.isIntersecting ? "visible" : "hidden";
        }
      },
      { root: null, rootMargin: "400px 0px", threshold: 0.01 }
    );
    ioTargets.forEach((t) => io.observe(t));

    const mm = gsap.matchMedia();
    const ctx = gsap.context(() => {
      mm.add(
        {
          reduce: "(prefers-reduced-motion: reduce)",
          ok: "(prefers-reduced-motion: no-preference)",
        },
        (m) => {
          // Fog layers (fixed) — animate on hero entry/exit.
          const fog1 = document.querySelector("[data-fog='1']");
          const fog3 = document.querySelector("[data-fog='3']");
          const fog2 = document.querySelector("[data-fog='2']");

          if (!m.conditions?.reduce) {
            // Parallax per section
            qAll(rootRef.current!, "[data-parallax-section='true']").forEach((sec) =>
              parallaxSection(sec as HTMLElement)
            );
          }

          if (heroRef.current && fog1 && fog3) {
            gsap.set([fog1, fog3], { opacity: 0 });
            gsap.to(fog1, {
              opacity: 0.6,
              scrollTrigger: {
                trigger: heroRef.current,
                start: "top top",
                end: "bottom top",
                scrub: 1.2,
              },
            });
            gsap.to(fog3, {
              opacity: 1,
              scrollTrigger: {
                trigger: heroRef.current,
                start: "top top",
                end: "bottom top",
                scrub: 1.2,
              },
            });
          }

          // Silent “score” layer: rhythmic fog swell on Scene 2 pin beats.
          if (followRef.current && fog1 && fog2 && !m.conditions?.reduce) {
            const scoreTl = gsap.timeline({
              scrollTrigger: {
                trigger: followRef.current,
                start: "top top",
                end: "+=3000",
                scrub: 1.5,
              },
            });
            scoreTl
              .to(fog1, { opacity: 0.52, duration: 0.2, ease: "none" }, 0.05)
              .to(fog1, { opacity: 0.62, duration: 0.2, ease: "none" }, 0.38)
              .to(fog1, { opacity: 0.54, duration: 0.2, ease: "none" }, 0.7);
            scoreTl
              .to(fog2, { opacity: 0.95, duration: 0.2, ease: "none" }, 0.05)
              .to(fog2, { opacity: 0.88, duration: 0.2, ease: "none" }, 0.38)
              .to(fog2, { opacity: 0.92, duration: 0.2, ease: "none" }, 0.7);
          }

          // HERO: word-by-word entrance (only on load)
          const wordEls = qAll(rootRef.current!, "[data-hero-word]");
          gsap.set(wordEls, { y: 80, opacity: 0 });
          gsap.to(wordEls, {
            y: 0,
            opacity: 1,
            duration: 0.9,
            ease: "power3.out",
            stagger: 0.12,
            delay: 0.08,
          });

          // Hero thread draw
          const thread = rootRef.current!.querySelector("[data-hero-thread]");
          if (thread) {
            const path = thread.querySelector("path");
            if (path) {
              const len = (path as SVGPathElement).getTotalLength();
              gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
              gsap.to(path, { strokeDashoffset: 0, duration: 1.3, ease: "power2.out" });
            }
          }

          // FOLLOW THE THREAD: pin + card reveals + connector draw
          if (followRef.current && !m.conditions?.reduce) {
            const cards = qAll(followRef.current, "[data-follow-card]");
            const connector = followRef.current.querySelector("[data-follow-connector] path");

            gsap.set(cards, { opacity: 0 });
            gsap.set(cards[0], { x: -80, rotate: -8 });
            gsap.set(cards[1], { x: 80, rotate: 8 });
            gsap.set(cards[2], { y: -60 });

            const pinTl = gsap.timeline({
              scrollTrigger: {
                trigger: followRef.current,
                start: "top top",
                end: "+=3000",
                scrub: 1.5,
                pin: true,
              },
            });

            pinTl
              .to(cards[0], { opacity: 1, x: 0, rotate: -2, duration: 1 }, 0.05)
              .to(cards[1], { opacity: 1, x: 0, rotate: 2, duration: 1 }, 0.38)
              .to(cards[2], { opacity: 1, y: 0, duration: 1 }, 0.7);

            if (connector) {
              const len = (connector as SVGPathElement).getTotalLength();
              gsap.set(connector, { strokeDasharray: len, strokeDashoffset: len, opacity: 0.35 });
              pinTl.to(connector, { strokeDashoffset: 0, duration: 1.4, ease: "none" }, 0.18);
            }
          }

          // SCENE 3: THREAD / LAYERS — subtle numbered pulse and entrance
          if (threadRef.current && !m.conditions?.reduce) {
            const articles = qAll(threadRef.current, "[data-article]");
            const nums = qAll(threadRef.current, "[data-article-num]");
            gsap.set(articles, { opacity: 0, y: 24 });
            gsap.to(articles, {
              opacity: 1,
              y: 0,
              stagger: 0.12,
              duration: 1.1,
              ease: "power3.out",
              scrollTrigger: {
                trigger: threadRef.current,
                start: "top 70%",
                end: "top 35%",
                scrub: 1.2,
              },
            });
            gsap.fromTo(
              nums,
              { scale: 1 },
              {
                scale: 1.18,
                yoyo: true,
                repeat: 1,
                duration: 0.35,
                ease: "power2.out",
                stagger: 0.08,
                scrollTrigger: {
                  trigger: threadRef.current,
                  start: "top 60%",
                },
              }
            );
          }

          return () => {};
        }
      );
    }, rootRef);

    return () => {
      io.disconnect();
      mm.kill();
      ctx.revert();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  useMouseParallaxVars(rootRef);

  return (
    <div
      ref={rootRef}
      className="w-full bg-warm-white text-ink overflow-x-clip"
      style={
        {
          ["--px" as const]: 0,
          ["--py" as const]: 0,
        } as React.CSSProperties
      }
    >
      {/* PAPER GRAIN (very faint, cinematic) */}
      <div
        className="pointer-events-none fixed inset-0 z-[0] opacity-[0.20]"
        style={{
          background:
            "radial-gradient(1200px 800px at 20% 10%, rgba(0,0,0,0.035), transparent 60%), radial-gradient(900px 700px at 80% 70%, rgba(0,0,0,0.025), transparent 62%), repeating-linear-gradient(0deg, rgba(0,0,0,0.010) 0px, rgba(0,0,0,0.010) 1px, rgba(255,255,255,0.010) 2px, rgba(255,255,255,0.010) 3px)",
          animation: "grain-shift 10s ease-in-out infinite",
          willChange: "transform, opacity",
          mixBlendMode: "multiply",
        }}
      />

      {/* FOG LAYERS (fixed) */}
      <div className="pointer-events-none fixed inset-0 z-[1]">
        <div
          data-fog="1"
          className="absolute inset-0 opacity-0"
          style={{
            background:
              "radial-gradient(ellipse 120% 60% at 30% 20%, rgba(248,246,241,0.85) 0%, transparent 65%)",
            filter: "blur(40px)",
            willChange: "transform, opacity",
          }}
        />
        <div
          data-fog="3"
          className="absolute inset-0 opacity-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 70% 60%, rgba(107,92,231,0.06) 0%, transparent 70%)",
            filter: "blur(60px)",
            willChange: "transform, opacity",
          }}
        />
        <div
          data-fog="2"
          className="absolute bottom-0 left-0 right-0 h-[35vh] opacity-90"
          style={{
            background:
              "linear-gradient(to top, rgba(248,246,241,0.90) 0%, rgba(248,246,241,0.40) 40%, transparent 100%)",
            filter: "blur(20px)",
            animation: "fog-drift-x 8s ease-in-out infinite",
            willChange: "transform, opacity",
          }}
        />
      </div>

      {/* HERO — THE PULL */}
      <section
        ref={heroRef}
        data-parallax-section="true"
        className="relative min-h-[100vh] px-6 md:px-12 pt-[140px] pb-[140px] z-[3]"
      >
        {/* layer 0 bg */}
        <div data-depth="0" className="absolute inset-0 -z-10">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(1200px 700px at 60% 40%, rgba(107,92,231,0.10), transparent 55%), radial-gradient(900px 600px at 20% 70%, rgba(0,0,0,0.05), transparent 58%)",
            }}
          />
        </div>

        {/* layer 1 far doodles */}
        <div data-depth="1" className="absolute right-[-40px] top-[14vh] opacity-[0.12] rotate-[5deg] text-ink hidden md:block">
          <div data-io-hide="true" style={{ willChange: "transform" }}>
            <TeacherExplaining className="w-[180px] h-[220px]" />
          </div>
        </div>

        {/* layer 2 mid micro doodles */}
        <div data-depth="2" className="absolute left-[6vw] top-[62vh] opacity-[0.10] text-ink hidden md:block">
          <div data-io-hide="true" style={{ willChange: "transform" }}>
            <StudentAha className="w-[160px] h-[200px]" />
          </div>
        </div>
        <div data-depth="2" className="absolute right-[14vw] top-[62vh] opacity-[0.08] text-ink hidden lg:block">
          <div data-io-hide="true" style={{ willChange: "transform" }}>
            <ThinkingPerson className="w-[120px] h-[160px]" />
          </div>
        </div>

        {/* layer 4 foreground particles */}
        <div data-depth="4" className="absolute inset-0 pointer-events-none">
          <div className="absolute left-[12vw] top-[28vh] opacity-[0.12] text-ink">
            <Doodle type="stars-cluster" className="w-10 h-10" />
          </div>
          <div className="absolute right-[18vw] top-[34vh] opacity-[0.10] text-ink">
            <Doodle type="arrow-curved" className="w-10 h-10" />
          </div>
          <div className="absolute left-[30vw] bottom-[18vh] opacity-[0.10] text-ink">
            <Doodle type="dashed-path" className="w-16 h-10" />
          </div>
        </div>

        {/* Micro-doodle ecosystem (Layer 2, subtle) */}
        <div data-depth="2" className="absolute inset-0 pointer-events-none text-ink/10 hidden md:block">
          <Drift className="absolute left-[14vw] top-[20vh]" >
            <MicroBook className="w-12 h-10" />
          </Drift>
          <Drift className="absolute left-[26vw] top-[64vh] opacity-80">
            <MicroPencil className="w-10 h-10" />
          </Drift>
          <Drift className="absolute right-[20vw] top-[24vh] opacity-80">
            <MicroBubble className="w-12 h-10" />
          </Drift>
          <Drift className="absolute right-[30vw] top-[70vh] opacity-70">
            <MicroClock className="w-10 h-10" />
          </Drift>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="max-w-3xl lg:col-span-7">
            <p className="text-[11px] uppercase tracking-[0.26em] text-ink-muted font-medium mb-6">
              Live human learning · cinematic calm
            </p>

            <h1 className="text-[52px] md:text-[74px] lg:text-[84px] font-bold leading-[1.02] tracking-tight font-display">
              {headlineWords.map((w, i) => (
                <span key={i} data-hero-word className="inline-block mr-3">
                  {w}
                </span>
              ))}
              <span className="inline-block">.</span>
            </h1>

            <div className="mt-6 text-[17px] md:text-[18px] text-ink-muted leading-relaxed max-w-xl">
              Learn in a session room that feels like a studio. Leave with notes and momentum—not tabs.
            </div>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href="/sign-up">
                <SketchButton variant="primary" className="!px-7 !py-3.5 !text-[15px]">
                  Start learning
                </SketchButton>
              </Link>
              <Link href="/sign-up">
                <SketchButton variant="ghost" className="!px-7 !py-3.5 !text-[15px]">
                  Become a teacher
                </SketchButton>
              </Link>
            </div>

            {/* hero thread draw */}
            <div data-hero-thread className="mt-12 text-ink/30 max-w-[560px]">
              <svg viewBox="0 0 600 90" className="w-full h-auto" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <path d="M 10 46 C 70 10, 140 80, 210 44 S 350 8, 420 48 S 520 84, 590 36" />
              </svg>
            </div>
            </div>

            {/* iPhone 3D depth prop */}
            <div
              data-depth="2"
              className="lg:col-span-5 flex justify-center lg:justify-end"
              style={{
                transform:
                  "translate3d(calc(var(--px) * 6px), calc(var(--py) * 6px), 0)",
                willChange: "transform",
              }}
            >
              <div data-io-hide="true" style={{ willChange: "transform" }}>
                <IPhoneDepth className="opacity-[0.95]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* breath divider */}
      <div className="h-20 md:h-24 relative z-[3]">
        <svg className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-3 text-ink/[0.10]" preserveAspectRatio="none" viewBox="0 0 120 8">
          <path d="M 0 4 Q 30 2 60 4 T 120 4" stroke="currentColor" strokeWidth="1.2" fill="none" />
        </svg>
      </div>

      {/* SCENE 2 — FOLLOW THE THREAD (pinned) */}
      <section
        ref={followRef}
        data-parallax-section="true"
        className="relative px-6 md:px-12 py-[140px] z-[3]"
      >
        {/* bg */}
        <div data-depth="0" className="absolute inset-0 -z-10">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(900px 420px at 18% 22%, rgba(107,92,231,0.08), transparent 62%), radial-gradient(700px 520px at 78% 70%, rgba(0,0,0,0.04), transparent 62%)",
            }}
          />
        </div>

        {/* Pair session doodle */}
        <div data-depth="1" className="absolute left-[-20px] top-[18vh] opacity-[0.10] text-ink hidden lg:block">
          <div data-io-hide="true" style={{ willChange: "transform" }}>
            <div
              style={{
                transform:
                  "translate3d(calc(var(--px) * 4px), calc(var(--py) * 4px), 0)",
                willChange: "transform",
              }}
            >
              <PairSession className="w-[220px] h-[180px]" />
            </div>
          </div>
        </div>

        {/* foreground celebration */}
        <div data-depth="4" className="absolute right-[6vw] top-[12vh] opacity-[0.12] text-ink hidden md:block">
          <CelebrationFigure className="w-[100px] h-[140px]" />
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5">
            <p className="text-[11px] uppercase tracking-[0.26em] text-ink-muted font-medium">
              Scene two
            </p>
            <h2 className="mt-4 text-[36px] md:text-[50px] font-bold leading-[1.06] tracking-tight">
              Follow the <HandText rotate={-2}>thread</HandText>.
            </h2>
            <p className="mt-6 text-[15px] text-ink-muted leading-relaxed max-w-md">
              Three calm steps. Each one arrives on cue—like a short film you control with scroll.
            </p>
          </div>

          <div className="lg:col-span-7">
            <div className="relative rounded-3xl border border-ink/10 bg-warm-white/70 backdrop-blur-md shadow-sm overflow-hidden p-7 md:p-10">
              {/* connector */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none text-ink/20" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path data-follow-connector d="M 18 35 Q 50 15 82 35 Q 50 50 18 68 Q 50 88 82 70" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
                {[
                  { n: "01", t: "Bring one question", d: "A single thing you want to solve." },
                  { n: "02", t: "Do it live, together", d: "Ask, try, adjust in real time." },
                  { n: "03", t: "Leave with next steps", d: "Notes + actions you can ship." },
                ].map((c) => (
                  <div
                    key={c.n}
                    data-follow-card
                    className="relative rounded-2xl border border-ink/10 bg-warm-white p-5 overflow-hidden"
                    style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}
                  >
                    <p className="text-[11px] uppercase tracking-[0.22em] text-ink-muted font-medium">{c.n}</p>
                    <p className="mt-2 text-[15px] font-bold leading-tight">{c.t}</p>
                    <p className="mt-2 text-[13px] text-ink-muted leading-relaxed">{c.d}</p>
                    <div className="absolute -top-3 -right-3 opacity-10 text-ink">
                      <Doodle type="circle-scribble" className="w-14 h-14" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* remainder: reuse existing sections (will be upgraded next iteration) */}
      {/* SCENE 3 — THE THREAD / LAYERS */}
      <section
        ref={threadRef}
        data-parallax-section="true"
        className="relative px-6 md:px-12 py-[140px] z-[3]"
      >
        {/* bg */}
        <div data-depth="0" className="absolute inset-0 -z-10">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(900px 420px at 18% 22%, rgba(107,92,231,0.06), transparent 62%), radial-gradient(700px 520px at 78% 70%, rgba(0,0,0,0.04), transparent 62%)",
            }}
          />
        </div>

        {/* doodles */}
        <div data-depth="1" className="absolute left-[4vw] top-[18vh] opacity-[0.10] text-ink hidden lg:block">
          <div data-io-hide="true" style={{ willChange: "transform" }}>
            <StudentAha className="w-[160px] h-[200px]" />
          </div>
        </div>
        <div data-depth="2" className="absolute right-[6vw] top-[34vh] opacity-[0.12] text-ink hidden lg:block">
          <div data-io-hide="true" style={{ willChange: "transform" }}>
            <div
              style={{
                transform:
                  "translate3d(calc(var(--px) * 3px), calc(var(--py) * 3px), 0)",
                willChange: "transform",
              }}
            >
              <ThinkingPerson className="w-[120px] h-[160px]" />
            </div>
          </div>
        </div>
        <div data-depth="2" className="absolute left-[58vw] bottom-[18vh] opacity-[0.08] text-ink hidden lg:block">
          <div data-io-hide="true" style={{ willChange: "transform" }}>
            <TeacherExplaining className="w-[180px] h-[220px]" />
          </div>
        </div>

        {/* wisps */}
        <div data-depth="4" className="absolute inset-0 pointer-events-none">
          <div
            className="absolute left-[12vw] top-[28vh] w-[320px] h-[200px] opacity-[0.35]"
            style={{
              background: "radial-gradient(ellipse 70% 60% at 40% 40%, rgba(249,248,246,0.85) 0%, transparent 70%)",
              filter: "blur(34px)",
              animation: "fog-drift-x 10s ease-in-out infinite",
            }}
          />
          <div
            className="absolute right-[10vw] top-[56vh] w-[360px] h-[220px] opacity-[0.20]"
            style={{
              background: "radial-gradient(ellipse 60% 50% at 60% 60%, rgba(107,92,231,0.06) 0%, transparent 70%)",
              filter: "blur(44px)",
              animation: "fog-drift-x 12s ease-in-out infinite",
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <p className="text-[11px] uppercase tracking-[0.26em] text-ink-muted font-medium">
              Scene three
            </p>
            <h2 className="mt-4 text-[36px] md:text-[52px] font-bold leading-[1.06] tracking-tight">
              The thread, in <HandText rotate={-2}>layers</HandText>.
            </h2>
            <p className="mt-6 text-[15px] text-ink-muted leading-relaxed max-w-md">
              Each step is a small scene: a person, a question, a calm room—then momentum.
            </p>
          </div>

          <div className="lg:col-span-7">
            <div className="flex flex-col gap-6">
              {[
                { n: "1", e: "Arrive", t: "You arrive with one honest question.", d: "Not a syllabus. A single thing you’re ready to solve—today." },
                { n: "2", e: "Choose", t: "You choose a person, not a playlist.", d: "Browse profiles, feel the fit, and pick a teacher whose style matches you." },
                { n: "3", e: "Do it live", t: "You learn in a calm session room.", d: "Ask, try, get unstuck—without the noise of feeds and tabs." },
                { n: "4", e: "Leave a trace", t: "You leave with notes and action items.", d: "The conversation becomes progress you can hold." },
              ].map((a) => (
                <div key={a.n} data-article className="relative rounded-3xl border border-ink/10 bg-warm-white/70 backdrop-blur-md shadow-sm overflow-hidden">
                  <div className="p-7 md:p-10">
                    <div className="flex items-start justify-between gap-6">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.24em] text-ink-muted font-medium">
                          {a.e}
                        </p>
                        <h3 className="mt-3 text-[22px] md:text-[28px] font-bold leading-tight">
                          {a.t}
                        </h3>
                        <p className="mt-4 text-[14px] md:text-[15px] text-ink-muted leading-relaxed">
                          {a.d}
                        </p>
                      </div>
                      <div className="hidden sm:flex items-center justify-center shrink-0">
                        <div className="relative w-14 h-14 text-ink/15">
                          <Doodle type="circle-scribble" className="w-full h-full" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span data-article-num className="font-hand text-[28px] text-ink/55">
                              {a.n}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(700px 220px at 20% 20%, rgba(107,92,231,0.10), transparent 60%)",
                      opacity: 0,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <FeaturedTeachers />
      <WhyClario />
      <Testimonial />
      <FinalCTA />
    </div>
  );
}


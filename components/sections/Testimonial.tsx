"use client";

/**
 * Testimonial.tsx
 * Cinematic testimonial: word-by-word reveal + slow ring rotation on scroll.
 */
import React, { useEffect, useMemo, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Doodle } from "../ui/Doodle";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export const Testimonial = () => {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);

  const words = useMemo(
    () =>
      `“I spent months watching tutorials and hitting a wall. Ten minutes on a live call with a Clario teacher and everything finally clicked.”`
        .split(" "),
    []
  );

  useEffect(() => {
    if (reduce) return;
    if (!sectionRef.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const wordEls = sectionRef.current.querySelectorAll("[data-quote-word]");
    const ctx = gsap.context(() => {
      gsap.set(wordEls, { opacity: 0, y: 10 });
      gsap.to(wordEls, {
        opacity: 1,
        y: 0,
        ease: "power2.out",
        stagger: 0.03,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
          end: "top 30%",
          scrub: 1.2,
        },
      });

      const keyUnderlines = sectionRef.current?.querySelectorAll("[data-key-underline]");
      if (keyUnderlines && keyUnderlines.length) {
        gsap.set(keyUnderlines, { opacity: 0, scaleX: 0.6, transformOrigin: "left center" });
        gsap.to(keyUnderlines, {
          opacity: 1,
          scaleX: 1,
          ease: "power2.out",
          stagger: 0.15,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 58%",
          },
        });
      }
      if (ringRef.current) {
        gsap.to(ringRef.current, {
          rotate: 360,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 1.2,
          },
        });
      }
    }, sectionRef);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <section ref={sectionRef} className="w-full bg-warm-white py-[140px] px-6 md:px-12 flex flex-col items-center overflow-hidden">
      <motion.div
        className="max-w-3xl mx-auto flex flex-col items-center text-center w-full"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Giant Quote SVG */}
        <div className="mb-10 text-ink opacity-[0.15]">
          <svg
            width="60"
            height="45"
            viewBox="0 0 60 45"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M 15 0 C 6 0, 0 8, 0 20 C 0 35, 10 45, 20 45 C 25 45, 30 40, 25 30 C 22 30, 20 28, 20 25 C 20 20, 25 10, 30 5 C 30 0, 25 0, 15 0 Z" />
            <path d="M 45 0 C 36 0, 30 8, 30 20 C 30 35, 40 45, 50 45 C 55 45, 60 40, 55 30 C 52 30, 50 28, 50 25 C 50 20, 55 10, 60 5 C 60 0, 55 0, 45 0 Z" />
          </svg>
        </div>

        <h3 className="text-[26px] md:text-3xl font-medium italic text-ink leading-[1.4] max-w-[700px] mb-12">
          {words.map((w, i) => (
            <span key={i} data-quote-word className="inline-block mr-2 relative">
              <span className={w.toLowerCase().includes("minutes") || w.toLowerCase().includes("clicked") ? "text-ink" : ""}>
                {w}
              </span>
              {(w.toLowerCase().includes("minutes") || w.toLowerCase().includes("clicked")) && (
                <span data-key-underline className="absolute left-0 right-0 -bottom-2 text-ink/40">
                  <Doodle type="squiggle-underline" className="w-full h-4" />
                </span>
              )}
            </span>
          ))}
        </h3>

        <div className="flex flex-col items-center relative inline-flex pb-6">
          <div ref={ringRef} className="absolute -inset-6 z-0 text-ink opacity-10 flex items-center justify-center pointer-events-none mt-2">
            <Doodle type="circle-scribble" className="w-[120px] h-[120px]" />
          </div>

          <div className="relative z-10 w-12 h-12 rounded-full overflow-hidden mb-3 bg-ink flex items-center justify-center">
            {/* Minimal SVG Avatar for user */}
            <svg
              viewBox="0 0 50 50"
              className="w-full h-full text-warm-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="25" cy="50" r="20" />
              <circle cx="25" cy="20" r="10" />
            </svg>
          </div>

          <p className="font-bold text-ink text-base relative z-10 tracking-wide mt-1">
            Michael T.
          </p>
          <p className="text-[14px] text-ink-muted relative z-10 mt-1">
            Learner, 3 months on Clario
          </p>
        </div>
      </motion.div>
    </section>
  );
};

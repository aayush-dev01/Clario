"use client";

/**
 * WhyClario.tsx
 * A bold, dark section contrasting the rest of the page. Presents four key differentiators
 * using alternating layouts, faint Caveat background numerals, and SVG dividers.
 */
import React from "react";
import { motion } from "framer-motion";
import { HandText } from "../ui/HandText";
import { CelebrationFigure } from "@/components/landing/CinematicDoodles";

const reasons = [
  {
    num: "1",
    title: "No pre-recorded courses",
    desc: "Live human sessions only. We believe real learning happens when you can ask questions, get stuck, and be guided in real time.",
  },
  {
    num: "2",
    title: "No algorithmic matchmaking",
    desc: "You decide who you learn from. Browse profiles, read reviews, and pick the expert whose style actually connects with you.",
  },
  {
    num: "3",
    title: "No performance pressure",
    desc: "Every session is private and focused entirely on your growth. No grades, no leaderboards, just genuine human mentorship.",
  },
  {
    num: "4",
    title: "No noise",
    desc: "We strip away the gamification and social feed distractions. You log in, you connect, you learn exactly the skill you came for.",
  },
];

export const WhyClario = () => {
  return (
    <section className="w-full bg-ink py-[140px] px-6 md:px-12 overflow-hidden relative">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="text-center mb-24"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-warm-white">
            Why{" "}
            <HandText rotate={-2} weight="light">
              Clario
            </HandText>
          </h2>
        </motion.div>

        <motion.div
          className="flex flex-col relative"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
          }}
        >
          {reasons.map((reason, index) => {
            const isLeft = index % 2 === 0;
            return (
              <React.Fragment key={reason.num}>
                <motion.div
                  className={`relative w-full max-w-xl flex flex-col py-10 ${isLeft ? "md:mr-auto text-left" : "md:ml-auto md:text-right"}`}
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.6, ease: "easeOut" as const },
                    },
                  }}
                  style={{
                    perspective: 900,
                    transformStyle: "preserve-3d",
                    transform: `rotateY(${isLeft ? 1 : -1}deg)`,
                  }}
                >
                  {/* Faint Background Numeral */}
                  <motion.span
                    className={`absolute top-0 ${isLeft ? "-left-6" : "-right-6"} text-[120px] md:text-[150px] mt-[-20px] leading-none font-hand text-warm-white opacity-10 select-none z-0 pointer-events-none`}
                    initial={{ scale: 1 }}
                    whileInView={{ scale: [1, 1.12, 1] }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    {reason.num}
                  </motion.span>

                  <div className="relative z-10">
                    <h3 className="text-[22px] md:text-2xl font-bold text-warm-white mb-3 tracking-wide">
                      {reason.title}
                    </h3>
                    <p className="text-[15px] md:text-base text-[#9B9690] leading-relaxed w-full inline-block">
                      {reason.desc}
                    </p>
                  </div>

                  {reason.num === "4" && (
                    <motion.div
                      className={`absolute ${isLeft ? "right-[-10px]" : "left-[-10px]"} top-1/2 -translate-y-1/2 text-warm-white/15 hidden md:block`}
                      initial={{ opacity: 0, x: isLeft ? 20 : -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, amount: 0.4 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    >
                      <CelebrationFigure className="w-[100px] h-[140px]" />
                    </motion.div>
                  )}
                </motion.div>

                {/* Faint SVG Divider unless last item */}
                {index < reasons.length - 1 && (
                  <motion.div
                    className={`w-full flex ${isLeft ? "justify-start" : "justify-end"} py-2`}
                    variants={{
                      hidden: { opacity: 0 },
                      visible: { opacity: 1 },
                    }}
                  >
                    <svg
                      className="w-full max-w-[200px] h-2 text-warm-white opacity-20"
                      preserveAspectRatio="none"
                      viewBox="0 0 100 8"
                    >
                      <path
                        d="M 0 4 Q 25 6 50 4 T 100 4"
                        stroke="currentColor"
                        strokeWidth="1"
                        fill="none"
                        strokeDasharray="4 4"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
                  </motion.div>
                )}
              </React.Fragment>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

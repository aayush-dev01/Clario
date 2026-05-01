"use client";

/**
 * HowItWorks.tsx
 * Explains the three core steps of the product in a staggered, zigzag layout on desktop.
 * Uses inline SVG illustrations for each step and connected dashed doodle paths.
 */
import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { HandText } from "../ui/HandText";
import { Doodle } from "../ui/Doodle";

const steps = [
  {
    num: "01",
    title: "Find your ideal teacher",
    desc: "Browse through our curated list of experts. Filter by skill, availability, and teaching style to find your perfect match.",
    align: "md:mr-auto",
    textWrap: "md:items-start text-center md:text-left",
    icon: (
      <svg
        viewBox="0 0 80 80"
        className="w-20 h-20 text-ink"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="35" cy="35" r="15" />
        <path d="M 45 45 L 60 60" />
        <path d="M 30 35 Q 35 32 35 35" strokeWidth="2" />
        <circle cx="20" cy="20" r="2" fill="currentColor" stroke="none" />
        <circle cx="65" cy="25" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    num: "02",
    title: "Book a live session",
    desc: "Pick a time that works for both of you. Our seamless calendar integration handles the timezones and reminders effortlessly.",
    align: "md:ml-auto md:flex-row-reverse",
    textWrap: "md:items-end text-center md:text-right",
    icon: (
      <svg
        viewBox="0 0 80 80"
        className="w-20 h-20 text-ink"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="20" y="25" width="40" height="35" rx="4" />
        <path d="M 20 35 L 60 35" />
        <path d="M 30 20 L 30 30" />
        <path d="M 50 20 L 50 30" />
        <circle cx="45" cy="48" r="3" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    num: "03",
    title: "Learn and grow",
    desc: "Join the live video call directly on Clario. Connect, ask questions, and make tangible progress with real human feedback.",
    align: "md:mr-auto",
    textWrap: "md:items-start text-center md:text-left",
    icon: (
      <svg
        viewBox="0 0 80 80"
        className="w-20 h-20 text-ink"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="25" cy="35" r="8" />
        <path d="M 15 60 C 15 45, 35 45, 35 60" />
        <circle cx="55" cy="35" r="8" />
        <path d="M 45 60 C 45 45, 65 45, 65 60" />
        <path d="M 35 35 L 45 35" strokeDasharray="2 3" strokeWidth="2" />
        <path d="M 40 25 L 40 20 M 40 50 L 40 45" strokeWidth="2" />
      </svg>
    ),
  },
];

export const HowItWorks = () => {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.2 });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" as const },
    },
  };

  return (
    <section className="w-full bg-warm-white py-[100px] px-6 md:px-12 overflow-hidden relative">
      <div className="max-w-5xl mx-auto" ref={containerRef}>
        {/* Section Heading */}
        <motion.div
          className="text-center mb-24"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-ink">
            How it <HandText rotate={-3}>works</HandText>
          </h2>
        </motion.div>

        {/* Steps Container */}
        <motion.div
          className="relative flex flex-col gap-16 md:gap-32"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {steps.map((step) => (
            <motion.div
              key={step.num}
              className={`flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10 max-w-xl w-full relative z-10 ${step.align}`}
              variants={itemVariants}
            >
              {/* SVG Icon */}
              <div className="shrink-0 flex items-center justify-center relative z-20 bg-warm-white p-2">
                {step.icon}
              </div>

              {/* Text Content */}
              <div className={`flex flex-col space-y-2 ${step.textWrap}`}>
                <div className="text-ink-muted text-lg mb-1">
                  <HandText rotate={-2} weight="light">
                    {step.num}
                  </HandText>
                </div>
                <h3 className="text-2xl font-bold text-ink">{step.title}</h3>
                <p className="text-[15px] text-ink-muted leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}

          {/* Connectors (Desktop only) */}
          {isInView && (
            <div className="hidden md:block absolute inset-0 pointer-events-none z-0">
              {/* Connector Line 1 -> 2 */}
              <div className="absolute top-[12%] left-[40%] w-[25%] h-[120px]">
                <Doodle
                  type="dashed-path"
                  className="w-full h-full text-ink opacity-30 scale-x-[-1]"
                />
              </div>
              {/* Connector Line 2 -> 3 */}
              <div className="absolute top-[52%] left-[40%] w-[25%] h-[120px]">
                <Doodle
                  type="dashed-path"
                  className="w-full h-full text-ink opacity-30"
                />
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

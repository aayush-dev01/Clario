/* StepIndicator.tsx — Numbered step circles connected by dashed SVG paths. */
"use client";

import React from "react";
import { motion } from "framer-motion";

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export const StepIndicator = ({ steps, currentStep }: StepIndicatorProps) => {
  return (
    <div className="flex items-center justify-center gap-0 w-full max-w-md mx-auto">
      {steps.map((step, i) => {
        const isActive = i === currentStep;
        const isCompleted = i < currentStep;
        const isLast = i === steps.length - 1;

        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center gap-2">
              <motion.div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-hand font-bold text-lg ${
                  isActive
                    ? "bg-ink text-warm-white"
                    : isCompleted
                    ? "bg-ink text-warm-white"
                    : "bg-transparent border-2 border-ink/[0.15] text-ink-muted"
                }`}
                animate={isActive ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {isCompleted ? (
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <motion.path
                      d="M5 13l4 4L19 7"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  </svg>
                ) : (
                  `0${i + 1}`
                )}
              </motion.div>
              <span className="text-[12px] text-ink-muted font-medium whitespace-nowrap">
                {step}
              </span>
            </div>
            {!isLast && (
              <svg width="80" height="4" className="mx-2 mb-6" viewBox="0 0 80 4">
                <motion.path
                  d="M 0 2 L 80 2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeDasharray="6 4"
                  strokeLinecap="round"
                  className={isCompleted ? "text-ink" : "text-ink/[0.15]"}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: isCompleted || isActive ? 1 : 0.3 }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                />
              </svg>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

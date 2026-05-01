/* Onboarding page — animated word swap, two role selection cards with hand-drawn aesthetics. */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { motion, AnimatePresence } from "framer-motion";
import { SketchButton } from "@/components/ui/SketchButton";

export function OnboardingClient({
  databaseConfigured,
  initialRole,
}: {
  databaseConfigured: boolean;
  initialRole?: "LEARNER" | "TEACHER" | null;
}) {
  const router = useRouter();
  const [wordIndex, setWordIndex] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"LEARNER" | "TEACHER" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasAutoSelectedRole = useRef(false);
  const words = ["learn.", "teach."];

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((i) => (i + 1) % words.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [words.length]);

  const completeMutation = trpc.users.completeOnboarding.useMutation({
    onSuccess: (data) => {
      router.refresh();
      if (data.success && data.redirectTo) {
        router.push(data.redirectTo);
      }
    },
  });

  const handleSelectRole = async (role: "LEARNER" | "TEACHER") => {
    if (!databaseConfigured) {
      setErrorMessage("Setup is temporarily unavailable. Please try again shortly.");
      return;
    }

    setSelectedRole(role);
    setIsUpdating(true);
    setErrorMessage(null);
    try {
      await completeMutation.mutateAsync({ role });
    } catch {
      setErrorMessage("We couldn't save your choice right now. Please try again shortly.");
      setIsUpdating(false);
      setSelectedRole(null);
    }
  };

  useEffect(() => {
    if (!initialRole) return;
    if (hasAutoSelectedRole.current) return;
    hasAutoSelectedRole.current = true;
    void handleSelectRole(initialRole);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRole]);

  return (
    <div className="min-h-screen bg-warm-white flex flex-col items-center justify-center p-6 w-full relative">
      {/* Wordmark */}
      <div className="absolute top-8 left-8">
        <span className="text-[16px] font-bold text-ink tracking-tight flex items-center gap-1.5">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3.5 h-3.5">
            <path d="M 10 2 L 10 18 M 4 6 L 16 14 M 4 14 L 16 6" />
          </svg>
          Clario
        </span>
      </div>

      {/* Heading with animated word */}
      <div className="text-center mb-6">
        <h1 className="text-[36px] font-bold text-ink leading-tight">
          You&apos;re here to
        </h1>
        <div className="h-[56px] overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.span
              key={words[wordIndex]}
              className="font-hand font-bold text-[44px] text-ink inline-block"
              style={{ transform: "rotate(-2deg)" }}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -30, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {words[wordIndex]}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      <p className="text-ink-muted text-[16px] font-medium text-center mb-14 max-w-md">
        Tell us how you&apos;d like to use Clario and we&apos;ll set everything up.
      </p>

      {errorMessage ? (
        <p className="text-[14px] text-ink-muted font-semibold text-center mb-6 max-w-md">
          {errorMessage}
        </p>
      ) : null}

      {/* Role cards */}
      <div className="flex flex-col md:flex-row gap-6 w-full max-w-[660px]">
        {/* Learn card */}
        <motion.div
          className={`relative flex-1 p-10 flex flex-col items-center text-center gap-6 cursor-pointer transition-colors ${
            selectedRole === "LEARNER" ? "bg-ink/[0.03]" : ""
          }`}
          style={{ transform: "rotate(-1.2deg)" }}
          whileHover={{ y: -8, rotate: 0, transition: { duration: 0.2, ease: "easeOut" } }}
          whileTap={databaseConfigured ? { scale: 0.98 } : undefined}
          onClick={() => !isUpdating && handleSelectRole("LEARNER")}
        >
          {/* Sketch border */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 200 200">
            <motion.path
              d="M 4 6 C 40 3, 160 2, 196 5 C 198 40, 197 160, 195 195 C 160 198, 40 197, 5 194 C 2 160, 3 40, 4 6"
              fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-ink"
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0.92 }}
              whileHover={{ pathLength: 1 }}
              transition={{ duration: 0.3 }}
            />
          </svg>

          {/* Illustration */}
          <div className="w-[120px] h-[120px] text-ink">
            <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-full h-full">
              {/* Desk */}
              <path d="M 20 90 L 100 90" strokeWidth="2.5" />
              <line x1="30" y1="90" x2="28" y2="105" />
              <line x1="90" y1="90" x2="92" y2="105" />
              {/* Person */}
              <circle cx="55" cy="50" r="10" />
              <path d="M 55 60 L 55 80 M 55 68 L 42 60 M 55 68 L 68 62" />
              {/* Book on desk */}
              <rect x="60" y="82" width="18" height="8" rx="1" />
              <line x1="69" y1="82" x2="69" y2="90" />
              {/* Thought bubble */}
              <circle cx="78" cy="35" r="12" strokeDasharray="4 3" />
              <circle cx="70" cy="46" r="3" strokeDasharray="2 2" />
              {/* Lightbulb in bubble */}
              <path d="M 75 32 Q 78 28 81 32 Q 82 36 79 38 L 77 38 Q 74 36 75 32" />
              <line x1="77" y1="38" x2="77" y2="40" />
              <line x1="79" y1="38" x2="79" y2="40" />
            </svg>
          </div>

          <h2 className="text-[20px] font-bold text-ink">I want to learn.</h2>
          <p className="text-[15px] text-ink-muted leading-relaxed">
            Find people who know what you want to know. Book a live session and actually make progress.
          </p>
          <SketchButton
            variant={selectedRole === "LEARNER" ? "primary" : "ghost"}
            className="!text-[15px] !px-6 !py-2.5"
          >
            {selectedRole === "LEARNER" && isUpdating ? (
              <span className="font-hand text-[18px] flex gap-1">
                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}>.</motion.span>
                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}>.</motion.span>
                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}>.</motion.span>
              </span>
            ) : (
              "Start learning"
            )}
          </SketchButton>
        </motion.div>

        {/* Teach card */}
        <motion.div
          className={`relative flex-1 p-10 flex flex-col items-center text-center gap-6 cursor-pointer transition-colors ${
            selectedRole === "TEACHER" ? "bg-ink/[0.03]" : ""
          }`}
          style={{ transform: "rotate(1.2deg)" }}
          whileHover={{ y: -8, rotate: 0, transition: { duration: 0.2, ease: "easeOut" } }}
          whileTap={databaseConfigured ? { scale: 0.98 } : undefined}
          onClick={() => !isUpdating && handleSelectRole("TEACHER")}
        >
          <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 200 200">
            <motion.path
              d="M 5 4 C 40 2, 160 3, 195 6 C 197 40, 198 160, 196 194 C 160 197, 40 198, 4 196 C 3 160, 2 40, 5 4"
              fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-ink"
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0.92 }}
              whileHover={{ pathLength: 1 }}
              transition={{ duration: 0.3 }}
            />
          </svg>

          <div className="w-[120px] h-[120px] text-ink">
            <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-full h-full">
              {/* Person standing confident */}
              <circle cx="60" cy="35" r="10" />
              <path d="M 60 45 L 60 75 M 60 55 L 45 65 M 60 55 L 75 65 M 60 75 L 50 95 M 60 75 L 70 95" />
              {/* Spark lines */}
              <line x1="80" y1="25" x2="88" y2="20" />
              <line x1="85" y1="35" x2="93" y2="35" />
              <line x1="80" y1="45" x2="88" y2="50" />
              <line x1="35" y1="25" x2="27" y2="20" />
              <line x1="30" y1="35" x2="22" y2="35" />
              {/* Small audience silhouettes */}
              <circle cx="35" cy="95" r="5" strokeWidth="1.5" />
              <circle cx="50" cy="100" r="4" strokeWidth="1.5" />
              <circle cx="70" cy="100" r="4" strokeWidth="1.5" />
              <circle cx="85" cy="95" r="5" strokeWidth="1.5" />
            </svg>
          </div>

          <h2 className="text-[20px] font-bold text-ink">I want to teach.</h2>
          <p className="text-[15px] text-ink-muted leading-relaxed">
            Share what you know with people who are ready to learn. Earn from your expertise on your own schedule.
          </p>
          <SketchButton
            variant={selectedRole === "TEACHER" ? "primary" : "ghost"}
            className="!text-[15px] !px-6 !py-2.5"
          >
            {selectedRole === "TEACHER" && isUpdating ? (
              <span className="font-hand text-[18px] flex gap-1">
                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}>.</motion.span>
                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}>.</motion.span>
                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}>.</motion.span>
              </span>
            ) : (
              "Start teaching"
            )}
          </SketchButton>
        </motion.div>
      </div>
    </div>
  );
}

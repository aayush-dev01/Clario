/* Discover page — curated teacher marketplace with search, filters, and specific sketchy tilts. */
"use client";

export const dynamic = 'force-dynamic';
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SketchCard } from "@/components/ui/SketchCard";
import { SketchButton } from "@/components/ui/SketchButton";
import { ProfileAvatar } from "@/components/ui/ProfileAvatar";
import { SketchDivider } from "@/components/ui/SketchDivider";
import { trpc } from "@/lib/trpc/client";

function inr(n: number) {
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
  } catch {
    return `₹${Math.round(n)}`;
  }
}

export default function DiscoverPage() {
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  const { data: teachers = [], isLoading } = trpc.teachers.getAll.useQuery();
  const topics = Array.from(
    new Set(teachers.flatMap((t) => t.topics.map((x: { name: string }) => x.name)))
  ).sort();

  const filtered = activeTopic
    ? teachers.filter((t) => t.topics.some((x: { name: string }) => x.name === activeTopic))
    : teachers;

  return (
    <div className="w-full max-w-7xl mx-auto px-6 lg:px-8 pb-24">
      
      {/* ── Heading ──────────────────────────────────── */}
      <motion.section 
        className="pt-12 pb-8"
        initial={{ y: 20, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h1 className="text-[42px] font-bold text-ink leading-tight">
          Find your
        </h1>
        <span
          className="font-hand font-bold text-[48px] text-ink inline-block"
          style={{ transform: "rotate(-2deg)" }}
        >
          teacher
        </span>
        <p className="text-ink-muted text-[16px] font-medium mt-4 max-w-lg leading-relaxed">
          Browse people who are genuinely good at what you want to learn.
        </p>
      </motion.section>

      {/* ── Search Bar ───────────────────────────────── */}
      <motion.div
        className="max-w-[720px] mx-auto mb-10"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
      >
        <motion.div
          className="relative h-14 flex items-center"
          animate={{ scale: searchFocused ? 1.01 : 1 }}
          transition={{ duration: 0.2 }}
        >
          {/* Sketch border with drawing effect on focus */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 400 56">
            <motion.path
              d="M 6 6 C 100 3, 300 4, 394 6 C 396 16, 395 40, 393 50 C 300 53, 100 52, 6 50 C 4 40, 5 16, 6 6"
              fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={searchFocused ? "text-ink/[0.3]" : "text-ink/[0.1]"}
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0.95 }}
              animate={{ pathLength: searchFocused ? 1 : 0.95 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </svg>

          {/* Magnifying glass */}
          <div className="pl-5 pr-3 text-ink-muted">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-[18px] h-[18px]">
              <circle cx="9" cy="9" r="6" />
              <path d="M 13.5 13.5 L 18 18" />
            </svg>
          </div>

          <input
            type="text"
            placeholder="What do you want to learn?"
            className="flex-1 bg-transparent text-ink text-[15px] font-medium placeholder:text-ink-muted/60 outline-none h-full"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />

          <div className="pr-3">
            <button className="text-[13px] text-ink-muted font-medium px-4 py-1.5 relative">
              Search
              <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 80 32">
                <path d="M 3 3 C 20 2, 60 2, 77 4 C 78 10, 78 22, 76 29 C 60 30, 20 30, 4 28 C 2 22, 2 10, 3 3" fill="none" stroke="currentColor" strokeWidth="1" className="text-ink/[0.12]" vectorEffect="non-scaling-stroke" />
              </svg>
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Topic Filters ────────────────────────────── */}
      <motion.div
        className="relative mb-8"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
      >
        <div
          className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
          style={{
            maskImage: "linear-gradient(to right, black 90%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to right, black 90%, transparent 100%)",
          }}
        >
          {topics.map((topic) => {
            const isActive = activeTopic === topic;
            return (
              <motion.button
                key={topic}
                onClick={() => setActiveTopic(isActive ? null : topic)}
                whileTap={{ scale: 0.95 }}
                animate={{ scale: isActive ? 1.05 : 1 }}
                className={`relative flex-shrink-0 h-9 px-5 text-[13px] font-medium transition-colors whitespace-nowrap ${
                  isActive ? "text-warm-white" : "text-ink-muted hover:text-ink"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-topic-discover"
                    className="absolute inset-0 bg-ink rounded-full"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative z-10">{topic}</span>
                {!isActive && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 36">
                    <path d="M 10 3 C 30 1, 70 2, 90 4 C 97 10, 98 26, 92 33 C 70 35, 30 34, 8 32 C 2 26, 3 10, 10 3" fill="none" stroke="currentColor" strokeWidth="1" className="text-ink/[0.1]" vectorEffect="non-scaling-stroke" />
                  </svg>
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* ── Results Count & Sort ──────────────────── */}
      <div className="flex justify-between items-center mb-8">
        <p className="text-ink-muted text-[14px]">
          {isLoading ? "Loading teachers…" : `${filtered.length} teacher${filtered.length !== 1 ? "s" : ""} available`}
          {activeTopic ? ` for ${activeTopic}` : ""}
        </p>
        <button className="text-[13px] text-ink-muted font-medium flex items-center gap-1.5 relative px-3 py-1">
          Best match
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-3 h-3">
            <path d="M 3 5 L 6 8 L 9 5" />
          </svg>
          <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 32">
            <path d="M 4 4 C 30 2, 70 3, 96 5 C 98 10, 97 22, 95 28 C 70 30, 30 29, 4 27 C 2 22, 3 10, 4 4" fill="none" stroke="currentColor" strokeWidth="1" className="text-ink/[0.1]" vectorEffect="non-scaling-stroke" />
          </svg>
        </button>
      </div>

      {/* ── Teacher Grid ─────────────────────────────── */}
      {!isLoading && teachers.length === 0 ? (
        <div className="max-w-xl mx-auto">
          <SketchCard className="p-10 text-center">
            <p className="text-[18px] font-bold text-ink">No teachers yet — check back soon.</p>
            <p className="text-[14px] text-ink-muted mt-2">
              We’re curating the first set of teachers. In the meantime, you can create your learner profile and get ready.
            </p>
          </SketchCard>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        <AnimatePresence>
          {filtered.map((teacher, i) => (
            <motion.div
              key={teacher.id}
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.1 }}
              className="flex h-full"
            >
              <SketchCard tilt={(i % 2 === 0 ? -0.8 : 0.6) + (i % 3 === 0 ? -0.2 : 0.2)} className="p-6 flex flex-col justify-between h-full w-full">
                
                <div className="flex flex-col items-center">
                  <div className="relative mt-[20px] mb-4">
                    <svg
                      className="absolute inset-0 w-[72px] h-[72px] text-ink/[0.08] pointer-events-none -translate-x-1 -translate-y-1"
                      viewBox="0 0 100 100"
                      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <path d="M 50 5 Q 85 10 90 40 Q 95 80 55 95 Q 20 105 10 60 Q 0 20 40 10" />
                    </svg>
                    <ProfileAvatar
                      seed={`${teacher.user.firstName} ${teacher.user.lastName}`}
                      imageUrl={teacher.user.imageUrl}
                      size={64}
                      className="relative z-10"
                    />
                  </div>
                  
                  <h3 className="text-[20px] font-bold text-ink text-center mb-1">
                    {teacher.user.firstName} {teacher.user.lastName}
                  </h3>
                  <p className="text-[11px] text-ink-muted uppercase tracking-widest font-medium text-center mb-4">
                    {teacher.topics?.[0]?.name ?? "Teacher"}
                  </p>

                  <div className="flex flex-wrap justify-center gap-2 mb-4">
                    {teacher.topics.map((t: { id: string; name: string }) => (
                      <span key={t.id} className="relative px-3 py-1 text-[12px] text-ink-muted flex items-center justify-center">
                        {t.name}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 80 26">
                           <path d="M 4 3 C 20 1, 60 2, 76 4 C 78 8, 78 18, 76 23 C 60 25, 20 24, 4 22 C 2 18, 2 8, 4 3" fill="none" stroke="currentColor" strokeWidth="1" className="text-ink/[0.15]" vectorEffect="non-scaling-stroke" />
                        </svg>
                      </span>
                    ))}
                  </div>

                  <p className="text-[12px] text-ink-faint text-center mb-4">
                    {teacher.avgRating ? `Avg rating: ${teacher.avgRating.toFixed(1)}` : "No ratings yet"}
                  </p>
                </div>

                <div className="flex flex-col w-full">
                  <SketchDivider className="mb-4" />
                  <div className="flex justify-center items-baseline mb-4">
                    <span className="font-hand font-bold text-[22px] text-ink leading-none">
                      {inr(Number(teacher.hourlyRate))}
                    </span>
                    <span className="text-[13px] text-ink-muted leading-none ml-1">/hour</span>
                  </div>
                  <SketchButton
                    variant="ghost"
                    className="w-full !px-4 !py-2"
                    href={`/teacher/${teacher.username}`}
                  >
                    Book a session
                  </SketchButton>
                </div>
              </SketchCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      )}

    </div>
  );
}

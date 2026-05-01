/* Teacher Settings — Maya's full profile and account configuration. */
"use client";

export const dynamic = 'force-dynamic';
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SketchCard } from "@/components/ui/SketchCard";
import { SketchButton } from "@/components/ui/SketchButton";
import { SketchDivider } from "@/components/ui/SketchDivider";

const LANGUAGES = ["English", "Hindi"];
const DURATIONS = ["30 min", "45 min", "60 min", "90 min"];
const ACTIVE_DURATIONS = ["45 min", "60 min"];
const BUFFER_OPTIONS = ["No buffer", "15 min", "30 min"];
const BOOKING_OPTIONS = ["Up to 1 week", "Up to 2 weeks", "Up to 1 month"];
const CANCEL_OPTIONS = ["24 hours notice", "48 hours notice", "72 hours notice"];
const PAYOUT_OPTIONS = ["Weekly", "Bi-weekly", "Monthly"];

const TOPICS = [
  { name: "UX Research", level: "Advanced" },
  { name: "Usability Testing", level: "Advanced" },
  { name: "Design Systems", level: "Intermediate" },
];

export default function TeacherSettingsPage() {
  const [dirty, setDirty] = useState(false);
  const [name, setName] = useState("Maya Krishnan");
  const [headline, setHeadline] = useState("Senior UX Researcher at Google");
  const [bio, setBio] = useState("I help aspiring researchers build real skills through structured, hands-on sessions. 10+ years in UX research across B2B SaaS, fintech, and consumer products.");
  const [philosophy, setPhilosophy] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [languages, setLanguages] = useState(LANGUAGES);
  const [sessionDesc, setSessionDesc] = useState("We start with your current challenge, break it into research questions, and build a lightweight study plan you can execute in a week.");
  const [idealLearner, setIdealLearner] = useState("Anyone who wants to move beyond reading about UX research and start doing it — junior designers, PMs, founders doing their own research.");
  const [activeDurations, setActiveDurations] = useState(ACTIVE_DURATIONS);
  const [buffer, setBuffer] = useState("15 min");
  const [bookingWindow, setBookingWindow] = useState("Up to 2 weeks");
  const [cancelPolicy, setCancelPolicy] = useState("24 hours notice");
  const [freeIntro, setFreeIntro] = useState(true);
  const [payoutSchedule, setPayoutSchedule] = useState("Weekly");
  const [pauseProfile, setPauseProfile] = useState(false);

  function markDirty() { setDirty(true); }

  const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: "easeOut" as const },
  };

  function PillSelect({ options, selected, onToggle, multi = false }: {
    options: string[];
    selected: string | string[];
    onToggle: (v: string) => void;
    multi?: boolean;
  }) {
    return (
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isActive = multi
            ? (selected as string[]).includes(opt)
            : selected === opt;
          return (
            <button
              key={opt}
              onClick={() => { onToggle(opt); markDirty(); }}
              className={`relative px-4 py-2 text-[13px] font-medium transition-colors ${
                isActive ? "bg-ink text-warm-white" : "text-ink hover:bg-ink/[0.04]"
              }`}
            >
              {opt}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path d="M 3 5 L 97 3 L 98 97 L 2 95 Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={isActive ? "text-warm-white/30" : "text-ink/[0.12]"} vectorEffect="non-scaling-stroke" />
              </svg>
            </button>
          );
        })}
      </div>
    );
  }

  function SketchInput({ value, onChange, placeholder, type = "text", className = "" }: {
    value: string; onChange: (v: string) => void; placeholder: string; type?: string; className?: string;
  }) {
    return (
      <div className={`relative ${className}`}>
        <input
          type={type}
          value={value}
          onChange={(e) => { onChange(e.target.value); markDirty(); }}
          placeholder={placeholder}
          className="w-full bg-transparent text-ink text-[15px] font-sans py-3 px-4 focus:outline-none placeholder:text-ink/30"
        />
        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
          <path d="M 2 3 L 98 1 L 99 97 L 1 98 Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-ink/[0.12]" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
    );
  }

  function SketchTextarea({ value, onChange, placeholder, height = "120px", maxLength }: {
    value: string; onChange: (v: string) => void; placeholder: string; height?: string; maxLength?: number;
  }) {
    return (
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => { onChange(e.target.value); markDirty(); }}
          placeholder={placeholder}
          maxLength={maxLength}
          className="w-full bg-transparent text-ink text-[15px] font-sans resize-none focus:outline-none placeholder:text-ink/30 p-4"
          style={{ height }}
        />
        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
          <path d="M 2 3 L 98 1 L 99 97 L 1 98 Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-ink/[0.12]" vectorEffect="non-scaling-stroke" />
        </svg>
        {maxLength && (
          <span className="absolute bottom-2 right-3 text-[12px] text-ink/30">{value.length} / {maxLength}</span>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-6 lg:px-8 pb-32">
      <motion.div className="pt-12 pb-8" {...fadeUp}>
        <h1 className="text-[32px] font-bold text-ink leading-tight">
          <span className="font-hand inline-block" style={{ transform: "rotate(-2deg)" }}>Settings</span>
        </h1>
      </motion.div>

      {/* Section 1 — Profile */}
      <motion.section {...fadeUp} className="mb-4">
        <h2 className="text-[20px] font-bold text-ink mb-6">Profile</h2>

        {/* Photo */}
        <div className="flex items-center gap-6 mb-6">
          <div className="w-24 h-24 rounded-full border-2 border-dashed border-ink/[0.15] flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-8 h-8 text-ink/30">
              <rect x="3" y="6" width="18" height="14" rx="2" />
              <circle cx="12" cy="13" r="3.5" />
              <path d="M9 6L10 4h4l1 2" />
            </svg>
          </div>
          <div>
            <SketchButton variant="ghost" className="!text-[13px] !px-4 !py-1.5">Upload photo</SketchButton>
            <p className="text-[12px] text-ink/40 mt-1">JPG or PNG, max 2 MB</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <SketchInput value={name.split(" ")[0]} onChange={(v) => { setName(v + " " + name.split(" ").slice(1).join(" ")); }} placeholder="First name" />
          <SketchInput value={name.split(" ").slice(1).join(" ")} onChange={(v) => { setName(name.split(" ")[0] + " " + v); }} placeholder="Last name" />
        </div>
        <SketchInput value={headline} onChange={setHeadline} placeholder="e.g. Senior UX Researcher at Google" className="mb-4" />
        <SketchTextarea value={bio} onChange={setBio} placeholder="Tell learners about your background..." height="140px" maxLength={500} />
        <SketchTextarea value={philosophy} onChange={setPhilosophy} placeholder="What drives you to teach? What&apos;s your approach?" height="100px" />
        <SketchInput value={linkedin} onChange={setLinkedin} placeholder="LinkedIn profile URL (optional)" className="mt-4 mb-4" />

        <div className="mb-2">
          <p className="text-[14px] text-ink-muted mb-2">Languages</p>
          <div className="flex flex-wrap gap-2">
            {languages.map((lang) => (
              <span key={lang} className="relative px-3 py-1.5 text-[13px] text-ink">
                {lang}
                <button onClick={() => { setLanguages(languages.filter(l => l !== lang)); markDirty(); }} className="ml-2 text-ink/40 hover:text-ink">×</button>
                <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <path d="M 3 5 L 97 3 L 98 97 L 2 95 Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-ink/[0.12]" vectorEffect="non-scaling-stroke" />
                </svg>
              </span>
            ))}
          </div>
        </div>
      </motion.section>

      <SketchDivider className="my-12" />

      {/* Section 2 — What You Teach */}
      <motion.section {...fadeUp} className="mb-4">
        <h2 className="text-[20px] font-bold text-ink mb-6">What you teach</h2>
        <div className="flex flex-col gap-3 mb-6">
          {TOPICS.map((t) => (
            <div key={t.name} className="flex items-center justify-between">
              <span className="text-[15px] text-ink font-medium">{t.name}</span>
              <span className="text-[13px] text-ink-muted relative px-3 py-1">
                {t.level}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <path d="M 3 5 L 97 3 L 98 97 L 2 95 Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-ink/[0.10]" vectorEffect="non-scaling-stroke" />
                </svg>
              </span>
            </div>
          ))}
        </div>
        <SketchTextarea value={sessionDesc} onChange={setSessionDesc} placeholder="Describe a typical session with you" height="100px" />
        <div className="mt-4">
          <SketchTextarea value={idealLearner} onChange={setIdealLearner} placeholder="Who is your ideal learner?" height="80px" />
        </div>
      </motion.section>

      <SketchDivider className="my-12" />

      {/* Section 3 — Availability */}
      <motion.section {...fadeUp} className="mb-4">
        <h2 className="text-[20px] font-bold text-ink mb-6">Availability &amp; sessions</h2>
        <div className="mb-6">
          <p className="text-[14px] text-ink-muted mb-3">Session durations</p>
          <PillSelect options={DURATIONS} selected={activeDurations} onToggle={(v) => {
            setActiveDurations(prev => prev.includes(v) ? prev.filter(d => d !== v) : [...prev, v]);
          }} multi />
        </div>
        <div className="mb-6">
          <p className="text-[14px] text-ink-muted mb-3">Buffer time</p>
          <PillSelect options={BUFFER_OPTIONS} selected={buffer} onToggle={setBuffer} />
        </div>
        <div className="mb-6">
          <p className="text-[14px] text-ink-muted mb-3">Advance booking window</p>
          <PillSelect options={BOOKING_OPTIONS} selected={bookingWindow} onToggle={setBookingWindow} />
        </div>
        <div>
          <p className="text-[14px] text-ink-muted mb-3">Cancellation policy</p>
          <PillSelect options={CANCEL_OPTIONS} selected={cancelPolicy} onToggle={setCancelPolicy} />
        </div>
      </motion.section>

      <SketchDivider className="my-12" />

      {/* Section 4 — Pricing */}
      <motion.section {...fadeUp} className="mb-4">
        <h2 className="text-[20px] font-bold text-ink mb-6">Pricing</h2>
        <div className="flex flex-col gap-4 mb-6">
          {activeDurations.map((dur) => (
            <div key={dur} className="flex items-center gap-3">
              <span className="text-[14px] text-ink-muted w-40 shrink-0">{dur} session</span>
              <div className="relative flex-1 max-w-[200px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 text-[14px]">₹</span>
                <input
                  type="number"
                  defaultValue={dur === "45 min" ? 900 : dur === "60 min" ? 1200 : dur === "30 min" ? 600 : 1800}
                  onChange={() => markDirty()}
                  className="w-full bg-transparent text-ink text-[15px] font-sans py-2.5 pl-7 pr-3 focus:outline-none"
                />
                <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <path d="M 2 3 L 98 1 L 99 97 L 1 98 Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-ink/[0.12]" vectorEffect="non-scaling-stroke" />
                </svg>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => { setFreeIntro(!freeIntro); markDirty(); }} className="relative w-12 h-6 shrink-0">
            <svg viewBox="0 0 48 24" className="w-full h-full">
              <rect x="1" y="1" width="46" height="22" rx="11" fill={freeIntro ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" className={freeIntro ? "text-ink" : "text-ink/[0.15]"} />
              <circle cx={freeIntro ? 36 : 12} cy="12" r="8" fill={freeIntro ? "#F9F8F6" : "currentColor"} className={freeIntro ? "" : "text-ink/30"} />
            </svg>
          </button>
          <span className="text-[14px] text-ink">Offer a free 15-minute intro call</span>
        </div>

        <SketchCard className="p-5">
          <p className="text-[13px] text-ink-muted mb-2">What learners see when booking:</p>
          {activeDurations.map((dur) => (
            <div key={dur} className="flex justify-between py-1.5 text-[14px]">
              <span className="text-ink">{dur}</span>
              <span className="font-hand text-ink font-bold">₹{dur === "45 min" ? "900" : dur === "60 min" ? "1,200" : dur === "30 min" ? "600" : "1,800"}</span>
            </div>
          ))}
          {freeIntro && (
            <div className="flex justify-between py-1.5 text-[14px]">
              <span className="text-ink">15 min intro</span>
              <span className="font-hand text-ink font-bold">Free</span>
            </div>
          )}
        </SketchCard>
      </motion.section>

      <SketchDivider className="my-12" />

      {/* Section 5 — Payout & Account */}
      <motion.section {...fadeUp} className="mb-4">
        <h2 className="text-[20px] font-bold text-ink mb-6">Payout &amp; account</h2>
        <SketchCard className="p-5 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-ink inline-block" />
            <span className="text-[15px] font-medium text-ink">Stripe Connect — Connected</span>
          </div>
          <p className="text-[14px] text-ink-muted ml-5 mb-4">Bank account ending in 4242</p>
          <div>
            <p className="text-[14px] text-ink-muted mb-3">Payout schedule</p>
            <PillSelect options={PAYOUT_OPTIONS} selected={payoutSchedule} onToggle={setPayoutSchedule} />
          </div>
        </SketchCard>

        <SketchDivider className="my-8" />

        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[15px] text-ink font-medium">Pause my profile</p>
            <p className="text-[13px] text-ink/40">Hide from discovery while keeping your account active.</p>
          </div>
          <button onClick={() => { setPauseProfile(!pauseProfile); markDirty(); }} className="relative w-12 h-6 shrink-0">
            <svg viewBox="0 0 48 24" className="w-full h-full">
              <rect x="1" y="1" width="46" height="22" rx="11" fill={pauseProfile ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" className={pauseProfile ? "text-ink" : "text-ink/[0.15]"} />
              <circle cx={pauseProfile ? 36 : 12} cy="12" r="8" fill={pauseProfile ? "#F9F8F6" : "currentColor"} className={pauseProfile ? "" : "text-ink/30"} />
            </svg>
          </button>
        </div>

        <button className="text-[13px] text-ink/30 hover:text-ink/60 transition-colors mt-4">Delete account</button>
      </motion.section>

      {/* Sticky Save Bar */}
      <AnimatePresence>
        {dirty && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" as const }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-warm-white border-t border-ink/[0.08]"
          >
            <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
              <span className="text-[14px] text-ink-muted">You have unsaved changes</span>
              <div className="flex gap-3">
                <SketchButton variant="ghost" className="!text-[13px] !px-4 !py-2" onClick={() => setDirty(false)}>Discard</SketchButton>
                <SketchButton variant="primary" className="!text-[13px] !px-5 !py-2" onClick={() => setDirty(false)}>Save changes</SketchButton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

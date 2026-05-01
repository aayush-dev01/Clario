/* Teacher Onboarding Setup — Four-step flow: Identity, Topics, Availability, Pricing. */
"use client";

export const dynamic = 'force-dynamic';
import React, { useState, useRef } from "react";
import "@/lib/normalize-clerk-env";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { SketchButton } from "@/components/ui/SketchButton";
import { trpc } from "@/lib/trpc/client";

const EXPERIENCE_OPTIONS = ["1-2 years", "3-5 years", "5-10 years", "10+ years"];
const DURATION_OPTIONS = ["30 min", "45 min", "60 min", "90 min"];
const BUFFER_OPTIONS = ["No buffer", "15 min", "30 min"];
const BOOKING_OPTIONS = ["Up to 1 week", "Up to 2 weeks", "Up to 1 month"];
const CANCEL_OPTIONS = ["24 hours notice", "48 hours notice", "72 hours notice"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 7AM to 10PM

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-10">
      {Array.from({ length: total }, (_, i) => (
        <React.Fragment key={i}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold transition-colors ${
            i < current ? "bg-ink text-warm-white" : i === current ? "bg-ink text-warm-white" : "bg-ink/[0.06] text-ink-muted"
          }`}>
            {i < current ? "✓" : i + 1}
          </div>
          {i < total - 1 && (
            <div className={`flex-1 h-px transition-colors ${i < current ? "bg-ink" : "bg-ink/[0.1]"}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function SketchInput({ value, onChange, placeholder, type = "text", prefix, className = "" }: {
  value: string; onChange: (v: string) => void; placeholder: string; type?: string; prefix?: string; className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 text-[14px]">{prefix}</span>}
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className={`w-full bg-transparent text-ink text-[15px] font-sans py-3 px-4 focus:outline-none placeholder:text-ink/30 ${prefix ? "pl-7" : ""}`}
      />
      <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
        <path d="M 2 3 L 98 1 L 99 97 L 1 98 Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-ink/[0.12]" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

function SketchTextarea({ value, onChange, placeholder, height = "120px" }: {
  value: string; onChange: (v: string) => void; placeholder: string; height?: string;
}) {
  return (
    <div className="relative">
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-transparent text-ink text-[15px] font-sans resize-none focus:outline-none placeholder:text-ink/30 p-4" style={{ height }}
      />
      <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
        <path d="M 2 3 L 98 1 L 99 97 L 1 98 Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-ink/[0.12]" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

function PillToggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`relative px-4 py-2 text-[13px] font-medium transition-colors ${
      active ? "bg-ink text-warm-white" : "text-ink hover:bg-ink/[0.04]"
    }`}>
      {label}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
        <path d="M 3 5 L 97 3 L 98 97 L 2 95 Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
          className={active ? "text-warm-white/30" : "text-ink/[0.12]"} vectorEffect="non-scaling-stroke" />
      </svg>
    </button>
  );
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
};

export default function TeacherSetupPage() {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const fileInput = useRef<HTMLInputElement>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Step 1 state
  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [experience, setExperience] = useState("");
  const [linkedIn, setLinkedIn] = useState("");
  const [languages, setLanguages] = useState<string[]>(["English"]);
  const [langInput, setLangInput] = useState("");

  // Step 2 state
  const [topics, setTopics] = useState<{ name: string; level: string }[]>([]);
  const [topicInput, setTopicInput] = useState("");
  const [typicalSession, setTypicalSession] = useState("");
  const [idealLearner, setIdealLearner] = useState("");

  // Step 3 state
  const [availability, setAvailability] = useState<Record<string, boolean[]>>(
    Object.fromEntries(DAYS.map(d => [d, Array(16).fill(false)]))
  );
  const [durations, setDurations] = useState<string[]>([]);
  const [buffer, setBuffer] = useState("No buffer");
  const [bookingWindow, setBookingWindow] = useState("Up to 2 weeks");
  const [cancelPolicy, setCancelPolicy] = useState("24 hours notice");

  // Step 4 state
  const [rates, setRates] = useState<Record<string, string>>({});
  const [freeIntro, setFreeIntro] = useState(false);

  const setupMutation = trpc.users.teacherSetupProfile.useMutation({
    onSuccess: () => router.push("/teacher-dashboard"),
  });

  async function onSelectPhoto(file: File) {
    setPhotoError(null);
    const objectUrl = URL.createObjectURL(file);
    setPhotoPreviewUrl(objectUrl);
    try {
      await clerkUser?.setProfileImage({ file });
    } catch {
      setPhotoError("Couldn’t apply that photo. Please try a different image.");
    }
  }

  function next() { setDirection(1); setStep(s => Math.min(s + 1, 3)); }
  function back() { setDirection(-1); setStep(s => Math.max(s - 1, 0)); }

  function addLang() {
    const t = langInput.trim();
    if (t && !languages.includes(t)) { setLanguages([...languages, t]); }
    setLangInput("");
  }

  function addTopic() {
    const t = topicInput.trim();
    if (t && topics.length < 6 && !topics.find(tp => tp.name === t)) {
      setTopics([...topics, { name: t, level: "Beginner" }]);
    }
    setTopicInput("");
  }

  function toggleSlot(day: string, idx: number) {
    setAvailability(prev => ({
      ...prev,
      [day]: prev[day].map((v, i) => i === idx ? !v : v),
    }));
  }

  function copyToWeekdays() {
    const monSlots = availability["Mon"];
    setAvailability(prev => {
      const next = { ...prev };
      ["Tue", "Wed", "Thu", "Fri"].forEach(d => { next[d] = [...monSlots]; });
      return next;
    });
  }

  function handleComplete() {
    setupMutation.mutate({
      name: fullName,
      topics: topics.map(t => t.name).join(", "),
      hourlyRate: parseInt(rates[durations[0]] || "0", 10),
      bio,
    });
  }

  return (
    <div className="min-h-screen bg-warm-white flex flex-col items-center px-6 py-12">
      {/* Wordmark */}
      <div className="w-full max-w-lg mb-8">
        <span className="text-[18px] font-bold text-ink tracking-tight flex items-center gap-1.5">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-4 h-4">
            <path d="M 10 2 L 10 18 M 4 6 L 16 14 M 4 14 L 16 6" />
          </svg>
          Clario
        </span>
      </div>

      <div className="w-full max-w-lg">
        <StepIndicator current={step} total={4} />

        <div className="relative overflow-hidden min-h-[500px]">
          <AnimatePresence custom={direction} mode="wait">
            {/* STEP 1 — Identity */}
            {step === 0 && (
              <motion.div key="step1" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.3, ease: "easeOut" as const }} className="w-full"
              >
                <h2 className="text-[28px] font-bold text-ink mb-1">Tell us about <span className="font-hand inline-block" style={{ transform: "rotate(-2deg)" }}>yourself</span></h2>
                <p className="text-[14px] text-ink-muted mb-8">This helps learners know who they&apos;re booking with.</p>

                {/* Photo upload */}
                <div className="flex justify-center mb-8">
                  <button onClick={() => fileInput.current?.click()} className="flex flex-col items-center gap-2">
                    <div className="w-24 h-24 rounded-full border-2 border-dashed border-ink/[0.15] flex items-center justify-center overflow-hidden bg-ink/[0.02]">
                      {photoPreviewUrl || clerkUser?.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={photoPreviewUrl ?? clerkUser?.imageUrl ?? ""}
                          alt="Profile preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-7 h-7 text-ink/30">
                          <rect x="3" y="6" width="18" height="14" rx="2" /><circle cx="12" cy="13" r="3.5" /><path d="M9 6L10 4h4l1 2" />
                        </svg>
                      )}
                    </div>
                    <span className="text-[13px] text-ink-muted">Upload a photo</span>
                  </button>
                  <input
                    ref={fileInput}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void onSelectPhoto(file);
                    }}
                  />
                </div>
                {photoError && (
                  <p className="text-[13px] text-red-600 text-center -mt-4 mb-6">
                    {photoError}
                  </p>
                )}

                <div className="flex flex-col gap-5">
                  <SketchInput value={fullName} onChange={setFullName} placeholder="Your full name" />
                  <SketchInput value={headline} onChange={setHeadline} placeholder="e.g. Senior UX Researcher at Google" />
                  <SketchTextarea value={bio} onChange={setBio} placeholder="Tell learners about your background, what drives you to teach, and what they can expect from your sessions." />

                  <div>
                    <p className="text-[14px] text-ink-muted mb-2">Languages</p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {languages.map(l => (
                        <span key={l} className="relative px-3 py-1.5 text-[13px] text-ink">
                          {l}
                          <button onClick={() => setLanguages(languages.filter(x => x !== l))} className="ml-2 text-ink/40 hover:text-ink">×</button>
                          <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
                            <path d="M 3 5 L 97 3 L 98 97 L 2 95 Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-ink/[0.12]" vectorEffect="non-scaling-stroke" />
                          </svg>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <SketchInput value={langInput} onChange={setLangInput} placeholder="Add language..." className="flex-1" />
                      <SketchButton variant="ghost" className="!text-[13px] !px-3 !py-2" onClick={addLang}>Add</SketchButton>
                    </div>
                  </div>

                  <div>
                    <p className="text-[14px] text-ink-muted mb-2">Years of experience</p>
                    <div className="flex flex-wrap gap-2">
                      {EXPERIENCE_OPTIONS.map(o => (
                        <PillToggle key={o} label={o} active={experience === o} onClick={() => setExperience(o)} />
                      ))}
                    </div>
                  </div>

                  <SketchInput value={linkedIn} onChange={setLinkedIn} placeholder="LinkedIn profile URL (optional)" />
                </div>

                <SketchButton variant="primary" className="w-full mt-8 !py-3 !text-[15px]" onClick={next}
                  disabled={!fullName.trim()}>Continue</SketchButton>
              </motion.div>
            )}

            {/* STEP 2 — What You Teach */}
            {step === 1 && (
              <motion.div key="step2" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.3, ease: "easeOut" as const }} className="w-full"
              >
                <button onClick={back} className="text-[14px] text-ink-muted hover:text-ink mb-4 flex items-center gap-1">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-3.5 h-3.5"><path d="M10 3L5 8L10 13" /></svg>
                  Back
                </button>
                <h2 className="text-[28px] font-bold text-ink mb-1">What do you <span className="font-hand inline-block" style={{ transform: "rotate(-2deg)" }}>teach</span>?</h2>
                <p className="text-[14px] text-ink-muted mb-8">Add up to 6 topics you can teach.</p>

                <div className="flex gap-2 mb-4">
                  <SketchInput value={topicInput} onChange={setTopicInput} placeholder="e.g. UX Research, System Design..." className="flex-1" />
                  <SketchButton variant="ghost" className="!text-[13px] !px-3 !py-2" onClick={addTopic} disabled={topics.length >= 6}>Add</SketchButton>
                </div>

                {topics.length > 0 && (
                  <div className="flex flex-col gap-2 mb-6">
                    {topics.map((t, i) => (
                      <div key={t.name} className="flex items-center justify-between py-2 px-3 bg-ink/[0.02] rounded-sm">
                        <span className="text-[14px] text-ink font-medium">{t.name}</span>
                        <div className="flex items-center gap-2">
                          {["Beginner", "Intermediate", "Advanced"].map(lvl => (
                            <button key={lvl} onClick={() => {
                              const next = [...topics]; next[i] = { ...t, level: lvl }; setTopics(next);
                            }} className={`text-[11px] px-2 py-0.5 transition-colors ${t.level === lvl ? "bg-ink text-warm-white" : "text-ink-muted"}`}>
                              {lvl}
                            </button>
                          ))}
                          <button onClick={() => setTopics(topics.filter((_, j) => j !== i))} className="text-ink/30 hover:text-ink ml-2">×</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <SketchTextarea value={typicalSession} onChange={setTypicalSession} placeholder="Describe a typical session with you" height="100px" />
                <div className="mt-4">
                  <SketchTextarea value={idealLearner} onChange={setIdealLearner} placeholder="Who is your ideal learner?" height="80px" />
                </div>

                <SketchButton variant="primary" className="w-full mt-8 !py-3 !text-[15px]" onClick={next}>Continue</SketchButton>
              </motion.div>
            )}

            {/* STEP 3 — Availability */}
            {step === 2 && (
              <motion.div key="step3" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.3, ease: "easeOut" as const }} className="w-full"
              >
                <button onClick={back} className="text-[14px] text-ink-muted hover:text-ink mb-4 flex items-center gap-1">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-3.5 h-3.5"><path d="M10 3L5 8L10 13" /></svg>
                  Back
                </button>
                <h2 className="text-[28px] font-bold text-ink mb-1">When are you <span className="font-hand inline-block" style={{ transform: "rotate(-2deg)" }}>available</span>?</h2>
                <p className="text-[14px] text-ink-muted mb-6">Select your typical weekly hours.</p>

                {/* Weekly grid */}
                <div className="overflow-x-auto mb-4">
                  <div className="grid grid-cols-7 gap-1 min-w-[420px]">
                    {DAYS.map(day => (
                      <div key={day} className="flex flex-col items-center gap-0.5">
                        <span className="text-[11px] uppercase tracking-widest text-ink-muted mb-1">{day}</span>
                        {HOURS.map((h, idx) => (
                          <button key={h} onClick={() => toggleSlot(day, idx)}
                            className={`w-full h-[32px] rounded-sm text-[10px] transition-colors ${
                              availability[day][idx] ? "bg-ink text-warm-white" : "bg-ink/[0.04] text-ink/40 hover:bg-ink/[0.08]"
                            }`}>
                            {h > 12 ? h - 12 : h}{h >= 12 ? "p" : "a"}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
                <SketchButton variant="ghost" className="!text-[13px] !px-4 !py-2 mb-8" onClick={copyToWeekdays}>Copy to all weekdays</SketchButton>

                <div className="mb-6">
                  <p className="text-[14px] text-ink-muted mb-2">Session durations (select all you offer)</p>
                  <div className="flex flex-wrap gap-2">
                    {DURATION_OPTIONS.map(d => (
                      <PillToggle key={d} label={d} active={durations.includes(d)} onClick={() => {
                        setDurations(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
                      }} />
                    ))}
                  </div>
                </div>
                <div className="mb-6">
                  <p className="text-[14px] text-ink-muted mb-2">Buffer time between sessions</p>
                  <div className="flex flex-wrap gap-2">
                    {BUFFER_OPTIONS.map(b => <PillToggle key={b} label={b} active={buffer === b} onClick={() => setBuffer(b)} />)}
                  </div>
                </div>
                <div className="mb-6">
                  <p className="text-[14px] text-ink-muted mb-2">Advance booking window</p>
                  <div className="flex flex-wrap gap-2">
                    {BOOKING_OPTIONS.map(b => <PillToggle key={b} label={b} active={bookingWindow === b} onClick={() => setBookingWindow(b)} />)}
                  </div>
                </div>
                <div className="mb-6">
                  <p className="text-[14px] text-ink-muted mb-2">Cancellation policy</p>
                  <div className="flex flex-wrap gap-2">
                    {CANCEL_OPTIONS.map(c => <PillToggle key={c} label={c} active={cancelPolicy === c} onClick={() => setCancelPolicy(c)} />)}
                  </div>
                </div>

                <SketchButton variant="primary" className="w-full mt-4 !py-3 !text-[15px]" onClick={next}>Continue</SketchButton>
              </motion.div>
            )}

            {/* STEP 4 — Pricing & Payout */}
            {step === 3 && (
              <motion.div key="step4" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.3, ease: "easeOut" as const }} className="w-full"
              >
                <button onClick={back} className="text-[14px] text-ink-muted hover:text-ink mb-4 flex items-center gap-1">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-3.5 h-3.5"><path d="M10 3L5 8L10 13" /></svg>
                  Back
                </button>
                <h2 className="text-[28px] font-bold text-ink mb-1">How much do you <span className="font-hand inline-block" style={{ transform: "rotate(-2deg)" }}>charge</span>?</h2>
                <p className="text-[14px] text-ink-muted mb-8">Set your rate per session duration.</p>

                <div className="flex flex-col gap-4 mb-8">
                  {(durations.length > 0 ? durations : ["60 min"]).map(dur => (
                    <div key={dur} className="flex items-center gap-3">
                      <span className="text-[14px] text-ink-muted w-40 shrink-0">{dur} session</span>
                      <SketchInput value={rates[dur] || ""} onChange={(v) => setRates({ ...rates, [dur]: v })}
                        placeholder="0" type="number" prefix="₹" className="flex-1 max-w-[200px]" />
                    </div>
                  ))}
                </div>

                {/* Free intro toggle */}
                <div className="flex items-center gap-4 mb-10">
                  <button onClick={() => setFreeIntro(!freeIntro)} className="relative w-12 h-6 shrink-0">
                    <svg viewBox="0 0 48 24" className="w-full h-full">
                      <rect x="1" y="1" width="46" height="22" rx="11" fill={freeIntro ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" className={freeIntro ? "text-ink" : "text-ink/[0.15]"} />
                      <circle cx={freeIntro ? 36 : 12} cy="12" r="8" fill={freeIntro ? "#F9F8F6" : "currentColor"} className={freeIntro ? "" : "text-ink/30"} />
                    </svg>
                  </button>
                  <span className="text-[14px] text-ink">Offer a free 15-minute intro call</span>
                </div>

                <h3 className="text-[18px] font-bold text-ink mb-3">How should we pay you?</h3>
                <SketchButton variant="primary" className="w-full !py-3 !text-[15px] mb-3">Connect with Stripe</SketchButton>
                <p className="text-[13px] text-ink/40 text-center mb-4 leading-relaxed">
                  Clario takes a 15% platform fee. Payments are held until 24 hours after a session completes, then released to your connected account.
                </p>
                <div className="flex justify-center mb-10">
                  <SketchButton variant="ghost" className="!text-[13px] !px-4 !py-2">Set up payout later</SketchButton>
                </div>

                <SketchButton variant="primary" className="w-full !py-3 !text-[15px]" onClick={handleComplete}
                  disabled={!fullName.trim() || setupMutation.isPending}>
                  {setupMutation.isPending ? "Setting up..." : "Complete setup"}
                </SketchButton>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

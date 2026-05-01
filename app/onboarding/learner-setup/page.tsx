/* Learner Onboarding Setup — Three-step flow: Identity, Learning Goals, Preferences. */
"use client";

export const dynamic = 'force-dynamic';
import React, { useState, useRef } from "react";
import "@/lib/normalize-clerk-env";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { SketchButton } from "@/components/ui/SketchButton";
import { trpc } from "@/lib/trpc/client";

const INTEREST_OPTIONS = ["Design", "Engineering", "Product", "Writing", "Marketing", "Finance", "Leadership", "Communication", "Data Science", "AI & ML"];
const LEVEL_OPTIONS = ["Just starting out", "Some experience", "Intermediate", "Advanced"];
const LEARNING_STYLE = ["Hands-on practice", "Theory first", "Project-based", "Discussion-based"];
const FREQUENCY_OPTIONS = ["Once a week", "Twice a week", "A few times a month", "Flexible"];

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

function SketchInput({ value, onChange, placeholder, className = "" }: {
  value: string; onChange: (v: string) => void; placeholder: string; className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-transparent text-ink text-[15px] font-sans py-3 px-4 focus:outline-none placeholder:text-ink/30"
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

export default function LearnerSetupPage() {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const fileInput = useRef<HTMLInputElement>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Step 1
  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");

  // Step 2
  const [goals, setGoals] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [level, setLevel] = useState("");

  // Step 3
  const [learningStyle, setLearningStyle] = useState<string[]>([]);
  const [frequency, setFrequency] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kolkata");

  const setupMutation = trpc.users.learnerSetupProfile.useMutation({
    onSuccess: () => router.push("/dashboard"),
  });

  async function onSelectPhoto(file: File) {
    setPhotoError(null);
    const objectUrl = URL.createObjectURL(file);
    setPhotoPreviewUrl(objectUrl);
    try {
      // Immediately apply the image to the signed-in Clerk profile.
      await clerkUser?.setProfileImage({ file });
    } catch {
      setPhotoError("Couldn’t apply that photo. Please try a different image.");
    }
  }

  function next() { setDirection(1); setStep(s => Math.min(s + 1, 2)); }
  function back() { setDirection(-1); setStep(s => Math.max(s - 1, 0)); }

  function handleComplete() {
    setupMutation.mutate({ name: fullName, goals });
  }

  return (
    <div className="min-h-screen bg-warm-white flex flex-col items-center px-6 py-12">
      <div className="w-full max-w-lg mb-8">
        <span className="text-[18px] font-bold text-ink tracking-tight flex items-center gap-1.5">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-4 h-4">
            <path d="M 10 2 L 10 18 M 4 6 L 16 14 M 4 14 L 16 6" />
          </svg>
          Clario
        </span>
      </div>

      <div className="w-full max-w-lg">
        <StepIndicator current={step} total={3} />

        <div className="relative overflow-hidden min-h-[480px]">
          <AnimatePresence custom={direction} mode="wait">

            {/* STEP 1 — Identity */}
            {step === 0 && (
              <motion.div key="s1" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.3, ease: "easeOut" as const }} className="w-full"
              >
                <h2 className="text-[28px] font-bold text-ink mb-1">
                  Tell us about <span className="font-hand inline-block" style={{ transform: "rotate(-2deg)" }}>yourself</span>
                </h2>
                <p className="text-[14px] text-ink-muted mb-8">This helps teachers understand who they&apos;re working with.</p>

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
                  <SketchInput value={headline} onChange={setHeadline} placeholder="What do you do? e.g. Product Manager at Razorpay" />
                  <SketchTextarea value={bio} onChange={setBio} placeholder="Tell us a bit about your background and what you&apos;re working on right now." height="100px" />
                </div>

                <SketchButton variant="primary" className="w-full mt-8 !py-3 !text-[15px]" onClick={next}
                  disabled={!fullName.trim()}>Continue</SketchButton>
              </motion.div>
            )}

            {/* STEP 2 — Learning Goals */}
            {step === 1 && (
              <motion.div key="s2" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.3, ease: "easeOut" as const }} className="w-full"
              >
                <button onClick={back} className="text-[14px] text-ink-muted hover:text-ink mb-4 flex items-center gap-1">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-3.5 h-3.5"><path d="M10 3L5 8L10 13" /></svg>
                  Back
                </button>
                <h2 className="text-[28px] font-bold text-ink mb-1">
                  What do you want to <span className="font-hand inline-block" style={{ transform: "rotate(-2deg)" }}>learn</span>?
                </h2>
                <p className="text-[14px] text-ink-muted mb-8">Be as specific or broad as you like — this helps us match you with the right teachers.</p>

                <SketchTextarea value={goals} onChange={setGoals}
                  placeholder="e.g. I want to understand SaaS pricing strategy deeply enough to restructure our pricing page with confidence. I also want to learn how to build financial models from scratch."
                  height="120px" />

                <div className="mt-6 mb-6">
                  <p className="text-[14px] text-ink-muted mb-3">Topics that interest you (select all that apply)</p>
                  <div className="flex flex-wrap gap-2">
                    {INTEREST_OPTIONS.map(i => (
                      <PillToggle key={i} label={i} active={interests.includes(i)} onClick={() => {
                        setInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
                      }} />
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[14px] text-ink-muted mb-3">Where are you in your learning journey?</p>
                  <div className="flex flex-wrap gap-2">
                    {LEVEL_OPTIONS.map(l => (
                      <PillToggle key={l} label={l} active={level === l} onClick={() => setLevel(l)} />
                    ))}
                  </div>
                </div>

                <SketchButton variant="primary" className="w-full mt-8 !py-3 !text-[15px]" onClick={next}>Continue</SketchButton>
              </motion.div>
            )}

            {/* STEP 3 — Preferences */}
            {step === 2 && (
              <motion.div key="s3" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.3, ease: "easeOut" as const }} className="w-full"
              >
                <button onClick={back} className="text-[14px] text-ink-muted hover:text-ink mb-4 flex items-center gap-1">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-3.5 h-3.5"><path d="M10 3L5 8L10 13" /></svg>
                  Back
                </button>
                <h2 className="text-[28px] font-bold text-ink mb-1">
                  How do you like to <span className="font-hand inline-block" style={{ transform: "rotate(-2deg)" }}>learn</span>?
                </h2>
                <p className="text-[14px] text-ink-muted mb-8">This helps us recommend sessions that match your style.</p>

                <div className="mb-6">
                  <p className="text-[14px] text-ink-muted mb-3">Learning style (select all that apply)</p>
                  <div className="flex flex-wrap gap-2">
                    {LEARNING_STYLE.map(s => (
                      <PillToggle key={s} label={s} active={learningStyle.includes(s)} onClick={() => {
                        setLearningStyle(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
                      }} />
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-[14px] text-ink-muted mb-3">How often do you want to learn?</p>
                  <div className="flex flex-wrap gap-2">
                    {FREQUENCY_OPTIONS.map(f => (
                      <PillToggle key={f} label={f} active={frequency === f} onClick={() => setFrequency(f)} />
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-[14px] text-ink-muted mb-3">Your timezone</p>
                  <div className="relative">
                    <select value={timezone} onChange={(e) => setTimezone(e.target.value)}
                      className="w-full bg-transparent text-ink text-[15px] font-sans py-3 px-4 focus:outline-none appearance-none">
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                      <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                      <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                    </select>
                    <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 text-ink-muted pointer-events-none" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M 3 5 L 6 8 L 9 5" />
                    </svg>
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
                      <path d="M 2 3 L 98 1 L 99 97 L 1 98 Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-ink/[0.12]" vectorEffect="non-scaling-stroke" />
                    </svg>
                  </div>
                </div>

                <SketchButton variant="primary" className="w-full mt-4 !py-3 !text-[15px]" onClick={handleComplete}
                  disabled={!fullName.trim() || setupMutation.isPending}>
                  {setupMutation.isPending ? "Setting up..." : "Start learning"}
                </SketchButton>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

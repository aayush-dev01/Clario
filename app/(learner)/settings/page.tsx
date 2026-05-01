/* Learner Settings — profile, learning goals, notification toggles with sticky save bar. */
"use client";

export const dynamic = 'force-dynamic';
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SketchButton } from "@/components/ui/SketchButton";
import { SketchDivider } from "@/components/ui/SketchDivider";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";

const NOTIFICATION_SETTINGS = [
  { id: "reminders", label: "Session reminders", desc: "Get notified 30 minutes before each session", default: true },
  { id: "nudges", label: "Action item nudges", desc: "Gentle reminders about outstanding tasks from your sessions", default: true },
  { id: "messages", label: "New message alerts", desc: "Know when a teacher responds to your message", default: true },
  { id: "availability", label: "Teacher availability updates", desc: "When your favorite teachers open new time slots", default: false },
  { id: "digest", label: "Weekly progress digest", desc: "A summary of your learning journey every Monday", default: true },
];

export default function LearnerSettingsPage() {
  const [firstName, setFirstName] = useState("Aayush");
  const [lastName, setLastName] = useState("Sharma");
  const [bio, setBio] = useState("");
  const [goals, setGoals] = useState("I want to understand SaaS pricing strategy deeply enough to restructure our pricing page with confidence. Right now I'm making pricing decisions based on what competitors charge, and I know that's not right.");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [notifications, setNotifications] = useState(
    Object.fromEntries(NOTIFICATION_SETTINGS.map((n) => [n.id, n.default]))
  );
  const [isDirty, setDirty] = useState(false);

  const markDirty = () => setDirty(true);

  return (
    <div className="w-full max-w-[680px] mx-auto px-6 py-12 pb-32">
      <motion.h1
        className="text-[32px] font-bold text-ink mb-2"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        Your{" "}
        <span className="font-hand inline-block" style={{ transform: "rotate(-1.5deg)" }}>
          settings
        </span>
      </motion.h1>

      {/* ── Section 1: Profile ────────────────────── */}
      <section className="mt-10">
        <h2 className="text-[18px] font-bold text-ink mb-6">Your profile</h2>

        {/* Photo upload */}
        <div className="flex items-center gap-6 mb-6">
          <button className="w-24 h-24 rounded-full flex flex-col items-center justify-center gap-1 hover:bg-ink/[0.02] transition-colors relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-6 h-6 text-ink-muted">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <circle cx="12" cy="12" r="3" />
              <path d="M8 5V3h8v2" />
            </svg>
            <span className="text-[11px] text-ink-muted">Upload photo</span>
            {/* Dashed border */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="46" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 4" className="text-ink/[0.15]" />
            </svg>
          </button>
        </div>

        {/* Name inputs */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="relative">
            <input
              value={firstName}
              onChange={(e) => { setFirstName(e.target.value); markDirty(); }}
              className="w-full p-4 bg-transparent text-ink text-[15px] font-medium outline-none"
              placeholder="First name"
            />
            <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 200 50">
              <path d="M 4 5 C 50 2, 150 3, 196 5 C 198 15, 197 35, 195 45 C 150 48, 50 47, 4 45 C 2 35, 3 15, 4 5" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink/[0.12]" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
            </svg>
          </div>
          <div className="relative">
            <input
              value={lastName}
              onChange={(e) => { setLastName(e.target.value); markDirty(); }}
              className="w-full p-4 bg-transparent text-ink text-[15px] font-medium outline-none"
              placeholder="Last name"
            />
            <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 200 50">
              <path d="M 4 5 C 50 2, 150 3, 196 5 C 198 15, 197 35, 195 45 C 150 48, 50 47, 4 45 C 2 35, 3 15, 4 5" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink/[0.12]" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Timezone */}
        <div className="relative mb-4">
          <select
            value={timezone}
            onChange={(e) => { setTimezone(e.target.value); markDirty(); }}
            className="w-full p-4 bg-transparent text-ink text-[15px] font-medium outline-none appearance-none cursor-pointer"
          >
            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
            <option value="America/New_York">America/New_York (EST)</option>
            <option value="Europe/London">Europe/London (GMT)</option>
            <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
            <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
          </select>
          <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 text-ink-muted pointer-events-none" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M 3 5 L 6 8 L 9 5" />
          </svg>
          <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 400 50">
            <path d="M 6 5 C 100 2, 300 3, 394 5 C 396 15, 395 35, 393 45 C 300 48, 100 47, 6 45 C 4 35, 5 15, 6 5" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink/[0.12]" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
          </svg>
        </div>

        {/* Bio */}
        <div className="relative">
          <textarea
            value={bio}
            onChange={(e) => { setBio(e.target.value); markDirty(); }}
            className="w-full min-h-[100px] p-4 bg-transparent text-ink text-[15px] font-medium outline-none resize-y leading-relaxed"
            placeholder="Tell teachers a bit about yourself..."
          />
          <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 400 100">
            <path d="M 6 6 C 100 3, 300 4, 394 6 C 396 25, 395 75, 393 94 C 300 97, 100 96, 6 94 C 4 75, 5 25, 6 6" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink/[0.12]" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
          </svg>
        </div>
      </section>

      <SketchDivider className="my-14" />

      {/* ── Section 2: Learning Goals ────────────── */}
      <section>
        <h2 className="text-[18px] font-bold text-ink mb-6">Learning goals</h2>

        <div className="relative mb-4">
          <textarea
            value={goals}
            onChange={(e) => { setGoals(e.target.value); markDirty(); }}
            className="w-full min-h-[120px] p-4 bg-transparent text-ink text-[15px] font-medium outline-none resize-y leading-relaxed"
            placeholder="What are you working toward? The more specific you are, the better we can match you."
          />
          <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 400 120">
            <path d="M 6 6 C 100 3, 300 4, 394 6 C 396 30, 395 90, 393 114 C 300 117, 100 116, 6 114 C 4 90, 5 30, 6 6" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink/[0.12]" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
          </svg>
        </div>
      </section>

      <SketchDivider className="my-14" />

      {/* ── Section 3: Notifications ─────────────── */}
      <section>
        <h2 className="text-[18px] font-bold text-ink mb-6">Notifications</h2>

        <div className="flex flex-col gap-6">
          {NOTIFICATION_SETTINGS.map((setting) => (
            <div key={setting.id} className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-[15px] font-medium text-ink">{setting.label}</p>
                <p className="text-[13px] text-ink-muted mt-0.5 leading-relaxed">{setting.desc}</p>
              </div>
              <ToggleSwitch
                checked={notifications[setting.id]}
                onChange={(val) => {
                  setNotifications((p) => ({ ...p, [setting.id]: val }));
                  markDirty();
                }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ── Sticky Save Bar ──────────────────────── */}
      <AnimatePresence>
        {isDirty && (
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-warm-white flex items-center justify-between px-8 border-t border-ink/[0.06]"
            initial={{ y: 64 }}
            animate={{ y: 0 }}
            exit={{ y: 64 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <span className="text-[14px] text-ink-muted">You have unsaved changes</span>
            <div className="flex gap-3">
              <SketchButton variant="ghost" onClick={() => setDirty(false)} className="!text-[13px] !px-5 !py-2">
                Discard
              </SketchButton>
              <SketchButton variant="primary" onClick={() => setDirty(false)} className="!text-[13px] !px-5 !py-2">
                Save changes
              </SketchButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

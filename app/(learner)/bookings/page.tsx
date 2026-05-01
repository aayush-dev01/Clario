/* My Sessions (Learner) — Aayush's upcoming and past sessions with coherent data. */
"use client";

export const dynamic = 'force-dynamic';
import React, { useState } from "react";
import { motion } from "framer-motion";
import { SketchCard } from "@/components/ui/SketchCard";
import { TabBar } from "@/components/ui/TabBar";
import { SketchButton } from "@/components/ui/SketchButton";
import { ProfileAvatar } from "@/components/ui/ProfileAvatar";
import { RatingDisplay } from "@/components/ui/RatingDisplay";
import { SketchDivider } from "@/components/ui/SketchDivider";
import { EmptyState } from "@/components/ui/EmptyState";
import { trpc } from "@/lib/trpc/client";

type BookingCard = {
  id: string;
  startTime: Date | string;
  endTime: Date | string;
  notes: string | null;
  teacher: {
    hourlyRate: unknown;
    user: { firstName: string; lastName: string; imageUrl: string | null };
    topics: { name: string }[];
  };
  session: { id: string; roomIdentifier: string; summary?: { aiGeneratedNotes?: string | null } | null } | null;
  feedbacks?: { rating: number }[];
};

function durationLabel(start: Date, end: Date) {
  return `${Math.round((+end - +start) / 60000)} min`;
}

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState("Upcoming");
  const upcomingQuery = trpc.bookings.getUpcoming.useQuery();
  const pastQuery = trpc.bookings.getPast.useQuery();
  const upcoming = (upcomingQuery.data ?? []) as unknown as BookingCard[];
  const past = (pastQuery.data ?? []) as unknown as BookingCard[];

  const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: "easeOut" as const },
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-6 lg:px-8 pb-24">
      <motion.div className="pt-12 pb-6" {...fadeUp}>
        <h1 className="text-[32px] font-bold text-ink leading-tight">
          My <span className="font-hand inline-block" style={{ transform: "rotate(-2deg)" }}>sessions</span>
        </h1>
        <p className="text-ink-muted text-[15px] mt-2">
          Keep track of your learning journey and upcoming conversations.
        </p>
      </motion.div>

      <div className="mb-8">
        <TabBar tabs={["Upcoming", "Past"]} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Upcoming Tab */}
      {activeTab === "Upcoming" && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" as const }}
          className="flex flex-col gap-5"
        >
          {upcoming.length > 0 ? (
            upcoming.map((s, i) => {
              const teacherName = `${s.teacher.user.firstName} ${s.teacher.user.lastName}`.trim();
              const topic = s.teacher.topics?.[0]?.name ?? "Session";
              const when = new Date(s.startTime).toLocaleString();
              const dur = durationLabel(new Date(s.startTime), new Date(s.endTime));
              const rate = `₹${Number(s.teacher.hourlyRate)}`;
              return (
              <motion.div key={s.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05, ease: "easeOut" as const }}
              >
                <SketchCard tilt={i % 2 === 0 ? -0.4 : 0.3} className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
                    <div className="flex items-start gap-4">
                      <ProfileAvatar seed={teacherName} imageUrl={s.teacher.user.imageUrl} size={48} />
                      <div>
                        <h3 className="text-[17px] font-bold text-ink leading-tight">{teacherName}</h3>
                        <p className="font-hand text-[16px] text-ink-muted mt-0.5">{topic}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[13px] text-ink-muted">{when}</span>
                          <span className="text-[12px] text-ink/40 uppercase tracking-widest font-bold relative inline-flex px-2 py-0.5">
                            {dur}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 30">
                              <path d="M 15 2 L 85 2 C 95 2, 98 15, 95 28 C 85 29, 15 29, 5 28 C 2 15, 5 2, 15 2 Z" fill="none" stroke="currentColor" strokeWidth="1" className="text-ink/[0.12]" vectorEffect="non-scaling-stroke" />
                            </svg>
                          </span>
                          <span className="font-hand text-[14px] text-ink">{rate}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 shrink-0 md:mt-1">
                      <SketchButton variant="ghost" className="!text-[13px] !px-4 !py-2">Reschedule</SketchButton>
                      {s.session?.roomIdentifier ? (
                        <SketchButton
                          variant="primary"
                          className="!text-[13px] !px-5 !py-2"
                          href={`/session/${s.session.roomIdentifier}`}
                        >
                          Join
                        </SketchButton>
                      ) : null}
                    </div>
                  </div>
                  {s.notes && (
                    <div className="mt-4 pt-3 border-t border-ink/[0.06]">
                      <p className="text-[13px] text-ink/40 italic leading-relaxed">
                        <span className="text-ink/60 font-medium not-italic">Prep note:</span> {s.notes}
                      </p>
                    </div>
                  )}
                </SketchCard>
              </motion.div>
            );
            })
          ) : (
            <EmptyState
              illustration={
                <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[100px] h-[100px] text-ink/[0.2]">
                  <rect x="25" y="25" width="70" height="70" rx="6" />
                  <line x1="25" y1="45" x2="95" y2="45" />
                  <circle cx="50" cy="70" r="3" fill="currentColor" stroke="none" />
                  <circle cx="70" cy="70" r="3" fill="currentColor" stroke="none" />
                  <path d="M 55 80 Q 60 85 65 80" />
                </svg>
              }
              heading="Nothing coming up"
              body="Browse teachers and book your first session"
              action={<SketchButton variant="primary" href="/discover">Discover teachers</SketchButton>}
            />
          )}

          {/* Spending mini-summary */}
          <div className="mt-6 px-4">
            <SketchDivider />
            <div className="flex items-center justify-between py-4">
              <span className="text-[14px] text-ink-muted">This week&apos;s total</span>
              <span className="font-hand font-bold text-[20px] text-ink">
                ₹{upcoming.reduce((a, b) => a + Number(b.teacher.hourlyRate), 0)}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Past Tab */}
      {activeTab === "Past" && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" as const }}
          className="flex flex-col gap-4"
        >
          {past.length === 0 ? (
            <EmptyState
              illustration={
                <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[100px] h-[100px] text-ink/[0.2]">
                  <path d="M 25 35 Q 60 10 95 35" />
                  <path d="M 25 35 L 25 90 Q 60 110 95 90 L 95 35" />
                  <path d="M 45 55 Q 60 66 75 55" />
                </svg>
              }
              heading="No past sessions yet"
              body="Once you complete a session, its summary and action items will show up here."
              action={<SketchButton variant="ghost" href="/discover">Find a teacher</SketchButton>}
            />
          ) : (
            <>
              <p className="text-[14px] text-ink-muted mb-2">{past.length} sessions completed</p>
              {past.map((s, i) => {
                const teacherName = `${s.teacher.user.firstName} ${s.teacher.user.lastName}`.trim();
                const topic = s.teacher.topics?.[0]?.name ?? "Session";
                const date = new Date(s.startTime).toLocaleDateString();
                const dur = durationLabel(new Date(s.startTime), new Date(s.endTime));
                const takeaway = s.session?.summary?.aiGeneratedNotes?.slice(0, 140) ?? null;
                return (
            <motion.div key={s.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05, ease: "easeOut" as const }}
            >
              <SketchCard tilt={i % 2 === 0 ? 0.3 : -0.3} className="p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <ProfileAvatar seed={teacherName} imageUrl={s.teacher.user.imageUrl} size={40} className="opacity-80" />
                    <div>
                      <h3 className="text-[16px] font-bold text-ink leading-tight">{teacherName}</h3>
                      <p className="font-hand text-[15px] text-ink-muted mt-0.5">{topic}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {s.feedbacks?.[0]?.rating ? <RatingDisplay rating={s.feedbacks[0].rating} size={12} /> : null}
                    <span className="text-[13px] text-ink/40">{date} · {dur}</span>
                    <div className="flex gap-2">
                      {s.session?.id ? (
                        <SketchButton variant="ghost" className="!text-[12px] !px-3 !py-1.5" href={`/summary/${s.session.id}`}>Summary</SketchButton>
                      ) : null}
                      <SketchButton variant="ghost" className="!text-[12px] !px-3 !py-1.5">Book again</SketchButton>
                    </div>
                  </div>
                </div>
                {takeaway ? (
                  <div className="mt-3 pt-2 border-t border-ink/[0.04]">
                    <p className="text-[12px] text-ink/40 italic leading-relaxed">
                      <span className="text-ink/50 font-medium not-italic">Takeaway:</span> {takeaway}…
                    </p>
                  </div>
                ) : null}
              </SketchCard>
            </motion.div>
          );
              })}
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}

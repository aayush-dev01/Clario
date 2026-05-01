/* Purpose: Learner dashboard UI fed by server-fetched real data. */
"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { SketchCard } from "@/components/ui/SketchCard";
import { SketchButton } from "@/components/ui/SketchButton";
import { SketchDivider } from "@/components/ui/SketchDivider";
import { ProfileAvatar } from "@/components/ui/ProfileAvatar";
import { RatingDisplay } from "@/components/ui/RatingDisplay";

type UpcomingBooking = {
  id: string;
  startTime: Date;
  endTime: Date;
  notes: string | null;
  teacher: {
    user: { firstName: string; lastName: string; imageUrl: string | null };
    topics: { name: string }[];
    hourlyRate: unknown;
  };
  session: { id: string; roomIdentifier: string } | null;
};

type ActionItem = { id: string; task: string; isCompleted: boolean };

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning,";
  if (hour < 17) return "Good afternoon,";
  return "Good evening,";
}

export function LearnerDashboardClient(props: {
  firstName: string;
  imageUrl: string | null;
  totalSessions: number;
  upcoming: UpcomingBooking[];
  actionItems: ActionItem[];
}) {
  const next = props.upcoming[0] ?? null;
  const firstTeacherName = next
    ? `${next.teacher.user.firstName} ${next.teacher.user.lastName}`.trim()
    : "";
  const nextTopic = next?.teacher.topics?.[0]?.name ?? null;

  const stats = useMemo(
    () => [
      { value: String(props.totalSessions), label: "Total sessions" },
      { value: String(props.actionItems.length), label: "Open action items" },
      { value: next ? "1" : "0", label: "Upcoming sessions" },
    ],
    [props.totalSessions, props.actionItems.length, next]
  );

  const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: "easeOut" as const },
  };
  const greeting = getTimeGreeting();

  return (
    <div className="w-full max-w-7xl mx-auto px-6 lg:px-8 pb-24">
      <motion.div className="pt-12 pb-8" {...fadeUp}>
        <h2 className="text-[48px] font-bold text-ink leading-[1.1]">{greeting}</h2>
        <div className="flex items-end gap-4">
          <h1
            className="font-hand font-bold text-[64px] text-ink leading-[1]"
            style={{ transform: "rotate(-2deg)", display: "inline-block" }}
          >
            {props.firstName}
          </h1>
          <div className="pb-3">
            <ProfileAvatar seed={props.firstName} imageUrl={props.imageUrl} size={44} />
          </div>
        </div>
        <p className="text-ink-muted text-[15px] mt-4 max-w-xl">
          {next
            ? `You have a session with ${firstTeacherName} soon. Keep the momentum going.`
            : "No upcoming sessions yet. Pick a teacher and book your first calm, focused session."}
        </p>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" as const }}
      >
        {stats.map((stat, i) => (
          <SketchCard key={i} className="px-6 py-5 flex items-center gap-4">
            <span className="font-hand font-bold text-[36px] text-ink leading-none">{stat.value}</span>
            <span className="text-[14px] text-ink-muted">{stat.label}</span>
          </SketchCard>
        ))}
      </motion.div>

      <motion.div
        className="mb-12"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" as const }}
      >
        <h3 className="text-[20px] font-bold text-ink mb-5">
          Next <span className="font-hand" style={{ transform: "rotate(-1deg)", display: "inline-block" }}>session</span>
        </h3>

        {next ? (
          <SketchCard tilt={-0.5} className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <ProfileAvatar
                    seed={firstTeacherName}
                    imageUrl={next.teacher.user.imageUrl}
                    size={56}
                    className="relative z-10"
                  />
                </div>
                <div>
                  <h4 className="text-[20px] font-bold text-ink leading-tight">{firstTeacherName}</h4>
                  {nextTopic ? (
                    <p className="font-hand text-[18px] text-ink-muted mt-1" style={{ transform: "rotate(-1deg)" }}>
                      {nextTopic}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-col md:items-end gap-2">
                <span className="text-[14px] text-ink-muted font-medium">
                  {next.startTime.toLocaleString()}
                </span>
                <span className="text-[12px] text-ink/40 uppercase tracking-widest font-bold relative inline-flex px-3 py-1">
                  {Math.round((+next.endTime - +next.startTime) / 60000)} min
                </span>
              </div>
              {next.session?.roomIdentifier ? (
                <SketchButton
                  variant="primary"
                  className="!px-8 !py-3 shrink-0"
                  href={`/session/${next.session.roomIdentifier}`}
                >
                  Join session
                </SketchButton>
              ) : null}
            </div>
            {next.notes ? (
              <div className="mt-5 pt-4 border-t border-ink/[0.06]">
                <p className="text-[13px] text-ink/40 italic leading-relaxed">
                  <span className="text-ink/60 font-medium not-italic">Prep note:</span> {next.notes}
                </p>
              </div>
            ) : null}
          </SketchCard>
        ) : (
          <SketchCard tilt={-0.2} className="p-8 text-center">
            <p className="text-[15px] text-ink-muted">No upcoming sessions.</p>
            <div className="mt-5 flex justify-center">
              <SketchButton variant="primary" href="/discover">
                Discover teachers
              </SketchButton>
            </div>
          </SketchCard>
        )}
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-10">
        <div className="flex-[3] min-w-0">
          <h3 className="text-[20px] font-bold text-ink mb-5">
            Upcoming <span className="font-hand" style={{ transform: "rotate(-1deg)", display: "inline-block" }}>sessions</span>
          </h3>

          {props.upcoming.length <= 1 ? (
            <SketchCard className="p-6">
              <p className="text-[14px] text-ink-muted">Nothing else scheduled this week.</p>
            </SketchCard>
          ) : (
            <div className="flex flex-col">
              {props.upcoming.slice(1, 6).map((b, i) => {
                const tn = `${b.teacher.user.firstName} ${b.teacher.user.lastName}`.trim();
                const rating = null;
                return (
                  <React.Fragment key={b.id}>
                    <div className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-4">
                        <ProfileAvatar seed={tn} imageUrl={b.teacher.user.imageUrl} size={36} />
                        <div className="flex flex-col">
                          <span className="text-[15px] font-bold text-ink leading-tight">{tn}</span>
                          <span className="text-[14px] text-ink-muted mt-0.5 leading-tight">
                            {b.teacher.topics?.[0]?.name ?? "Session"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {typeof rating === "number" ? <RatingDisplay rating={rating} size={12} /> : null}
                        <span className="text-[13px] text-ink/40 hidden sm:block">{b.startTime.toLocaleString()}</span>
                        {b.session?.roomIdentifier ? (
                          <Link
                            href={`/session/${b.session.roomIdentifier}`}
                            className="text-[13px] font-bold text-ink hover:text-ink/70 transition-colors"
                          >
                            Open
                          </Link>
                        ) : null}
                      </div>
                    </div>
                    {i < Math.min(props.upcoming.length - 2, 4) && <SketchDivider />}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex-[2] min-w-[280px]">
          <h3 className="text-[20px] font-bold text-ink mb-5">
            Action <span className="font-hand" style={{ transform: "rotate(-1deg)", display: "inline-block" }}>items</span>
          </h3>

          {props.actionItems.length === 0 ? (
            <SketchCard className="p-6">
              <p className="text-[14px] text-ink-muted">No open action items.</p>
            </SketchCard>
          ) : (
            <div className="flex flex-col gap-3">
              {props.actionItems.slice(0, 6).map((a) => (
                <SketchCard key={a.id} className="p-4">
                  <p className="text-[13px] text-ink">{a.task}</p>
                </SketchCard>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


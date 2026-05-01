/* Purpose: Teacher dashboard UI fed by server-fetched real data. */
"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Channel } from "pusher-js";
import { useAuth } from "@clerk/nextjs";
import { SketchCard } from "@/components/ui/SketchCard";
import { ProfileAvatar } from "@/components/ui/ProfileAvatar";
import { RatingDisplay } from "@/components/ui/RatingDisplay";
import { SketchButton } from "@/components/ui/SketchButton";
import { SketchDivider } from "@/components/ui/SketchDivider";
import { getPusherClient } from "@/lib/realtime-client";

type DashboardBooking = {
  id: string;
  startTime: Date;
  endTime: Date;
  learner: { user: { firstName: string; lastName: string; imageUrl: string | null } };
  session: { roomIdentifier: string } | null;
  teacher: { topics: { name: string }[] };
};

type PaymentRow = { amount: number; status: string; createdAt: Date };

type FeedbackRow = {
  id: string;
  rating: number;
  comments: string | null;
  createdAt: Date;
  learner: { user: { firstName: string; lastName: string; imageUrl: string | null } };
};

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning,";
  if (hour < 17) return "Good afternoon,";
  return "Good evening,";
}

export function TeacherDashboardClient(props: {
  firstName: string;
  imageUrl: string | null;
  stats: { sessionsThisMonth: number; earnedThisMonth: number; pendingEscrow: number };
  today: DashboardBooking[];
  upcoming: DashboardBooking[];
  paymentsThisMonth: PaymentRow[];
  feedback: FeedbackRow[];
}) {
  const router = useRouter();
  const { userId } = useAuth();
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!userId) return;

    const scheduleRefresh = () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = setTimeout(() => {
        router.refresh();
      }, 150);
    };

    const channelName = `user-${userId}`;
    let isDisposed = false;
    let activePusher: Awaited<ReturnType<typeof getPusherClient>> = null;
    let activeChannel: Channel | null = null;

    void (async () => {
      activePusher = await getPusherClient();
      if (isDisposed || !activePusher) return;

      activeChannel = activePusher.subscribe(channelName);
      activeChannel.bind("notification", () => {
        scheduleRefresh();
      });
    })();

    const handleFocus = () => {
      router.refresh();
    };
    const intervalId = window.setInterval(() => {
      router.refresh();
    }, 30000);

    window.addEventListener("focus", handleFocus);

    return () => {
      isDisposed = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      activeChannel?.unbind_all();
      activePusher?.unsubscribe(channelName);
    };
  }, [router, userId]);

  const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: "easeOut" as const },
  };

  const visibleSessions = props.today.length > 0 ? props.today : props.upcoming;
  const showingToday = props.today.length > 0;
  const sessionSummary = visibleSessions.length
    ? `You have ${visibleSessions.length} session${visibleSessions.length === 1 ? "" : "s"} ${showingToday ? "today" : "coming up"}.`
    : "No sessions lined up right now.";

  const statCards = [
    { value: String(props.stats.sessionsThisMonth), label: "Sessions this month" },
    { value: `Rs ${props.stats.earnedThisMonth.toLocaleString("en-IN")}`, label: "Earned this month" },
    { value: `Rs ${props.stats.pendingEscrow.toLocaleString("en-IN")}`, label: "Pending payout" },
  ];
  const greeting = getTimeGreeting();

  return (
    <div className="w-full max-w-7xl mx-auto px-6 lg:px-8 pb-24">
      <motion.div className="pt-12 pb-8" {...fadeUp}>
        <h2 className="text-[48px] font-bold text-ink leading-[1.1]">{greeting}</h2>
        <h1 className="font-hand font-bold text-[64px] text-ink leading-[1]" style={{ transform: "rotate(-2deg)", display: "inline-block" }}>
          {props.firstName}
        </h1>
        <p className="text-ink-muted text-[15px] mt-4 max-w-xl">
          {sessionSummary} New bookings and cancellations refresh here automatically.
        </p>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" as const }}
      >
        {statCards.map((stat, i) => (
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
        transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" as const }}
      >
        <h3 className="text-[20px] font-bold text-ink mb-5">
          {showingToday ? (
            <>
              Today&apos;s <span className="font-hand" style={{ transform: "rotate(-1deg)", display: "inline-block" }}>sessions</span>
            </>
          ) : (
            <>
              Upcoming <span className="font-hand" style={{ transform: "rotate(-1deg)", display: "inline-block" }}>sessions</span>
            </>
          )}
        </h3>

        {visibleSessions.length === 0 ? (
          <SketchCard className="p-6">
            <p className="text-[14px] text-ink-muted">
              {showingToday ? "No sessions today - a clear day to prepare." : "No upcoming sessions yet."}
            </p>
          </SketchCard>
        ) : (
          <div className="flex flex-col gap-3">
            {visibleSessions.map((booking) => {
              const learnerName = `${booking.learner.user.firstName} ${booking.learner.user.lastName}`.trim();
              const topic = booking.teacher.topics?.[0]?.name ?? "Session";
              const startTime = new Date(booking.startTime);
              const time = startTime.toLocaleString([], {
                weekday: showingToday ? undefined : "short",
                hour: "numeric",
                minute: "2-digit",
              });
              const duration = `${Math.round((+booking.endTime - +booking.startTime) / 60000)} min`;

              return (
                <SketchCard key={booking.id} className="p-5">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <ProfileAvatar seed={learnerName} imageUrl={booking.learner.user.imageUrl} size={44} />
                      <div>
                        <h4 className="text-[16px] font-bold text-ink">{learnerName}</h4>
                        <p className="font-hand text-[16px] text-ink-muted">{topic}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[14px] text-ink-muted">{time} · {duration}</span>
                      <SketchButton variant="ghost" className="!text-[13px] !px-4 !py-1.5">Prepare</SketchButton>
                      {booking.session?.roomIdentifier ? (
                        <SketchButton variant="primary" className="!text-[13px] !px-4 !py-1.5" href={`/session/${booking.session.roomIdentifier}`}>
                          Open room
                        </SketchButton>
                      ) : null}
                    </div>
                  </div>
                </SketchCard>
              );
            })}
          </div>
        )}
      </motion.div>

      <SketchDivider />

      <motion.div
        className="mb-12 mt-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" as const }}
      >
        <h3 className="text-[20px] font-bold text-ink mb-5">
          Recent <span className="font-hand" style={{ transform: "rotate(-1deg)", display: "inline-block" }}>feedback</span>
        </h3>

        {props.feedback.length === 0 ? (
          <SketchCard className="p-6">
            <p className="text-[14px] text-ink-muted">No feedback yet.</p>
          </SketchCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {props.feedback.slice(0, 3).map((fb, i) => {
              const name = fb.learner.user.firstName || "Learner";
              return (
                <SketchCard key={fb.id} tilt={i === 0 ? -0.6 : i === 1 ? 0.4 : -0.2} className="p-6 flex flex-col justify-between min-h-[180px]">
                  <p className="text-[14px] text-ink leading-relaxed italic">&ldquo;{fb.comments ?? "Great session - clear and actionable."}&rdquo;</p>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ProfileAvatar seed={name} imageUrl={fb.learner.user.imageUrl} size={24} />
                      <span className="text-[13px] font-medium text-ink">{name}</span>
                    </div>
                    <RatingDisplay rating={fb.rating} size={14} />
                  </div>
                  <span className="text-[12px] text-ink/40 mt-2">{new Date(fb.createdAt).toLocaleDateString()}</span>
                </SketchCard>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}

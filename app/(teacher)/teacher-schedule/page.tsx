/* Teacher Schedule - weekly calendar with editable availability + session settings. */
"use client";

export const dynamic = 'force-dynamic';
import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SketchCard } from "@/components/ui/SketchCard";
import { SketchButton } from "@/components/ui/SketchButton";
import { ProfileAvatar } from "@/components/ui/ProfileAvatar";
import { SessionBlock } from "@/components/teacher/SessionBlock";
import { trpc } from "@/lib/trpc/client";
import {
  ADVANCE_BOOKING_DAY_OPTIONS,
  availabilityBlocksToGrid,
  BUFFER_MINUTES_OPTIONS,
  CANCELLATION_NOTICE_HOUR_OPTIONS,
  createEmptyAvailabilityGrid,
  DEFAULT_ADVANCE_BOOKING_DAYS,
  DEFAULT_BUFFER_MINUTES,
  DEFAULT_CANCELLATION_NOTICE_HOURS,
  DEFAULT_SESSION_DURATIONS,
  defaultAvailabilityBlocks,
  EDIT_HOURS,
  gridToAvailabilityBlocks,
  labelForAdvanceBookingDays,
  labelForBufferMinutes,
  labelForCancellationNoticeHours,
  normalizeSessionDurations,
  PREVIEW_HOURS,
  SCHEDULE_DAYS,
  SESSION_DURATION_OPTIONS,
  type AvailabilityGrid,
} from "@/lib/teacher-schedule";

const DAYS = SCHEDULE_DAYS;
const HOURS = EDIT_HOURS;

interface Session {
  bookingId: string;
  learner: string;
  topic: string;
  startMinutes: number;
  endMinutes: number;
  roomIdentifier?: string | null;
}

type UpcomingBooking = {
  id: string;
  startTime: Date | string;
  endTime: Date | string;
  learner: {
    user: { firstName: string; lastName: string };
  };
  teacher: {
    topics: { name: string }[];
  };
  session: { roomIdentifier: string } | null;
};

function formatHour(h: number): string {
  if (h === 0 || h === 12) return "12";
  return h > 12 ? `${h - 12}` : `${h}`;
}

function amPm(h: number): string {
  return h >= 12 ? "PM" : "AM";
}

function formatTimeFromMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${formatHour(hours)}:${minutes.toString().padStart(2, "0")} ${amPm(hours)}`;
}

function formatDurationLabel(duration: number) {
  return `${duration} min`;
}

function formatSessionDurationList(durations: number[]) {
  return normalizeSessionDurations(durations).map(formatDurationLabel).join(", ");
}

function getWeekStart(baseDate: Date, weekOffset: number) {
  const today = new Date(baseDate);
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function OverlayModal({
  title,
  description,
  children,
  onClose,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/20 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-3xl"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onClick={(event) => event.stopPropagation()}
      >
        <SketchCard className="p-6 md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-[22px] font-bold text-ink">{title}</h3>
              <p className="mt-2 text-[14px] text-ink-muted">{description}</p>
            </div>
            <SketchButton variant="ghost" className="!px-3 !py-2 !text-[13px]" onClick={onClose}>
              Close
            </SketchButton>
          </div>
          <div className="mt-6">{children}</div>
        </SketchCard>
      </motion.div>
    </motion.div>
  );
}

function PillButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-2 text-[13px] font-medium transition-colors ${
        active ? "bg-ink text-warm-white" : "text-ink hover:bg-ink/[0.04]"
      }`}
    >
      {label}
      <svg className="absolute inset-0 h-full w-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
        <path
          d="M 3 5 L 97 3 L 98 97 L 2 95 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className={active ? "text-warm-white/30" : "text-ink/[0.12]"}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </button>
  );
}

export default function TeacherSchedulePage() {
  const [selectedSession, setSelectedSession] = useState<(Session & { day: string }) | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [editingPanel, setEditingPanel] = useState<"availability" | "settings" | null>(null);
  const [availabilityDraft, setAvailabilityDraft] = useState<AvailabilityGrid>(createEmptyAvailabilityGrid());
  const [durationDraft, setDurationDraft] = useState<number[]>([...DEFAULT_SESSION_DURATIONS]);
  const [bufferDraft, setBufferDraft] = useState(DEFAULT_BUFFER_MINUTES);
  const [bookingWindowDraft, setBookingWindowDraft] = useState(DEFAULT_ADVANCE_BOOKING_DAYS);
  const [cancelNoticeDraft, setCancelNoticeDraft] = useState(DEFAULT_CANCELLATION_NOTICE_HOURS);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const meQ = trpc.users.getCurrentUser.useQuery();
  const me = meQ.data;
  const teacherProfile = me?.teacherProfile ?? null;
  const teacherId = teacherProfile?.id;
  const currentDurations = normalizeSessionDurations(teacherProfile?.sessionDurations);
  const currentBuffer = teacherProfile?.bufferMinutes ?? DEFAULT_BUFFER_MINUTES;
  const currentBookingWindow = teacherProfile?.advanceBookingDays ?? DEFAULT_ADVANCE_BOOKING_DAYS;
  const currentCancelNotice = teacherProfile?.cancellationNoticeHours ?? DEFAULT_CANCELLATION_NOTICE_HOURS;
  const availabilityBlocks =
    teacherProfile?.availability && teacherProfile.availability.length > 0
      ? teacherProfile.availability
      : defaultAvailabilityBlocks(Math.min(...currentDurations));
  const weekStart = useMemo(() => getWeekStart(new Date(), weekOffset), [weekOffset]);
  const weekEnd = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 7);
    return end;
  }, [weekStart]);
  const minSessionDuration = Math.min(...currentDurations);

  const upcomingQ = trpc.bookings.getUpcoming.useQuery(undefined, { enabled: !!teacherId });
  const slotsQ = trpc.teachers.getAvailableSlots.useQuery(
    { teacherId: teacherId ?? "", weekOffset, durationMinutes: minSessionDuration },
    { enabled: !!teacherId }
  );
  const saveScheduleM = trpc.users.updateTeacherScheduleSettings.useMutation({
    onSuccess: async () => {
      setSaveError(null);
      setSaveMessage("Schedule updated.");
      await Promise.all([meQ.refetch(), upcomingQ.refetch(), slotsQ.refetch()]);
      setEditingPanel(null);
    },
    onError: (error) => {
      setSaveMessage(null);
      setSaveError(error.message || "We couldn't save those changes.");
    },
  });

  const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: "easeOut" as const },
  };

  const availableHourSet = useMemo(() => {
    const set = new Set<string>();
    for (const iso of slotsQ.data ?? []) {
      const slot = new Date(iso);
      set.add(`${slot.getDay()}-${slot.getHours()}`);
    }
    return set;
  }, [slotsQ.data]);

  const weekSessions: Record<string, Session[]> = useMemo(() => {
    const grouped: Record<string, Session[]> = { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: [] };
    const list = (upcomingQ.data ?? []) as unknown as UpcomingBooking[];
    for (const booking of list) {
      const start = new Date(booking.startTime);
      if (start < weekStart || start >= weekEnd) continue;
      const end = new Date(booking.endTime);
      const dayKey = DAYS[(start.getDay() + 6) % 7];
      const learnerName = `${booking.learner.user.firstName} ${booking.learner.user.lastName}`.trim();
      const topic = booking.teacher.topics?.[0]?.name ?? "Session";
      grouped[dayKey].push({
        bookingId: booking.id,
        learner: learnerName,
        topic,
        startMinutes: start.getHours() * 60 + start.getMinutes(),
        endMinutes: end.getHours() * 60 + end.getMinutes(),
        roomIdentifier: booking.session?.roomIdentifier ?? null,
      });
    }
    return grouped;
  }, [upcomingQ.data, weekEnd, weekStart]);

  const openAvailabilityEditor = () => {
    setSaveMessage(null);
    setSaveError(null);
    setAvailabilityDraft(availabilityBlocksToGrid(availabilityBlocks));
    setEditingPanel("availability");
  };

  const openSettingsEditor = () => {
    setSaveMessage(null);
    setSaveError(null);
    setDurationDraft([...currentDurations]);
    setBufferDraft(currentBuffer);
    setBookingWindowDraft(currentBookingWindow);
    setCancelNoticeDraft(currentCancelNotice);
    setEditingPanel("settings");
  };

  const saveAvailability = async () => {
    await saveScheduleM.mutateAsync({
      availability: gridToAvailabilityBlocks(availabilityDraft, HOURS, Math.min(...currentDurations)),
      sessionDurations: currentDurations,
      bufferMinutes: currentBuffer,
      advanceBookingDays: currentBookingWindow,
      cancellationNoticeHours: currentCancelNotice,
    });
  };

  const saveSettings = async () => {
    const nextDurations = normalizeSessionDurations(durationDraft);
    await saveScheduleM.mutateAsync({
      availability: availabilityBlocks.map((block) => ({
        dayOfWeek: block.dayOfWeek,
        startMin: block.startMin,
        endMin: block.endMin,
      })),
      sessionDurations: nextDurations,
      bufferMinutes: bufferDraft,
      advanceBookingDays: bookingWindowDraft,
      cancellationNoticeHours: cancelNoticeDraft,
    });
  };

  const copyMondayToWeekdays = () => {
    setAvailabilityDraft((prev) => {
      const next = { ...prev };
      const mondaySlots = [...prev.Mon];
      for (const day of ["Tue", "Wed", "Thu", "Fri"] as const) {
        next[day] = [...mondaySlots];
      }
      return next;
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-6 lg:px-8 pb-24">
      <motion.div className="pt-12 pb-8" {...fadeUp}>
        <h1 className="text-[32px] font-bold text-ink leading-tight">
          Your <span className="font-hand inline-block" style={{ transform: "rotate(-2deg)" }}>schedule</span>
        </h1>
        {saveMessage ? <p className="mt-3 text-[14px] text-emerald-700">{saveMessage}</p> : null}
        {saveError ? <p className="mt-3 text-[14px] text-red-600">{saveError}</p> : null}
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-8">
        <motion.div
          className="flex-[2] min-w-0"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" as const }}
        >
          <div className="mb-6 flex items-center justify-between">
            <SketchButton
              variant="ghost"
              className="!px-3 !py-1.5 !text-[14px]"
              onClick={() => setWeekOffset((current) => Math.max(current - 1, 0))}
              disabled={weekOffset === 0}
            >
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
                <path d="M12 4L6 10L12 16" />
              </svg>
            </SketchButton>
            <span className="text-[15px] font-medium text-ink">
              {weekStart.toLocaleDateString("en-IN", { month: "short", day: "numeric" })} -{" "}
              {new Date(weekStart.getTime() + 6 * 86400000).toLocaleDateString("en-IN", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <SketchButton
              variant="ghost"
              className="!px-3 !py-1.5 !text-[14px]"
              onClick={() => setWeekOffset((current) => current + 1)}
            >
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
                <path d="M8 4L14 10L8 16" />
              </svg>
            </SketchButton>
          </div>

          <SketchCard className="p-4 overflow-x-auto">
            <div className="grid min-w-[700px] grid-cols-8">
              <div className="pr-2">
                <div className="h-10" />
                {HOURS.map((hour) => (
                  <div key={hour} className="flex h-[60px] items-start justify-end pr-2">
                    <span className="mt-[-8px] text-[11px] text-ink/40">
                      {formatHour(hour)} {amPm(hour)}
                    </span>
                  </div>
                ))}
              </div>

              {DAYS.map((day, dayIndex) => {
                const dateObj = new Date(weekStart.getTime() + dayIndex * 86400000);
                const dateNum = dateObj.getDate();
                const isToday = dateObj.toDateString() === new Date().toDateString();
                const sessions = weekSessions[day] || [];

                return (
                  <div key={day} className="relative border-l border-ink/[0.06]">
                    <div className="flex h-10 flex-col items-center justify-center">
                      <span className="text-[11px] uppercase tracking-widest text-ink-muted">{day}</span>
                      <span
                        className={`mt-0.5 leading-none text-[14px] font-bold ${
                          isToday
                            ? "flex h-7 w-7 items-center justify-center rounded-full bg-ink/[0.06] text-ink"
                            : "text-ink-muted"
                        }`}
                      >
                        {dateNum}
                      </span>
                    </div>

                    <div className="relative">
                      {HOURS.map((hour) => {
                        const isAvailable = availableHourSet.has(`${dateObj.getDay()}-${hour}`);
                        return (
                          <div
                            key={hour}
                            className={`h-[60px] border-t border-ink/[0.04] ${
                              isAvailable ? "bg-ink/[0.02]" : ""
                            }`}
                          />
                        );
                      })}

                      {sessions.map((session, index) => (
                        <SessionBlock
                          key={`${session.bookingId}-${index}`}
                          learnerName={session.learner.split(" ")[0]}
                          topic={session.topic}
                          startMinutes={session.startMinutes}
                          endMinutes={session.endMinutes}
                          isActive={selectedSession?.learner === session.learner && selectedSession?.day === day}
                          onClick={() => setSelectedSession({ ...session, day })}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </SketchCard>

          <AnimatePresence>
            {selectedSession && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" as const }}
                className="mt-4 overflow-hidden"
              >
                <SketchCard className="p-6">
                  <div className="mb-4 flex items-center gap-4">
                    <ProfileAvatar seed={selectedSession.learner} size={48} />
                    <div>
                      <h4 className="text-[17px] font-bold text-ink">{selectedSession.learner}</h4>
                      <p className="font-hand text-[15px] text-ink-muted">{selectedSession.topic}</p>
                    </div>
                  </div>
                  <p className="mb-4 text-[14px] text-ink-muted">
                    {selectedSession.day} - {formatTimeFromMinutes(selectedSession.startMinutes)} -{" "}
                    {formatTimeFromMinutes(selectedSession.endMinutes)}
                  </p>
                  <div className="relative mb-4">
                    <textarea
                      placeholder="Add session notes..."
                      className="h-16 w-full resize-none p-3 text-[14px] font-sans text-ink placeholder:text-ink/30 focus:outline-none"
                    />
                    <svg className="absolute inset-0 h-full w-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
                      <path
                        d="M 2 3 L 98 1 L 99 97 L 1 98 Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        className="text-ink/[0.12]"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
                  </div>
                  <div className="flex gap-3">
                    {selectedSession.roomIdentifier ? (
                      <SketchButton
                        variant="primary"
                        className="!text-[13px] !px-5 !py-2"
                        href={`/session/${selectedSession.roomIdentifier}`}
                      >
                        Start session
                      </SketchButton>
                    ) : (
                      <SketchButton variant="ghost" className="!text-[13px] !px-5 !py-2" disabled>
                        Session unavailable
                      </SketchButton>
                    )}
                    <SketchButton variant="ghost" className="!text-[13px] !px-4 !py-2" onClick={() => setSelectedSession(null)}>
                      Close
                    </SketchButton>
                  </div>
                </SketchCard>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          className="flex-1 min-w-[280px]"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" as const }}
        >
          <SketchCard className="mb-6 p-5">
            <h4 className="mb-4 text-[16px] font-bold text-ink">Your availability</h4>
            <div className="mb-4 grid grid-cols-7 gap-1">
              {DAYS.map((day, index) => (
                <div key={day} className="flex flex-col items-center gap-0.5">
                  <span className="mb-1 text-[10px] uppercase tracking-widest text-ink-muted">{day.charAt(0)}</span>
                  {PREVIEW_HOURS.map((hour) => {
                    const dateObj = new Date(weekStart.getTime() + index * 86400000);
                    const isOn = availableHourSet.has(`${dateObj.getDay()}-${hour}`);
                    return (
                      <div
                        key={`${day}-${hour}`}
                        className={`h-2.5 w-full rounded-sm transition-colors ${
                          isOn ? "bg-ink" : "bg-ink/[0.06]"
                        }`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="mb-3 flex items-center justify-between text-[12px] text-ink/40">
              <span>{formatHour(PREVIEW_HOURS[0])} AM</span>
              <span>{formatHour(PREVIEW_HOURS[PREVIEW_HOURS.length - 1])} PM</span>
            </div>
            <SketchButton variant="ghost" className="w-full !py-2 !text-[13px]" onClick={openAvailabilityEditor}>
              Edit availability
            </SketchButton>
          </SketchCard>

          <SketchCard className="p-5">
            <h4 className="mb-4 text-[16px] font-bold text-ink">Session settings</h4>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-ink-muted">Session durations</span>
                <span className="text-[14px] font-medium text-ink">{formatSessionDurationList(currentDurations)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-ink-muted">Buffer time</span>
                <span className="text-[14px] font-medium text-ink">{labelForBufferMinutes(currentBuffer)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-ink-muted">Advance booking</span>
                <span className="text-[14px] font-medium text-ink">{labelForAdvanceBookingDays(currentBookingWindow)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-ink-muted">Cancellation policy</span>
                <span className="text-[14px] font-medium text-ink">{labelForCancellationNoticeHours(currentCancelNotice)}</span>
              </div>
            </div>
            <div className="mt-4">
              <SketchButton variant="ghost" className="w-full !py-2 !text-[13px]" onClick={openSettingsEditor}>
                Edit settings
              </SketchButton>
            </div>
          </SketchCard>
        </motion.div>
      </div>

      <AnimatePresence>
        {editingPanel === "availability" ? (
          <OverlayModal
            title="Edit availability"
            description="Choose the hours learners can book each week. These slots will show up immediately on your booking page."
            onClose={() => setEditingPanel(null)}
          >
            <div className="overflow-x-auto">
              <div className="grid min-w-[720px] grid-cols-8 gap-2">
                <div />
                {DAYS.map((day) => (
                  <div key={day} className="text-center text-[11px] uppercase tracking-widest text-ink-muted">
                    {day}
                  </div>
                ))}
                {HOURS.map((hour, hourIndex) => (
                  <React.Fragment key={hour}>
                    <div className="flex items-center justify-end pr-2 text-[12px] text-ink/50">
                      {formatHour(hour)} {amPm(hour)}
                    </div>
                    {DAYS.map((day) => (
                      <button
                        key={`${day}-${hour}`}
                        onClick={() =>
                          setAvailabilityDraft((prev) => ({
                            ...prev,
                            [day]: prev[day].map((value, index) => (index === hourIndex ? !value : value)),
                          }))
                        }
                        className={`h-9 rounded-sm text-[11px] transition-colors ${
                          availabilityDraft[day][hourIndex]
                            ? "bg-ink text-warm-white"
                            : "bg-ink/[0.04] text-ink/40 hover:bg-ink/[0.08]"
                        }`}
                      >
                        {formatHour(hour)}
                      </button>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div className="mt-4 flex justify-between gap-3">
              <SketchButton variant="ghost" className="!text-[13px] !px-4 !py-2" onClick={copyMondayToWeekdays}>
                Copy Monday to weekdays
              </SketchButton>
              <SketchButton
                variant="primary"
                className="!text-[13px] !px-5 !py-2"
                onClick={() => void saveAvailability()}
                disabled={saveScheduleM.isPending}
              >
                {saveScheduleM.isPending ? "Saving..." : "Save availability"}
              </SketchButton>
            </div>
          </OverlayModal>
        ) : null}

        {editingPanel === "settings" ? (
          <OverlayModal
            title="Edit session settings"
            description="Update the session lengths and booking rules learners see before they confirm a new session."
            onClose={() => setEditingPanel(null)}
          >
            <div className="space-y-6">
              <div>
                <p className="mb-3 text-[14px] text-ink-muted">Session durations</p>
                <div className="flex flex-wrap gap-2">
                  {SESSION_DURATION_OPTIONS.map((duration) => {
                    const isActive = durationDraft.includes(duration);
                    return (
                      <PillButton
                        key={duration}
                        active={isActive}
                        label={formatDurationLabel(duration)}
                        onClick={() => {
                          setDurationDraft((prev) => {
                            const next = prev.includes(duration)
                              ? prev.filter((value) => value !== duration)
                              : [...prev, duration];
                            return next.length > 0 ? next.sort((a, b) => a - b) : prev;
                          });
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-3 text-[14px] text-ink-muted">Buffer time</p>
                <div className="flex flex-wrap gap-2">
                  {BUFFER_MINUTES_OPTIONS.map((minutes) => (
                    <PillButton
                      key={minutes}
                      active={bufferDraft === minutes}
                      label={labelForBufferMinutes(minutes)}
                      onClick={() => setBufferDraft(minutes)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-3 text-[14px] text-ink-muted">Advance booking window</p>
                <div className="flex flex-wrap gap-2">
                  {ADVANCE_BOOKING_DAY_OPTIONS.map((days) => (
                    <PillButton
                      key={days}
                      active={bookingWindowDraft === days}
                      label={labelForAdvanceBookingDays(days)}
                      onClick={() => setBookingWindowDraft(days)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-3 text-[14px] text-ink-muted">Cancellation policy</p>
                <div className="flex flex-wrap gap-2">
                  {CANCELLATION_NOTICE_HOUR_OPTIONS.map((hours) => (
                    <PillButton
                      key={hours}
                      active={cancelNoticeDraft === hours}
                      label={labelForCancellationNoticeHours(hours)}
                      onClick={() => setCancelNoticeDraft(hours)}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <SketchButton
                variant="primary"
                className="!text-[13px] !px-5 !py-2"
                onClick={() => void saveSettings()}
                disabled={saveScheduleM.isPending}
              >
                {saveScheduleM.isPending ? "Saving..." : "Save settings"}
              </SketchButton>
            </div>
          </OverlayModal>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/* Purpose: Real-time notification bell with dropdown inbox (Socket.io + tRPC). */
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import "@/lib/normalize-clerk-env";
import { Channel } from "pusher-js";
import { trpc } from "@/lib/trpc/client";
import { useAuth } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { getPusherClient } from "@/lib/realtime-client";

type RealtimeNotification = {
  id?: string;
  type?: string;
  title: string;
  message: string;
  isRead?: boolean;
  createdAt?: string;
};

function timeLabel(isoOrDate: string | Date) {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  const delta = Date.now() - d.getTime();
  const mins = Math.floor(delta / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

export function NotificationBell() {
  const { userId } = useAuth();
  const [open, setOpen] = useState(false);
  const [rt, setRt] = useState<RealtimeNotification[]>([]);
  const channelRef = useRef<Channel | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const notificationsQ = trpc.notifications.getAll.useQuery(undefined, { enabled: !!userId });
  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => notificationsQ.refetch(),
  });
  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => notificationsQ.refetch(),
  });

  useEffect(() => {
    if (!userId) return;
    const channelName = `user-${userId}`;
    let isDisposed = false;
    let activePusher: Awaited<ReturnType<typeof getPusherClient>> = null;

    void (async () => {
      activePusher = await getPusherClient();
      if (isDisposed || !activePusher) return;

      const channel = activePusher.subscribe(channelName);
      channelRef.current = channel;

      channel.bind("notification", (n: RealtimeNotification) => {
        setRt((prev) => [{ ...n, isRead: false, createdAt: n.createdAt ?? new Date().toISOString() }, ...prev].slice(0, 20));
      });
    })();

    return () => {
      isDisposed = true;
      activePusher?.unsubscribe(channelName);
      channelRef.current = null;
    };
  }, [userId]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!open) return;
      const t = e.target as Node;
      if (panelRef.current && !panelRef.current.contains(t)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  const merged = useMemo(() => {
    const fetched = notificationsQ.data ?? [];
    const all = [
      ...rt.map((x) => ({
        id: x.id ?? `rt-${x.createdAt ?? Date.now()}`,
        title: x.title,
        message: x.message,
        isRead: x.isRead ?? false,
        createdAt: x.createdAt ?? new Date().toISOString(),
      })),
      ...fetched.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
      })),
    ];
    // de-dupe by id
    const seen = new Set<string>();
    return all.filter((n) => {
      if (seen.has(n.id)) return false;
      seen.add(n.id);
      return true;
    });
  }, [notificationsQ.data, rt]);

  const unread = merged.some((n) => !n.isRead);

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative p-1 text-ink hover:text-ink/70 transition-colors"
        aria-label="Notifications"
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-5 h-5">
          <path d="M10 18c1.1 0 2-.9 2-2H8c0 1.1.9 2 2 2zM15 13V9c0-2.76-1.86-5.07-4.5-5.73V3c0-.55-.45-1-1-1s-1 .45-1 1v.27C5.86 3.93 4 6.24 4 9v4l-1 1v1h14v-1l-1-1z" />
        </svg>
        {unread && <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-ink rounded-full" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute right-0 mt-3 w-[320px] bg-warm-white z-[100]"
          >
            <div className="relative rounded-2xl overflow-hidden">
              {/* sketchy border */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path
                  d="M 2 6 C 28 2, 72 2, 98 6 C 99 20, 99 80, 98 94 C 72 98, 28 98, 2 94 C 1 80, 1 20, 2 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  className="text-ink/[0.12]"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>

              <div className="px-4 pt-4 pb-3 flex items-center justify-between">
                <div className="text-[14px] font-bold text-ink">Notifications</div>
                <button
                  type="button"
                  onClick={() => markAllRead.mutate()}
                  className="text-[12px] text-ink-muted hover:text-ink transition-colors"
                >
                  Mark all read
                </button>
              </div>

              <div className="max-h-[360px] overflow-auto px-2 pb-2">
                {(merged.slice(0, 10).length === 0 || notificationsQ.isLoading) && (
                  <div className="px-3 py-6 text-center text-[13px] text-ink-muted">
                    {notificationsQ.isLoading ? "Loading…" : "No notifications yet."}
                  </div>
                )}

                {merged.slice(0, 10).map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      setRt((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
                      if (!n.isRead && !n.id.startsWith("rt-")) {
                        markRead.mutate({ notificationId: n.id });
                      }
                    }}
                    className="w-full text-left px-3 py-3 rounded-xl hover:bg-ink/[0.02] transition-colors relative flex gap-3"
                  >
                    <div className="pt-1">
                      {!n.isRead ? <span className="w-2 h-2 rounded-full bg-ink inline-block" /> : <span className="w-2 h-2 inline-block" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-[14px] font-bold text-ink truncate">{n.title}</div>
                        <div className="text-[12px] text-ink/40 shrink-0">{timeLabel(n.createdAt)}</div>
                      </div>
                      <div className="text-[13px] text-ink-muted leading-snug mt-0.5 line-clamp-2">{n.message}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


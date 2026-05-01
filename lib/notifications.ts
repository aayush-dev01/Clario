/* Purpose: Create DB notifications and fan them out via Pusher or socket fallback. */

import { db } from "@/lib/db";
import type { NotificationType } from "@/lib/notification-types";
import { logger } from "@/lib/logger";
import { hasPusherServerConfig, pusherServer } from "@/lib/pusher-server";

type RealtimeNotificationPayload = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

async function notifyViaPusher(userId: string, notification: RealtimeNotificationPayload) {
  if (!hasPusherServerConfig || !pusherServer) return false;

  try {
    await pusherServer.trigger(`user-${userId}`, "notification", notification);
    return true;
  } catch (error) {
    logger.warn("notification.pusher.failed", { userId, error: String(error) });
    return false;
  }
}

async function notifyViaSocket(
  userId: string,
  type: NotificationType,
  notification: RealtimeNotificationPayload,
  socketServer?: string
) {
  if (!socketServer) return;

  // Durable retry for transient delivery failures.
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    try {
      const res = await fetch(`${socketServer}/notify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.SOCKET_SERVER_SECRET
            ? { "x-socket-server-secret": process.env.SOCKET_SERVER_SECRET }
            : {}),
        },
        body: JSON.stringify({ userId, notification } satisfies { userId: string; notification: unknown }),
        signal: controller.signal,
      });

      if (res.ok) break;
      if (attempt === maxAttempts) {
        logger.warn("notification.notify.failed", { userId, type, attempt, status: res.status });
      }
    } catch (error) {
      if (attempt === maxAttempts) {
        logger.warn("notification.notify.error", { userId, type, attempt, error: String(error) });
      } else {
        await new Promise((r) => setTimeout(r, 250 * attempt));
      }
    } finally {
      clearTimeout(timeout);
    }
  }
}

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  socketServer?: string
) {
  const notification = await db.notification.create({
    data: { userId, type, title, message },
  });

  const realtimePayload: RealtimeNotificationPayload = {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    isRead: notification.isRead,
    createdAt: notification.createdAt.toISOString(),
  };

  const deliveredViaPusher = await notifyViaPusher(userId, realtimePayload);
  if (!deliveredViaPusher) {
    await notifyViaSocket(userId, type, realtimePayload, socketServer);
  }

  return notification;
}

export function buildBookingRequestMessage(input: {
  learnerName: string;
  dateLabel: string;
  topicName?: string | null;
}) {
  const topic = input.topicName ? ` for ${input.topicName}` : "";
  return `${input.learnerName} wants to book a session on ${input.dateLabel}${topic}.`;
}

export function buildCancelMessage(input: { name: string; dateLabel: string }) {
  return `${input.name} cancelled the session on ${input.dateLabel}.`;
}


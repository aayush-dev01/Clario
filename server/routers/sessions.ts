/* Purpose: Session authorization + state transitions + AI summary trigger. */

import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Anthropic } from "@anthropic-ai/sdk";
import { createNotification } from "@/lib/notifications";
import { NotificationTypes } from "@/lib/notification-types";
import { logger } from "@/lib/logger";
import crypto from "crypto";

function extractActionItems(text: string): string[] {
  const lines = text.split("\n");
  const items: string[] = [];

  for (const line of lines) {
    const match = line.match(/^[\s\-*•\d.]+(.{10,})/);
    if (match && items.length < 5) {
      items.push(match[1].trim());
    }
  }

  if (items.length === 0) {
    items.push("Review the session notes and highlight 3 key takeaways.");
    items.push("Write down one question to bring to the next session.");
    items.push("Complete your first action item within 48 hours.");
  }

  return items;
}

export const sessionsRouter = router({
  verifyAccess: protectedProcedure
    .input(z.object({ roomId: z.string() }))
    .query(async ({ ctx, input }) => {
      const session = await ctx.db.session.findUnique({
        where: { roomIdentifier: input.roomId },
        include: {
          booking: {
            include: {
              teacher: { include: { user: { select: { firstName: true, lastName: true, imageUrl: true } } } },
              learner: { include: { user: { select: { firstName: true, lastName: true, imageUrl: true } } } },
              session: true,
            },
          },
        },
      });
      if (!session) return { authorized: false, session: null, booking: null };

      const learnerUserId = session.booking.learner.userId;
      const teacherUserId = session.booking.teacher.userId;
      const authorized = ctx.userId === learnerUserId || ctx.userId === teacherUserId;
      return { authorized, session, booking: session.booking };
    }),

  start: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const requestId = crypto.randomUUID();
      const session = await ctx.db.session.findUnique({
        where: { id: input.sessionId },
        include: { booking: { include: { teacher: true, learner: true } } },
      });
      if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });

      const learnerUserId = session.booking.learner.userId;
      const teacherUserId = session.booking.teacher.userId;
      if (ctx.userId !== learnerUserId && ctx.userId !== teacherUserId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
      }

      const updated = await ctx.db.session.update({
        where: { id: session.id },
        data: { startedAt: session.startedAt ?? new Date() },
      });

      if (session.booking.status !== "CONFIRMED") {
        await ctx.db.booking.update({
          where: { id: session.bookingId },
          data: { status: "CONFIRMED" },
        });
      }
      logger.info("session.started", {
        requestId,
        userId: ctx.userId,
        sessionId: session.id,
        bookingId: session.bookingId,
      });

      return updated;
    }),

  end: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        learnerNotes: z.string().trim().min(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const requestId = crypto.randomUUID();
      const session = await ctx.db.session.findUnique({
        where: { id: input.sessionId },
        include: {
          booking: {
            include: {
              teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
              learner: { include: { user: { select: { firstName: true, lastName: true } } } },
              payment: true,
            },
          },
        },
      });
      if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });

      const learnerUserId = session.booking.learner.userId;
      const teacherUserId = session.booking.teacher.userId;
      if (ctx.userId !== learnerUserId && ctx.userId !== teacherUserId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
      }

      const endedAt = new Date();
      const updated = await ctx.db.session.update({
        where: { id: session.id },
        data: { endedAt, startedAt: session.startedAt ?? endedAt },
      });

      await ctx.db.booking.update({
        where: { id: session.bookingId },
        data: {
          status: "COMPLETED",
          notes: input.learnerNotes ?? session.booking.notes ?? undefined,
        },
      });

      if (session.booking.payment?.id) {
        await ctx.db.payment.update({
          where: { id: session.booking.payment.id },
          data: { status: "HELD_IN_ESCROW" },
        });
      }

      const socketServer = process.env.SOCKET_SERVER_INTERNAL_URL;
      await Promise.all([
        createNotification(
          session.booking.teacher.userId,
          NotificationTypes.SESSION_COMPLETE,
          "Session complete",
          "Your session has ended. View your summary.",
          socketServer
        ),
        createNotification(
          session.booking.learner.userId,
          NotificationTypes.SESSION_COMPLETE,
          "Session complete",
          "Your session has ended. View your summary.",
          socketServer
        ),
      ]);
      logger.info("session.ended", {
        requestId,
        userId: ctx.userId,
        sessionId: session.id,
        bookingId: session.bookingId,
      });

      // Trigger AI summary generation via Anthropic (best-effort).
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (apiKey) {
        const client = new Anthropic({ apiKey });
        const teacherName = `${session.booking.teacher.user.firstName} ${session.booking.teacher.user.lastName}`.trim() || "Teacher";
        const learnerName = `${session.booking.learner.user.firstName} ${session.booking.learner.user.lastName}`.trim() || "Learner";
        const prompt = `Summarize this Clario live session.\n\nTeacher: ${teacherName}\nLearner: ${learnerName}\n\nProvide: key insights, next steps, and 5 action items.\n\nIf transcript is unavailable, infer a generic but helpful summary.`;

        const text = await client.messages
          .create({
            model: "claude-3-7-sonnet-latest",
            max_tokens: 700,
            messages: [{ role: "user", content: prompt }],
          })
          .then((r) => (Array.isArray(r.content) ? r.content.map((c) => ("text" in c ? c.text : "")).join("\n") : ""))
          .catch(() => "");

        if (text.trim()) {
          await ctx.db.sessionSummary.upsert({
            where: { sessionId: session.id },
            create: {
              sessionId: session.id,
              aiGeneratedNotes: text,
              actionItems: {
                create: extractActionItems(text).map((task) => ({ task })),
              },
            },
            update: {
              aiGeneratedNotes: text,
              actionItems: {
                deleteMany: {},
                create: extractActionItems(text).map((task) => ({ task })),
              },
            },
          });
        }
      }

      return updated;
    }),
});


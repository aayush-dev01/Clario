/* Purpose: Booking lifecycle + payments + session room creation (real Prisma queries). */

import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { createNotification, buildBookingRequestMessage, buildCancelMessage } from "@/lib/notifications";
import { NotificationTypes } from "@/lib/notification-types";
import { logger } from "@/lib/logger";
import crypto from "crypto";
import { TRPCError } from "@trpc/server";
import { defaultAvailabilityBlocks, normalizeSessionDurations } from "@/lib/teacher-schedule";

function fmtDate(d: Date) {
  return d.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function addMinutes(date: Date, minutes: number) {
  const next = new Date(date);
  next.setMinutes(next.getMinutes() + minutes);
  return next;
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

export const bookingsRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        teacherId: z.string(),
        startTime: z.date(),
        durationMinutes: z.number().int().min(15).max(240),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const requestId = crypto.randomUUID();
      const learner = await ctx.db.learnerProfile.findUnique({ where: { userId: ctx.userId }, include: { user: true } });
      if (!learner) throw new Error("Learner profile required");

      const teacher = await ctx.db.teacherProfile.findUnique({
        where: { id: input.teacherId },
        include: { user: true, topics: true, availability: true },
      });
      if (!teacher) throw new Error("Teacher not found");
      if (!teacher.onboardingCompleted || !teacher.isAccepting || teacher.userId.startsWith("seed_")) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Teacher not available for booking." });
      }

      const sessionDurations = normalizeSessionDurations(teacher.sessionDurations);
      if (!sessionDurations.includes(input.durationMinutes)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "That session length is no longer available.",
        });
      }

      if (input.startTime.getTime() <= Date.now()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Please choose a future time slot.",
        });
      }

      const latestStart = new Date();
      latestStart.setDate(latestStart.getDate() + (teacher.advanceBookingDays ?? 14));
      if (input.startTime.getTime() > latestStart.getTime()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "That time is outside the teacher's booking window.",
        });
      }

      const endTime = new Date(input.startTime);
      endTime.setMinutes(endTime.getMinutes() + input.durationMinutes);
      const bufferMinutes = teacher.bufferMinutes ?? 0;

      const availabilityBlocks =
        teacher.availability.length > 0
          ? teacher.availability
          : defaultAvailabilityBlocks(Math.min(...sessionDurations));
      const startMin = input.startTime.getHours() * 60 + input.startTime.getMinutes();
      const endWithBufferMin = startMin + input.durationMinutes + bufferMinutes;
      const isWithinAvailability = availabilityBlocks.some(
        (block) =>
          block.dayOfWeek === input.startTime.getDay() &&
          startMin >= block.startMin &&
          endWithBufferMin <= block.endMin
      );

      if (!isWithinAvailability) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "That slot is outside this teacher's availability.",
        });
      }

      const roomIdentifier = crypto.randomUUID();
      const bookingAmount = roundCurrency(Number(teacher.hourlyRate) * (input.durationMinutes / 60));
      const platformFee = roundCurrency(bookingAmount * 0.15);

      const booking = await ctx.db.$transaction(async (tx) => {
        const overlap = await tx.booking.findFirst({
          where: {
            teacherId: teacher.id,
            status: { in: ["CONFIRMED", "PENDING"] },
            startTime: { lt: addMinutes(endTime, bufferMinutes) },
            endTime: { gt: addMinutes(input.startTime, -bufferMinutes) },
          },
          select: { id: true },
        });
        if (overlap) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "This slot was just booked. Please choose another time.",
          });
        }

        return tx.booking.create({
          data: {
            teacherId: teacher.id,
            learnerId: learner.id,
            startTime: input.startTime,
            endTime,
            status: "CONFIRMED",
            notes: input.notes,
            session: {
              create: { roomIdentifier },
            },
            payment: {
              create: {
                stripePaymentIntentId: crypto.randomUUID(),
                amount: bookingAmount,
                platformFee,
                status: "UNPAID",
              },
            },
          },
          include: {
            session: true,
            teacher: { include: { user: true } },
            learner: { include: { user: true } },
          },
        });
      });

      const socketServer = process.env.SOCKET_SERVER_INTERNAL_URL;
      await createNotification(
        teacher.userId,
        NotificationTypes.BOOKING_REQUEST,
        "New booking request",
        buildBookingRequestMessage({
          learnerName: `${learner.user.firstName} ${learner.user.lastName}`.trim() || "A learner",
          dateLabel: fmtDate(input.startTime),
          topicName: teacher.topics[0]?.name ?? null,
        }),
        socketServer
      );
      logger.info("booking.created", {
        requestId,
        userId: ctx.userId,
        bookingId: booking.id,
        roomId: booking.session?.roomIdentifier ?? roomIdentifier,
      });

      return {
        booking,
        roomIdentifier: booking.session?.roomIdentifier ?? roomIdentifier,
      };
    }),

  getUpcoming: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.userId },
      include: { learnerProfile: true, teacherProfile: true },
    });
    if (!user) return [];

    const now = new Date();
    const upcomingStatuses: ("CONFIRMED" | "PENDING")[] = ["CONFIRMED", "PENDING"];
    const where =
      user.role === "TEACHER"
        ? { teacherId: user.teacherProfile?.id ?? "__none__", status: { in: upcomingStatuses }, startTime: { gt: now } }
        : { learnerId: user.learnerProfile?.id ?? "__none__", status: { in: upcomingStatuses }, startTime: { gt: now } };

    return ctx.db.booking.findMany({
      where,
      orderBy: { startTime: "asc" },
      include: {
        teacher: { include: { user: true, topics: true } },
        learner: { include: { user: true } },
        session: true,
      },
    });
  }),

  getPast: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.userId },
      include: { learnerProfile: true, teacherProfile: true },
    });
    if (!user) return [];

    const where =
      user.role === "TEACHER"
        ? { teacherId: user.teacherProfile?.id ?? "__none__", status: "COMPLETED" as const }
        : { learnerId: user.learnerProfile?.id ?? "__none__", status: "COMPLETED" as const };

    return ctx.db.booking.findMany({
      where,
      orderBy: { startTime: "desc" },
      include: {
        teacher: { include: { user: true, topics: true } },
        learner: { include: { user: true } },
        feedbacks: true,
        session: { include: { summary: { include: { actionItems: true } } } },
      },
    });
  }),

  cancel: protectedProcedure
    .input(z.object({ bookingId: z.string(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const requestId = crypto.randomUUID();
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.userId },
        include: { learnerProfile: true, teacherProfile: true },
      });
      if (!user) throw new Error("User not found");

      const booking = await ctx.db.booking.findUnique({
        where: { id: input.bookingId },
        include: { teacher: { include: { user: true } }, learner: { include: { user: true } }, session: true },
      });
      if (!booking) throw new Error("Booking not found");

      const isTeacher = user.role === "TEACHER" && booking.teacherId === user.teacherProfile?.id;
      const isLearner = user.role !== "TEACHER" && booking.learnerId === user.learnerProfile?.id;
      if (!isTeacher && !isLearner) throw new Error("Not authorized");

      const status = isTeacher ? "CANCELED_BY_TEACHER" : "CANCELED_BY_LEARNER";
      const updated = await ctx.db.booking.update({
        where: { id: booking.id },
        data: { status, notes: input.reason ?? booking.notes },
      });

      const otherUserId = isTeacher ? booking.learner.userId : booking.teacher.userId;
      const actorName =
        isTeacher
          ? `${booking.teacher.user.firstName} ${booking.teacher.user.lastName}`.trim() || "Teacher"
          : `${booking.learner.user.firstName} ${booking.learner.user.lastName}`.trim() || "Learner";

      const socketServer = process.env.SOCKET_SERVER_INTERNAL_URL;
      await createNotification(
        otherUserId,
        NotificationTypes.BOOKING_CANCELLED,
        "Session cancelled",
        buildCancelMessage({ name: actorName, dateLabel: fmtDate(booking.startTime) }),
        socketServer
      );
      logger.info("booking.cancelled", {
        requestId,
        userId: ctx.userId,
        bookingId: booking.id,
      });

      return updated;
    }),
});


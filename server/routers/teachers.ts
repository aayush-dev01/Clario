/* Purpose: Teacher discovery + profiles + availability slots (real Prisma queries). */

import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import { defaultAvailabilityBlocks, normalizeSessionDurations } from "@/lib/teacher-schedule";

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = date.getDay(); // 0..6
  const diff = (day + 6) % 7; // monday-based
  date.setDate(date.getDate() - diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addMinutes(d: Date, m: number) {
  const x = new Date(d);
  x.setMinutes(x.getMinutes() + m);
  return x;
}

export const teachersRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const teachers = await ctx.db.teacherProfile.findMany({
      where: {
        isAccepting: true,
        onboardingCompleted: true,
        user: {
          NOT: {
            id: {
              startsWith: "seed_",
            },
          },
        },
      },
      include: {
        user: { select: { firstName: true, lastName: true, imageUrl: true } },
        topics: true,
        feedbacks: { select: { rating: true } },
        _count: { select: { bookings: true } },
      },
      orderBy: [{ bookings: { _count: "desc" } }],
    });

    return teachers.map((t) => {
      const avgRating =
        t.feedbacks.length === 0
          ? null
          : t.feedbacks.reduce((a, f) => a + f.rating, 0) / t.feedbacks.length;
      return {
        id: t.id,
        username: t.username,
        bio: t.bio,
        hourlyRate: t.hourlyRate,
        isAccepting: t.isAccepting,
        sessionCount: t._count.bookings,
        avgRating,
        user: t.user,
        topics: t.topics,
      };
    });
  }),

  getByUsername: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ ctx, input }) => {
      const teacher = await ctx.db.teacherProfile.findUnique({
        where: { username: input.username },
        include: {
          user: true,
          topics: true,
          availability: true,
          feedbacks: {
            include: {
              learner: {
                include: {
                  user: { select: { firstName: true, lastName: true, imageUrl: true } },
                },
              },
              booking: { include: { session: true } },
            },
            orderBy: { createdAt: "desc" },
          },
          bookings: {
            include: {
              session: true,
              learner: { include: { user: { select: { firstName: true, lastName: true, imageUrl: true } } } },
            },
            orderBy: { startTime: "asc" },
          },
        },
      });

      if (!teacher) return null;
      if (!teacher.onboardingCompleted || !teacher.isAccepting) return null;
      if (teacher.userId.startsWith("seed_")) return null;
      return teacher;
    }),

  getById: publicProcedure
    .input(z.object({ teacherId: z.string() }))
    .query(async ({ ctx, input }) => {
      const teacher = await ctx.db.teacherProfile.findUnique({
        where: { id: input.teacherId },
        include: {
          user: true,
          topics: true,
          availability: true,
          feedbacks: {
            include: {
              learner: {
                include: {
                  user: { select: { firstName: true, lastName: true, imageUrl: true } },
                },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });
      if (!teacher) return null;
      if (!teacher.onboardingCompleted || !teacher.isAccepting) return null;
      if (teacher.userId.startsWith("seed_")) return null;
      return teacher;
    }),

  getAvailableSlots: publicProcedure
    .input(
      z.object({
        teacherId: z.string(),
        weekOffset: z.number().default(0),
        durationMinutes: z.number().int().min(15).max(240).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const base = startOfWeek(new Date());
      base.setDate(base.getDate() + input.weekOffset * 7);

      const teacher = await ctx.db.teacherProfile.findUnique({
        where: { id: input.teacherId },
        select: {
          sessionDurations: true,
          bufferMinutes: true,
          advanceBookingDays: true,
        },
      });

      if (!teacher) return [];

      const sessionDurations = normalizeSessionDurations(teacher.sessionDurations);
      const durationMinutes = input.durationMinutes ?? Math.min(...sessionDurations);
      const bufferMinutes = teacher.bufferMinutes ?? 0;
      const latestStart = new Date();
      latestStart.setDate(latestStart.getDate() + (teacher.advanceBookingDays ?? 14));

      const availability = await ctx.db.teacherAvailability.findMany({
        where: { teacherId: input.teacherId },
        orderBy: [{ dayOfWeek: "asc" }, { startMin: "asc" }],
      });

      const blocks =
        availability.length > 0
          ? availability
          : defaultAvailabilityBlocks(durationMinutes);

      const weekStart = new Date(base);
      const weekEnd = new Date(base);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const booked = await ctx.db.booking.findMany({
        where: {
          teacherId: input.teacherId,
          status: "CONFIRMED",
          startTime: { gte: weekStart, lt: weekEnd },
        },
        select: { startTime: true, endTime: true },
      });

      const taken = booked.map((b) => [
        addMinutes(b.startTime, -bufferMinutes).getTime(),
        addMinutes(b.endTime, bufferMinutes).getTime(),
      ] as const);
      const out: string[] = [];
      const now = Date.now();

      for (const block of blocks) {
        const day = new Date(weekStart);
        const dayOffset = (block.dayOfWeek - 1 + 7) % 7;
        day.setDate(day.getDate() + dayOffset);
        const start = addMinutes(new Date(day), block.startMin);
        const end = addMinutes(new Date(day), block.endMin);
        const step = Math.max(durationMinutes, 15);

        for (
          let t = new Date(start);
          addMinutes(t, durationMinutes + bufferMinutes) <= end;
          t = addMinutes(t, step)
        ) {
          const slotStart = t.getTime();
          const slotEnd = addMinutes(t, durationMinutes).getTime();
          if (slotStart <= now) continue;
          if (slotStart > latestStart.getTime()) continue;
          const overlaps = taken.some(([s, e]) => slotStart < e && slotEnd > s);
          if (!overlaps) out.push(new Date(slotStart).toISOString());
        }
      }

      return out;
    }),
});

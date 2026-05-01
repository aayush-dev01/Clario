/* Purpose: Persist authorized session chat messages. */

import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const messagesRouter = router({
  list: protectedProcedure
    .input(z.object({ roomId: z.string() }))
    .query(async ({ ctx, input }) => {
      const session = await ctx.db.session.findUnique({
        where: { roomIdentifier: input.roomId },
        include: {
          booking: {
            include: {
              teacher: true,
              learner: true,
            },
          },
        },
      });

      if (!session) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
      }

      const learnerUserId = session.booking.learner.userId;
      const teacherUserId = session.booking.teacher.userId;
      if (ctx.userId !== learnerUserId && ctx.userId !== teacherUserId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
      }

      return ctx.db.message.findMany({
        where: { sessionId: session.id },
        orderBy: { createdAt: "asc" },
        include: {
          sender: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    }),
  create: protectedProcedure
    .input(z.object({ roomId: z.string(), content: z.string().min(1).max(4000) }))
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.session.findUnique({
        where: { roomIdentifier: input.roomId },
        include: { booking: { include: { teacher: true, learner: true } } },
      });

      if (!session) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
      }

      const learnerUserId = session.booking.learner.userId;
      const teacherUserId = session.booking.teacher.userId;
      if (ctx.userId !== learnerUserId && ctx.userId !== teacherUserId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
      }

      return ctx.db.message.create({
        data: {
          sessionId: session.id,
          senderId: ctx.userId,
          content: input.content.trim(),
        },
      });
    }),
});


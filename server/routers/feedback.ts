/* Purpose: Authorized post-session feedback from each participant. */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

export const feedbackRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        rating: z.number().int().min(1).max(5),
        comments: z.string().max(4000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.session.findUnique({
        where: { id: input.sessionId },
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

      if (session.booking.status !== "COMPLETED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Feedback can only be submitted after a completed session.",
        });
      }

      const isTeacher = session.booking.teacher.userId === ctx.userId;
      const isLearner = session.booking.learner.userId === ctx.userId;
      if (!isTeacher && !isLearner) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
      }

      const feedback = await ctx.db.feedback.upsert({
        where: {
          bookingId_authorId: {
            bookingId: session.bookingId,
            authorId: ctx.userId,
          },
        },
        create: {
          bookingId: session.bookingId,
          authorId: ctx.userId,
          teacherId: session.booking.teacherId,
          learnerId: session.booking.learnerId,
          rating: input.rating,
          comments: input.comments?.trim() || null,
        },
        update: {
          rating: input.rating,
          comments: input.comments?.trim() || null,
        },
      });

      return {
        feedback,
        redirectTo: isTeacher ? "/teacher-dashboard" : "/dashboard",
      };
    }),
});

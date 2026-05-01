import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

export const actionItemsRouter = router({
  markComplete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const actionItem = await ctx.db.actionItem.findFirst({
        where: {
          id: input.id,
          sessionSummary: {
            session: {
              booking: {
                OR: [
                  { learner: { userId: ctx.userId } },
                  { teacher: { userId: ctx.userId } },
                ],
              },
            },
          },
        },
        select: { id: true },
      });

      if (!actionItem) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Action item not found' });
      }

      return ctx.db.actionItem.update({
        where: { id: input.id },
        data: { isCompleted: true },
      });
    }),
});

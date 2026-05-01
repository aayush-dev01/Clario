import '@/lib/normalize-clerk-env';
import { initTRPC, TRPCError } from '@trpc/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import superjson from 'superjson';
import { db } from '../lib/db';
import { databaseConfigError, isDatabaseConfigured } from '@/lib/database-config';

export const createContext = async (opts: { req?: Request }) => {
  const { userId } = await auth();
  const user = userId ? await currentUser() : null;
  return {
    userId,
    clerkUser: user,
    db,
  };
};

const t = initTRPC.context<typeof createContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId || !ctx.clerkUser) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated with Clerk' });
  }
  if (!isDatabaseConfigured()) {
    throw new TRPCError({ code: 'SERVICE_UNAVAILABLE', message: databaseConfigError });
  }
  return next({
    ctx: {
      userId: ctx.userId,
      clerkUser: ctx.clerkUser,
      db: ctx.db,
    },
  });
});

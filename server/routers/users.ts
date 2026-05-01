import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import {
  defaultAvailabilityBlocks,
  DEFAULT_ADVANCE_BOOKING_DAYS,
  DEFAULT_BUFFER_MINUTES,
  DEFAULT_CANCELLATION_NOTICE_HOURS,
  normalizeSessionDurations,
  SESSION_DURATION_OPTIONS,
} from "@/lib/teacher-schedule";

const availabilityBlockSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startMin: z.number().int().min(0).max(23 * 60 + 59),
  endMin: z.number().int().min(1).max(24 * 60),
});

const teacherScheduleSettingsSchema = z.object({
  availability: z.array(availabilityBlockSchema),
  sessionDurations: z
    .array(z.number().int().refine((value) => SESSION_DURATION_OPTIONS.includes(value as (typeof SESSION_DURATION_OPTIONS)[number])))
    .min(1),
  bufferMinutes: z.number().int().min(0).max(60),
  advanceBookingDays: z.number().int().min(1).max(60),
  cancellationNoticeHours: z.number().int().min(1).max(168),
});

export const usersRouter = router({
  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    const email =
      ctx.clerkUser.emailAddresses[0]?.emailAddress ??
      `temp-${ctx.userId}@example.com`;
    const firstName = ctx.clerkUser.firstName ?? "";
    const lastName = ctx.clerkUser.lastName ?? "";
    const imageUrl = ctx.clerkUser.imageUrl ?? null;

    // Keep DB profile in sync with Clerk on every request (real-time feel).
    await ctx.db.user.upsert({
      where: { id: ctx.userId },
      create: {
        id: ctx.userId,
        email,
        firstName,
        lastName,
        imageUrl,
      },
      update: {
        email,
        firstName,
        lastName,
        imageUrl,
      },
    });

    return ctx.db.user.findUnique({
      where: { id: ctx.userId },
      include: {
        learnerProfile: true,
        teacherProfile: {
          include: {
            availability: true,
            topics: true,
          },
        },
      },
    });
  }),
  completeOnboarding: protectedProcedure
    .input(z.object({ role: z.enum(['LEARNER', 'TEACHER']) }))
    .mutation(async ({ ctx, input }) => {
      const { role } = input;
      const email = ctx.clerkUser.emailAddresses[0]?.emailAddress ?? `temp-${ctx.userId}@example.com`;
      const firstName = ctx.clerkUser.firstName ?? '';
      const lastName = ctx.clerkUser.lastName ?? '';
      const imageUrl = ctx.clerkUser.imageUrl ?? null;

      const user = await ctx.db.$transaction(async (tx) => {
        if (role === 'TEACHER') {
          await tx.learnerProfile.deleteMany({ where: { userId: ctx.userId } });
        } else {
          await tx.teacherProfile.deleteMany({ where: { userId: ctx.userId } });
        }

        const savedUser = await tx.user.upsert({
          where: { id: ctx.userId },
          create: {
            id: ctx.userId,
            email,
            firstName,
            lastName,
            imageUrl,
            role,
          },
          update: {
            role,
            email,
            firstName,
            lastName,
            imageUrl,
          },
        });

        if (role === 'TEACHER') {
          const username = `teacher_${ctx.userId.slice(-6)}`;
          await tx.teacherProfile.upsert({
            where: { userId: ctx.userId },
            create: {
              userId: ctx.userId,
              username,
              bio: '',
              hourlyRate: 0,
              onboardingCompleted: false,
            },
            update: {},
          });
        } else {
          await tx.learnerProfile.upsert({
            where: { userId: ctx.userId },
            create: {
              userId: ctx.userId,
              goals: '',
              onboardingCompleted: false,
            },
            update: {},
          });
        }

        return savedUser;
      });
      
      const redirectTo = role === 'LEARNER' ? '/onboarding/learner-setup' : '/onboarding/teacher-setup';
      return { success: true, redirectTo, user };
    }),
  teacherSetupProfile: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      topics: z.string(),
      hourlyRate: z.number().min(0),
      bio: z.string(),
      availability: z.array(availabilityBlockSchema).optional(),
      sessionDurations: z.array(z.number().int()).optional(),
      bufferMinutes: z.number().int().optional(),
      advanceBookingDays: z.number().int().optional(),
      cancellationNoticeHours: z.number().int().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const parts = input.name.trim().split(' ');
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ') || '';
      const imageUrl = ctx.clerkUser.imageUrl ?? null;
      const sessionDurations = normalizeSessionDurations(input.sessionDurations);
      const slotMin = Math.min(...sessionDurations);
      const availability =
        input.availability && input.availability.length > 0
          ? input.availability
          : defaultAvailabilityBlocks(slotMin);

      await ctx.db.user.update({
        where: { id: ctx.userId },
        data: { firstName, lastName, imageUrl }
      });

      const topicNames = input.topics.split(',').map((t: string) => t.trim()).filter(Boolean);

      return ctx.db.$transaction(async (tx) => {
        const teacher = await tx.teacherProfile.update({
          where: { userId: ctx.userId },
          data: {
            bio: input.bio,
            hourlyRate: input.hourlyRate,
            sessionDurations,
            bufferMinutes: input.bufferMinutes ?? DEFAULT_BUFFER_MINUTES,
            advanceBookingDays: input.advanceBookingDays ?? DEFAULT_ADVANCE_BOOKING_DAYS,
            cancellationNoticeHours: input.cancellationNoticeHours ?? DEFAULT_CANCELLATION_NOTICE_HOURS,
            onboardingCompleted: true,
            topics: {
              connectOrCreate: topicNames.map((name: string) => ({
                where: { name },
                create: { name }
              }))
            }
          }
        });

        await tx.teacherAvailability.deleteMany({
          where: { teacherId: teacher.id },
        });

        if (availability.length > 0) {
          await tx.teacherAvailability.createMany({
            data: availability.map((block) => ({
              teacherId: teacher.id,
              dayOfWeek: block.dayOfWeek,
              startMin: block.startMin,
              endMin: block.endMin,
              slotMin,
            })),
          });
        }

        return teacher;
      });
    }),
  updateTeacherScheduleSettings: protectedProcedure
    .input(teacherScheduleSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.userId },
        include: { teacherProfile: true },
      });

      if (!user?.teacherProfile) {
        throw new Error("Teacher profile required");
      }

      const sessionDurations = normalizeSessionDurations(input.sessionDurations);
      const slotMin = Math.min(...sessionDurations);

      return ctx.db.$transaction(async (tx) => {
        const teacher = await tx.teacherProfile.update({
          where: { id: user.teacherProfile!.id },
          data: {
            sessionDurations,
            bufferMinutes: input.bufferMinutes,
            advanceBookingDays: input.advanceBookingDays,
            cancellationNoticeHours: input.cancellationNoticeHours,
          },
        });

        await tx.teacherAvailability.deleteMany({
          where: { teacherId: teacher.id },
        });

        if (input.availability.length > 0) {
          await tx.teacherAvailability.createMany({
            data: input.availability.map((block) => ({
              teacherId: teacher.id,
              dayOfWeek: block.dayOfWeek,
              startMin: block.startMin,
              endMin: block.endMin,
              slotMin,
            })),
          });
        }

        return teacher;
      });
    }),
  learnerSetupProfile: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      goals: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const parts = input.name.trim().split(' ');
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ') || '';
      const imageUrl = ctx.clerkUser.imageUrl ?? null;

      await ctx.db.user.update({
        where: { id: ctx.userId },
        data: { firstName, lastName, imageUrl }
      });

      return ctx.db.learnerProfile.upsert({
        where: { userId: ctx.userId },
        create: {
          userId: ctx.userId,
          goals: input.goals,
          onboardingCompleted: true,
        },
        update: {
          goals: input.goals,
          onboardingCompleted: true,
        }
      });
    }),
});

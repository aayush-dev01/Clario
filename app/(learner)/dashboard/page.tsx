export const dynamic = 'force-dynamic';
/* Learner Dashboard — server fetched real data. */

import "@/lib/normalize-clerk-env";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { LearnerDashboardClient } from "@/components/learner/LearnerDashboardClient";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.user.findUnique({
    where: { id: userId },
    include: { learnerProfile: true },
  });

  if (!user) redirect("/onboarding");
  if (user.role === "TEACHER") redirect("/teacher-dashboard");

  const upcoming = await db.booking.findMany({
    where: {
      learner: { userId },
      status: "CONFIRMED",
      startTime: { gt: new Date() },
    },
    orderBy: { startTime: "asc" },
    include: {
      teacher: { include: { user: { select: { firstName: true, lastName: true, imageUrl: true } }, topics: true } },
      session: { select: { id: true, roomIdentifier: true } },
    },
    take: 10,
  });

  const actionItems = await db.actionItem.findMany({
    where: {
      isCompleted: false,
      sessionSummary: {
        session: {
          booking: {
            learner: { userId },
          },
        },
      },
    },
    orderBy: { id: "desc" },
    take: 12,
  });

  const totalSessions = await db.booking.count({
    where: { learner: { userId } },
  });

  return (
    <LearnerDashboardClient
      firstName={user.firstName}
      imageUrl={user.imageUrl ?? null}
      totalSessions={totalSessions}
      upcoming={upcoming}
      actionItems={actionItems}
    />
  );
}

export const dynamic = 'force-dynamic';
/* Teacher Dashboard — server fetched real data. */

import "@/lib/normalize-clerk-env";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { TeacherDashboardClient } from "@/components/teacher/TeacherDashboardClient";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfMonth(d: Date) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default async function TeacherDashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.user.findUnique({
    where: { id: userId },
    include: { teacherProfile: true },
  });
  if (!user) redirect("/onboarding");
  if (user.role !== "TEACHER") redirect("/dashboard");
  if (!user.teacherProfile) redirect("/onboarding/teacher-setup");

  const teacherId = user.teacherProfile.id;
  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const today = await db.booking.findMany({
    where: {
      teacherId,
      status: { in: ["CONFIRMED", "PENDING"] },
      startTime: { gte: dayStart, lt: dayEnd },
      endTime: { gte: now },
    },
    orderBy: { startTime: "asc" },
    include: {
      learner: { include: { user: { select: { firstName: true, lastName: true, imageUrl: true } } } },
      teacher: { include: { topics: true } },
      session: { select: { roomIdentifier: true } },
    },
  });

  const upcoming = await db.booking.findMany({
    where: {
      teacherId,
      status: { in: ["CONFIRMED", "PENDING"] },
      endTime: { gte: now },
    },
    orderBy: { startTime: "asc" },
    take: 6,
    include: {
      learner: { include: { user: { select: { firstName: true, lastName: true, imageUrl: true } } } },
      teacher: { include: { topics: true } },
      session: { select: { roomIdentifier: true } },
    },
  });

  const monthStart = startOfMonth(now);
  const monthEnd = new Date(monthStart);
  monthEnd.setMonth(monthEnd.getMonth() + 1);

  const paymentsThisMonth = await db.payment.findMany({
    where: {
      booking: {
        teacherId,
        startTime: { gte: monthStart, lt: monthEnd },
      },
    },
    select: { amount: true, status: true, createdAt: true },
  });

  const earnedThisMonth = paymentsThisMonth.reduce((a, p) => a + Number(p.amount), 0);
  const pendingEscrow = await db.payment
    .findMany({
      where: { status: "HELD_IN_ESCROW", booking: { teacherId } },
      select: { amount: true },
    })
    .then((rows) => rows.reduce((a, r) => a + Number(r.amount), 0));

  const sessionsThisMonth = await db.booking.count({
    where: { teacherId, startTime: { gte: monthStart, lt: monthEnd } },
  });

  const feedback = await db.feedback.findMany({
    where: { teacherId },
    orderBy: { createdAt: "desc" },
    include: { learner: { include: { user: { select: { firstName: true, lastName: true, imageUrl: true } } } } },
    take: 12,
  });

  return (
    <TeacherDashboardClient
      firstName={user.firstName}
      imageUrl={user.imageUrl ?? null}
      stats={{ sessionsThisMonth, earnedThisMonth, pendingEscrow }}
      today={today}
      upcoming={upcoming}
      paymentsThisMonth={paymentsThisMonth.map((p) => ({ amount: Number(p.amount), status: p.status, createdAt: p.createdAt }))}
      feedback={feedback}
    />
  );
}

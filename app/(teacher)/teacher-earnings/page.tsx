export const dynamic = 'force-dynamic';
/* Teacher Earnings — real payments + totals. */

import React from "react";
import { SketchCard } from "@/components/ui/SketchCard";
import { SketchButton } from "@/components/ui/SketchButton";
import { SketchDivider } from "@/components/ui/SketchDivider";
import { EarningsBar } from "@/components/teacher/EarningsBar";
import { TransactionRow } from "@/components/teacher/TransactionRow";
import "@/lib/normalize-clerk-env";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

function startOfMonth(d: Date) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default async function TeacherEarningsPage() {
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
  const payments = await db.payment.findMany({
    where: { booking: { teacherId } },
    orderBy: { createdAt: "desc" },
    include: {
      booking: {
        include: {
          learner: { include: { user: { select: { firstName: true, lastName: true } } } },
          teacher: { include: { topics: true } },
        },
      },
    },
    take: 40,
  });

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthTotal = payments
    .filter((p) => p.booking.startTime >= monthStart)
    .reduce((a, p) => a + Number(p.amount), 0);
  const allTime = payments.reduce((a, p) => a + Number(p.amount), 0);
  const pendingPayout = payments
    .filter((p) => p.status === "HELD_IN_ESCROW")
    .reduce((a, p) => a + Number(p.amount), 0);

  const stats = [
    { value: `₹${monthTotal.toLocaleString("en-IN")}`, label: "This month" },
    { value: `₹${allTime.toLocaleString("en-IN")}`, label: "All time" },
    { value: `₹${pendingPayout.toLocaleString("en-IN")}`, label: "Pending payout" },
    { value: "Weekly", label: "Payout cadence" },
  ];

  // Month buckets (last 6 months)
  const buckets: { month: string; amount: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    const start = startOfMonth(d);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    const amt = payments
      .filter((p) => p.booking.startTime >= start && p.booking.startTime < end)
      .reduce((a, p) => a + Number(p.amount), 0);
    buckets.push({ month: start.toLocaleString("en-US", { month: "short" }), amount: amt });
  }

  const maxAmount = Math.max(1, ...buckets.map((d) => d.amount));
  const barWidth = 48;
  const chartMaxHeight = 160;

  return (
    <div className="w-full max-w-7xl mx-auto px-6 lg:px-8 pb-24">
      <div className="pt-12 pb-8">
        <h1 className="text-[32px] font-bold text-ink leading-tight">
          Your <span className="font-hand inline-block" style={{ transform: "rotate(-2deg)" }}>earnings</span>
        </h1>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {stats.map((stat, i) => (
          <SketchCard key={i} className="px-5 py-4">
            <span className="font-hand font-bold text-[28px] text-ink leading-none block">{stat.value}</span>
            <span className="text-[13px] text-ink-muted mt-1 block">{stat.label}</span>
          </SketchCard>
        ))}
      </div>

      {/* Bar Chart */}
      <div className="mb-12">
        <h3 className="text-[20px] font-bold text-ink mb-5">
          Monthly <span className="font-hand" style={{ transform: "rotate(-1deg)", display: "inline-block" }}>overview</span>
        </h3>
        <SketchCard className="p-6 overflow-hidden">
          <svg
            viewBox={`0 0 ${buckets.length * (barWidth + 16) + 60} ${chartMaxHeight + 60}`}
            className="w-full"
            style={{ maxHeight: "260px" }}
          >
            {/* Baseline */}
            <line
              x1="30"
              y1={chartMaxHeight + 20}
              x2={buckets.length * (barWidth + 16) + 50}
              y2={chartMaxHeight + 20}
              stroke="currentColor"
              strokeWidth="1"
              className="text-ink/[0.08]"
            />
            {buckets.map((d, i) => (
              <EarningsBar
                key={d.month}
                amount={d.amount}
                maxAmount={maxAmount}
                label={d.month}
                index={i}
                barWidth={barWidth}
                maxHeight={chartMaxHeight}
              />
            ))}
          </svg>
        </SketchCard>
      </div>

      <SketchDivider />

      {/* Transactions */}
      <div className="mb-12 mt-8">
        <h3 className="text-[20px] font-bold text-ink mb-5">
          Recent <span className="font-hand" style={{ transform: "rotate(-1deg)", display: "inline-block" }}>transactions</span>
        </h3>
        <div className="flex flex-col">
          {payments.slice(0, 12).map((p, i) => {
            const learnerName = `${p.booking.learner.user.firstName} ${p.booking.learner.user.lastName}`.trim();
            const topic = p.booking.teacher.topics?.[0]?.name ?? "Session";
            const date = p.booking.startTime.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            const status = p.status === "PAID_OUT" ? "Paid" : "Pending";
            return (
            <React.Fragment key={i}>
              <TransactionRow topic={topic} learner={learnerName} date={date} amount={Number(p.amount)} status={status} />
              {i < Math.min(11, payments.length - 1) && <SketchDivider />}
            </React.Fragment>
          );
          })}
        </div>
      </div>

      <SketchDivider />

      {/* Payout Settings */}
      <div className="mt-8">
        <h3 className="text-[20px] font-bold text-ink mb-5">
          Payout <span className="font-hand" style={{ transform: "rotate(-1deg)", display: "inline-block" }}>settings</span>
        </h3>
        <SketchCard className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-2.5 h-2.5 rounded-full bg-ink inline-block" />
            <span className="text-[15px] font-medium text-ink">Stripe Connect — Connected</span>
          </div>
          <div className="flex flex-col gap-2 text-[14px] text-ink-muted ml-5">
            <span>Bank account ending in 4242</span>
            <span>Payout schedule: Weekly every Monday</span>
          </div>
          <div className="flex gap-3 mt-6 flex-wrap">
            <SketchButton variant="ghost" className="!text-[13px] !px-4 !py-2">Manage payout settings</SketchButton>
            <SketchButton variant="ghost" className="!text-[13px] !px-4 !py-2">View full transaction history</SketchButton>
          </div>
        </SketchCard>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
import React from "react";
import { redirect } from "next/navigation";
import "@/lib/normalize-clerk-env";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { LearnerNav } from "./LearnerNav";
import { isDatabaseConfigured } from "@/lib/database-config";

export default async function LearnerLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  if (!isDatabaseConfigured()) {
    redirect("/onboarding");
  }

  const user = await db.user
    .findUnique({
      where: { id: userId },
      select: { role: true },
    })
    .catch(() => null);

  // User authenticated with Clerk but no DB record yet → send to onboarding
  if (!user) {
    redirect("/onboarding");
  }

  if (user.role === "TEACHER") {
    redirect("/teacher-dashboard");
  }

  return (
    <div className="min-h-screen bg-warm-white flex flex-col">
      <LearnerNav />
      <main className="flex-1 flex flex-col pt-[64px]">
        {children}
      </main>
    </div>
  );
}

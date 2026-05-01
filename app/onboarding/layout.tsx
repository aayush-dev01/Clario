export const dynamic = 'force-dynamic';
import { ReactNode } from "react";
import "@/lib/normalize-clerk-env";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { resolvePostAuthRoute } from "@/lib/auth-routing";
import { isDatabaseConfigured } from "@/lib/database-config";

export default async function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  if (!isDatabaseConfigured()) {
    return <>{children}</>;
  }

  const user = await db.user
    .findUnique({
      where: { id: userId },
      include: {
        learnerProfile: true,
        teacherProfile: true,
      },
    })
    .catch(() => null);

  if (!user) {
    return <>{children}</>;
  }

  const nextPath = resolvePostAuthRoute(user);
  if (nextPath === "/dashboard" || nextPath === "/teacher-dashboard") {
    // First-login-only guard: if onboarding is done, never show onboarding again.
    redirect(nextPath);
  }

  return <>{children}</>;
}

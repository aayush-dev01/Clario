export const dynamic = 'force-dynamic';
/* Purpose: Server wrapper for onboarding setup availability. */

import { isDatabaseConfigured } from "@/lib/database-config";
import { OnboardingClient } from "./OnboardingClient";

type OnboardingSearchParams = {
  role?: string;
};

export default function OnboardingPage({
  searchParams,
}: {
  searchParams?: OnboardingSearchParams;
}) {
  const initialRole =
    searchParams?.role === "LEARNER" || searchParams?.role === "TEACHER"
      ? searchParams.role
      : null;

  return (
    <OnboardingClient
      databaseConfigured={isDatabaseConfigured()}
      initialRole={initialRole}
    />
  );
}

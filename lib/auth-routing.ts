/* Purpose: Centralized post-auth + onboarding route decisions. */

type ProfileLike = {
  onboardingCompleted?: boolean | null;
  goals?: string | null;
  bio?: string | null;
  hourlyRate?: unknown;
};

type UserLike = {
  role: "LEARNER" | "TEACHER" | "ADMIN";
  learnerProfile?: ProfileLike | null;
  teacherProfile?: ProfileLike | null;
};

type RequestedRole = "LEARNER" | "TEACHER" | null | undefined;

export function resolveRequestedOnboardingRoute(requestedRole?: RequestedRole) {
  if (requestedRole === "TEACHER") return "/onboarding?role=TEACHER";
  if (requestedRole === "LEARNER") return "/onboarding?role=LEARNER";
  return "/onboarding";
}

export function isLearnerOnboarded(user: UserLike) {
  const p = user.learnerProfile;
  if (!p) return false;
  if (p.onboardingCompleted) return true;
  return Boolean(p.goals && p.goals.trim());
}

export function isTeacherOnboarded(user: UserLike) {
  const p = user.teacherProfile;
  if (!p) return false;
  if (p.onboardingCompleted) return true;
  const hourlyRate = typeof p.hourlyRate === "object" && p.hourlyRate !== null && "toNumber" in (p.hourlyRate as Record<string, unknown>)
    ? Number((p.hourlyRate as { toNumber: () => number }).toNumber())
    : Number(p.hourlyRate ?? 0);
  return Boolean(p.bio && p.bio.trim() && hourlyRate > 0);
}

export function resolvePostAuthRoute(user: UserLike) {
  if (user.role === "TEACHER") {
    return isTeacherOnboarded(user) ? "/teacher-dashboard" : "/onboarding/teacher-setup";
  }
  if (user.role === "LEARNER") {
    return isLearnerOnboarded(user) ? "/dashboard" : "/onboarding/learner-setup";
  }
  return "/dashboard";
}

export function resolveSignedInRoute(user: UserLike) {
  if (user.role === "TEACHER") {
    return "/teacher-dashboard";
  }
  return "/dashboard";
}


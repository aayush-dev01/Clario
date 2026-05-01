/* Teacher public profile backed by real teacher record. */
"use client";

export const dynamic = 'force-dynamic';
import React from "react";
import { trpc } from "@/lib/trpc/client";
import { ProfileAvatar } from "@/components/ui/ProfileAvatar";
import { SketchButton } from "@/components/ui/SketchButton";
import { SketchCard } from "@/components/ui/SketchCard";

function inr(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function TeacherProfilePage({ params }: { params: { username: string } }) {
  const teacherQ = trpc.teachers.getByUsername.useQuery({ username: params.username }, { retry: 1 });

  if (teacherQ.isLoading) return <div className="min-h-screen bg-warm-white flex items-center justify-center text-ink-muted">Loading teacher...</div>;
  if (teacherQ.isError) return <div className="min-h-screen bg-warm-white p-8 text-red-600">Could not load this teacher profile. {teacherQ.error.message}</div>;
  if (!teacherQ.data) return <div className="min-h-screen bg-warm-white p-8">Teacher not found.</div>;

  const teacher = teacherQ.data;
  const name = `${teacher.user.firstName} ${teacher.user.lastName}`.trim();
  const avgRating =
    teacher.feedbacks.length > 0
      ? teacher.feedbacks.reduce((a, f) => a + f.rating, 0) / teacher.feedbacks.length
      : null;

  return (
    <div className="w-full max-w-6xl mx-auto px-6 lg:px-8 py-12 pb-24">
      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <SketchCard className="p-6 h-fit lg:sticky lg:top-24">
          <ProfileAvatar seed={name} imageUrl={teacher.user.imageUrl} size={80} className="mb-4" />
          <h1 className="text-2xl font-bold text-ink">{name}</h1>
          <p className="text-ink-muted mt-1">{teacher.topics[0]?.name ?? "Teacher"}</p>
          <p className="mt-4 text-ink text-lg">{inr(Number(teacher.hourlyRate))} / hour</p>
          <SketchButton variant="primary" className="w-full mt-5" href={`/book/${teacher.id}`}>
            Book a session
          </SketchButton>
        </SketchCard>

        <div className="space-y-6">
          <SketchCard className="p-6">
            <h2 className="text-lg font-bold text-ink mb-2">About</h2>
            <p className="text-ink-muted leading-relaxed whitespace-pre-wrap">
              {teacher.bio?.trim() || "This teacher has not added a bio yet."}
            </p>
          </SketchCard>

          <SketchCard className="p-6">
            <h2 className="text-lg font-bold text-ink mb-2">Topics</h2>
            <div className="flex flex-wrap gap-2">
              {teacher.topics.map((t) => (
                <span key={t.id} className="px-3 py-1 rounded-full bg-ink/[0.05] text-sm text-ink-muted">
                  {t.name}
                </span>
              ))}
            </div>
          </SketchCard>

          <SketchCard className="p-6">
            <h2 className="text-lg font-bold text-ink mb-2">Reviews</h2>
            <p className="text-ink-muted mb-4">
              {avgRating ? `Average rating: ${avgRating.toFixed(1)} / 5` : "No reviews yet"}
            </p>
            <div className="space-y-3">
              {teacher.feedbacks.slice(0, 5).map((f) => {
                const learnerName = `${f.learner.user.firstName} ${f.learner.user.lastName}`.trim() || "Learner";
                return (
                  <div key={f.id} className="border border-ink/10 rounded-xl p-3">
                    <p className="text-sm font-medium text-ink">{learnerName}</p>
                    <p className="text-xs text-ink-muted">Rating: {f.rating}/5</p>
                    {f.comments ? <p className="text-sm text-ink-muted mt-1">{f.comments}</p> : null}
                  </div>
                );
              })}
            </div>
          </SketchCard>
        </div>
      </div>
    </div>
  );
}

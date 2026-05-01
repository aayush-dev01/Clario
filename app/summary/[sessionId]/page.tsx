export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ProfileAvatar } from "@/components/ui/ProfileAvatar";
import { SketchButton } from "@/components/ui/SketchButton";
import { SketchCard } from "@/components/ui/SketchCard";
import { SketchDivider } from "@/components/ui/SketchDivider";

function durationLabel(start: Date, end: Date) {
  return `${Math.round((+end - +start) / 60000)} min`;
}

export default async function SummaryPage({ params }: { params: { sessionId: string } }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const session = await db.session.findFirst({
    where: {
      OR: [{ id: params.sessionId }, { roomIdentifier: params.sessionId }],
    },
    include: {
      summary: { include: { actionItems: true } },
      booking: {
        include: {
          teacher: { include: { user: { select: { firstName: true, lastName: true, imageUrl: true } }, topics: true } },
          learner: { include: { user: { select: { firstName: true, lastName: true, imageUrl: true } } } },
        },
      },
    },
  });

  if (!session) redirect("/dashboard");

  const isTeacher = session.booking.teacher.userId === userId;
  const isLearner = session.booking.learner.userId === userId;
  if (!isTeacher && !isLearner) redirect("/dashboard");

  const otherUser = isTeacher ? session.booking.learner.user : session.booking.teacher.user;
  const otherName = `${otherUser.firstName} ${otherUser.lastName}`.trim() || (isTeacher ? "Learner" : "Teacher");
  const topic = session.booking.teacher.topics[0]?.name ?? "Session";
  const backHref = isTeacher ? "/teacher-dashboard" : "/dashboard";
  const sessionDate = session.booking.startTime.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const notes = session.summary?.aiGeneratedNotes?.trim();
  const actionItems = session.summary?.actionItems ?? [];
  const learnerNotes = session.booking.notes?.trim();

  return (
    <div className="w-full max-w-[760px] mx-auto px-6 py-12 pb-24">
      <div>
        <h1 className="text-[40px] font-bold text-ink leading-tight">
          Session{" "}
          <span className="font-hand inline-block" style={{ transform: "rotate(-1.5deg)" }}>
            complete
          </span>
        </h1>

        <div className="flex items-center gap-3 mt-5 flex-wrap">
          <ProfileAvatar seed={otherName} imageUrl={otherUser.imageUrl} size={32} />
          <span className="text-[15px] font-bold text-ink">{otherName}</span>
          <span className="text-[14px] text-ink-muted">- {topic}</span>
          <span className="text-[14px] text-ink-muted">- {sessionDate}</span>
          <span className="text-[12px] text-ink-muted px-2 py-0.5 relative">
            {durationLabel(session.booking.startTime, session.booking.endTime)}
          </span>
        </div>
      </div>

      <SketchDivider className="my-10" />

      <section>
        <h2 className="text-[18px] font-bold text-ink mb-6">Summary</h2>
        <SketchCard className="p-6 bg-ink/[0.02]">
          {notes ? (
            <p className="text-[16px] text-ink-muted leading-[1.9] whitespace-pre-wrap">{notes}</p>
          ) : (
            <p className="text-[16px] text-ink-muted leading-[1.9]">
              The session has ended. The AI summary is still being prepared, so check back shortly.
            </p>
          )}
        </SketchCard>
      </section>

      {learnerNotes ? (
        <>
          <SketchDivider className="my-10" />

          <section>
            <h2 className="text-[18px] font-bold text-ink mb-6">Session notes</h2>
            <SketchCard className="p-6 bg-ink/[0.02]">
              <p className="text-[16px] text-ink-muted leading-[1.9] whitespace-pre-wrap">{learnerNotes}</p>
            </SketchCard>
          </section>
        </>
      ) : null}

      <SketchDivider className="my-10" />

      <section>
        <h2 className="text-[18px] font-bold text-ink mb-6">Action items</h2>
        {actionItems.length > 0 ? (
          <div className="flex flex-col gap-3">
            {actionItems.map((item) => (
              <SketchCard key={item.id} className="p-4">
                <p className="text-[15px] text-ink leading-relaxed">{item.task}</p>
              </SketchCard>
            ))}
          </div>
        ) : (
          <p className="text-[15px] text-ink-muted">No action items have been generated yet.</p>
        )}
      </section>

      <div className="flex gap-4 justify-center mt-16 flex-wrap">
        <SketchButton variant="primary" href={`/summary/${session.id}/feedback`} className="!text-[14px] !px-8 !py-2.5">
          Leave feedback
        </SketchButton>
        <SketchButton variant="ghost" href={backHref} className="!text-[14px] !px-8 !py-2.5">
          Back to dashboard
        </SketchButton>
      </div>
    </div>
  );
}

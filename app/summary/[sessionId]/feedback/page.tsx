/* Purpose: Post-session participant feedback. */
"use client";

export const dynamic = "force-dynamic";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { SketchButton } from "@/components/ui/SketchButton";
import { trpc } from "@/lib/trpc/client";

function RatingCircle({ value, selected, onClick }: { value: number; selected: boolean; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="relative"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className={`w-12 h-12 rounded-full flex items-center justify-center font-hand font-bold text-[18px] transition-colors ${
          selected ? "bg-ink text-warm-white" : "text-ink-muted"
        }`}
        animate={selected ? { scale: [1, 1.15, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        {!selected && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink/[0.15]" />
          </svg>
        )}
        0{value}
      </motion.div>
    </motion.button>
  );
}

export default function FeedbackPage({ params }: { params: { sessionId: string } }) {
  const router = useRouter();
  const meQ = trpc.users.getCurrentUser.useQuery();
  const [rating, setRating] = useState<number | null>(null);
  const [wellText, setWellText] = useState("");
  const [improveText, setImproveText] = useState("");
  const [recommend, setRecommend] = useState<"yes" | "maybe" | null>(null);
  const [bookAgain, setBookAgain] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fallbackRoute = meQ.data?.role === "TEACHER" ? "/teacher-dashboard" : "/dashboard";
  const comments = useMemo(() => {
    const parts = [
      wellText.trim() ? `What went well: ${wellText.trim()}` : null,
      improveText.trim() ? `Explore differently: ${improveText.trim()}` : null,
      recommend ? `Would recommend: ${recommend}` : null,
      bookAgain ? "Would like to book again." : null,
    ].filter(Boolean);
    return parts.join("\n\n");
  }, [bookAgain, improveText, recommend, wellText]);

  const submitM = trpc.feedback.create.useMutation({
    onSuccess: (data) => router.push(data.redirectTo),
    onError: (mutationError) => setError(mutationError.message),
  });

  return (
    <div className="w-full max-w-[580px] mx-auto px-6 py-12 pb-24">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h1 className="text-[32px] font-bold text-ink">
          How was your{" "}
          <span className="font-hand inline-block" style={{ transform: "rotate(-2deg)" }}>
            session
          </span>
          ?
        </h1>
        <p className="text-ink-muted text-[16px] mt-3 leading-relaxed">
          Your feedback helps make the next session better.
        </p>
      </motion.div>

      <div className="flex flex-col gap-10 mt-12">
        <div>
          <p className="text-[15px] font-bold text-ink mb-5">How was the session overall?</p>
          <div className="flex gap-3">
            {[1, 2, 3, 4, 5].map((v) => (
              <RatingCircle key={v} value={v} selected={rating === v} onClick={() => setRating(v)} />
            ))}
          </div>
        </div>

        <div>
          <p className="text-[15px] font-bold text-ink mb-4">What went particularly well?</p>
          <textarea
            value={wellText}
            onChange={(e) => setWellText(e.target.value)}
            placeholder="The explanation was clear when..."
            className="w-full min-h-[100px] p-4 bg-transparent text-ink text-[15px] placeholder:text-ink-muted/50 outline-none resize-y leading-relaxed border border-ink/[0.12] rounded-xl"
          />
        </div>

        <div>
          <p className="text-[15px] font-bold text-ink mb-4">
            Is there anything you&apos;d like to explore differently next time?
          </p>
          <textarea
            value={improveText}
            onChange={(e) => setImproveText(e.target.value)}
            placeholder="I'd love to spend more time on..."
            className="w-full min-h-[80px] p-4 bg-transparent text-ink text-[15px] placeholder:text-ink-muted/50 outline-none resize-y leading-relaxed border border-ink/[0.12] rounded-xl"
          />
        </div>

        <div>
          <p className="text-[15px] font-bold text-ink mb-4">
            Would you recommend another session?
          </p>
          <div className="flex gap-3">
            {(["yes", "maybe"] as const).map((opt) => (
              <SketchButton
                key={opt}
                variant={recommend === opt ? "primary" : "ghost"}
                onClick={() => setRecommend(opt)}
                className="!text-[14px] !px-6 !py-2.5"
              >
                {opt === "yes" ? "Yes, definitely" : "Maybe later"}
              </SketchButton>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={bookAgain}
            onChange={(event) => setBookAgain(event.target.checked)}
            className="h-5 w-5 accent-ink"
          />
          <span className="text-[15px] text-ink">I&apos;d like another session like this</span>
        </label>
      </div>

      {error ? <p className="mt-8 text-[14px] text-red-600">{error}</p> : null}

      <div className="mt-12">
        <SketchButton
          variant="primary"
          className="w-full !text-[15px] !py-3"
          disabled={!rating || submitM.isPending}
          onClick={() => {
            if (!rating) return;
            setError(null);
            submitM.mutate({
              sessionId: params.sessionId,
              rating,
              comments: comments || undefined,
            });
          }}
        >
          {submitM.isPending ? "Submitting..." : "Submit feedback"}
        </SketchButton>
        <button
          type="button"
          className="w-full text-center text-[14px] text-ink-faint mt-4 hover:text-ink-muted transition-colors"
          onClick={() => router.push(fallbackRoute)}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}

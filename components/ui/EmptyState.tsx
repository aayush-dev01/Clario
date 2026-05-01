/* EmptyState.tsx — Centered empty state with illustration, heading, body, and optional action. */
import React from "react";

interface EmptyStateProps {
  illustration: React.ReactNode;
  heading: string;
  body: string;
  action?: React.ReactNode;
}

export const EmptyState = ({
  illustration,
  heading,
  body,
  action,
}: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-28 h-28 text-ink-muted opacity-40 mb-8">
        {illustration}
      </div>
      <h3 className="font-hand font-bold text-2xl text-ink mb-3">{heading}</h3>
      <p className="text-ink-muted text-[15px] font-medium max-w-sm leading-relaxed mb-8">
        {body}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};

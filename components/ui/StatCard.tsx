/* StatCard.tsx — A compact stat display with Caveat number and DM Sans label. */
"use client";

import React from "react";
import { SketchCard } from "./SketchCard";

interface StatCardProps {
  value: string;
  label: string;
  className?: string;
}

export const StatCard = ({ value, label, className = "" }: StatCardProps) => {
  return (
    <SketchCard className={`p-6 ${className}`}>
      <p className="font-hand font-bold text-4xl text-ink leading-none">
        {value}
      </p>
      <p className="font-sans text-[13px] text-ink-muted mt-2 tracking-wide">
        {label}
      </p>
    </SketchCard>
  );
};

/* SessionBlock.tsx - Calendar session block rendered as a filled ink rectangle. */
"use client";

import React from "react";

interface SessionBlockProps {
  learnerName: string;
  topic: string;
  startMinutes: number;
  endMinutes: number;
  isActive?: boolean;
  onClick?: () => void;
}

export const SessionBlock = ({
  learnerName,
  topic,
  startMinutes,
  endMinutes,
  isActive = false,
  onClick,
}: SessionBlockProps) => {
  const durationMinutes = Math.max(endMinutes - startMinutes, 30);
  const height = durationMinutes; // 60px per hour == 1px per minute
  const top = startMinutes - 7 * 60; // offset from 7AM

  return (
    <div
      onClick={onClick}
      className={`absolute left-1 right-1 rounded-sm cursor-pointer transition-opacity ${
        isActive ? "bg-ink" : "bg-ink/90 hover:bg-ink"
      }`}
      style={{ top: `${top}px`, height: `${height}px`, minHeight: "48px" }}
    >
      <div className="px-2 py-1.5 overflow-hidden h-full flex flex-col justify-center">
        <span className="font-hand text-[13px] text-warm-white leading-tight truncate">
          {learnerName}
        </span>
        <span className="text-[11px] text-warm-white/80 font-sans leading-tight truncate">
          {topic}
        </span>
      </div>
    </div>
  );
};

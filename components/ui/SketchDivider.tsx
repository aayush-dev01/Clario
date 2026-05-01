/* SketchDivider.tsx — A full-width slightly wavy hand-drawn divider line. */
import React from "react";

interface SketchDividerProps {
  className?: string;
}

export const SketchDivider = ({ className = "" }: SketchDividerProps) => {
  return (
    <div className={`w-full py-2 ${className}`}>
      <svg
        className="w-full h-[8px]"
        preserveAspectRatio="none"
        viewBox="0 0 400 8"
      >
        <path
          d="M 0 4 Q 50 1, 100 4 T 200 4 T 300 4 Q 350 7 400 4"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.75"
          strokeLinecap="round"
          className="text-ink/[0.2]"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
};

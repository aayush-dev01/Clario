/* RatingDisplay.tsx — Five hand-drawn circle SVGs filled proportionally to rating. */
"use client";

import React from "react";

interface RatingDisplayProps {
  rating: number;
  size?: number;
}

export const RatingDisplay = ({ rating, size = 18 }: RatingDisplayProps) => {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const fill =
          rating >= i ? 1 : rating >= i - 0.5 ? 0.5 : 0;

        return (
          <svg
            key={i}
            width={size}
            height={size}
            viewBox="0 0 20 20"
            className="text-ink"
          >
            {/* Background circle */}
            <circle
              cx="10"
              cy="10"
              r="8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              opacity={0.15}
            />
            {/* Fill circle */}
            {fill === 1 && (
              <circle cx="10" cy="10" r="8" fill="currentColor" opacity={0.8} />
            )}
            {fill === 0.5 && (
              <clipPath id={`half-${i}`}>
                <rect x="0" y="0" width="10" height="20" />
              </clipPath>
            )}
            {fill === 0.5 && (
              <circle
                cx="10"
                cy="10"
                r="8"
                fill="currentColor"
                opacity={0.8}
                clipPath={`url(#half-${i})`}
              />
            )}
          </svg>
        );
      })}
      <span className="font-hand font-bold text-xl text-ink ml-2">
        {rating.toFixed(1)}
      </span>
    </div>
  );
};

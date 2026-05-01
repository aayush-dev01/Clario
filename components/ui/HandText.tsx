/**
 * HandText.tsx
 * A simple wrapper component that renders its children in the Caveat font
 * with a slight rotation to break the grid. Used only for accent words.
 */
import React from "react";

interface HandTextProps {
  children: React.ReactNode;
  rotate?: number;
  weight?: "light" | "bold";
}

export const HandText = ({
  children,
  rotate = -2,
  weight = "bold",
}: HandTextProps) => {
  const fontWeightClass = weight === "bold" ? "font-bold" : "font-normal";

  return (
    <span
      className={`font-hand ${fontWeightClass} inline-block`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {children}
    </span>
  );
};

/* Purpose: Small parallax helpers for landing scenes. */
"use client";

import { MotionValue, useReducedMotion, useTransform } from "framer-motion";

export function useParallaxY(
  progress: MotionValue<number>,
  input: [number, number],
  output: [number, number]
) {
  const reduce = useReducedMotion();
  const y = useTransform(progress, input, output);
  return reduce ? (0 as unknown as MotionValue<number>) : y;
}

export function useFadeInOut(
  progress: MotionValue<number>,
  input: [number, number, number],
  output: [number, number, number]
) {
  const opacity = useTransform(progress, input, output);
  return opacity;
}


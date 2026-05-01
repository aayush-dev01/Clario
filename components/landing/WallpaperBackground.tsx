/* Purpose: Premium iOS-style “wallpaper” depth background (no phone). */
"use client";

import React, { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

type WallpaperBackgroundProps = {
  className?: string;
  intensity?: number; // 0..1
};

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function WallpaperBackground({ className = "", intensity = 0.9 }: WallpaperBackgroundProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--wx", "0");
    el.style.setProperty("--wy", "0");
    if (reduce) return;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty("--wx", String(clamp(x, -0.5, 0.5) * intensity));
      el.style.setProperty("--wy", String(clamp(y, -0.5, 0.5) * intensity));
    };

    el.addEventListener("pointermove", onMove, { passive: true });
    return () => el.removeEventListener("pointermove", onMove);
  }, [reduce, intensity]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={
        {
          ["--wx" as const]: 0,
          ["--wy" as const]: 0,
        } as React.CSSProperties
      }
    >
      {/* base wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(900px 600px at 30% 20%, rgba(107,92,231,0.14), transparent 55%), radial-gradient(800px 520px at 70% 60%, rgba(0,0,0,0.05), transparent 60%)",
        }}
      />

      {/* wallpaper blobs (depth) */}
      <div
        className="absolute -left-[20%] -top-[30%] w-[70%] h-[70%] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 35% 35%, rgba(107,92,231,0.22), rgba(107,92,231,0.05) 55%, transparent 70%)",
          filter: "blur(26px)",
          transform:
            "translate3d(calc(var(--wx) * 10px), calc(var(--wy) * 10px), 0)",
          willChange: "transform",
        }}
      />
      <div
        className="absolute -right-[22%] top-[10%] w-[65%] h-[65%] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 65% 35%, rgba(249,248,246,0.75), rgba(249,248,246,0.20) 55%, transparent 72%)",
          filter: "blur(30px)",
          transform:
            "translate3d(calc(var(--wx) * -14px), calc(var(--wy) * 12px), 0)",
          willChange: "transform",
          mixBlendMode: "multiply",
          opacity: 0.9,
        }}
      />
      <div
        className="absolute left-[10%] bottom-[-25%] w-[85%] h-[75%] rounded-[999px]"
        style={{
          background:
            "radial-gradient(ellipse at 55% 50%, rgba(107,92,231,0.10), transparent 65%)",
          filter: "blur(34px)",
          transform:
            "translate3d(calc(var(--wx) * 18px), calc(var(--wy) * -10px), 0)",
          willChange: "transform",
          opacity: 0.75,
        }}
      />

      {/* fibers + grain + vignette (no images) */}
      <div
        className="absolute inset-0 opacity-[0.20]"
        style={{
          background:
            "repeating-linear-gradient(90deg, rgba(0,0,0,0.008) 0px, rgba(0,0,0,0.008) 1px, rgba(255,255,255,0.008) 2px, rgba(255,255,255,0.008) 4px), repeating-linear-gradient(0deg, rgba(0,0,0,0.006) 0px, rgba(0,0,0,0.006) 1px, rgba(255,255,255,0.006) 2px, rgba(255,255,255,0.006) 3px)",
          animation: "grain-shift 10s ease-in-out infinite",
          mixBlendMode: "multiply",
          willChange: "transform",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.22]"
        style={{
          background:
            "radial-gradient(1200px 800px at 50% 35%, transparent 35%, rgba(0,0,0,0.10) 100%)",
          mixBlendMode: "multiply",
        }}
      />
    </div>
  );
}


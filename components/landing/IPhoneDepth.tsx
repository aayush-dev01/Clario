/* Purpose: 3D iPhone depth prop for cinematic hero. */
"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import gsap from "gsap";

type IPhoneDepthProps = {
  className?: string;
};

type SparkPos =
  | { top: string; left: string; s: number }
  | { top: string; right: string; s: number }
  | { bottom: string; left: string; s: number }
  | { bottom: string; right: string; s: number };

export function IPhoneDepth({ className = "" }: IPhoneDepthProps) {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLDivElement | null>(null);

  // deterministic spark positions
  const sparks = useMemo(
    (): SparkPos[] => [
      { top: "12%", left: "8%", s: 10 },
      { top: "18%", right: "10%", s: 14 },
      { bottom: "20%", left: "12%", s: 12 },
      { bottom: "16%", right: "14%", s: 10 },
    ],
    []
  );

  useEffect(() => {
    if (reduce) return;
    if (!rootRef.current) return;
    const el = rootRef.current;

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.setProperty("--mx", `${x}`);
      el.style.setProperty("--my", `${y}`);
    };

    el.addEventListener("pointermove", onMove);
    return () => el.removeEventListener("pointermove", onMove);
  }, [reduce]);

  useEffect(() => {
    if (!rootRef.current) return;
    if (reduce) return;
    const ctx = gsap.context(() => {
      gsap.to("[data-iphone-float]", {
        y: -10,
        duration: 3.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }, rootRef);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <div
      ref={rootRef}
      className={`relative ${className}`}
      style={
        {
          perspective: "1200px",
          // used by layers for mouse parallax
          ["--mx" as const]: 0,
          ["--my" as const]: 0,
        } as React.CSSProperties
      }
    >
      <div
        data-iphone-float
        className="relative w-[260px] h-[520px] md:w-[300px] md:h-[600px]"
        style={{
          transformStyle: "preserve-3d",
          transform:
            "rotateX(calc(var(--my) * -10deg)) rotateY(calc(var(--mx) * 12deg))",
          willChange: "transform",
        }}
      >
        {/* shadow */}
        <div
          className="absolute inset-0 rounded-[44px]"
          style={{
            transform: "translateZ(-40px) translateY(26px)",
            filter: "blur(26px)",
            background:
              "radial-gradient(ellipse 60% 50% at 50% 60%, rgba(0,0,0,0.20), transparent 65%)",
            opacity: 0.35,
          }}
        />

        {/* phone body */}
        <div className="absolute inset-0 rounded-[44px] bg-[#11110F] border border-white/10" />

        {/* bezel */}
        <div
          className="absolute inset-[10px] rounded-[36px]"
          style={{
            background: "#0B0B09",
            border: "1px solid rgba(255,255,255,0.10)",
          }}
        />

        {/* screen */}
        <div
          className="absolute inset-[18px] rounded-[30px] overflow-hidden"
          style={{
            transform: "translateZ(18px)",
            background:
              "radial-gradient(1200px 700px at 30% 20%, rgba(107,92,231,0.25) 0%, rgba(14,14,12,1) 40%), radial-gradient(900px 600px at 70% 60%, rgba(249,248,246,0.20) 0%, transparent 55%)",
          }}
        >
          {/* top notch */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-7 rounded-full bg-black/60 border border-white/10" />

          {/* “live session” micro UI */}
          <div className="absolute inset-0 p-5 text-warm-white">
            <div className="flex items-center justify-between">
              <div className="text-[11px] uppercase tracking-[0.18em] text-warm-white/70">
                Live session
              </div>
              <div className="flex items-center gap-2 text-[11px] text-warm-white/70">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400/90" />
                REC
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-warm-white/10 border border-white/10 h-36 relative overflow-hidden">
                <div className="absolute inset-0 opacity-50" style={{ background: "radial-gradient(circle at 40% 30%, rgba(249,248,246,0.25), transparent 55%)" }} />
                <div className="absolute bottom-3 left-3 text-[11px] text-warm-white/75 font-medium">
                  Teacher
                </div>
              </div>
              <div className="rounded-2xl bg-warm-white/10 border border-white/10 h-36 relative overflow-hidden">
                <div className="absolute inset-0 opacity-40" style={{ background: "radial-gradient(circle at 60% 30%, rgba(107,92,231,0.22), transparent 55%)" }} />
                <div className="absolute bottom-3 left-3 text-[11px] text-warm-white/75 font-medium">
                  You
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-warm-white/10 border border-white/10 p-4">
              <div className="text-[12px] text-warm-white/85 font-medium">
                Next steps
              </div>
              <div className="mt-2 space-y-2">
                <div className="h-2 rounded-full bg-warm-white/20 w-[92%]" />
                <div className="h-2 rounded-full bg-warm-white/20 w-[76%]" />
                <div className="h-2 rounded-full bg-warm-white/20 w-[86%]" />
              </div>
            </div>

            {/* bottom controls */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-3">
              {["", "", ""].map((_, i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-2xl bg-black/35 border border-white/10"
                />
              ))}
              <div className="w-12 h-10 rounded-2xl bg-red-500/25 border border-red-400/20" />
            </div>
          </div>

          {/* glass glare */}
          <div
            className="absolute inset-0"
            style={{
              transform: "translateZ(28px)",
              background:
                "linear-gradient(120deg, rgba(255,255,255,0.12), transparent 45%)",
              mixBlendMode: "screen",
              opacity: 0.6,
              pointerEvents: "none",
            }}
          />

          {/* micro sparks */}
          {sparks.map((s, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-warm-white/30"
              style={{
                width: s.s,
                height: s.s,
                ...("top" in s ? { top: s.top } : {}),
                ...("bottom" in s ? { bottom: s.bottom } : {}),
                ...("left" in s ? { left: s.left } : {}),
                ...("right" in s ? { right: s.right } : {}),
                transform: "translateZ(30px)",
                filter: "blur(0.2px)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}


/* Purpose: Gentle mouse parallax for depth layers. */
"use client";

import { useEffect } from "react";
import { useReducedMotion } from "framer-motion";

export function useMouseParallaxVars(root: React.RefObject<HTMLElement | null>) {
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (reduce) return;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      // clamp a bit
      const cx = Math.max(-0.5, Math.min(0.5, x));
      const cy = Math.max(-0.5, Math.min(0.5, y));
      el.style.setProperty("--px", `${cx}`);
      el.style.setProperty("--py", `${cy}`);
    };

    el.addEventListener("pointermove", onMove, { passive: true });
    return () => el.removeEventListener("pointermove", onMove);
  }, [reduce, root]);
}


"use client";

/**
 * Footer.tsx
 * Minimal warm-white footer with a faint sketchy top divider.
 */
import React from "react";
import Link from "next/link";

export const Footer = () => {
  const links = ["About", "Teachers", "Privacy", "Contact"];

  return (
    <footer className="w-full bg-warm-white py-[60px] px-6 md:px-12 relative overflow-hidden">
      {/* Sketchy Top Divider */}
      <svg
        className="absolute top-0 left-0 w-full h-[4px] text-ink-faint opacity-50 pointer-events-none"
        preserveAspectRatio="none"
        viewBox="0 0 100 4"
      >
        <path
          d="M 0 2 Q 25 4 50 1 T 100 3"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center md:items-start gap-8 md:gap-0 mt-8">
        {/* Left Col */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <span className="text-[20px] font-bold text-ink tracking-tight select-none mb-1 flex items-center justify-center gap-2">
            <span className="w-3 h-3 text-ink opacity-70">
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              >
                <path d="M 10 2 L 10 18 M 4 6 L 16 14 M 4 14 L 16 6" />
              </svg>
            </span>
            Clario
          </span>
          <p className="text-[14px] text-ink-muted">
            Real human connection, on demand.
          </p>
        </div>

        {/* Right Col */}
        <div className="flex flex-wrap justify-center md:justify-end gap-x-8 gap-y-3">
          {links.map((link) => (
            <Link
              key={link}
              href="#"
              className="text-[13px] text-ink-muted hover:text-ink transition-colors font-medium"
            >
              {link}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-20 w-full flex justify-center">
        <p className="text-[12px] text-ink-faint font-medium">
          &copy; {new Date().getFullYear()} Clario platform. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
};

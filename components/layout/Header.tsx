"use client";

/**
 * Header.tsx
 * A minimal fixed navigation bar. Background transitions from transparent
 * to solid with a faint sketchy border on scroll.
 */
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { SketchButton } from "../ui/SketchButton";

export const Header = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    // Execute on initial load map state correctly
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      className={`fixed top-0 left-0 w-full z-50 transition-colors duration-300 ${
        scrolled ? "bg-warm-white/80 backdrop-blur-md" : "bg-transparent"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Sketchy Bottom Border visible only when scrolled */}
      <div
        className={`absolute bottom-0 left-0 w-full h-[3px] text-[#E8E6E0] pointer-events-none transition-opacity duration-300 ${
          scrolled ? "opacity-100" : "opacity-0"
        }`}
      >
        <svg
          className="w-full h-full"
          preserveAspectRatio="none"
          viewBox="0 0 100 3"
        >
          <motion.path
            d="M 0 1 Q 25 3 50 1 T 100 2"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            vectorEffect="non-scaling-stroke"
            strokeDasharray="140"
            animate={{ strokeDashoffset: scrolled ? 0 : 140 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 h-[80px] flex items-center justify-between">
        {/* Abstract logo handling / wordmark */}
        <Link
          href="/"
          className="text-[20px] font-bold text-ink tracking-tight select-none z-10 flex items-center gap-2"
        >
          {/* Fun little doodle asterisk in logo */}
          <span className="w-4 h-4 text-ink inline-block shrink-0 -mt-1">
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M 10 2 L 10 18 M 4 6 L 16 14 M 4 14 L 16 6" />
            </svg>
          </span>
          Clario
        </Link>

        <nav className="flex items-center gap-4 md:gap-8 z-10">
          <Link
            href="/sign-up"
            className="hidden md:inline-block text-sm font-medium text-ink-muted hover:text-ink transition-colors"
          >
            For teachers
          </Link>
          <Link
            href="/sign-in"
            className="hidden md:inline-block text-sm font-medium text-ink-muted hover:text-ink transition-colors"
          >
            Sign in
          </Link>
          <div className="scale-90 md:scale-100 origin-right">
            <Link href="/sign-up">
              <SketchButton variant="primary" className="!px-5 !py-2 !text-sm">
                Get started
              </SketchButton>
            </Link>
          </div>
        </nav>
      </div>
    </motion.header>
  );
};

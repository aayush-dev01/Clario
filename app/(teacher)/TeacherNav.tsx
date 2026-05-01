"use client";

import React, { useState, useEffect } from "react";
import "@/lib/normalize-clerk-env";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { NotificationBell } from "@/components/ui/NotificationBell";

const NAV_LINKS = [
  { href: "/teacher-dashboard", label: "Dashboard" },
  { href: "/teacher-students", label: "My Students" },
  { href: "/teacher-schedule", label: "Schedule" },
  { href: "/teacher-earnings", label: "Earnings" },
];

function NavSquiggle() {
  return (
    <motion.svg
      layoutId="nav-squiggle"
      className="absolute -bottom-1 left-0 right-0 h-[6px]"
      viewBox="0 0 100 6"
      preserveAspectRatio="none"
    >
      <motion.path
        d="M 0 3 Q 25 0.5, 50 3 T 100 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="text-ink"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" as const }}
        vectorEffect="non-scaling-stroke"
      />
    </motion.svg>
  );
}

export function TeacherNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-colors duration-200 ${
          scrolled ? "bg-warm-white" : "bg-transparent"
        }`}
      >
        <div
          className={`absolute bottom-0 left-0 w-full h-[2px] pointer-events-none transition-opacity duration-200 ${
            scrolled ? "opacity-100" : "opacity-0"
          }`}
        >
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 2">
            <path
              d="M 0 1 Q 100 0, 200 1 T 400 1"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-ink/[0.08]"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/teacher-dashboard"
            className="text-[18px] font-bold text-ink tracking-tight flex items-center gap-1.5 z-10"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-4 h-4">
              <path d="M 10 2 L 10 18 M 4 6 L 16 14 M 4 14 L 16 6" />
            </svg>
            Clario
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => {
              const isActive = pathname?.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative text-[14px] font-medium transition-colors px-1 py-1 ${
                    isActive ? "text-ink" : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {link.label}
                  {isActive && <NavSquiggle />}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-4 z-10">
            <div className="hidden md:block">
              <NotificationBell />
            </div>

            <UserButton
              userProfileMode="navigation"
              userProfileUrl="/teacher-settings"
              appearance={{
                elements: {
                  userButtonAvatarBox: "w-9 h-9 border-2 border-ink/[0.15]",
                },
              }}
              afterSignOutUrl="/"
            />

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-1 text-ink z-10"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <motion.line
                  x1="3" x2="21"
                  animate={mobileOpen ? { y1: 12, y2: 12, rotate: 45 } : { y1: 6, y2: 6, rotate: 0 }}
                  transition={{ duration: 0.2 }}
                />
                <motion.line
                  x1="3" y1="12" x2="21" y2="12"
                  animate={{ opacity: mobileOpen ? 0 : 1 }}
                  transition={{ duration: 0.1 }}
                />
                <motion.line
                  x1="3" x2="21"
                  animate={mobileOpen ? { y1: 12, y2: 12, rotate: -45 } : { y1: 18, y2: 18, rotate: 0 }}
                  transition={{ duration: 0.2 }}
                />
              </svg>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" as const }}
              className="md:hidden overflow-hidden bg-warm-white border-b border-ink/[0.08]"
            >
              <div className="px-6 pb-6 pt-2 flex flex-col gap-0">
                {NAV_LINKS.map((link) => {
                  const isActive = pathname?.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`py-4 text-[18px] font-medium border-b border-ink/[0.06] ${
                        isActive ? "text-ink" : "text-ink-muted"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}

/* StudentRow.tsx — A single student row card with expandable note. */
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SketchCard } from "@/components/ui/SketchCard";
import { ProfileAvatar } from "@/components/ui/ProfileAvatar";
import { SketchButton } from "@/components/ui/SketchButton";

interface StudentRowProps {
  name: string;
  topic: string;
  totalSessions: number;
  lastSession: string;
  tilt?: number;
}

export const StudentRow = ({
  name,
  topic,
  totalSessions,
  lastSession,
  tilt = 0,
}: StudentRowProps) => {
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");

  return (
    <div>
      <SketchCard tilt={tilt} className="p-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <ProfileAvatar seed={name} size={48} />
            <div>
              <h3 className="text-[17px] font-bold text-ink leading-tight">{name}</h3>
              <p className="font-hand text-[15px] text-ink-muted mt-0.5">{topic}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[13px] text-ink-muted px-3 py-1 relative">
              {totalSessions} sessions
              <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path d="M 3 5 L 97 3 L 98 97 L 2 95 Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-ink/[0.12]" vectorEffect="non-scaling-stroke" />
              </svg>
            </span>
            <span className="text-[13px] text-ink/40 hidden sm:block">{lastSession}</span>
            <SketchButton variant="ghost" className="!text-[13px] !px-4 !py-1.5">View history</SketchButton>
            <SketchButton variant="ghost" className="!text-[13px] !px-4 !py-1.5" onClick={() => setNoteOpen(!noteOpen)}>
              {noteOpen ? "Close" : "Add note"}
            </SketchButton>
          </div>
        </div>
      </SketchCard>

      <AnimatePresence>
        {noteOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" as const }}
            className="overflow-hidden"
          >
            <div className="ml-16 mr-4 p-4 mt-2 mb-4 relative">
              <textarea
                className="w-full bg-transparent text-ink text-[14px] font-sans resize-none focus:outline-none placeholder:text-ink/30 h-20 p-3"
                placeholder={`Private note about ${name}...`}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
              <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path d="M 2 3 L 98 1 L 99 97 L 1 98 Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-ink/[0.12]" vectorEffect="non-scaling-stroke" />
              </svg>
              <div className="flex justify-end mt-2">
                <SketchButton variant="ghost" className="!text-[13px] !px-4 !py-1.5">Save note</SketchButton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* TabBar.tsx — Horizontal tab bar with a Framer Motion animated sliding underline. */
"use client";

import React from "react";
import { motion } from "framer-motion";

interface TabBarProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const TabBar = ({ tabs, activeTab, onTabChange }: TabBarProps) => {
  return (
    <div className="flex gap-8 border-b border-ink/[0.08] relative">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`relative pb-4 pt-2 text-[15px] font-medium transition-colors ${
            activeTab === tab ? "text-ink" : "text-ink-muted hover:text-ink"
          }`}
        >
          {tab}
          {activeTab === tab && (
            <motion.div
              layoutId="tab-underline"
              className="absolute bottom-0 left-0 right-0 h-[2px] bg-ink"
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
            />
          )}
        </button>
      ))}
    </div>
  );
};

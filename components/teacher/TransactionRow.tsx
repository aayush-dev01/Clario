/* TransactionRow.tsx — A single transaction row with status pill. */
"use client";

import React from "react";

interface TransactionRowProps {
  topic: string;
  learner: string;
  date: string;
  amount: number;
  status: "Paid" | "Pending";
}

export const TransactionRow = ({
  topic,
  learner,
  date,
  amount,
  status,
}: TransactionRowProps) => {
  return (
    <div className="flex items-center justify-between py-4 gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium text-ink truncate">{topic}</p>
        <p className="text-[13px] text-ink-muted mt-0.5">{learner}</p>
      </div>
      <span className="text-[13px] text-ink/40 shrink-0 hidden sm:block">{date}</span>
      <span className="font-hand font-bold text-[16px] text-ink shrink-0 w-20 text-right">
        ₹{amount.toLocaleString("en-IN")}
      </span>
      <span className={`text-[12px] px-3 py-1 shrink-0 relative ${
        status === "Paid" ? "text-ink" : "text-ink-muted"
      }`}>
        {status}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
          <path
            d="M 4 6 L 96 3 L 97 94 L 3 97 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            className={status === "Paid" ? "text-ink/[0.15]" : "text-ink/[0.08]"}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </span>
    </div>
  );
};

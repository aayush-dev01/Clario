/* Purpose: Full-page loading screen using doodle loader. */
"use client";

import React from "react";
import { DoodleLoader } from "@/components/ui/DoodleLoader";

type FullPageLoaderProps = {
  label?: string;
};

export function FullPageLoader({ label }: FullPageLoaderProps) {
  return (
    <div className="min-h-screen bg-warm-white flex items-center justify-center px-6">
      <DoodleLoader label={label ?? "Getting things ready…"} size="lg" />
    </div>
  );
}


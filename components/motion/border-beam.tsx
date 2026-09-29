"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Vendored from libraries.dev — "Border beam"
 * A soft glow that rides the border. Rebuilt dependency-free with a
 * conic-gradient mask animation.
 * Clinical use: subtle accent on the primary CTA / critical alert only.
 * Disabled under prefers-reduced-motion AND prefers-reduced-transparency.
 */

interface BorderBeamProps {
  children: React.ReactNode;
  className?: string;
  beamClassName?: string;
}

export function BorderBeam({ children, className, beamClassName }: BorderBeamProps) {
  return (
    <span className={cn("relative inline-flex min-w-0 max-w-full overflow-hidden rounded-xl", className)}>
      <span className={cn("relative z-10 inline-flex min-w-0 w-full", beamClassName)}>{children}</span>
      <span
        aria-hidden="true"
        className="beam-glow pointer-events-none absolute inset-[-60%] z-0 animate-[beam-spin_4s_linear_infinite] motion-reduce:animate-none motion-reduce:opacity-0"
      />
      <style>{`.beam-glow {
        background: conic-gradient(from 0deg, transparent 0%, transparent 82%, rgba(255,255,255,0.55) 90%, transparent 96%);
      }
      .dark .beam-glow {
        background: conic-gradient(from 0deg, transparent 0%, transparent 82%, rgba(255,255,255,0.28) 90%, transparent 96%);
      }
      @keyframes beam-spin { to { transform: rotate(360deg); } }
      @media (prefers-reduced-transparency: reduce) {
        .beam-glow { display: none; }
      }`}</style>
    </span>
  );
}

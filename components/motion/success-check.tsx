"use client";

import { cn } from "@/lib/utils";

/**
 * Vendored from transitions.dev — "Success check"
 * Check draws on with a stroke path + soft pop. Tier 3 motion:
 * kept under reduced-motion as a short opacity fade (≤150ms).
 */

export function SuccessCheck({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500",
        // pop-in scale, smooth-out ease
        "animate-[success-pop_250ms_cubic-bezier(0.22,1,0.36,1)_both]",
        "motion-reduce:animate-none",
        className
      )}
    >
      <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none">
        <path
          d="M2.5 6.2 5 8.5 9.5 3.5"
          stroke="white"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-[check-draw_300ms_80ms_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none"
          style={{ strokeDasharray: 12, strokeDashoffset: 0 }}
        />
      </svg>
      <style>{`@keyframes success-pop {
        0% { opacity: 0; transform: scale(0.6); filter: blur(2px); }
        100% { opacity: 1; transform: scale(1); filter: blur(0); }
      }
      @keyframes check-draw {
        0% { stroke-dashoffset: 12; }
        100% { stroke-dashoffset: 0; }
      }`}</style>
    </span>
  );
}

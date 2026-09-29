"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Vendored from transitions.dev — "Number pop-in"
 * Digit flip with blur + stagger on value change.
 * Reduced-motion: instant swap, no blur/translate (Tier 2 → fade only).
 */

interface AnimatedNumberProps {
  value: number;
  className?: string;
  ariaLabel?: string;
}

export function AnimatedNumber({ value, className, ariaLabel }: AnimatedNumberProps) {
  const [display, setDisplay] = React.useState(value);
  const [key, setKey] = React.useState(0);
  const first = React.useRef(true);

  React.useEffect(() => {
    if (first.current) {
      first.current = false;
      setDisplay(value);
      return;
    }
    if (value === display) return;
    setKey((k) => k + 1);
    setDisplay(value);
  }, [value, display]);

  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={ariaLabel ?? String(value)}
      className={cn("inline-flex overflow-hidden tabular-nums", className)}
    >
      <span
        key={key}
        className={cn(
          "inline-block",
          // transitions.dev number pop-in: rise + blur, staggered, smooth-out ease
          "animate-[num-pop-in_350ms_cubic-bezier(0.22,1,0.36,1)_both]",
          "motion-reduce:animate-none"
        )}
      >
        {display}
      </span>
      <style>{`@keyframes num-pop-in {
        0% { opacity: 0; transform: translateY(45%); filter: blur(4px); }
        100% { opacity: 1; transform: translateY(0); filter: blur(0); }
      }`}</style>
    </span>
  );
}

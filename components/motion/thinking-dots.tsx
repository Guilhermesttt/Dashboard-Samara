"use client";

import { cn } from "@/lib/utils";

/**
 * Vendored from libraries.dev — "Thinking orbs" (lightweight dot-matrix variant)
 * Orbs that think while you wait. Dependency-free: 4-dot matrix pulse.
 * Tier 3 (loading feedback) — kept under reduced-motion, slowed to 1.5s.
 */

export function ThinkingDots({ className, label = "Carregando" }: { className?: string; label?: string }) {
  return (
    <span role="status" aria-label={label} className={cn("inline-flex items-center gap-1", className)}>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          aria-hidden="true"
          className="h-1.5 w-1.5 animate-[orb-pulse_1.2s_ease-in-out_infinite] rounded-full bg-current opacity-40 motion-reduce:animate-[orb-pulse_1.5s_ease-in-out_infinite]"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
      <style>{`@keyframes orb-pulse {
        0%, 100% { opacity: 0.25; transform: scale(0.85); }
        50% { opacity: 1; transform: scale(1.15); }
      }`}</style>
    </span>
  );
}

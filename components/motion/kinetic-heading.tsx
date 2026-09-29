"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Vendored from componentry.dev — "Kinetic Text Reveal" (lightweight CSS variant)
 * Words rise with offset stagger + soft blur. Motion opt-IN: static by default,
 * animated only under (prefers-reduced-motion: no-preference).
 * Full WebGL/3D variants from componentry were deliberately NOT vendored —
 * unsuitable for a clinical dashboard (perf, vestibular risk, dark-mode noise).
 */

interface KineticHeadingProps {
  text: string;
  as?: "h1" | "h2" | "h3";
  className?: string;
}

export function KineticHeading({ text, as = "h1", className }: KineticHeadingProps) {
  const words = React.useMemo(() => text.split(" "), [text]);
  const Tag = as;
  return (
    <Tag className={cn("tracking-tight", className)} aria-label={text}>
      {words.map((word, i) => (
        <span key={i} aria-hidden="true" className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          <span
            className="kinetic-word inline-block"
            style={{ animationDelay: `${i * 45}ms` }}
          >
            {word}
            {i < words.length - 1 ? " " : ""}
          </span>
        </span>
      ))}
      <style>{`.kinetic-word { opacity: 1; }
      @media (prefers-reduced-motion: no-preference) {
        .kinetic-word {
          opacity: 0;
          animation: kinetic-rise 400ms cubic-bezier(0.22,1,0.36,1) forwards;
        }
        @keyframes kinetic-rise {
          0% { opacity: 0; transform: translateY(55%); filter: blur(4px); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
      }`}</style>
    </Tag>
  );
}

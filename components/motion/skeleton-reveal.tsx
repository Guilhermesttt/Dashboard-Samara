"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Vendored from transitions.dev — "Skeleton loader and reveal"
 * Pulse placeholder → content cross-fade (≤200ms, opacity only under
 * reduced-motion). Keeps layout stable: skeleton reserves final size.
 */

interface SkeletonRevealProps {
  loading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function SkeletonReveal({ loading, skeleton, children, className }: SkeletonRevealProps) {
  if (loading) {
    return (
      <div aria-busy="true" aria-live="polite" className={cn("animate-pulse", className)}>
        {skeleton}
      </div>
    );
  }
  return (
    <div
      className={cn(
        "animate-[skeleton-reveal_200ms_ease-out_both] motion-reduce:animate-none",
        className
      )}
    >
      {children}
      <style>{`@keyframes skeleton-reveal {
        0% { opacity: 0; }
        100% { opacity: 1; }
      }`}</style>
    </div>
  );
}

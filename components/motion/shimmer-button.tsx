"use client";

import React from "react";
import { cn } from "@/lib/utils";

/**
 * Vendored from transitions.dev — "P15: Shimmer + P20: Action Button"
 * High-end action button with subtle specular border/surface shimmer
 * and Apple-style spring press physics.
 */

interface ShimmerButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "subtle";
  shimmerColor?: string;
  className?: string;
}

export function ShimmerButton({
  children,
  variant = "primary",
  shimmerColor = "rgba(255, 255, 255, 0.22)",
  className,
  disabled,
  ...props
}: ShimmerButtonProps) {
  const baseVariants = {
    primary:
      "bg-[#A8B29A] hover:bg-[#8D9B7F] active:bg-[#7c8a6f] text-[#111111] shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_4px_16px_rgba(168,178,154,0.22)]",
    secondary:
      "bg-[#232323] hover:bg-[#2c2c2c] active:bg-[#1a1a1a] text-white border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
    subtle:
      "bg-black/[0.04] dark:bg-white/[0.05] hover:bg-black/[0.08] dark:hover:bg-white/[0.08] text-black dark:text-white",
  };

  return (
    <button
      disabled={disabled}
      className={cn(
        "relative overflow-hidden group rounded-xl px-4 py-2.5 text-xs font-semibold select-none cursor-pointer transition-all duration-150 inline-flex items-center justify-center gap-2",
        "active:scale-[0.97] will-change-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
        baseVariants[variant],
        className
      )}
      {...props}
    >
      {/* Dynamic Shimmer Light Sweep (transitions.dev P15) */}
      {!disabled && (
        <span
          aria-hidden="true"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${shimmerColor} 50%, transparent 100%)`,
          }}
          className="absolute inset-0 -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out pointer-events-none"
        />
      )}
      <span className="relative z-10 inline-flex items-center gap-2">
        {children}
      </span>
    </button>
  );
}

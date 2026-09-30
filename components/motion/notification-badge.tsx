"use client";

import React, { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Vendored from transitions.dev — "P1: Notification badge"
 * Diagonal reveal with spring bounce (scale 1.36 -> 1.0, -8.2px, 12.4px offset)
 * and micro-blur entry.
 */

interface NotificationBadgeProps {
  count?: number;
  showZero?: boolean;
  className?: string;
  variant?: "danger" | "sage" | "neutral";
  dotOnly?: boolean;
}

export function NotificationBadge({
  count = 0,
  showZero = false,
  className,
  variant = "danger",
  dotOnly = false,
}: NotificationBadgeProps) {
  const [key, setKey] = useState(0);
  const prevCount = useRef(count);

  useEffect(() => {
    if (count !== prevCount.current) {
      setKey((k) => k + 1);
      prevCount.current = count;
    }
  }, [count]);

  if (count <= 0 && !showZero && !dotOnly) {
    return null;
  }

  const variantStyles = {
    danger: "bg-rose-500 text-white shadow-[0_2px_8px_rgba(244,63,94,0.4)]",
    sage: "bg-[#A8B29A] text-[#111111] shadow-[0_2px_8px_rgba(168,178,154,0.35)]",
    neutral: "bg-white text-black shadow-[0_2px_6px_rgba(0,0,0,0.25)]",
  };

  return (
    <span
      key={key}
      className={cn(
        "inline-flex items-center justify-center font-bold text-center select-none font-mono will-change-transform",
        // transitions.dev P1 Spring timing and diagonal trajectory
        "animate-[p1-badge-pop_400ms_cubic-bezier(0.34,1.36,0.64,1)_both]",
        dotOnly
          ? "w-2.5 h-2.5 rounded-full"
          : "min-w-[18px] h-[18px] px-1.5 text-[10px] leading-none rounded-full",
        variantStyles[variant],
        className
      )}
    >
      {!dotOnly && (count > 99 ? "99+" : count)}
      <style>{`
        @keyframes p1-badge-pop {
          0% {
            opacity: 0;
            transform: translate(-6px, 8px) scale(0.4);
            filter: blur(2px);
          }
          65% {
            transform: translate(0px, 0px) scale(1.36);
            filter: blur(0px);
          }
          100% {
            opacity: 1;
            transform: translate(0px, 0px) scale(1);
            filter: blur(0px);
          }
        }
      `}</style>
    </span>
  );
}

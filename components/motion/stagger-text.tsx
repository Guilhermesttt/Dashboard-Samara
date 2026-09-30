"use client";

import React, { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Vendored from transitions.dev — "P6: Text enter/exit + P18: Stagger text reveal"
 * Smoothly swaps text with micro-Y bob (4px) and cross-blur (2px)
 * for reactive KPI metrics and switching status descriptions.
 */

interface StaggerTextProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
}

export function StaggerText({
  children,
  className,
  delayMs = 0,
}: StaggerTextProps) {
  const [currentText, setCurrentText] = useState(children);
  const [animating, setAnimating] = useState(false);
  const prevChildren = useRef(children);

  useEffect(() => {
    if (children !== prevChildren.current) {
      setAnimating(true);
      const timer = setTimeout(() => {
        setCurrentText(children);
        setAnimating(false);
        prevChildren.current = children;
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [children]);

  return (
    <span
      style={{
        transitionDelay: `${delayMs}ms`,
      }}
      className={cn(
        "inline-block transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
        animating
          ? "opacity-0 translate-y-1.5 blur-[2px]"
          : "opacity-100 translate-y-0 blur-0",
        className
      )}
    >
      {currentText}
    </span>
  );
}

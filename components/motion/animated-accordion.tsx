"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Vendored from transitions.dev — "P21: Accordion expand/collapse with animated chevron"
 * Smooth CSS grid row transition (0fr <-> 1fr) with zero JS height calculations,
 * and spring-eased chevron rotation.
 */

interface AnimatedAccordionProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  badge?: React.ReactNode;
}

export function AnimatedAccordion({
  title,
  subtitle,
  icon,
  children,
  defaultOpen = false,
  className,
  badge,
}: AnimatedAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className={cn(
        "rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#1a1a1a] overflow-hidden transition-all duration-200",
        isOpen ? "shadow-sm" : "hover:border-black/15 dark:hover:border-white/15",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left cursor-pointer select-none transition-colors"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          {icon && (
            <div className="w-9 h-9 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white flex items-center justify-center shrink-0">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-black dark:text-white tracking-tight truncate block">
                {title}
              </span>
              {badge}
            </div>
            {subtitle && (
              <p className="text-xs text-[#767676] dark:text-[#8D9B7F] truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Morphing Chevron (transitions.dev P21) */}
        <div
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 250ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
          className="w-7 h-7 rounded-full flex items-center justify-center text-[#767676] dark:text-[#8D9B7F] shrink-0"
        >
          <ChevronDown className="w-4 h-4 stroke-[2.2]" />
        </div>
      </button>

      {/* Grid Rows 0fr -> 1fr Expander */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: isOpen ? "1fr" : "0fr",
          transition: "grid-template-rows 280ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <div className="overflow-hidden">
          <div
            style={{
              opacity: isOpen ? 1 : 0,
              transform: isOpen ? "translateY(0)" : "translateY(-6px)",
              transition:
                "opacity 240ms ease, transform 280ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
            className="p-4 sm:p-5 pt-0 border-t border-black/[0.04] dark:border-white/[0.04]"
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

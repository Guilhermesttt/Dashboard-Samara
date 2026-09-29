"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Vendored from transitions.dev — "Tabs sliding"
 * Pill indicator follows the active tab (transform + width transition).
 * Adapted: no external deps, 44px touch targets, RTL-safe (logical props),
 * honors prefers-reduced-motion (pill snaps, no slide).
 */

export interface SlidingTab {
  id: string;
  label: string;
}

interface SlidingTabsProps {
  tabs: SlidingTab[];
  value: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
  className?: string;
}

export function SlidingTabs({ tabs, value, onChange, ariaLabel, className }: SlidingTabsProps) {
  const listRef = React.useRef<HTMLDivElement>(null);
  const btnRefs = React.useRef(new Map<string, HTMLButtonElement>());
  const [pill, setPill] = React.useState({ x: 0, width: 0, visible: false });

  const measure = React.useCallback(() => {
    const btn = btnRefs.current.get(value);
    const list = listRef.current;
    if (!btn || !list) return;
    const listRect = list.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    // Logical-aware: use offsetLeft which follows direction automatically
    setPill({
      x: btn.offsetLeft,
      width: btnRect.width,
      visible: true,
    });
    void listRect;
  }, [value]);

  React.useEffect(() => {
    measure();
  }, [measure, tabs]);

  React.useEffect(() => {
    window.addEventListener("resize", measure);
    // Re-measure after fonts settle (prevents pill drift)
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => measure()).catch(() => {});
    }
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const idx = tabs.findIndex((t) => t.id === value);
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const dir = e.key === "ArrowRight" ? 1 : -1;
      // In RTL, arrows flip — getComputedStyle check keeps it logical
      const isRTL = getComputedStyle(listRef.current!).direction === "rtl";
      const next = tabs[(idx + (isRTL ? -dir : dir) + tabs.length) % tabs.length];
      onChange(next.id);
      btnRefs.current.get(next.id)?.focus();
    }
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel ?? "Filtros"}
      onKeyDown={onKeyDown}
      className={cn(
        "relative inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-xl bg-[#f4f4f4] p-1 scrollbar-none dark:bg-[#1c1c1e]",
        className
      )}
    >
      {/* Sliding pill — transitions.dev recipe: transform + width, ease-smooth-out */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-1 rounded-lg bg-white shadow-sm dark:bg-[#2c2c2e]",
          "transition-[translate,width] duration-[250ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        )}
        style={{
          translate: `${pill.x - 4}px 0`,
          width: pill.width,
          opacity: pill.visible ? 1 : 0,
        }}
      />
      {tabs.map((tab) => {
        const isActive = tab.id === value;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              if (el) btnRefs.current.set(tab.id, el);
              else btnRefs.current.delete(tab.id);
            }}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative z-10 flex min-h-[44px] shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-lg px-3.5 text-xs transition-colors duration-150 active:scale-95 sm:min-h-[36px] sm:px-3",
              isActive
                ? "font-semibold text-black dark:text-white"
                : "font-medium text-[#767676] hover:text-black dark:text-[#a1a1aa] dark:hover:text-white"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

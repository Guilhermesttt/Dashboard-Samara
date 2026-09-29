"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  delay?: number;
}

export function MetricCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  delay = 0,
}: MetricCardProps) {
  return (
    <div
      className="p8-page-enter group relative min-w-0 max-w-full bg-white dark:bg-[#121212] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-3.5 sm:p-5 hover:border-black/20 dark:hover:border-white/20 transition-all duration-300 overflow-hidden shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]"
      style={{ animationDelay: `${delay * 100}ms`, animationFillMode: "both" }}
    >
      <div className="relative min-w-0">
        <div className="flex items-start justify-between gap-1 mb-2 sm:mb-3">
          <span className="text-xs sm:text-sm text-[#767676] dark:text-[#a1a1aa] font-medium leading-snug line-clamp-1">
            {title}
          </span>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#f5f5f7] dark:bg-[#1c1c1e] flex items-center justify-center shrink-0">
            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black dark:text-white" />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-black dark:text-white tracking-tight truncate">
            {value}
          </span>
          <div
            className={cn(
              "flex items-center gap-1 text-[11px] sm:text-xs font-medium truncate",
              changeType === "positive" && "text-emerald-600 dark:text-emerald-400",
              changeType === "negative" && "text-rose-600 dark:text-rose-400",
              changeType === "neutral" && "text-[#8f8f8f] dark:text-[#a1a1aa]"
            )}
          >
            {changeType === "positive" && <TrendingUp className="w-3 h-3 shrink-0" />}
            {changeType === "negative" && <TrendingDown className="w-3 h-3 shrink-0" />}
            <span className="truncate">{change}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

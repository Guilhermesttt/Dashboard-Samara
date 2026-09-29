"use client";

import { cn } from "@/lib/utils";
import type { Section } from "@/app/page";
import { Bell, Search, Calendar, Menu } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  activeSection: Section;
  onLogout?: () => void;
  onOpenMobileMenu?: () => void;
  onOpenReminders?: () => void;
  pendingRemindersCount?: number;
}

const sectionTitles: Record<Section, string> = {
  overview: "Visão Geral",
  appointments: "Agendamentos & Retornos",
  customers: "Carteira de Clientes",
  procedures: "Catálogo de Procedimentos",
  reports: "Relatórios Estratégicos",
  settings: "Configurações do Sistema",
};

export function Header({
  activeSection,
  onLogout,
  onOpenMobileMenu,
  onOpenReminders,
  pendingRemindersCount = 0,
}: HeaderProps) {
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header className="min-h-[var(--app-header-height)] h-[calc(var(--app-header-height)+env(safe-area-inset-top,0px))] pt-[env(safe-area-inset-top,0px)] border-b border-[#ebebeb] dark:border-[#27272a] bg-white/90 dark:bg-[#070707]/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between gap-2 px-4 sm:px-6 select-none transition-colors shrink-0">
      <div className="min-w-0 flex-1 flex items-center gap-2.5 sm:gap-6">
        {/* Mobile menu trigger with 44px touch area */}
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden w-10 h-10 rounded-xl bg-[#f5f5f5] dark:bg-[#1c1c1e] hover:bg-[#ebebeb] dark:hover:bg-[#2c2c2e] flex items-center justify-center text-black dark:text-white shrink-0 cursor-pointer active:scale-95 transition-all"
          title="Abrir Menu de Navegação"
          aria-label="Abrir Menu de Navegação"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="min-w-0 text-base sm:text-xl font-bold text-black dark:text-white tracking-tight truncate">
          {sectionTitles[activeSection] || "Painel"}
        </h1>
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-[#767676] dark:text-[#a1a1aa] bg-[#f7f7f7] dark:bg-[#141414] px-2.5 py-1 rounded-lg border border-black/[0.04] dark:border-white/[0.06]">
          <Calendar className="w-3.5 h-3.5 text-[#8f8f8f]" />
          <span>Últimos 30 dias</span>
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-2 sm:gap-3">
        {/* Search (Desktop only: on mobile each section has its dedicated search) */}
        <div
          className={cn(
            "hidden md:flex relative items-center transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            searchFocused ? "w-64" : "w-52"
          )}
        >
          <Search className="absolute left-3 w-3.5 h-3.5 text-[#8f8f8f] pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar no sistema..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="w-full h-9 pl-8 sm:pl-9 pr-3 rounded-xl bg-[#f5f5f5] dark:bg-[#1c1c1e] hover:bg-[#ededed] dark:hover:bg-[#252528] focus:bg-white dark:focus:bg-[#141414] border border-transparent focus:border-black/20 dark:focus:border-white/20 text-xs text-black dark:text-white placeholder:text-[#8f8f8f] focus:outline-none transition-all duration-200"
          />
        </div>

        {/* Reminders & Alerts Bell */}
        <button
          onClick={onOpenReminders}
          className="relative h-9 px-2 sm:px-3 rounded-xl text-[#767676] hover:text-black dark:hover:text-white hover:bg-[#f5f5f5] dark:hover:bg-[#1c1c1e] flex items-center gap-1.5 transition-colors duration-150 cursor-pointer shrink-0 border border-black/[0.05] dark:border-white/[0.08]"
          title="Central de Lembretes & Alertas Clínicos"
          aria-label="Central de Lembretes"
        >
          <Bell className="w-4 h-4 text-black dark:text-white" />
          {pendingRemindersCount > 0 ? (
            <span className="flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold">
              {pendingRemindersCount}
            </span>
          ) : (
            <span className="hidden sm:inline text-xs font-semibold text-black dark:text-white">
              Lembretes
            </span>
          )}
        </button>

        {/* User avatar */}
        <button
          onClick={onLogout}
          title="Perfil Samara / Sair"
          className="h-9 pl-1.5 pr-2 sm:pr-2.5 rounded-xl bg-[#f5f5f5] dark:bg-[#1c1c1e] hover:bg-[#ebebeb] dark:hover:bg-[#2c2c2e] flex items-center gap-1.5 sm:gap-2 text-xs font-medium text-black dark:text-white transition-colors duration-150 cursor-pointer border border-black/[0.04] dark:border-white/[0.08] shrink-0"
        >
          <div className="w-6 h-6 rounded-lg bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-[10px] font-bold">
            SO
          </div>
          <span className="hidden sm:inline font-semibold text-[11px]">Sâmara</span>
        </button>
      </div>
    </header>
  );
}

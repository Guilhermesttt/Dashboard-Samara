"use client";

import React, { useState, useEffect } from "react";
import type { Section } from "@/app/page";
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  Sparkles,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { checkHasTodayAppointments } from "@/lib/alert-algorithm";

interface MobileBottomNavProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
  onOpenMenu: () => void;
  hasTodayAppointments?: boolean;
}

export function MobileBottomNav({
  activeSection,
  onSectionChange,
  onOpenMenu,
  hasTodayAppointments,
}: MobileBottomNavProps) {
  const [hasToday, setHasToday] = useState(false);

  useEffect(() => {
    const update = () => {
      if (typeof hasTodayAppointments === "boolean") {
        setHasToday(hasTodayAppointments);
      } else {
        setHasToday(checkHasTodayAppointments());
      }
    };
    update();
    window.addEventListener("samara_appointments_updated", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("samara_appointments_updated", update);
      window.removeEventListener("storage", update);
    };
  }, [hasTodayAppointments]);

  const tabs = [
    {
      id: "overview" as Section,
      label: "Início",
      icon: LayoutDashboard,
    },
    {
      id: "appointments" as Section,
      label: "Agenda",
      icon: CalendarCheck,
      hasBadge: hasToday,
    },
    {
      id: "customers" as Section,
      label: "Clientes",
      icon: Users,
    },
    {
      id: "procedures" as Section,
      label: "Catálogo",
      icon: Sparkles,
    },
  ];

  return (
    <nav
      aria-label="Navegação Inferior Mobile"
      className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-white/95 dark:bg-[#0c0c0c]/95 backdrop-blur-xl border-t border-black/[0.08] dark:border-white/[0.08] flex items-center justify-around min-h-[var(--mobile-nav-height)] h-[calc(var(--mobile-nav-height)+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)] pl-[max(0.5rem,env(safe-area-inset-left,0px))] pr-[max(0.5rem,env(safe-area-inset-right,0px))] select-none shadow-[0_-4px_20px_rgba(0,0,0,0.04)] transition-colors"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeSection === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSectionChange(tab.id)}
            className={cn(
              "flex flex-col items-center justify-center flex-1 min-h-[44px] h-full py-1 text-[10px] font-medium transition-all duration-150 cursor-pointer relative active:scale-95",
              isActive
                ? "text-black dark:text-white font-bold"
                : "text-[#8f8f8f] hover:text-black dark:hover:text-white"
            )}
          >
            <div className="relative">
              <Icon
                className={cn(
                  "w-5 h-5 mb-0.5 transition-colors",
                  isActive ? "text-black dark:text-white stroke-[2.5]" : "text-[#8f8f8f]"
                )}
              />
              {tab.hasBadge && (
                <span className="absolute -top-0.5 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                </span>
              )}
            </div>
            <span>{tab.label}</span>
          </button>
        );
      })}

      {/* Botão Menu Completo (Abre Drawer com Relatórios, Configurações e Sair) */}
      <button
        type="button"
        onClick={onOpenMenu}
        className="flex flex-col items-center justify-center flex-1 min-h-[44px] h-full py-1 text-[10px] font-medium text-[#8f8f8f] hover:text-black dark:hover:text-white transition-all cursor-pointer active:scale-95"
      >
        <Menu className="w-5 h-5 mb-0.5 text-[#8f8f8f]" />
        <span>Mais</span>
      </button>
    </nav>
  );
}

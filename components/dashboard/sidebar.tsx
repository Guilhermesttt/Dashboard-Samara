"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { Section } from "@/app/page";
import { checkHasTodayAppointments } from "@/lib/alert-algorithm";
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  Sparkles,
  BarChart3,
  Settings,
  PanelLeft,
  LogOut,
  Building2,
  X,
  Shield,
} from "lucide-react";

interface SidebarProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  onLogout?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  hasTodayAppointments?: boolean;
  userRole?: "admin" | "funcionaria";
}

const navItems: {
  id: Section;
  label: string;
  icon: React.ElementType;
  isAdminOnly?: boolean;
}[] = [
  { id: "overview", label: "Visão Geral", icon: LayoutDashboard },
  { id: "appointments", label: "Agendamentos", icon: CalendarCheck },
  { id: "customers", label: "Clientes", icon: Users },
  { id: "procedures", label: "Procedimentos", icon: Sparkles },
  { id: "reports", label: "Relatórios", icon: BarChart3, isAdminOnly: true },
  { id: "settings", label: "Configurações", icon: Settings },
];

export function Sidebar({
  activeSection,
  onSectionChange,
  collapsed,
  onCollapsedChange,
  onLogout,
  mobileOpen = false,
  onMobileClose,
  hasTodayAppointments,
  userRole = "admin",
}: SidebarProps) {
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

  const handleItemClick = (id: Section) => {
    onSectionChange(id);
    if (onMobileClose) {
      onMobileClose();
    }
  };

  const navContent = (
    <div className="flex flex-col h-full bg-white dark:bg-[#111111] text-black dark:text-white transition-colors">
      {/* Brand Header */}
      <div className="h-[68px] flex items-center justify-between px-3.5 border-b border-black/15 dark:border-white/20">
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          {collapsed ? (
            <button
              onClick={() => onCollapsedChange(false)}
              className="w-9 h-9 rounded-lg bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.14] border border-black/[0.08] dark:border-white/[0.12] flex items-center justify-center shrink-0 transition-all cursor-pointer active:scale-95 mx-auto group"
              title="Expandir menu lateral"
              aria-label="Expandir menu lateral"
            >
              <PanelLeft className="w-4.5 h-4.5 text-[#767676] dark:text-[#A8B29A] group-hover:text-black dark:group-hover:text-white transition-colors" />
            </button>
          ) : (
            <div className="flex items-center flex-1">
              <img
                src="/Samara_Logo_Completa.png"
                alt="Dra. Sâmara Souza - Estética Avançada"
                className="h-11 sm:h-12 max-w-[195px] object-contain object-left dark:invert transition-all drop-shadow-sm"
              />
            </div>
          )}
        </div>

        {/* Desktop Sidebar Toggle icon (Image 2 style) */}
        {!collapsed && (
          <button
            onClick={() => onCollapsedChange(true)}
            className="hidden md:flex w-8 h-8 rounded-lg bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.14] border border-black/[0.08] dark:border-white/[0.12] items-center justify-center text-[#767676] dark:text-[#A8B29A] hover:text-black dark:hover:text-white transition-all cursor-pointer active:scale-95 shrink-0"
            title="Recolher menu lateral"
            aria-label="Recolher menu lateral"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}

        {/* Close button for mobile drawer */}
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="md:hidden w-10 h-10 rounded-xl bg-[#f5f5f5] dark:bg-[#232323] flex items-center justify-center text-[#767676] dark:text-[#8D9B7F] hover:text-black dark:hover:text-white cursor-pointer active:scale-95 transition-all"
            aria-label="Fechar menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems
          .filter((item) => !item.isAdminOnly || userRole === "admin")
          .map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 min-h-[44px] rounded-xl text-xs font-medium transition-all duration-150 group relative cursor-pointer active:scale-[0.99]",
                isActive
                  ? "bg-[#f4f4f4] dark:bg-[#232323] text-black dark:text-[#A8B29A] font-semibold shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_2px_8px_rgba(0,0,0,0.3)]"
                  : "text-[#767676] dark:text-[#8D9B7F] hover:text-black dark:hover:text-[#F7F5F0] hover:bg-[#f8f8f8] dark:hover:bg-[#232323]/50"
              )}
            >
              <div className="flex items-center gap-3">
                {/* Active bar indicator in Sage Green */}
                <span
                  className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-black dark:bg-[#A8B29A] transition-all duration-200",
                    isActive ? "opacity-100" : "opacity-0"
                  )}
                />
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-colors duration-150",
                    isActive ? "text-black dark:text-[#A8B29A]" : "text-[#8f8f8f] dark:text-[#8D9B7F] group-hover:text-black dark:group-hover:text-[#F7F5F0]"
                  )}
                />
                <span
                  className={cn(
                    "whitespace-nowrap transition-all duration-300",
                    collapsed ? "md:opacity-0 md:w-0 md:overflow-hidden" : "opacity-100"
                  )}
                >
                  {item.label}
                </span>
              </div>

              {/* Sinal importante para a ADM saber que tem cliente agendado para o dia */}
              {item.id === "appointments" && hasToday && (
                <div className="flex items-center gap-1.5 shrink-0 ml-auto pl-1">
                  <span className="relative flex h-2 w-2" title="Pacientes agendados hoje">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600" />
                  </span>
                  {!collapsed && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                      Hoje
                    </span>
                  )}
                </div>
              )}

              {/* Admin badge */}
              {item.isAdminOnly && !collapsed && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-[#767676] dark:text-[#a1a1aa] border border-black/[0.04] dark:border-white/[0.06]">
                  Admin
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className="p-3 border-t border-black/15 dark:border-white/20 space-y-2">
        {!collapsed && (
          <div className="px-3 py-1.5 rounded-lg bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#8f8f8f] dark:text-[#8D9B7F]">
              Nível
            </span>
            <span
              className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                userRole === "admin"
                  ? "bg-[#A8B29A]/15 text-[#A8B29A] border-[#A8B29A]/30"
                  : "bg-white/10 text-white border-white/20"
              )}
            >
              {userRole === "admin" ? "Administradora" : "Atendimento"}
            </span>
          </div>
        )}

        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-xl text-xs font-medium text-[#767676] dark:text-[#8D9B7F] hover:text-[#d62b11] hover:bg-rose-50/50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer group"
          >
            <LogOut className="w-4 h-4 text-[#8f8f8f] dark:text-[#8D9B7F] group-hover:text-[#d62b11] transition-colors shrink-0" />
            <span
              className={cn(
                "whitespace-nowrap transition-all duration-300",
                collapsed ? "md:opacity-0 md:w-0 md:overflow-hidden" : "opacity-100"
              )}
            >
              Sair da Conta
            </span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Fixed Sidebar */}
      <aside
        className={cn(
          "hidden md:flex fixed left-0 top-0 z-40 h-screen bg-white dark:bg-[#111111] border-r border-black/15 dark:border-white/20 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] flex-col select-none",
          collapsed ? "w-[72px]" : "w-[260px]"
        )}
      >
        {navContent}
      </aside>

      {/* 2. Mobile Drawer (Overlay + Slide-in menu) */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop blur */}
          <div
            onClick={onMobileClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          />

          {/* Drawer panel with safe area padding */}
          <div className="relative w-[280px] max-w-[85vw] h-full bg-white dark:bg-[#111111] z-10 shadow-2xl animate-in slide-in-from-left duration-200 flex flex-col pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}

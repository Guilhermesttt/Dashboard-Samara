"use client";

import { cn } from "@/lib/utils";
import type { Section } from "@/app/page";
import { Bell, Search, Calendar, Menu, PanelLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { getStoredUserProfile, UserProfileData } from "@/lib/storage-keys";
import { NotificationBadge, StaggerText } from "@/components/motion";

interface HeaderProps {
  activeSection: Section;
  onLogout?: () => void;
  onOpenMobileMenu?: () => void;
  onOpenReminders?: () => void;
  pendingRemindersCount?: number;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  userRole?: "admin" | "funcionaria";
  userName?: string;
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
  sidebarCollapsed = false,
  onToggleSidebar,
  userRole = "admin",
  userName,
}: HeaderProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);

  useEffect(() => {
    const updateProfile = () => {
      setUserProfile(getStoredUserProfile());
    };
    updateProfile();
    window.addEventListener("samara_profile_updated", updateProfile);
    window.addEventListener("storage", updateProfile);
    return () => {
      window.removeEventListener("samara_profile_updated", updateProfile);
      window.removeEventListener("storage", updateProfile);
    };
  }, []);

  return (
    <header className="min-h-[var(--app-header-height)] h-[calc(var(--app-header-height)+env(safe-area-inset-top,0px))] pt-[env(safe-area-inset-top,0px)] border-b border-black/15 dark:border-white/20 bg-white/90 dark:bg-[#111111]/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between gap-2 px-4 sm:px-6 select-none transition-colors shrink-0">
      <div className="min-w-0 flex-1 flex items-center gap-2.5 sm:gap-4">
        {/* Mobile menu trigger with 44px touch area */}
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden w-10 h-10 rounded-xl bg-[#f5f5f5] dark:bg-[#232323] hover:bg-[#ebebeb] dark:hover:bg-[#2e2e2e] flex items-center justify-center text-black dark:text-white shrink-0 cursor-pointer active:scale-95 transition-all"
          title="Abrir Menu de Navegação"
          aria-label="Abrir Menu de Navegação"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop Sidebar Toggle icon (Image 2 style) - visible when sidebar is collapsed */}
        {onToggleSidebar && sidebarCollapsed && (
          <button
            onClick={onToggleSidebar}
            className="hidden md:flex w-8 h-8 rounded-lg bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.14] border border-black/[0.08] dark:border-white/[0.12] items-center justify-center text-[#767676] dark:text-[#A8B29A] hover:text-black dark:hover:text-white transition-all cursor-pointer active:scale-95 shrink-0"
            title="Expandir menu lateral"
            aria-label="Expandir menu lateral"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}

        <h1 className="min-w-0 text-base sm:text-xl font-bold text-black dark:text-white tracking-tight truncate font-display">
          <StaggerText>{sectionTitles[activeSection] || "Painel"}</StaggerText>
        </h1>
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-[#767676] dark:text-[#8D9B7F] bg-[#f7f7f7] dark:bg-[#232323] px-2.5 py-1 rounded-lg border border-black/[0.04] dark:border-white/[0.06]">
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
            className="w-full h-9 pl-8 sm:pl-9 pr-3 rounded-xl bg-[#f5f5f5] dark:bg-[#232323] hover:bg-[#ededed] dark:hover:bg-[#2a2a2a] focus:bg-white dark:focus:bg-[#232323] border border-transparent focus:border-[#A8B29A]/50 text-xs text-black dark:text-white placeholder:text-[#8f8f8f] focus:outline-none transition-all duration-200"
          />
        </div>

        {/* Reminders & Alerts Bell */}
        <button
          onClick={onOpenReminders}
          className="relative h-9 px-2 sm:px-3 rounded-xl text-[#767676] hover:text-black dark:hover:text-white hover:bg-[#f5f5f5] dark:hover:bg-[#232323] flex items-center gap-1.5 transition-colors duration-150 cursor-pointer shrink-0 border border-black/[0.05] dark:border-white/[0.08]"
          title="Central de Lembretes & Alertas Clínicos"
          aria-label="Central de Lembretes"
        >
          <Bell className="w-4 h-4 text-black dark:text-white" />
          {pendingRemindersCount > 0 ? (
            <NotificationBadge count={pendingRemindersCount} variant="danger" />
          ) : (
            <span className="hidden sm:inline text-xs font-semibold text-black dark:text-white">
              Lembretes
            </span>
          )}
        </button>

        {/* User avatar */}
        <button
          onClick={onLogout}
          title={userProfile?.name ? `${userProfile.name} • Clique para Sair` : "Perfil Samara / Sair"}
          className="h-9 pl-1.5 pr-2 sm:pr-2.5 rounded-xl bg-[#f5f5f5] dark:bg-[#232323] hover:bg-[#ebebeb] dark:hover:bg-[#2a2a2a] flex items-center gap-1.5 sm:gap-2 text-xs font-medium text-black dark:text-white transition-colors duration-150 cursor-pointer border border-black/[0.04] dark:border-white/[0.08] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] shrink-0"
        >
          <div className="w-6 h-6 rounded-lg overflow-hidden bg-black dark:bg-[#A8B29A] text-white dark:text-[#111111] flex items-center justify-center text-[10px] font-bold shadow-sm shrink-0">
            {userProfile?.photoUrl ? (
              <img
                src={userProfile.photoUrl}
                alt={userProfile.name || "Dra. Sâmara"}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{userProfile?.name ? userProfile.name.substring(0, 2).toUpperCase() : "SO"}</span>
            )}
          </div>
          <span className="hidden sm:inline font-semibold text-[11px] truncate max-w-[120px]">
            {userName || userProfile?.name?.split(" ")[0] || "Sâmara"}
          </span>
          <span className="hidden md:inline text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[#767676] dark:text-[#a1a1aa] border border-black/5 dark:border-white/10">
            {userRole === "admin" ? "Admin" : "Equipe"}
          </span>
        </button>
      </div>
    </header>
  );
}

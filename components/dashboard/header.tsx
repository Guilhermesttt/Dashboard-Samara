"use client";

import { cn } from "@/lib/utils";
import type { Section } from "@/app/page";
import {
  Bell,
  Search,
  Calendar,
  Menu,
  PanelLeft,
  ChevronDown,
  Settings,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useState, useEffect } from "react";
import { getStoredUserProfile, UserProfileData } from "@/lib/storage-keys";
import { NotificationBadge, StaggerText } from "@/components/motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  userEmail?: string;
  onNavigateSection?: (section: Section) => void;
  onOpenSettings?: () => void;
}

const sectionTitles: Record<Section, string> = {
  overview: "Visão Geral",
  appointments: "Agendamentos & Retornos",
  customers: "Carteira de Clientes",
  procedures: "Catálogo de Procedimentos",
  reports: "Relatórios Estratégicos",
  team: "Equipe & Controle de Acesso",
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
  userEmail,
  onNavigateSection,
  onOpenSettings,
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

  const displayName = userName || userProfile?.name || "Dra. Sâmara Souza";
  const displayEmail =
    userEmail ||
    userProfile?.email ||
    (typeof window !== "undefined" ? localStorage.getItem("samara_user_email") : null) ||
    "dra.samara@samaraestetica.com.br";

  const handleOpenSettings = () => {
    if (onOpenSettings) {
      onOpenSettings();
    } else if (onNavigateSection) {
      onNavigateSection("settings");
    }
  };

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

        {/* User avatar & Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              id="user-profile-menu-button"
              title="Menu do Perfil • Ver configurações e Sair"
              aria-label="Abrir menu do perfil e configurações"
              className="h-9 pl-1.5 pr-2 sm:pr-2.5 rounded-xl bg-[#f5f5f5] dark:bg-[#232323] hover:bg-[#ebebeb] dark:hover:bg-[#2a2a2a] flex items-center gap-1.5 sm:gap-2 text-xs font-medium text-black dark:text-white transition-all duration-150 cursor-pointer border border-black/[0.04] dark:border-white/[0.08] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] shrink-0 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A8B29A]/50 group data-[state=open]:bg-[#ebebeb] dark:data-[state=open]:bg-[#2a2a2a]"
            >
              <div className="w-6 h-6 rounded-lg overflow-hidden bg-black dark:bg-[#A8B29A] text-white dark:text-[#111111] flex items-center justify-center text-[10px] font-bold shadow-sm shrink-0">
                {userProfile?.photoUrl ? (
                  <img
                    src={userProfile.photoUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{displayName ? displayName.substring(0, 2).toUpperCase() : "SO"}</span>
                )}
              </div>
              <span className="hidden sm:inline font-semibold text-[11px] truncate max-w-[120px]">
                {displayName.split(" ")[0]}
              </span>
              <span className="hidden md:inline text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[#767676] dark:text-[#a1a1aa] border border-black/5 dark:border-white/10">
                {userRole === "admin" ? "Admin" : "Equipe"}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#767676] dark:text-[#8D9B7F] transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-64 p-2 rounded-2xl bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-2xl border border-black/10 dark:border-white/15 shadow-[0_16px_36px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.08)] z-50 font-sans"
          >
            {/* Cabeçalho do Dropdown com Dados do Usuário */}
            <DropdownMenuLabel className="p-2 font-normal">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-black dark:bg-[#A8B29A] text-white dark:text-[#111111] flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
                  {userProfile?.photoUrl ? (
                    <img
                      src={userProfile.photoUrl}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{displayName.substring(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <p className="text-xs font-bold text-black dark:text-white truncate">
                    {displayName}
                  </p>
                  <p className="text-[11px] text-[#767676] dark:text-[#8D9B7F] truncate">
                    {displayEmail}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full bg-[#A8B29A]/15 text-[#5e6950] dark:text-[#A8B29A] border border-[#A8B29A]/20">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      <span>{userRole === "admin" ? "Administradora" : "Equipe"}</span>
                    </span>
                  </div>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="my-1.5 bg-black/[0.06] dark:bg-white/[0.08]" />

            <DropdownMenuGroup>
              {/* Opção 1: Ver configurações */}
              <DropdownMenuItem
                onClick={handleOpenSettings}
                className="flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors focus:bg-black/5 dark:focus:bg-white/5 active:scale-[0.98]"
              >
                <div className="w-7 h-7 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center text-[#767676] dark:text-[#A8B29A] shrink-0">
                  <Settings className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-xs text-black dark:text-white">
                    Ver configurações
                  </span>
                  <span className="text-[10px] text-[#767676] dark:text-[#8D9B7F]">
                    Perfil, horários e preferências
                  </span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="my-1.5 bg-black/[0.06] dark:bg-white/[0.08]" />

            <DropdownMenuGroup>
              {/* Opção 2: Sair da conta */}
              <DropdownMenuItem
                variant="destructive"
                onClick={() => {
                  if (onLogout) {
                    onLogout();
                  }
                }}
                className="flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 focus:bg-rose-500/15 focus:text-rose-600 dark:focus:text-rose-400 cursor-pointer transition-colors active:scale-[0.98]"
              >
                <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                  <LogOut className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-xs">Sair da conta</span>
                  <span className="text-[10px] text-rose-500/80 dark:text-rose-400/80">
                    Encerrar sessão com segurança
                  </span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { LoginView } from "@/components/auth/login-view";
import { OverviewSection } from "@/components/dashboard/sections/overview";
import { AppointmentsSection, Appointment } from "@/components/dashboard/sections/appointments";
import { CustomersSection } from "@/components/dashboard/sections/customers";
import { ProceduresSection } from "@/components/dashboard/sections/procedures";
import { ReportsSection } from "@/components/dashboard/sections/reports";
import { SettingsSection } from "@/components/dashboard/sections/settings";
import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav";
import { RemindersModal } from "@/components/dashboard/reminders-modal";
import {
  ReminderItem,
  getLocalReminders,
  saveLocalReminders,
  saveReminderToFirestore,
  deleteReminderFromFirestore,
  fetchRemindersFromFirestore,
} from "@/lib/reminders-service";
import { runClinicalAlertAlgorithm, checkHasTodayAppointments } from "@/lib/alert-algorithm";

export type Section =
  | "overview"
  | "appointments"
  | "customers"
  | "procedures"
  | "reports"
  | "settings";

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Central Reminders State
  const [isRemindersOpen, setIsRemindersOpen] = useState(false);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [hasTodayAppointments, setHasTodayAppointments] = useState(false);

  // Monitorar agendamentos de hoje para exibir badge com precisão
  useEffect(() => {
    const updateToday = () => {
      setHasTodayAppointments(checkHasTodayAppointments());
    };
    updateToday();
    window.addEventListener("samara_appointments_updated", updateToday);
    window.addEventListener("storage", updateToday);
    return () => {
      window.removeEventListener("samara_appointments_updated", updateToday);
      window.removeEventListener("storage", updateToday);
    };
  }, []);

  // 1. Checar Sessão Persistente da Dra. Sâmara ao inicializar
  useEffect(() => {
    try {
      const savedAuth = localStorage.getItem("samara_auth_session");
      if (savedAuth === "true") {
        setIsAuthenticated(true);
      }
    } catch (e) {}
    setAuthChecked(true);
  }, []);

  // 2. Carregar Lembretes (Local e Cloud Firestore)
  useEffect(() => {
    if (!isAuthenticated) return;

    // Carrega local
    const local = getLocalReminders();
    setReminders(local);

    // Tenta sincronizar com Firestore
    fetchRemindersFromFirestore().then((cloudReminders) => {
      if (cloudReminders && cloudReminders.length > 0) {
        setReminders(cloudReminders);
        saveLocalReminders(cloudReminders);
      }
    });
  }, [isAuthenticated]);

  // 3. Algoritmo de Alerta Preventivo (Executa ao abrir a plataforma para a Dra. Sâmara)
  useEffect(() => {
    if (!isAuthenticated) return;

    const timer = setTimeout(() => {
      try {
        let appointments: Appointment[] = [];
        const rawApts = localStorage.getItem("samara_real_appointments");
        if (rawApts) {
          appointments = JSON.parse(rawApts);
        }

        const currentReminders = getLocalReminders();

        // Roda o algoritmo de verificação clínica de 1 dia de antecedência, retornos e lembretes
        runClinicalAlertAlgorithm({
          appointments,
          reminders: currentReminders,
        });
      } catch (e) {
        console.error("Erro ao executar algoritmo de alertas:", e);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  // Gerenciadores de Lembretes
  const handleSaveReminder = useCallback((newReminder: ReminderItem) => {
    setReminders((prev) => {
      const index = prev.findIndex((r) => r.id === newReminder.id);
      let updated: ReminderItem[];
      if (index >= 0) {
        updated = [...prev];
        updated[index] = newReminder;
      } else {
        updated = [newReminder, ...prev];
      }
      saveLocalReminders(updated);
      return updated;
    });
    saveReminderToFirestore(newReminder);
  }, []);

  const handleToggleReminder = useCallback((id: string) => {
    setReminders((prev) => {
      const updated = prev.map((r) => {
        if (r.id === id) {
          const changed = { ...r, completed: !r.completed };
          saveReminderToFirestore(changed);
          return changed;
        }
        return r;
      });
      saveLocalReminders(updated);
      return updated;
    });
  }, []);

  const handleDeleteReminder = useCallback((id: string) => {
    setReminders((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      saveLocalReminders(updated);
      return updated;
    });
    deleteReminderFromFirestore(id);
  }, []);

  const handleLogout = useCallback(() => {
    try {
      localStorage.removeItem("samara_auth_session");
      sessionStorage.removeItem("samara_last_alert_run");
    } catch (e) {}
    setIsAuthenticated(false);
  }, []);

  // Evita flash de tela antes de checar localStorage
  if (!authChecked) {
    return <div className="min-h-screen bg-white dark:bg-[#070707]" />;
  }

  // Se não autenticado, exibe a tela de login exclusiva da Dra. Sâmara
  if (!isAuthenticated) {
    return (
      <div className="w-full min-h-screen bg-white dark:bg-[#070707] p8-page-enter">
        <LoginView onLoginSuccess={() => setIsAuthenticated(true)} />
      </div>
    );
  }

  const pendingRemindersCount = reminders.filter((r) => !r.completed).length;

  const renderSection = () => {
    switch (activeSection) {
      case "overview":
        return <OverviewSection />;
      case "appointments":
        return <AppointmentsSection />;
      case "customers":
        return <CustomersSection />;
      case "procedures":
        return <ProceduresSection />;
      case "reports":
        return <ReportsSection />;
      case "settings":
        return <SettingsSection />;
      default:
        return <OverviewSection />;
    }
  };

  return (
    <div className="dashboard-shell flex w-full min-w-0 bg-white dark:bg-[#070707] text-black dark:text-white">
      {/* Sidebar with Portuguese labels & Mobile Drawer */}
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        onLogout={handleLogout}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
        hasTodayAppointments={hasTodayAppointments}
      />

      {/* Main Content Area (Responsive on mobile and desktop) */}
      <div
        className={`min-w-0 min-h-0 flex-1 flex flex-col transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ml-0 ${
          sidebarCollapsed ? "md:ml-[72px]" : "md:ml-[260px]"
        }`}
      >
        <Header
          activeSection={activeSection}
          onLogout={handleLogout}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenReminders={() => setIsRemindersOpen(true)}
          pendingRemindersCount={pendingRemindersCount}
        />
        <main
          data-app-scroll-root
          className="dashboard-scroll-root min-w-0 min-h-0 flex-1 p-3.5 sm:p-6 md:p-8 pb-[calc(var(--mobile-nav-height)+env(safe-area-inset-bottom,0px)+1.5rem)] md:pb-8 pl-[max(0.875rem,env(safe-area-inset-left,0px))] pr-[max(0.875rem,env(safe-area-inset-right,0px))] overflow-x-hidden overflow-y-auto scroll-momentum bg-white dark:bg-[#070707] transition-colors"
        >
          <div key={activeSection} className="w-full min-w-0 p8-page-enter">
            {renderSection()}
          </div>
        </main>
      </div>

      {/* Modal & Bottom Sheet de Lembretes & Alertas da Plataforma */}
      <RemindersModal
        isOpen={isRemindersOpen}
        onClose={() => setIsRemindersOpen(false)}
        reminders={reminders}
        onSaveReminder={handleSaveReminder}
        onToggleReminder={handleToggleReminder}
        onDeleteReminder={handleDeleteReminder}
      />

      {/* iOS-Style Bottom Navigation for Mobile (Thumb-zone access) */}
      <MobileBottomNav
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onOpenMenu={() => setMobileMenuOpen(true)}
        hasTodayAppointments={hasTodayAppointments}
      />
    </div>
  );
}

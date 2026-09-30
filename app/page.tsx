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
import { OnboardingModal } from "@/components/auth/onboarding-modal";
import {
  STORAGE_KEYS,
  getStoredUserProfile,
} from "@/lib/storage-keys";
import {
  subscribeToAuthState,
  logoutFromFirebase,
  AppUser,
  isClinicAdminEmail,
} from "@/lib/auth-service";
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

  // Central Reminders & Onboarding State
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
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

  // 1. Checar Sessão e Perfil com Firebase Auth
  useEffect(() => {
    const unsubscribe = subscribeToAuthState((user) => {
      if (user) {
        setIsAuthenticated(true);
        setCurrentUser(user);
        const onboardingDone = localStorage.getItem(STORAGE_KEYS.ONBOARDING_DONE);
        if (!onboardingDone && user.role === "admin") {
          setIsOnboardingOpen(true);
        }
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
      setAuthChecked(true);
    });

    return () => unsubscribe();
  }, []);

  // 2. Proteção de Acesso por Papel (RBAC): Funcionária não acessa financeiro/relatórios
  useEffect(() => {
    if (currentUser?.role === "funcionaria" && activeSection === "reports") {
      setActiveSection("overview");
    }
  }, [currentUser?.role, activeSection]);

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

  const handleLogout = useCallback(async () => {
    await logoutFromFirebase();
    setIsAuthenticated(false);
    setCurrentUser(null);
  }, []);

  // Evita flash de tela antes de checar localStorage
  if (!authChecked) {
    return <div className="min-h-screen bg-white dark:bg-[#111111]" />;
  }

  if (!isAuthenticated) {
    return (
      <div className="w-full min-h-[100dvh] h-[100dvh] overflow-hidden bg-[#111111] p8-page-enter">
        <LoginView
          onLoginSuccess={() => {
            setIsAuthenticated(true);
            try {
              const done = localStorage.getItem(STORAGE_KEYS.ONBOARDING_DONE);
              if (!done && currentUser?.role === "admin") {
                setIsOnboardingOpen(true);
              }
            } catch (e) {}
          }}
          onRegisterSuccess={(user) => {
            setCurrentUser(user as any);
            setIsAuthenticated(true);
            if (user?.email && isClinicAdminEmail(user.email)) {
              setIsOnboardingOpen(true);
            }
          }}
        />
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
    <div className="dashboard-shell flex w-full min-w-0 bg-white dark:bg-[#111111] text-black dark:text-white">
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
        userRole={currentUser?.role || "admin"}
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
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          userRole={currentUser?.role || "admin"}
          userName={currentUser?.name}
        />
        <main
          data-app-scroll-root
          className="dashboard-scroll-root min-w-0 min-h-0 flex-1 p-3.5 sm:p-6 md:p-8 pb-[calc(var(--mobile-nav-height)+env(safe-area-inset-bottom,0px)+1.5rem)] md:pb-8 pl-[max(0.875rem,env(safe-area-inset-left,0px))] pr-[max(0.875rem,env(safe-area-inset-right,0px))] overflow-x-hidden overflow-y-auto scroll-momentum bg-white dark:bg-[#111111] dark:bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.035)_0%,_transparent_65%)] transition-colors"
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

      {/* Modal de Boas-Vindas & Onboarding Personalizado da Dra. Sâmara */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        initialName={currentUser?.name || getStoredUserProfile()?.name || "Dra. Sâmara Souza"}
        initialEmail={
          currentUser?.email ||
          getStoredUserProfile()?.email ||
          "samara@samaraestetica.com.br"
        }
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

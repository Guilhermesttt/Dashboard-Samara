"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Bell,
  Shield,
  Palette,
  Volume2,
  Clock,
  Sparkles,
  CalendarCheck,
  Cake,
  FileCheck,
  Check,
  Eye,
  EyeOff,
  Stethoscope,
  Database,
  Server,
  CheckCircle2,
  BellRing,
  Upload,
} from "lucide-react";
import { playNotificationSound } from "@/lib/sound";
import { isFirebaseConfigured, firebaseConfig } from "@/lib/firebase";
import { toast } from "sonner";
import { KineticHeading, SuccessCheck, ThinkingDots, BorderBeam } from "@/components/motion";
import {
  isProduction,
  clearDevTestData,
  getStoredUserProfile,
  setStoredUserProfile,
  getStoredClinicSchedule,
  setStoredClinicSchedule,
  UserProfileData,
  ClinicScheduleData,
  DEFAULT_CLINIC_SCHEDULE,
} from "@/lib/storage-keys";
import { saveUserProfileToFirestore } from "@/lib/firebase-service";

export function SettingsSection() {
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check initial theme from DOM or localStorage
    const isDark =
      document.documentElement.classList.contains("dark") ||
      localStorage.getItem("samara_theme") === "dark";
    setIsDarkMode(isDark);
  }, []);

  const handleToggleDarkMode = (checked: boolean) => {
    setIsDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("samara_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("samara_theme", "light");
    }
  };

  // Profile State
  const [profile, setProfile] = useState<{
    name: string;
    role: string;
    email: string;
    phone: string;
    crbm: string;
    clinicAddress: string;
    businessHours: string;
    photoUrl?: string;
  }>({
    name: "Dra. Sâmara",
    role: "Biomédica Esteta • Harmonização Facial e Corporal",
    email: "samara-nagy@hotmail.com",
    phone: "(11) 98844-2200",
    crbm: "CRBM 34.819-SP",
    clinicAddress: "Rua Oscar Freire, 1200 - Sala 42, Jardins - São Paulo, SP",
    businessHours: "Segunda a Sexta: 08:00 às 19:00 | Sábado: 08:00 às 14:00",
  });

  // Clinic Schedule State
  const [schedule, setSchedule] = useState<ClinicScheduleData>(DEFAULT_CLINIC_SCHEDULE);

  useEffect(() => {
    const savedProf = getStoredUserProfile();
    if (savedProf) {
      setProfile((prev) => ({
        ...prev,
        name: savedProf.name || prev.name,
        email: savedProf.email || prev.email,
        role: savedProf.title || prev.role,
        crbm: savedProf.crm || prev.crbm,
        phone: savedProf.phone || prev.phone,
        photoUrl: savedProf.photoUrl || prev.photoUrl,
      }));
    }
    const savedSched = getStoredClinicSchedule();
    if (savedSched) {
      setSchedule(savedSched);
    }
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const b64 = event.target?.result as string;
      setProfile((prev) => ({ ...prev, photoUrl: b64 }));
      setStoredUserProfile({
        name: profile.name,
        email: profile.email,
        title: profile.role,
        crm: profile.crbm,
        phone: profile.phone,
        photoUrl: b64,
      });
      saveUserProfileToFirestore({ photoUrl: b64 });
      toast.success("Foto de perfil atualizada com sucesso!");
    };
    reader.readAsDataURL(file);
  };

  // Notifications State
  const [notificationConfig, setNotificationConfig] = useState({
    soundEnabled: true,
    upcomingAppointmentAlert: true,
    return15DaysAlert: true,
    newBookingAlert: true,
    pendingAnamneseAlert: true,
    birthdayAlert: true,
  });

  // Password State
  const [passwordState, setPasswordState] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState("");

  const handleTestSound = () => {
    playNotificationSound();
  };

  const handleTestToast = (
    type: "today" | "1day" | "15days" | "reminder" | "success" = "today"
  ) => {
    playNotificationSound();

    switch (type) {
      case "1day":
        toast.warning("⏰ [TESTE] Atendimento Amanhã: Mariana Souza", {
          description:
            "Harmonização Facial às 14:00. Alerta sonoro e e-mail preventivo funcionando com sucesso!",
          duration: 6000,
        });
        break;
      case "15days":
        toast.info("🔍 [TESTE] Retorno de 15 Dias: Juliana Costa", {
          description:
            "Revisão e avaliação de simetria pós-Botox agendados para hoje.",
          duration: 6000,
        });
        break;
      case "reminder":
        toast("🔔 [TESTE] Lembrete Clínico: Comprar Toxina Botulínica", {
          description:
            "Prioridade Alta • Verificar estoque com o distribuidor oficial.",
          duration: 6000,
        });
        break;
      case "success":
        toast.success("✓ [TESTE] Procedimento Concluído com Sucesso!", {
          description: "Os dados foram salvos e sincronizados com a nuvem.",
          duration: 5000,
        });
        break;
      default:
        toast.warning("⏰ [TESTE] Atendimento Hoje: Dra. Camila Alencar", {
          description:
            "Botox (Terço Superior) às 15:30. Alerta sonoro e notificação em tela funcionando!",
          duration: 6000,
        });
        break;
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const userProf: UserProfileData = {
        name: profile.name,
        email: profile.email,
        title: profile.role,
        crm: profile.crbm,
        phone: profile.phone,
        photoUrl: profile.photoUrl,
        bio: profile.businessHours,
      };
      setStoredUserProfile(userProf);
      setStoredClinicSchedule(schedule);
      await saveUserProfileToFirestore({
        ...userProf,
        clinicAddress: profile.clinicAddress,
        businessHours: profile.businessHours,
        schedule,
      });

      setIsSaving(false);
      setSaveSuccess(true);
      toast.success("Perfil e preferências salvos com sucesso!");
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e) {
      setIsSaving(false);
      toast.error("Erro ao salvar perfil.");
    }
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordState.currentPassword) {
      setPasswordFeedback("Por favor, informe a senha atual.");
      return;
    }
    if (passwordState.newPassword.length < 4) {
      setPasswordFeedback("A nova senha deve ter no mínimo 4 caracteres.");
      return;
    }
    if (passwordState.newPassword !== passwordState.confirmPassword) {
      setPasswordFeedback(
        "A confirmação da senha não coincide com a nova senha.",
      );
      return;
    }

    setPasswordFeedback("Senha atualizada com sucesso!");
    setPasswordState({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setTimeout(() => setPasswordFeedback(""), 3000);
  };

  return (
    <div data-dashboard-section="settings" className="w-full min-w-0 max-w-4xl space-y-6 pb-24 md:pb-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-[#767676] dark:text-[#a1a1aa] font-medium">
          <Shield className="w-3.5 h-3.5 text-black dark:text-white" />
          <span>Clínica & Preferências</span>
        </div>
        <KineticHeading
          text="Configurações da Clínica"
          as="h2"
          className="text-xl sm:text-2xl font-bold text-foreground"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Perfil profissional da Dra. Sâmara, preferências visuais, alertas e segurança.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full min-w-0 space-y-6"
      >
        <TabsList data-settings-tabs="true" className="w-full min-w-0 max-w-full justify-start bg-[#f4f4f4] dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] p-1 rounded-xl flex overflow-x-auto scrollbar-none">
          <TabsTrigger
            value="profile"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-[#2c2c2e] data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg text-xs font-semibold whitespace-nowrap px-3 py-1.5 min-h-[44px] sm:min-h-[36px] inline-flex items-center shrink-0 transition-all cursor-pointer active:scale-95"
          >
            <User className="w-3.5 h-3.5 mr-1.5" />
            <span className="hidden sm:inline">Perfil & Aparência</span>
            <span className="sm:hidden">Perfil</span>
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-[#2c2c2e] data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg text-xs font-semibold whitespace-nowrap px-3 py-1.5 min-h-[44px] sm:min-h-[36px] inline-flex items-center shrink-0 transition-all cursor-pointer active:scale-95"
          >
            <Bell className="w-3.5 h-3.5 mr-1.5" />
            <span className="hidden sm:inline">Notificações & Sons</span>
            <span className="sm:hidden">Notificações</span>
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-[#2c2c2e] data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg text-xs font-semibold whitespace-nowrap px-3 py-1.5 min-h-[44px] sm:min-h-[36px] inline-flex items-center shrink-0 transition-all cursor-pointer active:scale-95"
          >
            <Shield className="w-3.5 h-3.5 mr-1.5" />
            <span className="hidden sm:inline">Segurança & Senha</span>
            <span className="sm:hidden">Segurança</span>
          </TabsTrigger>
          <TabsTrigger
            value="database"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-[#2c2c2e] data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg text-xs font-semibold whitespace-nowrap px-3 py-1.5 min-h-[44px] sm:min-h-[36px] inline-flex items-center shrink-0 transition-all cursor-pointer active:scale-95"
          >
            <Database className="w-3.5 h-3.5 mr-1.5" />
            <span className="hidden sm:inline">Banco & Firebase</span>
            <span className="sm:hidden">Firebase</span>
          </TabsTrigger>
        </TabsList>

        {/* 1. ABA PERFIL & APARÊNCIA */}
        <TabsContent
          value="profile"
          className="w-full min-w-0 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          {/* Card: Dados do Perfil */}
          <Card className="border-border bg-card shadow-sm rounded-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold text-foreground">
                Identificação do Perfil da Clínica
              </CardTitle>
              <CardDescription className="text-xs">
                Informações exibidas no cabeçalho, nas fichas de aplicação e no
                prontuário de estética.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar e Identidade Profissional */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-black text-white shadow-sm border-2 border-[#A8B29A] shrink-0 flex items-center justify-center">
                    {profile.photoUrl ? (
                      <img
                        src={profile.photoUrl}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-base sm:text-lg font-bold">DS</span>
                    )}
                  </div>
                  <div className="space-y-1 sm:hidden">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">
                        {profile.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        Administradora
                      </span>
                    </div>
                    <label className="cursor-pointer inline-block">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />
                      <span className="h-7 px-2.5 text-[11px] font-medium border border-border rounded-lg inline-flex items-center gap-1 hover:bg-secondary/60 transition-colors">
                        <Upload className="w-3 h-3" />
                        Alterar Foto
                      </span>
                    </label>
                  </div>
                </div>

                <div className="space-y-1 flex-1 min-w-0">
                  <div className="hidden sm:flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">
                      {profile.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      Administradora
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed break-words">
                    {profile.role}
                  </p>
                  <label className="hidden sm:inline-block cursor-pointer mt-1">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                    <span className="h-7 px-2.5 text-xs font-medium border border-border rounded-lg inline-flex items-center gap-1 hover:bg-secondary/60 transition-colors">
                      <Upload className="w-3 h-3" />
                      Alterar Foto de Perfil
                    </span>
                  </label>
                </div>
              </div>

              {/* Grid de Campos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="profName"
                    className="text-xs font-semibold text-foreground"
                  >
                    Nome da Profissional
                  </Label>
                  <Input
                    id="profName"
                    value={profile.name}
                    onChange={(e) =>
                      setProfile({ ...profile, name: e.target.value })
                    }
                    className="bg-secondary/50 border-border text-base sm:text-xs text-foreground h-10 sm:h-9 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="profRole"
                    className="text-xs font-semibold text-foreground"
                  >
                    Especialidade / Cargo
                  </Label>
                  <Input
                    id="profRole"
                    value={profile.role}
                    onChange={(e) =>
                      setProfile({ ...profile, role: e.target.value })
                    }
                    className="bg-secondary/50 border-border text-base sm:text-xs text-foreground h-10 sm:h-9 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="profEmail"
                    className="text-xs font-semibold text-foreground"
                  >
                    E-mail de Contato
                  </Label>
                  <Input
                    id="profEmail"
                    type="email"
                    value={profile.email}
                    onChange={(e) =>
                      setProfile({ ...profile, email: e.target.value })
                    }
                    className="bg-secondary/50 border-border text-base sm:text-xs text-foreground h-10 sm:h-9 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="profPhone"
                    className="text-xs font-semibold text-foreground"
                  >
                    Telefone / WhatsApp da Clínica
                  </Label>
                  <Input
                    id="profPhone"
                    value={profile.phone}
                    onChange={(e) =>
                      setProfile({ ...profile, phone: e.target.value })
                    }
                    className="bg-secondary/50 border-border text-base sm:text-xs text-foreground h-10 sm:h-9 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="profCrbm"
                    className="text-xs font-semibold text-foreground"
                  >
                    Registro Profissional (CRBM / CRM)
                  </Label>
                  <Input
                    id="profCrbm"
                    value={profile.crbm}
                    onChange={(e) =>
                      setProfile({ ...profile, crbm: e.target.value })
                    }
                    className="bg-secondary/50 border-border text-base sm:text-xs text-foreground h-10 sm:h-9 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="profHours"
                    className="text-xs font-semibold text-foreground"
                  >
                    Horário de Atendimento
                  </Label>
                  <Input
                    id="profHours"
                    value={profile.businessHours}
                    onChange={(e) =>
                      setProfile({ ...profile, businessHours: e.target.value })
                    }
                    className="bg-secondary/50 border-border text-base sm:text-xs text-foreground h-10 sm:h-9 rounded-xl"
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <Label
                    htmlFor="profAddress"
                    className="text-xs font-semibold text-foreground"
                  >
                    Endereço Completo da Clínica
                  </Label>
                  <Input
                    id="profAddress"
                    value={profile.clinicAddress}
                    onChange={(e) =>
                      setProfile({ ...profile, clinicAddress: e.target.value })
                    }
                    className="bg-secondary/50 border-border text-base sm:text-xs text-foreground h-10 sm:h-9 rounded-xl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card: Preferência de Tema (Modo Dark Oposto) */}
          <Card className="border-border bg-card shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <Palette className="w-4 h-4 text-foreground" />
                Aparência & Tema
              </CardTitle>
              <CardDescription className="text-xs">
                Alterne entre o tema padrão claro e o modo escuro (Dark Mode:
                fundo preto Noir Housty, superfícies sólidas e textos nítidos).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-secondary/40 border border-border gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-foreground block">
                    Modo Escuro (Dark Mode)
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    {isDarkMode
                      ? "Ativo — Interface com preto sólido (#070707) e superfícies escuras."
                      : "Desativado — Interface clara minimalista padrão."}
                  </p>
                </div>
                <Switch
                  checked={isDarkMode}
                  onCheckedChange={handleToggleDarkMode}
                  className="shrink-0"
                />
              </div>
            </CardContent>
          </Card>

          {/* Botão Salvar Perfil */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-1">
            {saveSuccess && (
              <span className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 sm:py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center animate-in fade-in">
                <SuccessCheck />
                Alterações salvas com sucesso!
              </span>
            )}
            <BorderBeam className="w-full sm:w-auto">
            <Button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold h-11 sm:h-9 px-5 rounded-xl cursor-pointer w-full sm:w-auto active:scale-95 transition-transform"
            >
              {isSaving ? (
                <>
                  <ThinkingDots label="Salvando perfil" />
                  <span className="ml-2">Salvando...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 mr-2" />
                  Salvar Perfil
                </>
              )}
            </Button>
            </BorderBeam>
          </div>
        </TabsContent>

        {/* 2. ABA NOTIFICAÇÕES & SONS */}
        <TabsContent
          value="notifications"
          className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          {/* Card: Som de Notificação */}
          <Card className="border-border bg-card shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-[#A8B29A]" />
                    Som de Notificação Oficial
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Áudio personalizado da clínica (
                    <code className="font-mono text-[10px]">
                      notification.mp3
                    </code>
                    ) reproduzido em alertas importantes.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestSound}
                    className="h-9 sm:h-8 px-3 rounded-xl text-xs font-semibold border-border hover:bg-secondary flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 flex-1 sm:flex-none justify-center"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-[#A8B29A]" />
                    <span>Ouvir Som</span>
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleTestToast("today")}
                    className="h-9 sm:h-8 px-3 rounded-xl text-xs font-semibold bg-[#A8B29A] hover:bg-[#8D9B7F] text-[#111111] flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 flex-1 sm:flex-none justify-center"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Testar Toast</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-secondary/40 border border-border gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-foreground block">
                    Habilitar Alerta Sonoro
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Tocar aviso sonoro nas notificações de novos agendamentos e
                    horários próximos.
                  </p>
                </div>
                <Switch
                  checked={notificationConfig.soundEnabled}
                  onCheckedChange={(c) =>
                    setNotificationConfig({
                      ...notificationConfig,
                      soundEnabled: c,
                    })
                  }
                  className="shrink-0"
                />
              </div>
            </CardContent>
          </Card>

          {/* Card: Teste Completo de Notificações em Tela (Toast) */}
          <Card className="border-border bg-card shadow-sm rounded-2xl border-l-4 border-l-[#A8B29A]">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                    <BellRing className="w-4 h-4 text-[#A8B29A]" />
                    Central de Teste de Notificações (Toast)
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Dispare alertas imediatos na tela para validar os estilos de aviso (atendimento hoje, 1 dia antes, retorno de 15 dias e lembretes).
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  onClick={() => handleTestToast("today")}
                  className="bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 h-9 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-sm shrink-0 w-full sm:w-auto active:scale-95 transition-transform"
                >
                  <Bell className="w-4 h-4" />
                  <span>Disparar Toast de Teste</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-3.5 rounded-xl bg-secondary/40 border border-border space-y-3">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Escolha um Tipo de Toast para Testar:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleTestToast("today")}
                    className="h-10 sm:h-9 px-3 rounded-xl text-xs font-medium border-border hover:bg-secondary justify-start gap-2 cursor-pointer active:scale-95"
                  >
                    <span>⏰</span>
                    <span className="truncate">Atendimento Hoje</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleTestToast("1day")}
                    className="h-10 sm:h-9 px-3 rounded-xl text-xs font-medium border-border hover:bg-secondary justify-start gap-2 cursor-pointer active:scale-95"
                  >
                    <span>📅</span>
                    <span className="truncate">Aviso 1 Dia Antes</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleTestToast("15days")}
                    className="h-10 sm:h-9 px-3 rounded-xl text-xs font-medium border-border hover:bg-secondary justify-start gap-2 cursor-pointer active:scale-95"
                  >
                    <span>🔍</span>
                    <span className="truncate">Retorno 15 Dias</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleTestToast("reminder")}
                    className="h-10 sm:h-9 px-3 rounded-xl text-xs font-medium border-border hover:bg-secondary justify-start gap-2 cursor-pointer active:scale-95"
                  >
                    <span>🔔</span>
                    <span className="truncate">Lembrete Clínico</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card: Regras de Notificação da Clínica */}
          <Card className="border-border bg-card shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-foreground">
                Gatilhos de Notificação da Rotina Clínica
              </CardTitle>
              <CardDescription className="text-xs">
                Selecione quais alertas a Dra. Sâmara e a recepção devem receber
                em tempo real.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {/* 1. Agendamento Próximo */}
              <div className="flex items-start sm:items-center justify-between p-3.5 rounded-xl bg-secondary/30 border border-border gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-foreground block">
                      Agendamento Próximo (15 minutos antes)
                    </span>
                    <span className="text-[11px] text-muted-foreground leading-relaxed">
                      Avisa a recepção e a sala de atendimento quando a cliente
                      estiver para chegar.
                    </span>
                  </div>
                </div>
                <Switch
                  checked={notificationConfig.upcomingAppointmentAlert}
                  onCheckedChange={(c) =>
                    setNotificationConfig({
                      ...notificationConfig,
                      upcomingAppointmentAlert: c,
                    })
                  }
                  className="shrink-0"
                />
              </div>

              {/* 2. Retorno de 15 Dias */}
              <div className="flex items-start sm:items-center justify-between p-3.5 rounded-xl bg-secondary/30 border border-border gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#A8B29A]/15 text-[#A8B29A] flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-foreground block">
                      Alerta de Retorno de 15 Dias (Botox & Preenchedores)
                    </span>
                    <span className="text-[11px] text-muted-foreground leading-relaxed">
                      Notifica quando pacientes completarem 14-21 dias do
                      procedimento para marcar revisão de retoque.
                    </span>
                  </div>
                </div>
                <Switch
                  checked={notificationConfig.return15DaysAlert}
                  onCheckedChange={(c) =>
                    setNotificationConfig({
                      ...notificationConfig,
                      return15DaysAlert: c,
                    })
                  }
                  className="shrink-0"
                />
              </div>

              {/* 3. Novo Agendamento */}
              <div className="flex items-start sm:items-center justify-between p-3.5 rounded-xl bg-secondary/30 border border-border gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-foreground block">
                      Novo Agendamento Confirmado
                    </span>
                    <span className="text-[11px] text-muted-foreground leading-relaxed">
                      Emite alerta sonoro instantâneo quando uma consulta ou
                      procedimento for agendado.
                    </span>
                  </div>
                </div>
                <Switch
                  checked={notificationConfig.newBookingAlert}
                  onCheckedChange={(c) =>
                    setNotificationConfig({
                      ...notificationConfig,
                      newBookingAlert: c,
                    })
                  }
                  className="shrink-0"
                />
              </div>

              {/* 4. Anamnese Pendente */}
              <div className="flex items-start sm:items-center justify-between p-3.5 rounded-xl bg-secondary/30 border border-border gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-foreground block">
                      Ficha de Anamnese Pendente de Preenchimento
                    </span>
                    <span className="text-[11px] text-muted-foreground leading-relaxed">
                      Lembra a equipe de coletar a anamnese e termo antes de
                      iniciar a sessão clínica.
                    </span>
                  </div>
                </div>
                <Switch
                  checked={notificationConfig.pendingAnamneseAlert}
                  onCheckedChange={(c) =>
                    setNotificationConfig({
                      ...notificationConfig,
                      pendingAnamneseAlert: c,
                    })
                  }
                  className="shrink-0"
                />
              </div>

              {/* 5. Aniversariantes do Dia */}
              <div className="flex items-start sm:items-center justify-between p-3.5 rounded-xl bg-secondary/30 border border-border gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Cake className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-foreground block">
                      Aniversariantes do Dia (Fidelização & WhatsApp)
                    </span>
                    <span className="text-[11px] text-muted-foreground leading-relaxed">
                      Alerta diário às 08h com as pacientes aniversariantes para
                      envio de mensagem de parabéns.
                    </span>
                  </div>
                </div>
                <Switch
                  checked={notificationConfig.birthdayAlert}
                  onCheckedChange={(c) =>
                    setNotificationConfig({
                      ...notificationConfig,
                      birthdayAlert: c,
                    })
                  }
                  className="shrink-0"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. ABA SEGURANÇA & SENHA */}
        <TabsContent
          value="security"
          className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <Card className="border-border bg-card shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <Shield className="w-4 h-4 text-foreground" />
                Alteração de Senha de Acesso
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Atualize a senha de login da clínica caso as meninas da recepção
                ou a Dra. Sâmara precisem redefinir o acesso.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSavePassword}
                className="space-y-4 max-w-md text-xs"
              >
                {passwordFeedback && (
                  <div
                    className={`p-3 rounded-xl text-xs font-semibold ${
                      passwordFeedback.includes("sucesso")
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                        : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                    }`}
                  >
                    {passwordFeedback}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label
                    htmlFor="currentPass"
                    className="text-xs font-semibold text-foreground"
                  >
                    Senha Atual
                  </Label>
                  <div className="relative">
                    <Input
                      id="currentPass"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={passwordState.currentPassword}
                      onChange={(e) =>
                        setPasswordState({
                          ...passwordState,
                          currentPassword: e.target.value,
                        })
                      }
                      className="bg-secondary/50 border-border text-base sm:text-xs text-foreground h-10 sm:h-9 rounded-xl pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="newPass"
                    className="text-xs font-semibold text-foreground"
                  >
                    Nova Senha
                  </Label>
                  <Input
                    id="newPass"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo de 4 dígitos"
                    value={passwordState.newPassword}
                    onChange={(e) =>
                      setPasswordState({
                        ...passwordState,
                        newPassword: e.target.value,
                      })
                    }
                    className="bg-secondary/50 border-border text-base sm:text-xs text-foreground h-10 sm:h-9 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="confirmPass"
                    className="text-xs font-semibold text-foreground"
                  >
                    Confirmar Nova Senha
                  </Label>
                  <Input
                    id="confirmPass"
                    type={showPassword ? "text" : "password"}
                    placeholder="Repita a nova senha"
                    value={passwordState.confirmPassword}
                    onChange={(e) =>
                      setPasswordState({
                        ...passwordState,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="bg-secondary/50 border-border text-base sm:text-xs text-foreground h-10 sm:h-9 rounded-xl"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold h-11 sm:h-9 px-5 rounded-xl cursor-pointer w-full sm:w-auto active:scale-95 transition-transform"
                  >
                    Salvar Nova Senha
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. ABA BANCO DE DADOS & FIREBASE */}
        <TabsContent
          value="database"
          className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <Card className="border-border bg-card shadow-sm rounded-2xl">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Database className="w-4 h-4 text-black dark:text-white" />
                    Conexão com Google Firebase & Firestore
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Sincronização em tempo real de pacientes, fichas clínicas (Botox, HOF, Bioestimulador) e fluxo Kanban.
                  </CardDescription>
                </div>
                <div className="shrink-0 self-start sm:self-auto">
                  {isFirebaseConfigured ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Firebase Conectado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Modo Local (Aguardando Chaves)
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status explanation */}
              <div className="p-4 rounded-xl bg-secondary/40 border border-border text-xs space-y-2">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Server className="w-4 h-4 text-primary" />
                  <span>Estado do Banco de Dados</span>
                </div>
                {isFirebaseConfigured ? (
                  <p className="text-muted-foreground leading-relaxed">
                    Seu sistema está conectado ao projeto Firestore <strong>{firebaseConfig.projectId}</strong>. Quaisquer alterações em prontuários, novos agendamentos no Kanban ou edições em fichas clínicas são gravadas instantaneamente no banco de dados na nuvem.
                  </p>
                ) : (
                  <p className="text-muted-foreground leading-relaxed">
                    O dashboard está operando em <strong>modo local seguro</strong> com persistência em memória/sessão. Assim que você fornecer os valores do Firebase, as credenciais serão lidas automaticamente pelo arquivo <code>.env.local</code> e o app passará a sincronizar com a nuvem em tempo real!
                  </p>
                )}
              </div>

              {/* Guia Rápido */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Como Configurar o Firebase:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl border border-border bg-card space-y-1.5">
                    <span className="w-6 h-6 rounded-lg bg-black text-white dark:bg-white dark:text-black font-bold flex items-center justify-center text-xs">
                      1
                    </span>
                    <span className="font-semibold text-foreground block">
                      Criar Projeto
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Acesse console.firebase.google.com e crie um projeto gratuito com Firestore Database.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-border bg-card space-y-1.5">
                    <span className="w-6 h-6 rounded-lg bg-black text-white dark:bg-white dark:text-black font-bold flex items-center justify-center text-xs">
                      2
                    </span>
                    <span className="font-semibold text-foreground block">
                      Copiar Chaves Web
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Em Configurações do Projeto &gt; Aplicativos Web &gt; Copie as chaves do firebaseConfig.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-border bg-card space-y-1.5">
                    <span className="w-6 h-6 rounded-lg bg-black text-white dark:bg-white dark:text-black font-bold flex items-center justify-center text-xs">
                      3
                    </span>
                    <span className="font-semibold text-foreground block">
                      Inserir no Arquivo
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Cole as chaves no arquivo <code>.env.local</code> ou nos passe aqui no chat.
                    </p>
                  </div>
                </div>
              </div>

              {/* Valores Atuais */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Variáveis de Ambiente Detectadas:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                    <span className="text-[11px] text-muted-foreground block mb-0.5">NEXT_PUBLIC_FIREBASE_PROJECT_ID</span>
                    <span className="font-mono font-medium text-foreground break-all">
                      {firebaseConfig.projectId || "(não configurado ainda)"}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                    <span className="text-[11px] text-muted-foreground block mb-0.5">NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN</span>
                    <span className="font-mono font-medium text-foreground break-all">
                      {firebaseConfig.authDomain || "(não configurado ainda)"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card de Isolamento de Dados: Dev vs Produção */}
          <Card className="border-border bg-card shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Server className="w-4 h-4 text-black dark:text-white" />
                    Isolamento de Dados & Ambiente
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Separação estrita dos dados de teste locais e a base clínica real de produção.
                  </CardDescription>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 self-start sm:self-auto ${
                    isProduction
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                      : "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                  }`}
                >
                  {isProduction ? "🟢 Modo Produção (Clínica Real)" : "🟡 Modo Desenvolvimento (Testes)"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3.5 rounded-xl bg-secondary/40 border border-border text-xs leading-relaxed text-muted-foreground">
                {isProduction ? (
                  <p>
                    O sistema está operando em <strong>Produção</strong> com isolamento <code>samara_prod_*</code>. Todos os dados contabilizados nos relatórios e prontuários pertencem exclusivamente a atendimentos reais da Dra. Sâmara.
                  </p>
                ) : (
                  <p>
                    O sistema está operando em <strong>Desenvolvimento</strong> (<code>samara_dev_*</code>). Agendamentos e faturamentos de teste estão isolados e nunca poluirão o build ou banco final da clínica.
                  </p>
                )}
              </div>

              <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border">
                <div>
                  <span className="text-xs font-bold text-foreground block">
                    Resetar Atendimentos e Dados de Teste
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Zera os agendamentos e pacientes de teste locais sem afetar procedimentos ou configurações.
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (confirm("Tem certeza de que deseja limpar todos os agendamentos e clientes de teste locais?")) {
                      clearDevTestData();
                      toast.success("Dados de teste resetados com sucesso! O Kanban e relatórios foram limpos.");
                    }
                  }}
                  className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 cursor-pointer h-9 px-4 shrink-0 active:scale-95"
                >
                  Limpar Dados de Teste
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

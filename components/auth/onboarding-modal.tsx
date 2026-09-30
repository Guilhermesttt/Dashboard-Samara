"use client";

import React, { useState } from "react";
import {
  Sparkles,
  CalendarCheck,
  FileText,
  TrendingUp,
  Camera,
  Upload,
  Clock,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  User,
  Phone,
  Briefcase,
} from "lucide-react";
import { ModalPortal } from "@/components/ui/modal-portal";
import { playNotificationSound } from "@/lib/sound";
import {
  setStoredUserProfile,
  setStoredClinicSchedule,
  ClinicScheduleData,
  DEFAULT_CLINIC_SCHEDULE,
  STORAGE_KEYS,
} from "@/lib/storage-keys";
import { saveUserProfileToFirestore } from "@/lib/firebase-service";
import { toast } from "sonner";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialName?: string;
  initialEmail?: string;
}

export function OnboardingModal({
  isOpen,
  onClose,
  initialName = "Dra. Sâmara Souza",
  initialEmail = "samara@samaraestetica.com.br",
}: OnboardingModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Passo 2 State: Perfil e Horários
  const [name, setName] = useState(initialName);
  const [role, setRole] = useState("Biomédica Esteta • Harmonização Facial");
  const [crbm, setCrbm] = useState("CRBM 34.819-SP");
  const [phone, setPhone] = useState("(11) 98844-2200");
  const [photoUrl, setPhotoUrl] = useState<string>("");

  const [startHour, setStartHour] = useState("08:00");
  const [endHour, setEndHour] = useState("18:00");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [workDays, setWorkDays] = useState<string[]>([
    "Seg",
    "Ter",
    "Qua",
    "Qui",
    "Sex",
    "Sáb",
  ]);

  const [isFinishing, setIsFinishing] = useState(false);

  if (!isOpen) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const b64 = event.target?.result as string;
      setPhotoUrl(b64);
      toast.success("Foto de perfil carregada!");
    };
    reader.readAsDataURL(file);
  };

  const toggleDay = (day: string) => {
    if (workDays.includes(day)) {
      if (workDays.length > 1) {
        setWorkDays(workDays.filter((d) => d !== day));
      }
    } else {
      setWorkDays([...workDays, day]);
    }
  };

  const handleCompleteOnboarding = async () => {
    setIsFinishing(true);

    try {
      const profileData = {
        name: name.trim(),
        email: initialEmail.trim(),
        title: role.trim(),
        crm: crbm.trim(),
        phone: phone.trim(),
        photoUrl: photoUrl || undefined,
        bio: `Atendimento de ${startHour} às ${endHour}`,
      };

      const scheduleData: ClinicScheduleData = {
        startHour,
        endHour,
        appointmentDurationMinutes: durationMinutes,
        workDays,
      };

      // 1. Salva localmente
      setStoredUserProfile(profileData);
      setStoredClinicSchedule(scheduleData);
      try {
        localStorage.setItem(STORAGE_KEYS.ONBOARDING_DONE, "true");
      } catch (e) {}

      // 2. Salva no Firestore
      await saveUserProfileToFirestore({
        ...profileData,
        schedule: scheduleData,
      });

      playNotificationSound();
      toast.success(`Seja muito bem-vinda, ${name.split(" ")[0]}!`, {
        description: "Seu perfil e preferências clínicas foram configurados com sucesso.",
        duration: 5000,
      });

      setTimeout(() => {
        setIsFinishing(false);
        onClose();
      }, 500);
    } catch (err) {
      console.error("Erro ao salvar onboarding:", err);
      setIsFinishing(false);
      onClose();
    }
  };

  const daysList = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  return (
    <ModalPortal isOpen={isOpen}>
      <div
        className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md select-none animate-in fade-in duration-200"
        style={{
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-[#161616] text-black dark:text-white rounded-[28px] border border-black/[0.08] dark:border-white/[0.12] shadow-[0_32px_80px_-16px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] w-full max-w-[620px] p-5 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto scroll-momentum pb-[max(1.5rem,env(safe-area-inset-bottom,16px))]"
        >
          {/* Header & Steps Indicator */}
          <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.06] pb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#A8B29A] animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8D9B7F]">
                Boas-Vindas à Plataforma Clínica
              </span>
            </div>
            {/* Step Pills */}
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    step === s
                      ? "w-7 bg-[#A8B29A]"
                      : step > s
                      ? "w-2.5 bg-[#8D9B7F]"
                      : "w-2.5 bg-black/10 dark:bg-white/15"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* ============================================================ */}
          {/* PASSO 1: Boas-vindas e Apresentação dos Pilares              */}
          {/* ============================================================ */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-1.5 text-center sm:text-left">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-black dark:text-white">
                  Olá, Dra. Sâmara!
                </h2>
                <p className="text-xs sm:text-sm text-[#767676] dark:text-[#8D9B7F] leading-relaxed">
                  Criamos este espaço exclusivo para gerenciar seus procedimentos de harmonização facial, retornos de revisão e pacientes com o mais alto padrão estético.
                </p>
              </div>

              {/* 3 Pilares Visuais da Plataforma */}
              <div className="grid grid-cols-1 gap-3">
                <div className="p-3.5 sm:p-4 rounded-2xl bg-[#fafafa] dark:bg-[#232323] border border-black/[0.04] dark:border-white/[0.06] flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#A8B29A]/15 text-[#3b472e] dark:text-[#A8B29A] flex items-center justify-center shrink-0 border border-[#A8B29A]/20">
                    <CalendarCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-black dark:text-white">
                      Agenda Inteligente & Retornos de 15 Dias
                    </h4>
                    <p className="text-[11px] text-[#767676] dark:text-[#8D9B7F] mt-0.5 leading-relaxed">
                      Ao concluir procedimentos como Botox e Bioestimuladores, o sistema agenda a revisão de 15 dias sem risco de duplicações.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 sm:p-4 rounded-2xl bg-[#fafafa] dark:bg-[#232323] border border-black/[0.04] dark:border-white/[0.06] flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#1a1a1c] text-black dark:text-white flex items-center justify-center shrink-0 border border-black/[0.06] dark:border-white/[0.08]">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-black dark:text-white">
                      Prontuário Digital & Mapeamento Facial
                    </h4>
                    <p className="text-[11px] text-[#767676] dark:text-[#8D9B7F] mt-0.5 leading-relaxed">
                      Acompanhamento fotográfico antes/depois, pontos anatômicos e fichas de anamnese personalizadas.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 sm:p-4 rounded-2xl bg-[#fafafa] dark:bg-[#232323] border border-black/[0.04] dark:border-white/[0.06] flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#F7F5F0] text-black flex items-center justify-center shrink-0 border border-black/[0.06]">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-black dark:text-white">
                      Faturamento & Procedimentos Mais Procurados
                    </h4>
                    <p className="text-[11px] text-[#767676] dark:text-[#8D9B7F] mt-0.5 leading-relaxed">
                      Métricas reais calculadas automaticamente conforme você atende suas clientes no dia a dia.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full sm:w-auto h-11 px-6 rounded-xl bg-[#A8B29A] hover:bg-[#8D9B7F] active:bg-[#7a886c] text-[#111111] text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <span>Configurar Meu Perfil & Horários</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* PASSO 2: Personalização de Foto, Perfil e Horários           */}
          {/* ============================================================ */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-black dark:text-white">
                  Personalize Seu Perfil Clínico
                </h3>
                <p className="text-xs text-[#767676] dark:text-[#8D9B7F]">
                  Adicione sua foto e defina os horários de atendimento da clínica para calibrar a agenda.
                </p>
              </div>

              {/* Upload de Foto de Perfil */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#fafafa] dark:bg-[#232323] border border-black/[0.06] dark:border-white/[0.08]">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-black text-white shrink-0 border-2 border-[#A8B29A] flex items-center justify-center shadow-md">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt="Foto de perfil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-bold text-[#A8B29A]">DS</span>
                  )}
                  <label
                    htmlFor="onboarding-photo"
                    className="absolute inset-0 bg-black/40 hover:bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer text-white"
                    title="Enviar foto de perfil"
                  >
                    <Camera className="w-5 h-5" />
                  </label>
                  <input
                    id="onboarding-photo"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-black dark:text-white block">
                    Foto Profissional (Opcional)
                  </span>
                  <p className="text-[11px] text-[#767676] dark:text-[#8D9B7F]">
                    Sua foto será exibida no cabeçalho e nas receitas e atestados emitidos.
                  </p>
                  <label
                    htmlFor="onboarding-photo"
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#8D9B7F] hover:text-[#A8B29A] cursor-pointer mt-1"
                  >
                    <Upload className="w-3 h-3" />
                    <span>{photoUrl ? "Trocar foto de perfil" : "Escolher foto"}</span>
                  </label>
                </div>
              </div>

              {/* Dados Pessoais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-black dark:text-white">Nome de Exibição *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-[#fafafa] dark:bg-[#232323] border border-black/[0.08] dark:border-white/[0.08] focus:border-[#A8B29A] text-xs text-black dark:text-white outline-none"
                    placeholder="Dra. Sâmara Souza"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-black dark:text-white">Título / Especialidade</label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-[#fafafa] dark:bg-[#232323] border border-black/[0.08] dark:border-white/[0.08] focus:border-[#A8B29A] text-xs text-black dark:text-white outline-none"
                    placeholder="Biomédica Esteta"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-black dark:text-white">Registro / CRBM / CRM</label>
                  <input
                    type="text"
                    value={crbm}
                    onChange={(e) => setCrbm(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-[#fafafa] dark:bg-[#232323] border border-black/[0.08] dark:border-white/[0.08] focus:border-[#A8B29A] text-xs text-black dark:text-white outline-none"
                    placeholder="CRBM 34.819-SP"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-black dark:text-white">WhatsApp Clínico</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-[#fafafa] dark:bg-[#232323] border border-black/[0.08] dark:border-white/[0.08] focus:border-[#A8B29A] text-xs text-black dark:text-white outline-none"
                    placeholder="(11) 98844-2200"
                  />
                </div>
              </div>

              {/* Horários de Atendimento */}
              <div className="p-4 rounded-2xl bg-[#fafafa] dark:bg-[#232323] border border-black/[0.06] dark:border-white/[0.08] space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#A8B29A]" />
                  <span className="text-xs font-bold text-black dark:text-white">
                    Horários de Atendimento da Clínica
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="space-y-1">
                    <span className="text-[11px] text-[#767676] dark:text-[#8D9B7F]">Início do Expediente</span>
                    <input
                      type="time"
                      value={startHour}
                      onChange={(e) => setStartHour(e.target.value)}
                      className="w-full h-9 px-2.5 rounded-lg bg-white dark:bg-[#1a1a1c] border border-black/[0.08] dark:border-white/[0.08] text-xs text-black dark:text-white outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] text-[#767676] dark:text-[#8D9B7F]">Término do Expediente</span>
                    <input
                      type="time"
                      value={endHour}
                      onChange={(e) => setEndHour(e.target.value)}
                      className="w-full h-9 px-2.5 rounded-lg bg-white dark:bg-[#1a1a1c] border border-black/[0.08] dark:border-white/[0.08] text-xs text-black dark:text-white outline-none"
                    />
                  </div>

                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <span className="text-[11px] text-[#767676] dark:text-[#8D9B7F]">Duração Média</span>
                    <select
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value))}
                      className="w-full h-9 px-2.5 rounded-lg bg-white dark:bg-[#1a1a1c] border border-black/[0.08] dark:border-white/[0.08] text-xs text-black dark:text-white outline-none"
                    >
                      <option value={30}>30 minutos</option>
                      <option value={45}>45 minutos</option>
                      <option value={60}>60 minutos (Padrão)</option>
                      <option value={90}>90 minutos</option>
                    </select>
                  </div>
                </div>

                {/* Dias de Atendimento */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] text-[#767676] dark:text-[#8D9B7F] block">
                    Dias de Atendimento na Semana
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {daysList.map((day) => {
                      const isSelected = workDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={`h-8 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
                            isSelected
                              ? "bg-[#A8B29A] text-[#111111] shadow-sm"
                              : "bg-white dark:bg-[#1a1a1c] text-[#767676] dark:text-[#8D9B7F] border border-black/[0.06] dark:border-white/[0.08]"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Botões de Navegação */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="h-10 px-4 rounded-xl text-xs font-semibold text-[#767676] dark:text-[#8D9B7F] hover:text-black dark:hover:text-white cursor-pointer transition-colors"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="h-11 px-6 rounded-xl bg-[#A8B29A] hover:bg-[#8D9B7F] active:bg-[#7a886c] text-[#111111] text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <span>Revisar & Concluir</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* PASSO 3: Conclusão & Acesso ao Painel                         */}
          {/* ============================================================ */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-1.5 text-center sm:text-left">
                <div className="w-12 h-12 rounded-2xl bg-[#A8B29A]/20 text-[#2c3720] dark:text-[#A8B29A] flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-black dark:text-white">
                  Tudo pronto para começar!
                </h3>
                <p className="text-xs sm:text-sm text-[#767676] dark:text-[#8D9B7F]">
                  Sua clínica já está calibrada com seus dados e regras de atendimento.
                </p>
              </div>

              {/* Resumo Card */}
              <div className="p-4 rounded-2xl bg-[#fafafa] dark:bg-[#232323] border border-black/[0.06] dark:border-white/[0.08] space-y-3 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-black/[0.04] dark:border-white/[0.06]">
                  <span className="text-[#767676] dark:text-[#8D9B7F]">Profissional</span>
                  <span className="font-bold text-black dark:text-white">{name}</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-black/[0.04] dark:border-white/[0.06]">
                  <span className="text-[#767676] dark:text-[#8D9B7F]">Especialidade / CRBM</span>
                  <span className="font-semibold text-black dark:text-white">{role} • {crbm}</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-black/[0.04] dark:border-white/[0.06]">
                  <span className="text-[#767676] dark:text-[#8D9B7F]">Horário de Atendimento</span>
                  <span className="font-semibold text-black dark:text-white">
                    {startHour} às {endHour} ({durationMinutes}min/sessão)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#767676] dark:text-[#8D9B7F]">Dias Clínicos</span>
                  <span className="font-semibold text-[#8D9B7F] dark:text-[#A8B29A]">
                    {workDays.join(", ")}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="h-10 px-4 rounded-xl text-xs font-semibold text-[#767676] dark:text-[#8D9B7F] hover:text-black dark:hover:text-white cursor-pointer transition-colors"
                >
                  Ajustar Informações
                </button>
                <button
                  type="button"
                  disabled={isFinishing}
                  onClick={handleCompleteOnboarding}
                  className="h-11 px-7 rounded-xl bg-[#A8B29A] hover:bg-[#8D9B7F] active:bg-[#7a886c] text-[#111111] text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-75"
                >
                  {isFinishing ? (
                    <span>Salvando perfil...</span>
                  ) : (
                    <>
                      <span>Acessar Meu Painel Clínico</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ModalPortal>
  );
}

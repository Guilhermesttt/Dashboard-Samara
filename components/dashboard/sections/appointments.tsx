"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Clock,
  Plus,
  Search,
  CheckCircle2,
  Sparkles,
  User,
  ArrowRight,
  MessageCircle,
  CalendarCheck,
  RotateCcw,
  X,
  Volume2,
  GripVertical,
  Zap,
  Trash2,
} from "lucide-react";
import { ModalPortal } from "@/components/ui/modal-portal";
import { playNotificationSound } from "@/lib/sound";
import { toast } from "sonner";
import {
  CustomerProfileModal,
  PatientRecord,
} from "./customer-profile-modal";
import { CustomerFormModal } from "./customer-form-modal";
import { AnamneseFormModal, AnamneseData } from "./anamnese-form-modal";
import { initialPatients } from "./customers";
import { cn } from "@/lib/utils";
import {
  saveAppointmentToFirestore,
  updateAppointmentStatusInFirestore,
  subscribeToAppointments,
  savePatientToFirestore,
  deleteAppointmentFromFirestore,
} from "@/lib/firebase-service";
import { isFirebaseConfigured } from "@/lib/firebase";
import { SlidingTabs, AnimatedNumber, KineticHeading } from "@/components/motion";

export interface Appointment {
  id: string;
  patientName: string;
  patientPhone: string;
  procedureName: string;
  category: "Facial" | "Corporal" | "Facial/Corporal";
  type: "Aplicação" | "Retorno de 15 Dias" | "Avaliação / Consulta";
  date: string;
  time: string;
  value: number;
  status: "agendado" | "confirmado" | "em_atendimento" | "retorno_pendente" | "concluido";
  notes?: string;
}

const initialAppointments: Appointment[] = [];

const stages: {
  id: Appointment["status"];
  label: string;
  color: string;
  desc: string;
}[] = [
  { id: "agendado", label: "Agendados", color: "bg-blue-500", desc: "Aguardando confirmação" },
  { id: "retorno_pendente", label: "Retorno 15 Dias", color: "bg-amber-500", desc: "Revisão e retoque" },
  { id: "confirmado", label: "Confirmados", color: "bg-emerald-500", desc: "Confirmado no WhatsApp" },
  { id: "em_atendimento", label: "Em Sala", color: "bg-purple-500", desc: "Com a Dra. Samara" },
  { id: "concluido", label: "Concluídos", color: "bg-gray-400", desc: "Atendimento finalizado" },
];

export function AppointmentsSection() {
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("samara_real_appointments");
        if (stored) return JSON.parse(stored);
      } catch (e) {}
    }
    return [];
  });
  const [patients, setPatients] = useState<PatientRecord[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("samara_real_patients");
        if (stored) return JSON.parse(stored);
      } catch (e) {}
    }
    return [];
  });
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [selectedDayFilter, setSelectedDayFilter] = useState<"todos" | "hoje" | "retornos">("hoje");
  const [searchQuery, setSearchQuery] = useState("");
  const [autoFlowEnabled, setAutoFlowEnabled] = useState(true);

  // Persist real appointments locally
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("samara_real_appointments", JSON.stringify(appointments));
        window.dispatchEvent(new Event("samara_appointments_updated"));
      } catch (e) {}
    }
  }, [appointments]);

  // Drag and drop state (GitHub / Jira / ClickUp style Kanban)
  const [draggedAptId, setDraggedAptId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  // Modais de Paciente & Prontuário
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isAnamneseModalOpen, setIsAnamneseModalOpen] = useState(false);
  const [isEditCustomerModalOpen, setIsEditCustomerModalOpen] = useState(false);

  // Modal Novo Agendamento
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formPatientName, setFormPatientName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formProcedure, setFormProcedure] = useState("Botox");
  const [formType, setFormType] = useState<Appointment["type"]>("Aplicação");
  const [formDate, setFormDate] = useState("Hoje");
  const [formTime, setFormTime] = useState("14:30");
  const [formValue, setFormValue] = useState("900");
  const [formNotes, setFormNotes] = useState("");

  // Modal de Exclusão de Agendamento
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);
  const [isDeletingAppointment, setIsDeletingAppointment] = useState(false);

  // Realtime Firebase Firestore Sync
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const unsub = subscribeToAppointments((remoteApts) => {
      if (remoteApts && remoteApts.length > 0) {
        setAppointments(remoteApts);
      }
    });
    return () => {
      if (unsub) unsub();
    };
  }, []);

  // Alerta sonoro automático para agendamentos próximos (hoje)
  const alertPlayedRef = useRef(false);
  useEffect(() => {
    const hasTodayApts = appointments.some(
      (a) => a.date === "Hoje" && (a.status === "agendado" || a.status === "confirmado")
    );
    if (hasTodayApts && !alertPlayedRef.current) {
      const timer = setTimeout(() => {
        playNotificationSound();
        alertPlayedRef.current = true;
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [appointments]);

  // Auto-Fluxo Clínico Inteligente: move os cards automaticamente ao decorrer dos processos e horários
  useEffect(() => {
    if (!autoFlowEnabled) return;

    const checkAndAdvance = () => {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const nowTotalMin = currentHours * 60 + currentMinutes;

      setAppointments((prev) => {
        let hasChanges = false;
        const createdReturns: Appointment[] = [];

        const updated = prev.map((apt) => {
          if (apt.status === "concluido") return apt;

          // Só auto-avança atendimentos marcados para HOJE
          const isToday =
            apt.date?.toLowerCase() === "hoje" ||
            apt.date === now.toLocaleDateString("pt-BR") ||
            apt.date === now.toISOString().split("T")[0];

          if (!isToday) return apt;

          const timeMatch = apt.time?.match(/^(\d{1,2}):(\d{2})/);
          if (!timeMatch) return apt;

          const aptHour = parseInt(timeMatch[1], 10);
          const aptMin = parseInt(timeMatch[2], 10);
          const aptTotalMin = aptHour * 60 + aptMin;

          // 1. Agendado -> Confirmado automaticamente se for para hoje e faltar 60 min ou menos
          if (apt.status === "agendado" && nowTotalMin >= aptTotalMin - 60) {
            hasChanges = true;
            toast.info(`📋 Paciente Confirmada: ${apt.patientName}`, {
              description: `${apt.procedureName} hoje às ${apt.time}. Movida automaticamente para Confirmados.`,
              duration: 4000,
            });
            updateAppointmentStatusInFirestore(apt.id, "confirmado");
            return { ...apt, status: "confirmado" as const };
          }

          // 2. Confirmado ou Retorno 15 Dias -> Em Sala quando atingir o horário (ex: 22:40)
          if (
            (apt.status === "confirmado" || apt.status === "retorno_pendente") &&
            nowTotalMin >= aptTotalMin &&
            nowTotalMin < aptTotalMin + 90
          ) {
            hasChanges = true;
            playNotificationSound();
            toast.success(`✨ Paciente Em Sala: ${apt.patientName}`, {
              description: `Horário ${apt.time} atingido! Iniciando atendimento de ${apt.procedureName} com a Dra. Sâmara.`,
              duration: 6000,
            });
            updateAppointmentStatusInFirestore(apt.id, "em_atendimento");
            return { ...apt, status: "em_atendimento" as const };
          }

          // 3. Em Sala -> Concluído após 60 min do horário agendado
          if (apt.status === "em_atendimento" && nowTotalMin >= aptTotalMin + 60) {
            hasChanges = true;
            playNotificationSound();

            const isBotoxOrFiller =
              apt.procedureName?.toLowerCase().includes("botox") ||
              apt.procedureName?.toLowerCase().includes("preenchimento") ||
              apt.procedureName?.toLowerCase().includes("rinomodelação") ||
              apt.procedureName?.toLowerCase().includes("bio") ||
              apt.procedureName?.toLowerCase().includes("fios");

            if (isBotoxOrFiller && apt.type !== "Retorno de 15 Dias") {
              const returnDate = new Date();
              returnDate.setDate(returnDate.getDate() + 15);
              const day = String(returnDate.getDate()).padStart(2, "0");
              const month = String(returnDate.getMonth() + 1).padStart(2, "0");
              const year = returnDate.getFullYear();
              const returnFormatted = `${day}/${month}/${year}`;

              const returnApt: Appointment = {
                id: `apt-ret-${Date.now()}`,
                patientName: apt.patientName,
                patientPhone: apt.patientPhone,
                procedureName: `${apt.procedureName} (Revisão)`,
                category: apt.category,
                type: "Retorno de 15 Dias",
                date: returnFormatted,
                time: apt.time || "14:00",
                value: 0,
                status: "retorno_pendente",
                notes: `Retorno de revisão automática de 15 dias pós-${apt.procedureName}. Avaliar simetria e retoque.`,
              };
              createdReturns.push(returnApt);
              saveAppointmentToFirestore(returnApt);
            }

            toast.success(`✓ Procedimento Finalizado: ${apt.patientName}`, {
              description: `Atendimento de ${apt.procedureName} concluído com sucesso.`,
              duration: 5000,
            });
            updateAppointmentStatusInFirestore(apt.id, "concluido");
            return { ...apt, status: "concluido" as const };
          }

          return apt;
        });

        if (hasChanges) {
          const finalApts = [...createdReturns, ...updated];
          try {
            localStorage.setItem("samara_real_appointments", JSON.stringify(finalApts));
            window.dispatchEvent(new Event("samara_appointments_updated"));
          } catch (e) {}
          return finalApts;
        }

        return prev;
      });
    };

    checkAndAdvance();
    const timer = setInterval(checkAndAdvance, 10000);
    return () => clearInterval(timer);
  }, [autoFlowEnabled]);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  // Abrir modal do prontuário ao clicar no nome da cliente
  const handleOpenPatientProfile = (
    patientName: string,
    phone: string,
    procedureName?: string
  ) => {
    let patient = patients.find(
      (p) => p.name.trim().toLowerCase() === patientName.trim().toLowerCase()
    );

    if (!patient) {
      patient = patients.find(
        (p) =>
          p.name.toLowerCase().includes(patientName.toLowerCase()) ||
          patientName.toLowerCase().includes(p.name.toLowerCase())
      );
    }

    if (!patient) {
      const isBotox = procedureName?.toLowerCase().includes("botox");
      const isBio = procedureName?.toLowerCase().includes("bio");
      const isHof =
        procedureName?.toLowerCase().includes("preenchimento") ||
        procedureName?.toLowerCase().includes("rinomodelação") ||
        procedureName?.toLowerCase().includes("hof");

      const activeProcedures: ("botox" | "hof" | "bio")[] = [];
      if (isBotox) activeProcedures.push("botox");
      if (isHof) activeProcedures.push("hof");
      if (isBio) activeProcedures.push("bio");
      if (activeProcedures.length === 0) activeProcedures.push("botox");

      const newRecord: PatientRecord = {
        id: `pat-${Date.now()}`,
        name: patientName,
        cpf: "342.891.108-45",
        phone: phone || "(11) 98765-4321",
        email: `${patientName.toLowerCase().replace(/\s+/g, ".")}@gmail.com`,
        birthDate: "15/05/1992",
        age: 33,
        gender: "Feminino",
        location: "São Paulo, SP",
        profession: "Profissional Liberal",
        status: "Em Tratamento",
        totalSpent: 1200,
        proceduresCount: 1,
        lastProcedureDate: "Hoje",
        activeProcedures,
        anamnese: {
          clientId: `pat-${Date.now()}`,
          clientName: patientName,
          updatedAt: new Date().toLocaleDateString("pt-BR"),
          status: "completed",
          queixaPrincipal: `Agendamento de ${procedureName || "procedimento estético"}.`,
          emTratamentoMedico: false,
          cirurgiaPrevia: false,
          anestesiaGeral: false,
          anestesiaOdontologica: true,
          alergiaAnestesia: false,
          alergiaMedicamento: false,
          alergiaAlimento: false,
          medicamentoPressao: false,
          alteracaoCardiologica: false,
          proteseCardiaca: false,
          diabetico: false,
          convulsoesEpilepsia: false,
          disfuncaoRenal: false,
          coagulacaoSanguinea: false,
          gravidaLactante: false,
          herpesLabial: false,
          usoAnticoagulante: false,
          tratamentoEsteticoPrevio: true,
          tipoPele: "Mista",
          fotoenvelhecimento: "Leve",
          termoConsentimentoAceito: true,
        },
      };

      setPatients((prev) => {
        const next = [newRecord, ...prev];
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("samara_real_patients", JSON.stringify(next));
          } catch (e) {}
        }
        return next;
      });
      patient = newRecord;
    }

    setSelectedPatient(patient);
    setIsPatientModalOpen(true);
  };

  const handleUpdatePatient = (updatedPatient: PatientRecord) => {
    setPatients((prev) => {
      const next = prev.map((p) => (p.id === updatedPatient.id ? updatedPatient : p));
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("samara_real_patients", JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });
    setSelectedPatient(updatedPatient);
    savePatientToFirestore(updatedPatient);
  };

  const handleAdvanceStatus = (id: string, currentStatus: Appointment["status"]) => {
    let nextStatus: Appointment["status"] = "concluido";

    if (currentStatus === "agendado") {
      nextStatus = "confirmado";
    } else if (currentStatus === "retorno_pendente") {
      nextStatus = "confirmado";
    } else if (currentStatus === "confirmado") {
      nextStatus = "em_atendimento";
    } else if (currentStatus === "em_atendimento") {
      nextStatus = "concluido";
    }

    playNotificationSound();

    setAppointments((prev) => {
      let createdReturn: Appointment | null = null;
      const targetApt = prev.find((a) => a.id === id);

      // Se concluiu um procedimento em sala que exige retorno de 15 dias (Botox, etc)
      if (currentStatus === "em_atendimento" && targetApt && targetApt.type !== "Retorno de 15 Dias") {
        const needsReturn =
          targetApt.procedureName?.toLowerCase().includes("botox") ||
          targetApt.procedureName?.toLowerCase().includes("preenchimento") ||
          targetApt.procedureName?.toLowerCase().includes("rinomodelação") ||
          targetApt.procedureName?.toLowerCase().includes("fios") ||
          targetApt.procedureName?.toLowerCase().includes("bio");

        if (needsReturn) {
          const returnDateObj = new Date();
          returnDateObj.setDate(returnDateObj.getDate() + 15);
          const day = String(returnDateObj.getDate()).padStart(2, "0");
          const month = String(returnDateObj.getMonth() + 1).padStart(2, "0");
          const year = returnDateObj.getFullYear();
          const returnDateFormatted = `${day}/${month}/${year}`;

          createdReturn = {
            id: `apt-ret-${Date.now()}`,
            patientName: targetApt.patientName,
            patientPhone: targetApt.patientPhone,
            procedureName: `${targetApt.procedureName} (Revisão)`,
            category: targetApt.category,
            type: "Retorno de 15 Dias",
            date: returnDateFormatted,
            time: targetApt.time || "14:00",
            value: 0,
            status: "retorno_pendente",
            notes: `Retorno de 15 dias pós-${targetApt.procedureName}. Avaliar simetria e retoque.`,
          };
        }
      }

      const nextList = prev.map((item) => (item.id === id ? { ...item, status: nextStatus } : item));
      const finalList = createdReturn ? [createdReturn, ...nextList] : nextList;

      if (createdReturn) {
        saveAppointmentToFirestore(createdReturn);
        toast.info(`🔍 Retorno de 15 Dias Agendado Automaticamente!`, {
          description: `Revisão de ${targetApt?.patientName} programada para ${createdReturn.date} na coluna de Retornos.`,
          duration: 7000,
        });
      }

      updateAppointmentStatusInFirestore(id, nextStatus);
      return finalList;
    });
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
    setDraggedAptId(id);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverStage !== stageId) {
      setDragOverStage(stageId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverStage(null);
    }
  };

  const handleDrop = (e: React.DragEvent, stageId: Appointment["status"]) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || draggedAptId;
    if (id) {
      setAppointments((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: stageId } : item))
      );
      updateAppointmentStatusInFirestore(id, stageId);
      playNotificationSound();
    }
    setDraggedAptId(null);
    setDragOverStage(null);
  };

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      patientName: formPatientName.trim(),
      patientPhone: formPhone.trim() || "(11) 99999-9999",
      procedureName: formProcedure,
      category: "Facial",
      type: formType,
      date: formDate,
      time: formTime,
      value: formType === "Retorno de 15 Dias" ? 0 : parseFloat(formValue) || 0,
      status: "agendado",
      notes: formNotes.trim(),
    };

    setAppointments((prev) => [newApt, ...prev]);
    saveAppointmentToFirestore(newApt);
    setIsAddModalOpen(false);

    playNotificationSound();

    setFormPatientName("");
    setFormPhone("");
    setFormNotes("");
  };

  const handleConfirmDelete = async () => {
    if (!appointmentToDelete) return;
    const apt = appointmentToDelete;
    setIsDeletingAppointment(true);

    try {
      // 1. Remove localmente do estado
      setAppointments((prev) => prev.filter((a) => a.id !== apt.id));

      // 2. Remove do Firestore caso configurado
      await deleteAppointmentFromFirestore(apt.id);

      // 3. Fecha o modal de confirmação
      setAppointmentToDelete(null);

      // 4. Emite notificação Toast com botão Desfazer (Undo)
      toast(`Agendamento de ${apt.patientName} removido`, {
        description: `${apt.procedureName} • ${apt.time} (${apt.date})`,
        action: {
          label: "Desfazer",
          onClick: async () => {
            // Restaura no estado local
            setAppointments((prev) => {
              if (prev.some((item) => item.id === apt.id)) return prev;
              return [apt, ...prev];
            });
            // Restaura no Firestore
            await saveAppointmentToFirestore(apt);
            toast.success(`Agendamento de ${apt.patientName} restaurado!`);
          },
        },
        duration: 6000,
      });
    } catch (err) {
      console.error("Erro ao excluir agendamento:", err);
      toast.error("Erro ao excluir agendamento. Tente novamente.");
    } finally {
      setIsDeletingAppointment(false);
    }
  };

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      if (selectedDayFilter === "hoje" && apt.date !== "Hoje") return false;
      if (selectedDayFilter === "retornos" && apt.type !== "Retorno de 15 Dias") return false;

      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        apt.patientName.toLowerCase().includes(q) ||
        apt.procedureName.toLowerCase().includes(q) ||
        apt.patientPhone.includes(q)
      );
    });
  }, [appointments, selectedDayFilter, searchQuery]);

  return (
    <div data-dashboard-section="appointments" className="w-full min-w-0 max-w-[1400px] mx-auto space-y-6 select-none p8-page-enter pb-24 sm:pb-8">
      {/* 1. Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-[#767676] dark:text-[#a1a1aa] font-medium">
          <CalendarCheck className="w-3.5 h-3.5 text-black dark:text-white" />
          <span>Agenda & Fluxo Clínico</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <KineticHeading
              text="Agendamentos & Retornos"
              className="text-xl sm:text-3xl font-bold text-black dark:text-white"
            />
            <p className="text-xs sm:text-sm text-[#6c6c6c] dark:text-[#a1a1aa]">
              Controle de atendimentos diários e acompanhamento de retornos de 15 dias.
            </p>
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-2 self-start sm:self-auto sm:shrink-0">
            <button
              type="button"
              onClick={() => playNotificationSound()}
              className="h-11 sm:h-9 px-2.5 sm:px-3 rounded-xl bg-[#f5f5f5] dark:bg-[#1c1c1e] hover:bg-[#ebebeb] dark:hover:bg-[#2c2c2e] active:scale-[0.98] text-black dark:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-black/[0.04] dark:border-white/[0.08]"
              title="Testar alerta sonoro do sistema"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Alerta Sonoro</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="h-11 sm:h-9 px-3.5 sm:px-4 rounded-xl bg-black dark:bg-white hover:bg-[#262626] dark:hover:bg-[#ededed] active:scale-[0.98] text-white dark:text-black text-xs font-semibold flex items-center gap-1.5 sm:gap-2 shadow-sm transition-all duration-150 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Agendamento</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Métricas da Agenda */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        <div className="bg-white dark:bg-[#121212] p-3 sm:p-4 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#767676] dark:text-[#a1a1aa] font-medium">Pacientes Hoje</span>
            <span className="w-7 h-7 rounded-lg bg-[#f6f6f6] dark:bg-[#1c1c1e] flex items-center justify-center text-black dark:text-white">
              <User className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-black dark:text-white mt-1.5 sm:mt-2">
            <AnimatedNumber value={appointments.filter((a) => a.date === "Hoje").length} ariaLabel="Pacientes hoje" />
          </div>
          <span className="text-[11px] text-[#8f8f8f] dark:text-[#a1a1aa] mt-0.5 block truncate">Atendimentos no dia</span>
        </div>

        <div className="bg-white dark:bg-[#121212] p-3 sm:p-4 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#767676] dark:text-[#a1a1aa] font-medium">Retornos (15d)</span>
            <span className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <RotateCcw className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1.5 sm:mt-2">
            <AnimatedNumber value={appointments.filter((a) => a.type === "Retorno de 15 Dias").length} ariaLabel="Retornos de 15 dias" />
          </div>
          <span className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 block font-medium truncate">Revisões de Botox</span>
        </div>

        <div className="bg-white dark:bg-[#121212] p-3 sm:p-4 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#767676] dark:text-[#a1a1aa] font-medium">Confirmados</span>
            <span className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1.5 sm:mt-2">
            <AnimatedNumber value={appointments.filter((a) => a.status === "confirmado" || a.status === "em_atendimento").length} ariaLabel="Agendamentos confirmados" />
          </div>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5 block font-medium truncate">Presença confirmada</span>
        </div>

        <div className="bg-white dark:bg-[#121212] p-3 sm:p-4 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#767676] dark:text-[#a1a1aa] font-medium">Faturamento</span>
            <span className="w-7 h-7 rounded-lg bg-[#f6f6f6] dark:bg-[#1c1c1e] flex items-center justify-center text-black dark:text-white">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-black dark:text-white mt-1.5 sm:mt-2 truncate">
            {formatBRL(
              appointments
                .filter((a) => a.date === "Hoje")
                .reduce((acc, curr) => acc + curr.value, 0)
            )}
          </div>
          <span className="text-[11px] text-[#8f8f8f] dark:text-[#a1a1aa] mt-0.5 block truncate">Estimativa do dia</span>
        </div>
      </div>

      {/* 3. Filtros e Alternância */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
        {/* Abas de visualização rápida — SlidingTabs (transitions.dev) */}
        <div className="w-full sm:w-auto overflow-x-auto scrollbar-none scroll-smooth">
          <SlidingTabs
            ariaLabel="Filtrar agendamentos por período"
            value={selectedDayFilter}
            onChange={(id) => setSelectedDayFilter(id as typeof selectedDayFilter)}
            tabs={[
              { id: "hoje", label: "Hoje" },
              { id: "retornos", label: "Retornos (15d)" },
              { id: "todos", label: "Todos" },
            ]}
          />
        </div>

        {/* Busca e alternador de modo */}
        <div className="grid min-w-0 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:flex sm:w-auto">
          <div className="relative min-w-0 flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8f8f8f] pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar paciente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 sm:h-9 pl-9 pr-3 w-full text-base sm:text-xs bg-[#f4f4f4] dark:bg-[#1c1c1e] hover:bg-[#ededed] dark:hover:bg-[#252528] focus:bg-white dark:focus:bg-[#141414] rounded-xl border border-transparent focus:border-black/20 dark:focus:border-white/20 outline-none transition-all placeholder:text-[#8f8f8f] text-black dark:text-white"
            />
          </div>

          {/* Botão de Toggle do Fluxo Automático */}
          <button
            type="button"
            onClick={() => {
              setAutoFlowEnabled((v) => !v);
              toast(autoFlowEnabled ? "Fluxo Automático Pausado" : "⚡ Fluxo Automático Ativado", {
                description: autoFlowEnabled
                  ? "Os cards agora avançam exclusivamente por ação manual."
                  : "Os cards avançarão sozinhos ao decorrer dos horários e processos.",
              });
            }}
            className={cn(
              "flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shrink-0 active:scale-95",
              autoFlowEnabled
                ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-100"
                : "bg-[#f4f4f4] dark:bg-[#1c1c1e] text-[#767676] dark:text-[#a1a1aa] border-transparent hover:bg-[#eaeaea] dark:hover:bg-[#2c2c2e]"
            )}
            title="Ativar/desativar avanço automático de cards por horário"
          >
            <Zap className={cn("w-3.5 h-3.5", autoFlowEnabled ? "fill-purple-600 dark:fill-purple-400 text-purple-600 dark:text-purple-400 animate-pulse" : "text-[#8f8f8f]")} />
            <span className="hidden sm:inline">{autoFlowEnabled ? "Fluxo Ativo" : "Fluxo Manual"}</span>
          </button>

          <div className="col-span-2 grid grid-cols-2 rounded-xl bg-[#f4f4f4] dark:bg-[#1c1c1e] p-1 border border-black/[0.04] dark:border-white/[0.06] sm:col-auto sm:inline-flex sm:shrink-0" role="group" aria-label="Modo de visualização">
            <button
              onClick={() => setViewMode("kanban")}
              aria-pressed={viewMode === "kanban"}
              className={`min-h-[44px] sm:min-h-[36px] px-3.5 sm:px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer active:scale-95 ${
                viewMode === "kanban"
                  ? "bg-white dark:bg-[#2c2c2e] text-black dark:text-white shadow-sm"
                  : "text-[#767676] dark:text-[#a1a1aa]"
              }`}
            >
              Fluxo
            </button>
            <button
              onClick={() => setViewMode("list")}
              aria-pressed={viewMode === "list"}
              className={`min-h-[44px] sm:min-h-[36px] px-3.5 sm:px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer active:scale-95 ${
                viewMode === "list"
                  ? "bg-white dark:bg-[#2c2c2e] text-black dark:text-white shadow-sm"
                  : "text-[#767676] dark:text-[#a1a1aa]"
              }`}
            >
              Lista
            </button>
          </div>
        </div>
      </div>

      {/* 4. Conteúdo: Visualização Fluxo (Kanban com Drag & Drop - Item 2), Lista ou Estado Vazio */}
      {filteredAppointments.length === 0 ? (
        <div className="bg-white dark:bg-[#121212] rounded-2xl border border-black/[0.08] dark:border-white/[0.08] p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-3.5 shadow-sm w-full">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#f5f5f7] dark:bg-[#1c1c1e] border border-black/[0.05] dark:border-white/[0.08] flex items-center justify-center text-black dark:text-white">
            <CalendarCheck className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div className="max-w-[380px]">
            <h3 className="text-base font-bold text-black dark:text-white tracking-tight">Nenhum Agendamento no Momento</h3>
            <p className="text-xs text-[#767676] dark:text-[#a1a1aa] mt-1 leading-relaxed">
              Sua agenda está livre. Crie novos agendamentos reais para acompanhar o fluxo das pacientes no Kanban.
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="h-9 px-4 rounded-xl bg-black dark:bg-white hover:bg-[#262626] dark:hover:bg-[#ededed] text-white dark:text-black text-xs font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Agendamento</span>
          </button>
        </div>
      ) : viewMode === "kanban" ? (
        <div data-kanban-board="true" className="flex w-full min-w-0 max-w-full lg:grid lg:grid-cols-5 gap-3.5 overflow-x-auto pb-4 scroll-momentum scroll-pl-3.5 scrollbar-thin snap-x">
          {stages.map((stage) => {
            const stageAppointments = filteredAppointments.filter(
              (a) => a.status === stage.id
            );
            const isDropTarget = dragOverStage === stage.id;

            return (
              <div
                key={stage.id}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                        className={cn(
                  "w-[285px] sm:w-[320px] lg:w-auto shrink-0 snap-start bg-[#fbfbfb] dark:bg-[#121212] rounded-2xl p-3 border transition-all duration-150 flex flex-col min-h-[420px]",
                  isDropTarget
                    ? "border-black/40 dark:border-white/40 bg-black/[0.03] dark:bg-white/[0.03] ring-2 ring-black/15 dark:ring-white/15 shadow-sm"
                    : "border-black/[0.08] dark:border-white/[0.08]"
                )}
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-black/[0.05] dark:border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${stage.color}`} />
                    <span className="text-xs font-bold text-black dark:text-white">{stage.label}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-[#8f8f8f] dark:text-[#a1a1aa] px-1.5 py-0.5 rounded-md bg-[#eee] dark:bg-[#202022]">
                    {stageAppointments.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-2.5 flex-1 overflow-y-auto">
                  {stageAppointments.map((apt) => {
                    const isDragging = draggedAptId === apt.id;

                    return (
                      <div
                        key={apt.id}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, apt.id)}
                        onDragEnd={() => {
                          setDraggedAptId(null);
                          setDragOverStage(null);
                        }}
                        className={cn(
                          "bg-white dark:bg-[#1c1c1e] p-3 rounded-xl border border-black/[0.06] dark:border-white/[0.08] shadow-sm hover:border-black/30 dark:hover:border-white/20 transition-all space-y-2.5 group cursor-grab active:cursor-grabbing",
                          isDragging && "opacity-40 scale-95 border-dashed border-black/40 dark:border-white/40"
                        )}
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="flex-1 min-w-0">
                            {/* Nome da cliente clicável para abrir a modal de informações (Item 2) */}
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenPatientProfile(
                                  apt.patientName,
                                  apt.patientPhone,
                                  apt.procedureName
                                )
                              }
                              className="text-xs font-bold text-black dark:text-white hover:underline cursor-pointer text-left block leading-tight truncate transition-colors"
                              title="Clique para abrir a ficha completa do paciente"
                            >
                              {apt.patientName}
                            </button>
                            <span className="text-[11px] text-[#767676] dark:text-[#a1a1aa] flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-[#8f8f8f]" />
                              {apt.time} • {apt.date}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {apt.type === "Retorno de 15 Dias" ? (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
                                Retorno 15d
                              </span>
                            ) : (
                              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                                Sessão
                              </span>
                            )}
                            <GripVertical className="w-3.5 h-3.5 text-[#b0b0b0] opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>

                        <div className="p-2 rounded-lg bg-[#fafafa] dark:bg-[#151517] border border-black/[0.03] dark:border-white/[0.05] space-y-1">
                          <span className="text-xs font-medium text-black dark:text-white block">
                            {apt.procedureName}
                          </span>
                          {apt.value > 0 ? (
                            <span className="text-[11px] font-bold text-black dark:text-white">
                              {formatBRL(apt.value)}
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#8f8f8f] dark:text-[#a1a1aa]">Sem custo (Revisão)</span>
                          )}
                        </div>

                        {apt.notes && (
                          <p className="text-[10px] text-[#767676] dark:text-[#a1a1aa] line-clamp-2 italic">
                            "{apt.notes}"
                          </p>
                        )}

                        {/* Ações do Card */}
                        <div className="flex items-center justify-between pt-1 border-t border-black/[0.04] dark:border-white/[0.06]">
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`https://wa.me/55${apt.patientPhone.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center transition-colors border border-emerald-200/50 dark:border-emerald-800/40"
                              title="Falar no WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAppointmentToDelete(apt);
                              }}
                              className="w-7 h-7 rounded-lg bg-[#f4f4f4] dark:bg-[#28282b] hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 text-[#8f8f8f] dark:text-[#a1a1aa] flex items-center justify-center transition-colors cursor-pointer"
                              title="Excluir agendamento"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {apt.status === "concluido" ? (
                            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              <span>Concluído</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => handleAdvanceStatus(apt.id, apt.status)}
                              className="h-7 px-2.5 rounded-lg bg-[#f4f4f4] dark:bg-[#28282b] hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black text-[11px] font-semibold text-black dark:text-white flex items-center gap-1 transition-colors cursor-pointer"
                              title="Avançar para o próximo fluxo"
                            >
                              <span>
                                {apt.status === "agendado" && "Confirmar"}
                                {apt.status === "retorno_pendente" && "Confirmar"}
                                {apt.status === "confirmado" && "Chamar em Sala"}
                                {apt.status === "em_atendimento" && "Concluir"}
                              </span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {stageAppointments.length === 0 && (
                    <div className="py-12 text-center text-[11px] text-[#a3a3a3] dark:text-[#71717a]">
                      Nenhum paciente
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Visualização em Lista */
        <div className="bg-white dark:bg-[#141414] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl overflow-hidden shadow-sm divide-y divide-black/[0.05] dark:divide-white/[0.06]">
          {filteredAppointments.map((apt) => (
            <div
              key={apt.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#fafafa] dark:hover:bg-[#1a1a1c] transition-colors"
            >
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold text-xs flex items-center justify-center shrink-0">
                  {apt.time}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenPatientProfile(
                          apt.patientName,
                          apt.patientPhone,
                          apt.procedureName
                        )
                      }
                      className="font-bold text-sm text-black dark:text-white hover:underline cursor-pointer text-left"
                      title="Abrir prontuário completo"
                    >
                      {apt.patientName}
                    </button>
                    {apt.type === "Retorno de 15 Dias" ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
                        Retorno de 15 Dias
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                        Aplicação
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#767676] dark:text-[#a1a1aa] mt-0.5">
                    {apt.procedureName} • {apt.patientPhone}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-black/[0.04] dark:border-white/[0.06]">
                <div className="text-left sm:text-right">
                  <div className="text-xs font-bold text-black dark:text-white">
                    {apt.value > 0 ? formatBRL(apt.value) : "Retorno Gratuito"}
                  </div>
                  <span className="text-[10px] text-[#8f8f8f] dark:text-[#a1a1aa] capitalize">
                    {apt.status.replace("_", " ")}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <a
                    href={`https://wa.me/55${apt.patientPhone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="h-8 px-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 text-xs font-medium flex items-center gap-1 border border-emerald-200/50 dark:border-emerald-800/40"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setAppointmentToDelete(apt)}
                    className="h-8 w-8 rounded-lg bg-[#f4f4f4] dark:bg-[#28282b] hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 text-[#8f8f8f] dark:text-[#a1a1aa] flex items-center justify-center transition-colors cursor-pointer"
                    title="Excluir agendamento"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleAdvanceStatus(apt.id, apt.status)}
                    className="h-8 px-3 rounded-lg bg-black dark:bg-white hover:bg-[#262626] dark:hover:bg-[#ededed] text-white dark:text-black text-xs font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <span>Avançar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredAppointments.length === 0 && (
            <div className="py-12 text-center text-xs text-[#767676] dark:text-[#a1a1aa]">
              Nenhum agendamento encontrado para o filtro selecionado.
            </div>
          )}
        </div>
      )}

      {/* 5. Modal Novo Agendamento */}
      <ModalPortal isOpen={isAddModalOpen}>
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200 select-none"
          style={{
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#1c1c1e] text-black dark:text-white rounded-[24px] border border-black/[0.08] dark:border-white/[0.12] shadow-[0_24px_48px_-16px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.06)] w-full max-w-[500px] p-6 space-y-5 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom,16px))]"
          >
            <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.06] pb-3">
              <div>
                <h3 className="text-lg font-bold text-black dark:text-white tracking-tight">
                  Novo Agendamento Clínico
                </h3>
                <p className="text-xs text-[#767676] dark:text-[#a1a1aa]">
                  Reserve horário para aplicação ou retorno de revisão.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#f4f4f4] dark:bg-[#2c2c2e] hover:bg-[#ebebeb] dark:hover:bg-[#38383a] flex items-center justify-center text-[#8f8f8f] hover:text-black dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-black dark:text-white">Nome da Paciente *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Beatriz Mendonça"
                  value={formPatientName}
                  onChange={(e) => setFormPatientName(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-[#f7f7f7] dark:bg-[#252528] border border-transparent focus:border-black dark:focus:border-white text-xs text-black dark:text-white outline-none transition-all placeholder:text-[#8f8f8f]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-black dark:text-white">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="(11) 98765-4321"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-[#f7f7f7] dark:bg-[#252528] border border-transparent focus:border-black dark:focus:border-white text-xs text-black dark:text-white outline-none transition-all placeholder:text-[#8f8f8f]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-black dark:text-white">Tipo de Agendamento</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-xl bg-[#f7f7f7] dark:bg-[#252528] border border-transparent focus:border-black dark:focus:border-white text-xs text-black dark:text-white outline-none"
                  >
                    <option value="Aplicação">Aplicação / Sessão</option>
                    <option value="Retorno de 15 Dias">Retorno de 15 Dias (Revisão)</option>
                    <option value="Avaliação / Consulta">Avaliação Inicial</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-black dark:text-white">Procedimento</label>
                  <select
                    value={formProcedure}
                    onChange={(e) => setFormProcedure(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#f7f7f7] dark:bg-[#252528] border border-transparent focus:border-black dark:focus:border-white text-xs text-black dark:text-white outline-none"
                  >
                    <option value="Botox">Botox</option>
                    <option value="Preenchimento Labial">Preenchimento Labial</option>
                    <option value="Rinomodelação">Rinomodelação</option>
                    <option value="Bioestimulador de Colágeno">Bioestimulador de Colágeno</option>
                    <option value="Fios de PDO">Fios de PDO</option>
                    <option value="Microagulhamento">Microagulhamento</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-black dark:text-white">Horário</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 14:30"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-[#f7f7f7] dark:bg-[#252528] border border-transparent focus:border-black dark:focus:border-white text-xs text-black dark:text-white outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-black dark:text-white">Observações Clínicas</label>
                <input
                  type="text"
                  placeholder="Ex: retorno agendado pós 14 dias para avaliar retoque na glabela"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-[#f7f7f7] dark:bg-[#252528] border border-transparent focus:border-black dark:focus:border-white text-xs text-black dark:text-white outline-none transition-all placeholder:text-[#8f8f8f]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.06] dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="h-10 px-4 rounded-xl text-xs font-medium text-[#767676] dark:text-[#a1a1aa] hover:text-black dark:hover:text-white hover:bg-[#f4f4f4] dark:hover:bg-[#2c2c2e] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 rounded-xl bg-black dark:bg-white hover:bg-[#262626] dark:hover:bg-[#ededed] text-white dark:text-black text-xs font-semibold shadow-sm transition-all duration-150 active:scale-[0.98] cursor-pointer"
                >
                  Confirmar Agendamento
                </button>
              </div>
            </form>
          </div>
        </div>
      </ModalPortal>

      {/* 6. Modal de Perfil e Prontuário do Paciente (Item 2) */}
      {selectedPatient && (
        <CustomerProfileModal
          isOpen={isPatientModalOpen}
          onClose={() => setIsPatientModalOpen(false)}
          patient={selectedPatient}
          onOpenAnamnese={() => setIsAnamneseModalOpen(true)}
          onOpenEditCustomer={() => setIsEditCustomerModalOpen(true)}
          onUpdatePatient={handleUpdatePatient}
        />
      )}

      {/* Sub-Modal de Anamnese */}
      {selectedPatient && (
        <AnamneseFormModal
          isOpen={isAnamneseModalOpen}
          onClose={() => setIsAnamneseModalOpen(false)}
          clientId={selectedPatient.id}
          clientName={selectedPatient.name}
          initialData={selectedPatient.anamnese}
          onSave={(data: AnamneseData) => {
            const updated: PatientRecord = {
              ...selectedPatient,
              anamnese: data,
            };
            handleUpdatePatient(updated);
            setIsAnamneseModalOpen(false);
          }}
        />
      )}

      {/* Sub-Modal de Edição de Cadastro */}
      {selectedPatient && (
        <CustomerFormModal
          isOpen={isEditCustomerModalOpen}
          onClose={() => setIsEditCustomerModalOpen(false)}
          patientToEdit={selectedPatient}
          onSave={(updatedPat) => {
            handleUpdatePatient(updatedPat);
            setIsEditCustomerModalOpen(false);
          }}
        />
      )}

      {/* 6. Modal de Confirmação de Exclusão (Apple Design) */}
      <ModalPortal isOpen={Boolean(appointmentToDelete)}>
        {appointmentToDelete && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200 select-none"
            style={{
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
            }}
            onClick={() => !isDeletingAppointment && setAppointmentToDelete(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#1c1c1e] text-black dark:text-white rounded-[24px] border border-black/[0.08] dark:border-white/[0.12] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.08)] w-full max-w-[420px] p-6 space-y-5 animate-in zoom-in-95 duration-150"
            >
              {/* Header com Ícone Destrutivo */}
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-900/50">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold tracking-tight text-black dark:text-white">
                    Excluir Agendamento
                  </h3>
                  <p className="text-xs text-[#767676] dark:text-[#a1a1aa] mt-0.5 leading-relaxed">
                    Tem certeza de que deseja remover este agendamento da esteira clínica?
                  </p>
                </div>
              </div>

              {/* Card de Resumo do Agendamento */}
              <div className="p-3.5 rounded-2xl bg-[#f7f7f7] dark:bg-[#252528] border border-black/[0.04] dark:border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-black dark:text-white truncate">
                    {appointmentToDelete.patientName}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 shrink-0">
                    {appointmentToDelete.type}
                  </span>
                </div>

                <div className="text-[11px] text-[#767676] dark:text-[#a1a1aa] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#8f8f8f]" />
                  <span>{appointmentToDelete.time} • {appointmentToDelete.date}</span>
                </div>

                <div className="text-xs font-medium text-black dark:text-white flex items-center justify-between pt-1 border-t border-black/[0.04] dark:border-white/[0.06]">
                  <span className="truncate">{appointmentToDelete.procedureName}</span>
                  {appointmentToDelete.value > 0 ? (
                    <span className="font-bold shrink-0">{formatBRL(appointmentToDelete.value)}</span>
                  ) : (
                    <span className="text-[10px] text-[#8f8f8f] shrink-0">Sem custo</span>
                  )}
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  disabled={isDeletingAppointment}
                  onClick={() => setAppointmentToDelete(null)}
                  className="h-11 sm:h-9 px-4 rounded-xl text-xs font-semibold bg-[#f4f4f4] hover:bg-[#eaeaea] dark:bg-[#2c2c2e] dark:hover:bg-[#38383a] text-black dark:text-white transition-colors cursor-pointer disabled:opacity-50 text-center active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isDeletingAppointment}
                  onClick={handleConfirmDelete}
                  className="h-11 sm:h-9 px-4 rounded-xl text-xs font-semibold bg-[#e23014] hover:bg-[#c9280f] active:scale-95 text-white shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 w-full sm:w-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeletingAppointment ? "Excluindo..." : "Excluir Agendamento"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </ModalPortal>
    </div>
  );
}

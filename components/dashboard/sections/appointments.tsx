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
  ChevronLeft,
  RotateCcw,
  X,
  Volume2,
  GripVertical,
  Zap,
  Trash2,
} from "lucide-react";
import { ModalPortal } from "@/components/ui/modal-portal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { SlidingTabs, AnimatedNumber, KineticHeading, ShimmerButton, TiltCard } from "@/components/motion";
import { getLocalProcedures, ProcedureItem } from "@/lib/procedures-service";
import {
  getStoredAppointments,
  setStoredAppointments,
  getStoredPatients,
  setStoredPatients,
} from "@/lib/storage-keys";

export interface Appointment {
  id: string;
  patientName: string;
  patientPhone: string;
  procedureName: string;
  category: string;
  type: "Aplicação" | "Retorno de 15 Dias" | "Avaliação / Consulta";
  date: string;
  time: string;
  value: number;
  status: "agendado" | "confirmado" | "em_atendimento" | "retorno_pendente" | "concluido";
  notes?: string;
  originAppointmentId?: string;
  completedAt?: string;
  createdAt?: string;
}

const initialAppointments: Appointment[] = [];

/**
 * Sanitiza a lista de agendamentos removendo retornos idênticos duplicados
 */
function sanitizeAppointments(rawList: Appointment[]): Appointment[] {
  const seenReturnKeys = new Set<string>();
  const clean: Appointment[] = [];

  for (const apt of rawList) {
    if (apt.status === "retorno_pendente") {
      const key = `${apt.patientName.trim().toLowerCase()}_${apt.procedureName.trim().toLowerCase()}_${apt.date}`;
      if (seenReturnKeys.has(key)) {
        continue;
      }
      seenReturnKeys.add(key);
    }
    clean.push(apt);
  }
  return clean;
}

const stages: {
  id: Appointment["status"];
  label: string;
  color: string;
  desc: string;
}[] = [
  { id: "agendado", label: "Agendados", color: "bg-[#8D9B7F]", desc: "Aguardando confirmação" },
  { id: "retorno_pendente", label: "Retorno 15 Dias", color: "bg-[#F7F5F0] text-black", desc: "Revisão e retoque" },
  { id: "confirmado", label: "Confirmados", color: "bg-[#A8B29A]", desc: "Confirmado no WhatsApp" },
  { id: "em_atendimento", label: "Em Sala", color: "bg-white text-black", desc: "Com a Dra. Samara" },
  { id: "concluido", label: "Concluídos", color: "bg-[#333333]", desc: "Atendimento finalizado" },
];

export function AppointmentsSection() {
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = getStoredAppointments();
        if (stored && stored.length > 0) return sanitizeAppointments(stored);
      } catch (e) {}
    }
    return [];
  });
  const [patients, setPatients] = useState<PatientRecord[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = getStoredPatients();
        if (stored && stored.length > 0) return stored;
      } catch (e) {}
    }
    return [];
  });
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [selectedDayFilter, setSelectedDayFilter] = useState<"todos" | "hoje" | "retornos">("hoje");
  const [searchQuery, setSearchQuery] = useState("");
  const [autoFlowEnabled, setAutoFlowEnabled] = useState(true);

  // Sincronização reativa com eventos de armazenamento (limpeza de testes, múltiplos painéis)
  useEffect(() => {
    const handleAptsUpdate = () => {
      const stored = getStoredAppointments();
      const sanitized = sanitizeAppointments(stored || []);
      setAppointments((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(sanitized)) return prev;
        return sanitized;
      });
    };

    const handlePatientsUpdate = () => {
      const stored = getStoredPatients();
      setPatients((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(stored || [])) return prev;
        return stored || [];
      });
    };

    window.addEventListener("samara_appointments_updated", handleAptsUpdate);
    window.addEventListener("samara_patients_updated", handlePatientsUpdate);
    window.addEventListener("storage", handleAptsUpdate);

    return () => {
      window.removeEventListener("samara_appointments_updated", handleAptsUpdate);
      window.removeEventListener("samara_patients_updated", handlePatientsUpdate);
      window.removeEventListener("storage", handleAptsUpdate);
    };
  }, []);

  // Persist real appointments locally
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        setStoredAppointments(appointments);
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

  // Modal Novo Agendamento e Seleção de Cliente
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [formPatientName, setFormPatientName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formProcedure, setFormProcedure] = useState("Botox");
  const [formType, setFormType] = useState<Appointment["type"]>("Aplicação");
  const [formDate, setFormDate] = useState("Hoje");
  const [formTime, setFormTime] = useState("14:30");
  const [formValue, setFormValue] = useState("900");
  const [formNotes, setFormNotes] = useState("");

  // Pacientes filtrados para a seleção do agendamento
  const filteredPatientsForSelect = useMemo(() => {
    const q = patientSearchQuery.toLowerCase().trim();
    if (!q) return patients;
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        (p.cpf && p.cpf.includes(q))
    );
  }, [patients, patientSearchQuery]);

  // Modal de Exclusão de Agendamento
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);
  const [isDeletingAppointment, setIsDeletingAppointment] = useState(false);

  // Catálogo dinâmico de procedimentos
  const [availableProcedures, setAvailableProcedures] = useState<ProcedureItem[]>([]);

  useEffect(() => {
    setAvailableProcedures(getLocalProcedures());
    const onProcs = () => setAvailableProcedures(getLocalProcedures());
    window.addEventListener("samara_procedures_updated", onProcs);
    window.addEventListener("storage", onProcs);
    return () => {
      window.removeEventListener("samara_procedures_updated", onProcs);
      window.removeEventListener("storage", onProcs);
    };
  }, []);

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

  // Alertas Clínicos Semi-Automáticos (Notifica horário sem mover colunas forçadamente)
  const alertedAppointmentsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!autoFlowEnabled) return;

    const checkAndNotify = () => {
      const now = new Date();
      const nowTotalMin = now.getHours() * 60 + now.getMinutes();

      appointments.forEach((apt) => {
        if (apt.status === "concluido") return;

        const isToday =
          apt.date?.toLowerCase() === "hoje" ||
          apt.date === now.toLocaleDateString("pt-BR") ||
          apt.date === now.toISOString().split("T")[0];

        if (!isToday) return;

        const timeMatch = apt.time?.match(/^(\d{1,2}):(\d{2})/);
        if (!timeMatch) return;

        const aptTotalMin = parseInt(timeMatch[1], 10) * 60 + parseInt(timeMatch[2], 10);

        // Notifica quando faltam 15 minutos ou no horário exato
        if (nowTotalMin >= aptTotalMin && nowTotalMin < aptTotalMin + 20) {
          const alertKey = `${apt.id}_alert_${apt.time}`;
          if (!alertedAppointmentsRef.current.has(alertKey)) {
            alertedAppointmentsRef.current.add(alertKey);
            playNotificationSound();
            toast.info(`⏰ Horário de Atendimento: ${apt.patientName}`, {
              description: `${apt.procedureName} agendado para às ${apt.time}. Paciente pronta para atendimento.`,
              duration: 5000,
            });
          }
        }
      });
    };

    checkAndNotify();
    const timer = setInterval(checkAndNotify, 25000);
    return () => clearInterval(timer);
  }, [autoFlowEnabled, appointments]);

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

      const newRecord: PatientRecord = {
        id: `pat-${Date.now()}`,
        name: patientName,
        cpf: "",
        phone: phone.trim(),
        email: "",
        birthDate: "",
        age: 0,
        gender: "",
        location: "",
        profession: "",
        status: "Em Tratamento",
        totalSpent: 0,
        proceduresCount: 0,
        lastProcedureDate: "",
        activeProcedures,
      };

      setPatients((prev) => {
        const next = [newRecord, ...prev];
        setStoredPatients(next);
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
      setStoredPatients(next);
      return next;
    });
    setSelectedPatient(updatedPatient);
    savePatientToFirestore(updatedPatient);
  };

  // Avançar card para a próxima etapa com trava estrita anti-duplicação
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

      // Se concluiu um procedimento que exige revisão de 15 dias (Botox, Bio, Preenchimento, etc.)
      if (currentStatus === "em_atendimento" && targetApt && targetApt.type !== "Retorno de 15 Dias") {
        const needsReturn =
          targetApt.procedureName?.toLowerCase().includes("botox") ||
          targetApt.procedureName?.toLowerCase().includes("preenchimento") ||
          targetApt.procedureName?.toLowerCase().includes("rinomodelação") ||
          targetApt.procedureName?.toLowerCase().includes("fios") ||
          targetApt.procedureName?.toLowerCase().includes("bio");

        // Trava anti-duplicação estrita: verifica se já existe algum retorno pendente para esse atendimento ou paciente
        const hasPendingReturn = prev.some(
          (a) =>
            a.status === "retorno_pendente" &&
            (a.originAppointmentId === targetApt.id ||
              (a.patientName.trim().toLowerCase() === targetApt.patientName.trim().toLowerCase() &&
                a.procedureName.toLowerCase().includes(targetApt.procedureName.toLowerCase().replace(" (revisão)", ""))))
        );

        if (needsReturn && !hasPendingReturn) {
          const returnDateObj = new Date();
          returnDateObj.setDate(returnDateObj.getDate() + 15);
          const day = String(returnDateObj.getDate()).padStart(2, "0");
          const month = String(returnDateObj.getMonth() + 1).padStart(2, "0");
          const year = returnDateObj.getFullYear();
          const returnDateFormatted = `${day}/${month}/${year}`;

          createdReturn = {
            id: `apt-ret-${Date.now()}`,
            originAppointmentId: targetApt.id,
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

      const nextList = prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: nextStatus,
              completedAt: nextStatus === "concluido" ? new Date().toISOString() : item.completedAt,
            }
          : item
      );

      const finalList = createdReturn ? [createdReturn, ...nextList] : nextList;

      if (createdReturn) {
        saveAppointmentToFirestore(createdReturn);
        toast.info(`🔍 Retorno de 15 Dias Agendado!`, {
          description: `Revisão de ${targetApt?.patientName} programada para ${createdReturn.date} na coluna de Retornos.`,
          duration: 6000,
        });
      }

      updateAppointmentStatusInFirestore(id, nextStatus);
      return finalList;
    });
  };

  // Retroceder card para a etapa anterior
  const handleRevertStatus = (id: string, currentStatus: Appointment["status"]) => {
    let prevStatus: Appointment["status"] = "agendado";

    if (currentStatus === "concluido") {
      prevStatus = "em_atendimento";
    } else if (currentStatus === "em_atendimento") {
      prevStatus = "confirmado";
    } else if (currentStatus === "confirmado") {
      prevStatus = "agendado";
    } else if (currentStatus === "retorno_pendente") {
      prevStatus = "concluido";
    }

    playNotificationSound();

    setAppointments((prev) => {
      let nextList = prev.map((item) =>
        item.id === id
          ? { ...item, status: prevStatus, completedAt: undefined }
          : item
      );

      // Se desfez a conclusão de um atendimento, remove o retorno automático criado a partir dele
      if (currentStatus === "concluido") {
        nextList = nextList.filter((item) => item.originAppointmentId !== id);
      }

      updateAppointmentStatusInFirestore(id, prevStatus);
      return nextList;
    });

    toast.info("Etapa retrocedida com sucesso");
  };

  // Remarcar novo atendimento para cliente concluído
  const handleReschedule = (apt: Appointment) => {
    setFormPatientName(apt.patientName);
    setFormPhone(apt.patientPhone);
    setFormProcedure(apt.procedureName.replace(" (Revisão)", ""));
    setFormType("Aplicação");
    setFormDate("Hoje");
    setFormTime(apt.time || "14:30");
    setFormValue(apt.value ? apt.value.toString() : "900");
    setFormNotes(`Remarcação pós-${apt.procedureName}`);
    setIsAddModalOpen(true);
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
    const chosenProc = availableProcedures.find((p) => p.name === formProcedure);
    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      patientName: formPatientName.trim(),
      patientPhone: formPhone.trim() || "(11) 99999-9999",
      procedureName: formProcedure,
      category: chosenProc?.category || "Facial",
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
            setAppointments((prev) => {
              if (prev.some((item) => item.id === apt.id)) return prev;
              return [apt, ...prev];
            });
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

  // Filtro de Agendamentos (com retenção dos concluídos apenas no dia e limpeza às 00:00)
  const filteredAppointments = useMemo(() => {
    const todayStr = new Date().toLocaleDateString("pt-BR");
    const todayIsoDate = new Date().toISOString().split("T")[0];

    return appointments.filter((apt) => {
      // 1. Se o filtro for "Hoje" e o agendamento estiver concluído:
      // Só exibe se foi concluído hoje (às 00:00 sai da esteira do dia, mas permanece nos relatórios)
      if (selectedDayFilter === "hoje" && apt.status === "concluido") {
        const isCompletedToday =
          apt.date === "Hoje" ||
          apt.completedAt?.startsWith(todayIsoDate) ||
          apt.completedAt?.includes(todayStr);
        if (!isCompletedToday) return false;
      }

      if (selectedDayFilter === "hoje" && apt.status !== "concluido") {
        const isToday =
          apt.date?.toLowerCase() === "hoje" ||
          apt.date === todayStr ||
          apt.date === todayIsoDate;
        if (!isToday) return false;
      }

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
    <div data-dashboard-section="appointments" className="w-full min-w-0 max-w-[1400px] mx-auto space-y-6 p8-page-enter pb-24 sm:pb-8">
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
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => playNotificationSound()}
              className="gap-1.5"
              title="Testar alerta sonoro do sistema"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Alerta Sonoro</span>
            </Button>

            <ShimmerButton
              onClick={() => setIsAddModalOpen(true)}
              className="h-11 sm:h-9 px-3.5 sm:px-4"
            >
              <Plus className="w-4 h-4 stroke-[2.2]" />
              <span>Novo Agendamento</span>
            </ShimmerButton>
          </div>
        </div>
      </div>

      {/* 2. Métricas da Agenda com Tilt 3D (transitions.dev P19) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        <TiltCard maxTilt={5} glareOpacity={0.12} className="h-full">
          <div className="h-full bg-white dark:bg-[#121212] p-3 sm:p-4 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
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
        </TiltCard>

        <TiltCard maxTilt={5} glareOpacity={0.12} className="h-full">
          <div className="h-full bg-white dark:bg-[#121212] p-3 sm:p-4 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
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
        </TiltCard>

        <TiltCard maxTilt={5} glareOpacity={0.12} className="h-full">
          <div className="h-full bg-white dark:bg-[#121212] p-3 sm:p-4 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
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
        </TiltCard>

        <TiltCard maxTilt={5} glareOpacity={0.12} className="h-full">
          <div className="h-full bg-white dark:bg-[#121212] p-3 sm:p-4 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
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
        </TiltCard>
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
                ? "bg-[#A8B29A]/15 text-[#A8B29A] border-[#A8B29A]/30 hover:bg-[#A8B29A]/25"
                : "bg-[#f4f4f4] dark:bg-[#1c1c1e] text-[#767676] dark:text-[#a1a1aa] border-transparent hover:bg-[#eaeaea] dark:hover:bg-[#2c2c2e]"
            )}
            title="Ativar/desativar avanço automático de cards por horário"
          >
            <Zap className={cn("w-3.5 h-3.5", autoFlowEnabled ? "fill-[#A8B29A] text-[#A8B29A] animate-pulse" : "text-[#8f8f8f]")} />
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
          <Button
            onClick={() => setIsAddModalOpen(true)}
            variant="default"
            size="sm"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Agendamento</span>
          </Button>
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
                  {stage.id === "retorno_pendente" && stageAppointments.length > 0 ? (
                    <Badge variant="warning" pulse className="text-[10px] px-1.5 py-0">
                      {stageAppointments.length}
                    </Badge>
                  ) : stage.id === "em_atendimento" && stageAppointments.length > 0 ? (
                    <Badge variant="sage" pulse className="text-[10px] px-1.5 py-0">
                      {stageAppointments.length}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {stageAppointments.length}
                    </Badge>
                  )}
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
                          "bg-white dark:bg-[#18181b] p-3 rounded-xl border border-black/[0.06] dark:border-white/[0.08] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_2px_8px_rgba(0,0,0,0.3)] hover:border-black/30 dark:hover:border-white/20 transition-all duration-150 space-y-2.5 group cursor-grab active:cursor-grabbing active:scale-[0.99]",
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

                          <div className="flex items-center gap-1.5 shrink-0">
                            {apt.type === "Retorno de 15 Dias" ? (
                              <Badge variant="warning" pulse>
                                Retorno 15d
                              </Badge>
                            ) : (
                              <Badge variant="sage">
                                Sessão
                              </Badge>
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

                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            {/* Botão de Retroceder etapa (disponível se não for agendado inicial) */}
                            {apt.status !== "agendado" && (
                              <button
                                type="button"
                                onClick={() => handleRevertStatus(apt.id, apt.status)}
                                className="h-7 px-2 rounded-lg bg-[#f4f4f4] dark:bg-[#232323] hover:bg-[#ebebeb] dark:hover:bg-[#2e2e2e] text-[10px] font-medium text-[#767676] dark:text-[#8D9B7F] hover:text-black dark:hover:text-white flex items-center gap-0.5 transition-colors cursor-pointer border border-black/[0.04] dark:border-white/[0.06]"
                                title="Voltar para a etapa anterior"
                              >
                                <ChevronLeft className="w-3 h-3" />
                                <span className="hidden sm:inline">Voltar</span>
                              </button>
                            )}

                            {apt.status === "concluido" ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleReschedule(apt)}
                                  className="h-7 px-2.5 rounded-lg bg-[#A8B29A]/15 hover:bg-[#A8B29A]/25 text-[#2f3923] dark:text-[#A8B29A] text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-[#A8B29A]/30"
                                  title="Remarcar novo atendimento para esta cliente"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>Remarcar</span>
                                </button>
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-800/40">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Concluído</span>
                                </span>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleAdvanceStatus(apt.id, apt.status)}
                                className="h-7 px-2.5 rounded-lg bg-[#f4f4f4] dark:bg-[#232323] hover:bg-black hover:text-white dark:hover:bg-[#A8B29A] dark:hover:text-[#111111] text-[11px] font-semibold text-black dark:text-white flex items-center gap-1 transition-colors cursor-pointer border border-black/[0.04] dark:border-white/[0.08]"
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
              {/* Seleção de Paciente Cadastrada */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-black dark:text-white">
                    Paciente Cadastrada *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsNewCustomerModalOpen(true)}
                    className="text-xs font-semibold text-[#8D9B7F] hover:text-[#A8B29A] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Cadastrar Nova Cliente</span>
                  </button>
                </div>

                {formPatientName ? (
                  <div className="p-3 rounded-xl bg-[#f7f7f7] dark:bg-[#232323] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#A8B29A] text-[#111111] font-bold text-xs flex items-center justify-center shrink-0">
                        {formPatientName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-black dark:text-white block">
                          {formPatientName}
                        </span>
                        <span className="text-[11px] text-[#767676] dark:text-[#8D9B7F]">
                          {formPhone || "Sem telefone informado"}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFormPatientName("");
                        setFormPhone("");
                      }}
                      className="text-[11px] text-[#8D9B7F] hover:text-black dark:hover:text-white font-medium cursor-pointer px-2 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                      Trocar
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8f8f8f]" />
                      <input
                        type="text"
                        placeholder="Buscar por nome, telefone ou CPF..."
                        value={patientSearchQuery}
                        onChange={(e) => setPatientSearchQuery(e.target.value)}
                        className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#f7f7f7] dark:bg-[#232323] border border-transparent focus:border-[#A8B29A] text-xs text-black dark:text-white outline-none"
                      />
                    </div>

                    <div className="max-h-36 overflow-y-auto rounded-xl border border-black/[0.06] dark:border-white/[0.08] divide-y divide-black/[0.04] dark:divide-white/[0.04] bg-[#fafafa] dark:bg-[#1a1a1c]">
                      {filteredPatientsForSelect.length === 0 ? (
                        <div className="p-3 text-center text-xs text-[#8f8f8f]">
                          Nenhuma cliente encontrada.
                          <button
                            type="button"
                            onClick={() => setIsNewCustomerModalOpen(true)}
                            className="ml-1 text-[#A8B29A] font-semibold hover:underline cursor-pointer"
                          >
                            Cadastrar agora
                          </button>
                        </div>
                      ) : (
                        filteredPatientsForSelect.slice(0, 5).map((pat) => (
                          <button
                            key={pat.id}
                            type="button"
                            onClick={() => {
                              setFormPatientName(pat.name);
                              setFormPhone(pat.phone);
                              setPatientSearchQuery("");
                            }}
                            className="w-full p-2.5 flex items-center justify-between text-left hover:bg-[#ebebeb] dark:hover:bg-[#2a2a2d] transition-colors cursor-pointer"
                          >
                            <div>
                              <span className="text-xs font-semibold text-black dark:text-white block">
                                {pat.name}
                              </span>
                              <span className="text-[10px] text-[#8f8f8f] dark:text-[#8D9B7F]">{pat.phone}</span>
                            </div>
                            <span className="text-[10px] text-[#A8B29A] font-semibold">
                              Selecionar →
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-black dark:text-white">Procedimento</label>
                  <select
                    value={formProcedure}
                    onChange={(e) => {
                      setFormProcedure(e.target.value);
                      const proc = availableProcedures.find((p) => p.name === e.target.value);
                      if (proc && formType !== "Retorno de 15 Dias") {
                        setFormValue(proc.price.toString());
                      }
                    }}
                    className="w-full h-10 px-3 rounded-xl bg-[#f7f7f7] dark:bg-[#252528] border border-transparent focus:border-black dark:focus:border-white text-xs text-black dark:text-white outline-none"
                  >
                    {availableProcedures.length > 0 ? (
                      availableProcedures.map((proc) => (
                        <option key={proc.id} value={proc.name}>
                          {proc.name} ({proc.category})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Botox">Botox (Facial)</option>
                        <option value="Preenchimento Labial">Preenchimento Labial (Facial)</option>
                        <option value="Rinomodelação">Rinomodelação (Facial)</option>
                        <option value="Bioestimulador de Colágeno">Bioestimulador de Colágeno (Facial/Corporal)</option>
                        <option value="Fios de PDO">Fios de PDO (Facial)</option>
                        <option value="Microagulhamento">Microagulhamento (Facial)</option>
                      </>
                    )}
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
                  className="h-10 px-5 rounded-xl bg-black dark:bg-[#9ca889] hover:bg-[#262626] dark:hover:bg-[#8f9b7c] active:bg-[#849071] text-white dark:text-[#070707] text-xs font-semibold shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_4px_16px_rgba(156,168,137,0.25)] transition-all duration-150 active:scale-[0.98] cursor-pointer"
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

      {/* Modal de Cadastro de Nova Cliente acionado diretamente no Agendamento */}
      <CustomerFormModal
        isOpen={isNewCustomerModalOpen}
        onClose={() => setIsNewCustomerModalOpen(false)}
        onSave={(newPat) => {
          setPatients((prev) => {
            const next = [newPat, ...prev];
            setStoredPatients(next);
            return next;
          });
          savePatientToFirestore(newPat);
          setFormPatientName(newPat.name);
          setFormPhone(newPat.phone);
          setIsNewCustomerModalOpen(false);
          toast.success(`Cliente ${newPat.name} cadastrada e vinculada ao agendamento!`);
        }}
      />

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

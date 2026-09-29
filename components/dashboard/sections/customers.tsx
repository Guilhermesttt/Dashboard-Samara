"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  Plus,
  Phone,
  Mail,
  Calendar,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  Sparkles,
  ArrowUpDown,
  LayoutGrid,
  Table as TableIcon,
  ChevronRight,
  Edit2,
  Trash2,
  Activity,
  Heart,
  ExternalLink,
} from "lucide-react";
import { PatientRecord, CustomerProfileModal } from "./customer-profile-modal";
import { CustomerFormModal } from "./customer-form-modal";
import { AnamneseFormModal, AnamneseData } from "./anamnese-form-modal";
import { SlidingTabs, AnimatedNumber, KineticHeading } from "@/components/motion";
import { ModalPortal } from "@/components/ui/modal-portal";
import { toast } from "sonner";
import {
  savePatientToFirestore,
  deletePatientFromFirestore,
  subscribeToPatients,
} from "@/lib/firebase-service";
import { isFirebaseConfigured } from "@/lib/firebase";

export const initialPatients: PatientRecord[] = [];

export function CustomersSection() {
  const [patients, setPatients] = useState<PatientRecord[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("samara_real_patients");
        if (stored) return JSON.parse(stored);
      } catch (e) {}
    }
    return [];
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [sortAsc, setSortAsc] = useState(false);

  // Selected patient for Profile Modal
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Anamnese Modal state
  const [isAnamneseModalOpen, setIsAnamneseModalOpen] = useState(false);
  const [patientForAnamnese, setPatientForAnamnese] = useState<PatientRecord | null>(null);

  // Customer Form Modal state (Add / Edit)
  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
  const [patientToEdit, setPatientToEdit] = useState<PatientRecord | null>(null);

  // Delete patient confirmation state
  const [patientToDelete, setPatientToDelete] = useState<PatientRecord | null>(null);
  const [isDeletingCustomer, setIsDeletingCustomer] = useState(false);

  // Realtime Firebase Firestore Sync
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const unsub = subscribeToPatients((remotePatients) => {
      if (remotePatients && remotePatients.length > 0) {
        setPatients(remotePatients);
      }
    });
    return () => {
      if (unsub) unsub();
    };
  }, []);

  // Save real patients locally
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("samara_real_patients", JSON.stringify(patients));
      } catch (e) {}
    }
  }, [patients]);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  // Open profile modal
  const handleOpenProfile = (patient: PatientRecord) => {
    setSelectedPatient(patient);
    setIsProfileModalOpen(true);
  };

  // Open Anamnese form
  const handleOpenAnamnese = (patient: PatientRecord) => {
    setPatientForAnamnese(patient);
    setIsAnamneseModalOpen(true);
  };

  // Open Customer Form (Add)
  const handleOpenAddCustomer = () => {
    setPatientToEdit(null);
    setIsCustomerFormOpen(true);
  };

  // Open Customer Form (Edit)
  const handleOpenEditCustomer = (patient: PatientRecord) => {
    setPatientToEdit(patient);
    setIsCustomerFormOpen(true);
  };

  // Save Anamnese
  const handleSaveAnamnese = (data: AnamneseData) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === data.clientId) {
          const updated = { ...p, anamnese: data };
          if (selectedPatient?.id === p.id) {
            setSelectedPatient(updated);
          }
          savePatientToFirestore(updated);
          return updated;
        }
        return p;
      })
    );
  };

  // Save Customer (Add or Edit)
  const handleSaveCustomer = (patientData: PatientRecord, openAnamneseNow: boolean) => {
    if (patientToEdit) {
      setPatients((prev) =>
        prev.map((p) => (p.id === patientData.id ? patientData : p))
      );
      if (selectedPatient?.id === patientData.id) {
        setSelectedPatient(patientData);
      }
      setIsCustomerFormOpen(false);
    } else {
      setPatients((prev) => [patientData, ...prev]);
      setIsCustomerFormOpen(false);

      if (openAnamneseNow) {
        // Open Anamnese immediately for new patient
        setPatientForAnamnese(patientData);
        setIsAnamneseModalOpen(true);
      }
    }
    // Sync to Firestore
    savePatientToFirestore(patientData);
  };

  // Delete patient with confirmation
  const handleDeleteCustomer = (id: string) => {
    const target = patients.find((p) => p.id === id);
    if (target) {
      setPatientToDelete(target);
    }
  };

  const handleConfirmDeleteCustomer = async () => {
    if (!patientToDelete) return;
    const target = patientToDelete;
    setIsDeletingCustomer(true);
    try {
      setPatients((prev) => prev.filter((p) => p.id !== target.id));
      if (selectedPatient?.id === target.id) {
        setIsProfileModalOpen(false);
      }
      await deletePatientFromFirestore(target.id);
      toast.success(`Paciente ${target.name} removido com sucesso`);
      setPatientToDelete(null);
    } catch (e) {
      toast.error("Erro ao remover paciente do banco de dados.");
    } finally {
      setIsDeletingCustomer(false);
    }
  };

  // Filtered patients
  const filteredPatients = useMemo(() => {
    return patients
      .filter((p) => {
        // Tabs
        if (activeTab === "treatment" && p.status !== "Em Tratamento") return false;
        if (activeTab === "active" && p.status !== "Ativo") return false;
        if (activeTab === "pending_anamnese" && p.anamnese?.status === "completed") return false;
        if (activeTab === "alerts") {
          const a = p.anamnese;
          const hasAlert =
            a &&
            (a.alergiaMedicamento ||
              a.alergiaAlimento ||
              a.alteracaoCardiologica ||
              a.proteseCardiaca ||
              a.usoAnticoagulante ||
              a.alergiaAnestesia ||
              a.medicamentoPressao ||
              a.diabetico);
          if (!hasAlert) return false;
        }

        // Search
        const q = searchQuery.toLowerCase().trim();
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          p.cpf.toLowerCase().includes(q) ||
          p.phone.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          (p.anamnese?.qualAlergiaMedicamento &&
            p.anamnese.qualAlergiaMedicamento.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        return sortAsc
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      });
  }, [patients, searchQuery, activeTab, sortAsc]);

  // Compute summary stats
  const totalPatients = patients.length;
  const inTreatment = patients.filter((p) => p.status === "Em Tratamento").length;
  const totalAnamneseDone = patients.filter(
    (p) => p.anamnese?.status === "completed"
  ).length;
  const patientsWithAlerts = patients.filter((p) => {
    const a = p.anamnese;
    return (
      a &&
      (a.alergiaMedicamento ||
        a.alergiaAlimento ||
        a.alteracaoCardiologica ||
        a.proteseCardiaca ||
        a.usoAnticoagulante ||
        a.alergiaAnestesia ||
        a.medicamentoPressao ||
        a.diabetico)
    );
  }).length;

  return (
    <div data-dashboard-section="customers" className="w-full min-w-0 max-w-[1400px] mx-auto space-y-5 sm:space-y-6 p8-page-enter pb-24 sm:pb-8">
      {/* 1. Header */}
      <div className="space-y-2.5 sm:space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-[#767676] dark:text-[#a1a1aa] font-medium">
          <Stethoscope className="w-3.5 h-3.5 text-black dark:text-white" />
          <span>Prontuário & Gestão Clínica</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <KineticHeading
              text="Carteira de Clientes"
              className="text-2xl sm:text-3xl font-bold text-black dark:text-white"
            />
            <p className="text-xs sm:text-sm text-[#6c6c6c] dark:text-[#a1a1aa] leading-relaxed">
              Gestão clínica, histórico e prontuários das pacientes da Dra. Sâmara.
            </p>
          </div>
          <button
            onClick={handleOpenAddCustomer}
            className="w-full sm:w-auto h-11 sm:h-9 px-4 rounded-xl bg-black dark:bg-white hover:bg-[#262626] dark:hover:bg-[#ededed] active:scale-[0.98] text-white dark:text-black text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all duration-150 cursor-pointer min-h-[44px] sm:min-h-0 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Cliente</span>
          </button>
        </div>
      </div>

      {/* 2. Overview Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        <div className="bg-white dark:bg-[#121212] p-3.5 sm:p-4 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] transition-all hover:border-black/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs text-[#767676] dark:text-[#a1a1aa] font-medium">Total Pacientes</span>
            <span className="w-7 h-7 rounded-lg bg-[#f6f6f6] dark:bg-[#1c1c1e] flex items-center justify-center text-black dark:text-white">
              <Users className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-black dark:text-white mt-1.5 tracking-tight"><AnimatedNumber value={totalPatients} ariaLabel={`${totalPatients} pacientes`} /></div>
          <span className="text-[11px] text-[#8f8f8f] dark:text-[#a1a1aa] mt-0.5 block truncate">Cadastradas na clínica</span>
        </div>

        <div className="bg-white dark:bg-[#121212] p-3.5 sm:p-4 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] transition-all hover:border-black/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs text-[#767676] dark:text-[#a1a1aa] font-medium">Em Tratamento</span>
            <span className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-700 dark:text-purple-300">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-black dark:text-white mt-1.5 tracking-tight"><AnimatedNumber value={inTreatment} ariaLabel={`${inTreatment} em tratamento`} /></div>
          <span className="text-[11px] text-purple-700 dark:text-purple-300 mt-0.5 block font-medium truncate">Sessões ativas</span>
        </div>

        <div className="bg-white dark:bg-[#121212] p-3.5 sm:p-4 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] transition-all hover:border-black/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs text-[#767676] dark:text-[#a1a1aa] font-medium">Anamneses Feitas</span>
            <span className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-black dark:text-white mt-1.5 tracking-tight"><AnimatedNumber value={totalAnamneseDone} ariaLabel={`${totalAnamneseDone} anamneses`} /></div>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5 block font-medium truncate">Fichas validadas</span>
        </div>

        <div className="bg-white dark:bg-[#121212] p-3.5 sm:p-4 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] transition-all hover:border-black/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs text-[#767676] dark:text-[#a1a1aa] font-medium">Alertas Ativos</span>
            <span className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-rose-600 dark:text-rose-400 mt-1.5 tracking-tight"><AnimatedNumber value={patientsWithAlerts} ariaLabel={`${patientsWithAlerts} alertas`} /></div>
          <span className="text-[11px] text-rose-700 dark:text-rose-400 mt-0.5 block font-medium truncate">Alergias ou riscos</span>
        </div>
      </div>

      {/* 3. Filter and Tab Bar */}
      <div className="space-y-3 pt-1 border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
        {/* Navigation Tabs — SlidingTabs (transitions.dev): pill segue a aba ativa, 44px touch, setas de teclado */}
        <div className="w-full min-w-0 max-w-full overflow-x-auto scrollbar-none scroll-smooth">
          <SlidingTabs
            ariaLabel="Filtrar pacientes"
            value={activeTab}
            onChange={setActiveTab}
            tabs={[
              { id: "all", label: `Todos (${patients.length})` },
              { id: "treatment", label: `Tratamento (${inTreatment})` },
              { id: "alerts", label: `Alertas (${patientsWithAlerts})` },
              {
                id: "pending_anamnese",
                label: `Sem Anamnese (${patients.length - totalAnamneseDone})`,
              },
            ]}
          />
        </div>

        {/* Search, Sort & View Mode */}
        <div className="flex min-w-0 items-center gap-2 w-full">
          {/* Search Box with anti-zoom (text-base sm:text-xs) and clear button */}
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8f8f8f] pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nome, CPF ou alergia..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 sm:h-9 pl-9 pr-8 w-full text-base sm:text-xs bg-[#f4f4f4] dark:bg-[#1c1c1e] hover:bg-[#ededed] dark:hover:bg-[#252528] focus:bg-white dark:focus:bg-[#141414] rounded-xl border border-transparent focus:border-black/20 dark:focus:border-white/20 outline-none transition-all placeholder:text-[#8f8f8f] text-black dark:text-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-[#767676] hover:text-black dark:hover:text-white text-xs"
              >
                ×
              </button>
            )}
          </div>

          {/* Sort Button with 44px tap target on mobile */}
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="h-11 sm:h-9 px-3 sm:px-2.5 rounded-xl bg-[#f4f4f4] dark:bg-[#1c1c1e] hover:bg-[#ededed] dark:hover:bg-[#252528] text-xs font-medium text-[#767676] dark:text-[#a1a1aa] hover:text-black dark:hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 active:scale-95 min-w-[44px] sm:min-w-0 justify-center"
            title="Alternar ordem alfabética"
          >
            <ArrowUpDown className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">{sortAsc ? "A-Z" : "Z-A"}</span>
          </button>

          {/* View Mode Toggle (Desktop only: on mobile always displays cards) */}
          <div className="hidden sm:inline-flex rounded-xl bg-[#f4f4f4] dark:bg-[#1c1c1e] p-0.5 shrink-0 border border-black/[0.04] dark:border-white/[0.06]">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "table" ? "bg-white dark:bg-[#2c2c2e] text-black dark:text-white shadow-sm" : "text-[#767676] dark:text-[#a1a1aa]"
              }`}
              title="Visualização em Tabela"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "grid" ? "bg-white dark:bg-[#2c2c2e] text-black dark:text-white shadow-sm" : "text-[#767676] dark:text-[#a1a1aa]"
              }`}
              title="Visualização em Cards"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Content Area: Table View, Cards View or Empty State */}
      {filteredPatients.length === 0 ? (
        <div className="bg-white dark:bg-[#121212] rounded-2xl border border-black/[0.08] dark:border-white/[0.08] p-6 sm:p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-[#f5f5f7] dark:bg-[#1c1c1e] border border-black/[0.05] dark:border-white/[0.06] flex items-center justify-center text-black dark:text-white shadow-sm">
            <Users className="w-7 h-7" />
          </div>
          <div className="max-w-[380px] space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-black dark:text-white tracking-tight">
              Sua Carteira de Pacientes está Pronta
            </h3>
            <p className="text-xs sm:text-sm text-[#767676] dark:text-[#a1a1aa] leading-relaxed">
              Você ainda não tem pacientes cadastrados. Cadastre seu primeiro paciente real para iniciar prontuários de estética e fichas clínicas.
            </p>
          </div>
          <button
            onClick={handleOpenAddCustomer}
            className="w-full sm:w-auto h-12 sm:h-9 px-5 rounded-xl bg-black dark:bg-white hover:bg-[#262626] dark:hover:bg-[#ededed] active:scale-[0.98] text-white dark:text-black text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer min-h-[44px] sm:min-h-0"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Primeira Paciente</span>
          </button>
        </div>
      ) : (
        <>
          {/* Mobile-Only Dedicated Patient Card List */}
          <div className="block sm:hidden space-y-3">
            {filteredPatients.map((patient) => {
              const anamnese = patient.anamnese;
              const isCompleted = anamnese?.status === "completed";
              const hasAllergy =
                anamnese?.alergiaMedicamento || anamnese?.alergiaAlimento;
              const hasCardiacOrCoag =
                anamnese?.alteracaoCardiologica ||
                anamnese?.proteseCardiaca ||
                anamnese?.usoAnticoagulante;

              return (
                <article
                  key={patient.id}
                  onClick={() => handleOpenProfile(patient)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleOpenProfile(patient);
                    }
                  }}
                  tabIndex={0}
                  aria-label={`Abrir prontuário de ${patient.name}`}
                  className="w-full min-w-0 max-w-full bg-white dark:bg-[#121212] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] active:scale-[0.99] transition-all cursor-pointer space-y-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:focus-visible:outline-white"
                >
                  {/* Top: Avatar, Name, CPF & Status */}
                  <div className="flex min-w-0 flex-wrap items-start justify-between gap-2.5">
                    <div className="flex min-w-0 flex-1 basis-[12rem] items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold flex items-center justify-center text-sm shrink-0 shadow-sm">
                        {patient.name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-black dark:text-white truncate">
                          {patient.name}
                        </h3>
                        <p className="text-[11px] text-[#767676] dark:text-[#a1a1aa] truncate">
                          CPF: {patient.cpf || "Não informado"} • {patient.age > 0 ? `${patient.age} anos` : "Idade não informada"}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`max-w-full shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        patient.status === "Em Tratamento"
                          ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40"
                          : patient.status === "Ativo"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40"
                          : patient.status === "Retorno Agendado"
                          ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40"
                          : "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
                      }`}
                    >
                      {patient.status}
                    </span>
                  </div>

                  {/* Medical Badges & Alerts */}
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {isCompleted ? (
                      <>
                        {hasAllergy && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/40">
                            <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                            Alergia: {anamnese.qualAlergiaMedicamento?.split(" ")[0] || "Sim"}
                          </span>
                        )}
                        {hasCardiacOrCoag && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/40">
                            <ShieldAlert className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                            Alerta Cardíaco
                          </span>
                        )}
                        {!hasAllergy && !hasCardiacOrCoag && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            Anamnese Ok
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40">
                        <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        Anamnese Pendente
                      </span>
                    )}

                    {patient.phone && (
                      <a
                        href={`https://wa.me/55${patient.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50/60 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300"
                      >
                        <Phone className="w-3 h-3 text-emerald-600" />
                        <span>{patient.phone}</span>
                      </a>
                    )}
                  </div>

                  {/* Summary row: Total Investido & Date */}
                  <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 text-xs pt-2 border-t border-black/[0.04] dark:border-white/[0.06]">
                    <div>
                      <span className="text-[10px] text-[#8f8f8f] dark:text-[#a1a1aa] block">Total Investido</span>
                      <span className="font-bold text-black dark:text-white">
                        {formatBRL(patient.totalSpent)}
                      </span>
                    </div>
                    {patient.lastProcedureDate && (
                      <div className="text-right">
                        <span className="text-[10px] text-[#8f8f8f] dark:text-[#a1a1aa] block">Último Procedimento</span>
                        <span className="text-xs text-[#525252] dark:text-[#d4d4d8] font-medium">
                          {patient.lastProcedureDate}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Mobile Actions: Touch targets at least 44px */}
                  <div
                    className="grid min-w-0 grid-cols-2 gap-2 pt-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => handleOpenAnamnese(patient)}
                      className="h-11 rounded-xl bg-[#f4f4f4] dark:bg-[#1c1c1e] hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black text-xs font-semibold text-black dark:text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>Anamnese</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenProfile(patient)}
                      className="h-11 rounded-xl bg-black dark:bg-white text-white dark:text-black hover:bg-[#262626] dark:hover:bg-[#eaeaea] text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
                    >
                      <span>Ver Prontuário</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Desktop Table & Grid View (Hidden on mobile) */}
          <div className="hidden sm:block">
            {viewMode === "table" ? (
              <div className="w-full bg-white dark:bg-[#121212] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl overflow-hidden shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    {/* Header */}
                    <thead>
                      <tr className="border-b border-black/[0.06] dark:border-white/[0.06] bg-[#fafafa]/80 dark:bg-[#18181b]/80 text-[#767676] dark:text-[#a1a1aa] font-medium">
                        <th className="py-3.5 px-4 font-semibold text-[#0d0d0d] dark:text-white whitespace-nowrap">
                          Paciente
                        </th>
                        <th className="py-3.5 px-4 font-semibold text-[#0d0d0d] dark:text-white whitespace-nowrap">
                          Status
                        </th>
                        <th className="py-3.5 px-4 font-semibold text-[#0d0d0d] dark:text-white whitespace-nowrap">
                          Ficha de Anamnese & Alertas
                        </th>
                        <th className="py-3.5 px-4 font-semibold text-[#0d0d0d] dark:text-white whitespace-nowrap">
                          Telefone / WhatsApp
                        </th>
                        <th className="py-3.5 px-4 font-semibold text-[#0d0d0d] dark:text-white whitespace-nowrap">
                          Total Investido
                        </th>
                        <th className="py-3.5 px-4 font-semibold text-[#0d0d0d] dark:text-white whitespace-nowrap">
                          Último Procedimento
                        </th>
                        <th className="py-3.5 px-4 font-semibold text-[#0d0d0d] dark:text-white text-right whitespace-nowrap">
                          Ações
                        </th>
                      </tr>
                    </thead>

                    {/* Body */}
                    <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                      {filteredPatients.map((patient) => {
                        const anamnese = patient.anamnese;
                        const isCompleted = anamnese?.status === "completed";
                        const hasAllergy =
                          anamnese?.alergiaMedicamento || anamnese?.alergiaAlimento;
                        const hasCardiacOrCoag =
                          anamnese?.alteracaoCardiologica ||
                          anamnese?.proteseCardiaca ||
                          anamnese?.usoAnticoagulante;

                        return (
                          <tr
                            key={patient.id}
                            onClick={() => handleOpenProfile(patient)}
                            className="hover:bg-[#fbfbfb] dark:hover:bg-[#1a1a1c] transition-colors duration-100 group cursor-pointer"
                          >
                            {/* Paciente */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold flex items-center justify-center shrink-0 text-xs">
                                  {patient.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .slice(0, 2)
                                    .join("")}
                                </div>
                                <div>
                                  <div className="font-semibold text-black dark:text-white text-sm group-hover:underline">
                                    {patient.name}
                                  </div>
                                  <div className="text-[11px] text-[#8f8f8f] dark:text-[#a1a1aa]">
                                    CPF: {patient.cpf || "Não informado"} • {patient.age > 0 ? `${patient.age} anos` : "Idade não informada"}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                                  patient.status === "Em Tratamento"
                                    ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40"
                                    : patient.status === "Ativo"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40"
                                    : patient.status === "Retorno Agendado"
                                    ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40"
                                    : "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
                                }`}
                              >
                                {patient.status}
                              </span>
                            </td>

                            {/* Anamnese & Alertas Visuais */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5 flex-wrap max-w-[320px]">
                                {isCompleted ? (
                                  <>
                                    {hasAllergy && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/40">
                                        <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                                        Alergia:{" "}
                                        {anamnese.qualAlergiaMedicamento?.split(" ")[0] || "Sim"}
                                      </span>
                                    )}
                                    {hasCardiacOrCoag && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/40">
                                        <ShieldAlert className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                                        Alerta Cardíaco
                                      </span>
                                    )}
                                    {!hasAllergy && !hasCardiacOrCoag && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                        Anamnese Ok
                                      </span>
                                    )}
                                    {anamnese.tipoPele && (
                                      <span className="text-[10px] text-[#767676] dark:text-[#a1a1aa] bg-[#f2f2f2] dark:bg-[#252528] px-1.5 py-0.5 rounded">
                                        Pele {anamnese.tipoPele}
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40">
                                    <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                    Pendente
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Telefone / WhatsApp */}
                            <td className="py-3.5 px-4 whitespace-nowrap text-[#525252] dark:text-[#d4d4d8]">
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3 h-3 text-[#8f8f8f]" />
                                <span>{patient.phone}</span>
                              </div>
                            </td>

                            {/* Total Investido */}
                            <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-black dark:text-white">
                              {formatBRL(patient.totalSpent)}
                            </td>

                            {/* Último Procedimento */}
                            <td className="py-3.5 px-4 whitespace-nowrap text-[#767676] dark:text-[#a1a1aa]">
                              {patient.lastProcedureDate}
                            </td>

                            {/* Ações */}
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div
                                className="inline-flex items-center gap-1.5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={() => handleOpenAnamnese(patient)}
                                  className="h-8 px-2.5 rounded-lg bg-[#f4f4f4] dark:bg-[#1c1c1e] hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black text-xs font-medium text-black dark:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                                  title="Abrir formulário de Anamnese"
                                >
                                  <Stethoscope className="w-3.5 h-3.5" />
                                  <span>Anamnese</span>
                                </button>

                                <button
                                  onClick={() => handleOpenEditCustomer(patient)}
                                  className="w-8 h-8 rounded-lg bg-[#f4f4f4] dark:bg-[#1c1c1e] hover:bg-[#ededed] dark:hover:bg-[#252528] text-[#767676] dark:text-[#a1a1aa] hover:text-black dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                                  title="Editar Dados do Cliente"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => handleDeleteCustomer(patient.id)}
                                  className="w-8 h-8 rounded-lg bg-[#f4f4f4] dark:bg-[#1c1c1e] hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 text-[#8f8f8f] flex items-center justify-center transition-colors cursor-pointer"
                                  title="Excluir paciente"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-black/[0.06] dark:border-white/[0.06] bg-[#fafafa]/50 dark:bg-[#18181b]/50 text-xs text-[#767676] dark:text-[#a1a1aa]">
                  <span>
                    Mostrando <strong className="text-black dark:text-white font-semibold">{filteredPatients.length}</strong> de{" "}
                    <strong className="text-black dark:text-white font-semibold">{patients.length}</strong> pacientes
                  </span>
                  <div className="flex items-center gap-2">
                    <button className="px-2.5 py-1 rounded-md bg-white dark:bg-[#2c2c2e] border border-black/[0.08] dark:border-white/[0.08] hover:bg-[#f5f5f5] dark:hover:bg-[#3a3a3c] text-black dark:text-white transition-colors cursor-pointer">
                      Anterior
                    </button>
                    <span className="font-medium text-black dark:text-white px-2">1</span>
                    <button className="px-2.5 py-1 rounded-md bg-white dark:bg-[#2c2c2e] border border-black/[0.08] dark:border-white/[0.08] hover:bg-[#f5f5f5] dark:hover:bg-[#3a3a3c] text-black dark:text-white transition-colors cursor-pointer">
                      Próximo
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Grid Cards View */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPatients.map((patient) => {
                  const anamnese = patient.anamnese;
                  const isCompleted = anamnese?.status === "completed";
                  const hasAllergy =
                    anamnese?.alergiaMedicamento || anamnese?.alergiaAlimento;

                  return (
                    <div
                      key={patient.id}
                      onClick={() => handleOpenProfile(patient)}
                      className="bg-white dark:bg-[#121212] border border-black/[0.08] dark:border-white/[0.08] hover:border-black/30 dark:hover:border-white/30 rounded-2xl p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] transition-all cursor-pointer group flex flex-col justify-between space-y-4"
                    >
                      <div>
                        {/* Top Bar */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold flex items-center justify-center text-sm shrink-0">
                              {patient.name
                                .split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")}
                            </div>
                            <div>
                              <h3 className="font-bold text-sm text-black dark:text-white group-hover:underline">
                                {patient.name}
                              </h3>
                              <p className="text-xs text-[#767676] dark:text-[#a1a1aa]">CPF: {patient.cpf || "Não informado"}</p>
                            </div>
                          </div>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              patient.status === "Em Tratamento"
                                ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40"
                            }`}
                          >
                            {patient.status}
                          </span>
                        </div>

                        {/* Medical Alerts Bar */}
                        <div className="mt-3.5 pt-3 border-t border-black/[0.05] dark:border-white/[0.06] space-y-1.5">
                          {isCompleted ? (
                            <div className="flex flex-wrap gap-1.5">
                              {hasAllergy && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/40">
                                  <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                                  Alergia Medicamentosa
                                </span>
                              )}
                              {anamnese.alteracaoCardiologica && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/40">
                                  <ShieldAlert className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                                  Cardíaco
                                </span>
                              )}
                              {!hasAllergy && !anamnese.alteracaoCardiologica && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                  Anamnese Completa
                                </span>
                              )}
                              {anamnese.tipoPele && (
                                <span className="text-[10px] text-[#767676] dark:text-[#a1a1aa] bg-[#f5f5f5] dark:bg-[#1f1f22] px-1.5 py-0.5 rounded">
                                  Pele {anamnese.tipoPele}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40">
                              <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                              Anamnese Pendente
                            </span>
                          )}
                        </div>

                        {/* Contact info */}
                        <div className="mt-3 space-y-1 text-xs text-[#6c6c6c] dark:text-[#a1a1aa]">
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-[#8f8f8f]" />
                            <span>{patient.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-[#8f8f8f]" />
                            <span className="truncate">{patient.email}</span>
                          </div>
                        </div>
                      </div>

                      {/* Footer of Card */}
                      <div
                        className="pt-3 border-t border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div>
                          <span className="text-[10px] text-[#8f8f8f] dark:text-[#a1a1aa] block">Total Investido</span>
                          <span className="text-xs font-bold text-black dark:text-white">
                            {formatBRL(patient.totalSpent)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenAnamnese(patient)}
                            className="h-8 px-2.5 rounded-lg bg-[#f4f4f4] dark:bg-[#1c1c1e] hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black text-xs font-semibold text-black dark:text-white transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Stethoscope className="w-3 h-3" />
                            <span>Anamnese</span>
                          </button>
                          <button
                            onClick={() => handleOpenProfile(patient)}
                            className="h-8 px-2.5 rounded-lg bg-black dark:bg-white text-white dark:text-black hover:bg-[#262626] dark:hover:bg-[#eaeaea] text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Ver Perfil
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Delete Patient Confirmation Modal (Apple Bottom Sheet on mobile) */}
      <ModalPortal isOpen={!!patientToDelete}>
        <div
          className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200 select-none"
          onClick={() => !isDeletingCustomer && setPatientToDelete(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#1a1a1a] rounded-t-[28px] sm:rounded-[24px] border-t sm:border border-black/[0.08] dark:border-white/[0.08] shadow-[0_24px_48px_-16px_rgba(0,0,0,0.25)] w-full max-w-[440px] p-6 space-y-4 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-150"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-black dark:text-white tracking-tight">
                  Excluir Paciente
                </h3>
                <p className="text-xs text-[#767676] dark:text-[#a1a1aa] leading-relaxed">
                  Tem certeza que deseja remover <strong>{patientToDelete?.name}</strong> da carteira? Esta ação apagará todo o histórico clínico, fotos e prontuários vinculados.
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeletingCustomer}
                onClick={() => setPatientToDelete(null)}
                className="h-11 sm:h-9 px-4 rounded-xl bg-[#f4f4f4] dark:bg-[#2c2c2e] hover:bg-[#ebebeb] dark:hover:bg-[#3a3a3c] text-xs font-semibold text-black dark:text-white transition-all cursor-pointer min-h-[44px] sm:min-h-0 flex items-center justify-center"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeletingCustomer}
                onClick={handleConfirmDeleteCustomer}
                className="h-11 sm:h-9 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-all cursor-pointer min-h-[44px] sm:min-h-0 flex items-center justify-center gap-2 shadow-sm active:scale-95 disabled:opacity-60"
              >
                {isDeletingCustomer ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <span>Excluir Definitivamente</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>

      {/* 5. Modals */}
      {/* Customer Profile Modal */}
      <CustomerProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        patient={selectedPatient}
        onOpenAnamnese={() => {
          if (selectedPatient) {
            handleOpenAnamnese(selectedPatient);
          }
        }}
        onOpenEditCustomer={() => {
          if (selectedPatient) {
            handleOpenEditCustomer(selectedPatient);
          }
        }}
        onUpdatePatient={(updated) => {
          setSelectedPatient(updated);
          setPatients((prev) =>
            prev.map((p) => (p.id === updated.id ? updated : p))
          );
          savePatientToFirestore(updated);
        }}
      />

      {/* Anamnese Form Modal */}
      {patientForAnamnese && (
        <AnamneseFormModal
          isOpen={isAnamneseModalOpen}
          onClose={() => {
            setIsAnamneseModalOpen(false);
            setPatientForAnamnese(null);
          }}
          clientId={patientForAnamnese.id}
          clientName={patientForAnamnese.name}
          initialData={patientForAnamnese.anamnese}
          onSave={handleSaveAnamnese}
        />
      )}

      {/* Customer Form Modal (Add / Edit) */}
      <CustomerFormModal
        isOpen={isCustomerFormOpen}
        onClose={() => {
          setIsCustomerFormOpen(false);
          setPatientToEdit(null);
        }}
        patientToEdit={patientToEdit}
        onSave={handleSaveCustomer}
      />
    </div>
  );
}

"use client";

import React, { useState } from "react";
import {
  X,
  AlertTriangle,
  ShieldAlert,
  Heart,
  Stethoscope,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Edit2,
  DollarSign,
  User,
  Activity,
  FileCheck,
  ChevronRight,
  ExternalLink,
  Layers,
  Droplet,
  Instagram,
  Plus,
  Check,
} from "lucide-react";
import { ModalPortal } from "@/components/ui/modal-portal";
import { cn } from "@/lib/utils";
import { AnamneseData } from "./anamnese-form-modal";
import { BotoxApplicationModal, BotoxRecord } from "./botox-application-modal";
import { HofPlanningModal, HofPlanningRecord } from "./hof-planning-modal";
import { BioestimuladorModal, BioestimuladorRecord } from "./bioestimulador-modal";

export type ClinicalProcedureType = "botox" | "hof" | "bio";

export interface PatientRecord {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  email: string;
  birthDate: string;
  age: number;
  gender: string;
  location: string;
  profession: string;
  status: "Ativo" | "Em Tratamento" | "Retorno Agendado" | "Inativo";
  totalSpent: number;
  proceduresCount: number;
  lastProcedureDate: string;
  notes?: string;
  activeProcedures?: ClinicalProcedureType[];
  anamnese?: AnamneseData;
  botoxRecord?: BotoxRecord;
  hofRecord?: Partial<HofPlanningRecord>;
  bioRecord?: BioestimuladorRecord;
  proceduresHistory?: {
    id: string;
    procedureName: string;
    category: string;
    date: string;
    value: number;
    professional: string;
    notes?: string;
  }[];
}

interface CustomerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientRecord | null;
  onOpenAnamnese: () => void;
  onOpenEditCustomer: () => void;
  onUpdatePatient?: (updatedPatient: PatientRecord) => void;
}

export function CustomerProfileModal({
  isOpen,
  onClose,
  patient,
  onOpenAnamnese,
  onOpenEditCustomer,
  onUpdatePatient,
}: CustomerProfileModalProps) {
  const [activeTab, setActiveTab] = useState<
    "anamnese" | "botox" | "hof" | "bio" | "procedures" | "data"
  >("anamnese");

  // Sub-modals for clinical sheets (Sheets 2, 3, 4)
  const [isBotoxModalOpen, setIsBotoxModalOpen] = useState(false);
  const [isHofModalOpen, setIsHofModalOpen] = useState(false);
  const [isBioModalOpen, setIsBioModalOpen] = useState(false);
  const [isAddFichaModalOpen, setIsAddFichaModalOpen] = useState(false);

  if (!isOpen || !patient) return null;

  // Active procedure sheets configuration for this client
  const activeProcedures: ClinicalProcedureType[] = patient.activeProcedures ?? [
    ...(patient.botoxRecord ? ["botox" as const] : []),
    ...(patient.hofRecord ? ["hof" as const] : []),
    ...(patient.bioRecord ? ["bio" as const] : []),
  ];

  const hasBotox = activeProcedures.includes("botox");
  const hasHof = activeProcedures.includes("hof");
  const hasBio = activeProcedures.includes("bio");

  const handleToggleProcedure = (proc: ClinicalProcedureType) => {
    const isCurrentlyActive = activeProcedures.includes(proc);
    const newProcedures = isCurrentlyActive
      ? activeProcedures.filter((p) => p !== proc)
      : [...activeProcedures, proc];

    const updatedPatient: PatientRecord = {
      ...patient,
      activeProcedures: newProcedures,
    };

    if (onUpdatePatient) {
      onUpdatePatient(updatedPatient);
    }

    if (!isCurrentlyActive) {
      setActiveTab(proc);
    } else if (activeTab === proc) {
      setActiveTab("anamnese");
    }
  };

  const anamnese = patient.anamnese;
  const isAnamneseCompleted = anamnese && anamnese.status === "completed";

  // Compute critical alert badges
  const redAlerts: string[] = [];
  const yellowAlerts: string[] = [];

  if (isAnamneseCompleted) {
    if (anamnese.alergiaMedicamento) {
      redAlerts.push(
        `Alergia Medicamento: ${anamnese.qualAlergiaMedicamento || "Sim"}`
      );
    }
    if (anamnese.alergiaAlimento) {
      redAlerts.push(
        `Alergia Alimento: ${anamnese.qualAlergiaAlimento || "Sim"}`
      );
    }
    if (anamnese.alteracaoCardiologica) {
      redAlerts.push("Alteração Cardiológica Relatada");
    }
    if (anamnese.proteseCardiaca) {
      redAlerts.push("Portador de Prótese Cardíaca / Marcapasso");
    }
    if (anamnese.usoAnticoagulante) {
      redAlerts.push("Uso Contínuo de Anticoagulante");
    }
    if (anamnese.alergiaAnestesia) {
      redAlerts.push("Reação Adversa a Anestésico");
    }

    // Yellow / Warning Alerts
    if (anamnese.medicamentoPressao) {
      yellowAlerts.push(
        `Anti-hipertensivo: ${anamnese.qualMedicamentoPressao || "Sim"}`
      );
    }
    if (anamnese.diabetico) {
      yellowAlerts.push("Diabetes");
    }
    if (anamnese.disfuncaoRenal) {
      yellowAlerts.push(
        `Disfunção Renal: ${anamnese.qualDisfuncaoRenal || "Sim"}`
      );
    }
    if (anamnese.coagulacaoSanguinea) {
      yellowAlerts.push("Distúrbio de Coagulação");
    }
    if (anamnese.gravidaLactante) {
      yellowAlerts.push("Gestante ou Lactante");
    }
    if (anamnese.herpesLabial) {
      yellowAlerts.push("Histórico de Herpes Labial");
    }
    if (anamnese.convulsoesEpilepsia) {
      yellowAlerts.push("Convulsão / Epilepsia");
    }
    if (anamnese.emTratamentoMedico) {
      yellowAlerts.push(
        `Em Tratamento: ${anamnese.qualTratamentoMedico || "Sim"}`
      );
    }
    if (anamnese.vacinaUltimos30Dias) {
      yellowAlerts.push("Vacina nos últimos 30 dias");
    }
    if (anamnese.usoCorticoide) {
      yellowAlerts.push("Uso de Corticoides");
    }
  }

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  const statusBadge = (st: PatientRecord["status"]) => {
    switch (st) {
      case "Em Tratamento":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Ativo":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Retorno Agendado":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Inativo":
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <ModalPortal isOpen={isOpen}>
      <div
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200 select-none"
        style={{
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-t-[28px] sm:rounded-[24px] border-t sm:border border-black/[0.08] shadow-[0_24px_48px_-16px_rgba(0,0,0,0.25)] w-full max-w-[900px] h-[94vh] sm:h-auto sm:max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
        >
          {/* Header Profile Bar */}
          <div className="p-3.5 sm:p-6 border-b border-black/[0.06] bg-white">
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-black text-white font-bold text-base sm:text-lg flex items-center justify-center shrink-0 shadow-sm">
                  {patient.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg sm:text-xl font-bold text-black tracking-tight">
                      {patient.name}
                    </h2>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusBadge(
                        patient.status
                      )}`}
                    >
                      {patient.status}
                    </span>
                    {isAnamneseCompleted ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        Anamnese Concluída
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <AlertCircle className="w-3 h-3" />
                        Anamnese Pendente
                      </span>
                    )}
                  </div>

                  {/* Sub info */}
                  <div className="flex items-center gap-3 sm:gap-4 text-xs text-[#767676] mt-1.5 flex-wrap">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-[#8f8f8f]" />
                      CPF: {patient.cpf} • {patient.age} anos ({patient.gender})
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-[#8f8f8f]" />
                      {patient.phone}
                    </span>
                    {anamnese?.instagram && (
                      <span className="flex items-center gap-1 text-purple-700 font-medium">
                        <Instagram className="w-3.5 h-3.5 text-purple-600" />
                        @{anamnese.instagram}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#f4f4f4] hover:bg-[#ebebeb] flex items-center justify-center text-[#8f8f8f] hover:text-black transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* CRITICAL MEDICAL ALERTS BAR (Destaque Visual) */}
            <div className="mt-3.5 pt-3 border-t border-black/[0.05]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-black uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-black" />
                  Alertas Clínicos & Risco do Paciente
                </span>
                {anamnese && (
                  <span className="text-[10px] sm:text-[11px] text-[#8f8f8f]">
                    Data da Ficha: {anamnese.updatedAt}
                  </span>
                )}
              </div>

              {/* Badges container */}
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {redAlerts.map((alert, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300 shadow-sm animate-in fade-in"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    {alert}
                  </span>
                ))}

                {yellowAlerts.map((alert, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-300 shadow-sm animate-in fade-in"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    {alert}
                  </span>
                ))}

                {anamnese && anamnese.tipoPele && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium bg-[#f5f5f5] text-black border border-black/[0.08]">
                    <Sparkles className="w-3 h-3 text-[#767676]" />
                    Pele: <strong className="font-semibold">{anamnese.tipoPele}</strong>
                  </span>
                )}

                {anamnese && anamnese.fotoenvelhecimento && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium bg-[#f5f5f5] text-black border border-black/[0.08]">
                    Glogau:{" "}
                    <strong className="font-semibold">{anamnese.fotoenvelhecimento}</strong>
                  </span>
                )}

                {isAnamneseCompleted && redAlerts.length === 0 && yellowAlerts.length === 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Sem alergias ou contraindicações relatadas.
                  </span>
                )}

                {!isAnamneseCompleted && (
                  <div className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 gap-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Ficha de Anamnese ainda não preenchida.</span>
                    </div>
                    <button
                      onClick={onOpenAnamnese}
                      className="px-2.5 py-1 rounded-lg bg-black text-white font-semibold text-xs hover:bg-[#262626] transition-colors cursor-pointer shrink-0"
                    >
                      Preencher Agora
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tab Navigation (Mobile-Friendly Horizontal Scroll) */}
          <div className="flex items-center justify-between px-4 sm:px-6 border-b border-black/[0.06] bg-[#fafafa] overflow-x-auto relative">
            <div className="flex items-center gap-1.5 py-2 shrink-0">
              <button
                onClick={() => setActiveTab("anamnese")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "anamnese"
                    ? "bg-white text-black shadow-sm font-semibold"
                    : "text-[#767676] hover:text-black"
                }`}
              >
                Ficha de Anamnese & Termo
              </button>

              {hasBotox && (
                <button
                  onClick={() => setActiveTab("botox")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === "botox"
                      ? "bg-white text-black shadow-sm font-semibold"
                      : "text-[#767676] hover:text-black"
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-black" />
                  <span>Ficha de Botox</span>
                </button>
              )}

              {hasHof && (
                <button
                  onClick={() => setActiveTab("hof")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === "hof"
                      ? "bg-white text-black shadow-sm font-semibold"
                      : "text-[#767676] hover:text-black"
                  }`}
                >
                  <Layers className="w-3 h-3 text-black" />
                  <span>Planejamento HOF</span>
                </button>
              )}

              {hasBio && (
                <button
                  onClick={() => setActiveTab("bio")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === "bio"
                      ? "bg-white text-black shadow-sm font-semibold"
                      : "text-[#767676] hover:text-black"
                  }`}
                >
                  <Droplet className="w-3 h-3 text-purple-600" />
                  <span>Ficha de Bioestimulador</span>
                </button>
              )}

              {/* Botão de Adicionar Mais Procedimentos para o ADM (Item 1) */}
              <button
                type="button"
                onClick={() => setIsAddFichaModalOpen(true)}
                className="h-7 px-2.5 rounded-lg border border-dashed border-black/30 hover:border-black bg-white hover:bg-[#f0f0f0] text-black text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shrink-0"
                title="Clique para escolher qual ficha clínica adicionar para este cliente"
              >
                <Plus className="w-3 h-3 text-black stroke-[2.5]" />
                <span>Adicionar Ficha</span>
              </button>

              <button
                onClick={() => setActiveTab("procedures")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "procedures"
                    ? "bg-white text-black shadow-sm font-semibold"
                    : "text-[#767676] hover:text-black"
                }`}
              >
                Procedimentos ({patient.proceduresHistory?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("data")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "data"
                    ? "bg-white text-black shadow-sm font-semibold"
                    : "text-[#767676] hover:text-black"
                }`}
              >
                Dados Cadastrais
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <button
                onClick={onOpenAnamnese}
                className="h-8 px-3 rounded-lg bg-black hover:bg-[#262626] text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
                <span>{isAnamneseCompleted ? "Editar Anamnese" : "Nova Anamnese"}</span>
              </button>
            </div>
          </div>

          {/* Tab Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* TAB 1: ANAMNESE COMPLETA */}
            {activeTab === "anamnese" && (
              <div className="space-y-6">
                {isAnamneseCompleted && anamnese ? (
                  <>
                    {/* Identificação & Motivo */}
                    <div className="p-4 rounded-2xl bg-white border border-black/[0.08] space-y-3">
                      <div className="flex items-center justify-between border-b border-black/[0.06] pb-2">
                        <h4 className="text-xs font-bold text-black uppercase tracking-wider flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center">
                            1
                          </span>
                          Queixa Principal & Motivo da Consulta (Imagens 1 e 5)
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1">
                          <span className="text-[11px] font-semibold text-[#767676]">Motivo da Consulta:</span>
                          <p className="font-semibold text-black bg-[#fafafa] p-2.5 rounded-xl border border-black/[0.04]">
                            {anamnese.motivoConsulta || "Harmonização facial e rejuvenescimento."}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[11px] font-semibold text-[#767676]">O que espera do tratamento:</span>
                          <p className="font-semibold text-black bg-[#fafafa] p-2.5 rounded-xl border border-black/[0.04]">
                            {anamnese.expectativaTratamento || "Resultado natural e atenuação das rugas dinâmicas."}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1 pt-1">
                        <span className="text-[11px] font-semibold text-[#767676]">Queixa Principal do Paciente:</span>
                        <p className="text-xs text-black font-medium bg-[#f9f9f9] p-3 rounded-xl border border-black/[0.04] leading-relaxed">
                          {anamnese.queixaPrincipal || "Sem queixa detalhada informada."}
                        </p>
                      </div>
                    </div>

                    {/* Histórico Cirúrgico e Imunológico */}
                    <div className="p-4 rounded-2xl bg-white border border-black/[0.08] space-y-3">
                      <h4 className="text-xs font-bold text-black uppercase tracking-wider border-b border-black/[0.06] pb-2">
                        Histórico Médico, Imunológico & Anestésico
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                        <div className="p-2.5 rounded-xl bg-[#fafafa]">
                          <span className="text-[11px] text-[#767676] block">Tratamento Médico</span>
                          <span className="font-semibold text-black">
                            {anamnese.emTratamentoMedico ? `Sim (${anamnese.qualTratamentoMedico || "Sim"})` : "Não"}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[#fafafa]">
                          <span className="text-[11px] text-[#767676] block">Uso de Corticoides</span>
                          <span className="font-semibold text-black">
                            {anamnese.usoCorticoide ? "Sim ⚠️" : "Não"}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[#fafafa]">
                          <span className="text-[11px] text-[#767676] block">Doador de Sangue</span>
                          <span className="font-semibold text-black">
                            {anamnese.doadorSangue ? `Sim (${anamnese.quandoUltimaDoacao || "Sim"})` : "Não"}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[#fafafa]">
                          <span className="text-[11px] text-[#767676] block">Vacina Últimos 30 Dias</span>
                          <span className="font-semibold text-black">
                            {anamnese.vacinaUltimos30Dias ? "Sim ⚠️" : "Não"}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[#fafafa]">
                          <span className="text-[11px] text-[#767676] block">Anestesia Geral</span>
                          <span className="font-semibold text-black">{anamnese.anestesiaGeral ? "Sim" : "Não"}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[#fafafa]">
                          <span className="text-[11px] text-[#767676] block">Cirurgia Prévia</span>
                          <span className="font-semibold text-black">
                            {anamnese.cirurgiaPrevia ? `Sim (${anamnese.qualCirurgia || "Sim"})` : "Não"}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[#fafafa]">
                          <span className="text-[11px] text-[#767676] block">Anestesia Odontológica</span>
                          <span className="font-semibold text-black">
                            {anamnese.anestesiaOdontologica ? "Sim" : "Não"}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[#fafafa] sm:col-span-2">
                          <span className="text-[11px] text-[#767676] block">Alergia com Anestesia</span>
                          <span className={`font-semibold ${anamnese.alergiaAnestesia ? "text-rose-600" : "text-black"}`}>
                            {anamnese.alergiaAnestesia ? "Sim (Alerta de Reação a Anestésico)" : "Não"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Alergias & Medicação (Destaque) */}
                    <div className="p-4 rounded-2xl bg-rose-50/30 border border-rose-200 space-y-3">
                      <div className="flex items-center justify-between border-b border-rose-200 pb-2">
                        <h4 className="text-xs font-bold text-rose-950 uppercase tracking-wider flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-rose-600" />
                          Alergias e Medicação de Pressão (Imagem 1)
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                        <div className="p-3 rounded-xl bg-white border border-rose-200">
                          <span className="text-[11px] text-[#767676] block">Alergia a Medicamento</span>
                          <span className="font-bold text-xs mt-1 block text-rose-900">
                            {anamnese.alergiaMedicamento ? anamnese.qualAlergiaMedicamento || "Sim" : "Nenhuma"}
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-white border border-rose-200">
                          <span className="text-[11px] text-[#767676] block">Alergia a Alimento</span>
                          <span className="font-bold text-xs mt-1 block text-rose-900">
                            {anamnese.alergiaAlimento ? anamnese.qualAlergiaAlimento || "Sim" : "Nenhuma"}
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-white border border-rose-200">
                          <span className="text-[11px] text-[#767676] block">Remédio Pressão Arterial</span>
                          <span className="font-bold text-xs mt-1 block text-rose-900">
                            {anamnese.medicamentoPressao ? anamnese.qualMedicamentoPressao || "Sim" : "Não"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Pele e Termo Assinado */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-white border border-black/[0.08] space-y-2">
                        <h4 className="text-xs font-bold text-black uppercase tracking-wider border-b border-black/[0.06] pb-2">
                          Classificação Dérmica
                        </h4>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-[#767676]">Tipo de Pele:</span>
                            <span className="font-bold text-black">{anamnese.tipoPele || "Mista"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#767676]">Fotoenvelhecimento:</span>
                            <span className="font-bold text-black">{anamnese.fotoenvelhecimento || "Leve"}</span>
                          </div>
                          {anamnese.tratamentoEsteticoPrevio && (
                            <div className="pt-1">
                              <span className="text-[11px] text-[#767676] block">Histórico de Tratamentos Estéticos:</span>
                              <span className="text-xs text-black font-medium">
                                {anamnese.experienciaTratamentoEstetico || "Já realizou procedimentos prévios."}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-white border border-black/[0.08] space-y-2">
                        <div className="flex items-center justify-between border-b border-black/[0.06] pb-2">
                          <h4 className="text-xs font-bold text-black uppercase tracking-wider">
                            Termo de Consentimento Livre e Esclarecido
                          </h4>
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                            ✓ Assinado & Válido
                          </span>
                        </div>

                        {anamnese.assinaturaUrl ? (
                          <div className="border border-black/[0.1] rounded-xl p-3 bg-[#fafafa] flex flex-col items-center justify-center">
                            <img
                              src={anamnese.assinaturaUrl}
                              alt="Foto da assinatura do paciente"
                              className="max-h-24 max-w-full object-contain rounded-lg border border-black/10 bg-white p-1 shadow-xs"
                            />
                            <span className="text-[10px] text-[#767676] block text-center mt-2 font-medium">
                              Foto da assinatura do cliente vinculada ao termo
                            </span>
                          </div>
                        ) : anamnese.anexoFichaUrl ? (
                          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                            <span className="font-medium">
                              Ficha: {anamnese.anexoFichaNome || "ficha_assinada.jpg"}
                            </span>
                            <a
                              href={anamnese.anexoFichaUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-black font-semibold hover:underline inline-flex items-center gap-1"
                            >
                              Ver Ficha <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        ) : (
                          <div className="text-xs text-[#8f8f8f] py-4 text-center">
                            Foto da assinatura do cliente ainda não anexada
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-14 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                      <Stethoscope className="w-6 h-6" />
                    </div>
                    <h4 className="text-base font-bold text-black">Ficha de Anamnese Pendente</h4>
                    <p className="text-xs text-[#767676] max-w-md mx-auto">
                      Preencha a ficha com o modelo oficial de clínica estética (queixas, histórico, alergias, pele e termo de consentimento).
                    </p>
                    <button
                      onClick={onOpenAnamnese}
                      className="h-10 px-5 rounded-xl bg-black hover:bg-[#262626] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer inline-flex items-center gap-2"
                    >
                      <Stethoscope className="w-4 h-4" />
                      <span>Preencher Ficha de Anamnese Agora</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: FICHA DE BOTOX (Imagem 2) */}
            {activeTab === "botox" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-black tracking-tight">
                      Ficha de Aplicação BOTOX (Mapeamento Muscular)
                    </h4>
                    <p className="text-xs text-[#767676]">
                      Registro oficial de diluição, lote, data e dosagem por músculo facial (Imagem 2).
                    </p>
                  </div>
                  <button
                    onClick={() => setIsBotoxModalOpen(true)}
                    className="h-8 px-3.5 rounded-xl bg-black text-white hover:bg-[#262626] text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>{patient.botoxRecord ? "Editar Aplicação" : "Registrar Aplicação de Botox"}</span>
                  </button>
                </div>

                {patient.botoxRecord ? (
                  <>
                    {/* Resumo da Aplicação */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-[#fafafa] border border-black/[0.06] text-xs">
                      <div>
                        <span className="text-[11px] text-[#767676] block">Diluição</span>
                        <span className="font-bold text-black">{patient.botoxRecord.dilutionVolume} ({patient.botoxRecord.dilutionDate})</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-[#767676] block">Nº do Lote</span>
                        <span className="font-mono font-bold text-black">{patient.botoxRecord.lotNumber}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-[#767676] block">Data Aplicação</span>
                        <span className="font-bold text-black">{patient.botoxRecord.applicationDate}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-[#767676] block">Total de Unidades</span>
                        <span className="text-sm font-black text-emerald-700">
                          {Object.values(patient.botoxRecord.muscles).reduce((a, b) => a + Number(b || 0), 0)} U Aplicadas
                        </span>
                      </div>
                    </div>

                    {/* Tabela dos Músculos Aplicados */}
                    <div className="border border-black/[0.08] rounded-xl overflow-hidden divide-y divide-black/[0.04] bg-white text-xs">
                      <div className="grid grid-cols-2 bg-[#f6f6f6] px-4 py-2.5 font-bold text-black">
                        <span>Músculo Facial</span>
                        <span className="text-right">Unidades Aplicadas (U)</span>
                      </div>
                      {Object.entries(patient.botoxRecord.muscles)
                        .filter(([_, u]) => Number(u) > 0)
                        .map(([m, u]) => (
                          <div key={m} className="grid grid-cols-2 px-4 py-2 items-center hover:bg-[#fafafa]">
                            <span className="font-medium text-black capitalize">
                              {m.replace(/([A-Z])/g, " $1")}
                            </span>
                            <span className="text-right font-bold text-black">{u} U</span>
                          </div>
                        ))}
                    </div>

                    {patient.botoxRecord.notes && (
                      <div className="p-3 rounded-xl bg-[#fafafa] border border-black/[0.04] text-xs">
                        <span className="text-[11px] font-semibold text-[#767676] block">Anotações da Aplicação:</span>
                        <p className="text-black font-medium mt-0.5">{patient.botoxRecord.notes}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-12 text-center space-y-3 bg-[#fafafa] rounded-2xl border border-black/[0.06]">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h5 className="text-xs font-bold text-black">Nenhuma Ficha de Botox Registrada</h5>
                    <p className="text-[11px] text-[#767676] max-w-sm mx-auto">
                      Registre os pontos e unidades aplicadas por músculo para ter o histórico completo.
                    </p>
                    <button
                      onClick={() => setIsBotoxModalOpen(true)}
                      className="px-3 py-1.5 rounded-lg bg-black text-white text-xs font-semibold hover:bg-[#262626] cursor-pointer"
                    >
                      Preencher Ficha de Botox Agora
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: PLANEJAMENTO HOF (Imagem 3) */}
            {activeTab === "hof" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-black tracking-tight">
                      Planejamento HOF (Harmonização Orofacial)
                    </h4>
                    <p className="text-xs text-[#767676]">
                      Alinhamento de expectativas, regiões tratadas e cronograma anual de procedimentos (Imagem 3).
                    </p>
                  </div>
                  <button
                    onClick={() => setIsHofModalOpen(true)}
                    className="h-8 px-3.5 rounded-xl bg-black text-white hover:bg-[#262626] text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>{patient.hofRecord ? "Editar Planejamento" : "Criar Planejamento HOF"}</span>
                  </button>
                </div>

                {patient.hofRecord ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-[#fafafa] border border-black/[0.06] text-xs">
                      <div>
                        <span className="text-[11px] text-[#767676] block">Resultado Esperado</span>
                        <span className="font-bold text-black">✓ {patient.hofRecord.expectedResult || "Natural com movimento"}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-[#767676] block">Investimento Previsto</span>
                        <span className="font-bold text-emerald-700">{patient.hofRecord.value || "A combinar"}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-[#767676] block">Condição de Pagamento</span>
                        <span className="font-bold text-black">{patient.hofRecord.paymentMethod || "Não informado"}</span>
                      </div>
                    </div>

                    {/* Procedimentos & Regiões */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3.5 rounded-2xl bg-white border border-black/[0.08] space-y-2">
                        <span className="font-bold text-black text-[11px] uppercase tracking-wider block">
                          Procedimentos Planejados:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {patient.hofRecord.procedures?.map((proc) => (
                            <span key={proc} className="px-2.5 py-1 rounded-lg bg-black text-white font-medium text-[11px]">
                              {proc}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-white border border-black/[0.08] space-y-2">
                        <span className="font-bold text-black text-[11px] uppercase tracking-wider block">
                          Regiões Anatômicas Tratadas:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {patient.hofRecord.treatedRegions?.map((reg) => (
                            <span key={reg} className="px-2.5 py-1 rounded-lg bg-[#f4f4f4] text-black border border-black/10 font-medium text-[11px] capitalize">
                              {reg}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Planejamento Anual (1 a 6) */}
                    {patient.hofRecord.annualPlanning && patient.hofRecord.annualPlanning.length > 0 && (
                      <div className="p-4 rounded-2xl bg-white border border-black/[0.08] space-y-2.5 text-xs">
                        <span className="font-bold text-black text-[11px] uppercase tracking-wider block">
                          Cronograma Anual de Cuidados (6 Etapas):
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {patient.hofRecord.annualPlanning.map((step) => (
                            <div key={step.stage} className="p-2.5 rounded-xl bg-[#fafafa] border border-black/[0.04] flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                {step.stage}
                              </span>
                              <span className="font-bold text-black w-24 shrink-0">{step.date}:</span>
                              <span className="text-[#525252] truncate">{step.notes}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-12 text-center space-y-3 bg-[#fafafa] rounded-2xl border border-black/[0.06]">
                    <div className="w-10 h-10 rounded-xl bg-black/5 text-black flex items-center justify-center mx-auto">
                      <Layers className="w-5 h-5" />
                    </div>
                    <h5 className="text-xs font-bold text-black">Nenhum Planejamento HOF Criado</h5>
                    <p className="text-[11px] text-[#767676] max-w-sm mx-auto">
                      Monte o plano anual de harmonização orofacial, regiões anatômicas e alinhamento de expectativas.
                    </p>
                    <button
                      onClick={() => setIsHofModalOpen(true)}
                      className="px-3 py-1.5 rounded-lg bg-black text-white text-xs font-semibold hover:bg-[#262626] cursor-pointer"
                    >
                      Criar Planejamento HOF Agora
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: FICHA DE BIOESTIMULADOR (Imagem 4) */}
            {activeTab === "bio" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-black tracking-tight">
                      Ficha de Bioestimulador (Áreas Trabalhadas & Dosagem ML)
                    </h4>
                    <p className="text-xs text-[#767676]">
                      Registro oficial das tabelas de aplicação e controle de retorno (Imagem 4).
                    </p>
                  </div>
                  <button
                    onClick={() => setIsBioModalOpen(true)}
                    className="h-8 px-3.5 rounded-xl bg-black text-white hover:bg-[#262626] text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>{patient.bioRecord ? "Editar Ficha de Bioestimulador" : "Registrar Aplicação"}</span>
                  </button>
                </div>

                {patient.bioRecord ? (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Tabela 1 */}
                      <div className="p-4 rounded-2xl bg-white border border-black/[0.08] space-y-2.5">
                        <div className="flex items-center justify-between border-b border-black/[0.06] pb-1.5">
                          <span className="font-bold text-black uppercase tracking-wider text-[11px]">
                            Sessão / Região Primária
                          </span>
                          <span className="text-[11px] text-purple-700 font-semibold">
                            Nova: {patient.bioRecord.nextApplication1}
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {patient.bioRecord.table1.filter((r) => r.area && r.ml).map((r, i) => (
                            <div key={i} className="flex justify-between bg-[#fafafa] p-2 rounded-xl border border-black/[0.04]">
                              <span className="font-medium text-black">{r.area}</span>
                              <span className="font-bold text-purple-900">{r.ml}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Tabela 2 */}
                      <div className="p-4 rounded-2xl bg-white border border-black/[0.08] space-y-2.5">
                        <div className="flex items-center justify-between border-b border-black/[0.06] pb-1.5">
                          <span className="font-bold text-black uppercase tracking-wider text-[11px]">
                            Sessão / Região Complementar
                          </span>
                          <span className="text-[11px] text-purple-700 font-semibold">
                            Nova: {patient.bioRecord.nextApplication2}
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {patient.bioRecord.table2.filter((r) => r.area && r.ml).map((r, i) => (
                            <div key={i} className="flex justify-between bg-[#fafafa] p-2 rounded-xl border border-black/[0.04]">
                              <span className="font-medium text-black">{r.area}</span>
                              <span className="font-bold text-purple-900">{r.ml}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {patient.bioRecord.notes && (
                      <div className="p-3 rounded-xl bg-[#fafafa] border border-black/[0.04]">
                        <span className="text-[11px] font-semibold text-[#767676] block">Observações:</span>
                        <p className="text-black font-medium mt-0.5">{patient.bioRecord.notes}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-12 text-center space-y-3 bg-[#fafafa] rounded-2xl border border-black/[0.06]">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                      <Droplet className="w-5 h-5" />
                    </div>
                    <h5 className="text-xs font-bold text-black">Nenhuma Ficha de Bioestimulador Registrada</h5>
                    <p className="text-[11px] text-[#767676] max-w-sm mx-auto">
                      Registre as áreas trabalhadas e os volumes em ML para Sculptra, Radiesse ou Elleva.
                    </p>
                    <button
                      onClick={() => setIsBioModalOpen(true)}
                      className="px-3 py-1.5 rounded-lg bg-black text-white text-xs font-semibold hover:bg-[#262626] cursor-pointer"
                    >
                      Preencher Ficha de Bioestimulador
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: PROCEDIMENTOS REALIZADOS */}
            {activeTab === "procedures" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-black tracking-tight">
                      Histórico Clínico de Sessões
                    </h4>
                    <p className="text-xs text-[#767676]">
                      Total investido pelo paciente:{" "}
                      <strong className="text-black font-semibold">
                        {formatBRL(patient.totalSpent)}
                      </strong>
                    </p>
                  </div>
                </div>

                {patient.proceduresHistory && patient.proceduresHistory.length > 0 ? (
                  <div className="border border-black/[0.08] rounded-xl overflow-hidden divide-y divide-black/[0.04]">
                    {patient.proceduresHistory.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 flex items-center justify-between hover:bg-[#fafafa] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#f4f4f4] flex items-center justify-center text-black">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-xs text-black">
                              {item.procedureName}
                            </div>
                            <div className="text-[11px] text-[#8f8f8f]">
                              {item.date} • Resp: {item.professional}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-black">
                            {formatBRL(item.value)}
                          </div>
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                            Concluído
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-[#767676]">
                    Nenhum procedimento registrado no histórico deste paciente.
                  </div>
                )}
              </div>
            )}

            {/* TAB 6: DADOS CADASTRAIS */}
            {activeTab === "data" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-black tracking-tight">
                    Informações Pessoais & Contato
                  </h4>
                  <button
                    onClick={onOpenEditCustomer}
                    className="h-8 px-3 rounded-lg bg-[#f4f4f4] hover:bg-black hover:text-white text-xs font-medium text-black flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Editar Dados</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#fafafa] border border-black/[0.04]">
                    <span className="text-[11px] text-[#767676] block">Nome Completo</span>
                    <span className="font-semibold text-black text-sm">{patient.name}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#fafafa] border border-black/[0.04]">
                    <span className="text-[11px] text-[#767676] block">CPF</span>
                    <span className="font-semibold text-black">{patient.cpf}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#fafafa] border border-black/[0.04]">
                    <span className="text-[11px] text-[#767676] block">Telefone / WhatsApp</span>
                    <span className="font-semibold text-black">{patient.phone}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#fafafa] border border-black/[0.04]">
                    <span className="text-[11px] text-[#767676] block">E-mail</span>
                    <span className="font-semibold text-black">{patient.email}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#fafafa] border border-black/[0.04]">
                    <span className="text-[11px] text-[#767676] block">Data de Nascimento / Idade</span>
                    <span className="font-semibold text-black">
                      {patient.birthDate} ({patient.age} anos)
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#fafafa] border border-black/[0.04]">
                    <span className="text-[11px] text-[#767676] block">Gênero</span>
                    <span className="font-semibold text-black">{patient.gender}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#fafafa] border border-black/[0.04]">
                    <span className="text-[11px] text-[#767676] block">Cidade / UF</span>
                    <span className="font-semibold text-black">{patient.location}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#fafafa] border border-black/[0.04]">
                    <span className="text-[11px] text-[#767676] block">Profissão</span>
                    <span className="font-semibold text-black">{patient.profession}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sub-modals for clinical sheets (Sheets 2, 3, 4) */}
      <BotoxApplicationModal
        isOpen={isBotoxModalOpen}
        onClose={() => setIsBotoxModalOpen(false)}
        patientName={patient.name}
        initialData={patient.botoxRecord}
        onSave={(data) => {
          const updated = { ...patient, botoxRecord: data };
          if (onUpdatePatient) onUpdatePatient(updated);
        }}
      />

      <HofPlanningModal
        isOpen={isHofModalOpen}
        onClose={() => setIsHofModalOpen(false)}
        patientName={patient.name}
        initialData={patient.hofRecord}
        onSave={(data) => {
          const updated = { ...patient, hofRecord: data };
          if (onUpdatePatient) onUpdatePatient(updated);
        }}
      />

      <BioestimuladorModal
        isOpen={isBioModalOpen}
        onClose={() => setIsBioModalOpen(false)}
        patientName={patient.name}
        initialData={patient.bioRecord}
        onSave={(data) => {
          const updated = { ...patient, bioRecord: data };
          if (onUpdatePatient) onUpdatePatient(updated);
        }}
      />

      {/* Modal Interativo: Qual Ficha Deseja Adicionar? (Item 1) */}
      <ModalPortal isOpen={isAddFichaModalOpen}>
        <div
          className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200 select-none"
          style={{
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
          }}
          onClick={() => setIsAddFichaModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-[28px] sm:rounded-[24px] border-t sm:border border-black/[0.08] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] w-full max-w-[580px] max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-150"
          >
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-black/[0.06] bg-white flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-[#767676] uppercase flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-black" />
                  Prontuário Clínico & Procedimentos
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-black tracking-tight mt-1">
                  Qual ficha você deseja adicionar?
                </h3>
                <p className="text-xs text-[#767676] mt-1 leading-relaxed">
                  Selecione o procedimento para liberar a ficha correspondente na barra de abas de{" "}
                  <strong className="text-black font-semibold">{patient.name}</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddFichaModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#f4f4f4] hover:bg-[#ebebeb] flex items-center justify-center text-[#8f8f8f] hover:text-black transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of Sheet Cards */}
            <div className="p-4 sm:p-6 space-y-3 bg-[#fafafa] overflow-y-auto max-h-[62vh]">
              {[
                {
                  id: "botox" as ClinicalProcedureType,
                  title: "Ficha de Botox",
                  subtitle: "Toxina Botulínica Facial",
                  icon: Sparkles,
                  iconClass: "bg-black text-white",
                  description:
                    "Mapeamento de 14 pontos musculares (Frontal, Corrugadores, Prócero, etc.), controle de diluição, lote e revisão agendada de 15 dias.",
                  pills: ["14 Pontos Musculares", "Diluição & Lote", "Revisão 15 Dias"],
                },
                {
                  id: "hof" as ClinicalProcedureType,
                  title: "Planejamento HOF",
                  subtitle: "Harmonização Orofacial",
                  icon: Layers,
                  iconClass: "bg-black text-white",
                  description:
                    "Mapeamento estético facial dos terços superior, médio e inferior, alinhamento de expectativas e cronograma anual de sessões.",
                  pills: ["Mapeamento Facial", "Cronograma Anual", "Expectativas"],
                },
                {
                  id: "bio" as ClinicalProcedureType,
                  title: "Ficha de Bioestimulador",
                  subtitle: "Colágeno Facial & Corporal",
                  icon: Droplet,
                  iconClass: "bg-purple-600 text-white",
                  description:
                    "Protocolo para Sculptra, Radiesse e Elleva. Mapeamento de vetores faciais/corporais, reconstituição, tipo de cânula e retornos.",
                  pills: ["Facial & Corporal", "Diluição & Cânula", "Retornos Progressivos"],
                },
              ].map((sheet) => {
                const isSheetActive = activeProcedures.includes(sheet.id);
                const IconComponent = sheet.icon;

                return (
                  <div
                    key={sheet.id}
                    onClick={() => {
                      if (!isSheetActive) {
                        handleToggleProcedure(sheet.id);
                        setIsAddFichaModalOpen(false);
                      }
                    }}
                    className={cn(
                      "p-4 rounded-2xl border transition-all text-left flex flex-col gap-3",
                      isSheetActive
                        ? "bg-white border-emerald-300 shadow-sm"
                        : "bg-white border-black/[0.08] hover:border-black hover:shadow-md cursor-pointer group"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105",
                            sheet.iconClass
                          )}
                        >
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-black text-sm">{sheet.title}</h4>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#f4f4f4] text-[#555]">
                              {sheet.subtitle}
                            </span>
                          </div>
                          <p className="text-xs text-[#767676] mt-1 leading-snug line-clamp-2">
                            {sheet.description}
                          </p>
                        </div>
                      </div>

                      {isSheetActive && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                          Ativa
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-black/[0.04]">
                      <div className="flex flex-wrap gap-1.5">
                        {sheet.pills.map((p, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-medium text-[#767676] bg-[#f7f7f7] px-2 py-0.5 rounded-md border border-black/[0.04]"
                          >
                            {p}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isSheetActive ? (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleProcedure(sheet.id);
                              }}
                              className="text-[11px] font-medium text-rose-600 hover:text-rose-800 hover:underline px-2 py-1 cursor-pointer transition-colors"
                            >
                              Remover
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveTab(sheet.id);
                                setIsAddFichaModalOpen(false);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-black text-white hover:bg-[#262626] text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                            >
                              <span>Acessar Ficha</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleProcedure(sheet.id);
                              setIsAddFichaModalOpen(false);
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-black text-white hover:bg-[#262626] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm group-hover:bg-[#1a1a1a]"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Adicionar Ficha</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-5 border-t border-black/[0.06] bg-white flex items-center justify-between">
              <span className="text-[11px] text-[#767676]">
                As fichas ativadas ficam disponíveis nas abas superiores.
              </span>
              <button
                type="button"
                onClick={() => setIsAddFichaModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-black hover:bg-[#262626] text-white text-xs font-semibold transition-all cursor-pointer shadow-sm"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>
    </ModalPortal>
  );
}

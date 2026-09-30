"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  DollarSign,
  Users,
  Filter,
  Printer,
  ChevronRight,
  Clock,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Appointment } from "./appointments";
import { PatientRecord } from "./customer-profile-modal";
import { generateClinicalPdfReport } from "@/lib/pdf-report-generator";
import { toast } from "sonner";
import { playNotificationSound } from "@/lib/sound";
import { SlidingTabs, AnimatedNumber, KineticHeading, BorderBeam, ThinkingDots, SkeletonReveal } from "@/components/motion";

import { getStoredAppointments, getStoredPatients } from "@/lib/storage-keys";

export function ReportsSection() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [chartsLoaded, setChartsLoaded] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<"todos" | "mes" | "hoje">("todos");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Carregar dados reais
  useEffect(() => {
    const loadRealData = () => {
      try {
        setAppointments(getStoredAppointments());
        setPatients(getStoredPatients());
      } catch (e) {
        console.error("Erro ao carregar dados para relatórios:", e);
      }
    };

    loadRealData();
    window.addEventListener("samara_appointments_updated", loadRealData);
    window.addEventListener("samara_patients_updated", loadRealData);
    window.addEventListener("storage", loadRealData);

    const timer = setTimeout(() => setChartsLoaded(true), 300);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("samara_appointments_updated", loadRealData);
      window.removeEventListener("samara_patients_updated", loadRealData);
      window.removeEventListener("storage", loadRealData);
    };
  }, []);

  // Filtragem por período
  const filteredAppointments = appointments.filter((a) => {
    if (selectedPeriod === "hoje") {
      return a.date?.toLowerCase() === "hoje";
    }
    return true;
  });

  // Métricas Reais
  const totalRevenue = filteredAppointments.reduce((sum, a) => {
    if (a.status === "concluido" || a.status === "confirmado") {
      return sum + (a.value || 0);
    }
    return sum;
  }, 0);

  const completedCount = filteredAppointments.filter((a) => a.status === "concluido").length;
  const returnCount = filteredAppointments.filter(
    (a) => a.type === "Retorno de 15 Dias" || a.status === "retorno_pendente"
  ).length;

  const returnRate =
    filteredAppointments.length > 0 && returnCount > 0
      ? `${Math.round((returnCount / filteredAppointments.length) * 100)}%`
      : filteredAppointments.length === 0
      ? "100%"
      : "0%";

  const formatBRL = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val || 0);

  // Dados para Gráfico de Procedimentos (Demanda Real)
  const procedureMap = new Map<string, { count: number; revenue: number }>();
  filteredAppointments.forEach((a) => {
    const name = a.procedureName || "Outros";
    const current = procedureMap.get(name) || { count: 0, revenue: 0 };
    current.count += 1;
    current.revenue += a.value || 0;
    procedureMap.set(name, current);
  });

  const procedureChartData = Array.from(procedureMap.entries())
    .map(([name, data]) => ({
      name,
      sessoes: data.count,
      faturamento: data.revenue,
    }))
    .sort((a, b) => b.sessoes - a.sessoes)
    .slice(0, 6);

  // Dados para Gráfico de Status do Funil (Distribuição Real)
  const stagesCount = {
    agendado: filteredAppointments.filter((a) => a.status === "agendado").length,
    confirmado: filteredAppointments.filter((a) => a.status === "confirmado").length,
    em_atendimento: filteredAppointments.filter((a) => a.status === "em_atendimento").length,
    retorno: filteredAppointments.filter(
      (a) => a.type === "Retorno de 15 Dias" || a.status === "retorno_pendente"
    ).length,
    concluido: completedCount,
  };

  const totalStages = Object.values(stagesCount).reduce((a, b) => a + b, 0);

  // Paleta oficial Made By Majid (Olive, Sage, Ivory, Âmbar, Carvão)
  const pieColors = ["#8D9B7F", "#A8B29A", "#F7F5F0", "#C5A059", "#444444"];
  const stageData = [
    { name: "Agendados", value: stagesCount.agendado, color: pieColors[0] },
    { name: "Confirmados", value: stagesCount.confirmado, color: pieColors[1] },
    { name: "Em Atendimento", value: stagesCount.em_atendimento, color: pieColors[2] },
    { name: "Retornos 15d", value: stagesCount.retorno, color: pieColors[3] },
    { name: "Concluídos", value: stagesCount.concluido, color: pieColors[4] },
  ].filter((s) => s.value > 0);

  // Handler de Geração do PDF
  const handleDownloadPdf = (type: "geral" | "financeiro" | "pacientes" | "retornos") => {
    setIsGeneratingPdf(true);
    playNotificationSound();

    try {
      const periodLabel =
        selectedPeriod === "hoje"
          ? "Atendimentos de Hoje"
          : selectedPeriod === "mes"
          ? "Mês Corrente"
          : "Todos os Registros Clínicos";

      const fileName = generateClinicalPdfReport({
        appointments: filteredAppointments,
        patients,
        reportType: type,
        periodName: periodLabel,
      });

      toast.success("📄 Relatório PDF Gerado com Sucesso!", {
        description: `O arquivo ${fileName} foi salvo na pasta de downloads do seu dispositivo.`,
        duration: 5000,
      });
    } catch (e: any) {
      console.error("Erro ao gerar PDF:", e);
      toast.error("Erro ao gerar o relatório em PDF", {
        description: e?.message || "Tente novamente em instantes.",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div data-dashboard-section="reports" className="w-full min-w-0 max-w-[1400px] mx-auto space-y-6 p8-page-enter pb-24 md:pb-8">
      {/* Header com Filtros & Botão Principal de Download do PDF */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#121212] p-4 sm:p-5 rounded-2xl border border-border dark:border-white/[0.08] shadow-sm">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-[#767676] dark:text-[#a1a1aa] font-medium">
            <FileText className="w-3.5 h-3.5 text-black dark:text-white" />
            <span>Dados Reais da Clínica</span>
          </div>
          <KineticHeading
            text="Relatórios Clínicos & Estratégicos"
            as="h2"
            className="text-base sm:text-lg font-bold text-black dark:text-white"
          />
          <p className="text-xs text-[#767676] dark:text-[#a0a0a0] mt-0.5">
            Dados 100% reais de atendimentos, faturamento e acompanhamento de retornos da Dra. Sâmara.
          </p>
        </div>

        <div className="flex min-w-0 w-full flex-wrap items-center gap-2 sm:w-auto">
          {/* Seletor de Período — SlidingTabs (transitions.dev) */}
          <SlidingTabs
            ariaLabel="Filtrar relatórios por período"
            value={selectedPeriod}
            onChange={(id) => setSelectedPeriod(id as typeof selectedPeriod)}
            tabs={[
              { id: "todos", label: "Geral" },
              { id: "hoje", label: "Hoje" },
            ]}
          />

          {/* Botão de Exportação Master */}
          <BorderBeam className="w-full sm:w-auto">
          <button
            onClick={() => handleDownloadPdf("geral")}
            disabled={isGeneratingPdf}
            className="flex items-center justify-center gap-2 h-11 sm:h-10 px-4 rounded-xl bg-black text-white hover:bg-neutral-800 dark:bg-[#9ca889] dark:text-[#070707] dark:hover:bg-[#8f9b7c] active:bg-[#849071] text-xs font-semibold shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_4px_16px_rgba(156,168,137,0.25)] transition-all cursor-pointer disabled:opacity-50 w-full sm:w-auto active:scale-95 min-h-[44px] sm:min-h-0"
          >
            {isGeneratingPdf ? (
              <>
                <ThinkingDots label="Gerando PDF" />
                <span>Gerando PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Exportar Relatório PDF</span>
              </>
            )}
          </button>
          </BorderBeam>
        </div>
      </div>

      {/* Cards de Métricas Reais do Relatório */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-[#121214] border border-border dark:border-white/[0.08] rounded-2xl p-3.5 sm:p-4 shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_16px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-xs font-medium text-[#767676] dark:text-[#a0a0a0]">
              Faturamento
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-bold text-black dark:text-white truncate">
            {formatBRL(totalRevenue)}
          </p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium truncate block">
            {completedCount} finalizadas
          </span>
        </div>

        <div className="bg-white dark:bg-[#121214] border border-border dark:border-white/[0.08] rounded-2xl p-3.5 sm:p-4 shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_16px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-xs font-medium text-[#767676] dark:text-[#a0a0a0]">
              Pacientes
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-bold text-black dark:text-white">
            <AnimatedNumber value={patients.length} ariaLabel={`${patients.length} pacientes`} />
          </p>
          <span className="text-[11px] text-[#767676] dark:text-[#a0a0a0] truncate block">
            Cadastradas
          </span>
        </div>

        <div className="bg-white dark:bg-[#121214] border border-border dark:border-white/[0.08] rounded-2xl p-3.5 sm:p-4 shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_16px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-xs font-medium text-[#767676] dark:text-[#a0a0a0]">
              Atendimentos
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#A8B29A]/15 text-[#A8B29A] flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-bold text-black dark:text-white">
            <AnimatedNumber value={filteredAppointments.length} ariaLabel={`${filteredAppointments.length} atendimentos`} />
          </p>
          <span className="text-[11px] text-[#A8B29A] font-medium truncate block">
            No fluxo clínico
          </span>
        </div>

        <div className="bg-white dark:bg-[#121214] border border-border dark:border-white/[0.08] rounded-2xl p-3.5 sm:p-4 shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_16px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-xs font-medium text-[#767676] dark:text-[#a0a0a0]">
              Retornos (15d)
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 flex items-center justify-center shrink-0">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-bold text-black dark:text-white">{returnRate}</p>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium truncate block">
            {returnCount} revisões
          </span>
        </div>
      </div>

      {/* Relatórios Rápidos Disponíveis em 1 Clique (PDFs Especializados) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Relatório Geral */}
        <div
          onClick={() => handleDownloadPdf("geral")}
          className="group bg-white dark:bg-[#121212] border border-border dark:border-white/[0.08] hover:border-black dark:hover:border-white rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-white/[0.06] text-black dark:text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-black dark:text-white">
              Relatório Geral Consolidado
            </h4>
            <p className="text-[11px] text-[#767676] dark:text-[#a0a0a0] mt-1 leading-relaxed">
              Resumo executivo completo com KPIs, ranking de procedimentos e todos os atendimentos.
            </p>
          </div>
          <button className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-black dark:text-white group-hover:gap-2.5 transition-all">
            <Download className="w-3.5 h-3.5" />
            <span>Baixar PDF</span>
          </button>
        </div>

        {/* 2. Relatório Financeiro */}
        <div
          onClick={() => handleDownloadPdf("financeiro")}
          className="group bg-white dark:bg-[#121212] border border-border dark:border-white/[0.08] hover:border-[#A8B29A] rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="w-9 h-9 rounded-xl bg-[#A8B29A]/15 text-[#A8B29A] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <DollarSign className="w-4 h-4" />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-black dark:text-white">
              Relatório Financeiro
            </h4>
            <p className="text-[11px] text-[#767676] dark:text-[#a0a0a0] mt-1 leading-relaxed">
              Faturamento real por procedimento, valores recebidos e ticket médio da clínica.
            </p>
          </div>
          <button className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[#A8B29A] group-hover:gap-2.5 transition-all">
            <Download className="w-3.5 h-3.5" />
            <span>Baixar PDF</span>
          </button>
        </div>

        {/* 3. Relatório da Carteira de Clientes */}
        <div
          onClick={() => handleDownloadPdf("pacientes")}
          className="group bg-white dark:bg-[#121212] border border-border dark:border-white/[0.08] hover:border-[#8D9B7F] rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="w-9 h-9 rounded-xl bg-[#8D9B7F]/15 text-[#8D9B7F] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-black dark:text-white">
              Carteira de Clientes
            </h4>
            <p className="text-[11px] text-[#767676] dark:text-[#a0a0a0] mt-1 leading-relaxed">
              Lista nominal das pacientes cadastradas, telefones, aniversários e quantidade de sessões.
            </p>
          </div>
          <button className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[#8D9B7F] group-hover:gap-2.5 transition-all">
            <Download className="w-3.5 h-3.5" />
            <span>Baixar PDF</span>
          </button>
        </div>

        {/* 4. Relatório de Retornos de 15 Dias */}
        <div
          onClick={() => handleDownloadPdf("retornos")}
          className="group bg-white dark:bg-[#121212] border border-border dark:border-white/[0.08] hover:border-[#C5A059] rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="w-9 h-9 rounded-xl bg-[#C5A059]/15 text-[#C5A059] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <RotateCcw className="w-4 h-4" />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-black dark:text-white">
              Retornos de 15 Dias
            </h4>
            <p className="text-[11px] text-[#767676] dark:text-[#a0a0a0] mt-1 leading-relaxed">
              Controle clínico de revisões de Botox e Harmonização Facial para retoque e simetria.
            </p>
          </div>
          <button className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[#C5A059] group-hover:gap-2.5 transition-all">
            <Download className="w-3.5 h-3.5" />
            <span>Baixar PDF</span>
          </button>
        </div>
      </div>

      {/* Gráficos Reais: Demanda de Procedimentos & Distribuição do Funil */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Gráfico 1: Demanda por Procedimento */}
        <div className="bg-white dark:bg-[#121212] border border-border dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-black dark:text-white">
                Procedimentos Mais Realizados
              </h3>
              <p className="text-xs text-[#767676] dark:text-[#a0a0a0] mt-0.5">
                Volume de sessões por procedimento da clínica
              </p>
            </div>
            <div className="text-xs font-semibold text-black dark:text-white flex items-center gap-1">
              <BarChart3 className="w-4 h-4 text-[#8f8f8f]" />
              <span>{procedureChartData.length} tipos</span>
            </div>
          </div>

          {procedureChartData.length === 0 ? (
            <div className="h-[220px] flex flex-col items-center justify-center text-center">
              <p className="text-xs font-semibold text-black dark:text-white">
                Nenhum procedimento registrado ainda
              </p>
              <p className="text-[11px] text-[#767676] dark:text-[#8f8f8f] mt-1">
                Conforme a Dra. Sâmara registrar novos atendimentos, o gráfico de barras será montado.
              </p>
            </div>
          ) : (
            <SkeletonReveal
              loading={!chartsLoaded}
              skeleton={
                <div className="h-[220px] flex items-end justify-around gap-2 px-2" aria-hidden="true">
                  {[55, 80, 40, 70, 95, 60].map((h, i) => (
                    <div
                      key={i}
                      className="w-full rounded-t-md bg-black/[0.07] dark:bg-white/[0.08]"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              }
            >
            <div className={`h-[220px] transition-opacity duration-500 ${chartsLoaded ? "opacity-100" : "opacity-0"}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={procedureChartData} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} opacity={0.5} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#888888", fontSize: 10 }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#888888", fontSize: 10 }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#181818",
                      border: "1px solid #333333",
                      borderRadius: "12px",
                      fontSize: "12px",
                      color: "#ffffff",
                    }}
                    labelStyle={{ color: "#ffffff", fontWeight: "bold" }}
                    formatter={(val: number) => [`${val} sessões`, "Demanda"]}
                  />
                  <Bar dataKey="sessoes" fill="#A8B29A" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            </SkeletonReveal>
          )}
        </div>

        {/* Gráfico 2: Distribuição de Status */}
        <div className="bg-white dark:bg-[#121212] border border-border dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm sm:text-base font-semibold text-black dark:text-white">
              Status do Pipeline de Pacientes
            </h3>
            <p className="text-xs text-[#767676] dark:text-[#a0a0a0] mt-0.5">
              Distribuição percentual dos agendamentos em curso
            </p>
          </div>

          {stageData.length === 0 ? (
            <div className="h-[220px] flex flex-col items-center justify-center text-center">
              <p className="text-xs font-semibold text-black dark:text-white">
                Nenhum agendamento no funil
              </p>
              <p className="text-[11px] text-[#767676] dark:text-[#8f8f8f] mt-1">
                A distribuição percentual das etapas aparecerá aqui em tempo real.
              </p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6 h-[220px]">
              <div className="w-[160px] h-[160px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stageData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {stageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex-1 space-y-2 w-full">
                {stageData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-black dark:text-white font-medium">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#767676] dark:text-[#a0a0a0]">{item.value} atend.</span>
                      <span className="font-bold text-black dark:text-white">
                        {totalStages > 0 ? `${Math.round((item.value / totalStages) * 100)}%` : "0%"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Histórico Real de Atendimentos */}
      <div className="bg-white dark:bg-[#121212] border border-border dark:border-white/[0.08] rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border dark:border-white/[0.08]">
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-black dark:text-white">
              Histórico Clínico Detalhado
            </h3>
            <p className="text-xs text-[#767676] dark:text-[#a0a0a0] mt-0.5">
              Listagem de atendimentos incluídos no relatório
            </p>
          </div>
          <button
            onClick={() => handleDownloadPdf("financeiro")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f5f5f5] hover:bg-[#ebebeb] dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-xs font-semibold text-black dark:text-white transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF Financeiro</span>
          </button>
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-2xl bg-[#f7f7f7] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.06] flex items-center justify-center text-[#8f8f8f] mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-black dark:text-white">
              Nenhum atendimento encontrado para o período selecionado
            </p>
            <p className="text-[11px] text-[#767676] dark:text-[#8f8f8f] max-w-xs mt-1">
              Cadastre novos agendamentos na aba Agenda para compor o histórico detalhado deste relatório.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[560px]">
              <thead className="bg-[#fafafa] dark:bg-white/[0.03] text-[#767676] dark:text-[#8f8f8f] uppercase text-[10px] tracking-wider border-b border-border dark:border-white/[0.08]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Paciente</th>
                  <th className="px-4 py-3 font-semibold">Procedimento</th>
                  <th className="hidden sm:table-cell px-4 py-3 font-semibold">Tipo</th>
                  <th className="px-4 py-3 font-semibold">Data / Horário</th>
                  <th className="px-4 py-3 font-semibold">Valor</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-white/[0.06]">
                {filteredAppointments.map((apt) => {
                  let badgeBg = "bg-[#8D9B7F]/15 text-[#8D9B7F] border border-[#8D9B7F]/30";
                  let statusText = "Agendado";

                  if (apt.status === "confirmado") {
                    badgeBg = "bg-[#A8B29A]/15 text-[#A8B29A] border border-[#A8B29A]/30";
                    statusText = "Confirmado";
                  } else if (apt.status === "em_atendimento") {
                    badgeBg = "bg-white/10 text-white border border-white/20";
                    statusText = "Em Sala";
                  } else if (apt.status === "retorno_pendente") {
                    badgeBg = "bg-[#F7F5F0]/15 text-[#F7F5F0] border border-[#F7F5F0]/30";
                    statusText = "Retorno 15d";
                  } else if (apt.status === "concluido") {
                    badgeBg = "bg-[#333333] text-white border border-white/10";
                    statusText = "Concluído";
                  }

                  return (
                    <tr
                      key={apt.id}
                      className="hover:bg-[#fbfbfb] dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-3 font-semibold text-black dark:text-white whitespace-nowrap">
                        {apt.patientName}
                      </td>
                      <td className="px-4 py-3 text-[#767676] dark:text-[#a0a0a0]">
                        {apt.procedureName}
                      </td>
                      <td className="hidden sm:table-cell px-4 py-3 text-[#767676] dark:text-[#a0a0a0]">
                        {apt.type}
                      </td>
                      <td className="px-4 py-3 text-[#767676] dark:text-[#a0a0a0] whitespace-nowrap">
                        {apt.date} {apt.time ? `às ${apt.time}` : ""}
                      </td>
                      <td className="px-4 py-3 font-semibold text-black dark:text-white whitespace-nowrap">
                        {formatBRL(apt.value)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold",
                            badgeBg
                          )}
                        >
                          {statusText}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

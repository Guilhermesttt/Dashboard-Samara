"use client";

import React, { useState, useEffect } from "react";
import { MetricCard } from "@/components/dashboard/metric-card";
import { RevenueChart } from "@/components/dashboard/charts/revenue-chart";
import { PipelineOverview } from "@/components/dashboard/charts/pipeline-overview";
import { RecentDeals } from "@/components/dashboard/recent-deals";
import { TopPerformers } from "@/components/dashboard/top-performers";
import { DollarSign, Sparkles, Users, RotateCcw, LayoutDashboard } from "lucide-react";
import { Appointment } from "./appointments";
import { PatientRecord } from "./customer-profile-modal";
import { KineticHeading } from "@/components/motion";

export function OverviewSection() {
  const [patientCount, setPatientCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [returnRate, setReturnRate] = useState("100%");

  useEffect(() => {
    try {
      // 1. Pacientes Reais
      const rawPatients = localStorage.getItem("samara_real_patients");
      if (rawPatients) {
        const patients: PatientRecord[] = JSON.parse(rawPatients);
        setPatientCount(patients.length);
      }

      // 2. Agendamentos Reais
      const rawApts = localStorage.getItem("samara_real_appointments");
      if (rawApts) {
        const apts: Appointment[] = JSON.parse(rawApts);
        
        // Faturamento real dos atendimentos concluídos (ou confirmados se nenhum concluído)
        const concluidos = apts.filter((a) => a.status === "concluido");
        setCompletedCount(concluidos.length);

        const rev = concluidos.reduce((acc, curr) => acc + (curr.value || 0), 0);
        setTotalRevenue(rev);

        // Taxa de retorno
        const totalRetornos = apts.filter(
          (a) => a.type === "Retorno de 15 Dias" || a.status === "retorno_pendente"
        ).length;
        if (apts.length > 0 && totalRetornos > 0) {
          const rate = Math.round((totalRetornos / apts.length) * 100);
          setReturnRate(`${rate}%`);
        } else {
          setReturnRate(apts.length === 0 ? "100%" : "N/D");
        }
      }
    } catch (e) {}
  }, []);

  const formattedRevenue = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(totalRevenue);

  return (
    <div data-dashboard-section="overview" className="w-full min-w-0 max-w-full space-y-6 pb-24 md:pb-8">
      {/* Header — mesmo padrão das demais seções */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-[#767676] dark:text-[#a1a1aa] font-medium">
          <LayoutDashboard className="w-3.5 h-3.5 text-black dark:text-white" />
          <span>Painel da Clínica</span>
        </div>
        <KineticHeading
          text="Visão Geral"
          className="text-2xl sm:text-3xl font-bold text-black dark:text-white"
        />
        <p className="text-xs sm:text-sm text-[#6c6c6c] dark:text-[#a1a1aa] leading-relaxed">
          Faturamento, pacientes e fluxo de atendimentos da Dra. Sâmara.
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Faturamento do Mês"
          value={formattedRevenue}
          change={totalRevenue > 0 ? "Em andamento" : "Início do período"}
          changeType="positive"
          icon={DollarSign}
          delay={0}
        />
        <MetricCard
          title="Pacientes Cadastrados"
          value={patientCount.toString()}
          change={patientCount === 0 ? "Cadastre a 1ª cliente" : `${patientCount} ativas`}
          changeType="positive"
          icon={Users}
          delay={1}
        />
        <MetricCard
          title="Procedimentos Concluídos"
          value={completedCount.toString()}
          change={completedCount > 0 ? `${completedCount} finalizados` : "Aguardando"}
          changeType="positive"
          icon={Sparkles}
          delay={2}
        />
        <MetricCard
          title="Taxa de Retorno (15d)"
          value={returnRate}
          change="Acompanhamento"
          changeType="positive"
          icon={RotateCcw}
          delay={3}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <PipelineOverview />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <RecentDeals />
        <TopPerformers />
      </div>
    </div>
  );
}

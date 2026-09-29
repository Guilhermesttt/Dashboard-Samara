"use client";

import React, { useState, useEffect } from "react";
import { Appointment } from "../sections/appointments";
import { Users2 } from "lucide-react";

export function PipelineOverview() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [stagesData, setStagesData] = useState([
    { name: "Agendados / Espera", count: 0, percentage: 0, color: "bg-blue-600" },
    { name: "Confirmados", count: 0, percentage: 0, color: "bg-emerald-600" },
    { name: "Em Atendimento", count: 0, percentage: 0, color: "bg-purple-600" },
    { name: "Retorno 15 Dias", count: 0, percentage: 0, color: "bg-amber-600" },
    { name: "Concluído", count: 0, percentage: 0, color: "bg-neutral-800 dark:bg-neutral-200" },
  ]);
  const [totalAppointments, setTotalAppointments] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("samara_real_appointments");
      if (raw) {
        const apts: Appointment[] = JSON.parse(raw);
        const total = apts.length;
        setTotalAppointments(total);

        const agendados = apts.filter((a) => a.status === "agendado").length;
        const confirmados = apts.filter((a) => a.status === "confirmado").length;
        const emAtendimento = apts.filter((a) => a.status === "em_atendimento").length;
        const retornos = apts.filter(
          (a) => a.status === "retorno_pendente" || a.type === "Retorno de 15 Dias"
        ).length;
        const concluidos = apts.filter((a) => a.status === "concluido").length;

        const calcPct = (cnt: number) => (total > 0 ? Math.round((cnt / total) * 100) : 0);

        setStagesData([
          { name: "Agendados / Espera", count: agendados, percentage: calcPct(agendados), color: "bg-blue-600" },
          { name: "Retorno 15 Dias", count: retornos, percentage: calcPct(retornos), color: "bg-amber-600" },
          { name: "Confirmados", count: confirmados, percentage: calcPct(confirmados), color: "bg-emerald-600" },
          { name: "Em Atendimento", count: emAtendimento, percentage: calcPct(emAtendimento), color: "bg-purple-600" },
          { name: "Concluído", count: concluidos, percentage: calcPct(concluidos), color: "bg-neutral-800 dark:bg-neutral-200" },
        ]);
      }
    } catch (e) {}

    const timer = setTimeout(() => setIsLoaded(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-white dark:bg-[#121212] border border-border dark:border-white/[0.08] rounded-2xl p-5 h-[380px] shadow-sm flex flex-col justify-between">
      <div>
        <div className="mb-4">
          <h3 className="text-base font-semibold text-black dark:text-white">
            Fluxo de Atendimento
          </h3>
          <p className="text-xs text-[#767676] dark:text-[#a0a0a0] mt-0.5">
            Distribuição em tempo real dos agendamentos
          </p>
        </div>

        {totalAppointments === 0 ? (
          <div className="py-12 text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-2xl bg-[#f7f7f7] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.06] flex items-center justify-center text-[#8f8f8f] mb-3">
              <Users2 className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-black dark:text-white">
              Nenhum agendamento no pipeline
            </p>
            <p className="text-[11px] text-[#767676] dark:text-[#8f8f8f] max-w-xs mt-1">
              Assim que novos agendamentos forem adicionados na aba Agenda, as etapas de atendimento serão mostradas aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {stagesData.map((stage, index) => (
              <div key={stage.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-black dark:text-white">{stage.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#767676] dark:text-[#a0a0a0]">
                      {stage.count} {stage.count === 1 ? "paciente" : "pacientes"}
                    </span>
                    <span className="font-semibold text-black dark:text-white">
                      {stage.percentage}%
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-[#f4f4f4] dark:bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className={`h-full ${stage.color} rounded-full transition-all duration-1000 ease-out`}
                    style={{
                      width: isLoaded ? `${stage.percentage}%` : "0%",
                      transitionDelay: `${index * 120}ms`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-border dark:border-white/[0.08] flex items-center justify-between">
        <span className="text-xs text-[#767676] dark:text-[#a0a0a0]">Total no Fluxo</span>
        <span className="text-sm font-bold text-black dark:text-white">
          {totalAppointments} {totalAppointments === 1 ? "agendamento" : "agendamentos"}
        </span>
      </div>
    </div>
  );
}

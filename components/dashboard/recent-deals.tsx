"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Clock, CheckCircle2, RotateCcw, Sparkles, Calendar, Plus } from "lucide-react";
import { Appointment } from "./sections/appointments";
import { getStoredAppointments } from "@/lib/storage-keys";

const statusConfig = {
  concluido: {
    icon: CheckCircle2,
    color: "text-[#8D9B7F]",
    bg: "bg-[#8D9B7F]/15 border border-[#8D9B7F]/30",
    label: "Concluído",
  },
  em_atendimento: {
    icon: Sparkles,
    color: "text-[#FFFFFF]",
    bg: "bg-[#333333] border border-white/20",
    label: "Em Sala",
  },
  retorno_pendente: {
    icon: RotateCcw,
    color: "text-[#F7F5F0]",
    bg: "bg-[#F7F5F0]/15 border border-[#F7F5F0]/30",
    label: "Retorno 15d",
  },
  confirmado: {
    icon: Calendar,
    color: "text-[#A8B29A]",
    bg: "bg-[#A8B29A]/15 border border-[#A8B29A]/30",
    label: "Confirmado",
  },
  agendado: {
    icon: Clock,
    color: "text-[#8D9B7F]",
    bg: "bg-[#8D9B7F]/10 border border-[#8D9B7F]/25",
    label: "Agendado",
  },
};

export function RecentDeals() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const loadAppointments = () => {
    try {
      const apts = getStoredAppointments();
      setAppointments(apts);
    } catch (e) {
      setAppointments([]);
    }
  };

  useEffect(() => {
    loadAppointments();
    window.addEventListener("samara_appointments_updated", loadAppointments);
    window.addEventListener("storage", loadAppointments);
    return () => {
      window.removeEventListener("samara_appointments_updated", loadAppointments);
      window.removeEventListener("storage", loadAppointments);
    };
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val || 0);
  };

  const recent = appointments.slice(0, 5);

  return (
    <div className="bg-white dark:bg-[#232323] border border-border dark:border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_20px_rgba(0,0,0,0.4)]">
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-black dark:text-white">
            Atendimentos Recentes
          </h3>
          <p className="text-xs text-[#767676] dark:text-[#a0a0a0] mt-0.5">
            Procedimentos e consultas reais da clínica
          </p>
        </div>
      </div>

      {recent.length === 0 ? (
        <div className="py-8 text-center flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-2xl bg-[#f7f7f7] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.06] flex items-center justify-center text-[#8f8f8f] mb-3">
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-black dark:text-white">
            Nenhum atendimento registrado ainda
          </p>
          <p className="text-[11px] text-[#767676] dark:text-[#8f8f8f] max-w-xs mt-1">
            Os agendamentos cadastrados pela Dra. Sâmara aparecerão aqui em tempo real.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5 sm:space-y-2">
          {recent.map((item) => {
            const statusKey = item.status in statusConfig ? item.status : "agendado";
            const status = statusConfig[statusKey as keyof typeof statusConfig];
            const StatusIcon = status.icon;

            return (
              <div
                key={item.id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between p-2.5 sm:p-3 rounded-xl hover:bg-[#f7f7f7] dark:hover:bg-[#18181b] transition-all duration-150 gap-2 border border-black/[0.03] dark:border-white/[0.05] dark:hover:border-white/[0.1]"
              >
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-black text-white dark:bg-[#9ca889] dark:text-[#070707] flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
                    {item.patientName ? item.patientName.charAt(0).toUpperCase() : "P"}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-black dark:text-white">
                      {item.patientName}
                    </p>
                    <p className="text-[11px] text-[#767676] dark:text-[#a0a0a0]">
                      {item.procedureName} • {item.date} {item.time ? `às ${item.time}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 pl-10 sm:pl-0">
                  <span className="text-xs font-semibold text-black dark:text-white">
                    {formatCurrency(item.value)}
                  </span>
                  <div
                    className={cn(
                      "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0",
                      status.bg,
                      status.color
                    )}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {status.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

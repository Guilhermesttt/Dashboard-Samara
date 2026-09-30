"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, TrendingUp, Tag } from "lucide-react";
import { Appointment } from "./sections/appointments";
import { getStoredAppointments } from "@/lib/storage-keys";

export function TopPerformers() {
  const [topProcedures, setTopProcedures] = useState<
    { name: string; count: number; revenue: number; rank: number }[]
  >([]);

  const calculateTopProcedures = () => {
    try {
      const apts: Appointment[] = getStoredAppointments();
      const map = new Map<string, { count: number; revenue: number }>();
      apts.forEach((a) => {
        if (!a.procedureName) return;
        const current = map.get(a.procedureName) || { count: 0, revenue: 0 };
        current.count += 1;
        current.revenue += a.value || 0;
        map.set(a.procedureName, current);
      });

      const list = Array.from(map.entries())
        .map(([name, data]) => ({
          name,
          count: data.count,
          revenue: data.revenue,
          rank: 1,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map((item, index) => ({ ...item, rank: index + 1 }));

      setTopProcedures(list);
    } catch (e) {
      setTopProcedures([]);
    }
  };

  useEffect(() => {
    calculateTopProcedures();
    window.addEventListener("samara_appointments_updated", calculateTopProcedures);
    window.addEventListener("storage", calculateTopProcedures);
    return () => {
      window.removeEventListener("samara_appointments_updated", calculateTopProcedures);
      window.removeEventListener("storage", calculateTopProcedures);
    };
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val || 0);
  };

  return (
    <div className="bg-white dark:bg-[#232323] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_16px_rgba(0,0,0,0.4)]">
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-black dark:text-white">
            Procedimentos Mais Procurados
          </h3>
          <p className="text-xs text-[#767676] dark:text-[#8D9B7F] mt-0.5">
            Ranking real por procura e faturamento na clínica
          </p>
        </div>
        <div className="flex items-center gap-1 text-[#A8B29A]">
          <Sparkles className="w-4 h-4" />
        </div>
      </div>

      {topProcedures.length === 0 ? (
        <div className="py-8 text-center flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-2xl bg-[#f7f7f7] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.06] flex items-center justify-center text-[#8f8f8f] mb-3">
            <Tag className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-black dark:text-white">
            Nenhum procedimento registrado ainda
          </p>
          <p className="text-[11px] text-[#767676] dark:text-[#8D9B7F] max-w-xs mt-1">
            Conforme a Dra. Sâmara realizar novos atendimentos, o ranking dos mais procurados será calculado automaticamente.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5 sm:space-y-2">
          {topProcedures.map((item) => (
            <div
              key={item.name}
              className="group flex items-center justify-between p-2.5 sm:p-3 rounded-xl hover:bg-[#f7f7f7] dark:hover:bg-white/[0.04] transition-all duration-150 border border-black/[0.03] dark:border-white/[0.03]"
            >
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                    item.rank === 1
                      ? "bg-[#A8B29A] text-[#111111] shadow-sm"
                      : "bg-black text-white dark:bg-white/10 dark:text-white"
                  }`}
                >
                  {item.rank}
                </div>
                <div>
                  <p className="text-xs font-semibold text-black dark:text-white">{item.name}</p>
                  <p className="text-[11px] text-[#767676] dark:text-[#8D9B7F]">
                    {item.count} {item.count === 1 ? "sessão realizada" : "sessões realizadas"}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs font-semibold text-black dark:text-white">
                  {formatCurrency(item.revenue)}
                </p>
                <div className="flex items-center justify-end gap-1 text-[11px] text-[#A8B29A] font-medium">
                  <TrendingUp className="w-3 h-3" />
                  Em alta
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

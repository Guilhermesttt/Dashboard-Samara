"use client";

import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getStoredAppointments } from "@/lib/storage-keys";
import { Appointment } from "../sections/appointments";

const MONTH_NAMES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

function getAppointmentMonthIndex(apt: Appointment): number {
  const dateStr = apt.date || apt.completedAt || (apt as any).createdAt;
  if (!dateStr) return new Date().getMonth();

  const lower = dateStr.toLowerCase().trim();
  if (lower === "hoje" || lower === "amanhã" || lower === "ontem") {
    return new Date().getMonth();
  }

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const m = parseInt(dateStr.slice(5, 7), 10) - 1;
    if (m >= 0 && m <= 11) return m;
  }

  // DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(dateStr)) {
    const parts = dateStr.split("/");
    const m = parseInt(parts[1], 10) - 1;
    if (m >= 0 && m <= 11) return m;
  }

  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed.getMonth();
  }

  return new Date().getMonth();
}

export function RevenueChart() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [chartData, setChartData] = useState<
    { month: string; revenue: number; target: number }[]
  >([]);
  const [totalRevenue, setTotalRevenue] = useState(0);

  const calculateMonthlyData = () => {
    try {
      const apts: Appointment[] = getStoredAppointments();
      const monthlyTotals = new Array(12).fill(0);
      let sum = 0;

      apts.forEach((a) => {
        if (a.status === "concluido" || a.status === "confirmado") {
          const val = a.value || 0;
          const monthIdx = getAppointmentMonthIndex(a);
          monthlyTotals[monthIdx] += val;
          sum += val;
        }
      });

      setTotalRevenue(sum);

      const formatted = MONTH_NAMES.map((month, index) => {
        const rev = monthlyTotals[index];
        const target = sum > 0 ? (rev > 0 ? Math.round(rev * 1.15) : Math.round((sum / 12) * 1.1)) : 0;
        return {
          month,
          revenue: rev,
          target,
        };
      });

      setChartData(formatted);
    } catch (e) {
      setChartData(MONTH_NAMES.map((m) => ({ month: m, revenue: 0, target: 0 })));
    }
  };

  useEffect(() => {
    calculateMonthlyData();
    window.addEventListener("samara_appointments_updated", calculateMonthlyData);
    window.addEventListener("storage", calculateMonthlyData);

    const timer = setTimeout(() => setIsLoaded(true), 300);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("samara_appointments_updated", calculateMonthlyData);
      window.removeEventListener("storage", calculateMonthlyData);
    };
  }, []);

  const formattedAccumulated = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(totalRevenue);

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden bg-white dark:bg-[#232323] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-4 sm:p-5 h-[300px] sm:h-[360px] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_20px_rgba(0,0,0,0.4)] transition-colors flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 sm:mb-4">
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-black dark:text-white">
            Evolução do Consultório
          </h3>
          <p className="text-xs text-[#767676] dark:text-[#8D9B7F] mt-0.5">
            {totalRevenue > 0
              ? `${formattedAccumulated} acumulados nos atendimentos`
              : "Faturamento e metas calculados em tempo real"}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#A8B29A]" />
            <span className="text-black dark:text-white text-[11px] font-semibold">Faturamento</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#8D9B7F]" />
            <span className="text-[#767676] dark:text-[#8D9B7F] text-[11px] font-medium">Meta Clínica</span>
          </div>
        </div>
      </div>

      <div className={`relative h-[210px] min-w-0 sm:h-[260px] transition-opacity duration-500 ${isLoaded ? "opacity-100" : "opacity-0"}`}>
        {totalRevenue === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6 z-10 text-center px-4">
            <p className="text-xs font-semibold text-black dark:text-white">
              Nenhum faturamento registrado ainda
            </p>
            <p className="text-[11px] text-[#767676] dark:text-[#8D9B7F] max-w-sm mt-1">
              Conforme os atendimentos forem concluídos na Agenda, a curva de crescimento mensal será gerada automaticamente.
            </p>
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#A8B29A" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#A8B29A" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8D9B7F" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#8D9B7F" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#888888", fontSize: 11 }}
              dy={6}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              domain={[0, totalRevenue > 0 ? "auto" : 1000]}
              tick={{ fill: "#888888", fontSize: 10 }}
              tickFormatter={(value) => (value === 0 ? "R$0" : value >= 1000 ? `R$${Math.round(value / 1000)}k` : `R$${value}`)}
              dx={-2}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#232323",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                fontSize: "12px",
                color: "#fff",
                boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
              }}
              labelStyle={{ color: "#fff", fontWeight: 600 }}
              itemStyle={{ color: "#F7F5F0" }}
              formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, ""]}
            />
            <Area
              type="monotone"
              dataKey="target"
              stroke="#8D9B7F"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fill="url(#targetGradient)"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#A8B29A"
              strokeWidth={2.5}
              fill="url(#revenueGradient)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

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

const data = [
  { month: "Jan", revenue: 186000, target: 180000 },
  { month: "Feb", revenue: 205000, target: 190000 },
  { month: "Mar", revenue: 237000, target: 200000 },
  { month: "Apr", revenue: 273000, target: 220000 },
  { month: "May", revenue: 209000, target: 230000 },
  { month: "Jun", revenue: 314000, target: 250000 },
  { month: "Jul", revenue: 352000, target: 270000 },
  { month: "Aug", revenue: 389000, target: 290000 },
  { month: "Sep", revenue: 421000, target: 310000 },
  { month: "Oct", revenue: 458000, target: 330000 },
  { month: "Nov", revenue: 492000, target: 350000 },
  { month: "Dec", revenue: 547000, target: 380000 },
];

export function RevenueChart() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden bg-white dark:bg-[#121212] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-4 sm:p-5 h-[300px] sm:h-[360px] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-black dark:text-white">
            Evolução do Consultório
          </h3>
          <p className="text-xs text-[#767676] dark:text-[#a1a1aa] mt-0.5">
            Faturamento e metas mensais
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-[#767676] dark:text-[#a1a1aa] text-[11px] font-medium">Faturamento</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-[#767676] dark:text-[#a1a1aa] text-[11px] font-medium">Meta Clínica</span>
          </div>
        </div>
      </div>

      <div className={`h-[210px] min-w-0 sm:h-[260px] transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" vertical={false} />
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
              tick={{ fill: "#888888", fontSize: 10 }}
              tickFormatter={(value) => `R$${Math.round(value / 1000)}k`}
              dx={-2}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1c1c1e",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                fontSize: "12px",
                color: "#fff",
              }}
              labelStyle={{ color: "#fff", fontWeight: 600 }}
              itemStyle={{ color: "#e5e5e5" }}
              formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, ""]}
            />
            <Area
              type="monotone"
              dataKey="target"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#targetGradient)"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#revenueGradient)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

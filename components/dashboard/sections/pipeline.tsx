"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Plus, MoreHorizontal, Clock, DollarSign, User, Building2 } from "lucide-react";

interface Deal {
  id: string;
  company: string;
  value: number;
  rep: string;
  daysInStage: number;
  probability: number;
}

interface Stage {
  id: string;
  name: string;
  deals: Deal[];
  total: number;
}

const initialStages: Stage[] = [
  {
    id: "lead",
    name: "Lead",
    total: 892000,
    deals: [
      { id: "1", company: "Nexus Technologies", value: 45000, rep: "Sarah C.", daysInStage: 3, probability: 20 },
      { id: "2", company: "Bright Systems", value: 78000, rep: "Mike J.", daysInStage: 5, probability: 25 },
      { id: "3", company: "CoreLogic Inc", value: 32000, rep: "Emily D.", daysInStage: 1, probability: 15 },
    ],
  },
  {
    id: "qualified",
    name: "Qualificado",
    total: 556000,
    deals: [
      { id: "4", company: "DataPrime Ltd", value: 125000, rep: "James W.", daysInStage: 7, probability: 40 },
      { id: "5", company: "CloudNine Corp", value: 89000, rep: "Sarah C.", daysInStage: 4, probability: 45 },
    ],
  },
  {
    id: "proposal",
    name: "Proposta",
    total: 357000,
    deals: [
      { id: "6", company: "TechForward", value: 167000, rep: "Mike J.", daysInStage: 12, probability: 60 },
      { id: "7", company: "Innovate Plus", value: 95000, rep: "Lisa P.", daysInStage: 8, probability: 65 },
      { id: "8", company: "SmartGrid Co", value: 54000, rep: "Emily D.", daysInStage: 6, probability: 55 },
    ],
  },
  {
    id: "negotiation",
    name: "Negociação",
    total: 179000,
    deals: [
      { id: "9", company: "Enterprise Max", value: 245000, rep: "Sarah C.", daysInStage: 15, probability: 80 },
      { id: "10", company: "GrowthLab", value: 112000, rep: "James W.", daysInStage: 10, probability: 75 },
    ],
  },
];

function DealCard({ deal, index }: { deal: Deal; index: number }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="group bg-white border border-border rounded-xl p-4 cursor-grab active:cursor-grabbing hover:border-black/30 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 shadow-sm"
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#f5f5f5] flex items-center justify-center">
            <Building2 className="w-4 h-4 text-[#8f8f8f]" />
          </div>
          <span className="text-sm font-medium text-black truncate max-w-[120px]">{deal.company}</span>
        </div>
        <button
          className={cn(
            "w-6 h-6 flex items-center justify-center rounded text-[#8f8f8f] hover:text-black hover:bg-[#f5f5f5] transition-all duration-200",
            isHovered ? "opacity-100" : "opacity-0"
          )}
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 text-sm text-black font-semibold mb-3">
        R$ {deal.value.toLocaleString("pt-BR")}
      </div>

      <div className="flex items-center justify-between text-xs text-[#767676]">
        <div className="flex items-center gap-1">
          <User className="w-3 h-3 text-[#8f8f8f]" />
          {deal.rep}
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-[#8f8f8f]" />
          {deal.daysInStage}d
        </div>
      </div>

      {/* Probability bar */}
      <div className="mt-3 pt-3 border-t border-border">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-[#767676]">Probabilidade</span>
          <span className="text-black font-medium">{deal.probability}%</span>
        </div>
        <div className="h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
          <div
            className="h-full bg-black rounded-full transition-all duration-500"
            style={{ width: `${deal.probability}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function PipelineSection() {
  const [stages] = useState(initialStages);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-sm text-[#767676]">Gerencie e acompanhe seu funil de vendas em tempo real</p>
        </div>
        <button className="flex items-center justify-center gap-2 h-11 sm:h-auto px-4 sm:py-2 bg-black text-white rounded-xl text-xs font-medium hover:bg-[#242424] transition-colors duration-200 shadow-sm cursor-pointer w-full sm:w-auto active:scale-95">
          <Plus className="w-4 h-4" />
          Novo Negócio
        </button>
      </div>

      {/* Pipeline board - horizontal scroll on mobile */}
      <div className="overflow-x-auto -mx-0.5 pb-2">
        <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 min-w-[640px] sm:min-w-0">
          {stages.map((stage, stageIndex) => (
            <div
              key={stage.id}
              className="flex flex-col bg-[#fafafa] rounded-2xl border border-border p-3 min-h-[500px] w-[260px] sm:w-auto shrink-0 sm:shrink"
            >
              {/* Stage header */}
              <div className="flex items-center justify-between p-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-black uppercase tracking-wider">{stage.name}</span>
                  <span className="px-2 py-0.5 rounded-full bg-white border border-border text-[11px] font-medium text-[#767676]">
                    {stage.deals.length}
                  </span>
                </div>
                <span className="text-xs font-medium text-[#767676]">
                  R$ {(stage.total / 1000).toFixed(0)}k
                </span>
              </div>

              {/* Deals list */}
              <div className="flex-1 space-y-3 overflow-y-auto">
                {stage.deals.map((deal, dealIndex) => (
                  <DealCard key={deal.id} deal={deal} index={stageIndex * 3 + dealIndex} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

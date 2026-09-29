"use client";

import React, { useState, useMemo } from "react";
import {
  Sparkles,
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Tag,
  DollarSign,
  FileText,
  X,
  MoreHorizontal,
  ChevronDown,
  Layers,
  Info,
} from "lucide-react";
import { ModalPortal } from "@/components/ui/modal-portal";
import { cn } from "@/lib/utils";
import { SlidingTabs, AnimatedNumber, KineticHeading, BorderBeam } from "@/components/motion";

export interface ProcedureItem {
  id: string;
  name: string;
  category: "Facial" | "Corporal" | "Facial/Corporal";
  price: number;
  observation?: string;
  active: boolean;
}

const initialProcedures: ProcedureItem[] = [
  {
    id: "proc-1",
    name: "Botox",
    category: "Facial",
    price: 900,
    observation: "Aplicação preventiva ou reparadora em terço superior",
    active: true,
  },
  {
    id: "proc-2",
    name: "Preenchimento Labial",
    category: "Facial",
    price: 1100,
    observation: "Ácido hialurônico para contorno e volumização labial",
    active: true,
  },
  {
    id: "proc-3",
    name: "Rinomodelação",
    category: "Facial",
    price: 1300,
    observation: "Harmonização do dorso e ponta nasal sem cirurgia",
    active: true,
  },
  {
    id: "proc-4",
    name: "Preenchedor em outras áreas",
    category: "Facial",
    price: 900,
    observation: "valor por ml",
    active: true,
  },
  {
    id: "proc-5",
    name: "Microagulhamento",
    category: "Facial",
    price: 400,
    observation: "Indução percutânea de colágeno com drug delivery",
    active: true,
  },
  {
    id: "proc-6",
    name: "Bioestimulador de Colágeno",
    category: "Facial/Corporal",
    price: 1800,
    observation: "Radiesse / Sculptra / Elleva para firmeza tecidual",
    active: true,
  },
  {
    id: "proc-7",
    name: "Fios de PDO",
    category: "Facial",
    price: 800,
    observation: "Fios lisos de estímulo ou tração para efeito lifting",
    active: true,
  },
];

export function ProceduresSection() {
  const [procedures, setProcedures] = useState<ProcedureItem[]>(initialProcedures);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<ProcedureItem | null>(null);

  // Form states (Add/Edit)
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState<"Facial" | "Corporal" | "Facial/Corporal">("Facial");
  const [formPrice, setFormPrice] = useState<string>("");
  const [formObservation, setFormObservation] = useState("");

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  // Open Edit Modal
  const handleOpenEdit = (proc: ProcedureItem) => {
    setEditingProcedure(proc);
    setFormName(proc.name);
    setFormCategory(proc.category);
    setFormPrice(proc.price.toString());
    setFormObservation(proc.observation || "");
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingProcedure(null);
    setFormName("");
    setFormCategory("Facial");
    setFormPrice("");
    setFormObservation("");
    setIsAddModalOpen(true);
  };

  // Save Add or Edit
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPrice = parseFloat(
      formPrice.replace(/[^\d.,]/g, "").replace(",", ".")
    ) || 0;

    if (editingProcedure) {
      setProcedures((prev) =>
        prev.map((p) =>
          p.id === editingProcedure.id
            ? {
                ...p,
                name: formName.trim() || p.name,
                category: formCategory,
                price: cleanPrice,
                observation: formObservation.trim(),
              }
            : p
        )
      );
      setEditingProcedure(null);
    } else {
      const newProc: ProcedureItem = {
        id: `proc-${Date.now()}`,
        name: formName.trim(),
        category: formCategory,
        price: cleanPrice,
        observation: formObservation.trim(),
        active: true,
      };
      setProcedures((prev) => [newProc, ...prev]);
      setIsAddModalOpen(false);
    }
  };

  const handleDeleteProcedure = (id: string) => {
    if (confirm("Deseja realmente remover este procedimento do catálogo?")) {
      setProcedures((prev) => prev.filter((p) => p.id !== id));
      setSelectedRows((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  // Filter & Sort
  const filteredProcedures = useMemo(() => {
    return procedures
      .filter((item) => {
        const matchesCategory =
          selectedCategory === "all" ||
          (selectedCategory === "Facial" && (item.category === "Facial" || item.category === "Facial/Corporal")) ||
          (selectedCategory === "Corporal" && (item.category === "Corporal" || item.category === "Facial/Corporal")) ||
          item.category === selectedCategory;

        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          (item.observation && item.observation.toLowerCase().includes(q));

        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        return sortAsc ? a.price - b.price : b.price - a.price;
      });
  }, [procedures, searchQuery, selectedCategory, sortAsc]);

  const toggleSelectRow = (id: string) => {
    setSelectedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const allSelected =
    filteredProcedures.length > 0 &&
    filteredProcedures.every((p) => selectedRows[p.id]);

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedRows({});
    } else {
      const next: Record<string, boolean> = {};
      filteredProcedures.forEach((p) => {
        next[p.id] = true;
      });
      setSelectedRows(next);
    }
  };

  const categoryBadgeColor = (cat: ProcedureItem["category"]) => {
    switch (cat) {
      case "Facial":
        return "bg-black/[0.04] text-black border-black/[0.08]";
      case "Corporal":
        return "bg-emerald-50 text-emerald-800 border-emerald-200/60";
      case "Facial/Corporal":
        return "bg-purple-50 text-purple-800 border-purple-200/60";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6 select-none p8-page-enter pb-24 sm:pb-8">
      {/* 1. Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-[#767676] dark:text-[#a1a1aa] font-medium">
          <Sparkles className="w-3.5 h-3.5 text-black dark:text-white" />
          <span>Tabela Clínica de Serviços</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <KineticHeading
              text="Procedimentos & Tratamentos"
              className="text-xl sm:text-3xl font-bold text-black dark:text-white"
            />
            <p className="text-xs sm:text-sm text-[#6c6c6c] dark:text-[#a1a1aa]">
              Catálogo de serviços estéticos e precificação da clínica.
            </p>
          </div>
          <BorderBeam className="self-start sm:self-auto">
          <button
            onClick={handleOpenAdd}
            className="h-11 sm:h-9 px-4 rounded-xl bg-black dark:bg-white hover:bg-[#262626] dark:hover:bg-[#ededed] active:scale-[0.98] text-white dark:text-black text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all duration-150 cursor-pointer min-h-[44px] sm:min-h-0 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Procedimento</span>
          </button>
          </BorderBeam>
        </div>
      </div>

      {/* 2. Metrics Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        <div className="bg-white dark:bg-[#121212] p-3 sm:p-4 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#767676] dark:text-[#a1a1aa] font-medium">Procedimentos</span>
            <span className="w-7 h-7 rounded-lg bg-[#f6f6f6] dark:bg-[#1c1c1e] flex items-center justify-center text-black dark:text-white">
              <Layers className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-black dark:text-white mt-1.5 sm:mt-2"><AnimatedNumber value={procedures.length} ariaLabel={`${procedures.length} procedimentos`} /></div>
          <span className="text-[11px] text-[#8f8f8f] dark:text-[#a1a1aa] mt-0.5 block truncate">Ativos no catálogo</span>
        </div>

        <div className="bg-white dark:bg-[#121212] p-3 sm:p-4 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#767676] dark:text-[#a1a1aa] font-medium">Faciais</span>
            <span className="w-7 h-7 rounded-lg bg-[#f6f6f6] dark:bg-[#1c1c1e] flex items-center justify-center text-black dark:text-white">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-black dark:text-white mt-1.5 sm:mt-2">
            <AnimatedNumber value={procedures.filter((p) => p.category === "Facial" || p.category === "Facial/Corporal").length} ariaLabel="Procedimentos faciais" />
          </div>
          <span className="text-[11px] text-[#8f8f8f] dark:text-[#a1a1aa] mt-0.5 block truncate">Harmonização facial</span>
        </div>

        <div className="bg-white dark:bg-[#121212] p-3 sm:p-4 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#767676] dark:text-[#a1a1aa] font-medium">Ticket Médio</span>
            <span className="w-7 h-7 rounded-lg bg-[#f6f6f6] dark:bg-[#1c1c1e] flex items-center justify-center text-black dark:text-white">
              <DollarSign className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-black dark:text-white mt-1.5 sm:mt-2 truncate">
            {formatBRL(
              procedures.reduce((acc, p) => acc + p.price, 0) / (procedures.length || 1)
            )}
          </div>
          <span className="text-[11px] text-[#8f8f8f] dark:text-[#a1a1aa] mt-0.5 block truncate">Média por sessão</span>
        </div>

        <div className="bg-white dark:bg-[#121212] p-3 sm:p-4 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#767676] dark:text-[#a1a1aa] font-medium">Destaque</span>
            <span className="w-7 h-7 rounded-lg bg-[#f6f6f6] dark:bg-[#1c1c1e] flex items-center justify-center text-black dark:text-white">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-base sm:text-lg font-bold text-black dark:text-white mt-1.5 sm:mt-2 truncate">Botox & Preench.</div>
          <span className="text-[11px] text-[#8f8f8f] dark:text-[#a1a1aa] mt-0.5 block truncate">Alta demanda</span>
        </div>
      </div>

      {/* 3. Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
        {/* Category Tabs — SlidingTabs (transitions.dev) */}
        <div className="w-full sm:w-auto overflow-x-auto scrollbar-none scroll-smooth">
          <SlidingTabs
            ariaLabel="Filtrar procedimentos por categoria"
            value={selectedCategory}
            onChange={setSelectedCategory}
            tabs={[
              { id: "all", label: `Todos (${procedures.length})` },
              {
                id: "Facial",
                label: `Facial (${procedures.filter((p) => p.category === "Facial" || p.category === "Facial/Corporal").length})`,
              },
              {
                id: "Corporal",
                label: `Corporal (${procedures.filter((p) => p.category === "Corporal" || p.category === "Facial/Corporal").length})`,
              },
            ]}
          />
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8f8f8f] pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar procedimento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 sm:h-9 pl-9 pr-3 w-full text-base sm:text-xs bg-[#f4f4f4] dark:bg-[#1c1c1e] hover:bg-[#ededed] dark:hover:bg-[#252528] focus:bg-white dark:focus:bg-[#141414] rounded-xl border border-transparent focus:border-black/20 dark:focus:border-white/20 outline-none transition-all placeholder:text-[#8f8f8f] text-black dark:text-white"
            />
          </div>

          {/* Sort Button */}
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="h-11 sm:h-9 px-3 rounded-xl bg-[#f4f4f4] dark:bg-[#1c1c1e] hover:bg-[#ededed] dark:hover:bg-[#252528] text-xs font-medium text-[#767676] dark:text-[#a1a1aa] hover:text-black dark:hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 active:scale-95 min-w-[44px] sm:min-w-0 justify-center"
            title={sortAsc ? "Menor para maior valor" : "Maior para menor valor"}
          >
            <ArrowUpDown className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            <span className="hidden md:inline">{sortAsc ? "Menor Valor" : "Maior Valor"}</span>
          </button>

          {/* Reset Filters */}
          {(searchQuery || selectedCategory !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="h-11 sm:h-9 px-3 rounded-xl bg-[#f4f4f4] dark:bg-[#1c1c1e] hover:bg-[#ededed] text-xs font-medium text-[#767676] dark:text-[#a1a1aa] hover:text-black dark:hover:text-white flex items-center gap-1 transition-colors cursor-pointer shrink-0 active:scale-95"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Limpar</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Mobile Cards View (Visible on small screens) */}
      <div className="sm:hidden space-y-3">
        {filteredProcedures.map((proc) => {
          const isSelected = !!selectedRows[proc.id];
          return (
            <div
              key={proc.id}
              className={cn(
                "bg-white dark:bg-[#121212] border rounded-2xl p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] space-y-3 transition-all",
                isSelected
                  ? "border-black dark:border-white ring-1 ring-black dark:ring-white"
                  : "border-black/[0.08] dark:border-white/[0.08]"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#f5f5f7] dark:bg-[#1c1c1e] flex items-center justify-center text-black dark:text-white shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-black dark:text-white">{proc.name}</h4>
                    <span className="text-[11px] text-[#8f8f8f] dark:text-[#a1a1aa]">Cód: {proc.id.toUpperCase()}</span>
                  </div>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                    categoryBadgeColor(proc.category)
                  )}
                >
                  {proc.category}
                </span>
              </div>

              {proc.observation && (
                <p className="text-xs text-[#6c6c6c] dark:text-[#a1a1aa] leading-relaxed">
                  {proc.observation}
                </p>
              )}

              <div className="pt-2.5 border-t border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#8f8f8f] dark:text-[#a1a1aa] block">Valor da Sessão</span>
                  <span className="text-base font-bold text-black dark:text-white">
                    {formatBRL(proc.price)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(proc)}
                    className="h-8 px-2.5 rounded-lg bg-[#f5f5f5] dark:bg-[#1c1c1e] hover:bg-[#ebebeb] dark:hover:bg-[#2c2c2e] text-xs font-semibold text-black dark:text-white flex items-center gap-1 transition-colors cursor-pointer active:scale-95"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => handleDeleteProcedure(proc.id)}
                    className="w-8 h-8 rounded-lg bg-[#f5f5f5] dark:bg-[#1c1c1e] hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[#8f8f8f] hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                    title="Excluir procedimento"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Desktop Table (Hidden on small screens) */}
      <div className="hidden sm:block w-full bg-white dark:bg-[#121212] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl overflow-hidden shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            {/* Table Header */}
            <thead>
              <tr className="border-b border-black/[0.06] dark:border-white/[0.06] bg-[#fafafa]/80 dark:bg-[#18181b]/80 text-[#767676] dark:text-[#a1a1aa] font-medium">
                <th className="py-3.5 px-4 w-10 text-center">
                  <div
                    onClick={toggleSelectAll}
                    data-checked={allSelected}
                    className="w-4 h-4 rounded border border-black/30 dark:border-white/30 flex items-center justify-center cursor-pointer transition-colors"
                    style={{
                      backgroundColor: allSelected ? "#000" : "transparent",
                    }}
                  >
                    {allSelected && (
                      <svg className="w-2.5 h-2.5 text-white stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                </th>
                <th className="py-3.5 px-4 font-semibold text-[#0d0d0d] dark:text-white whitespace-nowrap">
                  Procedimento
                </th>
                <th className="py-3.5 px-4 font-semibold text-[#0d0d0d] dark:text-white whitespace-nowrap">
                  Categoria
                </th>
                <th className="py-3.5 px-4 font-semibold text-[#0d0d0d] dark:text-white whitespace-nowrap">
                  Valor (R$)
                </th>
                <th className="py-3.5 px-4 font-semibold text-[#0d0d0d] dark:text-white whitespace-nowrap">
                  Observações Técnicas
                </th>
                <th className="py-3.5 px-4 font-semibold text-[#0d0d0d] dark:text-white text-right whitespace-nowrap">
                  Ações
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
              {filteredProcedures.map((proc) => {
                const isSelected = !!selectedRows[proc.id];

                return (
                  <tr
                    key={proc.id}
                    className={`transition-colors duration-100 group cursor-pointer ${
                      isSelected ? "bg-[#f5f8ff]" : "hover:bg-[#fbfbfb]"
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3.5 px-4 text-center">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectRow(proc.id);
                        }}
                        className="w-4 h-4 rounded border border-black/30 flex items-center justify-center cursor-pointer transition-colors"
                        style={{
                          backgroundColor: isSelected ? "#000" : "transparent",
                        }}
                      >
                        {isSelected && (
                          <svg className="w-2.5 h-2.5 text-white stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    </td>

                    {/* Procedure Name */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#f4f4f4] flex items-center justify-center text-black font-semibold shrink-0 border border-black/[0.04]">
                          <Sparkles className="w-4 h-4 text-black" />
                        </div>
                        <div>
                          <div className="font-semibold text-black text-sm">{proc.name}</div>
                          <div className="text-[11px] text-[#8f8f8f]">Código: {proc.id.toUpperCase()}</div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border ${categoryBadgeColor(
                          proc.category
                        )}`}
                      >
                        <Tag className="w-3 h-3 opacity-60" />
                        {proc.category}
                      </span>
                    </td>

                    {/* Value */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-black tracking-tight">
                          {formatBRL(proc.price)}
                        </span>
                        {proc.observation && proc.observation.toLowerCase().includes("por ml") && (
                          <span className="text-[10px] text-[#767676] bg-[#f0f0f0] px-1.5 py-0.5 rounded">
                            / ml
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Observation */}
                    <td className="py-3.5 px-4 text-[#6c6c6c]">
                      {proc.observation ? (
                        <div className="flex items-center gap-1.5 text-xs text-[#525252]">
                          <Info className="w-3.5 h-3.5 text-[#8f8f8f] shrink-0" />
                          <span className="truncate max-w-[280px]">{proc.observation}</span>
                        </div>
                      ) : (
                        <span className="text-[#a3a3a3] italic">Nenhuma observação</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(proc);
                          }}
                          className="h-8 px-2.5 rounded-lg bg-[#f4f4f4] hover:bg-black hover:text-white text-xs font-medium text-black flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Editar valor ou informações"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProcedure(proc.id);
                          }}
                          className="w-8 h-8 rounded-lg bg-[#f4f4f4] hover:bg-rose-50 hover:text-rose-600 text-[#8f8f8f] flex items-center justify-center transition-colors cursor-pointer"
                          title="Excluir procedimento"
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

        {/* Empty State */}
        {filteredProcedures.length === 0 && (
          <div className="py-14 text-center space-y-2">
            <Sparkles className="w-8 h-8 text-[#8f8f8f] mx-auto opacity-50" />
            <p className="text-sm font-medium text-black">Nenhum procedimento encontrado</p>
            <p className="text-xs text-[#767676]">Tente buscar por outro termo ou limpe os filtros.</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-black/[0.06] bg-[#fafafa]/50 text-xs text-[#767676]">
          <span>
            Mostrando <strong className="text-black font-semibold">{filteredProcedures.length}</strong> de{" "}
            <strong className="text-black font-semibold">{procedures.length}</strong> procedimentos
          </span>
          <div className="flex items-center gap-2">
            <button className="px-2.5 py-1 rounded-md bg-white border border-black/[0.08] hover:bg-[#f5f5f5] text-black transition-colors cursor-pointer">
              Anterior
            </button>
            <span className="font-medium text-black px-2">1</span>
            <button className="px-2.5 py-1 rounded-md bg-white border border-black/[0.08] hover:bg-[#f5f5f5] text-black transition-colors cursor-pointer">
              Próximo
            </button>
          </div>
        </div>
      </div>

      {/* 5. Modal: Adicionar / Editar Procedimento */}
      <ModalPortal isOpen={isAddModalOpen || !!editingProcedure}>
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200 select-none"
          style={{
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
          onClick={() => {
            setIsAddModalOpen(false);
            setEditingProcedure(null);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[24px] border border-black/[0.08] shadow-[0_24px_48px_-16px_rgba(0,0,0,0.25)] w-full max-w-[500px] p-6 space-y-5 animate-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-4">
              <div>
                <h3 className="text-lg font-bold text-black tracking-tight">
                  {editingProcedure ? "Editar Procedimento" : "Novo Procedimento"}
                </h3>
                <p className="text-xs text-[#767676]">
                  {editingProcedure
                    ? "Atualize o valor e as regras deste procedimento estético."
                    : "Cadastre um novo serviço para o catálogo da clínica."}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingProcedure(null);
                }}
                className="w-8 h-8 rounded-full bg-[#f4f4f4] hover:bg-[#ebebeb] flex items-center justify-center text-[#8f8f8f] hover:text-black transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* Nome do Procedimento */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-black">Nome do Procedimento *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Bioestimulador de Colágeno"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-[#f6f6f6] border border-transparent focus:border-black text-xs text-black outline-none transition-all placeholder:text-[#8f8f8f]"
                />
              </div>

              {/* Categoria */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-black">Categoria *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Facial", "Corporal", "Facial/Corporal"] as const).map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setFormCategory(cat)}
                      className={`h-9 px-3 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                        formCategory === cat
                          ? "bg-black text-white border-black font-semibold shadow-sm"
                          : "bg-[#f6f6f6] text-[#767676] border-transparent hover:text-black hover:bg-[#eee]"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Valor (R$) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-black">Valor (R$) *</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs font-semibold text-[#8f8f8f]">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="900,00"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full h-10 pl-10 pr-3.5 rounded-xl bg-[#f6f6f6] border border-transparent focus:border-black text-xs font-semibold text-black outline-none transition-all placeholder:text-[#8f8f8f]"
                  />
                </div>
              </div>

              {/* Observação */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-black">
                  Observações Técnicas <span className="text-[#8f8f8f] font-normal">(Opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: valor por ml / cobrado por sessão"
                  value={formObservation}
                  onChange={(e) => setFormObservation(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-[#f6f6f6] border border-transparent focus:border-black text-xs text-black outline-none transition-all placeholder:text-[#8f8f8f]"
                />
                <p className="text-[11px] text-[#8f8f8f]">
                  Ex: "cobrado por ml", "recomendado 3 sessões", etc.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingProcedure(null);
                  }}
                  className="h-10 px-4 rounded-xl text-xs font-medium text-[#767676] hover:text-black hover:bg-[#f4f4f4] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 rounded-xl bg-black hover:bg-[#262626] text-white text-xs font-semibold shadow-sm transition-all duration-150 active:scale-[0.98] cursor-pointer"
                >
                  {editingProcedure ? "Salvar Alterações" : "Cadastrar Procedimento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </ModalPortal>
    </div>
  );
}

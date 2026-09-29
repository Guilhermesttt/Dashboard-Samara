"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Lock,
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  Building2,
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  Briefcase,
  Hash,
  AtSign,
  User,
  Calendar,
  GraduationCap,
  MoreHorizontal,
  LayoutGrid,
  Table as TableIcon,
  X,
  ChevronDown,
} from "lucide-react";
import { ModalPortal } from "@/components/ui/modal-portal";

interface DealItem {
  id: string;
  code: string;
  department: string;
  departmentColor: string;
  email: string;
  status: "active" | "inactive" | "pending";
  yearsOrValue: string;
  firstName: string;
  lastName: string;
  startDate: string;
  category: string;
}

const initialDeals: DealItem[] = [
  {
    id: "1",
    code: "NEG001",
    department: "Financeiro",
    departmentColor: "#10b981",
    email: "alfred.branco@samara.com.br",
    status: "active",
    yearsOrValue: "R$ 125.000",
    firstName: "Alfredo",
    lastName: "Branco",
    startDate: "24 Out, 2024",
    category: "Enterprise",
  },
  {
    id: "2",
    code: "NEG002",
    department: "RH",
    departmentColor: "#f59e0b",
    email: "alexandre.re@samara.com.br",
    status: "active",
    yearsOrValue: "R$ 89.500",
    firstName: "Alexandre",
    lastName: "Reis",
    startDate: "15 Jan, 2025",
    category: "SaaS",
  },
  {
    id: "3",
    code: "NEG003",
    department: "Financeiro",
    departmentColor: "#10b981",
    email: "bernardo.cole@samara.com.br",
    status: "active",
    yearsOrValue: "R$ 245.000",
    firstName: "Bernardo",
    lastName: "Cole",
    startDate: "12 Jan, 2025",
    category: "Enterprise",
  },
  {
    id: "4",
    code: "NEG004",
    department: "Marketing",
    departmentColor: "#8b5cf6",
    email: "clara.hart@samara.com.br",
    status: "active",
    yearsOrValue: "R$ 67.800",
    firstName: "Clara",
    lastName: "Hart",
    startDate: "03 Mai, 2025",
    category: "Expansão",
  },
  {
    id: "5",
    code: "NEG005",
    department: "RH",
    departmentColor: "#f59e0b",
    email: "davi.ross@samara.com.br",
    status: "active",
    yearsOrValue: "R$ 178.000",
    firstName: "Davi",
    lastName: "Ross",
    startDate: "16 Jun, 2025",
    category: "B2B",
  },
  {
    id: "6",
    code: "NEG006",
    department: "Marketing",
    departmentColor: "#8b5cf6",
    email: "emma.lane@samara.com.br",
    status: "active",
    yearsOrValue: "R$ 156.000",
    firstName: "Emma",
    lastName: "Lane",
    startDate: "07 Jul, 2025",
    category: "Enterprise",
  },
  {
    id: "7",
    code: "NEG007",
    department: "Vendas",
    departmentColor: "#0ea5e9",
    email: "felipe.gray@samara.com.br",
    status: "active",
    yearsOrValue: "R$ 203.000",
    firstName: "Felipe",
    lastName: "Gray",
    startDate: "19 Jul, 2025",
    category: "Expansão",
  },
  {
    id: "8",
    code: "NEG008",
    department: "Vendas",
    departmentColor: "#0ea5e9",
    email: "graca.kent@samara.com.br",
    status: "inactive",
    yearsOrValue: "R$ 94.500",
    firstName: "Graça",
    lastName: "Kent",
    startDate: "12 Set, 2025",
    category: "SaaS",
  },
  {
    id: "9",
    code: "NEG009",
    department: "Engenharia",
    departmentColor: "#6366f1",
    email: "jack.nyberg@samara.com.br",
    status: "active",
    yearsOrValue: "R$ 310.000",
    firstName: "Jack",
    lastName: "Nyberg",
    startDate: "03 Dez, 2025",
    category: "Custom",
  },
  {
    id: "10",
    code: "NEG010",
    department: "Engenharia",
    departmentColor: "#6366f1",
    email: "livia.bell@samara.com.br",
    status: "active",
    yearsOrValue: "R$ 142.000",
    firstName: "Lívia",
    lastName: "Bell",
    startDate: "18 Mar, 2026",
    category: "SaaS",
  },
  {
    id: "11",
    code: "NEG011",
    department: "RH",
    departmentColor: "#f59e0b",
    email: "nora.page@samara.com.br",
    status: "inactive",
    yearsOrValue: "R$ 55.000",
    firstName: "Nora",
    lastName: "Page",
    startDate: "19 Jun, 2026",
    category: "B2B",
  },
  {
    id: "12",
    code: "NEG012",
    department: "Engenharia",
    departmentColor: "#6366f1",
    email: "samuel.holt@samara.com.br",
    status: "inactive",
    yearsOrValue: "R$ 88.000",
    firstName: "Samuel",
    lastName: "Holt",
    startDate: "02 Set, 2026",
    category: "Enterprise",
  },
  {
    id: "13",
    code: "NEG013",
    department: "Financeiro",
    departmentColor: "#10b981",
    email: "brian.cranston@samara.com.br",
    status: "active",
    yearsOrValue: "R$ 420.000",
    firstName: "Brian",
    lastName: "Cranston",
    startDate: "03 Nov, 2026",
    category: "Enterprise",
  },
  {
    id: "14",
    code: "NEG014",
    department: "Marketing",
    departmentColor: "#8b5cf6",
    email: "geraldo.james@samara.com.br",
    status: "active",
    yearsOrValue: "R$ 115.000",
    firstName: "Geraldo",
    lastName: "James",
    startDate: "18 Jan, 2027",
    category: "B2B",
  },
];

type TabType = "all" | "Financeiro" | "RH" | "Marketing" | "Vendas" | "Engenharia";

export function DealsSection() {
  const [deals, setDeals] = useState<DealItem[]>(initialDeals);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [sortAsc, setSortAsc] = useState(true);

  // New deal form states
  const [newDepartment, setNewDepartment] = useState("Financeiro");
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newCategory, setNewCategory] = useState("Enterprise");

  // Tab indicator sliding animation (transitions.dev P16)
  const tabsListRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });

  const tabItems: { id: TabType; label: string }[] = [
    { id: "all", label: "Negócios" },
    { id: "Financeiro", label: "Financeiro" },
    { id: "RH", label: "RH" },
    { id: "Marketing", label: "Marketing" },
    { id: "Vendas", label: "Vendas" },
    { id: "Engenharia", label: "Engenharia" },
  ];

  // Update sliding pill indicator position
  useEffect(() => {
    if (!tabsListRef.current) return;
    const activeBtn = tabsListRef.current.querySelector(`[data-tab-id="${activeTab}"]`) as HTMLElement;
    if (activeBtn) {
      setIndicatorStyle({
        left: activeBtn.offsetLeft,
        width: activeBtn.offsetWidth,
      });
    }
  }, [activeTab]);

  // Filter deals
  const filteredDeals = useMemo(() => {
    return deals
      .filter((deal) => {
        const matchesTab = activeTab === "all" || deal.department === activeTab;
        const matchesSearch =
          deal.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          deal.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          deal.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          deal.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          deal.department.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
      })
      .sort((a, b) => {
        return sortAsc
          ? a.code.localeCompare(b.code)
          : b.code.localeCompare(a.code);
      });
  }, [deals, activeTab, searchQuery, sortAsc]);

  // Handle select all
  const allSelected = filteredDeals.length > 0 && filteredDeals.every((d) => selectedRows[d.id]);
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedRows({});
    } else {
      const next: Record<string, boolean> = {};
      filteredDeals.forEach((d) => {
        next[d.id] = true;
      });
      setSelectedRows(next);
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Add deal
  const handleAddDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName.trim() || !newEmail.trim()) return;

    const nextNumber = deals.length + 1;
    const code = `NEG${String(nextNumber).padStart(3, "0")}`;

    const colorMap: Record<string, string> = {
      Financeiro: "#10b981",
      RH: "#f59e0b",
      Marketing: "#8b5cf6",
      Vendas: "#0ea5e9",
      Engenharia: "#6366f1",
    };

    const newDeal: DealItem = {
      id: String(Date.now()),
      code,
      department: newDepartment,
      departmentColor: colorMap[newDepartment] || "#10b981",
      email: newEmail,
      status: "active",
      yearsOrValue: newValue || "R$ 100.000",
      firstName: newFirstName,
      lastName: newLastName || "Silva",
      startDate: "Hoje",
      category: newCategory,
    };

    setDeals([newDeal, ...deals]);
    setIsAddModalOpen(false);
    setNewFirstName("");
    setNewLastName("");
    setNewEmail("");
    setNewValue("");
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6 select-none">
      {/* 1. Header (Reference: Image 2) */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-[#767676] font-medium">
          <Lock className="w-3.5 h-3.5 text-[#8f8f8f] icon-reactive" />
          <span>Base de Dados Privada</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight">
          Sistema de Gestão de Negócios
        </h1>
        <p className="text-sm text-[#6c6c6c]">
          Acompanhamento de negócios em todos os departamentos, valores, contatos e previsão de fechamento.
        </p>
      </div>

      {/* 2. Tabs Bar and Actions (Reference: Image 2) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 border-b border-black/[0.06] pb-3">
        {/* Left Tabs with sliding indicator (transitions.dev P16) */}
        <div
          ref={tabsListRef}
          className="relative inline-flex items-center gap-1 bg-[#f4f4f4] p-1 rounded-xl"
        >
          {/* Animated sliding indicator */}
          <div
            className="absolute top-1 bottom-1 bg-white rounded-lg shadow-sm pointer-events-none transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              left: `${indicatorStyle.left}px`,
              width: `${indicatorStyle.width}px`,
            }}
          />

          {tabItems.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                data-tab-id={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative z-10 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors duration-150 ${
                  isActive ? "text-black" : "text-[#767676] hover:text-black"
                }`}
              >
                {tab.label}
              </button>
            );
          })}

          <button
            onClick={() => alert("Criar nova visualização personalizada")}
            className="relative z-10 px-2.5 py-1.5 text-xs text-[#8f8f8f] hover:text-black transition-colors rounded-lg"
            title="Adicionar nova visualização"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Action Icons & Primary Button */}
        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 w-4 h-4 text-[#8f8f8f] icon-reactive pointer-events-none" />
            <input
              type="text"
              placeholder="Pesquisar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 pr-3 w-36 sm:w-48 text-xs bg-[#f4f4f4] hover:bg-[#ededed] focus:bg-white rounded-lg border border-transparent focus:border-black/20 outline-none transition-all placeholder:text-[#8f8f8f] text-black"
            />
          </div>

          {/* Sort Button */}
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="h-8 px-2.5 rounded-lg bg-[#f4f4f4] hover:bg-[#ededed] text-xs font-medium text-[#767676] hover:text-black flex items-center gap-1.5 transition-colors"
            title="Alternar ordenação"
          >
            <ArrowUpDown className="w-3.5 h-3.5 icon-reactive" />
          </button>

          {/* Filter Button */}
          <button
            onClick={() => {
              setSearchQuery("");
              setActiveTab("all");
            }}
            className="h-8 px-2.5 rounded-lg bg-[#f4f4f4] hover:bg-[#ededed] text-xs font-medium text-[#767676] hover:text-black flex items-center gap-1.5 transition-colors"
            title="Limpar filtros"
          >
            <Filter className="w-3.5 h-3.5 icon-reactive" />
          </button>

          {/* Layout Toggle */}
          <button className="h-8 px-2.5 rounded-lg bg-[#f4f4f4] hover:bg-[#ededed] text-xs font-medium text-[#767676] hover:text-black flex items-center gap-1.5 transition-colors">
            <TableIcon className="w-3.5 h-3.5 icon-reactive" />
          </button>

          {/* More options */}
          <button className="h-8 px-2 rounded-lg bg-[#f4f4f4] hover:bg-[#ededed] text-xs text-[#767676] hover:text-black flex items-center justify-center transition-colors">
            <MoreHorizontal className="w-4 h-4 icon-reactive" />
          </button>

          {/* Add Deal Primary Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="h-8 px-3.5 rounded-lg bg-black hover:bg-[#262626] active:bg-black text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all duration-150 active:scale-[0.98] cursor-pointer"
          >
            <span>Adicionar</span>
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. Interactive Data Table (Reference: Image 2) */}
      <div className="w-full bg-white border border-black/[0.08] rounded-2xl overflow-hidden shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] p8-page-enter">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            {/* Table Header */}
            <thead>
              <tr className="border-b border-black/[0.06] bg-[#fafafa]/80 text-[#767676] font-medium">
                {/* Checkbox Header */}
                <th className="py-3 px-4 w-10 text-center">
                  <div
                    onClick={toggleSelectAll}
                    data-checked={allSelected}
                    className="checkbox-custom mx-auto"
                    role="checkbox"
                    aria-checked={allSelected}
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                </th>

                {/* Column 1: Negócios */}
                <th className="py-3 px-4 font-semibold text-[#0d0d0d] whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span>Negócios</span>
                  </div>
                </th>

                {/* Column 2: Departamento */}
                <th className="py-3 px-4 font-semibold text-[#0d0d0d] whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#8f8f8f] icon-reactive" />
                    <span>Departamento</span>
                  </div>
                </th>

                {/* Column 3: Email */}
                <th className="py-3 px-4 font-semibold text-[#0d0d0d] whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#8f8f8f] icon-reactive" />
                    <span>E-mail</span>
                  </div>
                </th>

                {/* Column 4: Status */}
                <th className="py-3 px-4 font-semibold text-[#0d0d0d] whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-[#8f8f8f] icon-reactive" />
                    <span>Status</span>
                  </div>
                </th>

                {/* Column 5: Valor */}
                <th className="py-3 px-4 font-semibold text-[#0d0d0d] whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-[#8f8f8f] icon-reactive" />
                    <span>Valor</span>
                  </div>
                </th>

                {/* Column 6: Primeiro Nome */}
                <th className="py-3 px-4 font-semibold text-[#0d0d0d] whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <AtSign className="w-3.5 h-3.5 text-[#8f8f8f] icon-reactive" />
                    <span>Primeiro Nome</span>
                  </div>
                </th>

                {/* Column 7: Sobrenome */}
                <th className="py-3 px-4 font-semibold text-[#0d0d0d] whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#8f8f8f] icon-reactive" />
                    <span>Sobrenome</span>
                  </div>
                </th>

                {/* Column 8: Data de Início */}
                <th className="py-3 px-4 font-semibold text-[#0d0d0d] whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#8f8f8f] icon-reactive" />
                    <span>Data de Início</span>
                  </div>
                </th>

                {/* Column 9: Categoria */}
                <th className="py-3 px-4 font-semibold text-[#0d0d0d] whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-[#8f8f8f] icon-reactive" />
                    <span>Categoria</span>
                  </div>
                </th>

                {/* Column 10: Mais */}
                <th className="py-3 px-4 w-12 text-center">
                  <span className="text-[#8f8f8f]">⋯</span>
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-black/[0.04]">
              {filteredDeals.map((deal) => {
                const isSelected = !!selectedRows[deal.id];

                return (
                  <tr
                    key={deal.id}
                    className={`transition-colors duration-100 group cursor-pointer ${
                      isSelected ? "bg-[#f5f8ff]" : "hover:bg-[#fbfbfb]"
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-4 text-center">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectRow(deal.id);
                        }}
                        data-checked={isSelected}
                        className="checkbox-custom mx-auto"
                        role="checkbox"
                        aria-checked={isSelected}
                      >
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    </td>

                    {/* Code */}
                    <td className="py-3 px-4 font-mono font-medium text-black whitespace-nowrap">
                      {deal.code}
                    </td>

                    {/* Department Badge with Squircle style */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-[#f5f5f5] text-[11px] font-medium text-black border border-black/[0.04]">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: deal.departmentColor }}
                        />
                        {deal.department}
                      </span>
                    </td>

                    {/* Email */}
                    <td className="py-3 px-4 text-[#6c6c6c] whitespace-nowrap">
                      {deal.email}
                    </td>

                    {/* Status Pill Badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {deal.status === "active" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium text-[11px] border border-emerald-200/50">
                          <span className="text-[10px]">✓</span> Ativo
                        </span>
                      ) : deal.status === "inactive" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-medium text-[11px] border border-rose-200/50">
                          <span className="text-[10px]">✕</span> Inativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium text-[11px] border border-amber-200/50">
                          <span className="text-[10px]">⏱</span> Pendente
                        </span>
                      )}
                    </td>

                    {/* Valor */}
                    <td className="py-3 px-4 text-[#0d0d0d] font-semibold whitespace-nowrap">
                      {deal.yearsOrValue}
                    </td>

                    {/* Primeiro Nome */}
                    <td className="py-3 px-4 text-black whitespace-nowrap">
                      {deal.firstName}
                    </td>

                    {/* Sobrenome */}
                    <td className="py-3 px-4 text-[#6c6c6c] whitespace-nowrap">
                      {deal.lastName}
                    </td>

                    {/* Data de Início */}
                    <td className="py-3 px-4 text-[#767676] whitespace-nowrap">
                      {deal.startDate}
                    </td>

                    {/* Categoria */}
                    <td className="py-3 px-4 text-[#6c6c6c] whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-[#f6f6f6] text-[11px] font-medium text-black">
                        {deal.category}
                      </span>
                    </td>

                    {/* Row Context Menu */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          alert(`Opções para o negócio ${deal.code}`);
                        }}
                        className="p-1 rounded-md text-[#8f8f8f] hover:text-black hover:bg-[#f0f0f0] transition-colors"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {filteredDeals.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-[#767676]">Nenhum negócio encontrado com os filtros atuais.</p>
          </div>
        )}

        {/* Table Footer / Summary */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-black/[0.06] bg-[#fafafa]/50 text-xs text-[#767676]">
          <span>
            Mostrando <strong className="text-black font-semibold">{filteredDeals.length}</strong> de{" "}
            <strong className="text-black font-semibold">{deals.length}</strong> negócios
          </span>
          <div className="flex items-center gap-2">
            <button className="px-2.5 py-1 rounded-md bg-white border border-black/[0.08] hover:bg-[#f5f5f5] text-black transition-colors">
              Anterior
            </button>
            <span className="font-medium text-black px-2">1</span>
            <button className="px-2.5 py-1 rounded-md bg-white border border-black/[0.08] hover:bg-[#f5f5f5] text-black transition-colors">
              Próximo
            </button>
          </div>
        </div>
      </div>

      {/* 4. Modal "Adicionar Negócio" (transitions.dev P7 Modal System) */}
      <ModalPortal isOpen={isAddModalOpen}>
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200 select-none"
          style={{
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[24px] border border-black/[0.08] shadow-[0_24px_48px_-16px_rgba(0,0,0,0.25)] w-full max-w-[480px] p-6 p7-modal-enter space-y-5"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-black tracking-tight">
                  Adicionar Novo Negócio
                </h3>
                <p className="text-xs text-[#767676]">
                  Preencha os dados do responsável e os valores da oportunidade.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#f4f4f4] hover:bg-[#ebebeb] flex items-center justify-center text-[#8f8f8f] hover:text-black transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddDeal} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-black">Primeiro Nome</label>
                  <input
                    type="text"
                    required
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    placeholder="Ex: Carlos"
                    className="w-full h-10 px-3 rounded-xl bg-[#f6f6f6] border border-transparent focus:border-black text-xs text-black outline-none transition-all placeholder:text-[#8f8f8f]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-black">Sobrenome</label>
                  <input
                    type="text"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    placeholder="Ex: Silva"
                    className="w-full h-10 px-3 rounded-xl bg-[#f6f6f6] border border-transparent focus:border-black text-xs text-black outline-none transition-all placeholder:text-[#8f8f8f]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-black">E-mail Corporativo</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="exemplo@empresa.com.br"
                  className="w-full h-10 px-3 rounded-xl bg-[#f6f6f6] border border-transparent focus:border-black text-xs text-black outline-none transition-all placeholder:text-[#8f8f8f]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-black">Departamento</label>
                  <select
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#f6f6f6] border border-transparent focus:border-black text-xs text-black outline-none transition-all"
                  >
                    <option value="Financeiro">Financeiro</option>
                    <option value="RH">RH</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Vendas">Vendas</option>
                    <option value="Engenharia">Engenharia</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-black">Valor Estimado</label>
                  <input
                    type="text"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder="Ex: R$ 150.000"
                    className="w-full h-10 px-3 rounded-xl bg-[#f6f6f6] border border-transparent focus:border-black text-xs text-black outline-none transition-all placeholder:text-[#8f8f8f]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-black">Categoria de Negócio</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#f6f6f6] border border-transparent focus:border-black text-xs text-black outline-none transition-all"
                >
                  <option value="Enterprise">Enterprise</option>
                  <option value="SaaS">SaaS</option>
                  <option value="Expansão">Expansão</option>
                  <option value="B2B">B2B</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="h-10 px-4 rounded-xl text-xs font-medium text-[#767676] hover:text-black hover:bg-[#f4f4f4] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 rounded-xl bg-black hover:bg-[#262626] text-white text-xs font-medium shadow-sm transition-all"
                >
                  Salvar Negócio
                </button>
              </div>
            </form>
          </div>
        </div>
      </ModalPortal>
    </div>
  );
}

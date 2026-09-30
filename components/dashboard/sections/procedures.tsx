"use client";

import React, { useState, useMemo, useEffect } from "react";
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
import { toast } from "sonner";
import { ModalPortal } from "@/components/ui/modal-portal";
import { cn } from "@/lib/utils";
import { SlidingTabs, AnimatedNumber, KineticHeading, BorderBeam } from "@/components/motion";
import {
  ProcedureItem,
  DEFAULT_PROCEDURE_CATEGORIES,
  getLocalCategories,
  saveLocalCategories,
  getLocalProcedures,
  saveLocalProcedures,
  fetchProceduresFromFirestore,
  saveProcedureToFirestore,
  deleteProcedureFromFirestore,
  fetchCategoriesFromFirestore,
  saveCategoriesToFirestore,
} from "@/lib/procedures-service";

export type { ProcedureItem };

export function ProceduresSection() {
  const [procedures, setProcedures] = useState<ProcedureItem[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_PROCEDURE_CATEGORIES);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<ProcedureItem | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Form states (Add/Edit Procedure)
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState<string>("Facial");
  const [formPrice, setFormPrice] = useState<string>("");
  const [formObservation, setFormObservation] = useState("");

  // Category creation states
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [isAddingInlineCategory, setIsAddingInlineCategory] = useState(false);

  // 1. Carregar Categorias e Procedimentos (Local Storage + Firestore Cloud)
  useEffect(() => {
    const localProcs = getLocalProcedures();
    const localCats = getLocalCategories();
    setProcedures(localProcs);
    setCategories(localCats);

    // Sincronização em segundo plano com o Firestore
    fetchProceduresFromFirestore().then((cloudProcs) => {
      if (cloudProcs && cloudProcs.length > 0) {
        setProcedures(cloudProcs);
        saveLocalProcedures(cloudProcs);
      }
    });

    fetchCategoriesFromFirestore().then((cloudCats) => {
      if (cloudCats && cloudCats.length > 0) {
        setCategories(cloudCats);
        saveLocalCategories(cloudCats);
      }
    });
  }, []);

  // 2. Ouvir atualizações entre abas e componentes
  useEffect(() => {
    const handleProcsUpdate = () => {
      setProcedures(getLocalProcedures());
    };
    const handleCatsUpdate = () => {
      setCategories(getLocalCategories());
    };

    window.addEventListener("samara_procedures_updated", handleProcsUpdate);
    window.addEventListener("samara_categories_updated", handleCatsUpdate);
    window.addEventListener("storage", handleProcsUpdate);
    window.addEventListener("storage", handleCatsUpdate);

    return () => {
      window.removeEventListener("samara_procedures_updated", handleProcsUpdate);
      window.removeEventListener("samara_categories_updated", handleCatsUpdate);
      window.removeEventListener("storage", handleProcsUpdate);
      window.removeEventListener("storage", handleCatsUpdate);
    };
  }, []);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  // Gerenciamento de Categorias
  const handleCreateCategory = (rawName: string) => {
    const trimmed = rawName.trim();
    if (!trimmed) {
      toast.error("Por favor, digite o nome da categoria.");
      return;
    }

    const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);

    if (categories.some((c) => c.toLowerCase() === formatted.toLowerCase())) {
      toast.error(`A categoria "${formatted}" já existe.`);
      return;
    }

    const nextCats = [...categories, formatted];
    setCategories(nextCats);
    saveLocalCategories(nextCats);
    saveCategoriesToFirestore(nextCats);
    setFormCategory(formatted);
    setNewCategoryInput("");
    setIsAddingInlineCategory(false);
    toast.success(`Categoria "${formatted}" criada com sucesso!`);
  };

  const handleDeleteCategory = (catToDelete: string) => {
    const inUseCount = procedures.filter((p) => p.category === catToDelete).length;

    if (inUseCount > 0) {
      const confirmMove = confirm(
        `A categoria "${catToDelete}" possui ${inUseCount} procedimento(s) cadastrado(s).\n\nAo excluir, esses procedimentos serão movidos para a categoria "Facial". Deseja continuar?`
      );
      if (!confirmMove) return;

      const updatedProcs = procedures.map((p) =>
        p.category === catToDelete ? { ...p, category: "Facial" } : p
      );
      setProcedures(updatedProcs);
      saveLocalProcedures(updatedProcs);
      updatedProcs.forEach((p) => {
        if (p.category === "Facial") {
          saveProcedureToFirestore(p);
        }
      });
    } else {
      if (!confirm(`Deseja realmente remover a categoria "${catToDelete}"?`)) {
        return;
      }
    }

    const nextCats = categories.filter((c) => c !== catToDelete);
    setCategories(nextCats);
    saveLocalCategories(nextCats);
    saveCategoriesToFirestore(nextCats);

    if (selectedCategory === catToDelete) {
      setSelectedCategory("all");
    }
    if (formCategory === catToDelete) {
      setFormCategory(nextCats[0] || "Facial");
    }

    toast.success(`Categoria "${catToDelete}" removida.`);
  };

  // Abertura de Modais de Procedimento
  const handleOpenEdit = (proc: ProcedureItem) => {
    setEditingProcedure(proc);
    setFormName(proc.name);
    setFormCategory(proc.category);
    setFormPrice(proc.price.toString());
    setFormObservation(proc.observation || "");
    setIsAddingInlineCategory(false);
    setNewCategoryInput("");
  };

  const handleOpenAdd = () => {
    setEditingProcedure(null);
    setFormName("");
    setFormCategory(categories[0] || "Facial");
    setFormPrice("");
    setFormObservation("");
    setIsAddingInlineCategory(false);
    setNewCategoryInput("");
    setIsAddModalOpen(true);
  };

  // Salvar Novo ou Editar Procedimento
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPrice =
      parseFloat(formPrice.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;

    if (editingProcedure) {
      const updatedList = procedures.map((p) =>
        p.id === editingProcedure.id
          ? {
              ...p,
              name: formName.trim() || p.name,
              category: formCategory,
              price: cleanPrice,
              observation: formObservation.trim(),
            }
          : p
      );
      setProcedures(updatedList);
      saveLocalProcedures(updatedList);
      const updatedProc = updatedList.find((p) => p.id === editingProcedure.id);
      if (updatedProc) {
        saveProcedureToFirestore(updatedProc);
      }
      toast.success(`Procedimento "${formName.trim() || editingProcedure.name}" atualizado!`);
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
      const updatedList = [newProc, ...procedures];
      setProcedures(updatedList);
      saveLocalProcedures(updatedList);
      saveProcedureToFirestore(newProc);
      toast.success(`Procedimento "${newProc.name}" cadastrado com sucesso!`);
      setIsAddModalOpen(false);
    }
  };

  const handleDeleteProcedure = (id: string) => {
    const target = procedures.find((p) => p.id === id);
    if (!target) return;

    if (confirm(`Deseja realmente remover "${target.name}" do catálogo?`)) {
      const updatedList = procedures.filter((p) => p.id !== id);
      setProcedures(updatedList);
      saveLocalProcedures(updatedList);
      deleteProcedureFromFirestore(id);
      setSelectedRows((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      toast(`Procedimento "${target.name}" removido`);
    }
  };

  // Filtragem e Ordenação
  const filteredProcedures = useMemo(() => {
    return procedures
      .filter((item) => {
        const matchesCategory =
          selectedCategory === "all" ||
          item.category === selectedCategory ||
          (item.category === "Facial/Corporal" &&
            (selectedCategory === "Facial" || selectedCategory === "Corporal"));

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

  // Tabs dinâmicas de categoria para o SlidingTabs
  const categoryTabs = useMemo(() => {
    const list = [{ id: "all", label: `Todos (${procedures.length})` }];
    categories.forEach((cat) => {
      const count = procedures.filter(
        (p) =>
          p.category === cat ||
          (p.category === "Facial/Corporal" && (cat === "Facial" || cat === "Corporal"))
      ).length;
      list.push({ id: cat, label: `${cat} (${count})` });
    });
    return list;
  }, [categories, procedures]);

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

  // Cores de Badge de Categoria (Paleta Harmoniosa Apple)
  const categoryBadgeColor = (cat: string) => {
    switch (cat) {
      case "Facial":
        return "bg-[#A8B29A]/15 text-[#A8B29A] border-[#A8B29A]/30";
      case "Corporal":
        return "bg-[#8D9B7F]/15 text-[#8D9B7F] border-[#8D9B7F]/30";
      case "Facial/Corporal":
        return "bg-white/10 text-white border-white/20";
      case "Capilar":
        return "bg-[#F7F5F0]/15 text-[#F7F5F0] border-[#F7F5F0]/30";
      case "Laser":
        return "bg-[#8D9B7F]/20 text-[#A8B29A] border-[#A8B29A]/20";
      case "Íntima":
      case "Estética Íntima":
        return "bg-[#A8B29A]/10 text-[#F7F5F0] border-[#A8B29A]/20";
      default:
        return "bg-white/5 text-[#F7F5F0] border-white/10";
    }
  };

  return (
    <div data-dashboard-section="procedures" className="w-full min-w-0 max-w-[1400px] mx-auto space-y-6 p8-page-enter pb-24 sm:pb-8">
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
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Botão Gerenciar Categorias */}
            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(true)}
              className="h-11 sm:h-9 px-3.5 rounded-xl bg-[#f5f5f5] dark:bg-[#1c1c1e] hover:bg-[#ebebeb] dark:hover:bg-[#2c2c2e] text-black dark:text-white text-xs font-semibold flex items-center justify-center gap-2 border border-black/[0.06] dark:border-white/[0.08] transition-all duration-150 cursor-pointer min-h-[44px] sm:min-h-0 flex-1 sm:flex-initial shadow-2xs active:scale-95"
              title="Gerenciar e adicionar novas categorias"
            >
              <Tag className="w-4 h-4 text-[#767676] dark:text-[#a1a1aa]" />
              <span>Categorias</span>
              <span className="px-1.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[10px] font-bold text-[#767676] dark:text-[#a1a1aa]">
                {categories.length}
              </span>
            </button>

            {/* Botão Novo Procedimento */}
            <BorderBeam className="w-full sm:w-auto flex-1 sm:flex-initial">
              <button
                onClick={handleOpenAdd}
                className="h-11 sm:h-9 px-4 rounded-xl bg-black dark:bg-[#9ca889] hover:bg-[#262626] dark:hover:bg-[#8f9b7c] active:bg-[#849071] active:scale-[0.98] text-white dark:text-[#070707] text-xs font-semibold flex items-center justify-center gap-2 shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_4px_16px_rgba(156,168,137,0.25)] transition-all duration-150 cursor-pointer min-h-[44px] sm:min-h-0 w-full"
              >
                <Plus className="w-4 h-4 stroke-[2.2]" />
                <span>Novo Procedimento</span>
              </button>
            </BorderBeam>
          </div>
        </div>
      </div>

      {/* 2. Metrics Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        <div className="bg-white dark:bg-[#121214] p-3 sm:p-4 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_16px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#767676] dark:text-[#a1a1aa] font-medium">Procedimentos</span>
            <span className="w-7 h-7 rounded-lg bg-[#f6f6f6] dark:bg-[#1c1c1e] flex items-center justify-center text-black dark:text-white">
              <Layers className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-black dark:text-white mt-1.5 sm:mt-2">
            <AnimatedNumber value={procedures.length} ariaLabel={`${procedures.length} procedimentos`} />
          </div>
          <span className="text-[11px] text-[#8f8f8f] dark:text-[#a1a1aa] mt-0.5 block truncate">Ativos no catálogo</span>
        </div>

        <div className="bg-white dark:bg-[#121214] p-3 sm:p-4 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_16px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#767676] dark:text-[#a1a1aa] font-medium">Categorias</span>
            <span className="w-7 h-7 rounded-lg bg-[#f6f6f6] dark:bg-[#1c1c1e] flex items-center justify-center text-black dark:text-white">
              <Tag className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-black dark:text-white mt-1.5 sm:mt-2">
            <AnimatedNumber value={categories.length} ariaLabel={`${categories.length} categorias`} />
          </div>
          <span className="text-[11px] text-[#8f8f8f] dark:text-[#a1a1aa] mt-0.5 block truncate">
            {categories.slice(0, 2).join(", ")}
            {categories.length > 2 ? ` +${categories.length - 2}` : ""}
          </span>
        </div>

        <div className="bg-white dark:bg-[#121214] p-3 sm:p-4 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_16px_rgba(0,0,0,0.4)]">
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

        <div className="bg-white dark:bg-[#121214] p-3 sm:p-4 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_16px_rgba(0,0,0,0.4)]">
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
        {/* Category Tabs — SlidingTabs dinâmico */}
        <div className="w-full min-w-0 max-w-full sm:w-auto overflow-x-auto scrollbar-none scroll-smooth">
          <SlidingTabs
            ariaLabel="Filtrar procedimentos por categoria"
            value={selectedCategory}
            onChange={setSelectedCategory}
            tabs={categoryTabs}
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
        {filteredProcedures.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#767676] dark:text-[#a1a1aa] bg-white dark:bg-[#121212] rounded-2xl border border-black/[0.08] dark:border-white/[0.08] p-6 space-y-3">
            <Tag className="w-8 h-8 mx-auto text-[#8f8f8f] dark:text-[#71717a]" />
            <p>Nenhum procedimento encontrado para o filtro selecionado.</p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-black dark:bg-[#9ca889] text-white dark:text-[#070707] text-xs font-semibold rounded-xl dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_4px_16px_rgba(156,168,137,0.25)] active:scale-95"
            >
              Cadastrar nesta categoria
            </button>
          </div>
        ) : (
          filteredProcedures.map((proc) => {
            const isSelected = !!selectedRows[proc.id];
            return (
              <div
                key={proc.id}
                className={cn(
                  "bg-white dark:bg-[#121214] border rounded-2xl p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_16px_rgba(0,0,0,0.4)] active:scale-[0.99] space-y-3 transition-all duration-150",
                  isSelected
                    ? "border-black dark:border-white ring-1 ring-black dark:ring-white"
                    : "border-black/[0.08] dark:border-white/[0.08]"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-[#f5f5f7] dark:bg-[#1c1c1e] flex items-center justify-center text-black dark:text-white shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-black dark:text-white truncate">{proc.name}</h4>
                      <span className="text-[11px] text-[#8f8f8f] dark:text-[#a1a1aa]">Cód: {proc.id.toUpperCase()}</span>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0",
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
                      className="h-11 px-3 rounded-xl bg-[#f5f5f5] dark:bg-[#1c1c1e] hover:bg-[#ebebeb] dark:hover:bg-[#2c2c2e] text-xs font-semibold text-black dark:text-white flex items-center gap-1 transition-colors cursor-pointer active:scale-95"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => handleDeleteProcedure(proc.id)}
                      className="w-11 h-11 rounded-xl bg-[#f5f5f5] dark:bg-[#1c1c1e] hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[#8f8f8f] hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                      title="Excluir procedimento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
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
              {filteredProcedures.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-[#767676] dark:text-[#a1a1aa]">
                    Nenhum procedimento encontrado para o filtro selecionado.
                  </td>
                </tr>
              ) : (
                filteredProcedures.map((proc) => {
                  const isSelected = !!selectedRows[proc.id];

                  return (
                    <tr
                      key={proc.id}
                      className={cn(
                        "transition-colors duration-100 group cursor-pointer",
                        isSelected
                          ? "bg-[#f5f8ff] dark:bg-white/[0.06]"
                          : "hover:bg-[#fbfbfb] dark:hover:bg-[#1a1a1c]"
                      )}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 text-center">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectRow(proc.id);
                          }}
                          className="w-4 h-4 rounded border border-black/30 dark:border-white/30 flex items-center justify-center cursor-pointer transition-colors"
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

                      {/* Nome do Procedimento */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#f5f5f7] dark:bg-[#1c1c1e] flex items-center justify-center text-black dark:text-white shrink-0">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-semibold text-black dark:text-white block">
                              {proc.name}
                            </span>
                            <span className="text-[11px] text-[#8f8f8f] dark:text-[#a1a1aa]">
                              Cód: {proc.id.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Categoria */}
                      <td className="py-3.5 px-4">
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                            categoryBadgeColor(proc.category)
                          )}
                        >
                          {proc.category}
                        </span>
                      </td>

                      {/* Valor (R$) */}
                      <td className="py-3.5 px-4 font-semibold text-[#0d0d0d] dark:text-white whitespace-nowrap">
                        {formatBRL(proc.price)}
                      </td>

                      {/* Observações */}
                      <td className="py-3.5 px-4 text-[#767676] dark:text-[#a1a1aa] max-w-xs truncate">
                        {proc.observation || "—"}
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(proc)}
                            className="h-8 px-2.5 rounded-lg bg-[#f5f5f5] dark:bg-[#1c1c1e] hover:bg-[#ebebeb] dark:hover:bg-[#2c2c2e] text-xs font-medium text-black dark:text-white flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-[#8f8f8f]" />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => handleDeleteProcedure(proc.id)}
                            className="w-8 h-8 rounded-lg bg-[#f5f5f5] dark:bg-[#1c1c1e] hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[#8f8f8f] hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                            title="Excluir procedimento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Modal: Adicionar / Editar Procedimento */}
      <ModalPortal isOpen={isAddModalOpen || !!editingProcedure}>
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
          style={{
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
          onClick={() => {
            setIsAddModalOpen(false);
            setEditingProcedure(null);
            setIsAddingInlineCategory(false);
          }}
        >
          <form
            onSubmit={handleSubmitForm}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="procedure-form-title"
            className="h-[min(100dvh,44rem)] max-h-[100dvh] w-full max-w-[520px] min-h-0 overflow-hidden rounded-t-[28px] border-t border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#141414] text-black dark:text-white shadow-[0_24px_48px_-16px_rgba(0,0,0,0.25)] flex flex-col animate-in fade-in duration-150 sm:h-auto sm:max-h-[92dvh] sm:rounded-[24px] sm:border sm:zoom-in-95"
          >
            {/* Modal Header */}
            <div className="shrink-0 flex min-w-0 items-center justify-between gap-3 border-b border-black/[0.06] dark:border-white/[0.08] px-4 py-4 sm:px-6">
              <div className="min-w-0">
                <h3 id="procedure-form-title" className="truncate text-lg font-bold text-black dark:text-white tracking-tight">
                  {editingProcedure ? "Editar Procedimento" : "Novo Procedimento"}
                </h3>
                <p className="text-xs text-[#767676] dark:text-[#a1a1aa]">
                  {editingProcedure
                    ? "Atualize o valor, categoria e observações deste procedimento estético."
                    : "Cadastre um novo serviço para o catálogo da clínica."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingProcedure(null);
                  setIsAddingInlineCategory(false);
                }}
                aria-label="Fechar formulário de procedimento"
                className="w-11 h-11 sm:w-9 sm:h-9 shrink-0 rounded-full bg-[#f4f4f4] dark:bg-[#1c1c1e] hover:bg-[#ebebeb] dark:hover:bg-[#2c2c2e] flex items-center justify-center text-[#8f8f8f] hover:text-black dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <div data-modal-body="true" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5 space-y-4 scroll-momentum">
              {/* Nome do Procedimento */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-black dark:text-white">Nome do Procedimento *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Bioestimulador de Colágeno"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-[#f6f6f6] dark:bg-[#1c1c1e] border border-transparent focus:border-black dark:focus:border-white text-xs text-black dark:text-white outline-none transition-all placeholder:text-[#8f8f8f]"
                />
              </div>

              {/* Categoria com Chips Dinâmicos e Adição Rápida */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-black dark:text-white">Categoria *</label>
                  {!isAddingInlineCategory && (
                    <button
                      type="button"
                      onClick={() => setIsAddingInlineCategory(true)}
                      className="text-[11px] font-semibold text-black dark:text-white hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Nova categoria</span>
                    </button>
                  )}
                </div>

                {/* Quick Add Inline de Categoria */}
                {isAddingInlineCategory && (
                  <div className="p-3 rounded-xl bg-[#f7f7f8] dark:bg-[#1e1e21] border border-black/10 dark:border-white/10 space-y-2 animate-in fade-in duration-150">
                    <span className="text-[11px] font-semibold text-black dark:text-white block">
                      Criar e selecionar nova categoria:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder="Ex: Capilar, Laser, Skincare..."
                        value={newCategoryInput}
                        onChange={(e) => setNewCategoryInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleCreateCategory(newCategoryInput);
                          }
                        }}
                        autoFocus
                        className="flex-1 h-9 px-3 rounded-lg bg-white dark:bg-[#141414] border border-black/10 dark:border-white/10 text-xs text-black dark:text-white outline-none focus:border-black dark:focus:border-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleCreateCategory(newCategoryInput)}
                        className="h-9 px-3.5 rounded-lg bg-black dark:bg-white text-white dark:text-black text-xs font-semibold cursor-pointer shrink-0 shadow-xs"
                      >
                        Criar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingInlineCategory(false);
                          setNewCategoryInput("");
                        }}
                        className="h-9 px-2.5 rounded-lg text-xs text-[#767676] dark:text-[#a1a1aa] hover:text-black dark:hover:text-white cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* Seleção em Chips */}
                <div className="flex flex-wrap gap-2 p-1.5 rounded-xl bg-[#f7f7f8] dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] max-h-36 overflow-y-auto">
                  {categories.map((cat) => {
                    const isSelected = formCategory === cat;
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => setFormCategory(cat)}
                        className={cn(
                          "h-8 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer border flex items-center gap-1.5 active:scale-95",
                          isSelected
                            ? "bg-black text-white dark:bg-[#9ca889] dark:text-[#070707] border-black dark:border-[#9ca889] font-semibold shadow-2xs"
                            : "bg-white dark:bg-[#252528] text-[#767676] dark:text-[#a1a1aa] border-black/[0.06] dark:border-white/[0.08] hover:text-black dark:hover:text-white hover:border-black/20 dark:hover:border-white/20"
                        )}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />}
                        <span>{cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Valor (R$) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-black dark:text-white">Valor (R$) *</label>
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
                    className="w-full h-10 pl-10 pr-3.5 rounded-xl bg-[#f6f6f6] dark:bg-[#1c1c1e] border border-transparent focus:border-black dark:focus:border-white text-xs font-semibold text-black dark:text-white outline-none transition-all placeholder:text-[#8f8f8f]"
                  />
                </div>
              </div>

              {/* Observação */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-black dark:text-white">
                  Observações Técnicas <span className="text-[#8f8f8f] font-normal">(Opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: valor por ml / cobrado por sessão"
                  value={formObservation}
                  onChange={(e) => setFormObservation(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-[#f6f6f6] dark:bg-[#1c1c1e] border border-transparent focus:border-black dark:focus:border-white text-xs text-black dark:text-white outline-none transition-all placeholder:text-[#8f8f8f]"
                />
                <p className="text-[11px] text-[#8f8f8f]">
                  Ex: "cobrado por ml", "recomendado 3 sessões", etc.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div data-modal-footer="true" className="shrink-0 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 border-t border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#141414] px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:px-6 sm:py-4">
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingProcedure(null);
                  setIsAddingInlineCategory(false);
                }}
                className="h-11 sm:h-10 px-4 rounded-xl text-xs font-medium text-[#767676] dark:text-[#a1a1aa] hover:text-black dark:hover:text-white hover:bg-[#f4f4f4] dark:hover:bg-[#1c1c1e] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="h-11 sm:h-10 w-full sm:w-auto px-5 rounded-xl bg-black dark:bg-[#9ca889] hover:bg-[#262626] dark:hover:bg-[#8f9b7c] active:bg-[#849071] text-white dark:text-[#070707] text-xs font-semibold shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_4px_16px_rgba(156,168,137,0.25)] transition-all duration-150 active:scale-[0.98] cursor-pointer"
              >
                {editingProcedure ? "Salvar Alterações" : "Cadastrar Procedimento"}
              </button>
            </div>
          </form>
        </div>
      </ModalPortal>

      {/* 7. Modal: Gerenciar Categorias */}
      <ModalPortal isOpen={isCategoryModalOpen}>
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
          style={{
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
          onClick={() => {
            setIsCategoryModalOpen(false);
            setNewCategoryInput("");
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="manage-categories-title"
            className="h-[min(100dvh,40rem)] max-h-[100dvh] w-full max-w-[520px] min-h-0 overflow-hidden rounded-t-[28px] border-t border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#141414] text-black dark:text-white shadow-[0_24px_48px_-16px_rgba(0,0,0,0.25)] flex flex-col animate-in fade-in duration-150 sm:h-auto sm:max-h-[88dvh] sm:rounded-[24px] sm:border sm:zoom-in-95"
          >
            {/* Modal Header */}
            <div className="shrink-0 flex min-w-0 items-center justify-between gap-3 border-b border-black/[0.06] dark:border-white/[0.08] px-4 py-4 sm:px-6">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0 shadow-sm">
                  <Tag className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 id="manage-categories-title" className="truncate text-lg font-bold text-black dark:text-white tracking-tight">
                    Categorias de Procedimentos
                  </h3>
                  <p className="text-xs text-[#767676] dark:text-[#a1a1aa]">
                    Crie novas especialidades e organize o catálogo da clínica.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setNewCategoryInput("");
                }}
                aria-label="Fechar gerenciador de categorias"
                className="w-10 h-10 sm:w-8 sm:h-8 shrink-0 rounded-full bg-[#f4f4f4] dark:bg-[#1c1c1e] hover:bg-[#ebebeb] dark:hover:bg-[#2c2c2e] flex items-center justify-center text-[#8f8f8f] hover:text-black dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div data-modal-body="true" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 space-y-5 scroll-momentum">
              {/* Adicionar Nova Categoria */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-[#f8f8f9] dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] space-y-2.5">
                <label className="text-xs font-semibold text-black dark:text-white flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cadastrar Nova Categoria</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Ex: Capilar, Laser, Estética Íntima..."
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCreateCategory(newCategoryInput);
                      }
                    }}
                    className="flex-1 h-10 px-3.5 rounded-xl bg-white dark:bg-[#141414] border border-black/10 dark:border-white/12 text-xs text-black dark:text-white outline-none focus:border-black dark:focus:border-white transition-all placeholder:text-[#8f8f8f]"
                  />
                  <button
                    type="button"
                    onClick={() => handleCreateCategory(newCategoryInput)}
                    className="h-10 px-4 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-semibold hover:bg-[#262626] dark:hover:bg-[#ededed] transition-all cursor-pointer shrink-0 shadow-sm active:scale-95"
                  >
                    Adicionar
                  </button>
                </div>
                <p className="text-[11px] text-[#8f8f8f] dark:text-[#a1a1aa]">
                  A nova categoria ficará disponível instantaneamente nos filtros e no formulário de serviços.
                </p>
              </div>

              {/* Lista de Categorias Existentes */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-[#767676] dark:text-[#a1a1aa] uppercase tracking-wider block">
                  Categorias Ativas ({categories.length})
                </span>

                <div className="space-y-2">
                  {categories.map((cat) => {
                    const count = procedures.filter(
                      (p) =>
                        p.category === cat ||
                        (p.category === "Facial/Corporal" && (cat === "Facial" || cat === "Corporal"))
                    ).length;

                    return (
                      <div
                        key={cat}
                        className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#18181b] border border-black/[0.06] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20 transition-all"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={cn(
                              "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border",
                              categoryBadgeColor(cat)
                            )}
                          >
                            {cat}
                          </span>
                          <span className="text-xs text-[#8f8f8f] dark:text-[#a1a1aa]">
                            {count} {count === 1 ? "procedimento" : "procedimentos"}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat)}
                          title={`Remover categoria ${cat}`}
                          aria-label={`Remover categoria ${cat}`}
                          className="w-8 h-8 rounded-lg bg-[#f5f5f5] dark:bg-[#202022] hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[#8f8f8f] hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div data-modal-footer="true" className="shrink-0 flex items-center justify-end border-t border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#141414] px-4 py-3 sm:px-6 sm:py-4">
              <button
                type="button"
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setNewCategoryInput("");
                }}
                className="h-10 px-5 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-semibold hover:bg-[#262626] dark:hover:bg-[#ededed] transition-all cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>
    </div>
  );
}

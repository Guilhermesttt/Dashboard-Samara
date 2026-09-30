"use client";

import React, { useState } from "react";
import { X, Sparkles, Check, Calendar, FileText, Layers, Plus, Trash2 } from "lucide-react";
import { ModalPortal } from "@/components/ui/modal-portal";

export interface HofPlanningRecord {
  patientName: string;
  product: string;
  lotNumber: string;
  units: string;
  dilutionMl: string;
  expiryDate: string;
  expectedResult: "Paralisia leve" | "Natural com movimento" | "Paralisia total";
  procedures: string[];
  treatedRegions: string[];
  bioestimuladorSessions: { area: string; ml: string; nextApplication: string }[];
  annualPlanning: { stage: number; date: string; notes: string }[];
  value: string;
  paymentMethod: string;
  notes: string;
}

interface HofPlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  initialData?: Partial<HofPlanningRecord>;
  onSave?: (data: HofPlanningRecord) => void;
}

export function HofPlanningModal({
  isOpen,
  onClose,
  patientName,
  initialData,
  onSave,
}: HofPlanningModalProps) {
  const [product, setProduct] = useState(initialData?.product || "Ácido Hialurônico Juvederm / Radiesse");
  const [lotNumber, setLotNumber] = useState(initialData?.lotNumber || "LOT-99214");
  const [units, setUnits] = useState(initialData?.units || "2 seringas");
  const [dilutionMl, setDilutionMl] = useState(initialData?.dilutionMl || "1.0 ml");
  const [expiryDate, setExpiryDate] = useState(initialData?.expiryDate || "11/2027");

  const [expectedResult, setExpectedResult] = useState<HofPlanningRecord["expectedResult"]>(
    initialData?.expectedResult || "Natural com movimento"
  );

  const [selectedProcedures, setSelectedProcedures] = useState<string[]>(
    initialData?.procedures || ["Preenchimento", "Bioestimulador de colágeno"]
  );

  const [selectedRegions, setSelectedRegions] = useState<string[]>(
    initialData?.treatedRegions || [
      "sulco nasolabial",
      "malar + arco zigomatico",
      "lábios",
    ]
  );

  const [bioestimuladorSessions, setBioestimuladorSessions] = useState(
    initialData?.bioestimuladorSessions || [
      { area: "Malar e Terço Médio", ml: "1.5 ml", nextApplication: "Em 45 dias" },
      { area: "Ângulo da Mandíbula", ml: "1.5 ml", nextApplication: "Em 45 dias" },
    ]
  );

  const [annualPlanning, setAnnualPlanning] = useState(
    initialData?.annualPlanning || [
      { stage: 1, date: "Hoje", notes: "Preenchimento Labial e Malar" },
      { stage: 2, date: "Em 15 dias", notes: "Retorno e Avaliação de Retoque" },
      { stage: 3, date: "Em 3 meses", notes: "1ª Sessão de Bioestimulador" },
      { stage: 4, date: "Em 6 meses", notes: "Retoque Toxina Botulínica" },
      { stage: 5, date: "Em 9 meses", notes: "2ª Sessão de Bioestimulador" },
      { stage: 6, date: "Em 12 meses", notes: "Revisão e Manutenção Anual" },
    ]
  );

  const [value, setValue] = useState(initialData?.value || "R$ 3.200,00");
  const [paymentMethod, setPaymentMethod] = useState(initialData?.paymentMethod || "Cartão 6x");
  const [notes, setNotes] = useState(initialData?.notes || "Plano personalizado com foco no triângulo da juventude e contorno mandibular.");

  const procedureOptions = [
    "Preenchimento",
    "Bioestimulador de colágeno",
    "Skinbooster",
    "Microagulhamento",
    "Fios Faciais",
    "Outros",
  ];

  const regionOptions = [
    "terço superior completa (botox)",
    "temporas",
    "olheiras/calhas lacrimal",
    "palpebra inferior",
    "malar + arco zigomatico",
    "orbicular",
    "sulco nasolabial",
    "marionete",
    "mento",
    "angulo da mandíbula/mandíbula",
    "contorno facial",
    "pescoço",
    "submandibular",
    "full face",
    "lábios",
    "nariz",
  ];

  const toggleProcedure = (proc: string) => {
    setSelectedProcedures((prev) =>
      prev.includes(proc) ? prev.filter((p) => p !== proc) : [...prev, proc]
    );
  };

  const toggleRegion = (reg: string) => {
    setSelectedRegions((prev) =>
      prev.includes(reg) ? prev.filter((r) => r !== reg) : [...prev, reg]
    );
  };

  const addBioSession = () => {
    setBioestimuladorSessions((prev) => [
      ...prev,
      { area: "Região Facial", ml: "1.0 ml", nextApplication: "Em 30 dias" },
    ]);
  };

  const removeBioSession = (index: number) => {
    setBioestimuladorSessions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) {
      onSave({
        patientName,
        product,
        lotNumber,
        units,
        dilutionMl,
        expiryDate,
        expectedResult,
        procedures: selectedProcedures,
        treatedRegions: selectedRegions,
        bioestimuladorSessions,
        annualPlanning,
        value,
        paymentMethod,
        notes,
      });
    }
    onClose();
  };

  return (
    <ModalPortal isOpen={isOpen}>
      <div
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200 select-none"
        style={{
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-t-[28px] sm:rounded-[24px] border-t sm:border border-black/[0.08] shadow-[0_24px_48px_-16px_rgba(0,0,0,0.25)] w-full max-w-[840px] max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-black/[0.06] bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-black tracking-tight">
                  Planejamento HOF & Bioestimulador (Imagens 3 e 4)
                </h3>
                <p className="text-xs text-[#767676]">
                  Paciente: <strong className="text-black">{patientName}</strong> • Harmonização Orofacial & Planejamento Anual
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#f4f4f4] hover:bg-[#ebebeb] flex items-center justify-center text-[#8f8f8f] hover:text-black transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* 1. Dados do Produto e Resultado Esperado (Imagem 3) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#fafafa] border border-black/[0.06] space-y-2.5">
                <h4 className="text-xs font-bold text-black uppercase tracking-wider">
                  Dados do Produto HOF
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="col-span-2">
                    <label className="text-[11px] text-[#767676] block mb-0.5">Produto Utilizado</label>
                    <input
                      type="text"
                      value={product}
                      onChange={(e) => setProduct(e.target.value)}
                      className="w-full h-11 sm:h-8 px-2.5 rounded-lg bg-white border border-black/10 text-base sm:text-xs text-black"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#767676] block mb-0.5">Nº do Lote</label>
                    <input
                      type="text"
                      value={lotNumber}
                      onChange={(e) => setLotNumber(e.target.value)}
                      className="w-full h-11 sm:h-8 px-2.5 rounded-lg bg-white border border-black/10 text-base sm:text-xs text-black font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#767676] block mb-0.5">Diluição (ml)</label>
                    <input
                      type="text"
                      value={dilutionMl}
                      onChange={(e) => setDilutionMl(e.target.value)}
                      className="w-full h-11 sm:h-8 px-2.5 rounded-lg bg-white border border-black/10 text-base sm:text-xs text-black"
                    />
                  </div>
                </div>
              </div>

              {/* Resultado Esperado (Imagem 3) */}
              <div className="p-4 rounded-2xl bg-[#fafafa] border border-black/[0.06] space-y-2.5">
                <h4 className="text-xs font-bold text-black uppercase tracking-wider">
                  Resultado Esperado (Alinhamento)
                </h4>
                <div className="space-y-1.5 pt-1">
                  {(["Paralisia leve", "Natural com movimento", "Paralisia total"] as const).map(
                    (res) => (
                      <label
                        key={res}
                        onClick={() => setExpectedResult(res)}
                        className={`flex items-center gap-2 p-2 rounded-xl text-xs cursor-pointer border transition-all ${
                          expectedResult === res
                            ? "bg-black text-white border-black font-semibold shadow-sm"
                            : "bg-white text-black border-black/10 hover:border-black/30"
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            expectedResult === res ? "border-white bg-white" : "border-black/40"
                          }`}
                        >
                          {expectedResult === res && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                        </div>
                        <span>{res}</span>
                      </label>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* 2. Procedimentos Selecionados */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-black uppercase tracking-wider">
                Procedimentos Planejados
              </h4>
              <div className="flex flex-wrap gap-2">
                {procedureOptions.map((proc) => {
                  const isSelected = selectedProcedures.includes(proc);
                  return (
                    <button
                      type="button"
                      key={proc}
                      onClick={() => toggleProcedure(proc)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-black text-white border-black shadow-sm font-semibold"
                          : "bg-[#f7f7f7] text-[#6c6c6c] border-transparent hover:text-black"
                      }`}
                    >
                      {isSelected ? "✓ " : "+ "}
                      {proc}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Regiões Tratadas (Checklist Completo da Imagem 3) */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-black uppercase tracking-wider">
                Regiões Anatômicas Tratadas
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {regionOptions.map((reg) => {
                  const isSelected = selectedRegions.includes(reg);
                  return (
                    <div
                      key={reg}
                      onClick={() => toggleRegion(reg)}
                      className={`p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                        isSelected
                          ? "bg-black text-white border-black font-semibold shadow-sm"
                          : "bg-[#fafafa] text-[#525252] border-black/[0.06] hover:border-black/20"
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                          isSelected ? "bg-white text-black border-white" : "border-black/30 bg-white"
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <span className="capitalize truncate">{reg}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Ficha de Bioestimulador (Imagem 4: Área Trabalhada | ML) */}
            <div className="space-y-3 p-4 rounded-2xl bg-[#A8B29A]/10 border border-[#A8B29A]/25">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#A8B29A]" />
                  <h4 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider">
                    Ficha de Bioestimulador (Áreas Trabalhadas & Dosagem em ML)
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={addBioSession}
                  className="px-2.5 py-1 rounded-lg bg-black text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Adicionar Área</span>
                </button>
              </div>

              <div className="space-y-2">
                {bioestimuladorSessions.map((session, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white dark:bg-[#1c1c1c] p-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] text-xs">
                    <input
                      type="text"
                      placeholder="Área trabalhada (ex: Terço Médio, Mandíbula)"
                      value={session.area}
                      onChange={(e) => {
                        const updated = [...bioestimuladorSessions];
                        updated[idx].area = e.target.value;
                        setBioestimuladorSessions(updated);
                      }}
                      className="flex-1 h-11 sm:h-7 px-2 rounded-lg bg-[#f7f7f7] border border-black/10 text-base sm:text-xs text-black"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Volume (ml)"
                        value={session.ml}
                        onChange={(e) => {
                          const updated = [...bioestimuladorSessions];
                          updated[idx].ml = e.target.value;
                          setBioestimuladorSessions(updated);
                        }}
                        className="flex-1 sm:w-20 h-11 sm:h-7 px-2 rounded-lg bg-[#f7f7f7] border border-black/10 text-base sm:text-xs text-black font-semibold text-center"
                      />
                      <input
                        type="text"
                        placeholder="Próxima aplicação"
                        value={session.nextApplication}
                        onChange={(e) => {
                          const updated = [...bioestimuladorSessions];
                          updated[idx].nextApplication = e.target.value;
                          setBioestimuladorSessions(updated);
                        }}
                        className="flex-1 sm:w-32 h-11 sm:h-7 px-2 rounded-lg bg-[#f7f7f7] border border-black/10 text-base sm:text-xs text-black text-center"
                      />
                      <button
                        type="button"
                        onClick={() => removeBioSession(idx)}
                        className="w-11 sm:w-7 h-11 sm:h-7 rounded-lg text-rose-600 hover:bg-rose-50 flex items-center justify-center shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Planejamento Anual (Imagem 3: Etapas 1 a 6) */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-black uppercase tracking-wider">
                Planejamento Anual de Procedimentos (Cronograma de Cuidados)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {annualPlanning.map((step, idx) => (
                  <div key={step.stage} className="p-2.5 rounded-xl bg-[#fafafa] border border-black/[0.05] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      {step.stage}
                    </span>
                    <input
                      type="text"
                      value={step.date}
                      onChange={(e) => {
                        const updated = [...annualPlanning];
                        updated[idx].date = e.target.value;
                        setAnnualPlanning(updated);
                      }}
                      className="w-24 h-7 px-2 rounded-lg bg-white border border-black/10 text-xs text-black font-medium"
                    />
                    <input
                      type="text"
                      value={step.notes}
                      onChange={(e) => {
                        const updated = [...annualPlanning];
                        updated[idx].notes = e.target.value;
                        setAnnualPlanning(updated);
                      }}
                      className="flex-1 h-7 px-2 rounded-lg bg-white border border-black/10 text-xs text-black"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 6. Valores e Pagamento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-[#fafafa] border border-black/[0.06] text-xs">
              <div>
                <label className="text-[11px] font-bold text-black block mb-1">Valor Total (R$)</label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl bg-white border border-black/10 font-bold text-sm text-black"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-black block mb-1">Forma de Pagamento</label>
                <input
                  type="text"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl bg-white border border-black/10 text-xs text-black font-medium"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-black/[0.06]">
              <button
                type="button"
                onClick={onClose}
                className="h-11 sm:h-9 px-4 rounded-xl text-xs font-medium text-[#767676] hover:text-black hover:bg-[#f4f4f4] transition-colors cursor-pointer text-center active:scale-95"
              >
                Fechar
              </button>
              <button
                type="submit"
                className="h-11 sm:h-9 px-5 rounded-xl bg-black hover:bg-[#262626] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer active:scale-[0.98] w-full sm:w-auto"
              >
                Salvar Planejamento HOF
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}

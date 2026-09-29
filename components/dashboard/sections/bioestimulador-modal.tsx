"use client";

import React, { useState } from "react";
import { X, Sparkles, Plus, Trash2, Calendar, FileCheck, User } from "lucide-react";
import { ModalPortal } from "@/components/ui/modal-portal";

export interface BioestimuladorRecord {
  patientName: string;
  date: string;
  table1: { area: string; ml: string }[];
  nextApplication1: string;
  table2: { area: string; ml: string }[];
  nextApplication2: string;
  notes?: string;
  signatureDate?: string;
  patientSignature?: string;
}

interface BioestimuladorModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  initialData?: BioestimuladorRecord;
  onSave?: (data: BioestimuladorRecord) => void;
}

export function BioestimuladorModal({
  isOpen,
  onClose,
  patientName,
  initialData,
  onSave,
}: BioestimuladorModalProps) {
  const [date, setDate] = useState(
    initialData?.date || new Date().toLocaleDateString("pt-BR")
  );

  const [table1, setTable1] = useState(
    initialData?.table1 || [
      { area: "Malar Direito", ml: "1.0 ml" },
      { area: "Malar Esquerdo", ml: "1.0 ml" },
      { area: "Ângulo Mandibular Dir", ml: "0.5 ml" },
      { area: "Ângulo Mandibular Esq", ml: "0.5 ml" },
      { area: "", ml: "" },
      { area: "", ml: "" },
    ]
  );
  const [nextApplication1, setNextApplication1] = useState(
    initialData?.nextApplication1 || "Em 45 dias"
  );

  const [table2, setTable2] = useState(
    initialData?.table2 || [
      { area: "Pescoço e Papada", ml: "1.0 ml" },
      { area: "Fossa Temporal Dir", ml: "0.5 ml" },
      { area: "Fossa Temporal Esq", ml: "0.5 ml" },
      { area: "", ml: "" },
      { area: "", ml: "" },
      { area: "", ml: "" },
    ]
  );
  const [nextApplication2, setNextApplication2] = useState(
    initialData?.nextApplication2 || "Em 90 dias"
  );

  const [notes, setNotes] = useState(
    initialData?.notes ||
      "Bioestimulador de hidroxiapatita de cálcio / PLLA. Recomenda-se massagem 5x ao dia por 5 dias (regra dos 5)."
  );

  const [signedByPatient, setSignedByPatient] = useState(true);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) {
      onSave({
        patientName,
        date,
        table1,
        nextApplication1,
        table2,
        nextApplication2,
        notes,
        signatureDate: date,
        patientSignature: signedByPatient ? `Assinado digitalmente por ${patientName}` : "",
      });
    }
    onClose();
  };

  const handleUpdateRow = (
    tableIndex: 1 | 2,
    rowIndex: number,
    field: "area" | "ml",
    val: string
  ) => {
    if (tableIndex === 1) {
      const updated = [...table1];
      updated[rowIndex][field] = val;
      setTable1(updated);
    } else {
      const updated = [...table2];
      updated[rowIndex][field] = val;
      setTable2(updated);
    }
  };

  const addRow = (tableIndex: 1 | 2) => {
    if (tableIndex === 1) {
      setTable1([...table1, { area: "", ml: "" }]);
    } else {
      setTable2([...table2, { area: "", ml: "" }]);
    }
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
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-black tracking-tight">
                  Ficha de Bioestimulador (Modelo Oficial)
                </h3>
                <p className="text-xs text-[#767676]">
                  Paciente: <strong className="text-black">{patientName}</strong> • Rastreio de Áreas Trabalhadas & Dosagem em ML
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

          {/* Form */}
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* Top Bar: Data da Sessão */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#fafafa] border border-black/[0.05] text-xs">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#8f8f8f]" />
                <span className="font-semibold text-black">Data da Aplicação:</span>
                <input
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-7 px-2 rounded-lg bg-white border border-black/10 text-xs font-semibold text-black w-28"
                />
              </div>
              <div className="text-[11px] text-[#767676]">
                Modelo idêntico à ficha física da clínica (Tabelas 1 e 2 de Áreas e Retornos)
              </div>
            </div>

            {/* As Duas Tabelas Lado a Lado (Modelo Imagem 4) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tabela 1 */}
              <div className="p-3.5 sm:p-4 rounded-2xl border border-black/[0.08] bg-white space-y-3 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-black/[0.06]">
                  <h4 className="text-xs font-bold text-black uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center">
                      1
                    </span>
                    Sessão / Região Primária
                  </h4>
                  <button
                    type="button"
                    onClick={() => addRow(1)}
                    className="text-[11px] font-semibold text-black hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    Linha
                  </button>
                </div>

                <div className="border border-black/[0.08] rounded-xl overflow-hidden divide-y divide-black/[0.04]">
                  <div className="grid grid-cols-3 bg-[#f6f6f6] px-3 py-2 text-[11px] font-bold text-black">
                    <span className="col-span-2">Área Trabalhada</span>
                    <span className="text-right">Volume (ML)</span>
                  </div>
                  {table1.map((row, idx) => (
                    <div key={idx} className="grid grid-cols-3 items-center px-2.5 py-1.5 gap-2 hover:bg-[#fafafa]">
                      <input
                        type="text"
                        placeholder={`Área ${idx + 1}`}
                        value={row.area}
                        onChange={(e) => handleUpdateRow(1, idx, "area", e.target.value)}
                        className="col-span-2 h-10 sm:h-7 px-2 text-base sm:text-xs text-black bg-transparent border border-transparent focus:border-black/20 focus:bg-white rounded outline-none"
                      />
                      <input
                        type="text"
                        placeholder="ML"
                        value={row.ml}
                        onChange={(e) => handleUpdateRow(1, idx, "ml", e.target.value)}
                        className="h-10 sm:h-7 px-2 text-base sm:text-xs font-bold text-black text-right bg-transparent border border-transparent focus:border-black/20 focus:bg-white rounded outline-none"
                      />
                    </div>
                  ))}
                </div>

                {/* Nova Aplicação 1 */}
                <div className="pt-2 border-t border-black/[0.06] flex items-center justify-between text-xs">
                  <span className="font-semibold text-black">Nova Aplicação:</span>
                  <input
                    type="text"
                    value={nextApplication1}
                    onChange={(e) => setNextApplication1(e.target.value)}
                    placeholder="Ex: Em 45 dias / Data"
                    className="h-7 px-2.5 rounded-lg bg-[#f7f7f7] border border-black/10 text-xs font-semibold text-black w-40 text-right"
                  />
                </div>
              </div>

              {/* Tabela 2 */}
              <div className="p-3.5 sm:p-4 rounded-2xl border border-black/[0.08] bg-white space-y-3 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-black/[0.06]">
                  <h4 className="text-xs font-bold text-black uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center">
                      2
                    </span>
                    Sessão / Região Complementar
                  </h4>
                  <button
                    type="button"
                    onClick={() => addRow(2)}
                    className="text-[11px] font-semibold text-black hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    Linha
                  </button>
                </div>

                <div className="border border-black/[0.08] rounded-xl overflow-hidden divide-y divide-black/[0.04]">
                  <div className="grid grid-cols-3 bg-[#f6f6f6] px-3 py-2 text-[11px] font-bold text-black">
                    <span className="col-span-2">Área Trabalhada</span>
                    <span className="text-right">Volume (ML)</span>
                  </div>
                  {table2.map((row, idx) => (
                    <div key={idx} className="grid grid-cols-3 items-center px-2.5 py-1.5 gap-2 hover:bg-[#fafafa]">
                      <input
                        type="text"
                        placeholder={`Área ${idx + 1}`}
                        value={row.area}
                        onChange={(e) => handleUpdateRow(2, idx, "area", e.target.value)}
                        className="col-span-2 h-10 sm:h-7 px-2 text-base sm:text-xs text-black bg-transparent border border-transparent focus:border-black/20 focus:bg-white rounded outline-none"
                      />
                      <input
                        type="text"
                        placeholder="ML"
                        value={row.ml}
                        onChange={(e) => handleUpdateRow(2, idx, "ml", e.target.value)}
                        className="h-10 sm:h-7 px-2 text-base sm:text-xs font-bold text-black text-right bg-transparent border border-transparent focus:border-black/20 focus:bg-white rounded outline-none"
                      />
                    </div>
                  ))}
                </div>

                {/* Nova Aplicação 2 */}
                <div className="pt-2 border-t border-black/[0.06] flex items-center justify-between text-xs">
                  <span className="font-semibold text-black">Nova Aplicação:</span>
                  <input
                    type="text"
                    value={nextApplication2}
                    onChange={(e) => setNextApplication2(e.target.value)}
                    placeholder="Ex: Em 90 dias / Data"
                    className="h-7 px-2.5 rounded-lg bg-[#f7f7f7] border border-black/10 text-xs font-semibold text-black w-40 text-right"
                  />
                </div>
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-black">Observações da Aplicação</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações do plano de tratamento, cânula utilizada ou cuidados pós-aplicação..."
                className="w-full p-2.5 rounded-xl bg-[#f7f7f7] border border-transparent focus:border-black text-xs text-black outline-none resize-none"
              />
            </div>

            {/* Rodapé: Assinatura do Paciente (Imagem 4) */}
            <div className="p-3.5 rounded-2xl bg-[#fafafa] border border-black/[0.06] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-black uppercase tracking-wider text-[11px]">
                  Assinatura do Paciente ou Responsável Legal
                </span>
                <label className="inline-flex items-center gap-2 cursor-pointer font-medium text-black">
                  <input
                    type="checkbox"
                    checked={signedByPatient}
                    onChange={(e) => setSignedByPatient(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span>Assinado em prontuário</span>
                </label>
              </div>
              <p className="text-[11px] text-[#767676]">
                Conforme Modelo da Ficha de Bioestimulador (Imagem 4): "Assinatura do paciente ou responsável legal por escrito."
              </p>
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
                Salvar Ficha de Bioestimulador
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}

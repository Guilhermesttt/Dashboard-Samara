"use client";

import React, { useState } from "react";
import { X, Sparkles, Check, Calendar, FileText, Activity } from "lucide-react";
import { ModalPortal } from "@/components/ui/modal-portal";

export interface BotoxRecord {
  patientName: string;
  dilutionDate: string;
  dilutionVolume: string;
  lotNumber: string;
  expiryDate: string;
  applicationDate: string;
  muscles: {
    frontal: number;
    procero: number;
    corrugadorEsq: number;
    corrugadorDir: number;
    orbicularOlhoEsq: number;
    orbicularOlhoDir: number;
    nasal: number;
    depressorSeptoNasal: number;
    orbicularBoca: number;
    depressorAnguloBoca: number;
    mentoniano: number;
    platisma: number;
    masseter: number;
    temporal: number;
  };
  notes?: string;
}

interface BotoxApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  initialData?: BotoxRecord;
  onSave?: (data: BotoxRecord) => void;
}

export function BotoxApplicationModal({
  isOpen,
  onClose,
  patientName,
  initialData,
  onSave,
}: BotoxApplicationModalProps) {
  const [dilutionDate, setDilutionDate] = useState(initialData?.dilutionDate || "24/09/2026");
  const [dilutionVolume, setDilutionVolume] = useState(initialData?.dilutionVolume || "2.0 ml");
  const [lotNumber, setLotNumber] = useState(initialData?.lotNumber || "BTX-88421");
  const [expiryDate, setExpiryDate] = useState(initialData?.expiryDate || "12/2027");
  const [applicationDate, setApplicationDate] = useState(initialData?.applicationDate || "Hoje");

  const [muscles, setMuscles] = useState(
    initialData?.muscles || {
      frontal: 14,
      procero: 4,
      corrugadorEsq: 4,
      corrugadorDir: 4,
      orbicularOlhoEsq: 6,
      orbicularOlhoDir: 6,
      nasal: 0,
      depressorSeptoNasal: 0,
      orbicularBoca: 0,
      depressorAnguloBoca: 0,
      mentoniano: 4,
      platisma: 0,
      masseter: 0,
      temporal: 0,
    }
  );

  const [notes, setNotes] = useState(initialData?.notes || "Aplicação preventiva em terço superior com retoque programado para 15 dias.");

  const totalUnits = Object.values(muscles).reduce((acc, curr) => acc + (Number(curr) || 0), 0);

  const muscleList: { key: keyof typeof muscles; label: string }[] = [
    { key: "frontal", label: "Frontal" },
    { key: "procero", label: "Prócero" },
    { key: "corrugadorEsq", label: "Corrugador (esq)" },
    { key: "corrugadorDir", label: "Corrugador (dir)" },
    { key: "orbicularOlhoEsq", label: "Orbicular do olho (esq)" },
    { key: "orbicularOlhoDir", label: "Orbicular do olho (dir)" },
    { key: "nasal", label: "Nasal" },
    { key: "depressorSeptoNasal", label: "Depressor do septo nasal" },
    { key: "orbicularBoca", label: "Orbicular da boca" },
    { key: "depressorAnguloBoca", label: "Depressor do ângulo da boca" },
    { key: "mentoniano", label: "Mentoniano" },
    { key: "platisma", label: "Platisma" },
    { key: "masseter", label: "Masseter" },
    { key: "temporal", label: "Temporal" },
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) {
      onSave({
        patientName,
        dilutionDate,
        dilutionVolume,
        lotNumber,
        expiryDate,
        applicationDate,
        muscles,
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
          className="bg-white rounded-t-[28px] sm:rounded-[24px] border-t sm:border border-black/[0.08] shadow-[0_24px_48px_-16px_rgba(0,0,0,0.25)] w-full max-w-[760px] max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-black/[0.06] bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-black tracking-tight">
                  Ficha de Aplicação BOTOX (Modelo Clínico)
                </h3>
                <p className="text-xs text-[#767676]">
                  Paciente: <strong className="text-black">{patientName}</strong> • Mapeamento Muscular de Unidades
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
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* Dados do Produto (Imagem 2) */}
            <div className="p-4 rounded-2xl bg-[#fafafa] border border-black/[0.06] space-y-3">
              <h4 className="text-xs font-bold text-black uppercase tracking-wider">
                Dados do Produto & Rastreabilidade
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
                <div>
                  <label className="text-[11px] text-[#767676] block mb-1">Data Diluição</label>
                  <input
                    type="text"
                    value={dilutionDate}
                    onChange={(e) => setDilutionDate(e.target.value)}
                    className="w-full h-11 sm:h-8 px-2 rounded-lg bg-white border border-black/10 text-base sm:text-xs text-black font-medium"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#767676] block mb-1">Volume Diluição</label>
                  <input
                    type="text"
                    value={dilutionVolume}
                    onChange={(e) => setDilutionVolume(e.target.value)}
                    className="w-full h-11 sm:h-8 px-2 rounded-lg bg-white border border-black/10 text-base sm:text-xs text-black font-medium"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#767676] block mb-1">Nº do Lote</label>
                  <input
                    type="text"
                    value={lotNumber}
                    onChange={(e) => setLotNumber(e.target.value)}
                    className="w-full h-11 sm:h-8 px-2 rounded-lg bg-white border border-black/10 text-base sm:text-xs text-black font-mono font-medium"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#767676] block mb-1">Validade</label>
                  <input
                    type="text"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full h-11 sm:h-8 px-2 rounded-lg bg-white border border-black/10 text-base sm:text-xs text-black font-medium"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-[11px] text-[#767676] block mb-1">Data Aplicação</label>
                  <input
                    type="text"
                    value={applicationDate}
                    onChange={(e) => setApplicationDate(e.target.value)}
                    className="w-full h-11 sm:h-8 px-2 rounded-lg bg-white border border-black/10 text-base sm:text-xs text-black font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Regiões de Aplicação & Mapa Anatômico (Imagem 2) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-black uppercase tracking-wider">
                    Regiões & Pontos de Aplicação (Músculos Faciais)
                  </h4>
                  <p className="text-[11px] text-[#767676]">
                    Conforme Ficha Oficial de Aplicação BOTOX (Imagem 2). Total calculado em tempo real.
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-black text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm">
                  <span>Total Aplicado:</span>
                  <span className="text-sm font-black text-emerald-400">{totalUnits} U</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                {/* Tabela dos 14 Músculos (Imagem 2) */}
                <div className="lg:col-span-7 border border-black/[0.08] rounded-2xl overflow-hidden divide-y divide-black/[0.04] bg-white shadow-sm">
                  <div className="grid grid-cols-12 bg-[#f6f6f6] px-3.5 py-2 text-xs font-bold text-black">
                    <span className="col-span-7">Músculo Facial</span>
                    <span className="col-span-5 text-right">Dosagem (Unidades U)</span>
                  </div>
                  <div className="max-h-[380px] overflow-y-auto divide-y divide-black/[0.04]">
                    {muscleList.map((m) => {
                      const val = muscles[m.key];
                      const isActive = val > 0;
                      return (
                        <div
                          key={m.key}
                          className={`grid grid-cols-12 items-center px-3.5 py-1.5 text-xs transition-colors ${
                            isActive ? "bg-purple-50/20" : "hover:bg-[#fafafa]"
                          }`}
                        >
                          <div className="col-span-7 flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isActive ? "bg-purple-600" : "bg-black/20"
                              }`}
                            />
                            <span className={`font-medium ${isActive ? "text-black font-semibold" : "text-[#525252]"}`}>
                              {m.label}
                            </span>
                          </div>
                          <div className="col-span-5 flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setMuscles({
                                  ...muscles,
                                  [m.key]: Math.max(0, val - 2),
                                })
                              }
                              className="w-6 h-6 rounded bg-[#f4f4f4] hover:bg-[#e8e8e8] text-xs font-bold text-black flex items-center justify-center cursor-pointer"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={muscles[m.key]}
                              onChange={(e) =>
                                setMuscles({
                                  ...muscles,
                                  [m.key]: parseInt(e.target.value) || 0,
                                })
                              }
                              className="w-14 h-7 text-center px-1 font-bold text-black bg-[#f7f7f7] border border-black/10 rounded-lg focus:border-black outline-none text-xs"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setMuscles({
                                  ...muscles,
                                  [m.key]: val + 2,
                                })
                              }
                              className="w-6 h-6 rounded bg-[#f4f4f4] hover:bg-[#e8e8e8] text-xs font-bold text-black flex items-center justify-center cursor-pointer"
                            >
                              +
                            </button>
                            <span className="text-[11px] font-bold text-[#8f8f8f] w-3 text-right">U</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Mapa Anatômico Ilustrado: PONTOS DE APLICAÇÃO (Imagem 2) */}
                <div className="lg:col-span-5 p-4 rounded-2xl bg-[#fafafa] border border-black/[0.08] flex flex-col items-center justify-center space-y-3">
                  <div className="w-full flex items-center justify-between pb-2 border-b border-black/[0.06]">
                    <span className="text-[11px] font-bold text-black uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      Pontos de Aplicação Facial
                    </span>
                    <span className="text-[10px] text-[#8f8f8f]">Mapa Anatômico</span>
                  </div>

                  {/* Face Vector Visualizer with Real Points */}
                  <div className="relative w-[220px] h-[270px] bg-white rounded-2xl border border-black/[0.06] shadow-inner p-2 flex items-center justify-center overflow-hidden">
                    {/* SVG Base Face Contour */}
                    <svg viewBox="0 0 200 250" className="w-full h-full text-black/[0.15]">
                      {/* Cranium & Jaw Outline */}
                      <path
                        d="M 50 80 C 50 30, 150 30, 150 80 C 150 140, 140 185, 100 205 C 60 185, 50 140, 50 80 Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeDasharray="2 2"
                      />
                      {/* Neck outline */}
                      <path
                        d="M 75 195 L 70 240 M 125 195 L 130 240"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      {/* Eyebrows arch */}
                      <path d="M 65 85 Q 80 80, 93 84" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M 107 84 Q 120 80, 135 85" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      {/* Eyes */}
                      <ellipse cx="78" cy="95" rx="10" ry="5" fill="none" stroke="currentColor" strokeWidth="1.2" />
                      <ellipse cx="122" cy="95" rx="10" ry="5" fill="none" stroke="currentColor" strokeWidth="1.2" />
                      {/* Nose */}
                      <path d="M 100 90 L 98 125 Q 100 130, 106 128" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      {/* Lips */}
                      <path d="M 85 152 Q 100 148, 115 152 Q 100 162, 85 152" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      {/* Chin crease */}
                      <path d="M 92 180 Q 100 183, 108 180" fill="none" stroke="currentColor" strokeWidth="1.2" />
                    </svg>

                    {/* OVERLAID INTERACTIVE ANATOMICAL POINTS */}
                    {/* Frontal (Testa) */}
                    <div
                      title={`Frontal: ${muscles.frontal}U`}
                      className={`absolute top-10 left-[48%] -translate-x-1/2 flex items-center gap-1 transition-all ${
                        muscles.frontal > 0 ? "scale-105" : "opacity-40"
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-purple-600 text-white font-bold text-[9px] flex items-center justify-center shadow-md">
                        {muscles.frontal > 0 ? muscles.frontal : "F"}
                      </span>
                    </div>

                    {/* Prócero (Glabela Centro) */}
                    <div
                      title={`Prócero: ${muscles.procero}U`}
                      className={`absolute top-[82px] left-[50%] -translate-x-1/2 transition-all ${
                        muscles.procero > 0 ? "scale-110" : "opacity-40"
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full bg-indigo-600 text-white font-bold text-[8px] flex items-center justify-center shadow">
                        {muscles.procero > 0 ? muscles.procero : "P"}
                      </span>
                    </div>

                    {/* Corrugador Esq & Dir */}
                    <div
                      title={`Corrugador (esq): ${muscles.corrugadorEsq}U`}
                      className={`absolute top-[78px] left-[35%] transition-all ${
                        muscles.corrugadorEsq > 0 ? "scale-110" : "opacity-40"
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full bg-indigo-600 text-white font-bold text-[8px] flex items-center justify-center shadow">
                        {muscles.corrugadorEsq > 0 ? muscles.corrugadorEsq : "C"}
                      </span>
                    </div>
                    <div
                      title={`Corrugador (dir): ${muscles.corrugadorDir}U`}
                      className={`absolute top-[78px] right-[35%] transition-all ${
                        muscles.corrugadorDir > 0 ? "scale-110" : "opacity-40"
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full bg-indigo-600 text-white font-bold text-[8px] flex items-center justify-center shadow">
                        {muscles.corrugadorDir > 0 ? muscles.corrugadorDir : "C"}
                      </span>
                    </div>

                    {/* Orbicular do olho (Pés de Galinha) */}
                    <div
                      title={`Orbicular olho esq: ${muscles.orbicularOlhoEsq}U`}
                      className={`absolute top-[96px] left-[20%] transition-all ${
                        muscles.orbicularOlhoEsq > 0 ? "scale-110" : "opacity-40"
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full bg-rose-600 text-white font-bold text-[8px] flex items-center justify-center shadow">
                        {muscles.orbicularOlhoEsq > 0 ? muscles.orbicularOlhoEsq : "O"}
                      </span>
                    </div>
                    <div
                      title={`Orbicular olho dir: ${muscles.orbicularOlhoDir}U`}
                      className={`absolute top-[96px] right-[20%] transition-all ${
                        muscles.orbicularOlhoDir > 0 ? "scale-110" : "opacity-40"
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full bg-rose-600 text-white font-bold text-[8px] flex items-center justify-center shadow">
                        {muscles.orbicularOlhoDir > 0 ? muscles.orbicularOlhoDir : "O"}
                      </span>
                    </div>

                    {/* Nasal */}
                    <div
                      title={`Nasal: ${muscles.nasal}U`}
                      className={`absolute top-[122px] left-[50%] -translate-x-1/2 transition-all ${
                        muscles.nasal > 0 ? "scale-110" : "opacity-30"
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full bg-amber-600 text-white font-bold text-[8px] flex items-center justify-center shadow">
                        {muscles.nasal > 0 ? muscles.nasal : "N"}
                      </span>
                    </div>

                    {/* Mentoniano */}
                    <div
                      title={`Mentoniano: ${muscles.mentoniano}U`}
                      className={`absolute bottom-[52px] left-[50%] -translate-x-1/2 transition-all ${
                        muscles.mentoniano > 0 ? "scale-110" : "opacity-30"
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 text-white font-bold text-[8px] flex items-center justify-center shadow">
                        {muscles.mentoniano > 0 ? muscles.mentoniano : "M"}
                      </span>
                    </div>

                    {/* Masseter */}
                    <div
                      title={`Masseter: ${muscles.masseter}U`}
                      className={`absolute bottom-[70px] left-[22%] transition-all ${
                        muscles.masseter > 0 ? "scale-110" : "opacity-30"
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full bg-blue-600 text-white font-bold text-[8px] flex items-center justify-center shadow">
                        {muscles.masseter > 0 ? muscles.masseter : "M"}
                      </span>
                    </div>
                    <div
                      title={`Masseter: ${muscles.masseter}U`}
                      className={`absolute bottom-[70px] right-[22%] transition-all ${
                        muscles.masseter > 0 ? "scale-110" : "opacity-30"
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full bg-blue-600 text-white font-bold text-[8px] flex items-center justify-center shadow">
                        {muscles.masseter > 0 ? muscles.masseter : "M"}
                      </span>
                    </div>

                    {/* Platisma (Pescoço) */}
                    <div
                      title={`Platisma: ${muscles.platisma}U`}
                      className={`absolute bottom-3 left-[50%] -translate-x-1/2 transition-all ${
                        muscles.platisma > 0 ? "scale-110" : "opacity-30"
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full bg-teal-600 text-white font-bold text-[8px] flex items-center justify-center shadow">
                        {muscles.platisma > 0 ? muscles.platisma : "PL"}
                      </span>
                    </div>
                  </div>

                  <p className="text-[10px] text-[#8f8f8f] text-center">
                    Legenda: F=Frontal, P=Prócero, C=Corrugador, O=Orbicular, M=Mento/Masseter, PL=Platisma.
                  </p>
                </div>
              </div>
            </div>

            {/* Observações da Aplicação */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-black">Anotações da Aplicação</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações técnicas sobre agulhas, diluição ou recomendações pós-procedimento..."
                className="w-full p-2.5 rounded-xl bg-[#f7f7f7] border border-transparent focus:border-black text-xs text-black outline-none resize-none"
              />
            </div>

            {/* Footer */}
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
                Salvar Ficha de Botox
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}

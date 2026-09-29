"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Briefcase,
  FileText,
  Check,
  Sparkles,
  Layers,
  Droplet,
} from "lucide-react";
import { ModalPortal } from "@/components/ui/modal-portal";
import { PatientRecord, ClinicalProcedureType } from "./customer-profile-modal";

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientToEdit?: PatientRecord | null;
  onSave: (patient: PatientRecord, openAnamneseNow: boolean) => void;
}

export function CustomerFormModal({
  isOpen,
  onClose,
  patientToEdit,
  onSave,
}: CustomerFormModalProps) {
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("Feminino");
  const [location, setLocation] = useState("");
  const [profession, setProfession] = useState("");
  const [status, setStatus] = useState<PatientRecord["status"]>("Ativo");
  const [notes, setNotes] = useState("");
  const [activeProcedures, setActiveProcedures] = useState<ClinicalProcedureType[]>(["botox"]);
  const [openAnamneseAfter, setOpenAnamneseAfter] = useState(false);

  useEffect(() => {
    if (patientToEdit) {
      setName(patientToEdit.name);
      setCpf(patientToEdit.cpf);
      setPhone(patientToEdit.phone);
      setEmail(patientToEdit.email);
      setBirthDate(patientToEdit.birthDate);
      setGender(patientToEdit.gender);
      setLocation(patientToEdit.location);
      setProfession(patientToEdit.profession);
      setStatus(patientToEdit.status);
      setNotes(patientToEdit.notes || "");
      setActiveProcedures(
        patientToEdit.activeProcedures ?? [
          ...(patientToEdit.botoxRecord ? ["botox" as const] : []),
          ...(patientToEdit.hofRecord ? ["hof" as const] : []),
          ...(patientToEdit.bioRecord ? ["bio" as const] : []),
        ]
      );
      setOpenAnamneseAfter(false);
    } else {
      setName("");
      setCpf("");
      setPhone("");
      setEmail("");
      setBirthDate("");
      setGender("Feminino");
      setLocation("São Paulo, SP");
      setProfession("");
      setStatus("Ativo");
      setNotes("");
      setActiveProcedures(["botox"]); // Seleciona apenas 1 procedimento por padrão (evita poluir abas)
      setOpenAnamneseAfter(true); // By default for new patients, suggest opening anamnese
    }
  }, [patientToEdit, isOpen]);

  if (!isOpen) return null;

  const toggleProcedure = (proc: ClinicalProcedureType) => {
    if (activeProcedures.includes(proc)) {
      setActiveProcedures(activeProcedures.filter((p) => p !== proc));
    } else {
      setActiveProcedures([...activeProcedures, proc]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Calculate approximate age if birthDate is provided
    let age = 30;
    if (birthDate) {
      const year = parseInt(birthDate.slice(-4));
      if (!isNaN(year) && year > 1920 && year < 2026) {
        age = 2026 - year;
      }
    }

    const patientData: PatientRecord = {
      id: patientToEdit ? patientToEdit.id : `pat-${Date.now()}`,
      name: name.trim(),
      cpf: cpf.trim() || "000.000.000-00",
      phone: phone.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, ".")}@gmail.com`,
      birthDate: birthDate.trim() || "15/05/1994",
      age: patientToEdit ? patientToEdit.age : age,
      gender,
      location: location.trim() || "São Paulo, SP",
      profession: profession.trim() || "Profissional Liberal",
      status,
      totalSpent: patientToEdit ? patientToEdit.totalSpent : 0,
      proceduresCount: patientToEdit ? patientToEdit.proceduresCount : 0,
      lastProcedureDate: patientToEdit ? patientToEdit.lastProcedureDate : "Hoje",
      notes: notes.trim(),
      activeProcedures,
      anamnese: patientToEdit?.anamnese,
      botoxRecord: patientToEdit?.botoxRecord,
      hofRecord: patientToEdit?.hofRecord,
      bioRecord: patientToEdit?.bioRecord,
      proceduresHistory: patientToEdit?.proceduresHistory || [],
    };

    onSave(patientData, openAnamneseAfter && !patientToEdit);
  };

  return (
    <ModalPortal isOpen={isOpen}>
      <div
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200 select-none"
        style={{
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-t-[28px] sm:rounded-[24px] border-t sm:border border-black/[0.08] shadow-[0_24px_48px_-16px_rgba(0,0,0,0.25)] w-full max-w-[620px] max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-150"
        >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-black/[0.06] bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-black tracking-tight">
                {patientToEdit ? "Editar Cadastro de Cliente" : "Novo Cliente / Paciente"}
              </h2>
              <p className="text-xs text-[#767676]">
                {patientToEdit
                  ? "Atualize as informações cadastrais e de contato do cliente."
                  : "Cadastre um novo paciente para agendamentos e prontuário estético."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f4f4f4] hover:bg-[#ebebeb] flex items-center justify-center text-[#8f8f8f] hover:text-black transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Nome Completo */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-black">Nome Completo *</label>
            <input
              type="text"
              required
              placeholder="Ex: Beatriz Mendonça de Oliveira"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 sm:h-10 px-3.5 rounded-xl bg-[#f7f7f7] border border-transparent focus:border-black text-base sm:text-xs text-black outline-none transition-all placeholder:text-[#8f8f8f]"
            />
          </div>

          {/* CPF e Telefone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-black">CPF *</label>
              <input
                type="text"
                required
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                className="w-full h-11 sm:h-10 px-3.5 rounded-xl bg-[#f7f7f7] border border-transparent focus:border-black text-base sm:text-xs text-black outline-none transition-all placeholder:text-[#8f8f8f]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-black">Telefone / WhatsApp *</label>
              <input
                type="text"
                required
                placeholder="(11) 98765-4321"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-11 sm:h-10 px-3.5 rounded-xl bg-[#f7f7f7] border border-transparent focus:border-black text-base sm:text-xs text-black outline-none transition-all placeholder:text-[#8f8f8f]"
              />
            </div>
          </div>

          {/* E-mail e Data de Nascimento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-black">E-mail</label>
              <input
                type="email"
                placeholder="paciente@exemplo.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 sm:h-10 px-3.5 rounded-xl bg-[#f7f7f7] border border-transparent focus:border-black text-base sm:text-xs text-black outline-none transition-all placeholder:text-[#8f8f8f]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-black">Data de Nascimento</label>
              <input
                type="text"
                placeholder="DD/MM/AAAA (ex: 22/08/1992)"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full h-11 sm:h-10 px-3.5 rounded-xl bg-[#f7f7f7] border border-transparent focus:border-black text-base sm:text-xs text-black outline-none transition-all placeholder:text-[#8f8f8f]"
              />
            </div>
          </div>

          {/* Gênero e Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-black">Gênero</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full h-11 sm:h-10 px-3 rounded-xl bg-[#f7f7f7] border border-transparent focus:border-black text-base sm:text-xs text-black outline-none transition-all"
              >
                <option value="Feminino">Feminino</option>
                <option value="Masculino">Masculino</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-black">Status de Atendimento</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full h-11 sm:h-10 px-3 rounded-xl bg-[#f7f7f7] border border-transparent focus:border-black text-base sm:text-xs text-black outline-none transition-all"
              >
                <option value="Ativo">Ativo</option>
                <option value="Em Tratamento">Em Tratamento</option>
                <option value="Retorno Agendado">Retorno Agendado</option>
                <option value="Inativo">Inativo</option>
              </select>
            </div>
          </div>

          {/* Cidade e Profissão */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-black">Cidade / UF</label>
              <input
                type="text"
                placeholder="Ex: São Paulo, SP"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full h-11 sm:h-10 px-3.5 rounded-xl bg-[#f7f7f7] border border-transparent focus:border-black text-base sm:text-xs text-black outline-none transition-all placeholder:text-[#8f8f8f]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-black">Profissão</label>
              <input
                type="text"
                placeholder="Ex: Arquiteta / Advogada"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                className="w-full h-11 sm:h-10 px-3.5 rounded-xl bg-[#f7f7f7] border border-transparent focus:border-black text-base sm:text-xs text-black outline-none transition-all placeholder:text-[#8f8f8f]"
              />
            </div>
          </div>

          {/* Procedimento Inicial / Fichas do Paciente (Item 1) */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-[#fafafa] border border-black/[0.08]">
            <div>
              <label className="text-xs font-bold text-black block">
                Procedimento(s) / Fichas Clínicas Ativas *
              </label>
              <span className="text-[11px] text-[#767676]">
                Selecione o procedimento que este cliente irá realizar para exibir apenas as fichas necessárias no prontuário.
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-1">
              <button
                type="button"
                onClick={() => toggleProcedure("botox")}
                className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  activeProcedures.includes("botox")
                    ? "bg-black text-white border-black shadow-sm"
                    : "bg-white text-black border-black/10 hover:border-black/30"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="text-xs font-semibold">Ficha de Botox</span>
                </div>
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center border text-[10px] font-bold ${
                    activeProcedures.includes("botox")
                      ? "bg-white text-black border-white"
                      : "border-black/30"
                  }`}
                >
                  {activeProcedures.includes("botox") && "✓"}
                </div>
              </button>

              <button
                type="button"
                onClick={() => toggleProcedure("hof")}
                className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  activeProcedures.includes("hof")
                    ? "bg-black text-white border-black shadow-sm"
                    : "bg-white text-black border-black/10 hover:border-black/30"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5" />
                  <span className="text-xs font-semibold">Planejamento HOF</span>
                </div>
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center border text-[10px] font-bold ${
                    activeProcedures.includes("hof")
                      ? "bg-white text-black border-white"
                      : "border-black/30"
                  }`}
                >
                  {activeProcedures.includes("hof") && "✓"}
                </div>
              </button>

              <button
                type="button"
                onClick={() => toggleProcedure("bio")}
                className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  activeProcedures.includes("bio")
                    ? "bg-black text-white border-black shadow-sm"
                    : "bg-white text-black border-black/10 hover:border-black/30"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Droplet className="w-3.5 h-3.5" />
                  <span className="text-xs font-semibold">Ficha Bioestimulador</span>
                </div>
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center border text-[10px] font-bold ${
                    activeProcedures.includes("bio")
                      ? "bg-white text-black border-white"
                      : "border-black/30"
                  }`}
                >
                  {activeProcedures.includes("bio") && "✓"}
                </div>
              </button>
            </div>
          </div>

          {/* Observações Gerais */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-black">
              Observações Gerais & Preferências
            </label>
            <textarea
              rows={2}
              placeholder="Indicações, preferências de horário, canais de contato preferenciais..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 rounded-xl bg-[#f7f7f7] border border-transparent focus:border-black text-xs text-black outline-none transition-all placeholder:text-[#8f8f8f] resize-none"
            />
          </div>

          {/* Option: Preencher Anamnese Agora (for new clients) */}
          {!patientToEdit && (
            <div
              onClick={() => setOpenAnamneseAfter(!openAnamneseAfter)}
              className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                openAnamneseAfter
                  ? "bg-black/[0.03] border-black text-black"
                  : "bg-white border-black/[0.1] hover:border-black text-[#525252]"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                  openAnamneseAfter
                    ? "bg-black border-black text-white"
                    : "border-black/30 bg-white"
                }`}
              >
                {openAnamneseAfter && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <div>
                <span className="text-xs font-semibold text-black block">
                  Abrir Ficha de Anamnese logo após salvar
                </span>
                <span className="text-[11px] text-[#767676]">
                  Abre imediatamente o formulário de avaliação clínica para este novo paciente.
                </span>
              </div>
            </div>
          )}

          {/* Submit buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-black/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="h-11 sm:h-10 px-4 rounded-xl text-xs font-medium text-[#767676] hover:text-black hover:bg-[#f4f4f4] transition-colors cursor-pointer text-center active:scale-95"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="h-11 sm:h-10 px-5 rounded-xl bg-black hover:bg-[#262626] text-white text-xs font-semibold shadow-sm transition-all duration-150 active:scale-[0.98] cursor-pointer w-full sm:w-auto"
            >
              {patientToEdit ? "Salvar Alterações" : "Cadastrar Cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  </ModalPortal>
);
}

"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  AlertTriangle,
  ShieldAlert,
  FileCheck,
  Upload,
  Eraser,
  PenTool,
  Check,
  AlertCircle,
  Stethoscope,
  Info,
  Calendar,
  Instagram,
  User,
  MapPin,
  Heart,
  Droplet,
  Syringe,
  Printer,
  ArrowLeft,
} from "lucide-react";
import { ModalPortal } from "@/components/ui/modal-portal";

export interface AnamneseData {
  id?: string;
  clientId: string;
  clientName: string;
  updatedAt: string;
  status: "completed" | "pending";

  // Dados complementares da Ficha do Paciente (Imagem 1 e 5)
  rg?: string;
  estadoCivil?: string;
  instagram?: string;
  cidadeAtendimento?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cep?: string;
  motivoConsulta?: string;
  expectativaTratamento?: string;

  // Queixa e histórico clínico (Imagens 1 e 5)
  queixaPrincipal: string;
  emTratamentoMedico: boolean;
  qualTratamentoMedico?: string;
  motivoTratamentoMedico?: string;

  usoCorticoide?: boolean;
  corticoideAntiHistaminico?: boolean;
  corticoideEsteroides?: boolean;
  corticoideAntiInflamatorio?: boolean;
  corticoideOutros?: boolean;
  corticoideMotivo?: string;

  doadorSangue?: boolean;
  quandoUltimaDoacao?: string;

  vacinaUltimos30Dias?: boolean;

  anestesiaGeral: boolean;
  cirurgiaPrevia: boolean;
  qualCirurgia?: string;
  anestesiaOdontologica: boolean;
  alergiaAnestesia: boolean;

  // Alergias e medicação (Destaque visual obrigatório)
  alergiaMedicamento: boolean;
  qualAlergiaMedicamento?: string;
  alergiaAlimento: boolean;
  qualAlergiaAlimento?: string;
  medicamentoPressao: boolean;
  qualMedicamentoPressao?: string;

  // Condições de saúde sistêmicas
  alteracaoCardiologica: boolean;
  proteseCardiaca: boolean;
  diabetico: boolean;
  convulsoesEpilepsia: boolean;
  disfuncaoRenal: boolean;
  qualDisfuncaoRenal?: string;
  coagulacaoSanguinea: boolean;
  usoAnticoagulante: boolean;
  gravidaLactante: boolean;
  herpesLabial: boolean;
  tratamentoEsteticoPrevio: boolean;
  experienciaTratamentoEstetico?: string;

  // Tipo de pele e Fotoenvelhecimento
  tipoPele: "Normal" | "Oleosa" | "Alípica" | "Seca" | "Hidratada" | "Mista" | "";
  fotoenvelhecimento: "Leve" | "Moderado" | "Avançado" | "Severo" | "";

  // Termo de consentimento livre e esclarecido
  termoConsentimentoAceito: boolean;
  assinaturaUrl?: string;
  anexoFichaUrl?: string;
  anexoFichaNome?: string;
}

interface AnamneseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  initialData?: AnamneseData;
  onSave: (data: AnamneseData) => void;
}

export function AnamneseFormModal({
  isOpen,
  onClose,
  clientId,
  clientName,
  initialData,
  onSave,
}: AnamneseFormModalProps) {
  const [formData, setFormData] = useState<AnamneseData>(() => {
    if (initialData) return initialData;
    return {
      clientId,
      clientName,
      updatedAt: new Date().toLocaleDateString("pt-BR"),
      status: "completed",

      rg: "",
      estadoCivil: "Solteira(o)",
      instagram: "",
      cidadeAtendimento: "São Paulo",
      logradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      cep: "",
      motivoConsulta: "",
      expectativaTratamento: "",

      queixaPrincipal: "",
      emTratamentoMedico: false,
      qualTratamentoMedico: "",
      motivoTratamentoMedico: "",

      usoCorticoide: false,
      corticoideAntiHistaminico: false,
      corticoideEsteroides: false,
      corticoideAntiInflamatorio: false,
      corticoideOutros: false,
      corticoideMotivo: "",

      doadorSangue: false,
      quandoUltimaDoacao: "",

      vacinaUltimos30Dias: false,

      anestesiaGeral: false,
      cirurgiaPrevia: false,
      qualCirurgia: "",
      anestesiaOdontologica: false,
      alergiaAnestesia: false,

      alergiaMedicamento: false,
      qualAlergiaMedicamento: "",
      alergiaAlimento: false,
      qualAlergiaAlimento: "",
      medicamentoPressao: false,
      qualMedicamentoPressao: "",

      alteracaoCardiologica: false,
      proteseCardiaca: false,
      diabetico: false,
      convulsoesEpilepsia: false,
      disfuncaoRenal: false,
      qualDisfuncaoRenal: "",
      coagulacaoSanguinea: false,
      usoAnticoagulante: false,
      gravidaLactante: false,
      herpesLabial: false,
      tratamentoEsteticoPrevio: false,
      experienciaTratamentoEstetico: "",

      tipoPele: "Mista",
      fotoenvelhecimento: "Leve",

      termoConsentimentoAceito: false,
      assinaturaUrl: "",
      anexoFichaUrl: "",
      anexoFichaNome: "",
    };
  });

  const [consentError, setConsentError] = useState(false);
  const [signatureMode, setSignatureMode] = useState<"draw" | "upload">("draw");
  const [isPrintPreview, setIsPrintPreview] = useState(false);

  // Signature canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData(initialData);
      if (initialData.assinaturaUrl) {
        setHasDrawnSignature(true);
      }
    }
  }, [isOpen, initialData]);

  // Handle Canvas Drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    isDrawing.current = true;
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawnSignature(true);
  };

  const stopDrawing = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL("image/png");
      setFormData((prev) => ({ ...prev, assinaturaUrl: dataUrl }));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnSignature(false);
    setFormData((prev) => ({ ...prev, assinaturaUrl: "" }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setFormData((prev) => ({
        ...prev,
        anexoFichaUrl: result,
        anexoFichaNome: file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.termoConsentimentoAceito) {
      setConsentError(true);
      const element = document.getElementById("consentimento-section");
      element?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    setConsentError(false);
    const updated: AnamneseData = {
      ...formData,
      clientId,
      clientName,
      updatedAt: new Date().toLocaleDateString("pt-BR"),
      status: "completed",
    };

    onSave(updated);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalPortal isOpen={isOpen}>
      <div
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200 select-none"
        style={{
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-t-[28px] sm:rounded-[24px] border-t sm:border border-black/[0.08] shadow-[0_24px_48px_-16px_rgba(0,0,0,0.25)] w-full max-w-[860px] h-[95vh] sm:h-auto sm:max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-black/[0.06] bg-white sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-black tracking-tight">
                    Ficha do Paciente & Anamnese Clínica
                  </h2>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Modelo HOF
                  </span>
                </div>
                <p className="text-xs text-[#767676]">
                  Paciente: <strong className="text-black font-semibold">{clientName}</strong> • Avaliação Estética Avançada
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPrintPreview(!isPrintPreview)}
                className="h-8 px-2.5 rounded-lg border border-black/10 hover:bg-[#f4f4f4] text-xs font-semibold text-black flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-black" />
                <span className="hidden sm:inline">
                  {isPrintPreview ? "Modo Formulário" : "Modelo Impresso (Ficha 1)"}
                </span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#f4f4f4] hover:bg-[#ebebeb] flex items-center justify-center text-[#8f8f8f] hover:text-black transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {isPrintPreview ? (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#f2f2f2] space-y-4">
              <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-black/[0.08] shadow-sm">
                <div className="flex items-center gap-2">
                  <Printer className="w-4 h-4 text-purple-700" />
                  <span className="text-xs font-bold text-black">
                    Visualização Fiel ao Modelo Impresso (Imagem 1: Ficha do Paciente + Anamnese + Termo)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="h-8 px-3.5 rounded-lg bg-black text-white text-xs font-semibold hover:bg-[#262626] transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimir Ficha (PDF)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPrintPreview(false)}
                    className="h-8 px-3 rounded-lg bg-[#f4f4f4] text-black text-xs font-semibold hover:bg-[#e8e8e8] transition-colors cursor-pointer"
                  >
                    Voltar ao Formulário
                  </button>
                </div>
              </div>

              {/* Exact Paper Replica */}
              <div className="bg-white max-w-[760px] mx-auto p-6 sm:p-10 rounded-xl border border-black/10 shadow-lg text-black font-sans space-y-5">
                {/* Header Sheet 1 */}
                <div className="flex items-baseline justify-between border-b border-black/10 pb-2">
                  <h1 className="text-2xl font-serif font-bold text-purple-900 tracking-tight">
                    Ficha do Paciente
                  </h1>
                  <span className="text-xs text-gray-700">
                    Data: <span className="font-semibold text-black underline underline-offset-4">{formData.updatedAt}</span>
                  </span>
                </div>

                {/* Patient Information Form Grid */}
                <div className="space-y-1.5 text-xs text-gray-800">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-gray-700 shrink-0">Nome:</span>
                    <span className="flex-1 border-b border-gray-400 font-bold text-black pb-0.5">{clientName}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-gray-700 shrink-0">Endereço:</span>
                    <span className="flex-1 border-b border-gray-400 text-black pb-0.5">{formData.logradouro || "Rua dos Pinheiros"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-gray-700 shrink-0">CPF:</span>
                      <span className="flex-1 border-b border-gray-400 text-black pb-0.5">342.891.108-45</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-gray-700 shrink-0">Número:</span>
                      <span className="flex-1 border-b border-gray-400 text-black pb-0.5">{formData.numero || "100"}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-gray-700 shrink-0">RG:</span>
                      <span className="flex-1 border-b border-gray-400 text-black pb-0.5">{formData.rg || "34.289.110-8"}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-gray-700 shrink-0">Complemento:</span>
                      <span className="flex-1 border-b border-gray-400 text-black pb-0.5">{formData.complemento || "Apto 42"}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-gray-700 shrink-0">Sexo:</span>
                      <span className="flex-1 border-b border-gray-400 text-black pb-0.5">Feminino</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-gray-700 shrink-0">Bairro:</span>
                      <span className="flex-1 border-b border-gray-400 text-black pb-0.5">{formData.bairro || "Jardins"}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-gray-700 shrink-0">Estado Civil:</span>
                      <span className="flex-1 border-b border-gray-400 text-black pb-0.5">{formData.estadoCivil || "Solteira(o)"}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-gray-700 shrink-0">Cidade:</span>
                      <span className="flex-1 border-b border-gray-400 text-black pb-0.5">São Paulo</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-gray-700 shrink-0">Data de Nascimento:</span>
                      <span className="flex-1 border-b border-gray-400 text-black pb-0.5">14/07/1991</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-gray-700 shrink-0">Estado:</span>
                      <span className="flex-1 border-b border-gray-400 text-black pb-0.5">SP</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-gray-700 shrink-0">Cidade de Atendimento:</span>
                      <span className="flex-1 border-b border-gray-400 text-black pb-0.5">{formData.cidadeAtendimento || "São Paulo"}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-gray-700 shrink-0">Celular:</span>
                      <span className="flex-1 border-b border-gray-400 text-black pb-0.5">(11) 98124-5510</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-gray-700 shrink-0">CEP:</span>
                      <span className="flex-1 border-b border-gray-400 text-black pb-0.5">{formData.cep || "01400-000"}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-gray-700 shrink-0">E-mail:</span>
                      <span className="flex-1 border-b border-gray-400 text-black pb-0.5">beatriz.mendonca@gmail.com</span>
                    </div>
                  </div>
                </div>

                {/* Section Anamnese 17 Questions */}
                <div className="pt-2 border-t border-black/10 space-y-1.5">
                  <h2 className="text-xl font-serif font-bold text-purple-900 tracking-tight">
                    Anamnese
                  </h2>
                  <div className="space-y-1 text-xs text-gray-800">
                    {[
                      { q: "Queixa principal:", val: formData.queixaPrincipal, resp: true },
                      { q: "Está em tratamento médico? Qual?", val: formData.qualTratamentoMedico, resp: formData.emTratamentoMedico },
                      { q: "Já se submeteu a anestesia geral?", val: "", resp: formData.anestesiaGeral },
                      { q: "Já se submeteu a alguma cirurgia? Qual?", val: formData.qualCirurgia, resp: formData.cirurgiaPrevia },
                      { q: "Já se submete a anestesia odontológica?", val: "", resp: formData.anestesiaOdontologica },
                      { q: "Já apresentou alguma reação alérgica durante a anestesia?", val: "", resp: formData.alergiaAnestesia },
                      { q: "Possui alergia a algum tipo de medicamento? Qual?", val: formData.qualAlergiaMedicamento, resp: formData.alergiaMedicamento },
                      { q: "Possui alergia a algum tipo de alimento? Qual?", val: formData.qualAlergiaAlimento, resp: formData.alergiaAlimento },
                      { q: "Possui alguma alteração cardiológica?", val: "", resp: formData.alteracaoCardiologica },
                      { q: "Toma algum medicamento para a pressão arterial? Qual?", val: formData.qualMedicamentoPressao, resp: formData.medicamentoPressao },
                      { q: "Possui alguma prótese cardíaca?", val: "", resp: formData.proteseCardiaca },
                      { q: "É diabético?", val: "", resp: formData.diabetico },
                      { q: "Tem convulsões ou epilepsia?", val: "", resp: formData.convulsoesEpilepsia },
                      { q: "Tem alguma disfunção renal? Qual?", val: formData.qualDisfuncaoRenal, resp: formData.disfuncaoRenal },
                      { q: "Tem problemas de coagulação sanguínea?", val: "", resp: formData.coagulacaoSanguinea },
                      { q: "Está grávida ou lactante?", val: "", resp: formData.gravidaLactante },
                      { q: "Já teve herpes labial?", val: "", resp: formData.herpesLabial },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 border-b border-gray-100 py-0.5">
                        <div className="flex-1 flex items-baseline gap-1">
                          <span className="font-medium text-black">{item.q}</span>
                          {item.val && <span className="font-semibold text-purple-950 underline">{item.val}</span>}
                        </div>
                        <div className="flex items-center gap-1 font-mono text-[10px] shrink-0">
                          <span className={`w-4 h-4 rounded border flex items-center justify-center font-bold ${item.resp ? "bg-purple-900 text-white border-purple-900" : "border-gray-400 text-gray-500"}`}>
                            S
                          </span>
                          <span className={`w-4 h-4 rounded border flex items-center justify-center font-bold ${!item.resp ? "bg-purple-900 text-white border-purple-900" : "border-gray-400 text-gray-500"}`}>
                            N
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section Termo de Consentimento */}
                <div className="pt-2 border-t border-black/10 space-y-1.5">
                  <h2 className="text-sm font-serif font-bold text-purple-900 tracking-tight text-center">
                    Termo de Consentimento Livre e Esclarecido
                  </h2>
                  <p className="text-[9.5px] text-gray-700 leading-tight text-justify">
                    Os procedimentos de "tratamento em face com toxina botulínica A" e "preenchimento facial com ácido hialurônico" foram explicados pelo profissional e eu entendi a natureza e consequência dos mesmos. Os seguintes pontos me foram especialmente esclarecidos:
                    1: Apesar da segurança e longa experiência com o uso da toxina botulínica A, alguns efeitos adversos podem ocorrer após a aplicação, como: eritema, pápula, edema, hematoma, assimetria, ptose palpebral. 2: Apesar da segurança com o uso de ácido hialurônico, reações como edema, hematomas, nódulos e discromias podem durar mais tempo. 3: Reações como granuloma, necrose tecidual ou oclusão vascular acidental foram esclarecidas. 4: Pacientes com infecções cutâneas, herpes ativa ou gestantes não devem se submeter aos procedimentos. 5: Entendi que a duração dos resultados depende do metabolismo e autorizo a utilização de imagem em prontuário clínico.
                  </p>

                  <div className="pt-3 grid grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-1">
                        <span className="font-semibold text-gray-700">Nome do paciente:</span>
                        <span className="border-b border-gray-400 flex-1 font-bold text-black">{clientName}</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="font-semibold text-gray-700">Identidade nº:</span>
                        <span className="border-b border-gray-400 flex-1 text-black">{formData.rg || "34.289.110-8"}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-baseline gap-1">
                        <span className="font-semibold text-gray-700">Data:</span>
                        <span className="border-b border-gray-400 flex-1 text-black">{formData.updatedAt}</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="font-semibold text-gray-700">Assinatura:</span>
                        <div className="border-b border-gray-400 flex-1 text-center font-serif italic text-purple-900">
                          {formData.assinaturaUrl ? (
                            <img src={formData.assinaturaUrl} alt="Assinatura" className="h-6 mx-auto inline-block" />
                          ) : (
                            <span>{clientName}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Form Scrollable Body */
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-7">
            {/* SEÇÃO 1: COMPLEMENTO FICHA DO PACIENTE (Imagem 1 e 5) */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 border-b border-black/[0.06] pb-2">
                <span className="w-5 h-5 rounded-full bg-black text-white text-[11px] font-bold flex items-center justify-center">
                  1
                </span>
                <h3 className="text-xs sm:text-sm font-bold text-black tracking-tight uppercase">
                  Identificação do Paciente & Motivo da Consulta
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-black">RG</label>
                  <input
                    type="text"
                    placeholder="00.000.000-0"
                    value={formData.rg || ""}
                    onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl bg-[#f7f7f7] border border-transparent focus:border-black text-xs text-black outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-black">Estado Civil</label>
                  <select
                    value={formData.estadoCivil || "Solteira(o)"}
                    onChange={(e) => setFormData({ ...formData, estadoCivil: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl bg-[#f7f7f7] border border-transparent focus:border-black text-xs text-black outline-none"
                  >
                    <option value="Solteira(o)">Solteira(o)</option>
                    <option value="Casada(o)">Casada(o)</option>
                    <option value="Divorciada(o)">Divorciada(o)</option>
                    <option value="União Estável">União Estável</option>
                    <option value="Viúva(o)">Viúva(o)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-black">Instagram</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-2.5 text-[#8f8f8f]">@</span>
                    <input
                      type="text"
                      placeholder="perfil.paciente"
                      value={formData.instagram || ""}
                      onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                      className="w-full h-9 pl-7 pr-3 rounded-xl bg-[#f7f7f7] border border-transparent focus:border-black text-xs text-black outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Endereço detalhado (Imagem 1) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-black">Endereço (Rua/Avenida)</label>
                  <input
                    type="text"
                    placeholder="Rua das Acácias"
                    value={formData.logradouro || ""}
                    onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl bg-[#f7f7f7] border border-transparent focus:border-black text-xs text-black outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-black">Número / Compl.</label>
                  <input
                    type="text"
                    placeholder="123, Apto 45"
                    value={formData.numero || ""}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl bg-[#f7f7f7] border border-transparent focus:border-black text-xs text-black outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-black">Bairro / CEP</label>
                  <input
                    type="text"
                    placeholder="Jardins • 01400-000"
                    value={formData.bairro || ""}
                    onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl bg-[#f7f7f7] border border-transparent focus:border-black text-xs text-black outline-none"
                  />
                </div>
              </div>

              {/* Motivo e O que espera (Imagem 5) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-black">
                    Motivo da Consulta *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Harmonização facial, rejuvenescimento, preenchimento labial"
                    value={formData.motivoConsulta || ""}
                    onChange={(e) => setFormData({ ...formData, motivoConsulta: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl bg-[#f7f7f7] border border-transparent focus:border-black text-xs text-black outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-black">
                    O que espera do tratamento? *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Resultado sutil e natural, melhorar contorno mandibular"
                    value={formData.expectativaTratamento || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, expectativaTratamento: e.target.value })
                    }
                    className="w-full h-9 px-3 rounded-xl bg-[#f7f7f7] border border-transparent focus:border-black text-xs text-black outline-none"
                  />
                </div>
              </div>

              {/* Queixa principal detalhada */}
              <div className="space-y-1 pt-1">
                <label className="text-xs font-semibold text-black">
                  Queixa Principal Detalhada *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Descreva detalhadamente o incômodo estético do paciente..."
                  value={formData.queixaPrincipal}
                  onChange={(e) => setFormData({ ...formData, queixaPrincipal: e.target.value })}
                  className="w-full p-3 rounded-xl bg-[#f7f7f7] border border-transparent focus:border-black text-xs text-black outline-none resize-none"
                />
              </div>
            </div>

            {/* SEÇÃO 2: HISTÓRICO MÉDICO & MEDICAÇÃO (Imagem 1 & 5) */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 border-b border-black/[0.06] pb-2">
                <span className="w-5 h-5 rounded-full bg-black text-white text-[11px] font-bold flex items-center justify-center">
                  2
                </span>
                <h3 className="text-xs sm:text-sm font-bold text-black tracking-tight uppercase">
                  Histórico Clínico & Uso de Medicamentos
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Tratamento médico atual */}
                <div className="p-3 rounded-xl bg-[#fafafa] border border-black/[0.05] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-black">
                      Está em tratamento médico atualmente?
                    </span>
                    <ToggleSwitch
                      checked={formData.emTratamentoMedico}
                      onChange={(c) => setFormData({ ...formData, emTratamentoMedico: c })}
                    />
                  </div>
                  {formData.emTratamentoMedico && (
                    <input
                      type="text"
                      placeholder="Qual tratamento médico e motivo?"
                      value={formData.qualTratamentoMedico || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, qualTratamentoMedico: e.target.value })
                      }
                      className="w-full h-8 px-2.5 rounded-lg bg-white border border-black/20 text-xs text-black outline-none animate-in fade-in"
                    />
                  )}
                </div>

                {/* Medicamentos à base de corticoide (Imagem 5) */}
                <div className="p-3 rounded-xl bg-[#fafafa] border border-black/[0.05] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-black">
                      Faz uso de medicamentos à base de corticoide?
                    </span>
                    <ToggleSwitch
                      checked={!!formData.usoCorticoide}
                      onChange={(c) => setFormData({ ...formData, usoCorticoide: c })}
                    />
                  </div>
                  {formData.usoCorticoide && (
                    <div className="space-y-1.5 pt-1 border-t border-black/[0.06] animate-in fade-in">
                      <span className="text-[11px] text-[#767676] block">Selecione o tipo:</span>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {[
                          { key: "corticoideAntiHistaminico", label: "Anti-histamínico" },
                          { key: "corticoideEsteroides", label: "Esteroides" },
                          { key: "corticoideAntiInflamatorio", label: "Anti-inflamatório" },
                          { key: "corticoideOutros", label: "Outros" },
                        ].map((item) => (
                          <label key={item.key} className="inline-flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!formData[item.key as keyof AnamneseData]}
                              onChange={(e) =>
                                setFormData({ ...formData, [item.key]: e.target.checked })
                              }
                              className="rounded border-gray-300"
                            />
                            <span>{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Doador de sangue (Imagem 5) */}
                <div className="p-3 rounded-xl bg-[#fafafa] border border-black/[0.05] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-black">
                      É doador de sangue?
                    </span>
                    <ToggleSwitch
                      checked={!!formData.doadorSangue}
                      onChange={(c) => setFormData({ ...formData, doadorSangue: c })}
                    />
                  </div>
                  {formData.doadorSangue && (
                    <input
                      type="text"
                      placeholder="Quando foi a última doação? (Mês/Ano)"
                      value={formData.quandoUltimaDoacao || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, quandoUltimaDoacao: e.target.value })
                      }
                      className="w-full h-8 px-2.5 rounded-lg bg-white border border-black/20 text-xs text-black outline-none animate-in fade-in"
                    />
                  )}
                </div>

                {/* Vacina nos últimos 30 dias (Imagem 5) */}
                <div className="p-3 rounded-xl bg-[#fafafa] border border-black/[0.05] flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-medium text-black">
                      Tomou alguma vacina nos últimos 30 dias?
                    </span>
                    <span className="text-[10px] text-[#8f8f8f] block">
                      Atenção para janela imunológica de preenchedores.
                    </span>
                  </div>
                  <ToggleSwitch
                    checked={!!formData.vacinaUltimos30Dias}
                    onChange={(c) => setFormData({ ...formData, vacinaUltimos30Dias: c })}
                  />
                </div>

                {/* Anestesia Geral (Imagem 1) */}
                <div className="p-3 rounded-xl bg-[#fafafa] border border-black/[0.05] flex items-center justify-between">
                  <span className="text-xs font-medium text-black">
                    Já se submeteu a anestesia geral?
                  </span>
                  <ToggleSwitch
                    checked={formData.anestesiaGeral}
                    onChange={(c) => setFormData({ ...formData, anestesiaGeral: c })}
                  />
                </div>

                {/* Cirurgia prévia (Imagem 1) */}
                <div className="p-3 rounded-xl bg-[#fafafa] border border-black/[0.05] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-black">
                      Já se submeteu a alguma cirurgia?
                    </span>
                    <ToggleSwitch
                      checked={formData.cirurgiaPrevia}
                      onChange={(c) => setFormData({ ...formData, cirurgiaPrevia: c })}
                    />
                  </div>
                  {formData.cirurgiaPrevia && (
                    <input
                      type="text"
                      placeholder="Qual(is) cirurgia(s)?"
                      value={formData.qualCirurgia || ""}
                      onChange={(e) => setFormData({ ...formData, qualCirurgia: e.target.value })}
                      className="w-full h-8 px-2.5 rounded-lg bg-white border border-black/20 text-xs text-black outline-none animate-in fade-in"
                    />
                  )}
                </div>

                {/* Anestesia odontológica (Imagem 1) */}
                <div className="p-3 rounded-xl bg-[#fafafa] border border-black/[0.05] flex items-center justify-between">
                  <span className="text-xs font-medium text-black">
                    Já se submeteu a anestesia odontológica?
                  </span>
                  <ToggleSwitch
                    checked={formData.anestesiaOdontologica}
                    onChange={(c) => setFormData({ ...formData, anestesiaOdontologica: c })}
                  />
                </div>

                {/* Reação alérgica durante anestesia (Imagem 1 - Crítico) */}
                <div className="p-3 rounded-xl bg-[#fafafa] border border-black/[0.05] flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-black">
                      Reação alérgica durante anestesia?
                    </span>
                    <span className="text-[10px] text-[#8f8f8f] block">
                      Crítico para uso de anestésicos locais.
                    </span>
                  </div>
                  <ToggleSwitch
                    isCritical
                    checked={formData.alergiaAnestesia}
                    onChange={(c) => setFormData({ ...formData, alergiaAnestesia: c })}
                  />
                </div>
              </div>
            </div>

            {/* SEÇÃO 3: ALERGIAS E MEDICAÇÃO (DESTAQUE VISUAL OBRIGATÓRIO - Imagens 1 & 5) */}
            <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-rose-50/40 border-2 border-rose-200/80 shadow-sm">
              <div className="flex items-center justify-between border-b border-rose-200 pb-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <h3 className="text-xs sm:text-sm font-bold text-rose-950 uppercase tracking-tight">
                    Alergias & Risco Clínico Prioritário
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white uppercase">
                  Alerta Prontuário
                </span>
              </div>

              <div className="space-y-2.5">
                {/* Alergia a Medicamento */}
                <div className="p-3 rounded-xl bg-white border border-rose-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-black">
                      Possui alergia a algum tipo de medicamento?
                    </span>
                    <ToggleSwitch
                      isCritical
                      checked={formData.alergiaMedicamento}
                      onChange={(c) => setFormData({ ...formData, alergiaMedicamento: c })}
                    />
                  </div>
                  {formData.alergiaMedicamento && (
                    <input
                      type="text"
                      required
                      placeholder="Qual medicamento? Ex: Penicilina, Dipirona, Anti-inflamatórios"
                      value={formData.qualAlergiaMedicamento || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, qualAlergiaMedicamento: e.target.value })
                      }
                      className="w-full h-8 px-2.5 rounded-lg bg-rose-50/50 border border-rose-300 text-xs text-black outline-none font-medium"
                    />
                  )}
                </div>

                {/* Alergia a Alimento */}
                <div className="p-3 rounded-xl bg-white border border-rose-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-black">
                      Possui alergia a algum tipo de alimento?
                    </span>
                    <ToggleSwitch
                      isCritical
                      checked={formData.alergiaAlimento}
                      onChange={(c) => setFormData({ ...formData, alergiaAlimento: c })}
                    />
                  </div>
                  {formData.alergiaAlimento && (
                    <input
                      type="text"
                      required
                      placeholder="Qual alimento? Ex: Frutos do mar, ovos, látex"
                      value={formData.qualAlergiaAlimento || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, qualAlergiaAlimento: e.target.value })
                      }
                      className="w-full h-8 px-2.5 rounded-lg bg-rose-50/50 border border-rose-300 text-xs text-black outline-none font-medium"
                    />
                  )}
                </div>

                {/* Medicamento para pressão arterial */}
                <div className="p-3 rounded-xl bg-white border border-rose-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-black">
                      Toma algum medicamento para a pressão arterial?
                    </span>
                    <ToggleSwitch
                      isCritical
                      checked={formData.medicamentoPressao}
                      onChange={(c) => setFormData({ ...formData, medicamentoPressao: c })}
                    />
                  </div>
                  {formData.medicamentoPressao && (
                    <input
                      type="text"
                      required
                      placeholder="Qual medicamento de pressão? Ex: Losartana 50mg"
                      value={formData.qualMedicamentoPressao || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, qualMedicamentoPressao: e.target.value })
                      }
                      className="w-full h-8 px-2.5 rounded-lg bg-rose-50/50 border border-rose-300 text-xs text-black outline-none font-medium"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* SEÇÃO 4: CONDIÇÕES DE SAÚDE SISTÊMICAS (Imagem 1 & 5) */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 border-b border-black/[0.06] pb-2">
                <span className="w-5 h-5 rounded-full bg-black text-white text-[11px] font-bold flex items-center justify-center">
                  3
                </span>
                <h3 className="text-xs sm:text-sm font-bold text-black tracking-tight uppercase">
                  Condições de Saúde & Histórico Sistêmico
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#fafafa] border border-black/[0.05] flex items-center justify-between">
                  <span className="text-xs font-medium text-black">
                    Possui alguma alteração cardiológica?
                  </span>
                  <ToggleSwitch
                    isCritical
                    checked={formData.alteracaoCardiologica}
                    onChange={(c) => setFormData({ ...formData, alteracaoCardiologica: c })}
                  />
                </div>

                <div className="p-3 rounded-xl bg-[#fafafa] border border-black/[0.05] flex items-center justify-between">
                  <span className="text-xs font-medium text-black">
                    Possui alguma prótese cardíaca?
                  </span>
                  <ToggleSwitch
                    isCritical
                    checked={formData.proteseCardiaca}
                    onChange={(c) => setFormData({ ...formData, proteseCardiaca: c })}
                  />
                </div>

                <div className="p-3 rounded-xl bg-[#fafafa] border border-black/[0.05] flex items-center justify-between">
                  <span className="text-xs font-medium text-black">É diabético?</span>
                  <ToggleSwitch
                    checked={formData.diabetico}
                    onChange={(c) => setFormData({ ...formData, diabetico: c })}
                  />
                </div>

                <div className="p-3 rounded-xl bg-[#fafafa] border border-black/[0.05] flex items-center justify-between">
                  <span className="text-xs font-medium text-black">
                    Tem convulsões ou epilepsia?
                  </span>
                  <ToggleSwitch
                    checked={formData.convulsoesEpilepsia}
                    onChange={(c) => setFormData({ ...formData, convulsoesEpilepsia: c })}
                  />
                </div>

                <div className="p-3 rounded-xl bg-[#fafafa] border border-black/[0.05] flex items-center justify-between">
                  <span className="text-xs font-medium text-black">
                    Problemas de coagulação sanguínea?
                  </span>
                  <ToggleSwitch
                    isCritical
                    checked={formData.coagulacaoSanguinea}
                    onChange={(c) => setFormData({ ...formData, coagulacaoSanguinea: c })}
                  />
                </div>

                <div className="p-3 rounded-xl bg-[#fafafa] border border-black/[0.05] flex items-center justify-between">
                  <span className="text-xs font-medium text-black">
                    Está em uso de algum anticoagulante?
                  </span>
                  <ToggleSwitch
                    isCritical
                    checked={formData.usoAnticoagulante}
                    onChange={(c) => setFormData({ ...formData, usoAnticoagulante: c })}
                  />
                </div>

                <div className="p-3 rounded-xl bg-[#fafafa] border border-black/[0.05] flex items-center justify-between">
                  <span className="text-xs font-medium text-black">
                    Está grávida ou lactante?
                  </span>
                  <ToggleSwitch
                    isCritical
                    checked={formData.gravidaLactante}
                    onChange={(c) => setFormData({ ...formData, gravidaLactante: c })}
                  />
                </div>

                <div className="p-3 rounded-xl bg-[#fafafa] border border-black/[0.05] flex items-center justify-between">
                  <span className="text-xs font-medium text-black">
                    Já teve herpes labial?
                  </span>
                  <ToggleSwitch
                    checked={formData.herpesLabial}
                    onChange={(c) => setFormData({ ...formData, herpesLabial: c })}
                  />
                </div>

                {/* Disfunção renal */}
                <div className="p-3 rounded-xl bg-[#fafafa] border border-black/[0.05] space-y-2 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-black">
                      Tem alguma disfunção renal?
                    </span>
                    <ToggleSwitch
                      checked={formData.disfuncaoRenal}
                      onChange={(c) => setFormData({ ...formData, disfuncaoRenal: c })}
                    />
                  </div>
                  {formData.disfuncaoRenal && (
                    <input
                      type="text"
                      placeholder="Qual disfunção renal?"
                      value={formData.qualDisfuncaoRenal || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, qualDisfuncaoRenal: e.target.value })
                      }
                      className="w-full h-8 px-2.5 rounded-lg bg-white border border-black/20 text-xs text-black outline-none animate-in fade-in"
                    />
                  )}
                </div>

                {/* Tratamento estético prévio (Imagem 1 & 5) */}
                <div className="p-3 rounded-xl bg-[#fafafa] border border-black/[0.05] space-y-2 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-black">
                      Já efetuou algum tratamento estético antes?
                    </span>
                    <ToggleSwitch
                      checked={formData.tratamentoEsteticoPrevio}
                      onChange={(c) => setFormData({ ...formData, tratamentoEsteticoPrevio: c })}
                    />
                  </div>
                  {formData.tratamentoEsteticoPrevio && (
                    <input
                      type="text"
                      placeholder="Como foi a experiência? Quais procedimentos realizou?"
                      value={formData.experienciaTratamentoEstetico || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, experienciaTratamentoEstetico: e.target.value })
                      }
                      className="w-full h-8 px-2.5 rounded-lg bg-white border border-black/20 text-xs text-black outline-none animate-in fade-in"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* SEÇÃO 5: PELE & FOTOENVELHECIMENTO (Imagem 5) */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 border-b border-black/[0.06] pb-2">
                <span className="w-5 h-5 rounded-full bg-black text-white text-[11px] font-bold flex items-center justify-center">
                  4
                </span>
                <h3 className="text-xs sm:text-sm font-bold text-black tracking-tight uppercase">
                  Classificação Dérmica (Tipo de Pele & Fotoenvelhecimento)
                </h3>
              </div>

              {/* Pele */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-black">
                  Classificação da Pele *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {(["Normal", "Oleosa", "Alípica", "Seca", "Hidratada", "Mista"] as const).map(
                    (tipo) => (
                      <button
                        type="button"
                        key={tipo}
                        onClick={() => setFormData({ ...formData, tipoPele: tipo })}
                        className={`h-9 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                          formData.tipoPele === tipo
                            ? "bg-black text-white border-black shadow-sm"
                            : "bg-[#f6f6f6] text-[#6c6c6c] border-transparent hover:text-black hover:bg-[#ededed]"
                        }`}
                      >
                        {tipo}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Fotoenvelhecimento */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-semibold text-black">
                  Grau de Fotoenvelhecimento *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(["Leve", "Moderado", "Avançado", "Severo"] as const).map((grau) => (
                    <button
                      type="button"
                      key={grau}
                      onClick={() => setFormData({ ...formData, fotoenvelhecimento: grau })}
                      className={`h-9 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                        formData.fotoenvelhecimento === grau
                          ? "bg-black text-white border-black shadow-sm"
                          : "bg-[#f6f6f6] text-[#6c6c6c] border-transparent hover:text-black hover:bg-[#ededed]"
                      }`}
                    >
                      {grau}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* SEÇÃO 6: TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO (Texto Integral da Imagem 1) */}
            <div id="consentimento-section" className="space-y-3.5 pt-1">
              <div className="flex items-center gap-2 border-b border-black/[0.06] pb-2">
                <span className="w-5 h-5 rounded-full bg-black text-white text-[11px] font-bold flex items-center justify-center">
                  5
                </span>
                <h3 className="text-xs sm:text-sm font-bold text-black tracking-tight uppercase">
                  Termo de Consentimento Livre e Esclarecido (Toxina Botulínica & Ácido Hialurônico)
                </h3>
              </div>

              {/* Texto Legal Oficial da Imagem 1 */}
              <div className="p-4 rounded-xl bg-[#fafafa] border border-black/[0.08] text-[11px] text-[#525252] max-h-48 overflow-y-auto space-y-2.5 leading-relaxed">
                <p className="font-bold text-black">
                  TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO
                </p>
                <p>
                  Os procedimentos de "tratamento em face com toxina botulínica A" e "preenchimento facial com ácido hialurônico" foram explicados pelo profissional e eu entendi a natureza e consequência dos mesmos. Os seguintes pontos me foram especialmente esclarecidos:
                </p>
                <p>
                  <strong>1:</strong> Apesar da segurança e longa experiência com o uso da toxina botulínica A, alguns efeitos adversos podem ocorrer após a aplicação, como: eritema (vermelhidão), pápula (elevação da pele), edema (inchaço), hematoma, inflamação, assimetria, ptose palpebral (caimento ou fechamento anormal da pálpebra). Estes efeitos são transitórios e totalmente reversíveis.
                </p>
                <p>
                  <strong>2:</strong> Apesar da segurança e longa experiência com o uso de preenchedores a base de ácido hialurônico, algumas reações adversas podem ocorrer após a aplicação, tais como: eritema (vermelhidão), edema (inchaço), que podem ser associadas a prurido (coceira) ou dor localizada. Essas reações são geralmente transitórias e reversíveis. Alguns eventos relatados que podem durar mais tempo como: hematomas (equimoses), endurecimento (o que pode gerar uma sensação de produto palpável), nódulos e discromias (alteração da cor) no local da injeção.
                </p>
                <p>
                  <strong>3:</strong> Na literatura também estão descritas as seguintes reações adversas após aplicações de ácido hialurônico: abscesso, granuloma, reação imunológica imediata ou tardia, injeção acidental intravascular (dentro do vaso sanguíneo), podendo obstruir o vaso e causar danos nos tecidos.
                </p>
                <p>
                  <strong>4:</strong> Pacientes com tendência a desenvolver cicatrizes hipertróficas (quelóides), com hipersensibilidade (alergia) ao ácido hialurônico, com infecções ou inflamações na pele (acne ou herpes), com associação imediata de tratamento a laser (peeling químico ou dermoabrasão), em tratamento com antibióticos, mulheres grávidas ou lactantes e crianças, não devem se submeter aos procedimentos acima descritos.
                </p>
                <p>
                  <strong>5:</strong> Atletas devem estar cientes de que o efeito da toxina botulínica é menor. Entendi que a duração dos resultados dos procedimentos é variável, dependendo do metabolismo e hábitos de cada paciente. No caso da toxina botulínica, entendi que os efeitos iniciais são observados em aproximadamente 24-48 horas e que a duração total também pode ser impactada pela dosagem usada na área tratada, sendo em média 4 a 6 meses. Estou ciente de que a prática na área da saúde não é uma ciência exata e reconheço que, apesar de o profissional haver me informado adequadamente sobre as possibilidades de atingir os objetivos do procedimento, não se pode afirmar que os resultados são garantidos. Dou o meu consentimento para ser fotografado ou filmado antes, durante e depois do procedimento, autorizando o profissional interventor a utilizar minha imagem pessoal de forma gratuita em prontuários clínicos, revistas científicas, apresentações em congressos e eventos científicos, aulas e redes sociais. Entendi que serei atendido por profissionais em treinamento sob supervisão permanente de um professor responsável. Dou fé de não haver omitido ou alterado informações ou expor os meus dados de saúde. Li detalhadamente esse termo de consentimento e entendi totalmente, autorizando o profissional a realizar em mim os procedimentos previamente descritos e explicados. Em prova da conformidade com todo o exposto, assino o presente termo.
                </p>
              </div>

              {/* Checkbox de Aceite */}
              <div
                onClick={() => {
                  setFormData({
                    ...formData,
                    termoConsentimentoAceito: !formData.termoConsentimentoAceito,
                  });
                  if (!formData.termoConsentimentoAceito) setConsentError(false);
                }}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  formData.termoConsentimentoAceito
                    ? "bg-black/[0.03] border-black text-black"
                    : consentError
                    ? "bg-rose-50 border-rose-400 text-rose-800"
                    : "bg-white border-black/[0.1] hover:border-black text-[#525252]"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md border mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                    formData.termoConsentimentoAceito
                      ? "bg-black border-black text-white"
                      : consentError
                      ? "border-rose-500 bg-rose-100"
                      : "border-black/30 bg-white"
                  }`}
                >
                  {formData.termoConsentimentoAceito && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <div>
                  <span className="text-xs font-semibold text-black block">
                    Declaro que li, compreendi e concordo integralmente com o Termo de Consentimento Livre e Esclarecido *
                  </span>
                  <span className="text-[11px] text-[#767676]">
                    Paciente: {clientName} {formData.rg ? `• RG: ${formData.rg}` : ""}
                  </span>
                  {consentError && (
                    <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      É obrigatório marcar o aceite do termo de consentimento.
                    </p>
                  )}
                </div>
              </div>

              {/* Foto da Assinatura do Cliente (Item 7) */}
              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-xs font-bold text-black block">
                    Foto da Assinatura do Cliente
                  </label>
                  <p className="text-[11px] text-[#767676]">
                    Anexe uma foto nítida da assinatura do paciente (foto do documento, papel assinado ou foto capturada na recepção).
                  </p>
                </div>

                {formData.assinaturaUrl ? (
                  <div className="p-4 rounded-2xl bg-white border border-black/10 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-black/[0.06] pb-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                        <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                        <span>Foto da assinatura registrada com sucesso</span>
                      </div>
                      <span className="text-[11px] text-[#8f8f8f]">
                        Carimbo: {formData.updatedAt}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#fafafa] border border-black/[0.06] flex items-center justify-center min-h-[100px]">
                      <img
                        src={formData.assinaturaUrl}
                        alt="Foto da assinatura do cliente"
                        className="max-h-28 max-w-full object-contain rounded-lg shadow-2xs"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <label className="h-8 px-3 rounded-xl bg-[#f4f4f4] hover:bg-[#eaeaea] text-black text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors">
                        <Upload className="w-3.5 h-3.5 text-[#767676]" />
                        <span>Trocar Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            assinaturaUrl: "",
                            anexoFichaUrl: "",
                            anexoFichaNome: "",
                          }))
                        }
                        className="h-8 px-3 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-black/[0.18] hover:border-black rounded-2xl p-6 bg-[#fafafa] hover:bg-white flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-all group shadow-2xs">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-black/[0.08] shadow-xs flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Upload className="w-6 h-6 text-black" />
                    </div>
                    <div className="text-center space-y-0.5">
                      <span className="text-xs font-bold text-black group-hover:underline block">
                        Clique ou arraste para anexar a foto da assinatura
                      </span>
                      <p className="text-[11px] text-[#767676]">
                        Formatos aceitos: JPG, PNG ou WEBP • Pode usar a câmera do celular/tablet
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const result = event.target?.result as string;
                          setFormData((prev) => ({
                            ...prev,
                            assinaturaUrl: result,
                            anexoFichaNome: file.name,
                          }));
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Sticky Save Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t border-black/[0.08] sticky bottom-0 bg-white z-20 gap-3">
              <div className="flex items-center gap-2 text-xs text-[#767676]">
                <Calendar className="w-3.5 h-3.5 text-[#8f8f8f]" />
                <span>Atualizado em: {formData.updatedAt}</span>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-11 sm:h-10 px-4 rounded-xl text-xs font-medium text-[#767676] hover:text-black hover:bg-[#f4f4f4] transition-colors cursor-pointer text-center active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-11 sm:h-10 px-5 sm:px-6 rounded-xl bg-black hover:bg-[#262626] text-white text-xs font-semibold shadow-sm transition-all duration-150 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Salvar Ficha Completa</span>
                </button>
              </div>
            </div>
          </form>
          )}
        </div>
      </div>
    </ModalPortal>
  );
}

// Custom Toggle Component (Sim / Não)
function ToggleSwitch({
  checked,
  onChange,
  isCritical = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  isCritical?: boolean;
}) {
  return (
    <div className="inline-flex items-center rounded-lg bg-[#eeeeee] p-0.5 shrink-0 select-none">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
          checked
            ? isCritical
              ? "bg-rose-600 text-white shadow-sm"
              : "bg-black text-white shadow-sm"
            : "text-[#767676] hover:text-black"
        }`}
      >
        Sim
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
          !checked
            ? "bg-white text-black shadow-sm font-semibold"
            : "text-[#767676] hover:text-black"
        }`}
      >
        Não
      </button>
    </div>
  );
}

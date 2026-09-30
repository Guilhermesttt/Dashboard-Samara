"use client";

import React, { useState } from "react";
import {
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  UserPlus,
  LogIn,
} from "lucide-react";
import { toast } from "sonner";
import {
  STORAGE_KEYS,
  setStoredUserProfile,
} from "@/lib/storage-keys";
import { loginWithFirebase, registerWithFirebase } from "@/lib/auth-service";

interface LoginViewProps {
  onLoginSuccess?: () => void;
  onRegisterSuccess?: (user: { name: string; email: string }) => void;
}

export function LoginView({ onLoginSuccess, onRegisterSuccess }: LoginViewProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const triggerError = (msg: string) => {
    setIsError(true);
    setErrorMessage(msg);
  };

  const handleForgotPassword = () => {
    toast.info("Recuperação de Acesso", {
      description:
        "Entre em contato com o administrador do sistema ou utilize sua chave mestre de recuperação.",
      duration: 6000,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsError(false);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      triggerError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      triggerError("Por favor, insira um endereço de e-mail válido.");
      return;
    }

    if (cleanPassword.length < 6) {
      triggerError("A senha informada deve ter pelo menos 6 caracteres.");
      return;
    }

    if (mode === "register") {
      if (!name.trim()) {
        triggerError("Por favor, insira seu nome completo.");
        return;
      }

      if (cleanPassword !== confirmPassword.trim()) {
        triggerError("As senhas digitadas não coincidem. Verifique e tente novamente.");
        return;
      }

      setIsLoading(true);

      try {
        const result = await registerWithFirebase(name.trim(), cleanEmail, cleanPassword);

        if (!result.success || !result.user) {
          setIsLoading(false);
          triggerError(result.error || "Erro ao cadastrar usuário no Firebase.");
          return;
        }

        // Inicializa perfil
        setStoredUserProfile({
          name: name.trim(),
          email: cleanEmail,
          title:
            result.user.role === "admin"
              ? "Biomédica Esteta • Harmonização Facial"
              : "Equipe de Atendimento",
        });

        setIsLoading(false);
        setIsSuccess(true);
        toast.success(`Conta criada com sucesso!`, {
          description: `Bem-vinda, ${name.trim()}! Acesso liberado no sistema.`,
        });

        setTimeout(() => {
          if (onRegisterSuccess) {
            onRegisterSuccess({ name: name.trim(), email: cleanEmail });
          } else if (onLoginSuccess) {
            onLoginSuccess();
          }
        }, 400);
      } catch (err: any) {
        setIsLoading(false);
        triggerError(err?.message || "Erro inesperado ao registrar conta.");
      }

      return;
    }

    // Modo LOGIN com Firebase Auth Real
    setIsLoading(true);

    try {
      const result = await loginWithFirebase(cleanEmail, cleanPassword);

      if (!result.success) {
        setIsLoading(false);
        triggerError(
          result.error || "Credenciais não reconhecidas. Verifique e-mail e senha."
        );
        return;
      }

      setIsLoading(false);
      setIsSuccess(true);

      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      }, 400);
    } catch (err: any) {
      setIsLoading(false);
      triggerError(err?.message || "Erro inesperado na autenticação.");
    }
  };

  return (
    <div className="relative w-full min-h-[100dvh] h-[100dvh] bg-[#111111] text-white flex p-3 sm:p-5 lg:p-6 select-none font-sans overflow-x-hidden overflow-y-auto lg:overflow-hidden bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.035)_0%,_transparent_65%)]">
      {/* 1. Left Visual Hero Card (Desktop & Tablet Landscape) */}
      <section
        aria-label="Espaço de Atendimento Relaxante"
        className="hidden lg:flex lg:w-1/2 relative rounded-[28px] xl:rounded-[32px] overflow-hidden bg-[#161616] border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_24px_64px_-16px_rgba(0,0,0,0.9)] flex-col justify-between p-8 xl:p-12 select-none group"
      >
        <img
          src="/relaxing-spa.jpg"
          alt="Ambiente Relaxante da Clínica Dra. Sâmara Souza"
          className="absolute inset-0 w-full h-full object-cover object-center scale-100 transition-transform duration-1000 ease-out group-hover:scale-105"
        />

        {/* Gradientes Atmosféricos em Camadas para Legibilidade */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/95 via-[#111111]/45 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#111111]/60 via-transparent to-transparent pointer-events-none" />

        {/* Tag Superior no Hero */}
        <div className="relative z-10 self-start">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#111111]/70 backdrop-blur-md border border-white/15 text-[11px] font-medium tracking-wide text-white/95 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#A8B29A] animate-pulse" />
            <span>Clínica de Estética Avançada</span>
          </div>
        </div>

        {/* Textos Inspiracionais no Rodapé da Imagem */}
        <div className="relative z-10 space-y-3.5 max-w-lg">
          <h2 className="text-2xl xl:text-3xl font-bold tracking-tight text-white leading-snug">
            Harmonia, precisão e bem-estar em cada detalhe.
          </h2>
          <p className="text-xs xl:text-sm text-white/85 leading-relaxed font-normal">
            Ambiente exclusivo de acolhimento, cuidado estético personalizado e acompanhamento clínico de excelência.
          </p>
          <div className="pt-3 border-t border-white/15 flex items-center justify-between text-[11px] text-white/60 tracking-wider">
            <span className="uppercase font-semibold tracking-widest text-[#A8B29A]">
              Dra. Sâmara Souza
            </span>
            <span className="text-[#8D9B7F]">Harmonização Facial & Corporal</span>
          </div>
        </div>
      </section>

      {/* 2. Right Form Column (Responsivo, com Alternância Login / Cadastro) */}
      <section
        aria-label="Formulário de Acesso"
        className="w-full lg:w-1/2 flex flex-col justify-center items-center px-3 sm:px-8 xl:px-16 py-6 sm:py-8 overflow-y-auto scroll-momentum"
      >
        <div className="w-full max-w-[390px] sm:max-w-[420px] space-y-5 sm:space-y-6">
          {/* Card visual compacto para telas mobile (< lg) */}
          <div className="lg:hidden w-full h-36 sm:h-44 rounded-2xl sm:rounded-3xl overflow-hidden relative mb-1 border border-white/[0.1] shadow-lg shrink-0">
            <img
              src="/relaxing-spa.jpg"
              alt="Ambiente Relaxante Dra. Sâmara Souza"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/95 via-[#111111]/40 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4 text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#111111]/70 backdrop-blur-md border border-white/10 text-[9px] font-semibold uppercase tracking-wider text-[#A8B29A] mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#A8B29A]" />
                <span>Estética Avançada</span>
              </div>
              <span className="text-base font-bold text-white block">
                Dra. Sâmara Souza
              </span>
            </div>
          </div>

          {/* Logo da Marca - 100% visível, branca e nítida em fundo escuro */}
          <div className="flex items-center gap-3 py-1">
            <img
              src="/Samara_Logo_Completa.png"
              alt="Dra. Sâmara Souza - Estética Avançada"
              className="h-13 sm:h-16 max-w-[300px] object-contain transition-all drop-shadow-[0_2px_16px_rgba(255,255,255,0.16)]"
              style={{ filter: "brightness(0) invert(1)" }}
            />
          </div>

          {/* Abas Alternadoras: Entrar vs Criar Conta */}
          <div className="p-1 rounded-xl bg-[#232323] border border-white/[0.08] flex items-center">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setIsError(false);
              }}
              className={`flex-1 h-10 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mode === "login"
                  ? "bg-[#A8B29A] text-[#111111] shadow-sm font-bold"
                  : "text-[#8D9B7F] hover:text-white"
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Fazer Login</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setIsError(false);
              }}
              className={`flex-1 h-10 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mode === "register"
                  ? "bg-[#A8B29A] text-[#111111] shadow-sm font-bold"
                  : "text-[#8D9B7F] hover:text-white"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Criar Conta</span>
            </button>
          </div>

          {/* Cabeçalho do Formulário */}
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {mode === "login" ? "Acesse sua conta" : "Cadastre seu usuário"}
            </h1>
            <p className="text-xs sm:text-sm text-[#8D9B7F] leading-relaxed">
              {mode === "login"
                ? "Entre com suas credenciais para gerenciar sua clínica, agenda e prontuários."
                : "Crie seu acesso profissional para personalizar seus horários, foto e serviços."}
            </p>
          </div>

          {/* Banner de Erro com Animação Fluida */}
          {isError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <span className="font-semibold block">Atenção</span>
                <span className="text-[11px] text-rose-200/90 leading-tight">
                  {errorMessage}
                </span>
              </div>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-3.5 pt-0.5">
            {/* Campo Nome (Apenas em Modo Cadastro) */}
            {mode === "register" && (
              <div className="space-y-1.5 animate-in fade-in duration-200">
                <label
                  htmlFor="register-name"
                  className="text-xs font-semibold text-[#F7F5F0] block"
                >
                  Nome profissional completo *
                </label>
                <div className="relative flex items-center h-[48px] px-3.5 rounded-xl bg-[#232323] border border-white/10 focus-within:border-[#A8B29A] focus-within:ring-2 focus-within:ring-[#A8B29A]/25 transition-all">
                  <User className="w-4 h-4 text-[#8D9B7F] shrink-0 mr-3 pointer-events-none" />
                  <input
                    id="register-name"
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (isError) setIsError(false);
                    }}
                    placeholder="Ex: Dra. Sâmara Souza"
                    className="w-full h-full bg-transparent text-sm text-white placeholder:text-[#666666] outline-none font-normal"
                  />
                </div>
              </div>
            )}

            {/* Campo E-mail */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="text-xs font-semibold text-[#F7F5F0] block"
              >
                E-mail profissional *
              </label>
              <div
                className={`relative flex items-center h-[48px] px-3.5 rounded-xl bg-[#232323] border transition-all duration-200 ${
                  isError && (!email.trim() || !email.includes("@"))
                    ? "border-rose-500/50 bg-rose-950/20"
                    : "border-white/10 focus-within:border-[#A8B29A] focus-within:ring-2 focus-within:ring-[#A8B29A]/25"
                }`}
              >
                <Mail className="w-4 h-4 text-[#8D9B7F] shrink-0 mr-3 pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (isError) setIsError(false);
                  }}
                  placeholder="exemplo@samaraestetica.com.br"
                  className="w-full h-full bg-transparent text-sm text-white placeholder:text-[#666666] outline-none font-normal"
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="text-xs font-semibold text-[#F7F5F0] block"
                >
                  Senha *
                </label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-[#8D9B7F] hover:text-[#A8B29A] transition-colors cursor-pointer"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>

              <div
                className={`relative flex items-center h-[48px] pl-3.5 pr-1 rounded-xl bg-[#232323] border transition-all duration-200 ${
                  isError && !password.trim()
                    ? "border-rose-500/50 bg-rose-950/20"
                    : "border-white/10 focus-within:border-[#A8B29A] focus-within:ring-2 focus-within:ring-[#A8B29A]/25"
                }`}
              >
                <Lock className="w-4 h-4 text-[#8D9B7F] shrink-0 mr-3 pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  spellCheck={false}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (isError) setIsError(false);
                  }}
                  placeholder="••••••••••••"
                  className="w-full h-full bg-transparent text-sm text-white placeholder:text-[#666666] outline-none font-normal"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="w-10 h-10 flex items-center justify-center text-[#8D9B7F] hover:text-[#A8B29A] transition-colors cursor-pointer shrink-0 active:scale-90"
                  aria-label={showPassword ? "Ocultar senha" : "Ver senha"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Campo Confirmar Senha (Modo Cadastro) */}
            {mode === "register" && (
              <div className="space-y-1.5 animate-in fade-in duration-200">
                <label
                  htmlFor="register-confirm-password"
                  className="text-xs font-semibold text-[#F7F5F0] block"
                >
                  Confirmar senha *
                </label>
                <div className="relative flex items-center h-[48px] px-3.5 rounded-xl bg-[#232323] border border-white/10 focus-within:border-[#A8B29A] focus-within:ring-2 focus-within:ring-[#A8B29A]/25 transition-all">
                  <Lock className="w-4 h-4 text-[#8D9B7F] shrink-0 mr-3 pointer-events-none" />
                  <input
                    id="register-confirm-password"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (isError) setIsError(false);
                    }}
                    placeholder="Repita a senha criada"
                    className="w-full h-full bg-transparent text-sm text-white placeholder:text-[#666666] outline-none font-normal"
                  />
                </div>
              </div>
            )}

            {/* Botão de Ação Primário (Sage Green) */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || isSuccess}
                className="w-full h-[50px] rounded-xl bg-[#A8B29A] hover:bg-[#8D9B7F] active:bg-[#7a886c] text-[#111111] text-sm font-semibold flex items-center justify-center gap-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_8px_20px_-4px_rgba(168,178,154,0.25)] transition-all duration-150 active:scale-[0.98] cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    <span>{mode === "login" ? "Validando acesso..." : "Criando sua conta..."}</span>
                  </div>
                ) : isSuccess ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#111111] stroke-[2.5]" />
                    <span>{mode === "login" ? "Acesso Autorizado" : "Conta Criada!"}</span>
                  </div>
                ) : (
                  <>
                    <span>
                      {mode === "login" ? "Entrar na plataforma" : "Criar Minha Conta e Configurar"}
                    </span>
                    <ArrowRight className="w-4 h-4 stroke-[2.2]" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Troca de modo no rodapé */}
          <div className="text-center pt-1">
            {mode === "login" ? (
              <p className="text-xs text-[#8D9B7F]">
                Não tem uma conta ainda?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setIsError(false);
                  }}
                  className="text-white hover:text-[#A8B29A] font-semibold underline underline-offset-4 cursor-pointer"
                >
                  Cadastre-se agora
                </button>
              </p>
            ) : (
              <p className="text-xs text-[#8D9B7F]">
                Já possui conta cadastrada?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setIsError(false);
                  }}
                  className="text-white hover:text-[#A8B29A] font-semibold underline underline-offset-4 cursor-pointer"
                >
                  Faça login
                </button>
              </p>
            )}
          </div>

          {/* Selo de Segurança e Criptografia */}
          <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-[#8D9B7F]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#A8B29A]" />
            <span>Ambiente seguro com criptografia clínica ponta a ponta</span>
          </div>

          {/* Rodapé Institucional */}
          <div className="pt-3 border-t border-white/[0.06] text-center space-y-1">
            <p className="text-[10px] text-[#8D9B7F]">
              © 2026 Dra. Sâmara Souza — Estética Avançada. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

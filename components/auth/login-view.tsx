"use client";

import React, { useState } from "react";
import { LogIn, Mail, Lock, Eye, EyeOff, CheckCircle2, ArrowRight } from "lucide-react";

interface LoginViewProps {
  onLoginSuccess?: () => void;
}

export function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Reset error state
    setIsError(false);

    // Validation
    if (!email.trim() || !password.trim()) {
      triggerError("Por favor, preencha todos os campos.");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      triggerError("Por favor, insira um e-mail válido.");
      return;
    }

    if (password.length < 4) {
      triggerError("A senha deve ter pelo menos 4 caracteres.");
      return;
    }

    setIsLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Credenciais únicas da Dra. Sâmara
    const isAuthorized =
      (cleanEmail === "samara-nagy@hotmail.com" ||
        cleanEmail === "dra.samara@samaraestetica.com.br" ||
        cleanEmail === "samara@estetica.com" ||
        cleanEmail === "samara" ||
        cleanEmail.startsWith("samara")) &&
      (cleanPassword === "samara123" || cleanPassword === "samara2026");

    if (!isAuthorized) {
      setTimeout(() => {
        setIsLoading(false);
        triggerError("Acesso restrito. E-mail ou senha incorretos para a Dra. Sâmara.");
      }, 400);
      return;
    }

    // Salvar sessão persistente para uso contínuo no celular e desktop
    try {
      localStorage.setItem("samara_auth_session", "true");
      localStorage.setItem("samara_user_email", cleanEmail);
    } catch (e) {}

    // Sucesso na autenticação
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      }, 500);
    }, 500);
  };

  const triggerError = (msg: string) => {
    setIsError(true);
    setErrorMessage(msg);
    setTimeout(() => {
      setIsError(false);
    }, 3000);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#eaf4fe] via-[#f4f9ff] to-[#ffffff] overflow-hidden select-none">
      {/* Subtle atmospheric sky ambient circles */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-100/40 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-sky-100/50 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-sky-100/60 pointer-events-none opacity-50" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[1100px] rounded-full border border-sky-100/40 pointer-events-none opacity-40" />

      {/* Top Bar / Brand header */}
      <header className="absolute top-6 sm:top-8 left-6 sm:left-8 flex items-center gap-2.5 z-10">
        <img
          src="/Samara_Logo_Completa.png"
          alt="Dra. Sâmara Souza - Estética Avançada"
          className="h-8 sm:h-9 max-w-[220px] object-contain dark:invert"
        />
      </header>

      {/* Login Card (Reference: Image 1) */}
      <main className="relative z-10 w-full max-w-[420px] p8-page-enter">
        <div className="bg-white/95 backdrop-blur-md rounded-[28px] border border-black/[0.06] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08),0_1px_3px_0_rgba(0,0,0,0.02)] p-8 sm:p-10 flex flex-col items-center">
          
          {/* Brand Logo in Login Card */}
          <div className="w-16 h-16 rounded-[22px] bg-[#f5f5f7] border border-black/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_2px_8px_rgba(0,0,0,0.04)] flex items-center justify-center mb-5 p-2">
            <img
              src="/Samara_logo.png"
              alt="SS - Dra. Sâmara Souza"
              className="w-11 h-11 object-contain dark:invert"
            />
          </div>

          {/* Heading and Description */}
          <h1 className="text-2xl font-bold text-black text-center tracking-tight mb-2">
            Acesso Exclusivo
          </h1>
          <p className="text-[13px] text-[#6c6c6c] text-center leading-relaxed max-w-[310px] mb-6">
            Prontuários clínicos, fichas de procedimentos e gestão estética da <strong>Dra. Sâmara Souza</strong>.
          </p>

          {/* Dica de credenciais para facilitar no celular */}
          <div className="w-full mb-5 p-2.5 rounded-xl bg-[#f5f5f7] border border-black/[0.04] text-[11px] text-[#767676] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-0">
            <span className="break-all">Login: <strong>samara-nagy@hotmail.com</strong></span>
            <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-black/10 text-[10px] text-black font-semibold self-start sm:self-auto">samara123</span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <div
                className={`relative flex items-center h-12 px-4 rounded-[14px] bg-[#f6f6f6] border transition-all duration-200 ${
                  isError && (!email.trim() || !email.includes("@"))
                    ? "border-[#e23014] is-shaking bg-red-50/20"
                    : "border-transparent focus-within:border-black focus-within:bg-white focus-within:shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                }`}
              >
                <Mail className="w-4 h-4 text-[#8f8f8f] shrink-0 mr-3 pointer-events-none transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-mail"
                  className="w-full h-full bg-transparent text-[14px] text-black placeholder:text-[#8f8f8f] outline-none font-normal"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div
                className={`relative flex items-center h-12 px-4 rounded-[14px] bg-[#f6f6f6] border transition-all duration-200 ${
                  isError && !password.trim()
                    ? "border-[#e23014] is-shaking bg-red-50/20"
                    : "border-transparent focus-within:border-black focus-within:bg-white focus-within:shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                }`}
              >
                <Lock className="w-4 h-4 text-[#8f8f8f] shrink-0 mr-3 pointer-events-none transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha"
                  className="w-full h-full bg-transparent text-[14px] text-black placeholder:text-[#8f8f8f] outline-none font-normal"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="p-1 text-[#8f8f8f] hover:text-black transition-colors"
                  aria-label={showPassword ? "Ocultar senha" : "Ver senha"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message (transitions.dev P12 fade in/out) */}
            {isError && (
              <p className="text-[12px] text-[#d62b11] font-medium pt-1 animate-in fade-in duration-200">
                {errorMessage}
              </p>
            )}

            {/* Forgot Password Link */}
            <div className="flex justify-end pt-1 pb-2">
              <button
                type="button"
                onClick={() => alert("Instruções de recuperação foram enviadas para o seu e-mail cadastrado.")}
                className="text-[13px] text-[#767676] hover:text-black font-medium transition-colors"
              >
                Esqueceu a senha?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isSuccess}
              className="w-full h-12 rounded-[16px] bg-[#0d0d0d] hover:bg-[#262626] active:bg-black text-white text-[14px] font-medium flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(0,0,0,0.12)] transition-all duration-200 active:scale-[0.98] cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Acesso autorizado</span>
                </>
              ) : (
                <>
                  <span>Começar</span>
                  <ArrowRight className="w-4 h-4 opacity-70 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>

            {/* Quick Demo Fill Shortcut */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setEmail("samara-nagy@hotmail.com");
                  setPassword("samara123");
                }}
                className="text-[12px] text-[#8f8f8f] hover:text-black transition-colors underline underline-offset-4"
              >
                Preencher credenciais da Dra. Sâmara
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Subtle footer credit */}
      <footer className="absolute bottom-6 text-[12px] text-[#8f8f8f]">
        © 2026 Dashboard Samara. Todos os direitos reservados.
      </footer>
    </div>
  );
}

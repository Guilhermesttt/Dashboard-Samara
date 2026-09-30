"use client";

import React, { useState } from "react";
import {
  X,
  Bell,
  Plus,
  Mail,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Send,
  Sparkles,
} from "lucide-react";
import { ModalPortal } from "@/components/ui/modal-portal";
import { ReminderItem } from "@/lib/reminders-service";
import { sendEmailNotification } from "@/lib/email-service";
import { toast } from "sonner";
import { playNotificationSound } from "@/lib/sound";

interface RemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminders: ReminderItem[];
  onSaveReminder: (reminder: ReminderItem) => void;
  onToggleReminder: (id: string) => void;
  onDeleteReminder: (id: string) => void;
}

export function RemindersModal({
  isOpen,
  onClose,
  reminders,
  onSaveReminder,
  onToggleReminder,
  onDeleteReminder,
}: RemindersModalProps) {
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("pending");
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("Amanhã");
  const [dueTime, setDueTime] = useState("10:00");
  const [patientName, setPatientName] = useState("");
  const [priority, setPriority] = useState<"alta" | "normal">("alta");
  const [notifyApp, setNotifyApp] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newReminder: ReminderItem = {
      id: `rem-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      dueDate,
      dueTime,
      patientName: patientName.trim(),
      priority,
      notifyApp,
      notifyEmail,
      completed: false,
      createdAt: new Date().toLocaleDateString("pt-BR"),
    };

    onSaveReminder(newReminder);
    setIsAddingNew(false);

    // Feedback
    playNotificationSound();
    toast.success("Lembrete criado com sucesso!", {
      description: notifyEmail
        ? "Você será avisada no App e por e-mail 1 dia antes da data."
        : "Notificação ativada no App.",
    });

    // Reset form
    setTitle("");
    setDescription("");
    setPatientName("");
  };

  const handleTestEmail = async (reminder: ReminderItem) => {
    toast.info("Disparando e-mail de lembrete...", { duration: 2500 });
    const res = await sendEmailNotification({
      reminderTitle: reminder.title,
      reminderDescription: reminder.description,
      patientName: reminder.patientName,
      appointmentDate: reminder.dueDate,
      appointmentTime: reminder.dueTime,
      alertType: "lembrete_geral",
    });

    if (res.success) {
      playNotificationSound();
      toast.success("E-mail disparado para Dra. Sâmara!", {
        description: res.message,
      });
    }
  };

  const filteredReminders = reminders.filter((r) => {
    if (filter === "pending") return !r.completed;
    if (filter === "completed") return r.completed;
    return true;
  });

  return (
    <ModalPortal isOpen={isOpen}>
      <div
        className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200 select-none"
        style={{
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
        }}
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-[#121214] rounded-t-[28px] sm:rounded-[24px] border-t sm:border border-black/[0.08] dark:border-white/[0.08] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_32px_64px_-16px_rgba(0,0,0,0.8)] w-full max-w-[620px] max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#121214] flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#9ca889] text-[#070707] flex items-center justify-center shrink-0 shadow-sm font-bold">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-wider text-[#767676] dark:text-[#a0a0a0] uppercase">
                  Central de Lembretes & Alertas
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-black dark:text-white tracking-tight mt-0.5">
                  Lembretes Clínicos
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#f4f4f4] dark:bg-[#1c1c1e] hover:bg-[#ebebeb] dark:hover:bg-[#2c2c2e] flex items-center justify-center text-[#8f8f8f] hover:text-black dark:hover:text-white transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Action Bar & Tabs */}
          <div className="px-4 sm:px-6 py-2.5 bg-[#fafafa] dark:bg-[#0c0c0e] border-b border-black/[0.05] dark:border-white/[0.08] flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              {[
                { id: "pending", label: "Pendentes" },
                { id: "all", label: "Todos" },
                { id: "completed", label: "Concluídos" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setFilter(t.id as any)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    filter === t.id
                      ? "bg-[#9ca889] text-[#070707] shadow-sm font-bold"
                      : "text-[#767676] dark:text-[#a0a0a0] hover:text-black dark:hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsAddingNew(!isAddingNew)}
              className="h-8 px-3 rounded-xl bg-[#9ca889] hover:bg-[#8f9b7c] text-[#070707] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ml-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAddingNew ? "Fechar Formulário" : "Novo Lembrete"}</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh] space-y-4 bg-[#fafafa] dark:bg-[#070707]">
            {/* Form de Novo Lembrete */}
            {isAddingNew && (
              <form
                onSubmit={handleSubmit}
                className="p-4 rounded-2xl bg-white dark:bg-[#141416] border border-black/[0.1] dark:border-white/[0.08] shadow-sm space-y-3.5 animate-in fade-in"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-black dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#9ca889]" />
                    Criar Novo Lembrete
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-black dark:text-white">
                    Título do Lembrete *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Cobrar retorno de 15 dias da Mariana"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full h-11 sm:h-9 px-3 rounded-xl bg-[#f7f7f7] dark:bg-[#1c1c1e] text-base sm:text-xs text-black dark:text-white outline-none border border-transparent focus:border-[#9ca889] transition-all placeholder:text-[#767676] dark:placeholder:text-[#666]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-black dark:text-white">
                      Paciente Relacionada (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Nome da cliente"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full h-11 sm:h-9 px-3 rounded-xl bg-[#f7f7f7] dark:bg-[#1c1c1e] text-base sm:text-xs text-black dark:text-white outline-none border border-transparent focus:border-[#9ca889] transition-all placeholder:text-[#767676] dark:placeholder:text-[#666]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-black dark:text-white">Data</label>
                      <select
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full h-11 sm:h-9 px-2 rounded-xl bg-[#f7f7f7] dark:bg-[#1c1c1e] text-base sm:text-xs text-black dark:text-white outline-none border border-transparent focus:border-[#9ca889]"
                      >
                        <option value="Hoje">Hoje</option>
                        <option value="Amanhã">Amanhã</option>
                        <option value="Em 3 dias">Em 3 dias</option>
                        <option value="Em 15 dias">Em 15 dias</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-black dark:text-white">Horário</label>
                      <input
                        type="time"
                        value={dueTime}
                        onChange={(e) => setDueTime(e.target.value)}
                        className="w-full h-11 sm:h-9 px-2 rounded-xl bg-[#f7f7f7] dark:bg-[#1c1c1e] text-base sm:text-xs text-black dark:text-white outline-none border border-transparent focus:border-[#9ca889]"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-black dark:text-white">
                    Observações Adicionais
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Detalhes ou orientações clínicas..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#f7f7f7] dark:bg-[#1c1c1e] text-xs text-black dark:text-white outline-none border border-transparent focus:border-[#9ca889] resize-none placeholder:text-[#767676] dark:placeholder:text-[#666]"
                  />
                </div>

                {/* Canais de Aviso */}
                <div className="flex items-center gap-4 pt-1 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-black dark:text-white">
                    <input
                      type="checkbox"
                      checked={notifyApp}
                      onChange={(e) => setNotifyApp(e.target.checked)}
                      className="rounded accent-[#9ca889]"
                    />
                    <span>Avisar no App (Toast)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-black dark:text-white">
                    <input
                      type="checkbox"
                      checked={notifyEmail}
                      onChange={(e) => setNotifyEmail(e.target.checked)}
                      className="rounded accent-[#9ca889]"
                    />
                    <span>Avisar por E-mail (1 dia antes)</span>
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="h-11 sm:h-8 px-3 rounded-xl bg-[#f4f4f4] dark:bg-[#1c1c1e] text-xs font-medium text-[#767676] dark:text-[#a0a0a0] hover:text-black dark:hover:text-white cursor-pointer text-center active:scale-95"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="h-11 sm:h-8 px-4 rounded-xl bg-[#9ca889] hover:bg-[#8f9b7c] text-[#070707] text-xs font-bold shadow-sm cursor-pointer active:scale-[0.98] w-full sm:w-auto"
                  >
                    Salvar Lembrete
                  </button>
                </div>
              </form>
            )}

            {/* Lista de Lembretes */}
            {filteredReminders.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-[#121214] rounded-2xl border border-black/[0.06] dark:border-white/[0.08] space-y-2">
                <Bell className="w-8 h-8 text-[#b5b5b5] dark:text-[#666] mx-auto" />
                <h4 className="text-xs font-bold text-black dark:text-white">Nenhum lembrete nesta categoria</h4>
                <p className="text-[11px] text-[#767676] dark:text-[#a0a0a0] max-w-[280px] mx-auto">
                  Você pode criar alertas com notificação por e-mail e aviso em tela 1 dia antes.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredReminders.map((rem) => (
                  <div
                    key={rem.id}
                    className={`p-3.5 rounded-2xl border transition-all text-left flex items-start justify-between gap-3 ${
                      rem.completed
                        ? "bg-white/60 dark:bg-white/[0.02] border-black/[0.04] dark:border-white/[0.04] opacity-60"
                        : "bg-white dark:bg-[#141416] border-black/[0.08] dark:border-white/[0.08] shadow-sm hover:border-black/30 dark:hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => onToggleReminder(rem.id)}
                        className={`w-5 h-5 rounded-md border mt-0.5 flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                          rem.completed
                            ? "bg-[#9ca889] border-[#9ca889] text-[#070707]"
                            : "border-black/30 dark:border-white/30 hover:border-black dark:hover:border-white bg-transparent"
                        }`}
                      >
                        {rem.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4
                            className={`text-xs font-bold text-black dark:text-white ${
                              rem.completed ? "line-through text-[#8f8f8f] dark:text-[#777]" : ""
                            }`}
                          >
                            {rem.title}
                          </h4>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f4f4f4] dark:bg-[#222] text-black dark:text-white">
                            {rem.dueDate} {rem.dueTime && `• ${rem.dueTime}`}
                          </span>
                          {rem.notifyEmail && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#9ca889]/15 text-[#9ca889] border border-[#9ca889]/30 flex items-center gap-1">
                              <Mail className="w-2.5 h-2.5" />
                              Avisa E-mail
                            </span>
                          )}
                        </div>

                        {rem.patientName && (
                          <span className="text-[11px] text-[#767676] dark:text-[#a0a0a0] flex items-center gap-1 mt-1 font-medium">
                            <User className="w-3 h-3 text-[#8f8f8f] dark:text-[#666]" />
                            {rem.patientName}
                          </span>
                        )}

                        {rem.description && (
                          <p className="text-[11px] text-[#8f8f8f] dark:text-[#777] mt-1 leading-snug">
                            {rem.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {rem.notifyEmail && (
                        <button
                          type="button"
                          onClick={() => handleTestEmail(rem)}
                          className="h-7 px-2 rounded-lg bg-[#9ca889]/15 hover:bg-[#9ca889]/25 text-[#9ca889] text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Enviar e-mail de alerta agora"
                        >
                          <Send className="w-3 h-3" />
                          <span className="hidden sm:inline">Disparar</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onDeleteReminder(rem.id)}
                        className="w-7 h-7 rounded-lg text-[#8f8f8f] hover:text-rose-500 hover:bg-rose-500/10 flex items-center justify-center transition-colors cursor-pointer"
                        title="Excluir lembrete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#121214] flex items-center justify-between">
            <span className="text-[11px] text-[#8f8f8f] dark:text-[#a0a0a0]">
              O algoritmo notifica automaticamente 1 dia antes da data.
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-black dark:bg-[#1c1c1e] text-white text-xs font-semibold hover:bg-[#262626] dark:hover:bg-[#2c2c2e] transition-all cursor-pointer shadow-sm"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

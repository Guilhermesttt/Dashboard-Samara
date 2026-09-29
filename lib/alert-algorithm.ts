"use client";

import { toast } from "sonner";
import { playNotificationSound } from "./sound";
import { sendEmailNotification } from "./email-service";
import { Appointment } from "@/components/dashboard/sections/appointments";
import { ReminderItem } from "./reminders-service";

interface AlertAlgorithmOptions {
  appointments: Appointment[];
  reminders: ReminderItem[];
}

/**
 * Verifica se uma string de data corresponde ao dia de hoje (ex: "Hoje", "28/09/2026", "2026-09-28")
 */
export function isDateToday(dateStr?: string): boolean {
  if (!dateStr) return false;
  const normalized = dateStr.trim().toLowerCase();
  if (normalized === "hoje") return true;

  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = today.getFullYear();
  const ptBR = `${day}/${month}/${year}`;
  const iso = `${year}-${month}-${day}`;

  return normalized === ptBR || normalized === iso;
}

/**
 * Retorna true se houver algum atendimento pendente/ativo marcado para HOJE.
 * Usado para controlar a exibição do badge "Hoje" na Sidebar e na navegação.
 */
export function checkHasTodayAppointments(customApts?: Appointment[]): boolean {
  if (typeof window === "undefined") return false;
  try {
    let apts: Appointment[] = customApts || [];
    if (!customApts || customApts.length === 0) {
      const raw = localStorage.getItem("samara_real_appointments");
      if (raw) apts = JSON.parse(raw);
    }
    if (!Array.isArray(apts) || apts.length === 0) return false;

    return apts.some((a) => {
      if (!a || a.status === "concluido") return false;
      return isDateToday(a.date);
    });
  } catch {
    return false;
  }
}

export function runClinicalAlertAlgorithm({
  appointments,
  reminders,
}: AlertAlgorithmOptions) {
  if (typeof window === "undefined") return;

  // Evita disparar toasts repetidos na mesma sessão de navegador a cada re-render
  const sessionAlertKey = "samara_last_alert_run";
  const now = Date.now();
  const lastRun = sessionStorage.getItem(sessionAlertKey);

  // Se já rodou nos últimos 5 minutos nesta sessão, não repete em loop
  if (lastRun && now - parseInt(lastRun) < 5 * 60 * 1000) {
    return;
  }

  sessionStorage.setItem(sessionAlertKey, now.toString());

  let hasTriggeredSound = false;

  // 1. Verificar Agendamentos Próximos (1 Dia Antes / Amanhã)
  const tomorrowApts = appointments.filter(
    (a) => a.date === "Amanhã" && a.status !== "concluido"
  );

  tomorrowApts.forEach((apt, idx) => {
    setTimeout(() => {
      if (!hasTriggeredSound) {
        playNotificationSound();
        hasTriggeredSound = true;
      }

      toast.warning(`⏰ Atendimento Amanhã: ${apt.patientName}`, {
        description: `${apt.procedureName} às ${apt.time}. E-mail de aviso preventivo disparado para a Dra. Sâmara.`,
        duration: 8000,
      });

      // Dispara envio do e-mail de alerta de 1 dia de antecedência
      sendEmailNotification({
        patientName: apt.patientName,
        procedureName: apt.procedureName,
        appointmentDate: "Amanhã",
        appointmentTime: apt.time,
        alertType: "agendamento_1_dia",
      });
    }, idx * 600);
  });

  // 2. Verificar Retornos de 15 Dias Próximos
  const returnApts = appointments.filter(
    (a) =>
      a.type === "Retorno de 15 Dias" &&
      (isDateToday(a.date) || a.date === "Amanhã") &&
      a.status !== "concluido"
  );

  returnApts.forEach((apt, idx) => {
    setTimeout(() => {
      if (!hasTriggeredSound) {
        playNotificationSound();
        hasTriggeredSound = true;
      }

      toast.info(`🔍 Retorno de 15 Dias: ${apt.patientName}`, {
        description: `Revisão de Botox / Harmonização agendada para ${apt.date.toLowerCase()} às ${apt.time}.`,
        duration: 8000,
      });

      sendEmailNotification({
        patientName: apt.patientName,
        procedureName: apt.procedureName,
        appointmentDate: apt.date,
        appointmentTime: apt.time,
        alertType: "retorno_15_dias",
      });
    }, (tomorrowApts.length + idx) * 600);
  });

  // 3. Verificar Lembretes Criados na Plataforma
  const urgentReminders = reminders.filter(
    (r) => !r.completed && (r.dueDate === "Hoje" || r.dueDate === "Amanhã")
  );

  urgentReminders.forEach((rem, idx) => {
    setTimeout(() => {
      toast(`🔔 Lembrete da Clínica: ${rem.title}`, {
        description: `${rem.dueDate} ${rem.dueTime ? `às ${rem.dueTime}` : ""} ${
          rem.description ? `• ${rem.description}` : ""
        }`,
        duration: 7000,
      });

      if (rem.notifyEmail) {
        sendEmailNotification({
          reminderTitle: rem.title,
          reminderDescription: rem.description,
          appointmentDate: rem.dueDate,
          alertType: "lembrete_geral",
        });
      }
    }, (tomorrowApts.length + returnApts.length + idx) * 600);
  });
}

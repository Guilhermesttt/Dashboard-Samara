// Serviço de Notificações por E-mail para a Dra. Sâmara Souza
// Permite disparar avisos automáticos de clientes agendados e lembretes clínicos

export interface EmailAlertPayload {
  toEmail?: string;
  patientName?: string;
  procedureName?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  reminderTitle?: string;
  reminderDescription?: string;
  alertType: "agendamento_1_dia" | "retorno_15_dias" | "lembrete_geral";
}

const DEFAULT_DOCTOR_EMAIL = "samara-nagy@hotmail.com";

export async function sendEmailNotification(payload: EmailAlertPayload): Promise<{
  success: boolean;
  message: string;
}> {
  const targetEmail = payload.toEmail || DEFAULT_DOCTOR_EMAIL;

  let subject = "";
  let messageContent = "";

  if (payload.alertType === "agendamento_1_dia") {
    subject = `⏰ [Alerta 1 Dia Antes] Paciente ${payload.patientName || "Cliente"} agendada para amanhã`;
    messageContent = `Olá Dra. Sâmara,\n\nEste é um aviso preventivo automático do seu sistema:\n\n• Paciente: ${payload.patientName}\n• Procedimento: ${payload.procedureName}\n• Horário: ${payload.appointmentTime || "Horário agendado"}\n• Data: Amanhã (${payload.appointmentDate || "1 dia antes"})\n\nAcesse seu painel para visualizar o prontuário e ficha da paciente.`;
  } else if (payload.alertType === "retorno_15_dias") {
    subject = `🔍 [Retorno de 15 Dias] Revisão de ${payload.patientName}`;
    messageContent = `Olá Dra. Sâmara,\n\nA paciente ${payload.patientName} tem retorno clínico de 15 dias (Revisão de Botox / Harmonização) agendado para ${payload.appointmentDate || "amanhã"}.\n\nNão se esqueça de validar a simetria facial e o retoque se necessário.`;
  } else {
    subject = `🔔 [Lembrete Clínico] ${payload.reminderTitle}`;
    messageContent = `Olá Dra. Sâmara,\n\nLembrete registrado em sua plataforma:\n\n• Título: ${payload.reminderTitle}\n• Detalhes: ${payload.reminderDescription || "Sem observações adicionais"}\n• Data Prevista: ${payload.appointmentDate || "Hoje"}`;
  }

  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("samara_dev_jwt_token") || localStorage.getItem("samara_prod_jwt_token") : null;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Tenta envio real via rota da API
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers,
      body: JSON.stringify({
        to: targetEmail,
        subject,
        content: messageContent,
        payload,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok && data.success) {
      return {
        success: true,
        message: data.message || `E-mail enviado com sucesso para ${targetEmail}`,
      };
    }

    return {
      success: false,
      message:
        data.message ||
        `Não foi possível enviar e-mail para ${targetEmail}. Verifique a configuração da chave RESEND_API_KEY.`,
    };
  } catch (error: any) {
    console.warn("Falha ao contatar rota de e-mail:", error);
    return {
      success: false,
      message: "Falha de conexão ao tentar enviar notificação por e-mail.",
    };
  }
}

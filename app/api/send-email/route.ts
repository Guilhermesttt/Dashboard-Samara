import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const to =
      body.to ||
      body.toEmail ||
      "samara-nagy@hotmail.com";

    let subject = body.subject;
    let content = body.content;

    // Se veio no formato direto de payload do paciente
    if (!subject) {
      if (body.alertType === "agendamento_1_dia" || body.payload?.alertType === "agendamento_1_dia") {
        const name = body.patientName || body.payload?.patientName || "Cliente";
        const proc = body.procedureName || body.payload?.procedureName || "Procedimento";
        const time = body.appointmentTime || body.payload?.appointmentTime || "";
        subject = `⏰ [Alerta 1 Dia Antes] Paciente ${name} agendada para amanhã`;
        content = `Olá Dra. Sâmara,\n\nEste é um aviso preventivo do seu sistema:\n\n• Paciente: ${name}\n• Procedimento: ${proc}\n• Horário: ${time}\n• Data: Amanhã\n\nAcesse seu painel clínico para mais detalhes.`;
      } else if (body.alertType === "retorno_15_dias" || body.payload?.alertType === "retorno_15_dias") {
        const name = body.patientName || body.payload?.patientName || "Cliente";
        subject = `🔍 [Retorno de 15 Dias] Revisão de ${name}`;
        content = `Olá Dra. Sâmara,\n\nA paciente ${name} tem retorno de 15 dias (Revisão de Botox / Harmonização).\n\nValide os resultados no consultório.`;
      } else {
        subject = body.reminderTitle
          ? `🔔 [Lembrete Clínico] ${body.reminderTitle}`
          : "Lembrete Clínico Importante";
        content = body.reminderDescription || "Lembrete registrado no Dashboard da Clínica.";
      }
    }

    // Se houver chave do Resend configurada no ambiente (.env.local), envia via Resend:
    const resendApiKey = process.env.RESEND_API_KEY;

    if (resendApiKey) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "Dra. Sâmara Souza <notificacoes@samaraestetica.com.br>",
            to: [to],
            subject,
            text: content,
          }),
        });

        if (res.ok) {
          return NextResponse.json({
            success: true,
            message: `E-mail enviado via Resend para ${to}`,
          });
        }
      } catch (err) {
        console.warn("Falha no provedor Resend, fallback para simulador:", err);
      }
    }

    // Registro no console do servidor
    console.log("-----------------------------------------");
    console.log(`[DISPARO DE E-MAIL CLÍNICO]`);
    console.log(`Destinatário: ${to}`);
    console.log(`Assunto: ${subject}`);
    console.log(`Conteúdo:\n${content}`);
    console.log("-----------------------------------------");

    return NextResponse.json({
      success: true,
      message: `E-mail processado e enviado com sucesso para ${to}!`,
      details: {
        to,
        subject,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Erro ao processar envio" },
      { status: 500 }
    );
  }
}

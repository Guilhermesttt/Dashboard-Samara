import { NextResponse } from "next/server";
import { fetchAppointmentsFromFirestore } from "@/lib/firebase-service";
import type { Appointment } from "@/components/dashboard/sections/appointments";

export const dynamic = "force-dynamic";

function getFormattedDate(offsetDays: number = 0): {
  ptBR: string;
  iso: string;
} {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return {
    ptBR: `${day}/${month}/${year}`,
    iso: `${year}-${month}-${day}`,
  };
}

function matchesDate(dateStr: string | undefined, offsetDays: number): boolean {
  if (!dateStr) return false;
  const normalized = dateStr.trim().toLowerCase();
  if (offsetDays === 0 && normalized === "hoje") return true;
  if (offsetDays === 1 && normalized === "amanhã") return true;

  const { ptBR, iso } = getFormattedDate(offsetDays);
  return normalized === ptBR || normalized === iso;
}

export async function GET(request: Request) {
  try {
    // 1. Verificação de autorização opcional via CRON_SECRET (Vercel Cron ou externo)
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization");

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Acesso não autorizado para o Cron Job." },
        { status: 401 }
      );
    }

    // 2. Buscar agendamentos diretamente do Firestore (execução server-side autônoma)
    const appointments = await fetchAppointmentsFromFirestore();

    if (!appointments || appointments.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Nenhum agendamento encontrado no banco de dados.",
        summary: { tomorrowCount: 0, returnCount: 0, emailSent: false },
        timestamp: new Date().toISOString(),
      });
    }

    // 3. Filtrar alertas:
    // a) Atendimentos para amanhã (alerta preventivo de 1 dia antes)
    const tomorrowApts = appointments.filter(
      (a) =>
        a.status !== "concluido" &&
        (matchesDate(a.date, 1) || a.date?.toLowerCase() === "amanhã")
    );

    // b) Retornos de 15 dias previstos para hoje ou amanhã
    const returnApts = appointments.filter(
      (a) =>
        a.status !== "concluido" &&
        a.type === "Retorno de 15 Dias" &&
        (matchesDate(a.date, 0) ||
          matchesDate(a.date, 1) ||
          a.date?.toLowerCase() === "hoje" ||
          a.date?.toLowerCase() === "amanhã")
    );

    const totalAlerts = tomorrowApts.length + returnApts.length;

    if (totalAlerts === 0) {
      return NextResponse.json({
        success: true,
        message: "Nenhum alerta de atendimento ou retorno pendente para hoje/amanhã.",
        summary: { tomorrowCount: 0, returnCount: 0, emailSent: false },
        timestamp: new Date().toISOString(),
      });
    }

    // 4. Montar o resumo clínico para a Dra. Sâmara
    const targetEmail =
      process.env.ALERT_RECIPIENT_EMAIL || "samara-nagy@hotmail.com";
    const subject = `📋 [Resumo Clínico Diário] ${totalAlerts} atendimento(s) & retorno(s) previstos`;

    let emailText = `Olá Dra. Sâmara,\n\nEste é o relatório diário automático do seu sistema clínico:\n\n`;

    if (tomorrowApts.length > 0) {
      emailText += `⏰ ATENDIMENTOS DE AMANHÃ (${tomorrowApts.length}):\n`;
      tomorrowApts.forEach((apt) => {
        emailText += `  • ${apt.patientName} - ${apt.procedureName} às ${apt.time || "horário a definir"}\n`;
      });
      emailText += `\n`;
    }

    if (returnApts.length > 0) {
      emailText += `🔍 RETORNOS DE 15 DIAS (${returnApts.length}):\n`;
      returnApts.forEach((apt) => {
        emailText += `  • ${apt.patientName} - ${apt.procedureName} (${apt.date} às ${apt.time})\n`;
      });
      emailText += `\n`;
    }

    emailText += `Acesse seu painel clínico em tempo real para visualizar prontuários e anamneses.\n`;

    // 5. Enviar e-mail via Resend se a chave estiver configurada
    const resendApiKey = process.env.RESEND_API_KEY;
    let emailSent = false;
    let emailMessage = "";

    if (resendApiKey) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from:
              process.env.RESEND_FROM_EMAIL ||
              "Dra. Sâmara Souza <onboarding@resend.dev>",
            to: [targetEmail],
            subject,
            text: emailText,
          }),
        });

        const resData = await res.json().catch(() => ({}));

        if (res.ok) {
          emailSent = true;
          emailMessage = `E-mail enviado com sucesso via Resend para ${targetEmail}`;
        } else {
          emailMessage = `Falha no Resend: ${resData?.message || "Erro desconhecido"}`;
        }
      } catch (err: any) {
        emailMessage = `Erro de rede ao conectar com Resend: ${err?.message}`;
      }
    } else {
      emailMessage =
        "RESEND_API_KEY não configurada no servidor. O resumo diário foi gerado mas não despachado externamente.";
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalAlerts,
        tomorrowCount: tomorrowApts.length,
        returnCount: returnApts.length,
        emailSent,
        emailMessage,
      },
      details: {
        tomorrow: tomorrowApts.map((a) => ({
          name: a.patientName,
          procedure: a.procedureName,
          time: a.time,
        })),
        returns: returnApts.map((a) => ({
          name: a.patientName,
          procedure: a.procedureName,
          date: a.date,
          time: a.time,
        })),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Erro na execução do Cron de Alertas:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Erro interno ao executar Cron de Alertas",
      },
      { status: 500 }
    );
  }
}

"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Appointment } from "@/components/dashboard/sections/appointments";
import { PatientRecord } from "@/components/dashboard/sections/customer-profile-modal";

export interface GeneratePdfOptions {
  appointments: Appointment[];
  patients: PatientRecord[];
  reportType: "geral" | "financeiro" | "pacientes" | "retornos";
  periodName?: string;
  doctorName?: string;
}

export function generateClinicalPdfReport({
  appointments,
  patients,
  reportType,
  periodName = "Todos os Registros",
  doctorName = "Dra. Sâmara Souza",
}: GeneratePdfOptions) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Cores do Design System
  const primaryColor: [number, number, number] = [15, 15, 15]; // Noir
  const accentColor: [number, number, number] = [120, 50, 160]; // Roxo elegante clínica
  const grayMuted: [number, number, number] = [120, 120, 120];

  // 1. Cabeçalho Oficial da Clínica
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...primaryColor);
  doc.text("DRA. SÂMARA SOUZA", 14, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...grayMuted);
  doc.text("Biomedicina Esteta • Harmonização Facial e Corporal", 14, 23);
  doc.text("CRBM 34.819-SP | WhatsApp: (11) 98844-2200", 14, 27);

  // Linha divisória superior
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.4);
  doc.line(14, 31, pageWidth - 14, 31);

  // 2. Identificação do Relatório
  const now = new Date();
  const formattedDate = now.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const formattedTime = now.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  let reportTitle = "RELATÓRIO CLÍNICO & GESTÃO ESTRATÉGICA";
  if (reportType === "financeiro") reportTitle = "RELATÓRIO FINANCEIRO & FATURAMENTO";
  if (reportType === "pacientes") reportTitle = "RELATÓRIO DA CARTEIRA DE CLIENTES";
  if (reportType === "retornos") reportTitle = "RELATÓRIO DE REVISÃO E RETORNOS (15 DIAS)";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.text(reportTitle, 14, 39);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...grayMuted);
  doc.text(`Período de Referência: ${periodName}`, 14, 44);
  doc.text(`Emitido em: ${formattedDate} às ${formattedTime} por ${doctorName}`, 14, 48);

  // 3. Cálculos dos Dados Reais
  const totalFaturamento = appointments.reduce((sum, a) => {
    if (a.status === "concluido" || a.status === "confirmado") {
      return sum + (a.value || 0);
    }
    return sum;
  }, 0);

  const concluidosCount = appointments.filter((a) => a.status === "concluido").length;
  const retornosCount = appointments.filter(
    (a) => a.type === "Retorno de 15 Dias" || a.status === "retorno_pendente"
  ).length;
  const ticketMedio =
    concluidosCount > 0 ? totalFaturamento / concluidosCount : totalFaturamento > 0 ? totalFaturamento / appointments.length : 0;

  const formatBRL = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val || 0);

  // 4. Caixa Resumo de KPIs Clínicos
  doc.setFillColor(248, 248, 248);
  doc.roundedRect(14, 52, pageWidth - 28, 20, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...grayMuted);
  doc.text("FATURAMENTO TOTAL", 20, 58);
  doc.text("PACIENTES CADASTRADAS", 70, 58);
  doc.text("SESSÕES CONCLUÍDAS", 120, 58);
  doc.text("RETORNOS (15 DIAS)", 165, 58);

  doc.setFontSize(11);
  doc.setTextColor(...primaryColor);
  doc.text(formatBRL(totalFaturamento), 20, 66);
  doc.text(`${patients.length}`, 70, 66);
  doc.text(`${concluidosCount}`, 120, 66);
  doc.text(`${retornosCount}`, 165, 66);

  let currentY = 78;

  // 5. Tabelas Baseadas no Tipo do Relatório
  if (reportType === "geral" || reportType === "financeiro") {
    // Tabela A: Ranking de Procedimentos
    const procMap = new Map<string, { count: number; total: number; cat: string }>();
    appointments.forEach((a) => {
      const name = a.procedureName || "Não especificado";
      const existing = procMap.get(name) || { count: 0, total: 0, cat: a.category || "Facial" };
      existing.count += 1;
      existing.total += a.value || 0;
      procMap.set(name, existing);
    });

    const procRows = Array.from(procMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .map(([name, data]) => {
        const share =
          totalFaturamento > 0 ? ((data.total / totalFaturamento) * 100).toFixed(1) + "%" : "0%";
        return [name, data.cat, `${data.count} sessão(ões)`, formatBRL(data.total), share];
      });

    if (procRows.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...primaryColor);
      doc.text("1. Procedimentos Mais Demandados", 14, currentY);

      autoTable(doc, {
        startY: currentY + 3,
        head: [["Procedimento", "Região", "Atendimentos", "Faturamento", "Participação"]],
        body: procRows,
        theme: "striped",
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 8,
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [40, 40, 40],
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250],
        },
        margin: { left: 14, right: 14 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 10;
    }

    // Tabela B: Lista de Atendimentos Detalhada
    if (appointments.length > 0) {
      if (currentY > pageHeight - 50) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...primaryColor);
      doc.text("2. Histórico Detalhado dos Agendamentos", 14, currentY);

      const aptRows = appointments.map((a) => {
        let statusLabel = "Agendado";
        if (a.status === "confirmado") statusLabel = "Confirmado";
        if (a.status === "em_atendimento") statusLabel = "Em Sala";
        if (a.status === "retorno_pendente") statusLabel = "Retorno 15d";
        if (a.status === "concluido") statusLabel = "Concluído";

        return [
          a.patientName,
          a.procedureName,
          a.type || "Aplicação",
          `${a.date} ${a.time ? `às ${a.time}` : ""}`,
          formatBRL(a.value),
          statusLabel,
        ];
      });

      autoTable(doc, {
        startY: currentY + 3,
        head: [["Paciente", "Procedimento", "Tipo", "Data / Hora", "Valor", "Status"]],
        body: aptRows,
        theme: "striped",
        headStyles: {
          fillColor: [50, 50, 50],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 8,
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [40, 40, 40],
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250],
        },
        margin: { left: 14, right: 14 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 10;
    }
  } else if (reportType === "pacientes") {
    // Tabela de Pacientes Cadastrados
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...primaryColor);
    doc.text("Carteira de Clientes Ativas", 14, currentY);

    const patientRows = patients.map((p) => [
      p.name,
      p.phone || "(Não inf.)",
      p.birthDate || "(Não inf.)",
      `${p.proceduresCount || 0} procedimento(s)`,
      p.status || "Ativa",
    ]);

    autoTable(doc, {
      startY: currentY + 3,
      head: [["Nome Completo", "Telefone / WhatsApp", "Nascimento", "Procedimentos", "Situação"]],
      body:
        patientRows.length > 0
          ? patientRows
          : [["Nenhuma paciente cadastrada ainda.", "-", "-", "-", "-"]],
      theme: "striped",
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [40, 40, 40],
      },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  } else if (reportType === "retornos") {
    // Tabela de Retornos de 15 Dias
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...primaryColor);
    doc.text("Acompanhamento de Revisão & Retornos de 15 Dias (Botox & Fios)", 14, currentY);

    const retornosList = appointments.filter(
      (a) => a.type === "Retorno de 15 Dias" || a.status === "retorno_pendente"
    );

    const rows = retornosList.map((a) => [
      a.patientName,
      a.patientPhone || "(Não inf.)",
      a.procedureName,
      `${a.date} ${a.time ? `às ${a.time}` : ""}`,
      a.status === "concluido" ? "Revisão Concluída" : "Retorno Pendente",
      a.notes || "Avaliar simetria e retoque",
    ]);

    autoTable(doc, {
      startY: currentY + 3,
      head: [["Paciente", "Telefone", "Procedimento", "Data Prevista", "Status", "Conduta"]],
      body:
        rows.length > 0
          ? rows
          : [["Nenhum retorno de 15 dias pendente no momento.", "-", "-", "-", "-", "-"]],
      theme: "striped",
      headStyles: {
        fillColor: [180, 83, 9], // Tom âmbar clínico para retornos
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [40, 40, 40],
      },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // Se não houver atendimentos no geral
  if (appointments.length === 0 && patients.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...grayMuted);
    doc.text(
      "Nenhum atendimento ou paciente registrado na base de dados no momento da geração.",
      14,
      currentY + 5
    );
  }

  // 6. Rodapé em todas as páginas
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(230, 230, 230);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(150, 150, 150);
    doc.text(
      "Documento oficial gerado eletronicamente pela Plataforma Samara Estética Avançada.",
      14,
      pageHeight - 8
    );
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - 32, pageHeight - 8);
  }

  // 7. Salvar / Download do Arquivo PDF
  const sanitizedDate = formattedDate.replace(/\//g, "-");
  const fileName = `Relatorio_Samara_Estetica_${reportType}_${sanitizedDate}.pdf`;
  doc.save(fileName);

  return fileName;
}

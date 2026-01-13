import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format, startOfDay, endOfDay, subDays, startOfWeek, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Occurrence,
  statusConfig,
  triageConfig,
  outcomeConfig,
  OccurrenceStatus,
  TriageClassification,
  OutcomeType,
} from "@/types/occurrence";

interface ReportPDFOptions {
  occurrences: Partial<Occurrence>[];
  period: "daily" | "weekly" | "monthly" | "custom";
  dateFrom?: Date;
  dateTo?: Date;
  tenantName: string;
  includeCharts?: boolean;
}

interface KPIs {
  total: number;
  byStatus: Record<OccurrenceStatus, number>;
  byTriage: Record<TriageClassification, number>;
  byType: Record<string, number>;
  byOutcome: Record<OutcomeType, number>;
  avgTriageTime: number;
  avgResolutionTime: number;
}

function calculateKPIs(occurrences: Partial<Occurrence>[]): KPIs {
  const kpis: KPIs = {
    total: occurrences.length,
    byStatus: {} as Record<OccurrenceStatus, number>,
    byTriage: {} as Record<TriageClassification, number>,
    byType: { assistencial: 0, administrativa: 0, tecnica: 0 },
    byOutcome: {} as Record<OutcomeType, number>,
    avgTriageTime: 0,
    avgResolutionTime: 0,
  };

  // Initialize counts
  Object.keys(statusConfig).forEach((s) => {
    kpis.byStatus[s as OccurrenceStatus] = 0;
  });
  Object.keys(triageConfig).forEach((t) => {
    kpis.byTriage[t as TriageClassification] = 0;
  });
  Object.keys(outcomeConfig).forEach((o) => {
    kpis.byOutcome[o as OutcomeType] = 0;
  });

  occurrences.forEach((occ) => {
    if (occ.status) kpis.byStatus[occ.status]++;
    if (occ.triagem) kpis.byTriage[occ.triagem]++;
    if (occ.tipo) kpis.byType[occ.tipo]++;
    if (occ.desfecho?.tipos) {
      occ.desfecho.tipos.forEach((t) => {
        kpis.byOutcome[t]++;
      });
    }
  });

  return kpis;
}

export function generateReportPDF({
  occurrences,
  period,
  dateFrom,
  dateTo,
  tenantName,
}: ReportPDFOptions): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  const kpis = calculateKPIs(occurrences);

  // Period label
  let periodLabel = "";
  const now = new Date();
  switch (period) {
    case "daily":
      periodLabel = format(now, "'Relatório Diário -' dd 'de' MMMM 'de' yyyy", { locale: ptBR });
      break;
    case "weekly":
      periodLabel = `Relatório Semanal - ${format(startOfWeek(now), "dd/MM")} a ${format(now, "dd/MM/yyyy")}`;
      break;
    case "monthly":
      periodLabel = format(now, "'Relatório Mensal -' MMMM 'de' yyyy", { locale: ptBR });
      break;
    case "custom":
      periodLabel = `Relatório Customizado - ${format(dateFrom!, "dd/MM/yyyy")} a ${format(dateTo!, "dd/MM/yyyy")}`;
      break;
  }

  // Header
  doc.setFillColor(13, 148, 136);
  doc.rect(0, 0, pageWidth, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("RELATÓRIO DE OCORRÊNCIAS", 14, 18);
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text(tenantName, 14, 28);
  doc.setFontSize(10);
  doc.text(periodLabel, 14, 36);
  doc.text(
    `Gerado em: ${format(now, "dd/MM/yyyy 'às' HH:mm")}`,
    pageWidth - 60,
    36
  );
  doc.setTextColor(0, 0, 0);
  yPos = 55;

  // Executive Summary
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("SUMÁRIO EXECUTIVO", 14, yPos);
  yPos += 10;

  // KPI Cards (simplified as text boxes)
  const kpiBoxWidth = (pageWidth - 42) / 4;
  const kpiData = [
    { label: "Total", value: kpis.total.toString() },
    { label: "Concluídas", value: kpis.byStatus.concluida?.toString() || "0" },
    { label: "Pendentes", value: (kpis.byStatus.registrada + kpis.byStatus.em_triagem + kpis.byStatus.em_analise + kpis.byStatus.acao_em_andamento).toString() },
    { label: "Taxa Resolução", value: `${Math.round((kpis.byStatus.concluida / kpis.total) * 100) || 0}%` },
  ];

  kpiData.forEach((kpi, index) => {
    const x = 14 + index * (kpiBoxWidth + 4);
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(x, yPos, kpiBoxWidth, 25, 3, 3, "F");
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(13, 148, 136);
    doc.text(kpi.value, x + kpiBoxWidth / 2, yPos + 12, { align: "center" });
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(kpi.label, x + kpiBoxWidth / 2, yPos + 20, { align: "center" });
  });
  doc.setTextColor(0, 0, 0);
  yPos += 35;

  // By Status Table
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Distribuição por Status", 14, yPos);
  yPos += 6;

  const statusData = Object.entries(kpis.byStatus)
    .filter(([_, count]) => count > 0)
    .map(([status, count]) => [
      statusConfig[status as OccurrenceStatus]?.label || status,
      count.toString(),
      `${Math.round((count / kpis.total) * 100)}%`,
    ]);

  autoTable(doc, {
    startY: yPos,
    head: [["Status", "Quantidade", "%"]],
    body: statusData,
    theme: "striped",
    headStyles: { fillColor: [13, 148, 136] },
    margin: { left: 14, right: 14 },
    tableWidth: (pageWidth - 28) / 2 - 5,
  });

  // By Type Table (side by side)
  const typeData = Object.entries(kpis.byType)
    .filter(([_, count]) => count > 0)
    .map(([tipo, count]) => [
      tipo === "assistencial" ? "Assistencial" : tipo === "administrativa" ? "Administrativa" : "Técnica",
      count.toString(),
      `${Math.round((count / kpis.total) * 100)}%`,
    ]);

  autoTable(doc, {
    startY: yPos,
    head: [["Tipo", "Quantidade", "%"]],
    body: typeData,
    theme: "striped",
    headStyles: { fillColor: [99, 102, 241] },
    margin: { left: pageWidth / 2 + 5, right: 14 },
    tableWidth: (pageWidth - 28) / 2 - 5,
  });

  yPos = Math.max((doc as any).lastAutoTable.finalY, yPos) + 15;

  // By Triage
  if (Object.values(kpis.byTriage).some((v) => v > 0)) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Distribuição por Triagem", 14, yPos);
    yPos += 6;

    const triageData = Object.entries(kpis.byTriage)
      .filter(([_, count]) => count > 0)
      .map(([triage, count]) => [
        triageConfig[triage as TriageClassification]?.label || triage,
        count.toString(),
        `${Math.round((count / kpis.total) * 100)}%`,
      ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Classificação", "Quantidade", "%"]],
      body: triageData,
      theme: "striped",
      headStyles: { fillColor: [234, 179, 8] },
      margin: { left: 14, right: 14 },
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Occurrences List
  if (yPos > 200) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Lista de Ocorrências no Período", 14, yPos);
  yPos += 6;

  const listData = occurrences.slice(0, 50).map((occ) => [
    occ.protocolo || "",
    occ.tipo === "assistencial" ? "Assist." : occ.tipo === "administrativa" ? "Admin." : "Técn.",
    statusConfig[occ.status as OccurrenceStatus]?.label || "",
    occ.triagem ? triageConfig[occ.triagem]?.label?.substring(0, 12) : "-",
    format(new Date(occ.criadoEm!), "dd/MM/yyyy"),
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["Protocolo", "Tipo", "Status", "Triagem", "Data"]],
    body: listData,
    theme: "striped",
    headStyles: { fillColor: [13, 148, 136] },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8 },
  });

  // Footer
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Página ${i} de ${pageCount} | ${tenantName} | Relatório gerado automaticamente para análise gerencial e uso por agentes de IA`,
      pageWidth / 2,
      290,
      { align: "center" }
    );
  }

  return doc;
}

export function downloadReportPDF(
  occurrences: Partial<Occurrence>[],
  period: "daily" | "weekly" | "monthly" | "custom",
  tenantName: string,
  dateFrom?: Date,
  dateTo?: Date
) {
  const doc = generateReportPDF({
    occurrences,
    period,
    dateFrom,
    dateTo,
    tenantName,
  });
  const filename = `relatorio_${period}_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`;
  doc.save(filename);
}

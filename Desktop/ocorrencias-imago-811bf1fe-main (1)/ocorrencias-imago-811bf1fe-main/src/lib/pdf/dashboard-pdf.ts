import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardStats {
  total: number;
  pendentes: number;
  emAnalise: number;
  concluidas: number;
  improcedentes: number;
  esteMes: number;
  byTriage: {
    circunstancia_risco: number;
    near_miss: number;
    incidente_sem_dano: number;
    evento_adverso: number;
    evento_sentinela: number;
  };
  byType: {
    assistencial: number;
    administrativa: number;
    tecnica: number;
  };
}

interface DashboardPDFOptions {
  stats: DashboardStats;
  dateRange: string;
  tenantName?: string;
}

const dateRangeLabels: Record<string, string> = {
  "7d": "Últimos 7 dias",
  "30d": "Últimos 30 dias",
  "90d": "Últimos 90 dias",
  "year": "Este ano",
};

// IMAGO Brand Colors (RGB)
const IMAGO_BLUE = [59, 111, 160] as const;
const IMAGO_BLUE_LIGHT = [235, 242, 248] as const;
const IMAGO_DARK = [35, 45, 55] as const;
const IMAGO_GRAY = [107, 114, 128] as const;
const IMAGO_BORDER = [214, 221, 229] as const;

// Chart colors (more sophisticated palette)
const triageColors: Record<string, [number, number, number]> = {
  circunstancia_risco: [34, 197, 94],
  near_miss: [250, 204, 21],
  incidente_sem_dano: [251, 146, 60],
  evento_adverso: [239, 68, 68],
  evento_sentinela: [153, 27, 27],
};

const typeColors: Record<string, [number, number, number]> = {
  assistencial: [59, 111, 160],
  administrativa: [139, 92, 246],
  tecnica: [249, 115, 22],
};

function drawPieChart(
  doc: jsPDF,
  data: { label: string; value: number; color: [number, number, number] }[],
  centerX: number,
  centerY: number,
  radius: number
) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) {
    doc.setFillColor(230, 230, 230);
    doc.circle(centerX, centerY, radius, "F");
    doc.setFontSize(7);
    doc.setTextColor(IMAGO_GRAY[0], IMAGO_GRAY[1], IMAGO_GRAY[2]);
    doc.text("Sem dados", centerX, centerY, { align: "center" });
    return;
  }

  let startAngle = -Math.PI / 2;

  data.forEach((item) => {
    if (item.value === 0) return;

    const sliceAngle = (item.value / total) * 2 * Math.PI;
    doc.setFillColor(item.color[0], item.color[1], item.color[2]);

    const segments = 50;
    for (let i = 0; i < segments; i++) {
      const a1 = startAngle + (sliceAngle * i) / segments;
      const a2 = startAngle + (sliceAngle * (i + 1)) / segments;

      const x1 = centerX + radius * Math.cos(a1);
      const y1 = centerY + radius * Math.sin(a1);
      const x2 = centerX + radius * Math.cos(a2);
      const y2 = centerY + radius * Math.sin(a2);

      doc.triangle(centerX, centerY, x1, y1, x2, y2, "F");
    }

    startAngle += sliceAngle;
  });

  // Donut hole
  doc.setFillColor(255, 255, 255);
  doc.circle(centerX, centerY, radius * 0.55, "F");

  // Center text
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(IMAGO_DARK[0], IMAGO_DARK[1], IMAGO_DARK[2]);
  doc.text(total.toString(), centerX, centerY - 1, { align: "center" });
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("total", centerX, centerY + 4, { align: "center" });
}

function drawBarChart(
  doc: jsPDF,
  data: { label: string; value: number; color: [number, number, number] }[],
  startX: number,
  startY: number,
  width: number,
  height: number
) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const barWidth = (width - 20) / data.length - 8;
  const barSpacing = 8;

  // Draw axis
  doc.setDrawColor(IMAGO_BORDER[0], IMAGO_BORDER[1], IMAGO_BORDER[2]);
  doc.setLineWidth(0.2);
  doc.line(startX, startY + height, startX + width, startY + height);

  data.forEach((item, index) => {
    const barHeight = (item.value / maxValue) * (height - 15);
    const x = startX + 10 + index * (barWidth + barSpacing);
    const y = startY + height - barHeight;

    // Bar shadow
    doc.setFillColor(220, 220, 220);
    doc.roundedRect(x + 1, y + 1, barWidth, barHeight, 2, 2, "F");

    // Bar
    doc.setFillColor(item.color[0], item.color[1], item.color[2]);
    doc.roundedRect(x, y, barWidth, barHeight, 2, 2, "F");

    // Value on top
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(IMAGO_DARK[0], IMAGO_DARK[1], IMAGO_DARK[2]);
    doc.text(item.value.toString(), x + barWidth / 2, y - 2, { align: "center" });

    // Label below
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(IMAGO_GRAY[0], IMAGO_GRAY[1], IMAGO_GRAY[2]);
    const labelLines = doc.splitTextToSize(item.label, barWidth + 4);
    doc.text(labelLines, x + barWidth / 2, startY + height + 5, { align: "center" });
  });
}

function drawLegend(
  doc: jsPDF,
  data: { label: string; value: number; color: [number, number, number] }[],
  startX: number,
  startY: number
) {
  const itemHeight = 7;

  data.forEach((item, index) => {
    const y = startY + index * itemHeight;

    // Color dot
    doc.setFillColor(item.color[0], item.color[1], item.color[2]);
    doc.circle(startX + 2, y - 1, 2, "F");

    // Label
    doc.setFontSize(7);
    doc.setTextColor(IMAGO_DARK[0], IMAGO_DARK[1], IMAGO_DARK[2]);
    doc.text(item.label, startX + 7, y);

    // Value
    doc.setFont("helvetica", "bold");
    doc.text(`(${item.value})`, startX + 55, y);
    doc.setFont("helvetica", "normal");
  });
}

export function generateDashboardPDF({
  stats,
  dateRange,
  tenantName = "IMAGO",
}: DashboardPDFOptions): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;

  // ============ HEADER ============
  doc.setFillColor(IMAGO_BLUE[0], IMAGO_BLUE[1], IMAGO_BLUE[2]);
  doc.rect(0, 0, pageWidth, 40, "F");

  // Logo placeholder
  doc.setFillColor(255, 255, 255);
  doc.circle(25, 20, 10, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("IMAGO", 40, 18);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Diagnóstico por Imagem", 40, 24);

  // Title
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("RELATÓRIO DE INDICADORES", pageWidth - 14, 15, { align: "right" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(dateRangeLabels[dateRange] || dateRange, pageWidth - 14, 23, { align: "right" });

  doc.setFontSize(8);
  doc.text(
    format(new Date(), "'Gerado em' dd/MM/yyyy 'às' HH:mm", { locale: ptBR }),
    pageWidth - 14,
    30,
    { align: "right" }
  );

  yPos = 55;

  // ============ KPI CARDS ============
  const resolutionRate = stats.total
    ? Math.round((stats.concluidas / stats.total) * 100)
    : 0;

  const kpiData = [
    { label: "Total", value: stats.total.toString(), highlight: true },
    { label: "Pendentes", value: stats.pendentes.toString() },
    { label: "Em Análise", value: stats.emAnalise.toString() },
    { label: "Concluídas", value: stats.concluidas.toString() },
    { label: "Resolução", value: `${resolutionRate}%`, highlight: true },
  ];

  const cardWidth = (pageWidth - 28 - 16) / 5;
  const cardHeight = 25;

  kpiData.forEach((kpi, index) => {
    const x = 14 + index * (cardWidth + 4);

    if (kpi.highlight) {
      doc.setFillColor(IMAGO_BLUE[0], IMAGO_BLUE[1], IMAGO_BLUE[2]);
    } else {
      doc.setFillColor(IMAGO_BLUE_LIGHT[0], IMAGO_BLUE_LIGHT[1], IMAGO_BLUE_LIGHT[2]);
    }
    doc.roundedRect(x, yPos, cardWidth, cardHeight, 3, 3, "F");

    // Value
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    if (kpi.highlight) {
      doc.setTextColor(255, 255, 255);
    } else {
      doc.setTextColor(IMAGO_DARK[0], IMAGO_DARK[1], IMAGO_DARK[2]);
    }
    doc.text(kpi.value, x + cardWidth / 2, yPos + 12, { align: "center" });

    // Label
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    if (kpi.highlight) {
      doc.setTextColor(220, 230, 240);
    } else {
      doc.setTextColor(IMAGO_GRAY[0], IMAGO_GRAY[1], IMAGO_GRAY[2]);
    }
    doc.text(kpi.label, x + cardWidth / 2, yPos + 20, { align: "center" });
  });

  yPos += cardHeight + 20;

  // ============ CHARTS SECTION ============
  // Section title
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(IMAGO_BLUE[0], IMAGO_BLUE[1], IMAGO_BLUE[2]);
  doc.text("DISTRIBUIÇÃO DAS OCORRÊNCIAS", 14, yPos);
  yPos += 12;

  // Prepare chart data
  const triageData = [
    { label: "Circunstância de Risco", value: stats.byTriage.circunstancia_risco, color: triageColors.circunstancia_risco },
    { label: "Near Miss", value: stats.byTriage.near_miss, color: triageColors.near_miss },
    { label: "Incidente sem Dano", value: stats.byTriage.incidente_sem_dano, color: triageColors.incidente_sem_dano },
    { label: "Evento Adverso", value: stats.byTriage.evento_adverso, color: triageColors.evento_adverso },
    { label: "Evento Sentinela", value: stats.byTriage.evento_sentinela, color: triageColors.evento_sentinela },
  ];

  const typeData = [
    { label: "Assistencial", value: stats.byType.assistencial, color: typeColors.assistencial },
    { label: "Administrativa", value: stats.byType.administrativa, color: typeColors.administrativa },
    { label: "Técnica", value: stats.byType.tecnica, color: typeColors.tecnica },
  ];

  // Left: Pie chart with legend
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(IMAGO_DARK[0], IMAGO_DARK[1], IMAGO_DARK[2]);
  doc.text("Por Triagem", 14, yPos);

  drawPieChart(doc, triageData, 40, yPos + 30, 20);
  drawLegend(doc, triageData, 68, yPos + 10);

  // Right: Bar chart
  doc.text("Por Tipo", pageWidth / 2 + 10, yPos);
  drawBarChart(doc, typeData, pageWidth / 2 + 5, yPos + 5, 85, 50);

  yPos += 70;

  // ============ DETAILED TABLES ============
  // Triage table
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(IMAGO_BLUE[0], IMAGO_BLUE[1], IMAGO_BLUE[2]);
  doc.text("DETALHAMENTO POR TRIAGEM", 14, yPos);
  yPos += 8;

  autoTable(doc, {
    startY: yPos,
    head: [["Classificação", "Quantidade", "%"]],
    body: triageData.map((item) => [
      item.label,
      item.value.toString(),
      stats.total ? `${Math.round((item.value / stats.total) * 100)}%` : "0%",
    ]),
    theme: "plain",
    headStyles: {
      fillColor: [IMAGO_BLUE[0], IMAGO_BLUE[1], IMAGO_BLUE[2]],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [IMAGO_DARK[0], IMAGO_DARK[1], IMAGO_DARK[2]],
    },
    alternateRowStyles: {
      fillColor: [IMAGO_BLUE_LIGHT[0], IMAGO_BLUE_LIGHT[1], IMAGO_BLUE_LIGHT[2]],
    },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 40, halign: "center" },
      2: { cellWidth: 30, halign: "center" },
    },
    margin: { left: 14, right: 14 },
    styles: { cellPadding: 3 },
  });
  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Type table
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(IMAGO_BLUE[0], IMAGO_BLUE[1], IMAGO_BLUE[2]);
  doc.text("DETALHAMENTO POR TIPO", 14, yPos);
  yPos += 8;

  autoTable(doc, {
    startY: yPos,
    head: [["Tipo", "Quantidade", "%"]],
    body: typeData.map((item) => [
      item.label,
      item.value.toString(),
      stats.total ? `${Math.round((item.value / stats.total) * 100)}%` : "0%",
    ]),
    theme: "plain",
    headStyles: {
      fillColor: [IMAGO_BLUE[0], IMAGO_BLUE[1], IMAGO_BLUE[2]],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [IMAGO_DARK[0], IMAGO_DARK[1], IMAGO_DARK[2]],
    },
    alternateRowStyles: {
      fillColor: [IMAGO_BLUE_LIGHT[0], IMAGO_BLUE_LIGHT[1], IMAGO_BLUE_LIGHT[2]],
    },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 40, halign: "center" },
      2: { cellWidth: 30, halign: "center" },
    },
    margin: { left: 14, right: 14 },
    styles: { cellPadding: 3 },
  });
  yPos = (doc as any).lastAutoTable.finalY + 15;

  // ============ ANALYSIS SUMMARY ============
  doc.setFillColor(IMAGO_BLUE_LIGHT[0], IMAGO_BLUE_LIGHT[1], IMAGO_BLUE_LIGHT[2]);
  doc.roundedRect(14, yPos, pageWidth - 28, 45, 3, 3, "F");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(IMAGO_BLUE[0], IMAGO_BLUE[1], IMAGO_BLUE[2]);
  doc.text("ANÁLISE RESUMIDA", 20, yPos + 8);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(IMAGO_DARK[0], IMAGO_DARK[1], IMAGO_DARK[2]);

  let summaryY = yPos + 16;
  const summaryPoints: string[] = [];

  if (stats.total === 0) {
    summaryPoints.push("• Nenhuma ocorrência registrada no período selecionado.");
  } else {
    summaryPoints.push(`• Total de ${stats.total} ocorrências registradas no período.`);

    if (stats.pendentes > 0) {
      summaryPoints.push(`• ${stats.pendentes} ocorrência(s) aguardando processamento.`);
    }

    if (resolutionRate >= 80) {
      summaryPoints.push(`• Taxa de resolução de ${resolutionRate}% — Excelente desempenho.`);
    } else if (resolutionRate >= 50) {
      summaryPoints.push(`• Taxa de resolução de ${resolutionRate}% — Desempenho moderado.`);
    } else if (stats.total > 0) {
      summaryPoints.push(`• Taxa de resolução de ${resolutionRate}% — Atenção necessária.`);
    }

    const criticalEvents = stats.byTriage.evento_adverso + stats.byTriage.evento_sentinela;
    if (criticalEvents > 0) {
      summaryPoints.push(`• ${criticalEvents} evento(s) crítico(s) registrado(s) que requerem atenção.`);
    }
  }

  summaryPoints.forEach((point) => {
    doc.text(point, 20, summaryY);
    summaryY += 6;
  });

  // ============ FOOTER ============
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    doc.setDrawColor(IMAGO_BORDER[0], IMAGO_BORDER[1], IMAGO_BORDER[2]);
    doc.setLineWidth(0.3);
    doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);

    doc.setFontSize(7);
    doc.setTextColor(IMAGO_GRAY[0], IMAGO_GRAY[1], IMAGO_GRAY[2]);
    doc.text("IMAGO Diagnóstico por Imagem | Relatório de Indicadores", 14, pageHeight - 10);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 10, { align: "right" });
  }

  return doc;
}

export function downloadDashboardPDF(
  stats: DashboardStats,
  dateRange: string,
  tenantName?: string
) {
  const doc = generateDashboardPDF({ stats, dateRange, tenantName });
  const filename = `IMAGO_Dashboard_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`;
  doc.save(filename);
}

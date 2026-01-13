import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Occurrence,
  statusConfig,
  triageConfig,
  outcomeConfig,
  subtypeLabels,
} from "@/types/occurrence";

interface GeneratePDFOptions {
  occurrence: Occurrence;
  includeHistory?: boolean;
  includeOutcome?: boolean;
  includeCapa?: boolean;
  includeAttachments?: boolean;
  anonymize?: boolean;
  logoBase64?: string; // PNG base64 recomendado (SVG costuma falhar no jsPDF)
}

// ====== CORES (aproximadas do PDF) ======
const IMAGO_BLUE = [50, 92, 147] as const;          // #325C93
const IMAGO_BLUE_LIGHT = [235, 244, 250] as const;  // fundo caixa
const IMAGO_TEXT_DARK = [51, 51, 51] as const;      // texto principal
const IMAGO_TEXT_GRAY = [120, 120, 120] as const;   // labels
const IMAGO_BORDER = [210, 210, 210] as const;      // bordas finas
const IMAGO_CARD_BG = [245, 245, 245] as const;     // cards cinza (detalhes)
const IMAGO_FOOTER_LINE = [205, 205, 205] as const; // linha rodapé

// ====== LOGO (opcional) ======
let cachedLogoBase64: string | null = null;

export async function loadLogoBase64(): Promise<string | null> {
  if (cachedLogoBase64) return cachedLogoBase64;
  try {
    const response = await fetch("/images/imago-logo.svg");
    if (!response.ok) return null;

    const svgText = await response.text();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const img = new Image();
    const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    return await new Promise<string | null>((resolve) => {
      img.onload = () => {
        canvas.width = img.width * 2;
        canvas.height = img.height * 2;
        ctx.scale(2, 2);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        cachedLogoBase64 = canvas.toDataURL("image/png");
        resolve(cachedLogoBase64);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.src = url;
    });
  } catch {
    return null;
  }
}

// ====== PDF ======
export function generateOccurrencePDF({
  occurrence,
  includeHistory = true,
  includeOutcome = true,
  includeCapa = true,
  includeAttachments = true,
  anonymize = false,
  logoBase64,
}: GeneratePDFOptions): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const marginX = 14;
  let y = 14;

  const setBlue = () => doc.setTextColor(IMAGO_BLUE[0], IMAGO_BLUE[1], IMAGO_BLUE[2]);
  const setDark = () => doc.setTextColor(IMAGO_TEXT_DARK[0], IMAGO_TEXT_DARK[1], IMAGO_TEXT_DARK[2]);
  const setGray = () => doc.setTextColor(IMAGO_TEXT_GRAY[0], IMAGO_TEXT_GRAY[1], IMAGO_TEXT_GRAY[2]);

  const safeText = (t: string) => (t && t.trim() ? t : "—");

  const anonymizeText = (text: string) => {
    if (!anonymize) return text;
    return String(text || "").replace(/[A-Za-zÀ-ÿ0-9]/g, "•");
  };

  const checkBreak = (need = 20) => {
    if (y > pageHeight - 20 - need) {
      doc.addPage();
      y = 14;
      // re-render header? (no seu PDF exemplo é 1 página; mantive simples)
    }
  };

  // ====== HEADER (logo esquerda, título/dados direita) ======
  // Logo
  const logoX = marginX;
  const logoY = 10;
  const logoW = 58;
  const logoH = 16;

  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", logoX, logoY, logoW, logoH);
    } catch {
      // fallback: texto IMAGO
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      setBlue();
      doc.text("IMAGO", logoX, logoY + 12);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      setGray();
      doc.text("DIAGNÓSTICO POR IMAGEM", logoX, logoY + 16);
    }
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    setBlue();
    doc.text("IMAGO", logoX, logoY + 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setGray();
    doc.text("DIAGNÓSTICO POR IMAGEM", logoX, logoY + 16);
  }

  // Título direita
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  setDark();
  doc.text("RELATÓRIO DE OCORRÊNCIA", pageWidth - marginX, 14, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setDark();
  doc.text(`Protocolo: ${occurrence.protocolo}`, pageWidth - marginX, 19, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setGray();
  doc.text(
    format(new Date(), "'Gerado em' dd/MM/yyyy 'às' HH:mm", { locale: ptBR }),
    pageWidth - marginX,
    24,
    { align: "right" }
  );

  // ====== CAIXA DE CLASSIFICAÇÃO (grande, azul claro) ======
  y = 32;

  const tipoLabel =
    occurrence.tipo === "assistencial"
      ? "Assistencial"
      : occurrence.tipo === "administrativa"
        ? "Administrativa"
        : "Técnica";

  const statusLabel = statusConfig[occurrence.status]?.label || occurrence.status;
  const triageLabel = occurrence.triagem
    ? (triageConfig[occurrence.triagem]?.label || occurrence.triagem)
    : "";

  const subtipoLabel = subtypeLabels[occurrence.subtipo] || occurrence.subtipo;

  const boxX = marginX;
  const boxY = y;
  const boxW = pageWidth - marginX * 2;
  const boxH = 28;

  doc.setFillColor(IMAGO_BLUE_LIGHT[0], IMAGO_BLUE_LIGHT[1], IMAGO_BLUE_LIGHT[2]);
  doc.setDrawColor(IMAGO_BORDER[0], IMAGO_BORDER[1], IMAGO_BORDER[2]);
  doc.roundedRect(boxX, boxY, boxW, boxH, 3, 3, "FD");

  // Colunas (como no PDF: 2 linhas com TIPO/STATUS e SUBTIPO/TRIAGEM, e “TIPO DE EXAME AQUI” à direita)
  const leftPad = 10;
  const row1Y = boxY + 10;
  const row2Y = boxY + 20;

  const col1X = boxX + leftPad;
  const col2X = boxX + 62; // aproxima do visual

  doc.setFontSize(9);

  // Row 1: TIPO / SUBTIPO
  doc.setFont("helvetica", "bold");
  setBlue();
  doc.text("TIPO:", col1X, row1Y);
  doc.setFont("helvetica", "bold");
  setDark();
  doc.text(tipoLabel, col1X + 18, row1Y);

  doc.setFont("helvetica", "bold");
  setBlue();
  doc.text("SUBTIPO:", col2X, row1Y);
  doc.setFont("helvetica", "bold");
  setDark();
  doc.text(subtipoLabel, col2X + 26, row1Y);

  // Row 2: STATUS / TRIAGEM
  doc.setFont("helvetica", "bold");
  setBlue();
  doc.text("STATUS:", col1X, row2Y);
  doc.setFont("helvetica", "bold");
  setDark();
  doc.text(statusLabel, col1X + 22, row2Y);

  if (triageLabel) {
    doc.setFont("helvetica", "bold");
    setBlue();
    doc.text("TRIAGEM:", col2X, row2Y);
    doc.setFont("helvetica", "bold");
    setDark();
    doc.text(triageLabel, col2X + 26, row2Y);
  }

  // Texto grande à direita (dentro da caixa)
  const dadosEspecificos =
    (occurrence as any).dados_especificos || (occurrence as any).dadosEspecificos || {};
  const tipoExameDestaque = occurrence.paciente.tipoExame || dadosEspecificos.exameModalidade || "";

  if (tipoExameDestaque) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    setBlue();
    doc.text(tipoExameDestaque.toUpperCase(), boxX + boxW - 8, boxY + 16, { align: "right" });
  } else {
    // No PDF exemplo aparece “TIPO DE EXAME AQUI”
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    setBlue();
    doc.text("TIPO DE EXAME AQUI", boxX + boxW - 8, boxY + 16, { align: "right" });
  }

  y = boxY + boxH + 12;

  // ====== TÍTULO DE SEÇÃO COM ÍCONE (como no PDF) ======
  const addSectionTitle = (title: string, icon: "patient" | "doc") => {
    checkBreak(18);

    // Ícone simples (aproxima)
    doc.setFontSize(11);
    setBlue();
    doc.setFont("helvetica", "normal");
    doc.text(icon === "patient" ? "👤" : "📄", marginX, y);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setDark();
    doc.text(title, marginX + 8, y);

    y += 10;
  };

  // ====== BLOCO “DADOS DO PACIENTE” ======
  addSectionTitle("Dados do Paciente", "patient");

  const p = occurrence.paciente;

  // Layout 3 colunas, 2 linhas (como no PDF)
  const c1 = marginX;
  const c2 = marginX + 70;
  const c3 = marginX + 140;

  // Linha 1 labels
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setGray();
  doc.text("Nome", c1, y);
  doc.text("ID", c2, y);
  doc.text("Telefone", c3, y);

  y += 5;

  // Linha 1 values
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  setDark();
  doc.text(anonymize ? anonymizeText(p.nomeCompleto) : safeText(p.nomeCompleto), c1, y);
  doc.text(safeText(p.idPaciente), c2, y);
  doc.text(anonymize ? "•••••••••••" : safeText(p.telefone), c3, y);

  y += 10;

  // Linha 2 labels
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setGray();
  doc.text("Unidade", c1, y);
  doc.text("Data/Hora do Evento", c2, y);

  y += 5;

  // Linha 2 values
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  setDark();
  doc.text(safeText(p.unidadeLocal), c1, y);

  const dataHoraEvento = p.dataHoraEvento
    ? format(new Date(p.dataHoraEvento), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    : "—";
  doc.text(dataHoraEvento, c2, y);

  y += 14;

  // ====== DETALHES ======
  addSectionTitle("Detalhes da Ocorrência", "doc");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setGray();
  doc.text("Descrição Detalhada", marginX, y);

  y += 8;

  // Card cinza (label em caixa alta, valor abaixo) — como no PDF
  const addGrayCard = (label: string, value: string) => {
    checkBreak(24);

    const cardX = marginX;
    const cardW = pageWidth - marginX * 2;
    const labelH = 6;
    const padX = 6;

    const valueText = safeText(value);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    // Estima altura do value
    const lines = doc.splitTextToSize(valueText, cardW - padX * 2);
    const valueH = Math.max(6, lines.length * 4.5);

    const cardH = labelH + valueH + 6;

    doc.setFillColor(IMAGO_CARD_BG[0], IMAGO_CARD_BG[1], IMAGO_CARD_BG[2]);
    doc.setDrawColor(255, 255, 255);
    doc.roundedRect(cardX, y, cardW, cardH, 3, 3, "F");

    // Label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    setGray();
    doc.text(label.toUpperCase(), cardX + padX, y + 6);

    // Value
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setDark();
    doc.text(lines, cardX + padX, y + 12);

    y += cardH + 6;
  };

  // Se revisao_exame: mostra os campos em cards como no PDF
  if (occurrence.subtipo === "revisao_exame") {
    const dados = dadosEspecificos;

    if (dados.exameModalidade) addGrayCard("EXAME MODALIDADE", String(dados.exameModalidade));
    if (dados.exameRegiao) addGrayCard("EXAME REGIAO", String(dados.exameRegiao));
    if (dados.exameData) addGrayCard("EXAME DATA", String(dados.exameData)); // no PDF aparece yyyy-mm-dd
    if (dados.laudoEntregue !== undefined) addGrayCard("LAUDO ENTREGUE", dados.laudoEntregue ? "sim" : "não");
    if (dados.motivoRevisao) addGrayCard("MOTIVO DA REVISÃO", String(dados.motivoRevisao));
    if (dados.tipoDiscrepancia) addGrayCard("TIPO DISCREPANCIA", String(dados.tipoDiscrepancia));
    if (dados.potencialImpacto) addGrayCard("POTENCIAL IMPACTO", String(dados.potencialImpacto));
    if (dados.impactoDescricao) addGrayCard("IMPACTO DESCRICAO", String(dados.impactoDescricao));
    if (dados.acaoTomada) addGrayCard("ACAO TOMADA", String(dados.acaoTomada));
    if (dados.pessoasComunicadas) addGrayCard("PESSOAS COMUNICADAS", String(dados.pessoasComunicadas));
  } else {
    if (occurrence.descricaoDetalhada) addGrayCard("DESCRIÇÃO DETALHADA", occurrence.descricaoDetalhada);
    if (occurrence.acaoImediata) addGrayCard("AÇÃO IMEDIATA", occurrence.acaoImediata);
  }

  // Linha final: Impacto percebido / Pessoas envolvidas (como no PDF: dois textos simples)
  checkBreak(20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setGray();
  doc.text("Impacto Percebido", marginX, y);
  doc.text("Pessoas Envolvidas", pageWidth / 2 + 10, y);

  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setDark();
  doc.text(safeText(occurrence.impactoPercebido), marginX, y);
  doc.text(anonymize ? "•••••••••" : safeText(occurrence.pessoasEnvolvidas), pageWidth / 2 + 10, y);

  y += 12;

  // ====== OUTCOME / CAPA / HISTORY (mantive seu padrão; no PDF exemplo não aparece) ======
  if (includeOutcome && occurrence.desfecho) {
    checkBreak(30);
    addSectionTitle("Desfecho", "doc");

    const outcomeLabels = occurrence.desfecho.tipos
      .map((t) => outcomeConfig[t]?.label || t)
      .join(", ");
    addGrayCard("TIPOS DE DESFECHO", outcomeLabels);

    if (occurrence.desfecho.justificativa) addGrayCard("JUSTIFICATIVA", occurrence.desfecho.justificativa);

    if (occurrence.desfecho.desfechoPrincipal) {
      addGrayCard(
        "DESFECHO PRINCIPAL",
        outcomeConfig[occurrence.desfecho.desfechoPrincipal]?.label || ""
      );
    }
  }

  if (includeCapa && occurrence.desfecho?.capas?.length) {
    checkBreak(30);
    addSectionTitle("Ações Corretivas e Preventivas (CAPA)", "doc");
    occurrence.desfecho.capas.forEach((capa, idx) => {
      addGrayCard(`CAPA #${idx + 1} - CAUSA RAIZ`, capa.causaRaiz);
      addGrayCard(`CAPA #${idx + 1} - AÇÃO`, capa.acao);
      addGrayCard(`CAPA #${idx + 1} - RESPONSÁVEL`, capa.responsavel);
      addGrayCard(`CAPA #${idx + 1} - PRAZO`, capa.prazo);
      addGrayCard(`CAPA #${idx + 1} - STATUS`, capa.status);
      if (capa.verificacaoEficacia) addGrayCard(`CAPA #${idx + 1} - VERIFICAÇÃO`, capa.verificacaoEficacia);
    });
  }

  if (includeHistory && occurrence.historicoStatus?.length) {
    checkBreak(40);
    addSectionTitle("Histórico de Status", "doc");

    autoTable(doc, {
      startY: y,
      head: [["Status Anterior", "Novo Status", "Alterado Por", "Data/Hora"]],
      body: occurrence.historicoStatus.map((h) => [
        statusConfig[h.de]?.label || h.de,
        statusConfig[h.para]?.label || h.para,
        h.por,
        format(new Date(h.em), "dd/MM/yyyy HH:mm", { locale: ptBR }),
      ]),
      theme: "plain",
      headStyles: {
        fillColor: [IMAGO_BLUE[0], IMAGO_BLUE[1], IMAGO_BLUE[2]],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
      },
      bodyStyles: { fontSize: 8, textColor: [IMAGO_TEXT_DARK[0], IMAGO_TEXT_DARK[1], IMAGO_TEXT_DARK[2]] },
      alternateRowStyles: { fillColor: [IMAGO_BLUE_LIGHT[0], IMAGO_BLUE_LIGHT[1], IMAGO_BLUE_LIGHT[2]] },
      margin: { left: marginX, right: marginX },
      styles: { cellPadding: 3, lineColor: [IMAGO_BORDER[0], IMAGO_BORDER[1], IMAGO_BORDER[2]], lineWidth: 0.1 },
    });

    // @ts-expect-error jspdf-autotable
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ====== FOOTER (linha + texto esquerda + paginação direita) ======
  const addFooter = () => {
    const totalPages = doc.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      // Linha cinza
      doc.setDrawColor(IMAGO_FOOTER_LINE[0], IMAGO_FOOTER_LINE[1], IMAGO_FOOTER_LINE[2]);
      doc.setLineWidth(0.4);
      doc.line(marginX, pageHeight - 18, pageWidth - marginX, pageHeight - 18);

      // Texto
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      setGray();
      doc.text(`IMAGO Diagnóstico por Imagem | ${occurrence.protocolo}`, marginX, pageHeight - 12);

      doc.text(`Página ${i} de ${totalPages}`, pageWidth - marginX, pageHeight - 12, { align: "right" });
    }
  };

  addFooter();
  return doc;
}

export function downloadOccurrencePDF(occurrence: Occurrence, anonymize = false) {
  const doc = generateOccurrencePDF({ occurrence, anonymize });
  doc.save(`${occurrence.protocolo}.pdf`);
}

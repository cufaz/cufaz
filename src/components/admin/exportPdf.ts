import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatBRL } from "./utils";

export interface PdfExportData {
  polos: Array<{ id: string; nome: string }>;
  lancamentos: Array<{
    id: string;
    tipo: "receita" | "despesa";
    valor: number;
    descricao: string;
    categoria: string;
    poloId: string;
    data: string;
  }>;
  categoriasDespesas: Array<{ nome: string; previsto: number }>;
  selectedPoloId: string;
  dataInicio: string;
  dataFim: string;
}

export function generateProfessionalPdf({
  polos,
  lancamentos,
  categoriasDespesas,
  selectedPoloId,
  dataInicio,
  dataFim,
}: PdfExportData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const poloNome = selectedPoloId === "todos" || !selectedPoloId
    ? "Todos os Polos"
    : (polos.find((p) => p.id === selectedPoloId)?.nome || selectedPoloId);

  // Filter lancamentos
  const lancamentosFiltrados = lancamentos.filter((l) => {
    const matchPolo = !selectedPoloId || selectedPoloId === "todos" || l.poloId === selectedPoloId;
    const matchData = (!dataInicio || l.data >= dataInicio) && (!dataFim || l.data <= dataFim);
    return matchPolo && matchData;
  });

  const totalReceitas = lancamentosFiltrados
    .filter((l) => l.tipo === "receita")
    .reduce((sum, l) => sum + l.valor, 0);

  const totalDespesasRealizadas = lancamentosFiltrados
    .filter((l) => l.tipo === "despesa")
    .reduce((sum, l) => sum + l.valor, 0);

  const totalDespesasPrevistas = categoriasDespesas.reduce((sum, c) => sum + c.previsto, 0);
  const saldoRealizado = totalReceitas - totalDespesasRealizadas;
  const difPrevistoRealizado = totalDespesasPrevistas - totalDespesasRealizadas;
  const percUtilizado = totalDespesasPrevistas > 0 ? (totalDespesasRealizadas / totalDespesasPrevistas) * 100 : 0;

  // Header Banner
  doc.setFillColor(249, 115, 22); // CUFA Brand Orange (#f97316)
  doc.rect(0, 0, 210, 24, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("CUFA — CENTRAL ÚNICA DAS FAVELAS", 14, 12);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("DEMONSTRATIVO FINANCEIRO E DE GESTÃO DE POLOS", 14, 18);

  // Meta Information Block
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Filtro do Polo:", 14, 32);
  doc.setFont("helvetica", "normal");
  doc.text(poloNome, 40, 32);

  doc.setFont("helvetica", "bold");
  doc.text("Período:", 100, 32);
  doc.setFont("helvetica", "normal");
  doc.text(`${dataInicio || "Início"} até ${dataFim || "Atual"}`, 118, 32);

  doc.setFont("helvetica", "bold");
  doc.text("Emissão:", 165, 32);
  doc.setFont("helvetica", "normal");
  doc.text(new Date().toLocaleDateString("pt-BR"), 182, 32);

  doc.setDrawColor(226, 232, 240);
  doc.line(14, 36, 196, 36);

  // Section 1: Resumo Financeiro Table
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(249, 115, 22);
  doc.text("1. RESUMO FINANCEIRO E SALDO", 14, 43);

  const resumoRows = [
    ["Receitas do Mês (Realizadas)", formatBRL(totalReceitas), totalReceitas > 0 ? "Receitas registradas" : "Sem receitas"],
    ["Despesas Realizadas (Gastos)", formatBRL(totalDespesasRealizadas), "Total pago no período"],
    ["Despesas Previstas (Orçamento)", formatBRL(totalDespesasPrevistas), "Orçamento mensal aprovado"],
    ["Saldo do Mês (Realizado)", formatBRL(saldoRealizado), saldoRealizado >= 0 ? "Saldo Positivo" : "Déficit"],
    ["Diferença Previsto × Realizado", formatBRL(difPrevistoRealizado), difPrevistoRealizado >= 0 ? "Dentro do limite" : "Excedido"],
    ["% Orçamento Utilizado", `${percUtilizado.toFixed(1)}%`, percUtilizado > 90 ? "⚠️ CRÍTICO" : percUtilizado > 75 ? "⚡ ATENÇÃO" : "✅ NORMAL"],
  ];

  autoTable(doc, {
    startY: 46,
    head: [["INDICADOR FINANCEIRO", "VALOR (R$)", "SITUAÇÃO"]],
    body: resumoRows,
    theme: "striped",
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold" },
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 80, fontStyle: "bold" },
      1: { cellWidth: 50, halign: "right" },
      2: { cellWidth: 52 },
    },
  });

  // Section 2: Despesas por Categoria
  const nextY1 = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(249, 115, 22);
  doc.text("2. DESPESAS POR CATEGORIA", 14, nextY1);

  const catRows = categoriasDespesas.map((c) => {
    const gastoCat = lancamentosFiltrados
      .filter((l) => l.tipo === "despesa" && l.categoria === c.nome)
      .reduce((sum, l) => sum + l.valor, 0);
    const dif = c.previsto - gastoCat;
    const perc = c.previsto > 0 ? ((gastoCat / c.previsto) * 100).toFixed(1) + "%" : "0%";
    return [c.nome, formatBRL(c.previsto), formatBRL(gastoCat), formatBRL(dif), perc];
  });

  autoTable(doc, {
    startY: nextY1 + 3,
    head: [["CATEGORIA", "PREVISTO (R$)", "REALIZADO (R$)", "DIFERENÇA (R$)", "% UTILIZADO"]],
    body: catRows,
    theme: "grid",
    headStyles: { fillColor: [249, 115, 22], textColor: [255, 255, 255], fontStyle: "bold" },
    styles: { fontSize: 8.5, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: "bold" },
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "center" },
    },
  });

  // Section 3: Lançamentos Detalhados (com Descrição / Detalhe)
  const nextY2 = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(249, 115, 22);
  doc.text("3. LANÇAMENTOS DETALHADOS NO PERÍODO", 14, nextY2);

  const lancRows = lancamentosFiltrados.map((l) => {
    const pNome = l.poloId === "todos" ? "Geral" : (polos.find((p) => p.id === l.poloId)?.nome || l.poloId);
    return [
      l.data,
      l.tipo.toUpperCase(),
      pNome,
      l.categoria,
      l.descricao || "-",
      formatBRL(l.valor),
    ];
  });

  autoTable(doc, {
    startY: nextY2 + 3,
    head: [["DATA", "TIPO", "POLO", "CATEGORIA", "DESCRIÇÃO / DETALHE", "VALOR (R$)"]],
    body: lancRows.length === 0 ? [["-", "-", "-", "-", "Nenhum lançamento no período", "R$ 0,00"]] : lancRows,
    theme: "striped",
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold" },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 20, fontStyle: "bold" },
      2: { cellWidth: 32 },
      3: { cellWidth: 38 },
      4: { cellWidth: 46 },
      5: { cellWidth: 24, halign: "right", fontStyle: "bold" },
    },
  });

  // Footer Page Numbering
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`CUFA — Central Única das Favelas | Página ${i} de ${pageCount}`, 105, 290, { align: "center" });
  }

  // Save PDF file
  const fileName = `Relatorio_Financeiro_CUFA_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}

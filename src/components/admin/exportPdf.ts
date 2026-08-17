import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatBRL } from "./utils";
import { itensOrcamentoOFICIAIS } from "./dataDetalhada";

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
  selectedPoloId,
  dataInicio,
  dataFim,
}: PdfExportData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Find selected polo name for flexible matching
  const poloObj = polos.find((p) => p.id === selectedPoloId);
  const poloNome = !selectedPoloId || selectedPoloId === "todos"
    ? "Todos os Polos"
    : (poloObj?.nome || selectedPoloId);

  const poloNomeClean = poloNome.toLowerCase();

  // Filter official dataset items with flexible matching
  const poloItensPrevisto = itensOrcamentoOFICIAIS.filter((item) => {
    if (!selectedPoloId || selectedPoloId === "todos") return true;
    if (item.poloId === selectedPoloId) return true;
    if (poloNomeClean.includes("penha") && item.poloId === "penha") return true;
    if (poloNomeClean.includes("madureira") && item.poloId === "madureira") return true;
    if ((poloNomeClean.includes("paraisópolis") || poloNomeClean.includes("paraisopolis")) && item.poloId === "paraisopolis") return true;
    if (poloNomeClean.includes("teste") && (item.poloId === "polo-teste" || item.poloId === "teste")) return true;
    return false;
  });
  // Filter lancamentos with flexible polo matching
  const lancamentosFiltrados = lancamentos.filter((l: any) => {
    const lPoloId = String(l.poloId || l.polo_id || "").toLowerCase();
    const lPoloNome = String(l.poloNome || l.polo_nome || "").toLowerCase();

    const matchPolo =
      !selectedPoloId ||
      selectedPoloId === "todos" ||
      lPoloId === selectedPoloId ||
      (poloNomeClean.includes("penha") && (lPoloId.includes("penha") || lPoloNome.includes("penha"))) ||
      (poloNomeClean.includes("madureira") && (lPoloId.includes("madureira") || lPoloNome.includes("madureira"))) ||
      ((poloNomeClean.includes("paraisópolis") || poloNomeClean.includes("paraisopolis")) && (lPoloId.includes("paraisopolis") || lPoloNome.includes("paraisopolis"))) ||
      (poloNomeClean.includes("teste") && (lPoloId.includes("teste") || lPoloNome.includes("teste")));

    const lData = String(l.data || l.created_at || l.competencia || "").slice(0, 10);
    const matchData = (!dataInicio || lData >= dataInicio) && (!dataFim || lData <= dataFim);
    return matchPolo && matchData;
  });

  const totalReceitas = lancamentosFiltrados
    .filter((l) => l.tipo === "receita")
    .reduce((sum, l) => sum + Number(l.valor || 0), 0);

  const totalDespesasRealizadas = lancamentosFiltrados
    .filter((l) => l.tipo === "despesa")
    .reduce((sum, l) => sum + Number(l.valor || 0), 0);

  const totalDespesasPrevistas = poloItensPrevisto.reduce((sum, i) => sum + i.previsto, 0);
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
    ["Despesas Realizadas (Gastos)", formatBRL(totalDespesasRealizadas), totalDespesasRealizadas > 0 ? "Despesas ativas" : "Total pago no período"],
    ["Despesas Previstas (Orçamento)", formatBRL(totalDespesasPrevistas), "Orçamento mensal aprovado"],
    ["Saldo do Mês (Realizado)", formatBRL(saldoRealizado), saldoRealizado >= 0 ? "Saldo Positivo" : "Déficit"],
    ["Variação Previsto × Realizado", formatBRL(difPrevistoRealizado), difPrevistoRealizado >= 0 ? "Dentro do limite" : "Excedido"],
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

  // Section 2: Despesas por Categoria (From Official Dataset)
  const nextY1 = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(249, 115, 22);
  doc.text("2. DESPESAS POR CATEGORIA", 14, nextY1);

  // Group by category from official dataset
  const catMap: Record<string, number> = {};
  poloItensPrevisto.forEach((item) => {
    catMap[item.categoria] = (catMap[item.categoria] || 0) + item.previsto;
  });

  const catRows = Object.entries(catMap).map(([catNome, previstoCat]) => {
    const gastoCat = lancamentosFiltrados
      .filter((l: any) => l.tipo === "despesa" && (String(l.categoria || l.categoria_nome || "").toLowerCase().includes(catNome.toLowerCase()) || catNome.toLowerCase().includes(String(l.categoria || l.categoria_nome || "").toLowerCase())))
      .reduce((sum: number, l: any) => sum + Number(l.valor || 0), 0);
    const dif = previstoCat - gastoCat;
    const perc = previstoCat > 0 ? ((gastoCat / previstoCat) * 100).toFixed(1) + "%" : "0%";
    return [catNome, formatBRL(previstoCat), formatBRL(gastoCat), formatBRL(dif), perc];
  });

  autoTable(doc, {
    startY: nextY1 + 3,
    head: [["CATEGORIA", "PREVISTO (R$)", "REALIZADO (R$)", "VARIAÇÃO (R$)", "% UTILIZADO"]],
    body: catRows.length === 0 ? [["-", "R$ 0,00", "R$ 0,00", "R$ 0,00", "0%"]] : catRows,
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

  // Section 3: Detalhamento de Itens Orçados do Polo
  const nextY2 = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(249, 115, 22);
  doc.text("3. ITENS DE CUSTO E PROVISÕES DA ATIVIDADE", 14, nextY2);

  const itemRows = poloItensPrevisto.map((item) => [
    item.atividade,
    item.categoria,
    item.item,
    String(item.quantidade || "1").match(/\d+/)?.[0] ?? "1",
    formatBRL(item.previsto),
  ]);

  autoTable(doc, {
    startY: nextY2 + 3,
    head: [["ATIVIDADE", "CATEGORIA", "ITEM OU SERVIÇO", "QUANTIDADE", "PREVISTO (R$)"]],
    body: itemRows.length === 0 ? [["-", "-", "Nenhum item cadastrado", "-", "R$ 0,00"]] : itemRows,
    theme: "striped",
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold" },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 32 },
      2: { cellWidth: 62, fontStyle: "bold" },
      3: { cellWidth: 34 },
      4: { cellWidth: 26, halign: "right", fontStyle: "bold" },
    },
  });

  // Section 4: Despesas Lançadas no Mês / Compras Aprovadas (Anexo 1 & 2)
  const nextY3 = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(249, 115, 22);
  doc.text("4. OUTRAS CONTAS — DESPESAS LANÇADAS NO MÊS", 14, nextY3);

  const despesaLancMap = new Map<string, { desc: string; cat: string; polo: string; valor: number }>();

  lancamentosFiltrados
    .filter((l: any) => l.tipo === "despesa")
    .forEach((l: any) => {
      const desc = String(l.descricao || l.item || "Despesa Realizada").trim();
      const cat = String(l.categoria || l.categoria_nome || "Materiais / consumo").trim();
      const pDest = String(l.poloNome || l.polo_nome || poloNome).trim();
      const valNum = Number(l.valor || 0);

      const key = `${desc.toLowerCase()}_${pDest.toLowerCase()}`;

      if (!despesaLancMap.has(key)) {
        despesaLancMap.set(key, { desc, cat, polo: pDest, valor: valNum });
      } else {
        const existing = despesaLancMap.get(key)!;
        if (valNum > existing.valor) {
          existing.valor = valNum;
        }
      }
    });

  const despesaLancRows = Array.from(despesaLancMap.values()).map((item) => [
    item.desc,
    item.cat,
    item.polo,
    formatBRL(item.valor),
  ]);

  autoTable(doc, {
    startY: nextY3 + 3,
    head: [["DESCRIÇÃO / ITEM", "CATEGORIA", "POLO DE DESTINO", "VALOR (R$)"]],
    body: despesaLancRows.length === 0 ? [["Nenhuma despesa lançada no período.", "-", "-", "R$ 0,00"]] : despesaLancRows,
    theme: "striped",
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold" },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 70, fontStyle: "bold" },
      1: { cellWidth: 45 },
      2: { cellWidth: 45 },
      3: { cellWidth: 22, halign: "right", fontStyle: "bold" },
    },
    didDrawCell: (data) => {
      // Draw category separator line when category changes (Anexo 5)
      if (data.section === "body" && data.row.index < itemRows.length - 1) {
        const currentCat = itemRows[data.row.index]?.[1];
        const nextCat = itemRows[data.row.index + 1]?.[1];
        if (currentCat && nextCat && currentCat !== nextCat) {
          const y = data.cell.y + data.cell.height;
          doc.setDrawColor(249, 115, 22); // CUFA Brand Orange line
          doc.setLineWidth(0.6);
          doc.line(data.cell.x, y, data.cell.x + data.cell.width, y);
        }
      }
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

  // Dynamic File Name per Filtered Polo (Anexo 4)
  const poloSlug = poloNome.replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_");
  const fileName = `Relatorio_Financeiro_${poloSlug}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}

import * as XLSX from "xlsx";
import { Polo, Lancamento, CategoriaDespesa } from "./types";
import { itensOrcamentoOFICIAIS } from "./dataDetalhada";

export function formatBRL(val: number): string {
  if (isNaN(val) || val === null || val === undefined) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
}

export function parseCurrencyInput(input: string): number {
  const digits = input.replace(/\D/g, "");
  if (!digits) return 0;
  return parseFloat(digits) / 100;
}

export function formatCurrencyInput(val: number): string {
  if (!val || isNaN(val)) return "0,00";
  return val.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function exportProfessionalExcel({
  polos,
  lancamentos,
  selectedPoloId,
  dataInicio,
  dataFim,
}: {
  polos: Polo[];
  lancamentos: Lancamento[];
  categoriasDespesas?: CategoriaDespesa[];
  selectedPoloId: string;
  dataInicio: string;
  dataFim: string;
}) {
  const wb = XLSX.utils.book_new();

  // Find selected polo name
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

  // Sheet 1: Resumo Financeiro
  const resumoData = [
    ["RELATÓRIO FINANCEIRO CUFA — DEMONSTRATIVO GERAL"],
    ["Período de Extração:", `${dataInicio || "Início"} até ${dataFim || "Atual"}`],
    ["Polo Selecionado:", poloNome],
    ["Data de Geração:", new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR")],
    [""],
    ["INDICADOR FINANCEIRO", "VALOR (R$)", "STATUS / OBSERVAÇÃO"],
    ["Receitas do Mês (Realizadas)", formatBRL(totalReceitas), totalReceitas > 0 ? "OK" : "Sem receitas no período"],
    ["Despesas Realizadas (Gastos)", formatBRL(totalDespesasRealizadas), "Total gasto no período"],
    ["Despesas Previstas (Orçamento)", formatBRL(totalDespesasPrevistas), "Orçamento mensal planejado"],
    ["Saldo do Período (Realizado)", formatBRL(saldoRealizado), saldoRealizado >= 0 ? "Positivo" : "Déficit"],
    ["Diferença Previsto x Realizado", formatBRL(difPrevistoRealizado), difPrevistoRealizado >= 0 ? "Dentro do Orçamento" : "Orçamento Excedido"],
    ["% Orçamento Utilizado", `${percUtilizado.toFixed(2)}%`, percUtilizado > 90 ? "⚠️ CRÍTICO" : percUtilizado > 75 ? "⚡ ATENÇÃO" : "✅ NORMAL"],
  ];
  const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
  XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo Financeiro");

  // Sheet 2: Despesas por Categoria
  const catMap: Record<string, number> = {};
  poloItensPrevisto.forEach((item) => {
    catMap[item.categoria] = (catMap[item.categoria] || 0) + item.previsto;
  });

  const catData = [
    ["CATEGORIA DE DESPESA", "PREVISTO (R$)", "REALIZADO (R$)", "DIFERENÇA (R$)", "% UTILIZADO"],
  ];
  Object.entries(catMap).forEach(([catNome, previstoCat]) => {
    const gastoCat = lancamentosFiltrados
      .filter((l: any) => l.tipo === "despesa" && (String(l.categoria || l.categoria_nome || "").toLowerCase().includes(catNome.toLowerCase()) || catNome.toLowerCase().includes(String(l.categoria || l.categoria_nome || "").toLowerCase())))
      .reduce((sum: number, l: any) => sum + Number(l.valor || 0), 0);
    const dif = previstoCat - gastoCat;
    const perc = previstoCat > 0 ? ((gastoCat / previstoCat) * 100).toFixed(1) + "%" : "0%";
    catData.push([catNome, formatBRL(previstoCat), formatBRL(gastoCat), formatBRL(dif), perc]);
  });
  const wsCat = XLSX.utils.aoa_to_sheet(catData);
  XLSX.utils.book_append_sheet(wb, wsCat, "Por Categoria");

  // Sheet 3: Detalhamento Completo de Itens
  const itensData = [
    ["POLO", "ATIVIDADE", "CATEGORIA", "ITEM OU SERVIÇO", "DESCRIÇÃO / DETALHE", "QUANTIDADE", "PREVISTO (R$)"],
  ];
  poloItensPrevisto.forEach((i) => {
    itensData.push([
      poloNome,
      i.atividade,
      i.categoria,
      i.item,
      i.descricao,
      String(i.quantidade || "1").match(/\d+/)?.[0] ?? "1",
      formatBRL(i.previsto),
    ]);
  });
  const wsItens = XLSX.utils.aoa_to_sheet(itensData);
  XLSX.utils.book_append_sheet(wb, wsItens, "Itens e Provisões");

  // Sheet 4: Lançamentos Efetivados
  const lancData = [
    ["DATA", "TIPO", "POLO", "CATEGORIA", "DESCRIÇÃO / DETALHE", "VALOR (R$)"],
  ];
  lancamentosFiltrados.forEach((l) => {
    lancData.push([
      l.data,
      l.tipo.toUpperCase(),
      poloNome,
      l.categoria,
      l.descricao || "-",
      formatBRL(l.valor),
    ]);
  });
  const wsLanc = XLSX.utils.aoa_to_sheet(lancData);
  XLSX.utils.book_append_sheet(wb, wsLanc, "Lançamentos Efetivados");

  // Dynamic File Name per Filtered Polo (Anexo 4)
  const poloSlug = poloNome.replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_");
  const fileName = `Relatorio_Financeiro_${poloSlug}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

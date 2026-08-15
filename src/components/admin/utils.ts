import * as XLSX from "xlsx";
import { Polo, Lancamento, CategoriaDespesa } from "./types";

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
  return (val).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function exportProfessionalExcel({
  polos,
  lancamentos,
  categoriasDespesas,
  selectedPoloId,
  dataInicio,
  dataFim,
}: {
  polos: Polo[];
  lancamentos: Lancamento[];
  categoriasDespesas: CategoriaDespesa[];
  selectedPoloId: string;
  dataInicio: string;
  dataFim: string;
}) {
  const wb = XLSX.utils.book_new();

  // Filter lancamentos
  const lancamentosFiltrados = lancamentos.filter((l) => {
    const matchPolo = selectedPoloId === "todos" || l.poloId === selectedPoloId;
    const matchData = (!dataInicio || l.data >= dataInicio) && (!dataFim || l.data <= dataFim);
    return matchPolo && matchData;
  });

  const totalReceitas = lancamentosFiltrados
    .filter((l) => l.tipo === "receita")
    .reduce((sum, l) => sum + l.valor, 0);

  const totalDespesasRealizadas = lancamentosFiltrados
    .filter((l) => l.tipo === "despesa")
    .reduce((sum, l) => sum + l.valor, 0);

  let totalDespesasPrevistas = 0;
  if (selectedPoloId === "todos") {
    totalDespesasPrevistas = polos.filter((p) => p.ativo).reduce((sum, p) => sum + p.orcamentoMensal, 0);
  } else {
    const p = polos.find((item) => item.id === selectedPoloId);
    totalDespesasPrevistas = p ? p.orcamentoMensal : 0;
  }

  const saldoRealizado = totalReceitas - totalDespesasRealizadas;
  const difPrevistoRealizado = totalDespesasPrevistas - totalDespesasRealizadas;
  const percUtilizado = totalDespesasPrevistas > 0 ? (totalDespesasRealizadas / totalDespesasPrevistas) * 100 : 0;

  // Sheet 1: Resumo Financeiro
  const resumoData = [
    ["RELATÓRIO FINANCEIRO CUFA — DEMONSTRATIVO GERAL"],
    ["Período de Extração:", `${dataInicio || "Início"} até ${dataFim || "Atual"}`],
    ["Polo Selecionado:", selectedPoloId === "todos" ? "Todos os Polos" : (polos.find(p => p.id === selectedPoloId)?.nome || selectedPoloId)],
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
  const catData = [
    ["CATEGORIA DE DESPESA", "PREVISTO (R$)", "REALIZADO (R$)", "DIFERENÇA (R$)", "% UTILIZADO"],
  ];
  categoriasDespesas.forEach((c) => {
    const gastoCat = lancamentosFiltrados
      .filter((l) => l.tipo === "despesa" && l.categoria === c.nome)
      .reduce((sum, l) => sum + l.valor, 0);
    const dif = c.previsto - gastoCat;
    const perc = c.previsto > 0 ? ((gastoCat / c.previsto) * 100).toFixed(1) + "%" : "0%";
    catData.push([c.nome, formatBRL(c.previsto), formatBRL(gastoCat), formatBRL(dif), perc]);
  });
  const wsCat = XLSX.utils.aoa_to_sheet(catData);
  XLSX.utils.book_append_sheet(wb, wsCat, "Por Categoria");

  // Sheet 3: Lançamentos Detalhados (com Descrição / Detalhe)
  const lancData = [
    ["DATA", "TIPO", "POLO", "CATEGORIA", "DESCRIÇÃO / DETALHE", "VALOR (R$)"],
  ];
  lancamentosFiltrados.forEach((l) => {
    const pNome = l.poloId === "todos" ? "Geral" : (polos.find(p => p.id === l.poloId)?.nome || l.poloId);
    lancData.push([
      l.data,
      l.tipo.toUpperCase(),
      pNome,
      l.categoria,
      l.descricao || "-",
      formatBRL(l.valor),
    ]);
  });
  const wsLanc = XLSX.utils.aoa_to_sheet(lancData);
  XLSX.utils.book_append_sheet(wb, wsLanc, "Lançamentos Detalhados");

  // Sheet 4: Polos e Orçamentos
  const polosData = [
    ["NOME DO POLO", "CIDADE/UF", "VAGAS TOTAIS", "BENEFICIÁRIOS PROJETADOS", "ORÇAMENTO MENSAL (R$)", "STATUS"],
  ];
  polos.forEach((p) => {
    polosData.push([
      p.nome,
      `${p.cidade} / ${p.uf}`,
      p.vagasTotais.toString(),
      p.beneficiariosProjetados.toString(),
      formatBRL(p.orcamentoMensal),
      p.ativo ? "Ativo" : "Inativo",
    ]);
  });
  const wsPolos = XLSX.utils.aoa_to_sheet(polosData);
  XLSX.utils.book_append_sheet(wb, wsPolos, "Polos e Orçamentos");

  // Write workbook to file download
  const fileName = `Relatorio_Financeiro_CUFA_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Plus, Trash2, FileSpreadsheet, FileText, Calendar, Filter } from "lucide-react";
import { toast } from "sonner";

import { getFinanceiro, saveLancamento, deleteLancamento } from "@/lib/gestao.functions";
import { GestorShell } from "@/components/admin/GestorShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { brl } from "@/lib/format";
import { exportProfessionalExcel } from "@/components/admin/utils";
import { generateProfessionalPdf } from "@/components/admin/exportPdf";
import { itensOrcamentoOFICIAIS } from "@/components/admin/dataDetalhada";

export const Route = createFileRoute("/_authenticated/gestor/financeiro")({
  component: FinanceiroPage,
});

type Row = Record<string, any>;

function Linha({ label, valor, forte }: { label: string; valor: number; forte?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2.5 text-xs sm:text-sm ${
        forte ? "font-bold" : ""
      }`}
    >
      <span className={`min-w-0 break-words ${forte ? "" : "text-muted-foreground"}`}>{label}</span>
      <span className={`whitespace-nowrap tabular-nums ${forte ? "text-primary text-base" : ""}`}>{brl(valor)}</span>
    </div>
  );
}

function FinanceiroPage() {
  const qc = useQueryClient();
  const fetchFinanceiro = useServerFn(getFinanceiro);
  const salvar = useServerFn(saveLancamento);
  const apagar = useServerFn(deleteLancamento);

  const [dataInicio, setDataInicio] = useState<string>("2026-08-01");
  const [dataFim, setDataFim] = useState<string>("2026-08-31");
  const [poloId, setPoloId] = useState<string>("");
  const [isFilterLoading, setIsFilterLoading] = useState<boolean>(false);
  const [form, setForm] = useState<Row | null>(null);

  // Form BRL currency formatting
  const [valorDisplay, setValorDisplay] = useState("0,00");

  const { data, isLoading } = useQuery({
    queryKey: ["financeiro", dataInicio, dataFim, poloId],
    queryFn: () => fetchFinanceiro({ data: poloId ? { poloId } : {} }),
  });

  function triggerLoading(action: () => void) {
    setIsFilterLoading(true);
    action();
    setTimeout(() => {
      setIsFilterLoading(false);
    }, 450);
  }

  function handlePoloChange(val: string) {
    triggerLoading(() => setPoloId(val));
  }

  function handleDataInicioChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    triggerLoading(() => setDataInicio(val));
  }

  function handleDataFimChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    triggerLoading(() => setDataFim(val));
  }

  const mSalvar = useMutation({
    mutationFn: (v: Row) => salvar({ data: v }),
    onSuccess: () => {
      setForm(null);
      toast.success("Lançamento salvo com sucesso!");
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error("Erro ao salvar", { description: e.message }),
  });

  const mApagar = useMutation({
    mutationFn: (id: string) => apagar({ data: { id } }),
    onSuccess: () => {
      toast.success("Lançamento removido");
      qc.invalidateQueries();
    },
  });

  const categorias: Row[] = data?.categorias ?? [];
  const lancamentos: Row[] = data?.lancamentos ?? [];
  const polosList: Row[] = data?.polos ?? [];
  const itens: Row[] = data?.itens ?? [];

  // Filter lancamentos by polo & data
  const lancamentosFiltrados = lancamentos.filter((l) => {
    const pMatch = !poloId || String(l['polo_id']) === poloId;
    const dMatch = (!dataInicio || String(l['data'] || l['created_at'] || "").slice(0, 10) >= dataInicio) &&
                   (!dataFim || String(l['data'] || l['created_at'] || "").slice(0, 10) <= dataFim);
    return pMatch && dMatch;
  });

  const receitas = lancamentosFiltrados.filter((l) => l['tipo'] === "receita");
  const despesas = lancamentosFiltrados.filter((l) => l['tipo'] === "despesa");
  const totalReceitas = receitas.reduce((s, l) => s + Number(l['valor']), 0);
  const totalDespesas = despesas.reduce((s, l) => s + Number(l['valor']), 0);

  // Calculate Despesas Previstas (Orçamento Mensal)
  // If specific polo selected -> that polo's orcamento_mensal or sum of its items
  // If no polo selected -> sum of all active polos' orcamento_mensal
  let previstoTotal = 0;
  if (poloId) {
    const selPolo = polosList.find((p) => String(p['id']) === poloId);
    if (selPolo && Number(selPolo['orcamento_mensal']) > 0) {
      previstoTotal = Number(selPolo['orcamento_mensal']);
    } else {
      previstoTotal = itens
        .filter((i) => String(i['polo_id']) === poloId)
        .reduce((s, i) => s + Number(i['custo_mensal']), 0);
    }
  } else {
    const sumPolosOrcamento = polosList
      .filter((p) => p['ativo'])
      .reduce((s, p) => s + Number(p['orcamento_mensal'] || 0), 0);

    if (sumPolosOrcamento > 0) {
      previstoTotal = sumPolosOrcamento;
    } else {
      previstoTotal = itens.reduce((s, i) => s + Number(i['custo_mensal']), 0);
    }
  }

  const previstoPorCategoria = categorias
    .filter((c) => c['tipo'] === "despesa")
    .map((c) => ({
      categoria: c,
      previsto: itens.filter((i) => i['categoria_id'] === c['id']).reduce((s, i) => s + Number(i['custo_mensal']), 0),
      realizado: despesas.filter((l) => l['categoria_id'] === c['id']).reduce((s, l) => s + Number(l['valor']), 0),
    }))
    .filter((r) => r.previsto > 0 || r.realizado > 0);

  function handleValorInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) {
      setValorDisplay("0,00");
      setForm((f) => f ? { ...f, valor: 0 } : null);
      return;
    }
    const val = parseFloat(raw) / 100;
    setValorDisplay(
      val.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
    setForm((f) => f ? { ...f, valor: val } : null);
  }

  function handleExportExcel() {
    // Convert to types expected by exportProfessionalExcel
    const exportPolos = polosList.map((p) => ({
      id: String(p['id']),
      nome: String(p['nome']),
      slug: String(p['slug'] || ""),
      cidade: String(p['cidade'] || ""),
      uf: String(p['uf'] || "RJ"),
      endereco: String(p['endereco'] || ""),
      perfilTematico: String(p['perfil_tematico'] || ""),
      pontoFocal: String(p['ponto_focal'] || ""),
      vagasTotais: Number(p['vagas_totais'] || 0),
      beneficiariosProjetados: Number(p['beneficiarios_projetados'] || 0),
      orcamentoMensal: Number(p['orcamento_mensal'] || 0),
      ativo: Boolean(p['ativo']),
    }));

    const exportLancamentos = lancamentos.map((l) => ({
      id: String(l['id']),
      tipo: (l['tipo'] === "receita" ? "receita" : "despesa") as "receita" | "despesa",
      valor: Number(l['valor'] || 0),
      descricao: String(l['descricao'] || ""),
      categoria: String(l['categoria'] || l['categoria_nome'] || "Geral"),
      poloId: String(l['polo_id'] || "todos"),
      data: String(l['data'] || l['created_at'] || "").slice(0, 10),
    }));

    const exportCatDespesas = categorias.map((c) => ({
      nome: String(c['nome']),
      previsto: Number(c['previsto'] || 0),
    }));

    exportProfessionalExcel({
      polos: exportPolos,
      lancamentos: exportLancamentos,
      categoriasDespesas: exportCatDespesas,
      selectedPoloId: poloId || "todos",
      dataInicio,
      dataFim,
    });
  }

  function handleExportPdf() {
    const exportPolos = polosList.map((p) => ({
      id: String(p['id']),
      nome: String(p['nome']),
    }));

    const exportLancamentos = lancamentos.map((l) => ({
      id: String(l['id']),
      tipo: (l['tipo'] === "receita" ? "receita" : "despesa") as "receita" | "despesa",
      valor: Number(l['valor'] || 0),
      descricao: String(l['descricao'] || ""),
      categoria: String(l['categoria'] || l['categoria_nome'] || "Geral"),
      poloId: String(l['polo_id'] || "todos"),
      data: String(l['data'] || l['created_at'] || "").slice(0, 10),
    }));

    const exportCatDespesas = categorias.map((c) => ({
      nome: String(c['nome']),
      previsto: Number(c['previsto'] || 0),
    }));

    generateProfessionalPdf({
      polos: exportPolos,
      lancamentos: exportLancamentos,
      categoriasDespesas: exportCatDespesas,
      selectedPoloId: poloId || "todos",
      dataInicio,
      dataFim,
    });
  }

  return (
    <GestorShell
      title="Demonstrativo financeiro"
      description="Receitas, despesas por categoria e resumo do mês, com previsto x realizado."
      actions={
        <div className="flex items-center gap-2">
          {/* Excel Icon-only Button (Requirement 4) */}
          <Button
            variant="outline"
            size="icon"
            className="border-emerald-600/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-600 hover:text-white"
            onClick={handleExportExcel}
            title="Baixar Relatório Excel (.xlsx)"
          >
            <FileSpreadsheet className="size-4" />
          </Button>
          {/* PDF Button (Requirement 4) */}
          <Button
            variant="outline"
            className="border-red-500/30 bg-red-500/10 text-red-700 hover:bg-red-600 hover:text-white font-bold"
            onClick={handleExportPdf}
            title="Baixar Relatório PDF"
          >
            <FileText className="mr-1.5 size-4" /> PDF
          </Button>
          <Button
            className="bg-brand-gradient font-bold text-white shadow-brand"
            onClick={() => {
              setValorDisplay("0,00");
              setForm({
                tipo: "despesa",
                natureza: "realizado",
                descricao: "",
                valor: 0,
                competencia: dataInicio.slice(0, 7),
                polo_id: poloId || null,
                categoria_id: null,
              });
            }}
          >
            <Plus className="mr-1 size-4" /> Lançamento
          </Button>
        </div>
      }
    >
      {/* Centered Circle Loading Overlay (Anexo 1) */}
      {isFilterLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex flex-col items-center justify-center z-50">
          <Loader2 className="size-12 animate-spin text-primary" />
          <p className="mt-3 text-sm font-bold text-foreground">Atualizando demonstrativo...</p>
        </div>
      )}

      {/* Date Range De / Até and Polo Selection Filters (Anexo 1 & 5) */}
      <div className="mb-6 grid gap-4 rounded-xl border border-border bg-card p-4 shadow-xs sm:grid-cols-3">
        <div>
          <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
            <Calendar className="size-3.5 text-primary" /> Período De (Início)
          </Label>
          <Input
            type="date"
            value={dataInicio}
            onChange={handleDataInicioChange}
            className="mt-1 h-10 font-medium"
          />
        </div>
        <div>
          <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
            <Calendar className="size-3.5 text-primary" /> Período Até (Fim)
          </Label>
          <Input
            type="date"
            value={dataFim}
            onChange={handleDataFimChange}
            className="mt-1 h-10 font-medium"
          />
        </div>
        <div>
          <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
            <Filter className="size-3.5 text-primary" /> Polo / Unidade
          </Label>
          <select
            className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-medium"
            value={poloId}
            onChange={(e) => handlePoloChange(e.target.value)}
          >
            <option value="">Todos os polos</option>
            {polosList.map((p: Row) => (
              <option key={String(p['id'])} value={String(p['id'])}>
                {String(p['nome'])}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* 1. RECEITAS */}
          <section className="rounded-xl border border-border bg-card shadow-xs flex flex-col justify-between">
            <div>
              <h2 className="border-b border-border bg-muted/40 px-4 py-3 text-sm font-bold uppercase tracking-wide">
                1. Receitas
              </h2>
              {receitas.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-foreground">Nenhuma receita lançada no período.</p>
              ) : (
                receitas.map((l) => (
                  <div key={String(l['id'])} className="flex items-center justify-between border-b border-border/60 px-4 py-3 text-sm">
                    <div>
                      <span className="font-semibold text-foreground block">{String(l['descricao'])}</span>
                      <span className="text-xs text-muted-foreground">{String(l['categoria_nome'] || "Receita")}</span>
                    </div>
                    <span className="flex items-center gap-2">
                      <span className="whitespace-nowrap font-bold text-emerald-600 tabular-nums">{brl(l['valor'])}</span>
                      <button type="button" className="text-destructive hover:opacity-80" onClick={() => mApagar.mutate(String(l['id']))}>
                        <Trash2 className="size-4" />
                      </button>
                    </span>
                  </div>
                ))
              )}
            </div>
            <Linha label="Total de receitas" valor={totalReceitas} forte />
          </section>

          {/* 3. RESUMO FINANCEIRO (Fix Anexo 4: Despesas previstas orçamento) */}
          <section className="rounded-xl border border-border bg-card shadow-xs">
            <h2 className="border-b border-border bg-muted/40 px-4 py-3 text-sm font-bold uppercase tracking-wide">
              3. Resumo financeiro
            </h2>
            <Linha label="Receitas do mês" valor={totalReceitas} />
            <Linha label="Despesas realizadas" valor={totalDespesas} />
            <Linha label="Despesas previstas (orçamento)" valor={previstoTotal} forte />
            <Linha label="Saldo do mês (realizado)" valor={totalReceitas - totalDespesas} forte />
            <Linha label="Diferença previsto x realizado" valor={previstoTotal - totalDespesas} />
          </section>

          {/* 2. DESPESAS POR CATEGORIA (DETALHADO POR ITEM, DESCRIÇÃO, QUANTIDADE E VARIAÇÃO) */}
          <section className="rounded-xl border border-border bg-card shadow-xs lg:col-span-2">
            <div className="border-b border-border bg-muted/40 px-4 py-3 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wide">
                2. Despesas por categoria e detalhamento de itens
              </h2>
              <span className="text-xs font-semibold text-muted-foreground">
                Itens previstos × realizados
              </span>
            </div>

            <div className="p-4 space-y-6">
              {(() => {
                // Combine Database items & Parsed detailed items
                const poloItens = itensOrcamentoOFICIAIS.filter((item) => !poloId || item.poloId === poloId);

                // Group by category
                const categoriasMap: Record<string, typeof poloItens> = {};
                poloItens.forEach((item) => {
                  if (!categoriasMap[item.categoria]) {
                    categoriasMap[item.categoria] = [];
                  }
                  categoriasMap[item.categoria]!.push(item);
                });

                // Add empty fallback if no detailed items
                if (Object.keys(categoriasMap).length === 0) {
                  return (
                    <div className="text-center py-6 text-sm text-muted-foreground">
                      Selecione um polo para visualizar o detalhamento completo de itens e provisões.
                    </div>
                  );
                }

                return Object.entries(categoriasMap).map(([catNome, catItens]) => {
                  const catPrevisto = catItens.reduce((s, i) => s + i.previsto, 0);
                  const catRealizado = catItens.reduce((s, i) => s + i.realizado, 0);
                  const catVariacao = catPrevisto - catRealizado;

                  return (
                    <div key={catNome} className="rounded-xl border border-border/80 overflow-hidden">
                      {/* Header da Categoria */}
                      <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm font-bold">
                        <span>CATEGORIA: {catNome.toUpperCase()}</span>
                        <div className="flex items-center gap-4 text-xs font-semibold">
                          <span>Previsto: {brl(catPrevisto)}</span>
                          <span>Realizado: {brl(catRealizado)}</span>
                          <span className={catVariacao >= 0 ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                            Variação: {brl(catVariacao)}
                          </span>
                        </div>
                      </div>

                      {/* Tabela de Itens */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-border bg-muted/30 uppercase text-[10px] font-bold text-muted-foreground">
                              <th className="py-2.5 px-3">Item ou Serviço</th>
                              <th className="py-2.5 px-3">Descrição / Detalhe</th>
                              <th className="py-2.5 px-3">Quantidade</th>
                              <th className="py-2.5 px-3 text-right">Previsto (R$)</th>
                              <th className="py-2.5 px-3 text-right">Realizado (R$)</th>
                              <th className="py-2.5 px-3 text-right">Variação / Diferença (R$)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60">
                            {catItens.map((item) => {
                              const variacao = item.previsto - item.realizado;
                              return (
                                <tr key={item.id} className="hover:bg-muted/20">
                                  <td className="py-2.5 px-3 font-bold text-foreground">{item.item}</td>
                                  <td className="py-2.5 px-3 text-muted-foreground font-medium max-w-xs leading-relaxed">
                                    {item.descricao}
                                  </td>
                                  <td className="py-2.5 px-3 font-semibold text-primary">{item.quantidade}</td>
                                  <td className="py-2.5 px-3 text-right font-semibold text-foreground">{brl(item.previsto)}</td>
                                  <td className="py-2.5 px-3 text-right font-bold text-foreground">{brl(item.realizado)}</td>
                                  <td className={`py-2.5 px-3 text-right font-extrabold ${variacao >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                                    {brl(variacao)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </section>

          {/* 4. OUTRAS CONTAS — DESPESAS LANÇADAS NO MÊS (com Descrição / Detalhe - Anexo 3) */}
          <section className="rounded-xl border border-border bg-card shadow-xs lg:col-span-2">
            <h2 className="border-b border-border bg-muted/40 px-4 py-3 text-sm font-bold uppercase tracking-wide">
              4. Outras contas — despesas lançadas no mês
            </h2>
            {despesas.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">Nenhuma despesa realizada lançada no período.</p>
            ) : (
              despesas.map((l) => (
                <div key={String(l['id'])} className="flex items-center justify-between border-b border-border/60 px-4 py-3 text-sm hover:bg-muted/30">
                  <div>
                    <span className="font-semibold text-foreground block">{String(l['descricao'])}</span>
                    <span className="text-xs text-muted-foreground">
                      {String(l['categoria_nome'] || "Despesa")} • {String(l['data'] || "").slice(0, 10)}
                    </span>
                  </div>
                  <span className="flex items-center gap-2">
                    <span className="whitespace-nowrap font-bold text-destructive tabular-nums">{brl(l['valor'])}</span>
                    <button type="button" className="text-destructive hover:opacity-80" onClick={() => mApagar.mutate(String(l['id']))}>
                      <Trash2 className="size-4" />
                    </button>
                  </span>
                </div>
              ))
            )}
          </section>
        </div>
      )}

      {/* Modal Novo Lançamento com Descrição / Detalhe e Formatação BRL (Anexo 3 & 4) */}
      <Dialog open={Boolean(form)} onOpenChange={(v) => !v && setForm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Novo lançamento</DialogTitle>
          </DialogHeader>
          {form ? (
            <form
              className="grid gap-4 mt-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!String(form['descricao'] || "").trim()) {
                  toast.error("Preencha o campo de Descrição / Detalhe");
                  return;
                }
                mSalvar.mutate(form);
              }}
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Tipo</Label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-medium"
                    value={String(form['tipo'])}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  >
                    <option value="despesa">Despesa</option>
                    <option value="receita">Receita</option>
                  </select>
                </div>
                {/* Formatação BRL no Input de Valor */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Valor (R$)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-sm font-bold text-muted-foreground">R$</span>
                    <Input
                      type="text"
                      required
                      value={valorDisplay}
                      onChange={handleValorInputChange}
                      className="pl-9 font-extrabold text-foreground"
                    />
                  </div>
                </div>
              </div>

              {/* Campo Descrição / Detalhe (Anexo 3) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  Descrição / Detalhe <span className="text-destructive">*</span>
                </Label>
                <Input
                  required
                  placeholder="Ex.: Aquisição de materiais para o projeto"
                  value={String(form['descricao'] ?? "")}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  className="font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Categoria</Label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-medium"
                  value={String(form['categoria_id'] ?? "")}
                  onChange={(e) => setForm({ ...form, categoria_id: e.target.value || null })}
                >
                  <option value="">Sem categoria</option>
                  {categorias
                    .filter((c) => c['tipo'] === form['tipo'])
                    .map((c) => (
                      <option key={String(c['id'])} value={String(c['id'])}>
                        {String(c['nome'])}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Polo</Label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-medium"
                  value={String(form['polo_id'] ?? "")}
                  onChange={(e) => setForm({ ...form, polo_id: e.target.value || null })}
                >
                  <option value="">Geral (todos os polos)</option>
                  {polosList.map((p: Row) => (
                    <option key={String(p['id'])} value={String(p['id'])}>
                      {String(p['nome'])}
                    </option>
                  ))}
                </select>
              </div>

              <DialogFooter className="mt-2">
                <Button type="submit" disabled={mSalvar.isPending} className="bg-brand-gradient font-bold text-white shadow-brand">
                  {mSalvar.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null} Salvar Lançamento
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </GestorShell>
  );
}

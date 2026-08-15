import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Plus, Trash2, Download } from "lucide-react";
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
import { brl, competenciaLabel, competenciaOptions } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/gestor/financeiro")({
  component: FinanceiroPage,
});

type Row = Record<string, any>;

function Linha({ label, valor, forte }: { label: string; valor: number; forte?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between border-b border-border/60 px-3 py-2 text-sm ${
        forte ? "font-bold" : ""
      }`}
    >
      <span className={forte ? "" : "text-muted-foreground"}>{label}</span>
      <span className={forte ? "text-primary" : ""}>{brl(valor)}</span>
    </div>
  );
}

function FinanceiroPage() {
  const qc = useQueryClient();
  const fetchFinanceiro = useServerFn(getFinanceiro);
  const salvar = useServerFn(saveLancamento);
  const apagar = useServerFn(deleteLancamento);

  const meses = competenciaOptions();
  const [competencia, setCompetencia] = useState(meses[0]!);
  const [poloId, setPoloId] = useState("");
  const [form, setForm] = useState<Row | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["financeiro", competencia, poloId],
    queryFn: () => fetchFinanceiro({ data: poloId ? { competencia, poloId } : { competencia } }),
  });

  const mSalvar = useMutation({
    mutationFn: (v: Row) => salvar({ data: v }),
    onSuccess: () => {
      setForm(null);
      toast.success("Lançamento salvo");
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error("Erro", { description: e.message }),
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
  const itens: Row[] = data?.itens ?? [];

  const receitas = lancamentos.filter((l) => l['tipo'] === "receita");
  const despesas = lancamentos.filter((l) => l['tipo'] === "despesa");
  const totalReceitas = receitas.reduce((s, l) => s + Number(l['valor']), 0);
  const totalDespesas = despesas.reduce((s, l) => s + Number(l['valor']), 0);
  const previstoTotal = itens.reduce((s, i) => s + Number(i['custo_mensal']), 0);

  const previstoPorCategoria = categorias
    .filter((c) => c['tipo'] === "despesa")
    .map((c) => ({
      categoria: c,
      previsto: itens.filter((i) => i['categoria_id'] === c['id']).reduce((s, i) => s + Number(i['custo_mensal']), 0),
      realizado: despesas.filter((l) => l['categoria_id'] === c['id']).reduce((s, l) => s + Number(l['valor']), 0),
    }))
    .filter((r) => r.previsto > 0 || r.realizado > 0);

  function exportarCsv() {
    const linhas = [
      ["Categoria", "Previsto", "Realizado"],
      ...previstoPorCategoria.map((r) => [String(r.categoria['nome']), r.previsto.toFixed(2), r.realizado.toFixed(2)]),
      ["TOTAL DESPESAS", previstoTotal.toFixed(2), totalDespesas.toFixed(2)],
      ["TOTAL RECEITAS", "", totalReceitas.toFixed(2)],
    ];
    const csv = linhas.map((l) => l.join(";")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `financeiro-${competencia}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <GestorShell
      title="Demonstrativo financeiro"
      description="Receitas, despesas por categoria e resumo do mês, com previsto x realizado."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" className="font-bold" onClick={exportarCsv}>
            <Download className="mr-1 size-4" /> CSV
          </Button>
          <Button
            className="bg-brand-gradient font-bold text-white shadow-brand"
            onClick={() =>
              setForm({
                tipo: "receita",
                natureza: "realizado",
                descricao: "",
                valor: 0,
                competencia,
                polo_id: poloId || null,
                categoria_id: null,
              })
            }
          >
            <Plus className="mr-1 size-4" /> Lançamento
          </Button>
        </div>
      }
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:max-w-xl">
        <div className="space-y-1.5">
          <Label>Competência</Label>
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={competencia}
            onChange={(e) => setCompetencia(e.target.value)}
          >
            {meses.map((m) => (
              <option key={m} value={m}>
                {competenciaLabel(m)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Polo</Label>
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={poloId}
            onChange={(e) => setPoloId(e.target.value)}
          >
            <option value="">Todos os polos</option>
            {(data?.polos ?? []).map((p: Row) => (
              <option key={String(p['id'])} value={String(p['id'])}>
                {String(p['nome'])}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <Loader2 className="size-6 animate-spin text-primary" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-xl border border-border bg-card">
            <h2 className="border-b border-border bg-muted/40 px-3 py-2 text-sm font-bold uppercase tracking-wide">
              1. Receitas
            </h2>
            {receitas.length === 0 ? (
              <p className="px-3 py-4 text-sm text-muted-foreground">Nenhuma receita lançada no mês.</p>
            ) : (
              receitas.map((l) => (
                <div key={String(l['id'])} className="flex items-center justify-between border-b border-border/60 px-3 py-2 text-sm">
                  <span className="min-w-0 break-words pr-2 text-muted-foreground">{String(l['descricao'])}</span>
                  <span className="flex items-center gap-2">
                    <span className="whitespace-nowrap font-bold tabular-nums">{brl(l['valor'])}</span>
                    <button type="button" className="text-destructive" onClick={() => mApagar.mutate(String(l['id']))}>
                      <Trash2 className="size-3.5" />
                    </button>
                  </span>
                </div>
              ))
            )}
            <Linha label="Total de receitas" valor={totalReceitas} forte />
          </section>

          <section className="rounded-xl border border-border bg-card">
            <h2 className="border-b border-border bg-muted/40 px-3 py-2 text-sm font-bold uppercase tracking-wide">
              3. Resumo financeiro
            </h2>
            <Linha label="Receitas do mês" valor={totalReceitas} />
            <Linha label="Despesas realizadas" valor={totalDespesas} />
            <Linha label="Despesas previstas (orçamento)" valor={previstoTotal} />
            <Linha label="Saldo do mês (realizado)" valor={totalReceitas - totalDespesas} forte />
            <Linha label="Diferença previsto x realizado" valor={previstoTotal - totalDespesas} />
          </section>

          <section className="rounded-xl border border-border bg-card lg:col-span-2">
            <h2 className="border-b border-border bg-muted/40 px-3 py-2 text-sm font-bold uppercase tracking-wide">
              2. Despesas por categoria
            </h2>
            <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-x-2 sm:gap-x-4 px-3 py-2 text-[11px] font-bold uppercase text-muted-foreground">
              <span>Categoria</span>
              <span className="text-right">Previsto</span>
              <span className="text-right">Realizado</span>
            </div>
            {previstoPorCategoria.map((r) => (
              <div
                key={String(r.categoria['id'])}
                className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-x-2 sm:gap-x-4 border-t border-border/60 px-3 py-2 text-xs sm:text-sm"
              >
                <span className="min-w-0 break-words pr-1">{String(r.categoria['nome'])}</span>
                <span className="whitespace-nowrap text-right tabular-nums text-muted-foreground">{brl(r.previsto)}</span>
                <span className="whitespace-nowrap text-right font-bold tabular-nums">{brl(r.realizado)}</span>
              </div>
            ))}
            <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-x-2 sm:gap-x-4 border-t border-border px-3 py-2 text-sm font-bold">
              <span>Total</span>
              <span className="text-right">{brl(previstoTotal)}</span>
              <span className="text-right text-primary">{brl(totalDespesas)}</span>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card lg:col-span-2">
            <h2 className="border-b border-border bg-muted/40 px-3 py-2 text-sm font-bold uppercase tracking-wide">
              4. Outras contas — despesas lançadas no mês
            </h2>
            {despesas.length === 0 ? (
              <p className="px-3 py-4 text-sm text-muted-foreground">Nenhuma despesa realizada lançada.</p>
            ) : (
              despesas.map((l) => (
                <div key={String(l['id'])} className="flex items-center justify-between border-b border-border/60 px-3 py-2 text-sm">
                  <span className="min-w-0 break-words pr-2 text-muted-foreground">{String(l['descricao'])}</span>
                  <span className="flex items-center gap-2">
                    <span className="whitespace-nowrap font-bold tabular-nums">{brl(l['valor'])}</span>
                    <button type="button" className="text-destructive" onClick={() => mApagar.mutate(String(l['id']))}>
                      <Trash2 className="size-3.5" />
                    </button>
                  </span>
                </div>
              ))
            )}
          </section>
        </div>
      )}

      <Dialog open={Boolean(form)} onOpenChange={(v) => !v && setForm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo lançamento</DialogTitle>
          </DialogHeader>
          {form ? (
            <form
              className="grid gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                mSalvar.mutate(form);
              }}
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Tipo</Label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={String(form['tipo'])}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  >
                    <option value="receita">Receita</option>
                    <option value="despesa">Despesa</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Valor (R$)</Label>
                  <Input type="number" step="0.01" required value={Number(form['valor'] ?? 0)} onChange={(e) => setForm({ ...form, valor: Number(e.target.value) })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Descrição</Label>
                <Input required value={String(form['descricao'] ?? "")} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
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
                <Label>Polo</Label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={String(form['polo_id'] ?? "")}
                  onChange={(e) => setForm({ ...form, polo_id: e.target.value || null })}
                >
                  <option value="">Geral (todos os polos)</option>
                  {(data?.polos ?? []).map((p: Row) => (
                    <option key={String(p['id'])} value={String(p['id'])}>
                      {String(p['nome'])}
                    </option>
                  ))}
                </select>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-brand-gradient font-bold text-white">
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </GestorShell>
  );
}

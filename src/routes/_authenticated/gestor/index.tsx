import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { getResumoGestor, getFinanceiro } from "@/lib/gestao.functions";
import { GestorShell } from "@/components/admin/GestorShell";
import { Kpi } from "@/components/admin/Kpi";
import { Skeleton } from "@/components/ui/skeleton";
import { brl } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/gestor/")({
  component: DashboardPage,
});

function DashboardPage() {
  const fetchResumo = useServerFn(getResumoGestor);
  const fetchFinanceiro = useServerFn(getFinanceiro);

  const { data: resumoData, isLoading: loadingResumo } = useQuery({
    queryKey: ["resumo"],
    queryFn: () => fetchResumo({}),
  });

  const { data: finData, isLoading: loadingFin } = useQuery({
    queryKey: ["financeiro-dashboard"],
    queryFn: () => fetchFinanceiro({ data: {} }),
  });

  if (loadingResumo || loadingFin || !resumoData) {
    return (
      <GestorShell title="Dashboard" description="Carregando indicadores do projeto...">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </GestorShell>
    );
  }

  const polos = resumoData.polos ?? [];
  const atividades = resumoData.atividades ?? [];
  const turmas = resumoData.turmas ?? [];
  const matriculas = (resumoData.matriculas ?? []).filter((m: { status: string }) => m.status === "ativa");
  const pedidos = resumoData.pedidos ?? [];
  const lancamentos = finData?.lancamentos ?? [];

  const activePolos = polos.filter((p: { ativo: boolean }) => p.ativo);

  // Dynamic sum of beneficiarios projetados (Fix Requirement 4: "nao esta somando beneficiarios")
  const beneficiariosPolos = activePolos.reduce(
    (s: number, p: { beneficiarios_projetados: number }) => s + Number(p.beneficiarios_projetados || 0),
    0,
  );
  const beneficiariosAtivs = atividades.reduce(
    (s: number, a: { beneficiarios_projetados: number }) => s + Number(a.beneficiarios_projetados || 0),
    0,
  );
  const totalBeneficiarios = Math.max(beneficiariosPolos, beneficiariosAtivs);

  // Custo Mensal Previsto
  const custoMensalPolos = activePolos.reduce(
    (s: number, p: { orcamento_mensal: number }) => s + Number(p.orcamento_mensal || 0),
    0,
  );
  const custoMensalAtivs = atividades.reduce(
    (s: number, a: { custo_mensal: number }) => s + Number(a.custo_mensal || 0),
    0,
  );
  const custoMensalPrevisto = Math.max(custoMensalPolos, custoMensalAtivs);

  // Total Realizado (Despesas Lançadas)
  const despesasRealizadas = lancamentos
    .filter((l: { tipo: string; valor: number }) => l.tipo === "despesa")
    .reduce((s: number, l: { valor: number }) => s + Number(l.valor || 0), 0);

  const percUtilizado = custoMensalPrevisto > 0 ? (despesasRealizadas / custoMensalPrevisto) * 100 : 0;
  const vagas = turmas.reduce((s: number, t: { vagas: number }) => s + Number(t.vagas || 0), 0);
  const pendentes = pedidos.filter((p: { status: string }) => p.status === "pendente");

  // Calculate per-polo alerts (Anexo 5)
  const poloAlerts = activePolos.map((p: { id: string; nome: string; orcamento_mensal: number }) => {
    const poloOrcamento = Number(p.orcamento_mensal || 0);
    const poloGastos = lancamentos
      .filter((l: { tipo: string; polo_id: string; valor: number }) => l.tipo === "despesa" && String(l.polo_id) === String(p.id))
      .reduce((s: number, l: { valor: number }) => s + Number(l.valor || 0), 0);
    const perc = poloOrcamento > 0 ? (poloGastos / poloOrcamento) * 100 : 0;
    return {
      id: p.id,
      nome: p.nome,
      orcamento: poloOrcamento,
      gastos: poloGastos,
      perc,
      isWarning: perc >= 75 && perc < 90,
      isCritical: perc >= 90,
    };
  });

  const activeAlerts = poloAlerts.filter((a: { isWarning: boolean; isCritical: boolean }) => a.isWarning || a.isCritical);

  return (
    <GestorShell
      title="Dashboard"
      description="Visão geral da plataforma CUFA — polos, atividades, vagas e orçamento."
    >
      {/* Cards de KPIs Principais (Anexo 4 & 5) */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Custo mensal previsto" value={brl(custoMensalPrevisto)} hint="Orçamento planejado" />
        <Kpi label="Valores já utilizados" value={brl(despesasRealizadas)} hint="Despesas realizadas" />
        <Kpi label="% Orçamento utilizado" value={`${percUtilizado.toFixed(1)}%`} hint="Em relação ao previsto" />
        <Kpi label="Beneficiários projetados" value={String(totalBeneficiarios)} hint="Soma de todos os polos" />
        <Kpi label="Vagas / matrículas" value={`${matriculas.length} / ${vagas || 360}`} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Polos ativos" value={String(activePolos.length)} />
        <Kpi label="Atividades" value={String(atividades.length)} />
        <Kpi label="Turmas" value={String(turmas.length)} />
        <Kpi
          label="Pedidos pendentes"
          value={String(pendentes.length)}
          hint={brl(pendentes.reduce((s: number, p: { valor_total: number }) => s + Number(p.valor_total || 0), 0))}
        />
      </div>

      {/* Cards de Alertas de Orçamento (Anexo 5) */}
      <div className="mt-8 rounded-xl border border-border bg-card p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="size-5 text-amber-500" />
          <h2 className="text-base font-bold text-foreground">Alertas de Orçamento por Polo e Total</h2>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {/* Card Alerta Geral */}
          <div
            className={`p-3.5 rounded-lg border flex items-start gap-3 ${
              percUtilizado >= 80
                ? "border-amber-500/30 bg-amber-500/10 text-amber-900"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-900"
            }`}
          >
            {percUtilizado >= 80 ? (
              <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wide">Alerta Geral de Orçamento</h3>
              <p className="text-xs mt-0.5 leading-relaxed">
                {percUtilizado >= 80
                  ? `Atenção: O total gasto atingiu ${percUtilizado.toFixed(1)}% do orçamento previsto.`
                  : `Situação normal: ${percUtilizado.toFixed(1)}% do orçamento total utilizado.`}
              </p>
            </div>
          </div>

          {/* Cards Alerta Por Polo */}
          {activeAlerts.length === 0 ? (
            <div className="p-3.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-900 flex items-start gap-3">
              <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wide">Alertas Individuais</h3>
                <p className="text-xs mt-0.5">Todos os polos operando dentro do orçamento limites.</p>
              </div>
            </div>
          ) : (
            activeAlerts.map((a: { id: string; nome: string; perc: number; gastos: number; orcamento: number; isCritical: boolean }) => (
              <div
                key={a.id}
                className={`p-3.5 rounded-lg border flex items-start gap-3 ${
                  a.isCritical ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-amber-500/30 bg-amber-500/10 text-amber-900"
                }`}
              >
                <AlertTriangle className={`size-5 shrink-0 mt-0.5 ${a.isCritical ? "text-destructive" : "text-amber-600"}`} />
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wide">Polo {a.nome}</h3>
                  <p className="text-xs mt-0.5">
                    {a.isCritical ? "⚠️ Crítico: " : "⚡ Atenção: "}
                    {a.perc.toFixed(1)}% do orçamento utilizado ({brl(a.gastos)} de {brl(a.orcamento)}).
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <h2 className="mt-8 text-lg font-bold">Resumo por polo</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {polos.map((p: { id: string; nome: string; cidade: string; uf: string; vagas_totais: number; orcamento_mensal: number; beneficiarios_projetados: number }) => {
          const ativs = atividades.filter((a: { polo_id: string }) => a.polo_id === p.id);
          const custo = Number(p.orcamento_mensal || 0) || ativs.reduce((s: number, a: { custo_mensal: number }) => s + Number(a.custo_mensal || 0), 0);
          return (
            <div key={p.id} className="rounded-xl border border-border bg-card p-4">
              <p className="text-base font-bold">{p.nome}</p>
              <p className="text-xs text-muted-foreground">
                {p.cidade} / {p.uf}
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Beneficiários</dt>
                  <dd className="break-words font-bold tabular-nums text-primary">{p.beneficiarios_projetados || 100}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Vagas</dt>
                  <dd className="break-words font-bold tabular-nums">{p.vagas_totais || 100}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs text-muted-foreground">Orçamento mensal</dt>
                  <dd className="break-words font-bold tabular-nums text-primary">{brl(custo)}</dd>
                </div>
              </dl>
            </div>
          );
        })}
      </div>
    </GestorShell>
  );
}

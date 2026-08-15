import { AlertTriangle, Building2, Users, DollarSign, TrendingUp, Percent, CheckCircle2 } from "lucide-react";
import { Polo, Lancamento } from "./types";
import { formatBRL } from "./utils";

export function DashboardTab({
  polos,
  lancamentos,
}: {
  polos: Polo[];
  lancamentos: Lancamento[];
}) {
  const activePolos = polos.filter((p) => p.ativo);

  // Dynamic sum of beneficiarios (Fix Requirement 4: "nao esta somando os beneficiarios projetados")
  const totalBeneficiarios = activePolos.reduce((sum, p) => sum + p.beneficiariosProjetados, 0);
  const totalVagas = activePolos.reduce((sum, p) => sum + p.vagasTotais, 0);

  // Budget vs Spent
  const totalOrcamentoPrevisto = activePolos.reduce((sum, p) => sum + p.orcamentoMensal, 0);
  const totalOrcamentoProjeto = totalOrcamentoPrevisto * 6; // 6 Meses

  const totalDespesasRealizadas = lancamentos
    .filter((l) => l.tipo === "despesa")
    .reduce((sum, l) => sum + l.valor, 0);

  const percUtilizadoTotal = totalOrcamentoPrevisto > 0
    ? (totalDespesasRealizadas / totalOrcamentoPrevisto) * 100
    : 0;

  // Calculate per-polo alerts (Anexo 5)
  const poloAlerts = activePolos.map((p) => {
    const poloGastos = lancamentos
      .filter((l) => l.tipo === "despesa" && l.poloId === p.id)
      .reduce((sum, l) => sum + l.valor, 0);
    const perc = p.orcamentoMensal > 0 ? (poloGastos / p.orcamentoMensal) * 100 : 0;
    return {
      polo: p,
      gastos: poloGastos,
      perc,
      isWarning: perc >= 75 && perc < 90,
      isCritical: perc >= 90,
    };
  });

  const activeAlerts = poloAlerts.filter((a) => a.isWarning || a.isCritical);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground">Dashboard da Plataforma</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Visão geral consolidada dos polos, matrículas, custos previstos e orçamento utilizado.
        </p>
      </div>

      {/* Main KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {/* Polos Ativos */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Polos Ativos</span>
            <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="size-4" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-foreground">{activePolos.length}</span>
            <p className="text-xs text-muted-foreground mt-1">{totalVagas} vagas totais</p>
          </div>
        </div>

        {/* Beneficiários Projetados (Dynamic Sum - Fix Requirement 4) */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Beneficiários Projetados</span>
            <span className="grid size-9 place-items-center rounded-xl bg-blue-500/10 text-blue-600">
              <Users className="size-4" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-primary">{totalBeneficiarios}</span>
            <p className="text-xs text-muted-foreground mt-1">Soma de todos os polos</p>
          </div>
        </div>

        {/* Custo Mensal Previsto */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Custo Mensal Previsto</span>
            <span className="grid size-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <DollarSign className="size-4" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-extrabold text-foreground">{formatBRL(totalOrcamentoPrevisto)}</span>
            <p className="text-xs text-muted-foreground mt-1">Orçamento mensal</p>
          </div>
        </div>

        {/* Custo Total Previsto (Projeto) */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Custo Total Previsto</span>
            <span className="grid size-9 place-items-center rounded-xl bg-purple-500/10 text-purple-600">
              <DollarSign className="size-4" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-extrabold text-foreground">{formatBRL(totalOrcamentoProjeto)}</span>
            <p className="text-xs text-muted-foreground mt-1">Projeto (6 meses)</p>
          </div>
        </div>

        {/* Valores Já Utilizados (New Card - Anexo 5) */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Valores Já Utilizados</span>
            <span className="grid size-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <TrendingUp className="size-4" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-extrabold text-emerald-600">{formatBRL(totalDespesasRealizadas)}</span>
            <p className="text-xs text-muted-foreground mt-1">Despesas lançadas</p>
          </div>
        </div>

        {/* % Já Utilizada (New Card - Anexo 5) */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">% Utilizada</span>
            <span className="grid size-9 place-items-center rounded-xl bg-purple-500/10 text-purple-600">
              <Percent className="size-4" />
            </span>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <span className={`text-2xl font-extrabold ${percUtilizadoTotal > 90 ? "text-destructive" : percUtilizadoTotal > 75 ? "text-amber-600" : "text-emerald-600"}`}>
                {percUtilizadoTotal.toFixed(1)}%
              </span>
              <span className="text-xs font-bold text-muted-foreground">de 100%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2 mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${percUtilizadoTotal > 90 ? "bg-destructive" : percUtilizadoTotal > 75 ? "bg-amber-500" : "bg-emerald-500"}`}
                style={{ width: `${Math.min(100, percUtilizadoTotal)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Alertas de Orçamento Section (Anexo 5) */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="size-5 text-amber-500" />
          <h3 className="text-lg font-bold text-foreground">Alertas de Orçamento e Limites</h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Card Alerta Geral */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${percUtilizadoTotal >= 80 ? "border-amber-500/30 bg-amber-500/10 text-amber-900" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-900"}`}>
            {percUtilizadoTotal >= 80 ? (
              <AlertTriangle className="size-6 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="size-6 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className="font-bold text-sm">Alerta Geral de Orçamento da CUFA</h4>
              <p className="text-xs mt-1 leading-relaxed opacity-90">
                {percUtilizadoTotal >= 80
                  ? `Atenção: O total gasto atingiu ${percUtilizadoTotal.toFixed(1)}% do orçamento projetado da instituição.`
                  : `Situação normal: ${percUtilizadoTotal.toFixed(1)}% do orçamento total utilizado até o momento.`}
              </p>
            </div>
          </div>

          {/* Cards Alerta Por Polo */}
          {activeAlerts.length === 0 ? (
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-900 flex items-start gap-3">
              <CheckCircle2 className="size-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Alerta por Polo</h4>
                <p className="text-xs mt-1 opacity-90">Todos os polos individuais estão operando dentro do orçamento limite.</p>
              </div>
            </div>
          ) : (
            activeAlerts.map((a) => (
              <div
                key={a.polo.id}
                className={`p-4 rounded-xl border flex items-start gap-3 ${a.isCritical ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-amber-500/30 bg-amber-500/10 text-amber-900"}`}
              >
                <AlertTriangle className={`size-6 shrink-0 mt-0.5 ${a.isCritical ? "text-destructive" : "text-amber-600"}`} />
                <div>
                  <h4 className="font-bold text-sm">Polo {a.polo.nome}</h4>
                  <p className="text-xs mt-1 opacity-90">
                    {a.isCritical ? "⚠️ Crítico: " : "⚡ Atenção: "}
                    {a.perc.toFixed(1)}% do orçamento utilizado ({formatBRL(a.gastos)} de {formatBRL(a.polo.orcamentoMensal)}).
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Resumo de Polos */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
        <h3 className="text-lg font-bold text-foreground mb-4">Detalhamento dos Polos Ativos</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {activePolos.map((p) => (
            <div key={p.id} className="rounded-xl border border-border bg-muted/20 p-4">
              <span className="text-xs font-bold text-primary uppercase">{p.cidade} / {p.uf}</span>
              <h4 className="font-bold text-base text-foreground mt-1">{p.nome}</h4>
              <dl className="mt-3 text-xs space-y-1 text-muted-foreground">
                <div className="flex justify-between">
                  <dt>Beneficiários:</dt>
                  <dd className="font-bold text-foreground">{p.beneficiariosProjetados}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Vagas Totais:</dt>
                  <dd className="font-bold text-foreground">{p.vagasTotais}</dd>
                </div>
                <div className="flex justify-between pt-1 border-t border-border/40">
                  <dt>Orçamento Mensal:</dt>
                  <dd className="font-extrabold text-primary">{formatBRL(p.orcamentoMensal)}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

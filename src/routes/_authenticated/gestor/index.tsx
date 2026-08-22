import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useIsFetching } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle2, Filter, Calendar, Loader2 } from "lucide-react";

import { getResumoGestor, getFinanceiro, getQuadroPessoas } from "@/lib/gestao.functions";
import { GestorShell } from "@/components/admin/GestorShell";
import { PoloMultiSelect } from "@/components/admin/PoloMultiSelect";
import { Kpi } from "@/components/admin/Kpi";
import { Skeleton } from "@/components/ui/skeleton";
import { brl } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/gestor/")({
  component: DashboardPage,
});

function mesesEntre(inicio?: string | null, fim?: string | null): number {
  if (!inicio || !fim) return 0;
  const d1 = new Date(inicio);
  const d2 = new Date(fim);
  if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) return 0;
  const meses = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth()) + 1;
  return meses > 0 ? meses : 0;
}

function DashboardPage() {
  const fetchResumo = useServerFn(getResumoGestor);
  const fetchFinanceiro = useServerFn(getFinanceiro);
  const fetchQuadro = useServerFn(getQuadroPessoas);

  const [selectedPoloIds, setSelectedPoloIds] = useState<string[]>([]);
  const [dataInicio, setDataInicio] = useState("2026-08-01");
  const [dataFim, setDataFim] = useState("2026-08-31");

  const { data: resumoData, isLoading: loadingResumo } = useQuery({
    queryKey: ["resumo"],
    queryFn: () => fetchResumo({}),
    refetchOnWindowFocus: true,
  });

  const { data: finData, isLoading: loadingFin } = useQuery({
    queryKey: ["financeiro-dashboard", dataInicio, dataFim],
    queryFn: () => fetchFinanceiro({ data: { desde: dataInicio, ate: dataFim } }),
    refetchOnWindowFocus: true,
  });

  const { data: quadro } = useQuery({
    queryKey: ["quadro-pessoas"],
    queryFn: () => fetchQuadro({}),
    refetchOnWindowFocus: true,
  });

  const fetching = useIsFetching() > 0;

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

  const polos = (resumoData.polos ?? []) as any[];
  const activePolosAll = polos.filter((p) => p.ativo && !p.rascunho);
  const activePolos =
    selectedPoloIds.length === 0
      ? activePolosAll
      : activePolosAll.filter((p) => selectedPoloIds.includes(String(p.id)));
  const poloIdsAtivos = activePolos.map((p) => String(p.id));

  const atividades = ((resumoData.atividades ?? []) as any[]).filter((a) =>
    poloIdsAtivos.includes(String(a.polo_id)),
  );
  const atividadeIds = atividades.map((a) => String(a.id));

  const turmas = ((resumoData.turmas ?? []) as any[]).filter((t) =>
    atividadeIds.includes(String(t.atividade_id)),
  );
  const turmaIds = turmas.map((t) => String(t.id));

  const matriculas = ((resumoData.matriculas ?? []) as any[])
    .filter((m) => m.status === "ativa")
    .filter((m) => turmaIds.includes(String(m.turma_id)));

  const pedidos = ((resumoData.pedidos ?? []) as any[]).filter((p) =>
    poloIdsAtivos.includes(String(p.polo_id)),
  );

  const lancamentos = ((finData?.lancamentos ?? []) as any[]).filter((l) =>
    poloIdsAtivos.includes(String(l.polo_id)),
  );

  // Orçamento previsto real (soma dos polos selecionados)
  const custoMensalPrevisto = activePolos.reduce(
    (s, p) => s + Number(p.orcamento_mensal || 0),
    0,
  );

  const totalBeneficiarios = activePolos.reduce(
    (s, p) => s + Number(p.beneficiarios_projetados || 0),
    0,
  );

  // Duração do projeto calculada pelos períodos cadastrados nas atividades
  const duracoes = atividades
    .map((a) => mesesEntre(a.data_inicio_atividade, a.data_fim_atividade))
    .filter((m) => m > 0);
  const duracaoProjetoMeses = duracoes.length > 0 ? Math.max(...duracoes) : 0;

  const custoTotalPrevisto = custoMensalPrevisto * (duracaoProjetoMeses || 1);

  const despesasRealizadas = lancamentos
    .filter((l) => l.tipo === "despesa")
    .reduce((s, l) => s + Number(l.valor || 0), 0);

  const percUtilizadoNum =
    custoMensalPrevisto > 0 ? (despesasRealizadas / custoMensalPrevisto) * 100 : 0;
  const percUtilizadoStr =
    percUtilizadoNum > 0 && percUtilizadoNum < 0.1
      ? percUtilizadoNum.toFixed(2) + "%"
      : percUtilizadoNum.toFixed(1) + "%";

  const alunosCadastrados = ((quadro?.alunos ?? []) as any[]).filter((a) => {
    if (selectedPoloIds.length === 0) return true;
    const nomes = activePolos.map((p) => String(p.nome).toLowerCase());
    return nomes.includes(String(a.polo_nome || "").toLowerCase());
  });

  const totalMatriculadosReal = Math.max(alunosCadastrados.length, matriculas.length);
  const totalPessoasImpactadas = alunosCadastrados.reduce((acc, a) => {
    const qtd = Number(a.qtd_pessoas_residencia || 0);
    return acc + (qtd > 0 ? qtd : 1);
  }, 0);

  const pendentes = pedidos.filter((p) => p.status === "pendente");

  const poloAlerts = activePolos.map((p) => {
    const poloOrcamento = Number(p.orcamento_mensal || 0);
    const poloGastos = lancamentos
      .filter((l) => l.tipo === "despesa" && String(l.polo_id) === String(p.id))
      .reduce((s, l) => s + Number(l.valor || 0), 0);
    const perc = poloOrcamento > 0 ? (poloGastos / poloOrcamento) * 100 : 0;
    return {
      id: String(p.id),
      nome: String(p.nome),
      orcamento: poloOrcamento,
      gastos: poloGastos,
      perc,
      isWarning: perc >= 75 && perc < 90,
      isCritical: perc >= 90,
    };
  });

  const activeAlerts = poloAlerts.filter((a) => a.isWarning || a.isCritical);

  return (
    <GestorShell
      title="Dashboard"
      description="Visão geral da plataforma CUFA — polos, atividades, vagas e orçamento."
    >
      <div className="relative mb-6 rounded-2xl border border-border bg-card p-4 shadow-xs">
        {fetching && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-2xl bg-background/80 backdrop-blur-xs">
            <Loader2 className="size-10 animate-spin text-primary" />
            <p className="mt-2 text-xs font-bold text-foreground">Atualizando indicadores...</p>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Filter className="size-3.5 text-primary" /> Polo / Unidade
            </label>
            <PoloMultiSelect
              polos={activePolosAll.map((p) => ({ id: String(p.id), nome: String(p.nome) }))}
              selectedIds={selectedPoloIds}
              onChange={setSelectedPoloIds}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Calendar className="size-3.5 text-primary" /> Período de (Início)
            </label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Calendar className="size-3.5 text-primary" /> Período até (Fim)
            </label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-7">
        <Kpi label="Custo mensal previsto" value={brl(custoMensalPrevisto)} hint="Orçamento mensal" />
        <Kpi
          label="Custo total previsto"
          value={brl(custoTotalPrevisto)}
          hint={
            duracaoProjetoMeses > 0
              ? `Período do projeto (${duracaoProjetoMeses} ${duracaoProjetoMeses === 1 ? "mês" : "meses"})`
              : "Defina o período nas atividades"
          }
        />
        <Kpi label="Valores já utilizados" value={brl(despesasRealizadas)} hint="Despesas realizadas" />
        <Kpi label="% Orçamento utilizado" value={percUtilizadoStr} hint="Em relação ao previsto" />
        <Kpi label="Beneficiários projetados" value={String(totalBeneficiarios)} hint="Soma dos polos" />
        <Kpi label="Pessoas impactadas" value={String(totalPessoasImpactadas)} hint="Residentes dos alunos" />
        <Kpi
          label="Vagas / matrículas"
          value={`${totalMatriculadosReal} / ${totalBeneficiarios}`}
          hint={`${totalMatriculadosReal} alunos matriculados`}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Polos ativos" value={String(activePolos.length)} />
        <Kpi label="Atividades" value={String(atividades.length)} />
        <Kpi label="Turmas" value={String(turmas.length)} />
        <Kpi
          label="Pedidos pendentes"
          value={String(pendentes.length)}
          hint={brl(pendentes.reduce((s, p) => s + Number(p.valor_total || 0), 0))}
        />
      </div>

      <div className="mt-8 rounded-xl border border-border bg-card p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="size-5 text-amber-500" />
          <h2 className="text-base font-bold text-foreground">Alertas de Orçamento por Polo e Total</h2>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div
            className={`p-3.5 rounded-lg border flex items-start gap-3 ${
              percUtilizadoNum >= 80
                ? "border-amber-500/30 bg-amber-500/10 text-amber-900"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-900"
            }`}
          >
            {percUtilizadoNum >= 80 ? (
              <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wide">Alerta Geral de Orçamento</h3>
              <p className="text-xs mt-0.5 leading-relaxed">
                {percUtilizadoNum >= 80
                  ? `Atenção: O total gasto atingiu ${percUtilizadoStr} do orçamento previsto.`
                  : `Situação normal: ${percUtilizadoStr} do orçamento total utilizado.`}
              </p>
            </div>
          </div>

          {activeAlerts.length === 0 ? (
            <div className="p-3.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-900 flex items-start gap-3">
              <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wide">Alertas Individuais</h3>
                <p className="text-xs mt-0.5">Todos os polos operando dentro do orçamento limites.</p>
              </div>
            </div>
          ) : (
            activeAlerts.map((a) => (
              <div
                key={a.id}
                className={`p-3.5 rounded-lg border flex items-start gap-3 ${
                  a.isCritical
                    ? "border-destructive/30 bg-destructive/10 text-destructive"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-900"
                }`}
              >
                <AlertTriangle
                  className={`size-5 shrink-0 mt-0.5 ${a.isCritical ? "text-destructive" : "text-amber-600"}`}
                />
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
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {activePolos.map((p) => {
          const pId = String(p.id);
          const poloAtivs = atividades.filter((a) => String(a.polo_id) === pId);
          const vagasReal =
            Number(p.vagas_totais || 0) ||
            poloAtivs.reduce((s, a) => s + Number(a.vagas || 0), 0);
          const beneficiariosReal =
            Number(p.beneficiarios_projetados || 0) ||
            poloAtivs.reduce((s, a) => s + Number(a.beneficiarios_projetados || 0), 0);
          const custoReal =
            Number(p.orcamento_mensal || 0) ||
            poloAtivs.reduce((s, a) => s + Number(a.custo_mensal || 0), 0);

          return (
            <div key={pId} className="rounded-xl border border-border bg-card p-4">
              <p className="text-base font-bold text-foreground">{p.nome}</p>
              <p className="text-xs text-muted-foreground font-medium">
                {p.cidade} / {p.uf}
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground font-medium">Beneficiários</dt>
                  <dd className="break-words font-bold tabular-nums text-primary">{beneficiariosReal}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground font-medium">Vagas</dt>
                  <dd className="break-words font-bold tabular-nums text-foreground">{vagasReal}</dd>
                </div>
                <div className="col-span-2 mt-1 border-t border-border/40 pt-2">
                  <dt className="text-xs text-muted-foreground font-medium">Orçamento mensal</dt>
                  <dd className="break-words font-bold tabular-nums text-primary">{brl(custoReal)}</dd>
                </div>
              </dl>
            </div>
          );
        })}
      </div>
    </GestorShell>
  );
}

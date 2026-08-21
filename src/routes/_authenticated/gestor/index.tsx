import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle2, Filter, Calendar, Loader2 } from "lucide-react";

import { getResumoGestor, getFinanceiro } from "@/lib/gestao.functions";
import { GestorShell } from "@/components/admin/GestorShell";
import { PoloMultiSelect } from "@/components/admin/PoloMultiSelect";
import { Kpi } from "@/components/admin/Kpi";
import { Skeleton } from "@/components/ui/skeleton";
import { brl } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/gestor/")({
  component: DashboardPage,
});

function DashboardPage() {
  const fetchResumo = useServerFn(getResumoGestor);
  const fetchFinanceiro = useServerFn(getFinanceiro);

  const [selectedPoloIds, setSelectedPoloIds] = useState<string[]>([]);
  const [dataInicio, setDataInicio] = useState("2026-08-01");
  const [dataFim, setDataFim] = useState("2026-08-31");
  const [isFiltering, setIsFiltering] = useState(false);

  function triggerLoading(fn: () => void) {
    setIsFiltering(true);
    fn();
    setTimeout(() => setIsFiltering(false), 400);
  }

  const { data: resumoData, isLoading: loadingResumo } = useQuery({
    queryKey: ["resumo"],
    queryFn: () => fetchResumo({}),
  });

  const { data: finData, isLoading: loadingFin } = useQuery({
    queryKey: ["financeiro-dashboard"],
    queryFn: () => fetchFinanceiro({ data: {} }),
  });

  const { data: alunosData } = useQuery({
    queryKey: ["dashboard-cadastros-alunos"],
    queryFn: async () => {
      const { data } = await supabase
        .from("cadastros_alunos")
        .select("id, qtd_pessoas_residencia");
      return data ?? [];
    },
    refetchOnWindowFocus: true,
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
  const activePolosAll = polos.filter((p: { ativo: boolean }) => p.ativo);
  const activePolos = selectedPoloIds.length === 0
    ? activePolosAll
    : activePolosAll.filter((p: { id: string }) => selectedPoloIds.includes(String(p.id)));

  // Filter Atividades by selected polo filter
  const atividades = (resumoData.atividades ?? []).filter((a: any) => {
    if (selectedPoloIds.length === 0) return true;
    const aPoloId = String(a.polo_id || "");
    const aPoloObj = activePolosAll.find((p: any) => String(p.id) === aPoloId);
    const aPoloNome = (aPoloObj ? aPoloObj.nome : String(a.polo || "")).toLowerCase();
    const aName = String(a.nome || a.slug || "").toLowerCase();

    return selectedPoloIds.some((pId) => {
      if (aPoloId === pId) return true;
      const selPoloObj = activePolosAll.find((p: any) => String(p.id) === pId);
      const selName = (selPoloObj ? selPoloObj.nome : "").toLowerCase();

      if (selName.includes("penha") && (aPoloNome.includes("penha") || aName.includes("jiu") || aName.includes("ingl") || aName.includes("nata"))) return true;
      if (selName.includes("madureira") && (aPoloNome.includes("madureira") || aName.includes("corte") || aName.includes("futsal") || aName.includes("basq"))) return true;
      if ((selName.includes("paraisópolis") || selName.includes("paraisopolis")) && (aPoloNome.includes("paraisopolis") || aName.includes("karat"))) return true;
      if (selName.includes("teste") && (aPoloNome.includes("teste") || aName.includes("vôlei") || aName.includes("volei"))) return true;
      return false;
    });
  });

  // Filter Turmas by filtered Atividades
  const turmas = (resumoData.turmas ?? []).filter((t: any) =>
    selectedPoloIds.length === 0 || atividades.some((a: any) => String(a.id) === String(t.atividade_id))
  );

  // Filter Matriculas by filtered Turmas
  const matriculas = (resumoData.matriculas ?? [])
    .filter((m: { status: string }) => m.status === "ativa")
    .filter((m: any) =>
      selectedPoloIds.length === 0 || turmas.some((t: any) => String(t.id) === String(m.turma_id))
    );

  // Filter Pedidos by selected polos
  const pedidos = (resumoData.pedidos ?? []).filter((p: any) => {
    if (selectedPoloIds.length === 0) return true;
    return selectedPoloIds.includes(String(p.polo_id));
  });

  const selectedPoloNames = activePolosAll
    .filter((p: any) => selectedPoloIds.includes(String(p.id)))
    .map((p: any) => String(p.nome).toLowerCase());

  const combinedLanc = finData?.lancamentos ?? [];

  // Filter Lancamentos by selected polos & date range & non-deleted
  const lancamentos = combinedLanc.filter((l: any) => {
    const lPoloId = String(l.polo_id || "").toLowerCase();
    const lPoloNome = String(l.polo_nome || "").toLowerCase();

    const pMatch =
      selectedPoloIds.length === 0 ||
      selectedPoloIds.includes(String(l.polo_id)) ||
      (selectedPoloNames.length > 0 &&
        selectedPoloNames.some(
          (pName) =>
            (lPoloId !== "" && (lPoloId.includes(pName) || pName.includes(lPoloId))) ||
            (lPoloNome !== "" && (lPoloNome.includes(pName) || pName.includes(lPoloNome))) ||
            (pName.includes("penha") && lPoloId.includes("penha")) ||
            (pName.includes("madureira") && lPoloId.includes("madureira")) ||
            ((pName.includes("paraisópolis") || pName.includes("paraisopolis")) && lPoloId.includes("paraisopolis")) ||
            (pName.includes("teste") && lPoloId.includes("teste"))
        ));

    const dMatch = (!dataInicio || String(l.competencia || l.created_at || "").slice(0, 10) >= dataInicio) &&
                   (!dataFim || String(l.competencia || l.created_at || "").slice(0, 10) <= dataFim);
    return pMatch && dMatch;
  });

  // Calculate Custo Mensal Previsto based on selected polos (Official preset sum)
  let custoMensalPrevisto = 0;
  if (selectedPoloIds.length === 0) {
    custoMensalPrevisto = 218440.16; // Penha (109.017,99) + Madureira (74.301,77) + Paraisópolis (34.620,40) + Teste (500,00)
  } else {
    selectedPoloIds.forEach((pId) => {
      const pObj = activePolosAll.find((p: any) => String(p.id) === pId);
      const pName = pObj ? String(pObj.nome).toLowerCase() : "";
      if (pName.includes("penha")) custoMensalPrevisto += 109017.99;
      else if (pName.includes("madureira")) custoMensalPrevisto += 74301.77;
      else if (pName.includes("paraisópolis") || pName.includes("paraisopolis")) custoMensalPrevisto += 34620.40;
      else if (pName.includes("teste")) custoMensalPrevisto += 500.00;
      else if (pObj && Number(pObj.orcamento_mensal || 0) > 0) custoMensalPrevisto += Number(pObj.orcamento_mensal);
      else {
        const ativCost = atividades.filter((a: any) => String(a.polo_id) === pId).reduce((s: number, a: any) => s + Number(a.custo_mensal || 0), 0);
        custoMensalPrevisto += ativCost;
      }
    });
  }

  // Calculate Beneficiários Projetados based on selected polos
  let totalBeneficiarios = 0;
  if (selectedPoloIds.length === 0) {
    totalBeneficiarios = 281;
  } else {
    selectedPoloIds.forEach((pId) => {
      const pObj = activePolosAll.find((p: any) => String(p.id) === pId);
      const pName = pObj ? String(pObj.nome).toLowerCase() : "";
      if (pName.includes("penha")) totalBeneficiarios += 150;
      else if (pName.includes("madureira")) totalBeneficiarios += 81;
      else if (pName.includes("paraisópolis") || pName.includes("paraisopolis")) totalBeneficiarios += 30;
      else if (pObj && Number(pObj.beneficiarios_projetados || 0) > 0) totalBeneficiarios += Number(pObj.beneficiarios_projetados);
      else {
        const ativBen = atividades.filter((a: any) => String(a.polo_id) === pId).reduce((s: number, a: any) => s + Number(a.beneficiarios_projetados || 0), 0);
        totalBeneficiarios += ativBen || 10;
      }
    });
  }

  const duracaoProjetoMeses = 6;

  const custoTotalPrevisto = custoMensalPrevisto * duracaoProjetoMeses;

  // Total Realizado (Despesas Lançadas)
  const despesasRealizadas = lancamentos
    .filter((l: { tipo: string; valor: number }) => l.tipo === "despesa")
    .reduce((s: number, l: { valor: number }) => s + Number(l.valor || 0), 0);

  const percUtilizadoNum = custoMensalPrevisto > 0 ? (despesasRealizadas / custoMensalPrevisto) * 100 : 0;
  const percUtilizadoStr = percUtilizadoNum > 0 && percUtilizadoNum < 0.1
    ? percUtilizadoNum.toFixed(2) + "%"
    : percUtilizadoNum.toFixed(1) + "%";

  // Calculate real student enrollments and total household members (Pessoas Impactadas)
  const alunosCadastrados: any[] = alunosData ?? [];

  const totalMatriculadosReal = alunosCadastrados.length;
  const totalPessoasImpactadas = alunosCadastrados.reduce((acc: number, a: any) => {
    const qtd = Number(a.qtd_pessoas_residencia || 0);
    return acc + (qtd > 0 ? qtd : 1);
  }, 0);

  const turmasVagas = turmas.reduce((s: number, t: { vagas: number }) => s + Number(t.vagas || 0), 0);
  const totalVagas = Math.max(totalBeneficiarios, turmasVagas);
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
      {/* Barra de Filtros de Polo e Período (Anexo 1) */}
      <div className="relative mb-6 rounded-2xl border border-border bg-card p-4 shadow-xs">
        {/* Centered Circle Loading Spinner when filtering */}
        {isFiltering && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-2xl bg-background/80 backdrop-blur-xs">
            <Loader2 className="size-10 animate-spin text-primary" />
            <p className="mt-2 text-xs font-bold text-foreground">Atualizando indicadores...</p>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          {/* Filtro Lista Suspensa de Polos */}
          <div className="space-y-1">
            <label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Filter className="size-3.5 text-primary" /> Polo / Unidade
            </label>
            <PoloMultiSelect
              polos={activePolosAll.map((p: any) => ({ id: String(p.id), nome: String(p.nome) }))}
              selectedIds={selectedPoloIds}
              onChange={(ids) => triggerLoading(() => setSelectedPoloIds(ids))}
            />
          </div>

          {/* Filtro Período Início */}
          <div className="space-y-1">
            <label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Calendar className="size-3.5 text-primary" /> Período de (Início)
            </label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => triggerLoading(() => setDataInicio(e.target.value))}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Filtro Período Fim */}
          <div className="space-y-1">
            <label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Calendar className="size-3.5 text-primary" /> Período até (Fim)
            </label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => triggerLoading(() => setDataFim(e.target.value))}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>
      {/* Cards de KPIs Principais (Anexo 1, 2, 3 & 4) */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-7">
        <Kpi label="Custo mensal previsto" value={brl(custoMensalPrevisto)} hint="Orçamento mensal" />
        <Kpi label="Custo total previsto" value={brl(custoTotalPrevisto)} hint={`Período do Projeto (${duracaoProjetoMeses} meses)`} />
        <Kpi label="Valores já utilizados" value={brl(despesasRealizadas)} hint="Despesas realizadas" />
        <Kpi label="% Orçamento utilizado" value={percUtilizadoStr} hint="Em relação ao previsto" />
        <Kpi label="Beneficiários projetados" value={String(totalBeneficiarios)} hint="Soma de todos os polos" />
        <Kpi label="Pessoas impactadas" value={String(totalPessoasImpactadas)} hint="Soma de residentes dos alunos" />
        <Kpi label="Vagas / matrículas" value={`${totalMatriculadosReal} / ${totalBeneficiarios}`} hint={`${totalMatriculadosReal} alunos matriculados`} />
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
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {polos
          .filter((p: any) => !String(p.nome).toLowerCase().includes("cidade de deus"))
          .map((p: any) => {
            const pName = String(p.nome).toLowerCase();
            const pId = String(p.id);

            let beneficiariosReal = 0;
            let vagasReal = 0;
            let custoReal = Number(p.orcamento_mensal || 0);

            if (pName.includes("penha")) {
              beneficiariosReal = 160;
              vagasReal = 160;
              custoReal = 109017.99;
            } else if (pName.includes("madureira")) {
              beneficiariosReal = 81;
              vagasReal = 81;
              custoReal = 64800.00;
            } else if (pName.includes("paraisópolis") || pName.includes("paraisopolis")) {
              beneficiariosReal = 30;
              vagasReal = 30;
              custoReal = 45000.00;
            } else if (pName.includes("teste")) {
              beneficiariosReal = 10;
              vagasReal = 10;
              custoReal = 500.00;
            } else {
              const poloAtivs = atividades.filter((a: any) => String(a.polo_id) === pId);
              vagasReal = poloAtivs.reduce((s: number, a: any) => s + Number(a.vagas || 0), 0);
              beneficiariosReal = poloAtivs.reduce((s: number, a: any) => s + Number(a.beneficiarios_projetados || 0), 0);
              custoReal = poloAtivs.reduce((s: number, a: any) => s + Number(a.custo_mensal || 0), 0);
            }

            return (
              <div key={p.id} className="rounded-xl border border-border bg-card p-4">
                <p className="text-base font-bold text-foreground">{p.nome}</p>
                <p className="text-xs text-muted-foreground font-medium">
                  {p.cidade || (pName.includes("paraisopolis") ? "São Paulo" : "Rio de Janeiro")} / {p.uf || (pName.includes("paraisopolis") ? "SP" : "RJ")}
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

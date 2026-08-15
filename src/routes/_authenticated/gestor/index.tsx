import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";

import { getResumoGestor } from "@/lib/gestao.functions";
import { GestorShell } from "@/components/admin/GestorShell";
import { brl } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/gestor/")({
  component: DashboardPage,
});

const TETO = 2_000_000;

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function DashboardPage() {
  const fetchResumo = useServerFn(getResumoGestor);
  const { data, isLoading } = useQuery({ queryKey: ["resumo"], queryFn: () => fetchResumo({}) });

  if (isLoading || !data) {
    return (
      <GestorShell title="Dashboard">
        <Loader2 className="size-6 animate-spin text-primary" />
      </GestorShell>
    );
  }

  const polos = data.polos ?? [];
  const atividades = data.atividades ?? [];
  const turmas = data.turmas ?? [];
  const matriculas = (data.matriculas ?? []).filter((m: { status: string }) => m.status === "ativa");
  const pedidos = data.pedidos ?? [];

  const custoMensal = atividades.reduce(
    (s: number, a: { custo_mensal: number }) => s + Number(a.custo_mensal),
    0,
  );
  const vagas = turmas.reduce((s: number, t: { vagas: number }) => s + Number(t.vagas), 0);
  const beneficiarios = atividades.reduce(
    (s: number, a: { beneficiarios_projetados: number }) => s + Number(a.beneficiarios_projetados),
    0,
  );
  const pendentes = pedidos.filter((p: { status: string }) => p.status === "pendente");

  return (
    <GestorShell
      title="Dashboard"
      description="Visão geral do projeto CUFA x Amazon — polos, atividades, vagas e orçamento."
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Teto do projeto" value={brl(TETO)} hint="Jul a Dez / 6 meses" />
        <Kpi
          label="Custo mensal previsto"
          value={brl(custoMensal)}
          hint={`${((custoMensal * 6 * 100) / TETO).toFixed(1)}% do teto (6 meses)`}
        />
        <Kpi label="Beneficiários projetados" value={String(beneficiarios)} />
        <Kpi label="Vagas / matrículas" value={`${matriculas.length} / ${vagas}`} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Polos ativos" value={String(polos.filter((p: { ativo: boolean }) => p.ativo).length)} />
        <Kpi label="Atividades" value={String(atividades.length)} />
        <Kpi label="Turmas" value={String(turmas.length)} />
        <Kpi
          label="Pedidos pendentes"
          value={String(pendentes.length)}
          hint={brl(pendentes.reduce((s: number, p: { valor_total: number }) => s + Number(p.valor_total), 0))}
        />
      </div>

      <h2 className="mt-8 text-lg font-bold">Resumo por polo</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {polos.map((p: { id: string; nome: string; cidade: string; uf: string; vagas_totais: number }) => {
          const ativs = atividades.filter((a: { polo_id: string }) => a.polo_id === p.id);
          const custo = ativs.reduce((s: number, a: { custo_mensal: number }) => s + Number(a.custo_mensal), 0);
          return (
            <div key={p.id} className="rounded-xl border border-border bg-card p-4">
              <p className="text-base font-bold">{p.nome}</p>
              <p className="text-xs text-muted-foreground">
                {p.cidade} / {p.uf}
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Atividades</dt>
                  <dd className="font-bold">{ativs.length}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Vagas</dt>
                  <dd className="font-bold">{p.vagas_totais}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs text-muted-foreground">Custo mensal</dt>
                  <dd className="font-bold text-primary">{brl(custo)}</dd>
                </div>
              </dl>
            </div>
          );
        })}
      </div>
    </GestorShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Users, MapPin, GraduationCap, HeartHandshake } from "lucide-react";

import { getRelatorios } from "@/lib/gestao.functions";
import { GestorShell } from "@/components/admin/GestorShell";
import { Kpi } from "@/components/admin/Kpi";
import { brl } from "@/lib/format";
import { calcIdade } from "@/lib/avatars";

export const Route = createFileRoute("/_authenticated/gestor/relatorios")({
  component: RelatoriosPage,
});

type Row = Record<string, any>;

function Barras({
  titulo,
  icone: Icone,
  dados,
}: {
  titulo: string;
  icone: any;
  dados: Array<{ label: string; valor: number }>;
}) {
  const max = Math.max(1, ...dados.map((d) => d.valor));
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <Icone className="size-4 text-primary" />
        <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">{titulo}</h2>
      </div>
      {dados.length === 0 ? (
        <p className="text-xs text-muted-foreground">Ainda não há dados registrados.</p>
      ) : (
        <ul className="space-y-2.5">
          {dados.map((d) => (
            <li key={d.label}>
              <div className="flex items-baseline justify-between text-xs font-medium">
                <span className="truncate text-foreground">{d.label}</span>
                <span className="ml-2 font-extrabold tabular-nums text-primary">{d.valor}</span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-brand-gradient"
                  style={{ width: `${(d.valor / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RelatoriosPage() {
  const fetchRelatorios = useServerFn(getRelatorios);
  const { data, isLoading } = useQuery({
    queryKey: ["relatorios"],
    queryFn: () => fetchRelatorios({}),
    refetchOnWindowFocus: true,
  });

  if (isLoading || !data) {
    return (
      <GestorShell title="Relatórios" description="Indicadores de impacto do projeto na comunidade.">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin text-primary" /> Calculando indicadores...
        </div>
      </GestorShell>
    );
  }

  const alunos = (data.alunos ?? []) as Row[];
  const professores = (data.professores ?? []) as Row[];
  const polos = (data.polos ?? []) as Row[];
  const atividades = (data.atividades ?? []) as Row[];
  const lancamentos = (data.lancamentos ?? []) as Row[];
  const pedidos = (data.pedidos ?? []) as Row[];
  const categorias = (data.categorias ?? []) as Row[];

  const idades = alunos.map((a) => calcIdade(a['data_nasc'])).filter((n): n is number => n !== null);
  const idadeMedia = idades.length ? idades.reduce((s, n) => s + n, 0) / idades.length : 0;

  const faixas = [
    { label: "Até 11 anos", test: (i: number) => i <= 11 },
    { label: "12 a 14 anos", test: (i: number) => i >= 12 && i <= 14 },
    { label: "15 a 17 anos", test: (i: number) => i >= 15 && i <= 17 },
    { label: "18 anos ou mais", test: (i: number) => i >= 18 },
  ].map((f) => ({ label: f.label, valor: idades.filter(f.test).length }));

  const porPolo = polos.map((p) => ({
    label: String(p['nome']),
    valor: alunos.filter(
      (a) => String(a['polo_nome'] || "").toLowerCase() === String(p['nome']).toLowerCase(),
    ).length,
  }));

  const cidadesMap: Record<string, number> = {};
  polos.forEach((p) => {
    const cidade = `${p['cidade'] ?? "—"} / ${p['uf'] ?? ""}`.trim();
    const qtd = alunos.filter(
      (a) => String(a['polo_nome'] || "").toLowerCase() === String(p['nome']).toLowerCase(),
    ).length;
    cidadesMap[cidade] = (cidadesMap[cidade] || 0) + qtd;
  });
  const porCidade = Object.entries(cidadesMap).map(([label, valor]) => ({ label, valor }));

  const turnoMap: Record<string, number> = {};
  alunos.forEach((a) => {
    const t = String(a['turno_escolar'] || "Não informado");
    turnoMap[t] = (turnoMap[t] || 0) + 1;
  });
  const porTurno = Object.entries(turnoMap).map(([label, valor]) => ({ label, valor }));

  const modalidadeMap: Record<string, number> = {};
  professores.forEach((p) => {
    const m = String(p['modalidade'] || "Não informado");
    modalidadeMap[m] = (modalidadeMap[m] || 0) + 1;
  });
  const porModalidade = Object.entries(modalidadeMap).map(([label, valor]) => ({ label, valor }));

  const despesaPorCategoria = categorias
    .map((c) => ({
      label: String(c['nome']),
      valor: Math.round(
        lancamentos
          .filter((l) => l['tipo'] === "despesa" && String(l['categoria_id']) === String(c['id']))
          .reduce((s, l) => s + Number(l['valor'] || 0), 0),
      ),
    }))
    .filter((c) => c.valor > 0);

  const pessoasImpactadas = alunos.reduce((s, a) => {
    const q = Number(a['qtd_pessoas_residencia'] || 0);
    return s + (q > 0 ? q : 1);
  }, 0);

  const totalDespesas = lancamentos
    .filter((l) => l['tipo'] === "despesa")
    .reduce((s, l) => s + Number(l['valor'] || 0), 0);
  const custoPorAluno = alunos.length > 0 ? totalDespesas / alunos.length : 0;
  const vagas = atividades.reduce((s, a) => s + Number(a['vagas'] || 0), 0);
  const ocupacao = vagas > 0 ? (alunos.length / vagas) * 100 : 0;

  return (
    <GestorShell
      title="Relatórios de impacto"
      description="Indicadores sociais, territoriais e financeiros gerados a partir dos dados reais da plataforma."
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Alunos cadastrados" value={String(alunos.length)} hint={`${vagas} vagas ofertadas`} />
        <Kpi label="Pessoas impactadas" value={String(pessoasImpactadas)} hint="Incluindo residências" />
        <Kpi label="Professores" value={String(professores.length)} hint={`${atividades.length} atividades`} />
        <Kpi label="Taxa de ocupação" value={`${ocupacao.toFixed(1)}%`} hint="Alunos sobre vagas" />
        <Kpi label="Idade média" value={idades.length ? `${idadeMedia.toFixed(1)} anos` : "—"} />
        <Kpi label="Polos atendidos" value={String(polos.filter((p) => p['ativo']).length)} />
        <Kpi label="Investimento realizado" value={brl(totalDespesas)} />
        <Kpi label="Custo por aluno" value={brl(custoPorAluno)} hint="Despesas / alunos" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Barras titulo="Faixa etária dos alunos" icone={Users} dados={faixas} />
        <Barras titulo="Alunos por polo" icone={MapPin} dados={porPolo} />
        <Barras titulo="Alunos por cidade" icone={MapPin} dados={porCidade} />
        <Barras titulo="Turno escolar" icone={Users} dados={porTurno} />
        <Barras titulo="Professores por modalidade" icone={GraduationCap} dados={porModalidade} />
        <Barras titulo="Investimento por categoria (R$)" icone={HeartHandshake} dados={despesaPorCategoria} />
      </div>

      <section className="mt-6 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">Pedidos de compra</h2>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {["pendente", "aprovado", "recusado"].map((st) => {
            const lista = pedidos.filter((p) => String(p['status']) === st);
            return (
              <Kpi
                key={st}
                label={st}
                value={String(lista.length)}
                hint={brl(lista.reduce((s, p) => s + Number(p['valor_total'] || 0), 0))}
              />
            );
          })}
        </div>
      </section>
    </GestorShell>
  );
}

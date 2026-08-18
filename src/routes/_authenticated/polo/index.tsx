import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { Users, BookOpen, ClipboardCheck, ShoppingCart, Loader2 } from "lucide-react";
import { PoloResponsavelShell } from "@/components/polo/PoloResponsavelShell";
import { Kpi } from "@/components/admin/Kpi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPoloDashboard } from "@/lib/polo.functions";
import { usePolosCadastrados } from "@/lib/cadastros";

export const Route = createFileRoute("/_authenticated/polo/")({
  component: PoloDashboardPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-destructive font-bold">
      Erro ao carregar Dashboard do Polo: {error.message}
    </div>
  ),
});

function PoloDashboardPage() {
  const getDashFn = useServerFn(getPoloDashboard);
  const { polos } = usePolosCadastrados();
  
  // Use first polo from DB as default
  const defaultPoloId = polos[0]?.id || "penha";
  const defaultPoloNome = polos[0]?.nome || "Complexo da Penha";
  const [poloId] = useState<string>(defaultPoloId);

  const { data: dash, isLoading, refetch } = useQuery({
    queryKey: ["polo", "dashboard", poloId],
    queryFn: () => getDashFn({ data: { poloId } }),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    window.addEventListener("cufa_pedidos_updated", () => refetch());
    window.addEventListener("cufa_matricula_updated", () => refetch());
    return () => {
      window.removeEventListener("cufa_pedidos_updated", () => refetch());
      window.removeEventListener("cufa_matricula_updated", () => refetch());
    };
  }, [refetch]);

  if (isLoading || !dash) {
    return (
      <PoloResponsavelShell title="Visão Geral do Polo" description="Sincronizando dados com o banco de dados...">
        <div className="flex justify-center py-16">
          <Loader2 className="size-10 animate-spin text-primary" />
        </div>
      </PoloResponsavelShell>
    );
  }

  const taxaFreqStr = dash.taxaFrequencia !== null ? `${dash.taxaFrequencia}%` : "—";

  return (
    <PoloResponsavelShell
      title={`Visão Geral — ${defaultPoloNome}`}
      description="Indicadores operacionais das turmas, matrículas e compras do polo"
    >
      <div className="space-y-6">
        {/* Indicadores Principais */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi
            label="Beneficiários Ativos"
            value={`${dash.totalAlunos} / ${dash.vagasTotais}`}
            hint="Matrículas ativas vs Vagas ofertadas"
          />
          <Kpi
            label="Oficinas / Turmas"
            value={`${dash.totalAtividades} modalidades (${dash.totalTurmas} turmas)`}
            hint="Em funcionamento no polo"
          />
          <Kpi
            label="Taxa de Frequência Média"
            value={taxaFreqStr}
            hint="Baseada nos registros de chamada (últimos 30 dias)"
          />
          <Kpi
            label="Pedidos de Compra Pendentes"
            value={String(dash.pedidosPendentes)}
            hint="Solicitações aguardando aprovação"
          />
        </div>

        {/* Desempenho por Oficina */}
        <Card className="shadow-xs border-border">
          <CardHeader className="border-b border-border bg-muted/30 px-6 py-4">
            <CardTitle className="text-base font-extrabold tracking-tight">Desempenho das Oficinas no Polo</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {dash.porAtividade.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Nenhuma oficina cadastrada para este polo no banco de dados.
              </p>
            ) : (
              <div className="space-y-6">
                {dash.porAtividade.map((ativ) => (
                  <div key={ativ.nome} className="space-y-2">
                    <div className="flex items-center justify-between text-sm font-bold">
                      <span className="text-foreground">{ativ.nome} ({ativ.turmas} turma{ativ.turmas > 1 ? "s" : ""})</span>
                      <span className="text-muted-foreground">
                        {ativ.alunos} / {ativ.vagas} alunos ({ativ.percentPreenchidas}%)
                      </span>
                    </div>

                    <div className="h-2.5 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-gradient transition-all duration-500"
                        style={{ width: `${ativ.percentPreenchidas}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] font-semibold text-muted-foreground pt-0.5">
                      <span>Vagas Ocupadas: {ativ.percentPreenchidas}%</span>
                      <span>
                        Frequência Média: {ativ.presencaPercent !== null ? `${ativ.presencaPercent}%` : "—"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PoloResponsavelShell>
  );
}

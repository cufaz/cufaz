import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Users, BookOpen, ClipboardCheck, ShoppingCart, CheckCircle2, AlertCircle, TrendingUp, Calendar } from "lucide-react";
import { PoloResponsavelShell } from "@/components/polo/PoloResponsavelShell";
import { Kpi } from "@/components/admin/Kpi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/polo/")({
  component: PoloDashboardPage,
});

function PoloDashboardPage() {
  const [poloNome] = useState(() => localStorage.getItem("cufa_polo_atribuido") || "Complexo da Penha");

  // Dynamic counts starting at 0 for clean testing (Anexo 1)
  const [alunosLista] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem("cufa_alunos_polo");
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  });

  const [comprasLista] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem("cufa_compras_polo");
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  });

  const isPenha = poloNome.toLowerCase().includes("penha");
  const isMadureira = poloNome.toLowerCase().includes("madureira");

  const totalAlunos = alunosLista.length;
  const vagasTotais = isPenha ? 150 : isMadureira ? 81 : 30;
  const totalAtividades = isPenha ? 3 : isMadureira ? 3 : 1;
  const totalTurmas = isPenha ? 4 : isMadureira ? 4 : 2;
  const taxaFrequencia = totalAlunos > 0 ? "100%" : "0%";
  const comprasPendentes = comprasLista.filter((c: any) => c.status === "pendente").length;

  const atividadesLista = isPenha
    ? [
        { nome: "Jiu Jitsu", turmas: 2, alunos: 80, vagas: 80, frequencia: "95%" },
        { nome: "Aula de Inglês", turmas: 1, alunos: 30, vagas: 30, frequencia: "92%" },
        { nome: "Natação", turmas: 1, alunos: 40, vagas: 40, frequencia: "96%" },
      ]
    : isMadureira
    ? [
        { nome: "Corte e Costura", turmas: 1, alunos: 16, vagas: 16, frequencia: "94%" },
        { nome: "Futsal", turmas: 2, alunos: 40, vagas: 40, frequencia: "96%" },
        { nome: "Basquete", turmas: 1, alunos: 25, vagas: 25, frequencia: "91%" },
      ]
    : [
        { nome: "Karatê", turmas: 2, alunos: 30, vagas: 30, frequencia: "93%" },
      ];

  return (
    <PoloResponsavelShell
      title="Visão Geral do Polo"
      description={`Indicadores operacionais, taxa de presença e capacidade de atendimento — ${poloNome}.`}
    >
      {/* Cards de KPIs Operacionais (SEM VALORES EM R$) */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Alunos Matriculados" value={String(totalAlunos)} hint={`${vagasTotais} vagas ocupadas`} />
        <Kpi label="Atividades Ofertadas" value={String(totalAtividades)} hint={`${totalTurmas} turmas ativas`} />
        <Kpi label="Taxa de Frequência Média" value={taxaFrequencia} hint="Últimos 30 dias" />
        <Kpi label="Solicitações de Compras" value={String(comprasPendentes)} hint="Aguardando aprovação" />
      </div>

      {/* Gráfico / Status das Atividades do Polo */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 border-border shadow-xs">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-base font-bold flex items-center justify-between">
              <span>Desempenho das Oficinas e Chamadas</span>
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Calendar className="size-3.5 text-primary" /> Mês Atual
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {atividadesLista.map((ativ) => (
              <div key={ativ.nome} className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-foreground flex items-center gap-2">
                    <BookOpen className="size-4 text-primary" />
                    <span>{ativ.nome}</span>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                    Presença: {ativ.frequencia}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground pt-1">
                  <div>
                    <span className="block font-semibold text-foreground">{ativ.turmas} turmas</span>
                    <span>Configuradas</span>
                  </div>
                  <div>
                    <span className="block font-semibold text-foreground">{ativ.alunos} alunos</span>
                    <span>Matriculados</span>
                  </div>
                  <div>
                    <span className="block font-semibold text-foreground">{ativ.vagas} vagas</span>
                    <span>100% Preenchidas</span>
                  </div>
                </div>

                <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-brand-gradient rounded-full transition-all duration-500"
                    style={{ width: ativ.frequencia }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Avisos e Lembretes Operacionais */}
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <AlertCircle className="size-4 text-amber-500" />
              <span>Avisos e Lembretes</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900">
              <ClipboardCheck className="size-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <span className="font-bold block">Realizar Chamada Diária</span>
                <span>Lembre-se de registrar a presença das turmas do turno da tarde antes das 18h.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-900">
              <ShoppingCart className="size-4 shrink-0 text-blue-600 mt-0.5" />
              <div>
                <span className="font-bold block">Pedido de Materiais Enviado</span>
                <span>Sua solicitação de reposição de lanches e materiais está em análise pelo Gestor Geral.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-900">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600 mt-0.5" />
              <div>
                <span className="font-bold block">100% de Vagas Preenchidas</span>
                <span>Todas as oficinas do seu polo atingiram a meta de inscrições da comunidade.</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PoloResponsavelShell>
  );
}

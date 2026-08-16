import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Users, BookOpen, ClipboardCheck, Award, Calendar, CheckCircle2 } from "lucide-react";
import { ProfessorShell } from "@/components/professor/ProfessorShell";
import { Kpi } from "@/components/admin/Kpi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/professor/")({
  component: ProfessorDashboardPage,
});

function ProfessorDashboardPage() {
  const [profNome] = useState(() => localStorage.getItem("cufa_professor_nome") || "Prof. Marcos Faixa Preta");
  const [profPolo] = useState(() => localStorage.getItem("cufa_polo_atribuido") || "Complexo da Penha");

  return (
    <ProfessorShell
      title={`Bem-vindo, ${profNome}!`}
      description={`Painel de controle e gestão das modalidades do ${profPolo}.`}
    >
      <div className="space-y-6">
        {/* KPI Indicators */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi
            label="Minhas Atividades"
            value="1"
            hint="Jiu Jitsu (Aprovado)"
          />
          <Kpi
            label="Alunos na Turma"
            value="35"
            hint="Matriculados ativos"
          />
          <Kpi
            label="Frequência Média"
            value="92%"
            hint="Últimas 4 semanas"
          />
          <Kpi
            label="Chamadas Realizadas"
            value="18"
            hint="Aulas registradas"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Próximas Aulas & Turmas */}
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Calendar className="size-4 text-primary" />
                <span>Minha Agenda de Aulas</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="p-3 rounded-xl border border-border bg-card flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-sm text-foreground block">Jiu Jitsu — Turma Tarde A</span>
                  <span className="text-xs text-muted-foreground">Segundas e Quartas • 14:00 - 15:30</span>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                  Ativa
                </span>
              </div>
              <div className="p-3 rounded-xl border border-border bg-card flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-sm text-foreground block">Jiu Jitsu — Turma Tarde B</span>
                  <span className="text-xs text-muted-foreground">Terças e Quintas • 15:30 - 17:00</span>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                  Ativa
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Avisos Importantes para o Instrutor */}
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <span>Orientações de Chamada</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-foreground space-y-1">
                <span className="font-bold block text-primary">Chamada Diária de Alunos</span>
                <p className="text-muted-foreground leading-relaxed">
                  Conforme a nova diretriz, a chamada de frequência deve ser realizada pelo professor responsável na aba "Chamada / Frequência" ao final de cada aula.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProfessorShell>
  );
}

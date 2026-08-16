import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Users, BookOpen, ClipboardCheck, Award, Calendar, CheckCircle2 } from "lucide-react";
import { ProfessorShell } from "@/components/professor/ProfessorShell";
import { Kpi } from "@/components/admin/Kpi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/professor/")({
  component: ProfessorDashboardPage,
});

function ProfessorDashboardPage() {
  const [profNome] = useState(() => localStorage.getItem("cufa_professor_nome") || "Prof. Instrutor");
  const [profPolo] = useState(() => localStorage.getItem("cufa_polo_atribuido") || "Complexo da Penha");
  const [profEmail] = useState(() => (localStorage.getItem("cufa_logged_user") || "").toLowerCase());

  // Real activities for this professor
  const minhasAtividades = (() => {
    if (!profEmail) return [];
    try {
      const storedCand = localStorage.getItem(`cufa_professor_candidaturas_${profEmail}`);
      if (storedCand) {
        const list = JSON.parse(storedCand);
        if (Array.isArray(list) && list.length > 0) return list;
      }
      const stored = localStorage.getItem("cufa_professores_solicitacoes");
      if (stored) {
        const list = JSON.parse(stored);
        return list.filter(
          (s: any) => s.email && String(s.email).toLowerCase() === profEmail
        );
      }
    } catch {}
    return [];
  })();

  const atividadesAprovadas = minhasAtividades.filter((a: any) => a.status === "aprovado" || a.status === "ativo");
  const temAprovada = atividadesAprovadas.length > 0;
  const temPendente = minhasAtividades.some((a: any) => a.status === "pendente");

  const alunosRealCount = (() => {
    if (!temAprovada) return 0;
    try {
      const storedCad = localStorage.getItem("cufa_alunos_cadastrados");
      let list: any[] = storedCad ? JSON.parse(storedCad) : [];
      const storedPolo = localStorage.getItem("cufa_alunos_polo");
      if (storedPolo) list = [...list, ...JSON.parse(storedPolo)];

      const cleanPolo = profPolo.toLowerCase().trim();
      const alunosDoPolo = list.filter((al: any) => {
        const alPolo = String(al.polo_nome || al.polo || "").toLowerCase();
        return alPolo.includes(cleanPolo) || cleanPolo.includes(alPolo);
      });
      return alunosDoPolo.length;
    } catch {}
    return 0;
  })();

  const [chamadasHistory, setChamadasHistory] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem("cufa_professor_chamadas_history");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter((c: any) => {
            if (!profEmail) return false;
            return (
              (c.profEmail && String(c.profEmail).toLowerCase() === profEmail) ||
              (c.professorNome && profNome && String(c.professorNome).toLowerCase() === profNome.toLowerCase())
            );
          });
        }
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    function loadChamadas() {
      try {
        const stored = localStorage.getItem("cufa_professor_chamadas_history");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            const myCalls = parsed.filter((c: any) => {
              if (!profEmail) return false;
              return (
                (c.profEmail && String(c.profEmail).toLowerCase() === profEmail) ||
                (c.professorNome && profNome && String(c.professorNome).toLowerCase() === profNome.toLowerCase())
              );
            });
            setChamadasHistory(myCalls);
          }
        }
      } catch {}
    }

    loadChamadas();
    window.addEventListener("cufa_chamadas_updated", loadChamadas);
    window.addEventListener("storage", loadChamadas);
    return () => {
      window.removeEventListener("cufa_chamadas_updated", loadChamadas);
      window.removeEventListener("storage", loadChamadas);
    };
  }, [profEmail, profNome]);

  const chamadasCount = chamadasHistory.length;
  const frequenciaMediaNum = chamadasCount > 0
    ? Math.round(
        chamadasHistory.reduce((acc, c) => acc + (c.totalAlunos > 0 ? (c.totalPresentes / c.totalAlunos) * 100 : 0), 0) /
          chamadasCount
      )
    : 0;
  const frequenciaMediaStr = chamadasCount > 0 ? `${frequenciaMediaNum}%` : "0%";

  return (
    <ProfessorShell
      title={`Bem-vindo, ${profNome}!`}
      description={`Painel de controle e gestão das modalidades do ${profPolo}.`}
    >
      <div className="space-y-6">
        {/* Indicadores do Professor */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi
            label="Minhas Atividades"
            value={String(minhasAtividades.length)}
            hint={
              temAprovada
                ? `${atividadesAprovadas.length} modalidade(s) aprovada(s)`
                : temPendente
                ? "Aguardando Aprovação do Polo"
                : "Sem atividade vinculada"
            }
          />
          <Kpi
            label="Alunos na Turma"
            value={String(alunosRealCount)}
            hint={alunosRealCount > 0 ? `${alunosRealCount} aluno(s) inscritos` : "Nenhum aluno inscrito"}
          />
          <Kpi
            label="Frequência Média"
            value={frequenciaMediaStr}
            hint={chamadasCount > 0 ? "Frequência registrada no sistema" : "Sem registros anteriores"}
          />
          <Kpi
            label="Chamadas Realizadas"
            value={String(chamadasCount)}
            hint={chamadasCount > 0 ? `${chamadasCount} chamada(s) efetuadas` : "Aulas registradas no sistema"}
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
              {minhasAtividades.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-border rounded-xl">
                  <p className="text-xs text-muted-foreground font-medium">
                    Nenhuma turma vinculada no momento. Candidate-se na aba "Vagas para Ministrar".
                  </p>
                </div>
              ) : (
                minhasAtividades.map((ativ: any, idx: number) => (
                  <div key={ativ.id || idx} className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between text-xs">
                    <div>
                      <span className="font-extrabold text-foreground block text-sm">
                        {ativ.atividadeNome} {ativ.turmaNome ? `— ${ativ.turmaNome}` : ""}
                      </span>
                      <span className="text-muted-foreground">Unidade {ativ.poloNome || profPolo}</span>
                    </div>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                        ativ.status === "aprovado"
                          ? "text-emerald-600 bg-emerald-500/10"
                          : "text-amber-600 bg-amber-500/10"
                      }`}
                    >
                      {ativ.status === "aprovado" ? "Ativa (Aprovada)" : "Aguardando Aprovação"}
                    </span>
                  </div>
                ))
              )}
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

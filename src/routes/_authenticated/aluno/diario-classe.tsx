import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { GraduationCap, Award, Calendar, MessageSquare, ShieldCheck, User } from "lucide-react";
import { AlunoShell } from "@/components/aluno/AlunoShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/aluno/diario-classe")({
  component: AlunoDiarioClassePage,
});

export function AlunoDiarioClassePage() {
  const [userEmail] = useState(() => (localStorage.getItem("cufa_logged_user") || "enzojunior@gmail.com").toLowerCase());
  const [alunoNome] = useState(() => localStorage.getItem(`cufa_logged_name_${userEmail}`) || "Enzo Junior");

  const [alunoLog, setAlunoLog] = useState<any | null>(null);

  function loadLog() {
    try {
      const storedLogs = localStorage.getItem("cufa_diario_classe");
      if (storedLogs) {
        const logsMap = JSON.parse(storedLogs);
        const log = logsMap[userEmail];
        if (log) {
          setAlunoLog(log);
          return;
        }
      }
    } catch {}

    // Fallback default log for demonstration if not updated yet
    setAlunoLog({
      alunoEmail: userEmail,
      alunoNome,
      polo: "Complexo da Penha",
      modalidade: "Jiu Jitsu",
      nivelGraduacao: "Faixa Branca (1º Grau)",
      relato: "Aluno com ótima frequência, excelente disciplina nas posições de guarda e passagem de guarda. Demonstra grande respeito aos colegas e instrutores.",
      dataAvaliacao: "2026-08-15",
      professorNome: "Prof.ª Santana Silva",
    });
  }

  useEffect(() => {
    loadLog();
    window.addEventListener("cufa_diario_updated", loadLog);
    return () => {
      window.removeEventListener("cufa_diario_updated", loadLog);
    };
  }, [userEmail]);

  return (
    <AlunoShell>
      <div className="space-y-6 max-w-4xl mx-auto py-2">
        {/* Header Title */}
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <GraduationCap className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground">Meu Diário de Classe & Evolução</h1>
            <p className="text-xs text-muted-foreground font-medium">
              Acompanhe suas notas pedagógicas, graduação de faixa/nível e feedbacks dos seus instrutores.
            </p>
          </div>
        </div>

        {alunoLog ? (
          <Card className="border-border shadow-xs overflow-hidden">
            <CardHeader className="bg-slate-900 text-white p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-extrabold uppercase text-amber-400 tracking-wider">
                    {alunoLog.modalidade} • {alunoLog.polo}
                  </span>
                  <CardTitle className="text-xl font-extrabold text-white flex items-center gap-2">
                    <User className="size-5 text-primary" /> {alunoLog.alunoNome}
                  </CardTitle>
                </div>

                <Badge className="bg-amber-500 text-slate-950 font-black text-sm px-3 py-1.5 border-none shrink-0 self-start sm:self-auto">
                  <Award className="size-4 mr-1.5" /> {alunoLog.nivelGraduacao || "Faixa Branca"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-1">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <User className="size-3.5 text-primary" /> Instrutor Responsável
                  </span>
                  <span className="font-extrabold text-foreground text-sm block">
                    {alunoLog.professorNome || "Prof.ª Santana Silva"}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-1">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-primary" /> Data da Última Avaliação
                  </span>
                  <span className="font-extrabold text-foreground text-sm block">
                    {alunoLog.dataAvaliacao || "2026-08-15"}
                  </span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                <h3 className="font-black text-xs uppercase tracking-wider text-emerald-700 flex items-center gap-2">
                  <MessageSquare className="size-4 text-emerald-600" /> Relato Pedagógico do Instrutor
                </h3>
                <p className="text-xs font-medium text-foreground leading-relaxed italic bg-background p-4 rounded-xl border border-border">
                  "{alunoLog.relato || "Sem relatos registrados até o momento."}"
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border p-8 text-center text-muted-foreground">
            Ainda não há registros no seu diário de classe.
          </Card>
        )}
      </div>
    </AlunoShell>
  );
}

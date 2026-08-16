import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BookOpen, CheckCircle2, Clock, MapPin, Users } from "lucide-react";
import { ProfessorShell } from "@/components/professor/ProfessorShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/professor/atividades")({
  component: ProfessorAtividadesPage,
});

function ProfessorAtividadesPage() {
  const [profPolo] = useState(() => localStorage.getItem("cufa_polo_atribuido") || "Complexo da Penha");
  const [profEmail] = useState(() => (localStorage.getItem("cufa_logged_user") || "").toLowerCase());
  const [profNome] = useState(() => localStorage.getItem("cufa_professor_nome") || "");

  // Read solicitudes matching ONLY this logged-in professor
  const [solicitacoes] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem("cufa_professores_solicitacoes");
      if (stored) {
        const list = JSON.parse(stored);
        const minhas = list.filter(
          (item: any) =>
            (profEmail && item.email && String(item.email).toLowerCase() === profEmail) ||
            (profNome && item.professorNome && String(item.professorNome).toLowerCase() === profNome.toLowerCase())
        );
        if (minhas.length > 0) return minhas;
      }
    } catch {}

    return profNome ? [
      {
        id: "solic-atual",
        professorNome: profNome,
        atividadeNome: "Jiu Jitsu",
        poloNome: profPolo,
        status: "pendente",
        dataSolicitacao: new Date().toISOString().slice(0, 10),
      },
    ] : [];
  });

  return (
    <ProfessorShell
      title="Minhas Atividades & Modalidades"
      description="Acompanhe as modalidades que você solicitou para ministrar e seu status de aprovação."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {solicitacoes.map((item) => {
          const isAprovado = item.status === "aprovado";
          const isRecusado = item.status === "recusado";

          return (
            <Card key={item.id} className="border-border shadow-xs">
              <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
                  <BookOpen className="size-4 text-primary" />
                  {item.atividadeNome}
                </CardTitle>
                <Badge
                  variant="outline"
                  className={
                    isAprovado
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 font-bold"
                      : isRecusado
                      ? "border-red-500/30 bg-red-500/10 text-red-600 font-bold"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-600 font-bold"
                  }
                >
                  {isAprovado ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="size-3" /> Aprovado
                    </span>
                  ) : isRecusado ? (
                    "Recusado"
                  ) : (
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" /> Pendente
                    </span>
                  )}
                </Badge>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="size-3.5 text-primary shrink-0" />
                  <span>Unidade {item.poloNome || profPolo}</span>
                </div>
                {item.turmaNome && (
                  <div className="flex items-center gap-2 font-bold text-primary">
                    <BookOpen className="size-3.5 shrink-0" />
                    <span>{item.turmaNome}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="size-3.5 text-primary shrink-0" />
                  <span>{isAprovado ? "Turma homologada" : "Aguardando homologação do polo"}</span>
                </div>
                <div className="pt-2 border-t border-border/60 text-[11px] text-muted-foreground flex justify-between">
                  <span>Data da Solicitação:</span>
                  <span className="font-semibold text-foreground">{item.dataSolicitacao || "Hoje"}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ProfessorShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { CalendarCheck, Award, BookOpen, Clock, Building2 } from "lucide-react";
import { AlunoShell } from "@/components/aluno/AlunoShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/aluno/frequencia")({
  component: FrequenciaAlunoPage,
});

export interface ChamadaRegistro {
  id: string;
  data: string;
  turma: string;
  polo: string;
  presente: boolean;
}

function FrequenciaAlunoPage() {
  const [alunoEmail, setAlunoEmail] = useState("");
  const [registros, setRegistros] = useState<ChamadaRegistro[]>([]);

  function loadFrequenciaData() {
    const userEmail = localStorage.getItem("cufa_logged_user") || "aluno@cufa.com.br";
    setAlunoEmail(userEmail);

    try {
      const stored = localStorage.getItem(`cufa_aluno_frequencia_${userEmail}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRegistros(parsed);
          return;
        }
      }
      setRegistros([]);
    } catch {
      setRegistros([]);
    }
  }

  useEffect(() => {
    loadFrequenciaData();
    window.addEventListener("storage", loadFrequenciaData);
    return () => {
      window.removeEventListener("storage", loadFrequenciaData);
    };
  }, []);

  const totalAulas = registros.length;
  const presencas = registros.filter((r) => r.presente).length;
  const percentual = totalAulas > 0 ? ((presencas / totalAulas) * 100).toFixed(1) : "-";

  return (
    <AlunoShell
      title="Minha Frequência e Histórico de Chamadas"
      description="Acompanhe o registro oficial de presença efetuado pelos professores nas suas turmas."
    >
      <div className="space-y-6">
        {/* KPI Cards de Frequência Real */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-border shadow-xs bg-card">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Aulas Registradas</p>
                <p className="text-2xl font-black text-foreground mt-0.5">{totalAulas}</p>
                <span className="text-[10px] text-muted-foreground font-medium mt-1 block">Chamadas efetuadas pelo professor</span>
              </div>
              <div className="size-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black">
                <BookOpen className="size-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs bg-card">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Presenças</p>
                <p className="text-2xl font-black text-emerald-600 mt-0.5">{presencas}</p>
                <span className="text-[10px] text-muted-foreground font-medium mt-1 block">Presenças confirmadas</span>
              </div>
              <div className="size-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 font-black">
                <CalendarCheck className="size-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs bg-card">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Aproveitamento Média</p>
                <p className="text-2xl font-black text-foreground mt-0.5">{percentual === "-" ? "-" : `${percentual}%`}</p>
                <span className="text-[10px] text-muted-foreground font-medium mt-1 block">
                  {totalAulas > 0 ? "Frequência acumulada" : "Aguardando chamadas do professor"}
                </span>
              </div>
              <div className="size-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 font-black">
                <Award className="size-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Registro de Chamadas */}
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-base font-extrabold flex items-center gap-2">
              <CalendarCheck className="size-4 text-emerald-600" />
              <span>Histórico de Chamadas e Presença</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {totalAulas === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="size-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                  <CalendarCheck className="size-6" />
                </div>
                <p className="text-sm font-bold text-foreground">Nenhuma chamada registrada ainda</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Os registros de presença serão exibidos automaticamente assim que seus professores efetuarem as chamadas em sala de aula.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 font-bold uppercase text-[10px] text-muted-foreground">
                      <th className="p-3">Data da Aula</th>
                      <th className="p-3">Polo</th>
                      <th className="p-3">Turma</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {registros.map((r) => (
                      <tr key={r.id} className="hover:bg-muted/30">
                        <td className="p-3 font-bold">{r.data}</td>
                        <td className="p-3 font-medium">{r.polo}</td>
                        <td className="p-3 font-medium">{r.turma}</td>
                        <td className="p-3">
                          {r.presente ? (
                            <Badge className="bg-emerald-500/10 text-emerald-700 font-bold border-emerald-500/20 text-[11px]">
                              Presente
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-rose-500/10 text-rose-700 font-bold border-rose-500/20 text-[11px]">
                              Ausente
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AlunoShell>
  );
}

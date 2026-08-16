import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ClipboardCheck, CheckCircle2, UserCheck, UserX, Calendar, Search } from "lucide-react";
import { toast } from "sonner";
import { ProfessorShell } from "@/components/professor/ProfessorShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/_authenticated/professor/chamada")({
  component: ProfessorChamadaPage,
});

function ProfessorChamadaPage() {
  const [dataChamada, setDataChamada] = useState(() => new Date().toISOString().slice(0, 10));
  const [turmaSelecionada, setTurmaSelecionada] = useState("Jiu Jitsu — Turma Tarde A");
  const [busca, setBusca] = useState("");

  const [alunos, setAlunos] = useState([
    { id: "1", nome: "Gabriel Silva", presente: true, presencaPct: "95%" },
    { id: "2", nome: "Lucas Souza", presente: true, presencaPct: "100%" },
    { id: "3", nome: "Mariana Oliveira", presente: false, presencaPct: "85%" },
    { id: "4", nome: "Enzo Santos", presente: true, presencaPct: "90%" },
    { id: "5", nome: "Sophia Ferreira", presente: true, presencaPct: "95%" },
    { id: "6", nome: "Matheus Pereira", presente: true, presencaPct: "100%" },
    { id: "7", nome: "Beatriz Lima", presente: false, presencaPct: "80%" },
    { id: "8", nome: "Cauã Alves", presente: true, presencaPct: "90%" },
  ]);

  function togglePresenca(id: string) {
    setAlunos((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const novoEstado = !a.presente;
          toast.success(
            novoEstado
              ? `${a.nome} marcado como Presente.`
              : `${a.nome} marcado como Ausente.`,
            { duration: 1500 }
          );
          return { ...a, presente: novoEstado };
        }
        return a;
      })
    );
  }

  function marcarTodos(presente: boolean) {
    setAlunos((prev) => prev.map((a) => ({ ...a, presente })));
    toast.success(
      presente
        ? "Todos os alunos foram marcados como Presentes."
        : "Presenças limpas para a turma.",
      { duration: 2000 }
    );
  }

  const alunosFiltrados = alunos.filter((a) =>
    a.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const totalPresentes = alunos.filter((a) => a.presente).length;

  return (
    <ProfessorShell
      title="Chamada / Frequência de Alunos"
      description="A presença é registrada e fixada automaticamente ao clicar no aluno."
    >
      <div className="space-y-6">
        {/* Controles de Data e Turma */}
        <div className="grid gap-4 sm:grid-cols-3 bg-card p-4 rounded-2xl border border-border shadow-xs">
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Data da Aula
            </span>
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-primary shrink-0" />
              <Input
                type="date"
                value={dataChamada}
                onChange={(e) => setDataChamada(e.target.value)}
                className="text-xs font-bold"
              />
            </div>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Turma Selecionada
            </span>
            <select
              value={turmaSelecionada}
              onChange={(e) => setTurmaSelecionada(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-bold text-foreground"
            >
              <option value="Jiu Jitsu — Turma Tarde A">Jiu Jitsu — Turma Tarde A (14:00 - 15:30)</option>
              <option value="Jiu Jitsu — Turma Tarde B">Jiu Jitsu — Turma Tarde B (15:30 - 17:00)</option>
            </select>
          </div>
        </div>

        {/* Resumo & Lista de Frequência */}
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-3 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
              <ClipboardCheck className="size-4 text-primary" />
              <span>Lista de Chamada — {turmaSelecionada}</span>
            </CardTitle>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 font-bold">
                Presentes: {totalPresentes} / {alunos.length}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => marcarTodos(true)} className="text-xs">
                <UserCheck className="size-3.5 mr-1" /> Marcar Todos
              </Button>
              <Button variant="outline" size="sm" onClick={() => marcarTodos(false)} className="text-xs text-destructive">
                <UserX className="size-3.5 mr-1" /> Limpar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar aluno na chamada..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <div className="divide-y divide-border/60 rounded-xl border border-border overflow-hidden">
              {alunosFiltrados.map((aluno) => (
                <div
                  key={aluno.id}
                  onClick={() => togglePresenca(aluno.id)}
                  className={`flex items-center justify-between p-3.5 text-xs transition-colors cursor-pointer ${
                    aluno.presente ? "bg-emerald-500/5 hover:bg-emerald-500/10" : "bg-card hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={aluno.presente}
                      onCheckedChange={() => togglePresenca(aluno.id)}
                    />
                    <div>
                      <span className="font-bold text-foreground block text-sm">{aluno.nome}</span>
                      <span className="text-[10px] text-muted-foreground">Frequência acumulada: {aluno.presencaPct}</span>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className={
                      aluno.presente
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 font-bold"
                        : "border-red-500/30 bg-red-500/10 text-red-600 font-bold"
                    }
                  >
                    {aluno.presente ? "Presente" : "Ausente"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ProfessorShell>
  );
}

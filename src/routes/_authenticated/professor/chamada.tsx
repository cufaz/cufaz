import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ClipboardCheck, UserCheck, UserX, Calendar, Search } from "lucide-react";
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
  const [profEmail] = useState(() => (localStorage.getItem("cufa_logged_user") || "").toLowerCase());
  const [profNome] = useState(() => localStorage.getItem("cufa_professor_nome") || "");

  // Read approved/requested turmas specifically for this professor
  const turmasDisponiveis = (() => {
    try {
      const stored = localStorage.getItem("cufa_professores_solicitacoes");
      if (stored) {
        const list = JSON.parse(stored);
        const minhas = list.filter(
          (item: any) =>
            (profEmail && item.email && String(item.email).toLowerCase() === profEmail) ||
            (profNome && item.professorNome && String(item.professorNome).toLowerCase() === profNome.toLowerCase())
        );

        if (minhas.length > 0) {
          return minhas.map((m: any) => `${m.atividadeNome} — ${m.turmaNome || "Turma 1"} (14:00 - 16:00)`);
        }
      }
    } catch {}

    return ["Jiu Jitsu — Turma 1 - Tarde (14:00 - 16:00)"];
  })();

  const [turmaSelecionada, setTurmaSelecionada] = useState(() => turmasDisponiveis[0] || "Jiu Jitsu — Turma 1");
  const [busca, setBusca] = useState("");

  const [alunos, setAlunos] = useState<any[]>(() => {
    return loadAlunosList();
  });

  function loadAlunosList() {
    const listMap = new Map<string, any>();

    // 1. Read registered students in platform
    try {
      const storedCad = localStorage.getItem("cufa_alunos_cadastrados");
      if (storedCad) {
        const parsed = JSON.parse(storedCad);
        if (Array.isArray(parsed)) {
          parsed.forEach((a: any, idx: number) => {
            const key = (a.nome || `Aluno ${idx}`).toLowerCase();
            if (!listMap.has(key)) {
              listMap.set(key, {
                id: a.id || `aluno-cad-${idx}`,
                nome: a.nome,
                presente: true,
                presencaPct: "100%",
              });
            }
          });
        }
      }
    } catch {}

    // 2. Read polo students
    try {
      const storedPolo = localStorage.getItem("cufa_alunos_polo");
      if (storedPolo) {
        const parsed = JSON.parse(storedPolo);
        if (Array.isArray(parsed)) {
          parsed.forEach((a: any, idx: number) => {
            const key = (a.nome || `Aluno ${idx}`).toLowerCase();
            if (!listMap.has(key)) {
              listMap.set(key, {
                id: a.id || `aluno-polo-${idx}`,
                nome: a.nome,
                presente: true,
                presencaPct: "100%",
              });
            }
          });
        }
      }
    } catch {}

    return Array.from(listMap.values());
  }

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
              {turmasDisponiveis.map((t: string) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
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
              <Button variant="outline" size="sm" onClick={() => marcarTodos(true)} className="text-xs font-bold">
                <UserCheck className="size-3.5 mr-1" /> Marcar Todos
              </Button>
              <Button variant="outline" size="sm" onClick={() => marcarTodos(false)} className="text-xs font-bold text-destructive">
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

            {alunos.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-border rounded-xl">
                <p className="text-xs text-muted-foreground font-medium">
                  Nenhum aluno inscrito nesta oficina no momento. Cadastre alunos na aba 'Alunos Matriculados' para realizar a chamada.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/60 rounded-xl border border-border overflow-hidden bg-card">
                {alunosFiltrados.map((aluno) => (
                  <div
                    key={aluno.id}
                    onClick={() => togglePresenca(aluno.id)}
                    className={`flex items-center justify-between p-3.5 cursor-pointer transition-colors ${
                      aluno.presente
                        ? "bg-emerald-500/5 hover:bg-emerald-500/10"
                        : "bg-red-500/5 hover:bg-red-500/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={aluno.presente}
                        onCheckedChange={() => togglePresenca(aluno.id)}
                        className="size-5 rounded-md"
                      />
                      <div>
                        <p className="text-xs font-extrabold text-foreground">{aluno.nome}</p>
                        <span className="text-[10px] text-muted-foreground">Presença acumulada: {aluno.presencaPct}</span>
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
            )}
          </CardContent>
        </Card>
      </div>
    </ProfessorShell>
  );
}

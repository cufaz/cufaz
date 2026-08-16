import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ClipboardCheck, UserCheck, UserX, Calendar, Search } from "lucide-react";
import { toast } from "sonner";
import { PoloResponsavelShell } from "@/components/polo/PoloResponsavelShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/_authenticated/polo/chamada")({
  component: PoloChamadaPage,
});

export function PoloChamadaPage() {
  const [poloNome] = useState(() => localStorage.getItem("cufa_polo_atribuido") || "Complexo da Penha");
  const [dataChamada, setDataChamada] = useState(() => new Date().toISOString().slice(0, 10));
  const [turmaSelecionada, setTurmaSelecionada] = useState("Jiu Jitsu — Turma Tarde A");
  const [busca, setBusca] = useState("");

  const [alunos, setAlunos] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem("cufa_alunos_polo");
      if (stored) {
        const list = JSON.parse(stored);
        return list.map((a: any, idx: number) => ({
          id: a.id || `aluno-${idx}`,
          nome: a.nome,
          presente: true,
          presencaPct: "100%",
        }));
      }
    } catch {}
    return [];
  });

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
    <PoloResponsavelShell
      title="Chamada / Frequência de Alunos"
      description={`Acompanhamento diário de presença da unidade ${poloNome}. A frequência é salva automaticamente ao clicar.`}
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
              Turma / Oficina Selecionada
            </span>
            <select
              value={turmaSelecionada}
              onChange={(e) => setTurmaSelecionada(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-bold text-foreground"
            >
              <option value="Jiu Jitsu — Turma Tarde A">Jiu Jitsu — Turma Tarde A (14:00 - 15:30)</option>
              <option value="Aula de Inglês — Turma Tarde">Aula de Inglês — Turma Tarde (14:00 - 16:00)</option>
              <option value="Natação — Turma Tarde">Natação — Turma Tarde (15:30 - 17:00)</option>
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
              {alunos.length > 0 && (
                <>
                  <Button variant="outline" size="sm" onClick={() => marcarTodos(true)} className="text-xs">
                    <UserCheck className="size-3.5 mr-1" /> Marcar Todos
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => marcarTodos(false)} className="text-xs text-destructive">
                    <UserX className="size-3.5 mr-1" /> Limpar
                  </Button>
                </>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {alunos.length > 0 && (
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar aluno na chamada..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>
            )}

            {alunos.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-border rounded-xl">
                <p className="text-xs text-muted-foreground font-medium">
                  Nenhum aluno inscrito nesta oficina no momento. Os cadastros de alunos realizados no polo aparecerão aqui para chamada diária.
                </p>
              </div>
            ) : (
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
            )}
          </CardContent>
        </Card>
      </div>
    </PoloResponsavelShell>
  );
}

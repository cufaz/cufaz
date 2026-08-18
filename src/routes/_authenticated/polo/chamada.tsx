import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ClipboardCheck, UserCheck, UserX, Calendar, Search, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { PoloResponsavelShell } from "@/components/polo/PoloResponsavelShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { getPoloAtividades, getPoloAlunos, registrarChamada } from "@/lib/polo.functions";
import { usePolosCadastrados } from "@/lib/cadastros";

export const Route = createFileRoute("/_authenticated/polo/chamada")({
  component: PoloChamadaPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-destructive font-bold">
      Erro ao carregar Diário de Chamada do Polo: {error.message}
    </div>
  ),
});

export function PoloChamadaPage() {
  const qc = useQueryClient();
  const { polos } = usePolosCadastrados();
  const defaultPoloId = polos[0]?.id || "penha";
  const defaultPoloNome = polos[0]?.nome || "Complexo da Penha";
  const [poloId] = useState<string>(defaultPoloId);

  const getAtivsFn = useServerFn(getPoloAtividades);
  const getAlunosFn = useServerFn(getPoloAlunos);
  const registrarFn = useServerFn(registrarChamada);

  const [dataChamada, setDataChamada] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedTurmaId, setSelectedTurmaId] = useState<string>("");
  const [busca, setBusca] = useState("");
  const [presencasMap, setPresencasMap] = useState<Record<string, boolean>>({});

  const { data: ativs, isLoading: loadingAtivs } = useQuery({
    queryKey: ["polo", "atividades", poloId],
    queryFn: () => getAtivsFn({ data: { poloId } }),
    staleTime: 30_000,
  });

  const { data: alunosList, isLoading: loadingAlunos } = useQuery({
    queryKey: ["polo", "alunos", poloId],
    queryFn: () => getAlunosFn({ data: { poloId } }),
    staleTime: 30_000,
  });

  // Extract all turmas from activities
  const allTurmas: Array<{ id: string; nome: string; ativNome: string; ativId: string }> = [];
  (ativs || []).forEach((a) => {
    (a.turmas || []).forEach((t) => {
      allTurmas.push({ id: t.id, nome: t.nome, ativNome: a.nome, ativId: a.atividadeId });
    });
  });

  useEffect(() => {
    if (allTurmas.length > 0 && !selectedTurmaId) {
      setSelectedTurmaId(allTurmas[0]!.id);
    }
  }, [allTurmas, selectedTurmaId]);

  const activeTurma = allTurmas.find((t) => t.id === selectedTurmaId);

  // Filter students enrolled in this turma
  const turmAlunos = (alunosList || []).filter((a) => a.turmaId === selectedTurmaId);

  // Initialize presence state
  useEffect(() => {
    const initialMap: Record<string, boolean> = {};
    turmAlunos.forEach((a) => {
      initialMap[a.matriculaId] = true;
    });
    setPresencasMap(initialMap);
  }, [selectedTurmaId, alunosList]);

  const mSalvar = useMutation({
    mutationFn: async () => {
      if (!selectedTurmaId || !activeTurma) throw new Error("Selecione uma turma válida.");
      const itens = turmAlunos.map((a) => ({
        matriculaId: a.matriculaId,
        alunoNome: a.nome,
        presente: presencasMap[a.matriculaId] ?? true,
      }));

      return await registrarFn({
        data: {
          turmaId: selectedTurmaId,
          atividadeId: activeTurma.ativId,
          poloId,
          data: dataChamada,
          itens,
        },
      });
    },
    onSuccess: (res) => {
      if (res.success) {
        toast.success(`Chamada registrada com sucesso para o dia ${dataChamada}!`);
        qc.invalidateQueries({ queryKey: ["polo"] });
      } else {
        toast.error("Erro ao registrar chamada no banco de dados.");
      }
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  function togglePresenca(matriculaId: string) {
    setPresencasMap((prev) => ({
      ...prev,
      [matriculaId]: !prev[matriculaId],
    }));
  }

  function marcarTodos(presente: boolean) {
    const updated: Record<string, boolean> = {};
    turmAlunos.forEach((a) => {
      updated[a.matriculaId] = presente;
    });
    setPresencasMap(updated);
    toast.info(presente ? "Todos marcados como Presentes." : "Todos marcados como Ausentes.");
  }

  const filtrados = turmAlunos.filter((a) =>
    a.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const totalPresentes = filtrados.filter((a) => presencasMap[a.matriculaId] !== false).length;

  return (
    <PoloResponsavelShell
      title={`Diário de Chamada — ${defaultPoloNome}`}
      description="Registro oficial de presenças por turma e data"
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
              value={selectedTurmaId}
              onChange={(e) => setSelectedTurmaId(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-xs font-bold text-foreground"
            >
              {allTurmas.length === 0 ? (
                <option value="">Nenhuma turma disponível</option>
              ) : (
                allTurmas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.ativNome} — {t.nome}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Lista e Operações de Chamada */}
        <Card className="border-border shadow-xs">
          <CardHeader className="bg-muted/30 border-b border-border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base font-extrabold flex items-center gap-2">
                <ClipboardCheck className="size-5 text-primary" />
                {activeTurma ? `${activeTurma.ativNome} — ${activeTurma.nome}` : "Selecione uma turma"}
              </CardTitle>
              <p className="text-xs text-muted-foreground font-semibold">
                {turmAlunos.length} aluno(s) matriculado(s) nesta turma
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => marcarTodos(true)} className="h-8 text-xs font-bold">
                <UserCheck className="size-3.5 mr-1 text-emerald-600" /> Todos Presentes
              </Button>
              <Button size="sm" variant="outline" onClick={() => marcarTodos(false)} className="h-8 text-xs font-bold">
                <UserX className="size-3.5 mr-1 text-destructive" /> Limpar Presenças
              </Button>
              <Button
                size="sm"
                onClick={() => mSalvar.mutate()}
                disabled={mSalvar.isPending || turmAlunos.length === 0}
                className="h-8 text-xs font-bold bg-brand-gradient text-white shadow-brand"
              >
                {mSalvar.isPending ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <Save className="size-3.5 mr-1" />}
                Salvar Chamada
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Filtrar aluno na turma..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9 h-9 text-xs font-medium"
              />
            </div>

            {loadingAtivs || loadingAlunos ? (
              <div className="flex justify-center py-12">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
            ) : filtrados.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-xs font-semibold">
                Nenhum aluno matriculado nesta turma no banco de dados.
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {filtrados.map((aluno) => {
                  const isPresente = presencasMap[aluno.matriculaId] !== false;
                  return (
                    <div
                      key={aluno.matriculaId}
                      onClick={() => togglePresenca(aluno.matriculaId)}
                      className="py-3 px-2 flex items-center justify-between cursor-pointer hover:bg-muted/20 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox checked={isPresente} onCheckedChange={() => togglePresenca(aluno.matriculaId)} />
                        <div>
                          <span className="font-bold text-foreground text-sm block">{aluno.nome}</span>
                          <span className="text-[11px] text-muted-foreground">{aluno.email || "Sem e-mail"}</span>
                        </div>
                      </div>

                      <Badge
                        className={
                          isPresente
                            ? "bg-emerald-500/15 text-emerald-600 font-bold border-emerald-500/30"
                            : "bg-destructive/15 text-destructive font-bold border-destructive/30"
                        }
                      >
                        {isPresente ? "Presente" : "Ausente"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PoloResponsavelShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search, UserCheck, Phone, Mail, BookOpen, ChevronLeft, ChevronRight, Eye, School, ShieldCheck, HeartPulse, Loader2 } from "lucide-react";
import { PoloResponsavelShell } from "@/components/polo/PoloResponsavelShell";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getPoloAlunos, getPoloAtividades } from "@/lib/polo.functions";
import { usePolosCadastrados } from "@/lib/cadastros";
import { PoloAlunoItem } from "@/lib/polo.server";

export const Route = createFileRoute("/_authenticated/polo/alunos")({
  component: PoloAlunosPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-destructive font-bold">
      Erro ao carregar lista de alunos do polo: {error.message}
    </div>
  ),
});

export function PoloAlunosPage() {
  const { polos } = usePolosCadastrados();
  const defaultPoloId = polos[0]?.id || "penha";
  const defaultPoloNome = polos[0]?.nome || "Complexo da Penha";
  const [poloId] = useState<string>(defaultPoloId);

  const getAlunosFn = useServerFn(getPoloAlunos);
  const getAtivsFn = useServerFn(getPoloAtividades);

  const [busca, setBusca] = useState("");
  const [atividadeFiltro, setAtividadeFiltro] = useState("todas");
  const [pagina, setPagina] = useState(1);
  const [selectedAluno, setSelectedAluno] = useState<PoloAlunoItem | null>(null);
  const itensPorPagina = 20;

  const { data: alunos, isLoading, refetch } = useQuery({
    queryKey: ["polo", "alunos", poloId],
    queryFn: () => getAlunosFn({ data: { poloId } }),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const { data: ativs } = useQuery({
    queryKey: ["polo", "atividades", poloId],
    queryFn: () => getAtivsFn({ data: { poloId } }),
    staleTime: 30_000,
  });

  useEffect(() => {
    window.addEventListener("cufa_matricula_updated", () => refetch());
    return () => window.removeEventListener("cufa_matricula_updated", () => refetch());
  }, [refetch]);

  const listaAlunos = alunos || [];

  const filtrados = listaAlunos.filter((a) => {
    const q = busca.toLowerCase();
    const matchBusca =
      !q ||
      a.nome.toLowerCase().includes(q) ||
      (a.email && a.email.toLowerCase().includes(q)) ||
      (a.telefone && a.telefone.includes(q));

    const matchAtiv =
      atividadeFiltro === "todas" ||
      (a.atividadeNome && a.atividadeNome.toLowerCase() === atividadeFiltro.toLowerCase());

    return matchBusca && matchAtiv;
  });

  const totalPaginas = Math.ceil(filtrados.length / itensPorPagina) || 1;
  const paginados = filtrados.slice((pagina - 1) * itensPorPagina, pagina * itensPorPagina);

  return (
    <PoloResponsavelShell
      title={`Alunos do Polo — ${defaultPoloNome}`}
      description="Consulta de beneficiários matriculados e informações de saúde e contato"
    >
      <div className="space-y-6">
        {/* Barra de Filtros e Busca */}
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, e-mail ou telefone..."
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPagina(1);
              }}
              className="pl-9 h-10 font-medium"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase text-muted-foreground">Oficina:</span>
              <select
                value={atividadeFiltro}
                onChange={(e) => {
                  setAtividadeFiltro(e.target.value);
                  setPagina(1);
                }}
                className="h-10 rounded-md border border-input bg-background px-3 text-xs font-bold text-foreground"
              >
                <option value="todas">Todas as Oficinas</option>
                {(ativs || []).map((at) => (
                  <option key={at.atividadeId} value={at.nome}>
                    {at.nome}
                  </option>
                ))}
              </select>
            </div>

            <Badge variant="outline" className="font-bold text-xs px-3 py-1.5 border-primary/30 text-primary">
              Total: {filtrados.length}
            </Badge>
          </div>
        </div>

        {/* Tabela de Alunos */}
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="border-b border-border bg-muted/40 px-6 py-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide">
              Lista de Beneficiários ({filtrados.length})
            </h2>
            <span className="text-xs text-muted-foreground font-semibold">
              Página {pagina} de {totalPaginas}
            </span>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : paginados.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <UserCheck className="mx-auto size-12 text-muted-foreground/40 mb-2" />
              <p className="font-bold text-foreground text-sm">Nenhum aluno encontrado no banco de dados.</p>
              <p className="text-xs mt-1">Os novos alunos matriculados aparecerão aqui automaticamente.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/20 uppercase text-[10px] font-bold text-muted-foreground">
                    <th className="py-3 px-4">Nome do Aluno</th>
                    <th className="py-3 px-4">Oficina / Turma</th>
                    <th className="py-3 px-4">Contato / E-mail</th>
                    <th className="py-3 px-4">Responsável Legal</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {paginados.map((aluno) => (
                    <tr key={aluno.matriculaId} className="hover:bg-muted/20">
                      <td className="py-3 px-4">
                        <span className="font-bold text-foreground text-sm block">{aluno.nome}</span>
                        {aluno.email ? (
                          <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                            <Mail className="size-3 text-primary" /> {aluno.email}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-[11px] italic">E-mail: Não informado</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-primary block">{aluno.atividadeNome || "Sem Oficina"}</span>
                        <span className="text-[11px] text-muted-foreground">{aluno.turmaNome || "Turma Regular"}</span>
                      </td>

                      <td className="py-3 px-4 text-muted-foreground">
                        {aluno.telefone ? (
                          <span className="flex items-center gap-1 font-semibold text-foreground">
                            <Phone className="size-3 text-emerald-600" /> {aluno.telefone}
                          </span>
                        ) : (
                          <span className="italic text-[11px]">Não informado</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-muted-foreground font-medium">
                        {aluno.responsavel || <span className="italic text-[11px]">Não informado</span>}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <Badge className="bg-emerald-500/15 text-emerald-600 font-bold border border-emerald-500/30">
                          {aluno.status}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedAluno(aluno)}
                          className="h-8 text-xs font-bold gap-1 text-primary hover:bg-primary/10 border-primary/30"
                        >
                          <Eye className="size-3.5" /> Analisar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="border-t border-border bg-muted/20 px-6 py-3 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                disabled={pagina === 1}
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                className="h-8 text-xs font-bold"
              >
                <ChevronLeft className="size-4 mr-1" /> Anterior
              </Button>
              <span className="text-xs font-bold text-muted-foreground">
                Página {pagina} de {totalPaginas}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagina === totalPaginas}
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                className="h-8 text-xs font-bold"
              >
                Próxima <ChevronRight className="size-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Inspecionar Aluno */}
      <Dialog open={Boolean(selectedAluno)} onOpenChange={(v) => !v && setSelectedAluno(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-foreground flex items-center gap-2">
              <UserCheck className="size-5 text-primary" /> Ficha Cadastral do Beneficiário
            </DialogTitle>
            <DialogDescription className="text-xs">
              Dados oficiais registrados no sistema para a unidade de polo.
            </DialogDescription>
          </DialogHeader>

          {selectedAluno && (
            <div className="space-y-4 py-2 text-xs">
              <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-extrabold text-foreground">{selectedAluno.nome}</h3>
                    <p className="text-muted-foreground font-medium">{selectedAluno.email || "E-mail: Não informado"}</p>
                  </div>
                  <Badge className="bg-primary text-white font-bold">{selectedAluno.status}</Badge>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                <h4 className="font-extrabold text-xs uppercase text-primary flex items-center gap-1.5">
                  <BookOpen className="size-4" /> Oficina & Turma
                </h4>
                <p><strong className="text-foreground">Modalidade:</strong> {selectedAluno.atividadeNome || "Não informado"}</p>
                <p><strong className="text-foreground">Turma:</strong> {selectedAluno.turmaNome || "Não informado"}</p>
                <p><strong className="text-foreground">Data da Matrícula:</strong> {selectedAluno.dataMatricula || "Não informado"}</p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                <h4 className="font-extrabold text-xs uppercase text-primary flex items-center gap-1.5">
                  <ShieldCheck className="size-4" /> Responsável & Contato
                </h4>
                <p><strong className="text-foreground">Responsável Legal:</strong> {selectedAluno.responsavel || "Não informado"}</p>
                <p><strong className="text-foreground">Telefone Principal:</strong> {selectedAluno.telefone || "Não informado"}</p>
                <p><strong className="text-foreground">Escola:</strong> {selectedAluno.escola || "Não informado"}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PoloResponsavelShell>
  );
}

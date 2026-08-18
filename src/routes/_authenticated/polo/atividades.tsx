import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Users,
  Clock,
  CheckCircle2,
  UserCheck,
  UserX,
  Eye,
  Loader2,
  GraduationCap,
  Layers,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PoloResponsavelShell } from "@/components/polo/PoloResponsavelShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getPoloAtividades, getSolicitacoesProfessor, decidirSolicitacaoProfessor } from "@/lib/polo.functions";
import { usePolosCadastrados } from "@/lib/cadastros";

export const Route = createFileRoute("/_authenticated/polo/atividades")({
  component: PoloAtividadesPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-destructive font-bold">
      Erro ao carregar Atividades e Turmas do Polo: {error.message}
    </div>
  ),
});

export function PoloAtividadesPage() {
  const qc = useQueryClient();
  const { polos } = usePolosCadastrados();
  const defaultPoloId = polos[0]?.id || "penha";
  const defaultPoloNome = polos[0]?.nome || "Complexo da Penha";
  const [poloId] = useState<string>(defaultPoloId);

  const getAtivsFn = useServerFn(getPoloAtividades);
  const getSolisFn = useServerFn(getSolicitacoesProfessor);
  const decidirFn = useServerFn(decidirSolicitacaoProfessor);

  const [selectedSolicitacao, setSelectedSolicitacao] = useState<any | null>(null);

  const { data: atividades, isLoading: loadingAtivs } = useQuery({
    queryKey: ["polo", "atividades", poloId],
    queryFn: () => getAtivsFn({ data: { poloId } }),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const { data: solicitacoes, isLoading: loadingSolis, refetch: refetchSolis } = useQuery({
    queryKey: ["polo", "solicitacoes_professor", poloId],
    queryFn: () => getSolisFn({ data: { poloId } }),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const mDecidir = useMutation({
    mutationFn: (v: { id: string; decisao: "aprovada" | "recusada" }) =>
      decidirFn({ data: v }),
    onSuccess: (res, vars) => {
      if (res.success) {
        toast.success(`Solicitação ${vars.decisao === "aprovada" ? "aprovada" : "recusada"} com sucesso!`);
        qc.invalidateQueries({ queryKey: ["polo"] });
        refetchSolis();
        setSelectedSolicitacao(null);
      } else {
        toast.error(`Erro ao decidir solicitação: ${res.error}`);
      }
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const listAtividades = atividades || [];
  const listSolicitacoes = solicitacoes || [];

  return (
    <PoloResponsavelShell
      title={`Atividades e Turmas — ${defaultPoloNome}`}
      description="Gerenciamento de oficinas, turmas, ocupação de vagas e aprovação de professores"
    >
      <div className="space-y-8">
        {/* Seção 1: Solicitações de Vínculo de Professores */}
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="border-b border-border bg-muted/40 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="size-5 text-primary" />
              <h2 className="text-sm font-extrabold uppercase tracking-wide">
                Solicitações de Vínculo de Professores
              </h2>
            </div>
            <Badge className="bg-primary text-white font-bold">
              {listSolicitacoes.filter((s) => s.status === "pendente").length} Pendente(s)
            </Badge>
          </div>

          {loadingSolis ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : listSolicitacoes.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6 italic">
              Nenhuma solicitação de professor cadastrada para este polo no banco de dados.
            </p>
          ) : (
            <div className="divide-y divide-border/60">
              {listSolicitacoes.map((sol) => (
                <div key={sol.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-extrabold text-sm text-foreground block">
                      {sol.professor_nome || sol.professor_email || "Prof. Solicitante"}
                    </span>
                    <span className="text-muted-foreground block font-medium">
                      Oficina: <strong className="text-primary">{sol.atividades?.nome || "Oficina"}</strong> •
                      Turma: {sol.turmas?.nome || "Regular"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {sol.status === "pendente" ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedSolicitacao(sol)}
                          className="h-8 text-xs font-bold gap-1 text-primary border-primary/30"
                        >
                          <Eye className="size-3.5" /> Detalhes
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => mDecidir.mutate({ id: sol.id, decisao: "aprovada" })}
                          disabled={mDecidir.isPending}
                          className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                        >
                          <Check className="size-3.5" /> Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => mDecidir.mutate({ id: sol.id, decisao: "recusada" })}
                          disabled={mDecidir.isPending}
                          className="h-8 text-xs font-bold gap-1"
                        >
                          <X className="size-3.5" /> Recusar
                        </Button>
                      </>
                    ) : (
                      <Badge
                        className={
                          sol.status === "aprovada"
                            ? "bg-emerald-500/15 text-emerald-600 font-bold border-emerald-500/30"
                            : "bg-destructive/15 text-destructive font-bold border-destructive/30"
                        }
                      >
                        {sol.status === "aprovada" ? "Aprovado" : "Recusado"}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Seção 2: Oficinas & Turmas em Funcionamento */}
        <div className="space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-foreground flex items-center gap-2">
            <Layers className="size-5 text-primary" /> Oficinas & Turmas no Polo
          </h2>

          {loadingAtivs ? (
            <div className="flex justify-center py-12">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : listAtividades.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground text-sm font-medium">
              Nenhuma atividade / oficina cadastrada para este polo no banco de dados.
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {listAtividades.map((ativ) => {
                const pct = ativ.vagasTotais > 0 ? Math.round((ativ.matriculasAtivas / ativ.vagasTotais) * 100) : 0;
                return (
                  <Card key={ativ.atividadeId} className="shadow-xs border-border overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b border-border p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base font-extrabold text-foreground">{ativ.nome}</CardTitle>
                          <p className="text-xs text-muted-foreground font-semibold">
                            Instrutor: <strong className="text-primary">{ativ.professorNome || "Não atribuído"}</strong>
                          </p>
                        </div>
                        <Badge className="bg-primary/10 text-primary font-extrabold border-primary/20">
                          {ativ.matriculasAtivas} / {ativ.vagasTotais} vagas
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-muted-foreground">
                          <span>Ocupação Total</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full rounded-full bg-brand-gradient"
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2 pt-2">
                        <h4 className="text-xs font-bold uppercase text-muted-foreground">Turmas Cadastradas ({ativ.turmas.length})</h4>
                        {ativ.turmas.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic">Nenhuma turma criada.</p>
                        ) : (
                          <div className="space-y-1.5">
                            {ativ.turmas.map((t) => (
                              <div key={t.id} className="rounded-lg border border-border/80 bg-background p-2.5 flex items-center justify-between text-xs">
                                <div>
                                  <span className="font-bold text-foreground block">{t.nome}</span>
                                  {t.horario && <span className="text-[11px] text-muted-foreground block">{t.horario}</span>}
                                </div>
                                <Badge variant="outline" className="font-bold text-[11px]">
                                  {t.matriculasAtivas} / {t.vagas} alunos
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal Detalhar Solicitação */}
      <Dialog open={Boolean(selectedSolicitacao)} onOpenChange={(v) => !v && setSelectedSolicitacao(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Solicitação de Vínculo</DialogTitle>
            <DialogDescription className="text-xs">
              Análise de dados do professor solicitante.
            </DialogDescription>
          </DialogHeader>

          {selectedSolicitacao && (
            <div className="space-y-3 text-xs py-2">
              <p><strong className="text-foreground">Professor:</strong> {selectedSolicitacao.professor_nome || selectedSolicitacao.professor_email}</p>
              <p><strong className="text-foreground">E-mail:</strong> {selectedSolicitacao.professor_email || "Não informado"}</p>
              <p><strong className="text-foreground">Oficina Solicitada:</strong> {selectedSolicitacao.atividades?.nome || "Não informado"}</p>
              <p><strong className="text-foreground">Data do Pedido:</strong> {selectedSolicitacao.created_at ? selectedSolicitacao.created_at.slice(0, 10) : "Hoje"}</p>

              <div className="pt-3 flex gap-2 justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => mDecidir.mutate({ id: selectedSolicitacao.id, decisao: "recusada" })}
                  disabled={mDecidir.isPending}
                  className="font-bold text-destructive"
                >
                  Recusar
                </Button>
                <Button
                  size="sm"
                  onClick={() => mDecidir.mutate({ id: selectedSolicitacao.id, decisao: "aprovada" })}
                  disabled={mDecidir.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Aprovar Vínculo
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PoloResponsavelShell>
  );
}

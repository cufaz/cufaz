import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { GraduationCap, Search, Award, MessageSquare, ShieldCheck, Users, Loader2 } from "lucide-react";
import { PoloResponsavelShell } from "@/components/polo/PoloResponsavelShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { fetchDiarioEntriesDB, DiarioEntryDB } from "@/lib/diarioService";
import { getPoloAtividades } from "@/lib/polo.functions";
import { usePolosCadastrados } from "@/lib/cadastros";

export const Route = createFileRoute("/_authenticated/polo/diario-classe")({
  component: PoloDiarioClassePage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-destructive font-bold">
      Erro ao carregar Diário do Polo: {error.message}
    </div>
  ),
});

export function PoloDiarioClassePage() {
  const { polos } = usePolosCadastrados();
  const defaultPoloId = polos[0]?.id || "penha";
  const defaultPoloNome = polos[0]?.nome || "Complexo da Penha";
  const [poloId] = useState<string>(defaultPoloId);

  const getAtivsFn = useServerFn(getPoloAtividades);
  const [filtroOficina, setFiltroOficina] = useState("todas");
  const [searchQuery, setSearchQuery] = useState("");
  const [logsList, setLogsList] = useState<DiarioEntryDB[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { data: ativs } = useQuery({
    queryKey: ["polo", "atividades", poloId],
    queryFn: () => getAtivsFn({ data: { poloId } }),
    staleTime: 30_000,
  });

  async function loadPoloLogs() {
    setIsLoading(true);
    const data = await fetchDiarioEntriesDB({ polo_nome: defaultPoloNome });
    setLogsList(data);
    setIsLoading(false);
  }

  useEffect(() => {
    loadPoloLogs();
    window.addEventListener("cufa_diario_updated", loadPoloLogs);
    return () => window.removeEventListener("cufa_diario_updated", loadPoloLogs);
  }, [defaultPoloNome]);

  const logsFiltrados = logsList.filter((log) => {
    const matchOficina = filtroOficina === "todas" || log.atividade_nome?.toLowerCase() === filtroOficina.toLowerCase();
    const matchSearch =
      !searchQuery ||
      log.aluno_nome?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.aluno_email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchOficina && matchSearch;
  });

  return (
    <PoloResponsavelShell
      title={`Diário de Classe — ${defaultPoloNome}`}
      description="Acompanhamento dos registros pedagógicos e graduações dos alunos"
    >
      <div className="space-y-6">
        {/* KPI Summary */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-border shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-muted-foreground">Registros do Polo</p>
                <p className="text-2xl font-black text-foreground mt-1">{logsFiltrados.length}</p>
              </div>
              <GraduationCap className="size-8 text-primary opacity-80" />
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-muted-foreground">Unidade</p>
                <p className="text-lg font-extrabold text-emerald-600 mt-1">{defaultPoloNome}</p>
              </div>
              <ShieldCheck className="size-8 text-emerald-500 opacity-80" />
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-muted-foreground">Visibilidade</p>
                <p className="text-xs font-extrabold text-foreground mt-1">Sincronizado com Aluno & Gestor</p>
              </div>
              <Users className="size-8 text-amber-500 opacity-80" />
            </CardContent>
          </Card>
        </div>

        {/* Filter Toolbar */}
        <Card className="border-border shadow-xs bg-card">
          <CardContent className="p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Filtrar aluno por nome ou e-mail..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-xs font-medium"
                />
              </div>

              <div>
                <select
                  value={filtroOficina}
                  onChange={(e) => setFiltroOficina(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs font-bold text-foreground"
                >
                  <option value="todas">Todas as Oficinas</option>
                  {(ativs || []).map((at) => (
                    <option key={at.atividadeId} value={at.nome}>
                      {at.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* List of Entries */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : logsFiltrados.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground text-xs font-semibold">
              Nenhum registro de diário de classe encontrado no banco de dados.
            </Card>
          ) : (
            logsFiltrados.map((log) => (
              <Card key={log.id} className="border-border shadow-xs overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-sm font-extrabold text-foreground">{log.aluno_nome}</CardTitle>
                    <p className="text-xs text-muted-foreground font-medium">
                      Oficina: <strong className="text-primary">{log.atividade_nome}</strong> • Data: {log.created_at || "Hoje"}
                    </p>
                  </div>
                  <Badge className="bg-primary/10 text-primary font-bold border-primary/20">
                    {log.nivel_graduacao || "Sem Nível"}
                  </Badge>
                </CardHeader>

                <CardContent className="p-4 space-y-2 text-xs">
                  {log.relato && (
                    <div className="rounded-lg bg-muted/40 p-3 flex gap-2">
                      <MessageSquare className="size-4 text-primary shrink-0 mt-0.5" />
                      <p className="text-muted-foreground leading-relaxed">{log.relato}</p>
                    </div>
                  )}
                  {log.professor_nome && (
                    <p className="text-[11px] text-muted-foreground font-semibold">
                      Registrado por: <span className="text-foreground">{log.professor_nome}</span>
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </PoloResponsavelShell>
  );
}

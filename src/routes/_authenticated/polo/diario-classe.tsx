import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { GraduationCap, Search, Award, MessageSquare, ShieldCheck, Users } from "lucide-react";
import { PoloResponsavelShell } from "@/components/polo/PoloResponsavelShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { fetchDiarioEntriesDB, DiarioEntryDB } from "@/lib/diarioService";

export const Route = createFileRoute("/_authenticated/polo/diario-classe")({
  component: PoloDiarioClassePage,
});

export function PoloDiarioClassePage() {
  const [poloNome] = useState(() => localStorage.getItem("cufa_polo_atribuido") || "Complexo da Penha");
  const [filtroOficina, setFiltroOficina] = useState("todas");
  const [searchQuery, setSearchQuery] = useState("");

  const [logsList, setLogsList] = useState<DiarioEntryDB[]>([]);

  async function loadPoloLogs() {
    const data = await fetchDiarioEntriesDB({ polo_nome: poloNome });
    setLogsList(data);
  }

  useEffect(() => {
    loadPoloLogs();
    window.addEventListener("cufa_diario_updated", loadPoloLogs);
    return () => {
      window.removeEventListener("cufa_diario_updated", loadPoloLogs);
    };
  }, [poloNome]);

  const logsFiltrados = logsList.filter((log) => {
    const matchPolo = !poloNome || log.polo_nome?.toLowerCase().includes(poloNome.toLowerCase()) || poloNome.toLowerCase().includes(log.polo_nome?.toLowerCase() || "");
    const matchOficina = filtroOficina === "todas" || log.atividade_nome?.toLowerCase() === filtroOficina.toLowerCase();
    const matchSearch =
      !searchQuery ||
      log.aluno_nome?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.aluno_email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchPolo && matchOficina && matchSearch;
  });

  return (
    <PoloResponsavelShell title="Diário de Classe do Polo">
      <div className="space-y-6">
        {/* KPI Summary */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-border shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-muted-foreground">Alunos Avaliados no Polo</p>
                <p className="text-2xl font-black text-foreground mt-1">{logsFiltrados.length}</p>
              </div>
              <GraduationCap className="size-8 text-primary opacity-80" />
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-muted-foreground">Unidade</p>
                <p className="text-lg font-extrabold text-emerald-600 mt-1">{poloNome}</p>
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
                  className="pl-9 text-xs"
                />
              </div>

              <div>
                <select
                  value={filtroOficina}
                  onChange={(e) => setFiltroOficina(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs font-bold text-foreground"
                >
                  <option value="todas">Todas as Oficinas do Polo</option>
                  <option value="Jiu Jitsu">Jiu Jitsu</option>
                  <option value="Karatê">Karatê</option>
                  <option value="Corte e Costura">Corte e Costura</option>
                  <option value="Aula de Inglês">Aula de Inglês</option>
                  <option value="Futsal">Futsal</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs List */}
        <div className="space-y-4">
          {logsFiltrados.length === 0 ? (
            <Card className="border-border p-8 text-center text-muted-foreground">
              Nenhum diário de classe registrado para este polo até o momento.
            </Card>
          ) : (
            logsFiltrados.map((log, idx) => (
              <Card key={log.id || `log-${idx}`} className="border-border shadow-xs overflow-hidden">
                <CardHeader className="bg-muted/40 pb-3 border-b border-border/60">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10 border border-primary/40">
                        <AvatarFallback className="bg-primary/10 text-primary font-black text-xs">
                          {log.aluno_nome?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base font-extrabold text-foreground">
                          {log.aluno_nome}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground font-medium">
                          {log.aluno_email} • Polo: <b>{log.polo_nome}</b>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary/10 text-primary font-bold text-xs">
                        {log.atividade_nome}
                      </Badge>
                      <Badge className="bg-amber-500 text-slate-950 font-black text-xs">
                        <Award className="size-3.5 mr-1" /> {log.nivel || "Iniciante"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-2">
                    <span>Instrutor: <b>{log.professor_nome || "Prof. Responsável"}</b></span>
                    <span>Data da Avaliação: <b>{log.data || "2026-08-15"}</b></span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-muted/20 border border-border text-xs leading-relaxed text-foreground font-medium">
                    <MessageSquare className="size-4 text-emerald-600 inline mr-2" />
                    "{log.relato}"
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </PoloResponsavelShell>
  );
}

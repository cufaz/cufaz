import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { BookOpen, Users, Clock, Calendar, CheckCircle2, XCircle, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { PoloResponsavelShell } from "@/components/polo/PoloResponsavelShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface ProfessorSolicitacao {
  id: string;
  professorNome: string;
  atividadeNome: string;
  turmaNome?: string;
  poloNome: string;
  status: "pendente" | "aprovado" | "recusado";
  dataSolicitacao?: string;
}

export const Route = createFileRoute("/_authenticated/polo/atividades")({
  component: PoloAtividadesPage,
});

function cleanStr(str: string = "") {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function deduplicateRequests(list: ProfessorSolicitacao[]): ProfessorSolicitacao[] {
  const seen = new Set<string>();
  const cleanList: ProfessorSolicitacao[] = [];

  for (const item of list) {
    const key = `${cleanStr(item.professorNome)}-${cleanStr(item.atividadeNome)}-${cleanStr(item.poloNome)}`;
    if (!seen.has(key)) {
      seen.add(key);
      cleanList.push(item);
    }
  }
  return cleanList;
}

export function PoloAtividadesPage() {
  const [poloNome] = useState(() => localStorage.getItem("cufa_polo_atribuido") || "Complexo da Penha");
  const [filtroOficina, setFiltroOficina] = useState("todas");
  const [dataDe, setDataDe] = useState("");
  const [dataAte, setDataAte] = useState("");

  const [alunosLista] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem("cufa_alunos_polo");
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  });

  const [solicitacoes, setSolicitacoes] = useState<ProfessorSolicitacao[]>(() => {
    try {
      const stored = localStorage.getItem("cufa_professores_solicitacoes");
      if (stored) {
        const list = JSON.parse(stored);
        const deduped = deduplicateRequests(list);
        localStorage.setItem("cufa_professores_solicitacoes", JSON.stringify(deduped));
        return deduped;
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    function syncProfessores() {
      try {
        const stored = localStorage.getItem("cufa_professores_solicitacoes");
        if (stored) {
          const deduped = deduplicateRequests(JSON.parse(stored));
          setSolicitacoes(deduped);
        }
      } catch {}
    }

    window.addEventListener("cufa_professores_updated", syncProfessores);
    window.addEventListener("storage", syncProfessores);
    return () => {
      window.removeEventListener("cufa_professores_updated", syncProfessores);
      window.removeEventListener("storage", syncProfessores);
    };
  }, []);

  function handleAprovarProfessor(solicId: string, profNome: string, ativNome: string) {
    const updated = solicitacoes.map((s) =>
      s.id === solicId ? ({ ...s, status: "aprovado" as const }) : s
    );
    setSolicitacoes(updated);
    localStorage.setItem("cufa_professores_solicitacoes", JSON.stringify(updated));
    window.dispatchEvent(new Event("cufa_professores_updated"));
    toast.success(`Professor ${profNome} aprovado e vinculado a ${ativNome}!`);
  }

  function handleRecusarProfessor(solicId: string, profNome: string) {
    const updated = solicitacoes.map((s) =>
      s.id === solicId ? ({ ...s, status: "recusado" as const }) : s
    );
    setSolicitacoes(updated);
    localStorage.setItem("cufa_professores_solicitacoes", JSON.stringify(updated));
    window.dispatchEvent(new Event("cufa_professores_updated"));
    toast.info(`Solicitação do professor ${profNome} recusada.`);
  }

  const isPenha = poloNome.toLowerCase().includes("penha");
  const isMadureira = poloNome.toLowerCase().includes("madureira");

  const rawAtividades = isPenha
    ? [
        {
          id: "1",
          nome: "Jiu Jitsu",
          dias: "Segundas e Quartas",
          horarios: "14h - 16h",
          turmas: ["Turma 1 - Tarde 14h - 16h (40 vagas)", "Turma 2 - Tarde 16h - 18h (40 vagas)"],
          vagas: 80,
          periodoMatricula: "01/08/2026 a 31/08/2026",
          periodoAtividade: "01/09/2026 a 31/01/2027",
        },
        {
          id: "2",
          nome: "Aula de Inglês",
          dias: "Segundas e Quintas",
          horarios: "14h - 16h",
          turmas: ["Turma 1 - Tarde 14h - 16h (30 vagas)"],
          vagas: 30,
          periodoMatricula: "01/08/2026 a 31/08/2026",
          periodoAtividade: "01/09/2026 a 31/01/2027",
        },
        {
          id: "3",
          nome: "Natação",
          dias: "Terças e Quintas",
          horarios: "14h - 16h",
          turmas: ["Turma 1 - Tarde 14h - 16h (40 vagas)"],
          vagas: 40,
          periodoMatricula: "01/08/2026 a 31/08/2026",
          periodoAtividade: "01/09/2026 a 31/01/2027",
        },
      ]
    : isMadureira
    ? [
        {
          id: "4",
          nome: "Corte e Costura",
          dias: "Terças e Quintas",
          horarios: "14h - 17h",
          turmas: ["Turma 1 - Tarde 14h - 17h (16 vagas)"],
          vagas: 16,
          periodoMatricula: "01/08/2026 a 31/08/2026",
          periodoAtividade: "01/09/2026 a 31/01/2027",
        },
        {
          id: "5",
          nome: "Futsal",
          dias: "Quartas e Sextas",
          horarios: "14h - 16h",
          turmas: ["Turma 1 - Tarde 14h - 16h (20 vagas)", "Turma 2 - Tarde 16h - 18h (20 vagas)"],
          vagas: 40,
          periodoMatricula: "01/08/2026 a 31/08/2026",
          periodoAtividade: "01/09/2026 a 31/01/2027",
        },
        {
          id: "6",
          nome: "Basquete",
          dias: "Terças e Quintas",
          horarios: "15h - 17h",
          turmas: ["Turma 1 - Tarde 15h - 17h (25 vagas)"],
          vagas: 25,
          periodoMatricula: "01/08/2026 a 31/08/2026",
          periodoAtividade: "01/09/2026 a 31/01/2027",
        },
      ]
    : [
        {
          id: "7",
          nome: "Karatê",
          dias: "Segundas e Quartas",
          horarios: "14h - 16h",
          turmas: ["Turma 1 - Tarde 14h - 16h (15 vagas)", "Turma 2 - Tarde 16h - 18h (15 vagas)"],
          vagas: 30,
          periodoMatricula: "01/08/2026 a 31/08/2026",
          periodoAtividade: "01/09/2026 a 31/01/2027",
        },
      ];

  const atividadesExpandidas: any[] = [];
  rawAtividades.forEach((ativ) => {
    if (ativ.turmas && ativ.turmas.length > 1) {
      ativ.turmas.forEach((turmaLabel: string, idx: number) => {
        atividadesExpandidas.push({
          ...ativ,
          id: `${ativ.id}-t${idx + 1}`,
          turmaNome: `Turma ${idx + 1}`,
          turmaDetalhe: turmaLabel,
          vagas: Math.round(ativ.vagas / ativ.turmas.length),
        });
      });
    } else {
      atividadesExpandidas.push({
        ...ativ,
        turmaNome: "Turma 1",
        turmaDetalhe: ativ.turmas ? ativ.turmas[0] : `${ativ.nome} — Turma Única`,
      });
    }
  });

  const atividadesCalculadas = atividadesExpandidas.map((ativ) => {
    const countReal = alunosLista.filter((a: any) => a.atividade === ativ.nome).length;
    return {
      ...ativ,
      alunos: countReal,
    };
  });

  const atividadesFiltradas = atividadesCalculadas.filter((ativ) => {
    const matchOficina = filtroOficina === "todas" || ativ.nome === filtroOficina;
    return matchOficina;
  });

  return (
    <PoloResponsavelShell
      title="Atividades e Turmas do Polo"
      description={`Modalidades e turmas ativas no ${poloNome}. Cada turma possui seu controle de vagas e instrutor responsável.`}
    >
      <div className="space-y-6">
        {/* Barra de Filtros: Oficina e Período */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-4 rounded-2xl border border-border shadow-xs">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold uppercase text-muted-foreground whitespace-nowrap">
              Filtrar Oficina:
            </span>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground w-full sm:w-64"
              value={filtroOficina}
              onChange={(e) => setFiltroOficina(e.target.value)}
            >
              <option value="todas">Todas as Oficinas</option>
              {rawAtividades.map((a) => (
                <option key={a.id} value={a.nome}>
                  {a.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto text-xs">
            <span className="font-bold text-muted-foreground uppercase text-[11px]">Período:</span>
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <span className="text-muted-foreground font-medium">De:</span>
              <input
                type="date"
                className="h-9 rounded-md border border-input bg-background px-2 font-medium text-xs text-foreground"
                value={dataDe}
                onChange={(e) => setDataDe(e.target.value)}
              />
              <span className="text-muted-foreground font-medium">Até:</span>
              <input
                type="date"
                className="h-9 rounded-md border border-input bg-background px-2 font-medium text-xs text-foreground"
                value={dataAte}
                onChange={(e) => setDataAte(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Grid de Cards de Atividades Separadas por Turma */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {atividadesFiltradas.map((ativ) => {
            const pMatch = solicitacoes.find((s) => {
              const ativMatch =
                cleanStr(s.atividadeNome).includes(cleanStr(ativ.nome)) ||
                cleanStr(ativ.nome).includes(cleanStr(s.atividadeNome));
              if (!ativMatch) return false;

              if (s.turmaNome) {
                const sTurmaClean = cleanStr(s.turmaNome);
                const ativTurmaClean = cleanStr(ativ.turmaNome);

                if (sTurmaClean.includes("2") || sTurmaClean.includes("t2") || sTurmaClean.includes("tardeb")) {
                  return ativTurmaClean.includes("2");
                }
                if (sTurmaClean.includes("1") || sTurmaClean.includes("t1") || sTurmaClean.includes("tardea")) {
                  return ativTurmaClean.includes("1");
                }
              }

              return cleanStr(ativ.turmaNome).includes("1");
            });

            return (
              <Card key={ativ.id} className="border-border shadow-xs flex flex-col justify-between">
                <CardHeader className="pb-3 border-b border-border/60">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="font-bold text-xs">
                      {poloNome}
                    </Badge>
                    <Badge className="bg-emerald-500/10 text-emerald-700 font-bold border-emerald-500/20">
                      <CheckCircle2 className="size-3 mr-1" /> Ativa
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-extrabold mt-2 text-foreground flex items-center justify-between">
                    <span>{ativ.nome}</span>
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-lg border border-primary/20">
                      {ativ.turmaNome}
                    </span>
                  </CardTitle>

                  {/* Section Instrutor com Aprovação e Recusa */}
                  {(() => {
                    if (pMatch && pMatch.status === "pendente") {
                      return (
                        <div className="mt-3 p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 tracking-wider">
                              Solicitação de Professor
                            </span>
                            <Badge className="bg-amber-500/20 text-amber-800 dark:text-amber-300 font-extrabold text-[9px] px-1.5 py-0.5">
                              Pendente
                            </Badge>
                          </div>
                          <p className="text-xs font-extrabold text-foreground">
                            {pMatch.professorNome}
                          </p>
                          <div className="flex items-center gap-2 pt-1">
                            <Button
                              size="sm"
                              className="h-8 flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                              onClick={() => handleAprovarProfessor(pMatch.id, pMatch.professorNome, ativ.nome)}
                            >
                              <UserCheck className="size-3.5 mr-1" /> Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-8 flex-1 font-bold text-xs shadow-xs"
                              onClick={() => handleRecusarProfessor(pMatch.id, pMatch.professorNome)}
                            >
                              <UserX className="size-3.5 mr-1" /> Recusar
                            </Button>
                          </div>
                        </div>
                      );
                    }

                    if (pMatch && pMatch.status === "aprovado") {
                      return (
                        <div className="mt-2 flex items-center justify-between">
                          <p className="text-xs text-muted-foreground font-medium">
                            Instrutor: <span className="font-extrabold text-foreground">{pMatch.professorNome}</span>
                          </p>
                          <Badge className="bg-emerald-500/10 text-emerald-700 font-bold border-emerald-500/20 text-[10px]">
                            ✓ Vinculado
                          </Badge>
                        </div>
                      );
                    }

                    return (
                      <p className="text-xs text-muted-foreground font-medium mt-2">
                        Instrutor: <span className="italic text-muted-foreground/60">(Em aberto)</span>
                      </p>
                    );
                  })()}
                </CardHeader>

                <CardContent className="pt-4 space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-2 bg-muted/30 p-3 rounded-xl border border-border/60">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Beneficiários</span>
                      <span className="font-extrabold text-foreground text-sm flex items-center gap-1">
                        <Users className="size-3.5 text-primary" /> {ativ.alunos} / {ativ.vagas}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Turmas</span>
                      <span className="font-extrabold text-foreground text-sm flex items-center gap-1">
                        <Clock className="size-3.5 text-primary" /> 1 turma
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground">
                      Turma e Horário
                    </span>
                    <div className="p-2 rounded-lg bg-background border border-border text-foreground font-medium">
                      {ativ.turmaDetalhe}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-950 space-y-1">
                    <span className="font-bold flex items-center gap-1 text-[11px]">
                      <Calendar className="size-3.5 text-orange-600" /> PERÍODO DA ATIVIDADE
                    </span>
                    <div className="flex justify-between text-[11px] font-medium pt-0.5">
                      <span>Matrículas: <b>{ativ.periodoMatricula}</b></span>
                    </div>
                    <div className="flex justify-between text-[11px] font-medium">
                      <span>Atividade: <b>{ativ.periodoAtividade}</b></span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </PoloResponsavelShell>
  );
}

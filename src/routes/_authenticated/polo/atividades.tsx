import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Users,
  Clock,
  Calendar,
  CheckCircle2,
  UserCheck,
  UserX,
  Eye,
  FileText,
  Loader2,
  Archive,
  AlertTriangle,
  FileCheck2,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export interface ProfessorSolicitacao {
  id: string;
  professorNome: string;
  email?: string;
  atividadeNome: string;
  turmaNome?: string;
  poloNome: string;
  status: "pendente" | "aprovado" | "recusado";
  dataSolicitacao?: string;
  docIdName?: string | null;
  docResName?: string | null;
  docFuncName?: string | null;
  cert1Name?: string | null;
  cert2Name?: string | null;
  cert3Name?: string | null;
  cert4Name?: string | null;
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
    if (!item) continue;
    const pName = item.professorNome || item.email || "prof";
    const aName = item.atividadeNome || "ativ";
    const tName = item.turmaNome || "";
    const key = `${cleanStr(pName)}-${cleanStr(aName)}-${cleanStr(tName)}`;
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

  const [selectedSolicitacao, setSelectedSolicitacao] = useState<ProfessorSolicitacao | null>(null);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  const [alunosLista] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem("cufa_alunos_polo");
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  });

  const defaultSolicitacao: ProfessorSolicitacao = {
    id: "solic-vitoria-jiujitsu",
    professorNome: "Prof. Vitoria Santana",
    email: "profvitoriasantana@cufa.com.br",
    atividadeNome: "Jiu Jitsu",
    turmaNome: "Turma 1",
    poloNome: "Complexo da Penha",
    status: "pendente",
    dataSolicitacao: new Date().toISOString().slice(0, 10),
  };

  const [solicitacoes, setSolicitacoes] = useState<ProfessorSolicitacao[]>(() => {
    try {
      const stored = localStorage.getItem("cufa_professores_solicitacoes");
      if (stored) {
        const list = JSON.parse(stored);
        if (Array.isArray(list) && list.length > 0) {
          const deduped = deduplicateRequests(list);
          localStorage.setItem("cufa_professores_solicitacoes", JSON.stringify(deduped));
          return deduped;
        }
      }
    } catch {}
    localStorage.setItem("cufa_professores_solicitacoes", JSON.stringify([defaultSolicitacao]));
    return [defaultSolicitacao];
  });

  useEffect(() => {
    function syncProfessores() {
      try {
        const stored = localStorage.getItem("cufa_professores_solicitacoes");
        if (stored) {
          const list = JSON.parse(stored);
          if (Array.isArray(list) && list.length > 0) {
            const deduped = deduplicateRequests(list);
            setSolicitacoes(deduped);
            return;
          }
        }
      } catch {}
      setSolicitacoes([defaultSolicitacao]);
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

  function handleDownloadZip(solic: ProfessorSolicitacao) {
    setIsDownloadingZip(true);
    setTimeout(() => {
      setIsDownloadingZip(false);
      const content = `PACOTE DE DOCUMENTAÇÃO CUFA DE HOMOLOGAÇÃO\n===========================================\nProfessor: ${solic.professorNome}\nE-mail: ${solic.email || "santana@cufa.com.br"}\nModalidade: ${solic.atividadeNome}\nTurma: ${solic.turmaNome || "Turma 1"}\nUnidade: ${solic.poloNome}\nData: ${solic.dataSolicitacao || "Hoje"}\n\nDocumentos inclusos:\n- Documento de Identificacao (RG/CPF)\n- Comprovante de Residencia`;
      const blob = new Blob([content], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `documentos_${cleanStr(solic.professorNome)}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Download do arquivo ZIP finalizado!");
    }, 1500);
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
          dias: "Segundas e Quartas",
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
          horarios: "15:30 - 17h",
          turmas: ["Turma 1 - Tarde 15:30 - 17h (40 vagas)"],
          vagas: 40,
          periodoMatricula: "01/08/2026 a 31/08/2026",
          periodoAtividade: "01/09/2026 a 31/01/2027",
        },
      ]
    : isMadureira
    ? [
        {
          id: "m1",
          nome: "Corte e Costura",
          dias: "Segundas e Quartas",
          horarios: "14h - 16h",
          turmas: ["Turma 1 - Tarde 14h - 16h (16 vagas)"],
          vagas: 16,
          periodoMatricula: "01/08/2026 a 31/08/2026",
          periodoAtividade: "01/09/2026 a 31/01/2027",
        },
        {
          id: "m2",
          nome: "Futsal",
          dias: "Segundas e Quartas",
          horarios: "14h - 16h",
          turmas: ["Turma 1 - Tarde 14h - 16h (40 vagas)"],
          vagas: 40,
          periodoMatricula: "01/08/2026 a 31/08/2026",
          periodoAtividade: "01/09/2026 a 31/01/2027",
        },
      ]
    : [
        {
          id: "p1",
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
            // Read latest list directly from localStorage to catch new candidacies instantly
            let currentList: ProfessorSolicitacao[] = solicitacoes;
            try {
              const rawStored = localStorage.getItem("cufa_professores_solicitacoes");
              if (rawStored) {
                const parsed = JSON.parse(rawStored);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  currentList = parsed;
                }
              }
            } catch {}

            // Find pending requests matching this specific activity AND turma
            const pendingForAtiv = currentList.filter((s) => {
              if (!s || s.status !== "pendente") return false;
              const sAtiv = cleanStr(s.atividadeNome);
              const aAtiv = cleanStr(ativ.nome);
              if (!sAtiv.includes(aAtiv) && !aAtiv.includes(sAtiv)) return false;

              const sTurma = cleanStr(s.turmaNome);
              const aTurma = cleanStr(ativ.turmaNome);

              if (sTurma.includes("2") || sTurma.includes("t2")) {
                return aTurma.includes("2");
              }
              if (sTurma.includes("1") || sTurma.includes("t1")) {
                return aTurma.includes("1");
              }
              return aTurma.includes("1") || aTurma.length === 0;
            });

            // Find approved request matching THIS specific turma ONLY (not all turmas of activity)
            const approvedForAtiv = currentList.find((s) => {
              if (!s || s.status !== "aprovado") return false;
              const sAtiv = cleanStr(s.atividadeNome);
              const aAtiv = cleanStr(ativ.nome);
              if (!sAtiv.includes(aAtiv) && !aAtiv.includes(sAtiv)) return false;

              const sTurma = cleanStr(s.turmaNome);
              const aTurma = cleanStr(ativ.turmaNome);

              if (sTurma.includes("2") || sTurma.includes("t2")) {
                return aTurma.includes("2");
              }
              if (sTurma.includes("1") || sTurma.includes("t1")) {
                return aTurma.includes("1");
              }
              return aTurma.includes("1") || aTurma.length === 0;
            });

            // Pick latest pending request if available, otherwise approved request for this specific turma
            let pMatch: ProfessorSolicitacao | undefined =
              pendingForAtiv.length > 0
                ? pendingForAtiv[pendingForAtiv.length - 1]
                : approvedForAtiv;

            // Fallback for Jiu Jitsu Turma 1 if pending request exists in system
            if (!pMatch && ativ.nome === "Jiu Jitsu" && ativ.turmaNome === "Turma 1") {
              pMatch = defaultSolicitacao;
            }

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

                  {/* Section Instrutor com Botão Analisar ou Status */}
                  {(() => {
                    if (pMatch && pMatch.status === "pendente") {
                      return (
                        <div className="mt-3 p-3.5 rounded-2xl border-2 border-amber-500/50 bg-amber-500/10 space-y-2 shadow-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 tracking-wider">
                              Solicitação de Professor
                            </span>
                            <Badge className="bg-amber-500 text-slate-950 font-black text-[9px] px-2 py-0.5 shadow-xs">
                              Pendente de Aprovação
                            </Badge>
                          </div>
                          <p className="text-xs font-black text-foreground truncate">
                            {pMatch.professorNome || "Prof. Santana Silva"}
                          </p>
                          <Button
                            size="sm"
                            className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs h-9 shadow-md transition-all active:scale-[0.98] mt-1"
                            onClick={() => setSelectedSolicitacao(pMatch)}
                          >
                            <Eye className="size-4 mr-1.5" /> ANALISAR SOLICITAÇÃO (APROVAR / RECUSAR)
                          </Button>
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

      {/* Modal de Análise Completa do Professor */}
      <Dialog open={!!selectedSolicitacao} onOpenChange={(open) => !open && setSelectedSolicitacao(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <Avatar className="size-12 border-2 border-primary/30">
                <AvatarFallback className="bg-primary/10 text-primary font-black text-lg">
                  {selectedSolicitacao?.professorNome?.slice(0, 2).toUpperCase() || "VS"}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-xl font-extrabold text-foreground">
                  Análise de Candidatura — {selectedSolicitacao?.professorNome}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Solicitação para ministrar <b>{selectedSolicitacao?.atividadeNome}</b> ({selectedSolicitacao?.turmaNome || "Turma 1"}) — Unidade {selectedSolicitacao?.poloNome || poloNome}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedSolicitacao && (
            <div className="space-y-5 pt-2">
              {/* Seção 1: Dados Pessoais & Qualificação */}
              <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <UserCheck className="size-4" /> Informações Pessoais & Qualificação
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Nome Completo</span>
                    <span className="font-bold text-foreground text-sm">{selectedSolicitacao.professorNome}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">E-mail de Login</span>
                    <span className="font-bold text-foreground">{selectedSolicitacao.email || "santana@cufa.com.br"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Telefone / WhatsApp</span>
                    <span className="font-bold text-foreground">(11) 98765-4321</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Data da Solicitação</span>
                    <span className="font-bold text-foreground">{selectedSolicitacao.dataSolicitacao || "Hoje"}</span>
                  </div>
                  <div className="sm:col-span-2 pt-1 border-t border-border/40">
                    <span className="text-muted-foreground block text-[11px]">Formação / Graduação</span>
                    <span className="font-bold text-foreground">Graduação em Educação Física & Faixa Preta de Jiu-Jitsu (CBJJ) com experiência em projetos comunitários.</span>
                  </div>
                </div>
              </div>

              {/* Seção 2: Pacote de Download ZIP Unificado & Lista de Documentos */}
              <div className="p-4 rounded-2xl bg-card border border-border space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/30">
                  <div>
                    <p className="font-extrabold text-xs text-foreground flex items-center gap-1.5">
                      <Archive className="size-4 text-orange-600" /> Pacote de Documentos para Homologação
                    </p>
                    <p className="text-[11px] text-muted-foreground">Baixar todos os documentos recebidos em um único arquivo comprimido (.ZIP).</p>
                  </div>

                  <Button
                    disabled={isDownloadingZip}
                    onClick={() => handleDownloadZip(selectedSolicitacao)}
                    className="bg-brand-gradient text-xs font-black h-10 px-4 shadow-brand shrink-0 w-full sm:w-auto"
                  >
                    {isDownloadingZip ? (
                      <>
                        <Loader2 className="size-4 animate-spin mr-2" /> Baixando ZIP...
                      </>
                    ) : (
                      <>
                        <Archive className="size-4 mr-2" /> Baixar Tudo em ZIP
                      </>
                    )}
                  </Button>
                </div>

                <div className="space-y-3 pt-1">
                  <h5 className="text-[11px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <FileCheck2 className="size-3.5 text-emerald-600" /> Documentos Enviados
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        <FileCheck2 className="size-4 text-emerald-600 shrink-0" />
                        <div className="truncate">
                          <p className="font-bold text-foreground truncate">Documento RG / CPF</p>
                          <p className="text-[10px] text-emerald-700 font-medium">rg_cpf_santana.pdf (Enviado)</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        <FileCheck2 className="size-4 text-emerald-600 shrink-0" />
                        <div className="truncate">
                          <p className="font-bold text-foreground truncate">Comprovante de Residência</p>
                          <p className="text-[10px] text-emerald-700 font-medium">comprovante_residencia.pdf (Enviado)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-1 border-t border-border/60">
                  <h5 className="text-[11px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <AlertTriangle className="size-3.5 text-amber-600" /> Documentos Faltantes / Não Enviados
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 flex items-center gap-2 text-amber-800 dark:text-amber-300">
                      <AlertTriangle className="size-4 text-amber-600 shrink-0" />
                      <div className="truncate">
                        <p className="font-bold text-foreground truncate">Registro Funcional / CREF</p>
                        <p className="text-[10px] text-amber-700 font-medium">Não anexado pelo professor</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 flex items-center gap-2 text-amber-800 dark:text-amber-300">
                      <AlertTriangle className="size-4 text-amber-600 shrink-0" />
                      <div className="truncate">
                        <p className="font-bold text-foreground truncate">Certificado de Especialização</p>
                        <p className="text-[10px] text-amber-700 font-medium">Não anexado pelo professor</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção 3: Botões de Decisão */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-border">
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs h-10 shadow-md"
                  onClick={() => {
                    handleAprovarProfessor(selectedSolicitacao.id, selectedSolicitacao.professorNome, selectedSolicitacao.atividadeNome);
                    setSelectedSolicitacao(null);
                  }}
                >
                  <UserCheck className="size-4 mr-1.5" /> Aprovar e Vincular Professor
                </Button>

                <Button
                  variant="destructive"
                  className="flex-1 font-extrabold text-xs h-10 shadow-md"
                  onClick={() => {
                    handleRecusarProfessor(selectedSolicitacao.id, selectedSolicitacao.professorNome);
                    setSelectedSolicitacao(null);
                  }}
                >
                  <UserX className="size-4 mr-1.5" /> Recusar Solicitação
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PoloResponsavelShell>
  );
}

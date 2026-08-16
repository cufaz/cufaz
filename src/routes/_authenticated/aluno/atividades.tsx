import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Compass,
  Building2,
  Users,
  Clock,
  UserCheck,
  CheckCircle2,
  Search,
  Loader2,
  PlusCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AlunoShell } from "@/components/aluno/AlunoShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InscricaoAluno } from "./index";

export const Route = createFileRoute("/_authenticated/aluno/atividades")({
  component: VitrineAtividadesAlunoPage,
});

export interface VitrineCardItem {
  id: string;
  nome: string;
  polo: string;
  turmaNome: string;
  horario: string;
  professorNome?: string | null | undefined;
  vagasTotais: number;
  alunosMatriculados: number;
}

function cleanStr(str: string = "") {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function VitrineAtividadesAlunoPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filtroPolo, setFiltroPolo] = useState("todos");
  const [filtroOficina, setFiltroOficina] = useState("todas");
  const [alunoEmail, setAlunoEmail] = useState("");
  const [myInscricoes, setMyInscricoes] = useState<string[]>([]);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  // Default Vitrine Items across Polos
  const defaultVitrine: VitrineCardItem[] = [
    {
      id: "v-penha-jiu-t1",
      nome: "Jiu Jitsu",
      polo: "Complexo da Penha",
      turmaNome: "Turma 1 - Tarde (14h - 16h)",
      horario: "Seg, Quat e Sex - 14:00 às 16:00",
      professorNome: "Prof.ª Santana Silva",
      vagasTotais: 40,
      alunosMatriculados: 0,
    },
    {
      id: "v-penha-jiu-t2",
      nome: "Jiu Jitsu",
      polo: "Complexo da Penha",
      turmaNome: "Turma 2 - Tarde (16h - 18h)",
      horario: "Seg, Quat e Sex - 16:00 às 18:00",
      professorNome: "Prof.ª Santana Silva",
      vagasTotais: 40,
      alunosMatriculados: 0,
    },
    {
      id: "v-penha-ingles",
      nome: "Aula de Inglês",
      polo: "Complexo da Penha",
      turmaNome: "Turma 1 - Manhã (09h - 11h)",
      horario: "Ter e Qui - 09:00 às 11:00",
      professorNome: "Aguardando Instrutor",
      vagasTotais: 30,
      alunosMatriculados: 0,
    },
    {
      id: "v-madureira-natacao",
      nome: "Natação",
      polo: "Viaduto de Madureira",
      turmaNome: "Turma 1 - Tarde (14h - 16h)",
      horario: "Seg e Quat - 14:00 às 16:00",
      professorNome: "Aguardando Instrutor",
      vagasTotais: 25,
      alunosMatriculados: 0,
    },
    {
      id: "v-madureira-karate",
      nome: "Karatê",
      polo: "Viaduto de Madureira",
      turmaNome: "Turma 1 - Noite (18h - 20h)",
      horario: "Ter e Qui - 18:00 às 20:00",
      professorNome: "Aguardando Instrutor",
      vagasTotais: 35,
      alunosMatriculados: 0,
    },
    {
      id: "v-paraisopolis-costura",
      nome: "Corte e Costura",
      polo: "Paraisópolis",
      turmaNome: "Turma 1 - Manhã (08h - 11h)",
      horario: "Seg a Sex - 08:00 às 11:00",
      professorNome: "Aguardando Instrutor",
      vagasTotais: 20,
      alunosMatriculados: 0,
    },
    {
      id: "v-paraisopolis-futsal",
      nome: "Futsal",
      polo: "Paraisópolis",
      turmaNome: "Turma 1 - Tarde (15h - 17h)",
      horario: "Ter, Qui e Sáb - 15:00 às 17:00",
      professorNome: "Aguardando Instrutor",
      vagasTotais: 40,
      alunosMatriculados: 0,
    },
  ];

  function loadInscricoesState() {
    const uEmail = localStorage.getItem("cufa_logged_user") || "aluno@cufa.com.br";
    setAlunoEmail(uEmail);

    try {
      const stored = localStorage.getItem(`cufa_aluno_inscricoes_${uEmail}`);
      if (stored) {
        const parsed: InscricaoAluno[] = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setMyInscricoes(parsed.filter((i) => i.status === "ativa").map((i) => i.atividadeId));
        }
      }
    } catch {}
  }

  useEffect(() => {
    loadInscricoesState();
    window.addEventListener("cufa_aluno_inscricoes_updated", loadInscricoesState);
    return () => {
      window.removeEventListener("cufa_aluno_inscricoes_updated", loadInscricoesState);
    };
  }, []);

  function handleInscrever(item: VitrineCardItem) {
    if (!alunoEmail) {
      toast.error("Faça login para se inscrever.");
      return;
    }

    setSubmittingId(item.id);
    setTimeout(() => {
      try {
        const stored = localStorage.getItem(`cufa_aluno_inscricoes_${alunoEmail}`);
        let list: InscricaoAluno[] = stored ? JSON.parse(stored) : [];

        // Check if already enrolled
        if (list.some((i) => i.atividadeId === item.id && i.status === "ativa")) {
          toast.info("Você já está matriculado nesta turma!");
          setSubmittingId(null);
          return;
        }

        const novaInsc: InscricaoAluno = {
          id: `insc-${Date.now()}`,
          atividadeId: item.id,
          atividadeNome: item.nome,
          poloNome: item.polo,
          turmaNome: item.turmaNome,
          professorNome: item.professorNome,
          horario: item.horario,
          dataMatricula: new Date().toLocaleDateString("pt-BR"),
          status: "ativa",
        };

        list.push(novaInsc);
        localStorage.setItem(`cufa_aluno_inscricoes_${alunoEmail}`, JSON.stringify(list));
        window.dispatchEvent(new Event("cufa_aluno_inscricoes_updated"));

        toast.success(`Matrícula efetuada com sucesso na oficina ${item.nome}!`, {
          description: `Unidade: ${item.polo} | ${item.turmaNome}`,
        });
      } catch {
        toast.error("Erro ao realizar inscrição.");
      } finally {
        setSubmittingId(null);
      }
    }, 800);
  }

  const vitrineFiltrada = defaultVitrine.filter((item) => {
    const matchSearch =
      !searchQuery ||
      cleanStr(item.nome).includes(cleanStr(searchQuery)) ||
      cleanStr(item.polo).includes(cleanStr(searchQuery)) ||
      cleanStr(item.professorNome || "").includes(cleanStr(searchQuery));

    const matchPolo = filtroPolo === "todos" || cleanStr(item.polo).includes(cleanStr(filtroPolo));
    const matchOficina = filtroOficina === "todas" || cleanStr(item.nome).includes(cleanStr(filtroOficina));

    return matchSearch && matchPolo && matchOficina;
  });

  return (
    <AlunoShell
      title="Vitrine de Atividades e Vagas Disponíveis"
      description="Escolha livremente as oficinas e modalidades de seu interesse em qualquer um dos polos oficiais da CUFA."
    >
      <div className="space-y-6">
        {/* Barra de Filtros Inteligentes */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border shadow-xs">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar oficina, polo ou professor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-muted-foreground uppercase whitespace-nowrap">Polo:</span>
              <select
                value={filtroPolo}
                onChange={(e) => setFiltroPolo(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-xs font-bold text-foreground w-full sm:w-48"
              >
                <option value="todos">Todos os Polos</option>
                <option value="penha">Complexo da Penha</option>
                <option value="madureira">Viaduto de Madureira</option>
                <option value="paraisopolis">Paraisópolis</option>
              </select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-muted-foreground uppercase whitespace-nowrap">Oficina:</span>
              <select
                value={filtroOficina}
                onChange={(e) => setFiltroOficina(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-xs font-bold text-foreground w-full sm:w-48"
              >
                <option value="todas">Todas as Oficinas</option>
                <option value="jiu">Jiu Jitsu</option>
                <option value="ingles">Aula de Inglês</option>
                <option value="natacao">Natação</option>
                <option value="karate">Karatê</option>
                <option value="costura">Corte e Costura</option>
                <option value="futsal">Futsal</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quadro da Vitrine de Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vitrineFiltrada.map((item) => {
            const isEnrolled = myInscricoes.includes(item.id);
            const isSubmitting = submittingId === item.id;

            return (
              <Card key={item.id} className="border-border bg-card shadow-xs hover:border-primary/50 transition-colors flex flex-col justify-between">
                <CardHeader className="pb-3 border-b border-border/60">
                  <div className="flex items-start justify-between gap-2">
                    <Badge className="bg-primary/10 text-primary font-extrabold border-primary/20 text-xs">
                      {item.nome}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] font-bold border-primary/30 bg-primary/5 text-foreground">
                      <Building2 className="size-3 mr-1 text-primary" /> {item.polo}
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-extrabold text-foreground mt-2">
                    {item.turmaNome}
                  </CardTitle>
                </CardHeader>

                <CardContent className="pt-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                      <Clock className="size-3.5 text-primary shrink-0" />
                      <span>{item.horario}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                      <UserCheck className="size-3.5 text-emerald-600 shrink-0" />
                      <span>Instrutor: <strong>{item.professorNome || "Aguardando Instrutor"}</strong></span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                      <Users className="size-3.5 text-primary shrink-0" />
                      <span>Vagas: <strong>{item.vagasTotais} vagas disponíveis</strong></span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/60">
                    {isEnrolled ? (
                      <Button
                        disabled
                        variant="outline"
                        className="w-full text-xs font-bold border-emerald-500/40 bg-emerald-500/10 text-emerald-600 h-9"
                      >
                        <CheckCircle2 className="size-4 mr-1.5" /> Você já está Matriculado
                      </Button>
                    ) : (
                      <Button
                        disabled={isSubmitting}
                        onClick={() => handleInscrever(item)}
                        className="w-full bg-brand-gradient text-primary-foreground font-bold text-xs shadow-brand h-9"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="size-3.5 animate-spin mr-1.5" /> Efetuando Matrícula...
                          </>
                        ) : (
                          <>
                            <PlusCircle className="size-3.5 mr-1.5" /> Inscrever-se nesta Oficina
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AlunoShell>
  );
}

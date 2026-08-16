import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, MapPin, Users, Send, Clock, Calendar } from "lucide-react";
import { toast } from "sonner";
import { ProfessorShell } from "@/components/professor/ProfessorShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/professor/oportunidades")({
  component: ProfessorOportunidadesPage,
});

interface VagaAtividade {
  id: string;
  nome: string;
  turma: string;
  horario: string;
  polo: string;
  vagas: number;
  descricao: string;
}

export function ProfessorOportunidadesPage() {
  const [profNome] = useState(() => localStorage.getItem("cufa_professor_nome") || "Prof. Instrutor");
  const [profEmail] = useState(() => localStorage.getItem("cufa_logged_user") || "professor@cufa.com.br");

  // Read already requested activities
  const [solicitadas, setSolicitadas] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("cufa_professores_solicitacoes");
      if (stored) {
        const list = JSON.parse(stored);
        return list.map((item: any) => `${item.poloNome}-${item.atividadeNome}-${item.turmaNome || ""}`);
      }
    } catch {}
    return [];
  });

  // Base list of opportunities per Turma & Horario
  const baseOportunidades: VagaAtividade[] = [
    {
      id: "op-penha-jiujitsu-t1",
      nome: "Jiu Jitsu",
      turma: "Turma 1 — Tarde",
      horario: "Segundas e Quartas (14h - 16h)",
      polo: "Complexo da Penha",
      vagas: 40,
      descricao: "Iniciação ao Jiu Jitsu e defesa pessoal para turmas de crianças e jovens.",
    },
    {
      id: "op-penha-jiujitsu-t2",
      nome: "Jiu Jitsu",
      turma: "Turma 2 — Tarde",
      horario: "Terças e Quintas (16h - 18h)",
      polo: "Complexo da Penha",
      vagas: 40,
      descricao: "Treinamento técnico de Jiu Jitsu para categorias intermediárias.",
    },
    {
      id: "op-penha-ingles-t1",
      nome: "Aula de Inglês",
      turma: "Turma 1 — Tarde",
      horario: "Segundas e Quartas (14h - 16h)",
      polo: "Complexo da Penha",
      vagas: 30,
      descricao: "Aulas de inglês comunitário e conversação básica no Complexo da Penha.",
    },
    {
      id: "op-penha-natacao-t1",
      nome: "Natação",
      turma: "Turma 1 — Tarde",
      horario: "Terças e Quintas (15:30 - 17h)",
      polo: "Complexo da Penha",
      vagas: 40,
      descricao: "Iniciação aquática e natação comunitária.",
    },
    {
      id: "op-mad-costura-t1",
      nome: "Corte e Costura",
      turma: "Turma 1 — Tarde",
      horario: "Segundas e Quartas (14h - 16h)",
      polo: "Viaduto de Madureira",
      vagas: 16,
      descricao: "Oficina de capacitação profissional em corte e costura em Madureira.",
    },
    {
      id: "op-mad-futsal-t1",
      nome: "Futsal",
      turma: "Turma 1 — Tarde",
      horario: "Segundas e Quartas (14h - 16h)",
      polo: "Viaduto de Madureira",
      vagas: 40,
      descricao: "Treinamento de Futsal comunitário para categorias de base.",
    },
    {
      id: "op-mad-basquete-t1",
      nome: "Basquete",
      turma: "Turma 1 — Tarde",
      horario: "Terças e Quintas (16h - 18h)",
      polo: "Viaduto de Madureira",
      vagas: 25,
      descricao: "Aulas de basquete no polo Madureira.",
    },
    {
      id: "op-par-karate-t1",
      nome: "Karatê",
      turma: "Turma 1 — Tarde",
      horario: "Segundas e Quartas (14h - 16h)",
      polo: "Paraisópolis",
      vagas: 30,
      descricao: "Artes marciais e disciplina de Karatê em Paraisópolis.",
    },
  ];

  // Include dynamic test polos created in the system
  const dynamicOportunidades = (() => {
    const list = [...baseOportunidades];
    try {
      const storedPolos = localStorage.getItem("cufa_polos");
      if (storedPolos) {
        const polosList = JSON.parse(storedPolos);
        polosList.forEach((p: any) => {
          const nomePolo = p.nome || p;
          if (
            typeof nomePolo === "string" &&
            !list.some((op) => op.polo.toLowerCase() === nomePolo.toLowerCase())
          ) {
            list.push({
              id: `op-custom-${nomePolo.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
              nome: "Oficina de Esportes & Cultura",
              turma: "Turma Geral 1",
              horario: "Segundas e Quartas (14h - 16h)",
              polo: nomePolo,
              vagas: 30,
              descricao: `Vaga aberta para instrutor responsável na unidade ${nomePolo}.`,
            });
          }
        });
      }
    } catch {}
    return list;
  })();

  // Read approved activities to exclude from open opportunities
  const aprovadas = (() => {
    try {
      const stored = localStorage.getItem("cufa_professores_solicitacoes");
      if (stored) {
        const list = JSON.parse(stored);
        return list
          .filter((item: any) => item.status === "aprovado")
          .map((item: any) => `${item.poloNome}-${item.atividadeNome}-${item.turmaNome || ""}`);
      }
    } catch {}
    return [];
  })();

  const oportunidadesDisponiveis = dynamicOportunidades.filter(
    (vaga) => !aprovadas.includes(`${vaga.polo}-${vaga.nome}-${vaga.turma}`)
  );

  function handleCandidatar(vaga: VagaAtividade) {
    const key = `${vaga.polo}-${vaga.nome}-${vaga.turma}`;
    if (solicitadas.includes(key)) {
      toast.info("Você já se candidatou a esta turma específica.");
      return;
    }

    const novaSolicitacao = {
      id: `solic-${Date.now()}`,
      professorNome: profNome,
      email: profEmail,
      atividadeNome: vaga.nome,
      turmaNome: vaga.turma,
      poloNome: vaga.polo,
      status: "pendente",
      dataSolicitacao: new Date().toISOString().slice(0, 10),
    };

    try {
      const stored = localStorage.getItem("cufa_professores_solicitacoes");
      let list = stored ? JSON.parse(stored) : [];
      list.push(novaSolicitacao);
      localStorage.setItem("cufa_professores_solicitacoes", JSON.stringify(list));
      window.dispatchEvent(new Event("cufa_professores_updated"));
    } catch {}

    setSolicitadas((prev) => [...prev, key]);

    toast.success("Candidatura realizada com sucesso!", {
      description: `Sua solicitação para a ${vaga.turma} de ${vaga.nome} no polo ${vaga.polo} foi enviada para o responsável.`,
    });
  }

  return (
    <ProfessorShell
      title="Vagas & Oportunidades por Turma"
      description="Veja as turmas e horários disponíveis sem instrutor responsável e se candidate para lecionar."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {oportunidadesDisponiveis.length === 0 ? (
          <div className="col-span-full p-8 text-center border border-dashed border-border rounded-2xl bg-card">
            <p className="text-sm text-muted-foreground font-medium">
              Todas as turmas para ministrar já foram preenchidas no momento.
            </p>
          </div>
        ) : (
          oportunidadesDisponiveis.map((vaga) => {
            const key = `${vaga.polo}-${vaga.nome}-${vaga.turma}`;
            const jaCandidatado = solicitadas.includes(key);

            return (
              <Card key={vaga.id} className="border-border shadow-xs flex flex-col justify-between">
                <CardHeader className="pb-3 border-b border-border/60">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
                      <Sparkles className="size-4 text-amber-500" />
                      <span>{vaga.nome}</span>
                    </CardTitle>
                    <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 font-bold text-[10px]">
                      Vaga Aberta
                    </Badge>
                  </div>
                  <p className="text-xs font-bold text-primary mt-1">
                    {vaga.turma}
                  </p>
                </CardHeader>
                <CardContent className="pt-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground font-semibold">
                      <MapPin className="size-3.5 text-primary shrink-0" />
                      <span>Unidade {vaga.polo}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground font-medium">
                      <Calendar className="size-3.5 text-primary shrink-0" />
                      <span>{vaga.horario}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="size-3.5 text-primary shrink-0" />
                      <span>Capacidade: {vaga.vagas} alunos por turma</span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed pt-1">{vaga.descricao}</p>
                  </div>

                  <div className="pt-3 border-t border-border/60">
                    {jaCandidatado ? (
                      <Button disabled variant="outline" className="w-full text-xs font-bold border-amber-500/30 text-amber-600 bg-amber-500/10">
                        <Clock className="size-3.5 mr-1.5" /> Candidatura Enviada
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleCandidatar(vaga)}
                        className="w-full bg-brand-gradient text-xs font-bold shadow-brand"
                      >
                        <Send className="size-3.5 mr-1.5" /> Candidatar-se a esta Turma
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </ProfessorShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, MapPin, Users, Send, CheckCircle2, Clock } from "lucide-react";
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
        return list.map((item: any) => `${item.poloNome}-${item.atividadeNome}`);
      }
    } catch {}
    return [];
  });

  const oportunidadesIniciais: VagaAtividade[] = [
    {
      id: "op-1",
      nome: "Basquete Esportivo",
      polo: "Viaduto de Madureira",
      vagas: 40,
      descricao: "Vaga para instrutor de Basquete com foco em iniciação esportiva para crianças e jovens.",
    },
    {
      id: "op-2",
      nome: "Dança & Expressão Corporal",
      polo: "Paraisópolis",
      vagas: 30,
      descricao: "Oficina cultural de dança urbana e ritmo. Aulas 2x por semana no período vespertino.",
    },
    {
      id: "op-3",
      nome: "Futsal Comunitário",
      polo: "Cidade de Deus",
      vagas: 50,
      descricao: "Treinamentos técnicos e táticos de Futsal para categorias de base masculinas e femininas.",
    },
    {
      id: "op-4",
      nome: "Natação e Hidroginástica",
      polo: "Complexo da Penha",
      vagas: 35,
      descricao: "Modalidade aquática inclusiva para jovens e adultos da comunidade.",
    },
    {
      id: "op-5",
      nome: "Teatro e Artes Cênicas",
      polo: "Viaduto de Madureira",
      vagas: 25,
      descricao: "Formação em interpretação e produção teatral para os alunos cadastrados no polo.",
    },
  ];

  function handleCandidatar(vaga: VagaAtividade) {
    const key = `${vaga.polo}-${vaga.nome}`;
    if (solicitadas.includes(key)) {
      toast.info("Você já se candidatou a esta modalidade.");
      return;
    }

    const novaSolicitacao = {
      id: `solic-${Date.now()}`,
      professorNome: profNome,
      email: profEmail,
      atividadeNome: vaga.nome,
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
      description: `Sua solicitação para ministrar ${vaga.nome} no polo ${vaga.polo} foi enviada para o responsável.`,
    });
  }

  return (
    <ProfessorShell
      title="Vagas & Oportunidades para Ministrar"
      description="Veja as modalidades sem professor responsável em outros polos e se candidate para lecionar."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {oportunidadesIniciais.map((vaga) => {
          const key = `${vaga.polo}-${vaga.nome}`;
          const jaCandidatado = solicitadas.includes(key);

          return (
            <Card key={vaga.id} className="border-border shadow-xs flex flex-col justify-between">
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
                    <Sparkles className="size-4 text-amber-500" />
                    {vaga.nome}
                  </CardTitle>
                  <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 font-bold">
                    Vaga Aberta
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground font-semibold">
                    <MapPin className="size-3.5 text-primary shrink-0" />
                    <span>Unidade {vaga.polo}</span>
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
                      <Send className="size-3.5 mr-1.5" /> Candidatar-se a esta Atividade
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ProfessorShell>
  );
}

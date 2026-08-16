import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BookOpen, Users, Clock, Calendar, CheckCircle2 } from "lucide-react";
import { PoloResponsavelShell } from "@/components/polo/PoloResponsavelShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/polo/atividades")({
  component: PoloAtividadesPage,
});

function PoloAtividadesPage() {
  const [poloNome] = useState(() => localStorage.getItem("cufa_polo_atribuido") || "Complexo da Penha");

  const isPenha = poloNome.toLowerCase().includes("penha");
  const isMadureira = poloNome.toLowerCase().includes("madureira");

  const atividades = isPenha
    ? [
        {
          id: "1",
          nome: "Jiu Jitsu",
          dias: "Segundas e Quartas",
          horarios: "14h - 16h",
          turmas: ["Turma 1 - Tarde 14h - 16h (40 vagas)", "Turma 2 - Tarde 16h - 18h (40 vagas)"],
          vagas: 80,
          alunos: 80,
          instrutor: "Prof. Marcos Faixa Preta",
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
          alunos: 30,
          instrutor: "Prof.ª Patricia Santos",
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
          alunos: 40,
          instrutor: "Prof. Marcelo Aquático",
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
          alunos: 16,
          instrutor: "Prof.ª Lucimar Moda",
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
          alunos: 40,
          instrutor: "Prof. Diego Futsal",
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
          alunos: 25,
          instrutor: "Prof. Anderson Basquete",
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
          alunos: 30,
          instrutor: "Prof. Sensei Renato",
          periodoMatricula: "01/08/2026 a 31/08/2026",
          periodoAtividade: "01/09/2026 a 31/01/2027",
        },
      ];

  return (
    <PoloResponsavelShell
      title="Atividades do Polo"
      description={`Modalidades esportivas, culturais e formativas ativas no ${poloNome}.`}
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {atividades.map((ativ) => (
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
              <CardTitle className="text-xl font-extrabold mt-2 text-foreground">
                {ativ.nome}
              </CardTitle>
              <p className="text-xs text-muted-foreground font-medium">
                Instrutor: {ativ.instrutor}
              </p>
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
                    <Clock className="size-3.5 text-primary" /> {ativ.turmas.length} turmas
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground">
                  Turmas e Horários
                </span>
                {ativ.turmas.map((t) => (
                  <div key={t} className="p-2 rounded-lg bg-background border border-border text-foreground font-medium">
                    {t}
                  </div>
                ))}
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
        ))}
      </div>
    </PoloResponsavelShell>
  );
}

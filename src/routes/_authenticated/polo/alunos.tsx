import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, UserCheck, Phone, Mail, BookOpen, CheckCircle2 } from "lucide-react";
import { PoloResponsavelShell } from "@/components/polo/PoloResponsavelShell";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/polo/alunos")({
  component: PoloAlunosPage,
});

export function PoloAlunosPage() {
  const [poloNome] = useState(() => localStorage.getItem("cufa_polo_atribuido") || "Complexo da Penha");
  const [busca, setBusca] = useState("");
  const [atividadeFiltro, setAtividadeFiltro] = useState("todas");

  const alunosMock = [
    { id: "1", nome: "Carlos Eduardo Silva", atividade: "Jiu Jitsu", idade: 14, responsavel: "Maria Silva", telefone: "(21) 98765-4321", status: "Ativa", dataMatricula: "02/08/2026" },
    { id: "2", nome: "Ana Clara Souza", atividade: "Aula de Inglês", idade: 16, responsavel: "João Souza", telefone: "(21) 98888-7777", status: "Ativa", dataMatricula: "05/08/2026" },
    { id: "3", nome: "Gabriel Santos", atividade: "Natação", idade: 12, responsavel: "Renata Santos", telefone: "(21) 99999-1111", status: "Ativa", dataMatricula: "06/08/2026" },
    { id: "4", nome: "Beatriz Oliveira", atividade: "Corte e Costura", idade: 22, responsavel: "Próprio", telefone: "(21) 97777-2222", status: "Ativa", dataMatricula: "08/08/2026" },
    { id: "5", nome: "Lucas Rodrigues", atividade: "Futsal", idade: 15, responsavel: "Fernando Rodrigues", telefone: "(21) 96666-3333", status: "Ativa", dataMatricula: "10/08/2026" },
    { id: "6", nome: "Mariana Costa", atividade: "Basquete", idade: 13, responsavel: "Camila Costa", telefone: "(21) 95555-4444", status: "Ativa", dataMatricula: "11/08/2026" },
    { id: "7", nome: "Pedro Henrique Lima", atividade: "Karatê", idade: 11, responsavel: "Sonia Lima", telefone: "(21) 94444-5555", status: "Ativa", dataMatricula: "12/08/2026" },
  ];

  const alunosFiltrados = alunosMock.filter((a) => {
    const matchBusca = a.nome.toLowerCase().includes(busca.toLowerCase()) || a.responsavel.toLowerCase().includes(busca.toLowerCase());
    const matchAtiv = atividadeFiltro === "todas" || a.atividade === atividadeFiltro;
    return matchBusca && matchAtiv;
  });

  return (
    <PoloResponsavelShell
      title="Alunos Matriculados"
      description={`Lista geral de alunos inscritos e contatos — Unidade ${poloNome}.`}
    >
      <div className="space-y-4">
        {/* Barra de Busca e Filtro de Atividade */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-4 rounded-2xl border border-border shadow-xs">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar aluno ou responsável..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9 font-medium"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold uppercase text-muted-foreground whitespace-nowrap">
              Filtrar Oficina:
            </span>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground w-full sm:w-auto"
              value={atividadeFiltro}
              onChange={(e) => setAtividadeFiltro(e.target.value)}
            >
              <option value="todas">Todas as Oficinas</option>
              <option value="Jiu Jitsu">Jiu Jitsu</option>
              <option value="Aula de Inglês">Aula de Inglês</option>
              <option value="Natação">Natação</option>
              <option value="Corte e Costura">Corte e Costura</option>
              <option value="Futsal">Futsal</option>
              <option value="Basquete">Basquete</option>
              <option value="Karatê">Karatê</option>
            </select>
          </div>
        </div>

        {/* Tabela de Alunos */}
        <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground font-bold">
                  <th className="py-3 px-4">Nome do Aluno</th>
                  <th className="py-3 px-4">Oficina / Modalidade</th>
                  <th className="py-3 px-4">Idade</th>
                  <th className="py-3 px-4">Responsável Legal</th>
                  <th className="py-3 px-4">Telefone / Whats</th>
                  <th className="py-3 px-4">Data Matrícula</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {alunosFiltrados.map((a) => (
                  <tr key={a.id} className="hover:bg-muted/30">
                    <td className="py-3.5 px-4 font-bold text-foreground flex items-center gap-2">
                      <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0">
                        {a.nome.slice(0, 2).toUpperCase()}
                      </span>
                      <span>{a.nome}</span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-foreground">
                      <Badge variant="outline" className="font-bold text-xs">
                        <BookOpen className="size-3 mr-1 text-primary" /> {a.atividade}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground font-medium">{a.idade} anos</td>
                    <td className="py-3.5 px-4 text-foreground font-semibold">{a.responsavel}</td>
                    <td className="py-3.5 px-4 text-muted-foreground font-medium flex items-center gap-1">
                      <Phone className="size-3.5 text-emerald-600" /> {a.telefone}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground font-medium">{a.dataMatricula}</td>
                    <td className="py-3.5 px-4 text-right">
                      <Badge className="bg-emerald-500/10 text-emerald-700 font-bold border-emerald-500/20">
                        <CheckCircle2 className="size-3 mr-1" /> {a.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PoloResponsavelShell>
  );
}

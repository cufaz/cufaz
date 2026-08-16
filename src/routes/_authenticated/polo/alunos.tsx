import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Search, UserCheck, Phone, Mail, BookOpen, CheckCircle2, ChevronLeft, ChevronRight, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { PoloResponsavelShell } from "@/components/polo/PoloResponsavelShell";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/polo/alunos")({
  component: PoloAlunosPage,
});

export function PoloAlunosPage() {
  const [poloNome] = useState(() => localStorage.getItem("cufa_polo_atribuido") || "Complexo da Penha");
  const [busca, setBusca] = useState("");
  const [atividadeFiltro, setAtividadeFiltro] = useState("todas");
  const [pagina, setPagina] = useState(1);
  const itensPorPagina = 20;

  function loadMergedPoloAlunosList() {
    const listMap = new Map<string, any>();
    const cleanPolo = poloNome.toLowerCase();

    // 1. Read registered students in platform
    try {
      const storedCad = localStorage.getItem("cufa_alunos_cadastrados");
      if (storedCad) {
        const parsed = JSON.parse(storedCad);
        if (Array.isArray(parsed)) {
          parsed.forEach((a: any, idx: number) => {
            const aPolo = (a.polo || "Complexo da Penha").toLowerCase();
            if (cleanPolo.includes("penha") || aPolo.includes(cleanPolo) || cleanPolo.includes(aPolo)) {
              const key = (a.email || a.nome || `aluno-${idx}`).toLowerCase();
              listMap.set(key, {
                id: a.id || `cad-${idx}`,
                nome: a.nome,
                email: a.email || "",
                atividade: a.modalidade || "Jiu Jitsu",
                turma: a.turma || "Turma 1 - Tarde (14h - 16h)",
                idade: a.dataNasc ? `${new Date().getFullYear() - new Date(a.dataNasc).getFullYear()} anos` : "14 anos",
                responsavel: a.nomeResponsavel || "Próprio Aluno",
                telefone: a.telResponsavel || a.telefone || "(11) 98877-6655",
                dataMatricula: a.dataCriacao || new Date().toISOString().slice(0, 10),
                status: "Ativo",
              });
            }
          });
        }
      }
    } catch {}

    // 2. Read polo unit registered students
    try {
      const storedPolo = localStorage.getItem("cufa_alunos_polo");
      if (storedPolo) {
        const parsed = JSON.parse(storedPolo);
        if (Array.isArray(parsed)) {
          parsed.forEach((a: any, idx: number) => {
            const key = (a.email || a.nome || `polo-${idx}`).toLowerCase();
            if (!listMap.has(key)) {
              listMap.set(key, {
                id: a.id || `polo-${idx}`,
                nome: a.nome,
                email: a.email || "",
                atividade: a.atividade || a.modalidade || "Jiu Jitsu",
                turma: a.turma || "Turma 1 - Tarde (14h - 16h)",
                idade: a.idade || "15 anos",
                responsavel: a.responsavel || a.nomeResponsavel || "Responsável Legal",
                telefone: a.telefone || "(11) 98877-6655",
                dataMatricula: a.dataMatricula || new Date().toISOString().slice(0, 10),
                status: "Ativo",
              });
            }
          });
        }
      }
    } catch {}

    return Array.from(listMap.values());
  }

  const [alunosMock, setAlunosMock] = useState<any[]>(() => {
    return loadMergedPoloAlunosList();
  });

  const atividadesPolo = poloNome.toLowerCase().includes("madureira")
    ? ["Basquete", "Karatê", "Capoeira"]
    : poloNome.toLowerCase().includes("paraisopolis")
    ? ["Futsal"]
    : ["Jiu Jitsu", "Aula de Inglês", "Natação"];

  const alunosFiltrados = alunosMock.filter((a) => {
    const matchBusca = a.nome.toLowerCase().includes(busca.toLowerCase()) || String(a.responsavel || "").toLowerCase().includes(busca.toLowerCase());
    const matchAtiv = atividadeFiltro === "todas" || a.atividade === atividadeFiltro;
    return matchBusca && matchAtiv;
  });

  // Pagination Math (20 per page - Anexo 2)
  const totalPaginas = Math.max(1, Math.ceil(alunosFiltrados.length / itensPorPagina));
  const alunosPaginados = alunosFiltrados.slice((pagina - 1) * itensPorPagina, pagina * itensPorPagina);

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
              onChange={(e) => {
                setBusca(e.target.value);
                setPagina(1);
              }}
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
              onChange={(e) => {
                setAtividadeFiltro(e.target.value);
                setPagina(1);
              }}
            >
              <option value="todas">Todas as Oficinas</option>
              {atividadesPolo.map((ativ) => (
                <option key={ativ} value={ativ}>
                  {ativ}
                </option>
              ))}
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
                {alunosPaginados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      <UserPlus className="size-10 mx-auto text-muted-foreground/40 mb-2" />
                      <p className="font-bold text-sm text-foreground">Nenhum aluno cadastrado no momento.</p>
                      <p className="text-xs">Novos alunos inscritos pela comunidade aparecerão automaticamente nesta lista.</p>
                    </td>
                  </tr>
                ) : (
                  alunosPaginados.map((a) => (
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
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação de 20 em 20 (Anexo 2) */}
          <div className="border-t border-border bg-muted/20 p-4 flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              Exibindo <b>{alunosPaginados.length}</b> de <b>{alunosFiltrados.length}</b> alunos (Página {pagina} de {totalPaginas})
            </span>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={pagina === 1}
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                className="font-bold text-xs"
              >
                <ChevronLeft className="size-4 mr-1" /> Anterior
              </Button>
              <span className="text-xs font-extrabold px-3 py-1 bg-background border border-border rounded-md">
                {pagina} / {totalPaginas}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={pagina >= totalPaginas}
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                className="font-bold text-xs"
              >
                Próxima <ChevronRight className="size-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PoloResponsavelShell>
  );
}

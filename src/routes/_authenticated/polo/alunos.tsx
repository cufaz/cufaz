import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Search, UserCheck, Phone, Mail, BookOpen, CheckCircle2, ChevronLeft, ChevronRight, UserPlus, Eye, School, ShieldCheck, HeartPulse } from "lucide-react";
import { toast } from "sonner";
import { PoloResponsavelShell } from "@/components/polo/PoloResponsavelShell";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/polo/alunos")({
  component: PoloAlunosPage,
});

export function PoloAlunosPage() {
  const [poloNome] = useState(() => localStorage.getItem("cufa_polo_atribuido") || "Complexo da Penha");
  const [busca, setBusca] = useState("");
  const [atividadeFiltro, setAtividadeFiltro] = useState("todas");
  const [pagina, setPagina] = useState(1);
  const [selectedAluno, setSelectedAluno] = useState<any | null>(null);
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
                dataNasc: a.dataNasc || "2010-05-12",
                responsavel: a.nomeResponsavel || "Próprio Aluno",
                cpfResponsavel: a.cpfResponsavel || "123.456.789-00",
                telefone: a.telResponsavel || a.telefone || "(11) 98877-6655",
                telefonePai: a.telefonePai || "Não informado",
                telefoneVizinho: a.telefoneVizinho || "Não informado",
                telefoneAvo: a.telefoneAvo || "Não informado",
                hospitalEmergencia: a.hospitalEmergencia || "UPA 24h Mais Próxima",
                nomeEscola: a.nomeEscola || "Escola Municipal Comunitária",
                anoEscolar: a.anoEscolar || "8º Ano - Ensino Fundamental",
                turnoEscolar: a.turnoEscolar || "Manhã",
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
                dataNasc: "2009-08-20",
                responsavel: a.responsavel || a.nomeResponsavel || "Responsável Legal",
                cpfResponsavel: a.cpfResponsavel || "123.456.789-00",
                telefone: a.telefone || "(11) 98877-6655",
                telefonePai: "Não informado",
                telefoneVizinho: "Não informado",
                telefoneAvo: "Não informado",
                hospitalEmergencia: "UPA 24h Mais Próxima",
                nomeEscola: "Escola Estadual Local",
                anoEscolar: "9º Ano",
                turnoEscolar: "Manhã",
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

  const [alunosMock] = useState<any[]>(() => {
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
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {alunosPaginados.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
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
                      <td className="py-3.5 px-4 text-muted-foreground font-medium">{a.idade}</td>
                      <td className="py-3.5 px-4 text-foreground font-semibold">{a.responsavel}</td>
                      <td className="py-3.5 px-4 text-muted-foreground font-medium flex items-center gap-1">
                        <Phone className="size-3.5 text-emerald-600" /> {a.telefone}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground font-medium">{a.dataMatricula}</td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge className="bg-emerald-500/10 text-emerald-700 font-bold border-emerald-500/20">
                          <CheckCircle2 className="size-3 mr-1" /> {a.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs font-extrabold text-primary border-primary/30 hover:bg-primary/10 shadow-xs"
                          onClick={() => setSelectedAluno(a)}
                        >
                          <Eye className="size-3.5 mr-1" /> Analisar
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação de 20 em 20 */}
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

      {/* Modal de Análise Detalhada do Aluno */}
      <Dialog open={!!selectedAluno} onOpenChange={(open) => !open && setSelectedAluno(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary font-black text-xl border border-primary/20">
                {selectedAluno?.nome?.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <DialogTitle className="text-xl font-extrabold text-foreground">
                  Ficha do Aluno — {selectedAluno?.nome}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Matriculado em <b>{selectedAluno?.atividade}</b> ({selectedAluno?.turma}) — {poloNome}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedAluno && (
            <div className="space-y-4 pt-2 text-xs">
              {/* Card 1: Dados Pessoais */}
              <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/60 space-y-2">
                <h4 className="font-black uppercase text-[11px] text-primary tracking-wider flex items-center gap-1.5">
                  <UserCheck className="size-3.5" /> Informações do Aluno
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Nome Completo</span>
                    <span className="font-bold text-foreground">{selectedAluno.nome}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">E-mail</span>
                    <span className="font-bold text-foreground">{selectedAluno.email || "Não informado"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Idade / Nasc.</span>
                    <span className="font-bold text-foreground">{selectedAluno.idade} ({selectedAluno.dataNasc})</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Data da Matrícula</span>
                    <span className="font-bold text-foreground">{selectedAluno.dataMatricula}</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Responsável Legal & Contatos de Emergência */}
              <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/60 space-y-2">
                <h4 className="font-black uppercase text-[11px] text-emerald-600 tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5" /> Responsável Legal & Contatos de Emergência
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Nome do Responsável</span>
                    <span className="font-bold text-foreground">{selectedAluno.responsavel}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">CPF do Responsável</span>
                    <span className="font-bold text-foreground">{selectedAluno.cpfResponsavel}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Telefone Principal</span>
                    <span className="font-bold text-emerald-700 flex items-center gap-1">
                      <Phone className="size-3" /> {selectedAluno.telefone}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Contato Pai</span>
                    <span className="font-bold text-foreground">{selectedAluno.telefonePai}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Contato Vizinho/Parente</span>
                    <span className="font-bold text-foreground">{selectedAluno.telefoneVizinho}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Contato Avó/Outro</span>
                    <span className="font-bold text-foreground">{selectedAluno.telefoneAvo}</span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-border/40">
                    <span className="text-muted-foreground block text-[10px]">Hospital de Emergência Preferencial</span>
                    <span className="font-bold text-amber-700 flex items-center gap-1">
                      <HeartPulse className="size-3 text-amber-600" /> {selectedAluno.hospitalEmergencia}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 3: Escola & Turma */}
              <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/60 space-y-2">
                <h4 className="font-black uppercase text-[11px] text-blue-600 tracking-wider flex items-center gap-1.5">
                  <School className="size-3.5" /> Informações Escolares & Oficina
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Escola</span>
                    <span className="font-bold text-foreground">{selectedAluno.nomeEscola}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Ano / Turno</span>
                    <span className="font-bold text-foreground">{selectedAluno.anoEscolar} ({selectedAluno.turnoEscolar})</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Oficina Vinc.</span>
                    <span className="font-bold text-primary">{selectedAluno.atividade}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Turma & Horário</span>
                    <span className="font-bold text-foreground">{selectedAluno.turma}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button size="sm" className="font-bold text-xs" onClick={() => setSelectedAluno(null)}>
                  Fechar Ficha
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PoloResponsavelShell>
  );
}


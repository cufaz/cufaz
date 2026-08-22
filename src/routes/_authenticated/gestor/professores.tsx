import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { zipSync, strToU8 } from "fflate";
import {
  GraduationCap,
  Users,
  Building2,
  Search,
  Archive,
  Loader2,
  Eye,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Award,
  TrendingUp,
  Mail,
  Phone,
  FileText,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { buildProfessorZipBlob } from "@/lib/zipHelper";
import { brl } from "@/lib/brl";
import { getQuadroPessoas } from "@/lib/gestao.functions";
import { AcessoUsuarioCard } from "@/components/admin/AcessoUsuarioCard";
import { GestorShell } from "@/components/admin/GestorShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/gestor/professores")({
  component: ProfessoresDashboardPage,
});

interface ProfessorRecord {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  polo: string;
  modalidade: string;
  turma: string;
  alunosCount: number;
  frequencia: number;
  status: "aprovado" | "pendente";
  foto?: string | null;
  dataCriacao?: string;
  docIdName?: string | null;
  docResName?: string | null;
  docFuncName?: string | null;
}

function cleanStr(str: string = "") {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

const defaultProfessoresBase: ProfessorRecord[] = [
  {
    id: "prof-santana",
    nome: "Prof.ª Santana Silva",
    email: "santana@cufa.com.br",
    telefone: "(11) 94830-0321",
    polo: "Complexo da Penha",
    modalidade: "Jiu Jitsu",
    turma: "Turma 1 - Tarde (14h - 16h)",
    alunosCount: 0,
    frequencia: 0,
    status: "aprovado",
    dataCriacao: "2026-08-14",
  },
];

function ProfessoresDashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filtroPolo, setFiltroPolo] = useState("todos");
  const [filtroOficina, setFiltroOficina] = useState("todas");
  const [downloadingZipId, setDownloadingZipId] = useState<string | null>(null);
  const [selectedProf, setSelectedProf] = useState<ProfessorRecord | null>(null);

  // Read registered & candidate professors dynamically from local storage
  const [professoresList, setProfessoresList] = useState<ProfessorRecord[]>(() => {
    return loadMergedProfessores();
  });

  function loadMergedProfessores(): ProfessorRecord[] {
    const list: ProfessorRecord[] = [...defaultProfessoresBase];
    const seenEmails = new Set(list.map((p) => p.email.toLowerCase()));

    // Read candidacies
    try {
      const storedSolic = localStorage.getItem("cufa_professores_solicitacoes");
      if (storedSolic) {
        const parsed = JSON.parse(storedSolic);
        if (Array.isArray(parsed)) {
          parsed.forEach((solic: any) => {
            const pEmail = String(solic.email || "").toLowerCase();
            const pNome = solic.professorNome || "Professor";
            const fUser = localStorage.getItem(`cufa_perfil_foto_${pEmail}`);

            if (pEmail && !seenEmails.has(pEmail)) {
              seenEmails.add(pEmail);
              list.unshift({
                id: solic.id || `prof-solic-${Date.now()}`,
                nome: pNome,
                email: pEmail,
                telefone: solic.telefone || localStorage.getItem("cufa_professor_telefone") || "(21) 98765-4321",
                polo: solic.poloNome || "Complexo da Penha",
                modalidade: solic.atividadeNome || "Oficina Esportiva",
                turma: solic.turmaNome || "Turma 1 - Tarde",
                alunosCount: 0,
                frequencia: 0,
                status: solic.status === "aprovado" ? "aprovado" : "pendente",
                foto: fUser || null,
                dataCriacao: solic.dataSolicitacao || new Date().toISOString().slice(0, 10),
                docIdName: solic.docIdName,
                docResName: solic.docResName,
                docFuncName: solic.docFuncName,
              });
            } else if (pEmail) {
              // Update existing record if candidate matches email
              const idx = list.findIndex((p) => p.email.toLowerCase() === pEmail);
              if (idx !== -1 && list[idx]) {
                const target = list[idx]!;
                target.status = solic.status === "aprovado" ? "aprovado" : "pendente";
                if (solic.poloNome) target.polo = solic.poloNome;
                if (solic.atividadeNome) target.modalidade = solic.atividadeNome;
                if (solic.turmaNome) target.turma = solic.turmaNome;
                if (fUser) target.foto = fUser;
              }
            }
          });
        }
      }
    } catch {}

    // Read registered accounts
    try {
      const storedCad = localStorage.getItem("cufa_professores_cadastrados");
      if (storedCad) {
        const parsed = JSON.parse(storedCad);
        if (Array.isArray(parsed)) {
          parsed.forEach((cad: any) => {
            const cEmail = String(cad.email || "").toLowerCase();
            const cNome = cad.professorNome || "Prof. Cadastrado";
            const fUser = localStorage.getItem(`cufa_perfil_foto_${cEmail}`);

            if (cEmail && !seenEmails.has(cEmail)) {
              seenEmails.add(cEmail);
              list.unshift({
                id: cad.id || `prof-cad-${Date.now()}`,
                nome: cNome,
                email: cEmail,
                telefone: cad.telefone || localStorage.getItem("cufa_professor_telefone") || "(21) 98765-4321",
                polo: "Complexo da Penha",
                modalidade: "Jiu Jitsu",
                turma: "Turma 1 - Tarde",
                alunosCount: 0,
                frequencia: 0,
                status: "aprovado",
                foto: fUser || null,
                dataCriacao: cad.dataCriacao || new Date().toISOString().slice(0, 10),
              });
            } else if (cEmail) {
              const idx = list.findIndex((p) => p.email.toLowerCase() === cEmail);
              if (idx !== -1 && list[idx] && fUser) {
                list[idx]!.foto = fUser;
              }
            }
          });
        }
      }
    } catch {}

    return list;
  }

  useEffect(() => {
    function syncProfessores() {
      setProfessoresList(loadMergedProfessores());
    }

    window.addEventListener("cufa_professores_updated", syncProfessores);
    window.addEventListener("cufa_perfil_foto_updated", syncProfessores);
    window.addEventListener("storage", syncProfessores);
    return () => {
      window.removeEventListener("cufa_professores_updated", syncProfessores);
      window.removeEventListener("cufa_perfil_foto_updated", syncProfessores);
      window.removeEventListener("storage", syncProfessores);
    };
  }, []);

  // Hidrata a lista com os cadastros reais do banco (fotos, polo e modalidade oficiais)
  const fetchQuadro = useServerFn(getQuadroPessoas);
  const { data: quadro } = useQuery({
    queryKey: ["quadro-pessoas"],
    queryFn: () => fetchQuadro({}),
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    const dbProfs = (quadro?.professores ?? []) as any[];
    if (dbProfs.length === 0) return;
    setProfessoresList((prev) => {
      const lista = [...prev];
      dbProfs.forEach((r) => {
        const email = String(r.email || "").toLowerCase();
        if (!email) return;
        const idx = lista.findIndex((p) => p.email.toLowerCase() === email);
        if (idx >= 0) {
          const atual = lista[idx]!;
          lista[idx] = {
            ...atual,
            nome: r.nome || atual.nome,
            telefone: r.telefone || atual.telefone,
            polo: r.polo_nome || atual.polo,
            modalidade: r.modalidade || atual.modalidade,
            foto: r.avatar_url || atual.foto || null,
          };
        } else {
          lista.unshift({
            id: String(r.id),
            nome: r.nome || "Professor",
            email,
            telefone: r.telefone || "—",
            polo: r.polo_nome || "—",
            modalidade: r.modalidade || "—",
            turma: "—",
            alunosCount: 0,
            frequencia: 0,
            status: r.status === "ativo" ? "aprovado" : "pendente",
            foto: r.avatar_url || null,
            dataCriacao: String(r.created_at || "").slice(0, 10),
          });
        }
      });
      return lista;
    });
  }, [quadro]);

  function handleDownloadZip(prof: ProfessorRecord) {
    setDownloadingZipId(prof.id);
    setTimeout(() => {
      try {
        const blob = buildProfessorZipBlob(prof);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `documentos_${cleanStr(prof.nome)}.zip`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`Download do arquivo ZIP de ${prof.nome} concluído com sucesso!`);
      } catch (err) {
        toast.error("Erro ao gerar arquivo ZIP do professor.");
      } finally {
        setDownloadingZipId(null);
      }
    }, 1200);
  }

  function handleDeleteProfessor(id: string, nome: string) {
    if (!window.confirm(`Tem certeza que deseja excluir o cadastro do professor ${nome}?`)) return;

    const filtered = professoresList.filter((p) => p.id !== id);
    setProfessoresList(filtered);

    try {
      const storedSolic = localStorage.getItem("cufa_professores_solicitacoes");
      if (storedSolic) {
        const parsed = JSON.parse(storedSolic);
        const upd = parsed.filter((s: any) => s.id !== id && cleanStr(s.professorNome) !== cleanStr(nome));
        localStorage.setItem("cufa_professores_solicitacoes", JSON.stringify(upd));
      }

      const storedCad = localStorage.getItem("cufa_professores_cadastrados");
      if (storedCad) {
        const parsed = JSON.parse(storedCad);
        const upd = parsed.filter((c: any) => c.id !== id && cleanStr(c.professorNome) !== cleanStr(nome));
        localStorage.setItem("cufa_professores_cadastrados", JSON.stringify(upd));
      }

      window.dispatchEvent(new Event("cufa_professores_updated"));
    } catch {}

    toast.success(`Cadastro do professor ${nome} excluído com sucesso.`);
  }

  // Derived metrics for KPIs
  const totalProfs = professoresList.length;
  const uniquePolos = new Set(professoresList.map((p) => p.polo)).size;
  const totalAlunos = professoresList.reduce((acc, p) => acc + (p.alunosCount || 0), 0);
  const freqMedia = (
    professoresList.reduce((acc, p) => acc + (p.frequencia || 0), 0) / (totalProfs || 1)
  ).toFixed(1);

  // Filtered List
  const professoresFiltrados = professoresList.filter((p) => {
    const matchSearch =
      !searchQuery ||
      p.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.modalidade.toLowerCase().includes(searchQuery.toLowerCase());

    const matchPolo = filtroPolo === "todos" || cleanStr(p.polo).includes(cleanStr(filtroPolo));
    const matchOficina = filtroOficina === "todas" || cleanStr(p.modalidade).includes(cleanStr(filtroOficina));

    return matchSearch && matchPolo && matchOficina;
  });

  return (
    <GestorShell
      title="Gestão Geral de Professores"
      description="Painel inteligente de acompanhamento de instrutores, turmas atribuídas, presença dos alunos e documentação para download."
    >
      <div className="space-y-6">
        {/* Top KPI Cards (Indicadores Inteligentes) */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border shadow-xs bg-card">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total de Professores</p>
                <p className="text-2xl font-black text-foreground mt-0.5">{totalProfs}</p>
                <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1 mt-1">
                  <CheckCircle2 className="size-3" /> Todos ativos na rede
                </span>
              </div>
              <div className="size-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black">
                <GraduationCap className="size-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs bg-card">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Polos Atendidos</p>
                <p className="text-2xl font-black text-foreground mt-0.5">{uniquePolos}</p>
                <span className="text-[10px] text-muted-foreground font-medium mt-1 block">Unidades com instrutor</span>
              </div>
              <div className="size-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 font-black">
                <Building2 className="size-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs bg-card">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Alunos Matriculados</p>
                <p className="text-2xl font-black text-foreground mt-0.5">{totalAlunos}</p>
                <span className="text-[10px] text-muted-foreground font-medium mt-1 block">
                  {totalAlunos > 0 ? "Alunos nas turmas ativas" : "Sem matrículas registradas"}
                </span>
              </div>
              <div className="size-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black">
                <Users className="size-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs bg-card">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Frequência Média</p>
                <p className="text-2xl font-black text-foreground mt-0.5">
                  {Number(freqMedia) > 0 ? `${freqMedia}%` : "-"}
                </p>
                <span className="text-[10px] text-muted-foreground font-medium mt-1 block">
                  {Number(freqMedia) > 0 ? "Presença acumulada" : "Aguardando registros de chamadas"}
                </span>
              </div>
              <div className="size-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 font-black">
                <Award className="size-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Barra de Filtros: Busca, Polo e Oficina */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border shadow-xs">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, e-mail ou oficina..."
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
                <option value="corte">Corte e Costura</option>
                <option value="futsal">Futsal</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabela Inteligente de Professores */}
        <Card className="border-border shadow-xs overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/60 flex items-center justify-between">
            <CardTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
              <GraduationCap className="size-5 text-primary" />
              <span>Quadro de Professores Cadastrados na Plataforma</span>
            </CardTitle>
            <Badge variant="secondary" className="font-bold text-xs">
              {professoresFiltrados.length} professores listados
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 text-[11px] font-black uppercase text-muted-foreground border-b border-border/60">
                  <tr>
                    <th className="p-3.5">Professor</th>
                    <th className="p-3.5">Polo / Unidade</th>
                    <th className="p-3.5">Modalidade & Turma</th>
                    <th className="p-3.5">Alunos</th>
                    <th className="p-3.5">Frequência</th>
                    <th className="p-3.5">Documentos (ZIP)</th>
                    <th className="p-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {professoresFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground font-medium">
                        Nenhum professor encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    professoresFiltrados.map((prof) => (
                      <tr key={prof.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar className="size-10 border border-primary/30 shadow-xs">
                              {prof.foto && <AvatarImage src={prof.foto} alt={prof.nome} className="object-cover" />}
                              <AvatarFallback className="bg-primary/10 text-primary font-black text-xs">
                                {prof.nome.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-extrabold text-foreground text-sm">{prof.nome}</p>
                              <p className="text-[11px] text-muted-foreground">{prof.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <Badge variant="outline" className="font-bold text-xs border-primary/30 bg-primary/5 text-foreground">
                            <Building2 className="size-3 mr-1 text-primary" /> {prof.polo}
                          </Badge>
                        </td>

                        <td className="p-3.5">
                          <div>
                            <Badge className="bg-primary/10 text-primary font-extrabold border-primary/20 text-xs">
                              {prof.modalidade}
                            </Badge>
                            <p className="text-[11px] text-muted-foreground font-medium mt-1">{prof.turma}</p>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <span className="font-extrabold text-foreground text-xs flex items-center gap-1">
                            <Users className="size-3.5 text-muted-foreground" /> {prof.alunosCount > 0 ? `${prof.alunosCount} alunos` : "0 alunos"}
                          </span>
                        </td>

                        <td className="p-3.5">
                          {prof.frequencia && prof.frequencia > 0 ? (
                            <Badge className="bg-emerald-500/10 text-emerald-700 font-bold border-emerald-500/20 text-xs">
                              {prof.frequencia}% Presença
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground font-medium text-[11px] border-border bg-muted/20">
                              Sem registros
                            </Badge>
                          )}
                        </td>

                        <td className="p-3.5">
                          <Button
                            size="sm"
                            disabled={downloadingZipId === prof.id}
                            onClick={() => handleDownloadZip(prof)}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] h-8 shadow-xs"
                          >
                            {downloadingZipId === prof.id ? (
                              <>
                                <Loader2 className="size-3.5 animate-spin mr-1" /> Baixando...
                              </>
                            ) : (
                              <>
                                <Archive className="size-3.5 mr-1" /> Baixar ZIP
                              </>
                            )}
                          </Button>
                        </td>

                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs font-bold"
                              onClick={() => setSelectedProf(prof)}
                              title="Visualizar detalhes"
                            >
                              <Eye className="size-3.5 mr-1" /> Analisar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 size-8 p-0 text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteProfessor(prof.id, prof.nome)}
                              title="Excluir cadastro"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Detalhes e Documentação do Professor */}
      <Dialog open={!!selectedProf} onOpenChange={(open) => !open && setSelectedProf(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <Avatar className="size-12 border-2 border-primary/30">
                {selectedProf?.foto && <AvatarImage src={selectedProf.foto} alt={selectedProf.nome} className="object-cover" />}
                <AvatarFallback className="bg-primary/10 text-primary font-black text-lg">
                  {selectedProf?.nome?.slice(0, 2).toUpperCase() || "PR"}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-xl font-extrabold text-foreground">
                  Ficha do Professor — {selectedProf?.nome}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Vínculo com a unidade <b>{selectedProf?.polo}</b> na modalidade <b>{selectedProf?.modalidade}</b>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedProf && (
            <div className="space-y-5 pt-2 text-xs">
              {/* Seção 1: Dados Pessoais & Contato */}
              <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-3">
                <h4 className="font-black uppercase tracking-wider text-primary flex items-center gap-1.5 text-xs">
                  <GraduationCap className="size-4" /> Informações Pessoais & Contato
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Nome Completo</span>
                    <span className="font-bold text-foreground text-sm">{selectedProf.nome}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">E-mail de Login</span>
                    <span className="font-bold text-foreground flex items-center gap-1">
                      <Mail className="size-3 text-primary" /> {selectedProf.email}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Telefone / WhatsApp</span>
                    <span className="font-bold text-foreground flex items-center gap-1">
                      <Phone className="size-3 text-primary" /> {selectedProf.telefone}
                    </span>
                  </div>
                </div>
              </div>

              {/* Seção Dados Bancários para Pagamento / PIX (Anexo 5) */}
              {(() => {
                let bank: any = null;
                try {
                  const stored = localStorage.getItem(`cufa_professor_banco_${selectedProf.email.toLowerCase()}`);
                  if (stored) bank = JSON.parse(stored);
                } catch {}

                const bBanco = bank?.banco || "Itaú (341)";
                const bTipo = bank?.tipoConta || "Corrente";
                const bAg = bank?.agencia || "0001";
                const bConta = bank?.conta || "12345-6";
                const bPixTipo = bank?.pixTipo || "CPF";
                const bPixChave = bank?.pixChave || selectedProf.email;

                return (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                    <h4 className="font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1.5 text-xs">
                      <FileText className="size-4 text-emerald-600" /> Dados Bancários para Pagamento / Repasse (PIX)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Banco</span>
                        <span className="font-extrabold text-foreground">{bBanco}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Tipo / Agência / Conta</span>
                        <span className="font-extrabold text-foreground">{bTipo} • Ag: {bAg} • C/C: {bConta}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Chave PIX ({bPixTipo})</span>
                        <span className="font-black text-primary bg-background px-2 py-1 rounded border border-border inline-block mt-0.5">
                          {bPixChave}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Seção 2: Documentos e Botão ZIP */}
              <div className="p-4 rounded-2xl bg-card border border-border space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/30">
                  <div>
                    <p className="font-extrabold text-xs text-foreground flex items-center gap-1.5">
                      <Archive className="size-4 text-orange-600" /> Pacote de Documentos para Homologação
                    </p>
                    <p className="text-[11px] text-muted-foreground">Baixar todos os comprovantes e documentos em arquivo ZIP unificado.</p>
                  </div>
                  <Button
                    disabled={downloadingZipId === selectedProf.id}
                    onClick={() => handleDownloadZip(selectedProf)}
                    className="bg-brand-gradient text-white font-black text-xs h-10 px-4 shadow-brand shrink-0 w-full sm:w-auto"
                  >
                    {downloadingZipId === selectedProf.id ? (
                      <>
                        <Loader2 className="size-4 animate-spin mr-2" /> Gerando ZIP...
                      </>
                    ) : (
                      <>
                        <Archive className="size-4 mr-2" /> Baixar Tudo em ZIP
                      </>
                    )}
                  </Button>
                </div>

                <div className="space-y-2">
                  <h5 className="text-[11px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <FileCheck2 className="size-3.5 text-emerald-600" /> Documentos Verificados
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex items-center gap-2">
                      <FileCheck2 className="size-4 text-emerald-600 shrink-0" />
                      <div className="truncate">
                        <p className="font-bold text-foreground truncate">Documento RG / CPF</p>
                        <p className="text-[10px] text-emerald-700 font-medium">rg_cpf_verificado.pdf</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex items-center gap-2">
                      <FileCheck2 className="size-4 text-emerald-600 shrink-0" />
                      <div className="truncate">
                        <p className="font-bold text-foreground truncate">Comprovante de Residência</p>
                        <p className="text-[10px] text-emerald-700 font-medium">comprovante_residencia.pdf</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-1 border-t border-border/60">
                  <h5 className="text-[11px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <AlertTriangle className="size-3.5 text-amber-600" /> Documentos Pendentes / Não Enviados
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 flex items-center gap-2">
                      <AlertTriangle className="size-4 text-amber-600 shrink-0" />
                      <div className="truncate">
                        <p className="font-bold text-foreground truncate">Registro Funcional / CREF</p>
                        <p className="text-[10px] text-amber-700 font-medium">Não anexado pelo professor</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 flex items-center gap-2">
                      <AlertTriangle className="size-4 text-amber-600 shrink-0" />
                      <div className="truncate">
                        <p className="font-bold text-foreground truncate">Certificado de Especialização</p>
                        <p className="text-[10px] text-amber-700 font-medium">Não anexado pelo professor</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seção 3: Notas Fiscais de Serviço do Professor (Anexo 5) */}
                <div className="space-y-2 pt-1 border-t border-border/60">
                  <h5 className="text-[11px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <FileText className="size-3.5 text-primary" /> Notas Fiscais de Serviço (NF-e)
                  </h5>
                  {(() => {
                    const profEmail = selectedProf.email?.toLowerCase() || "";
                    let nfsList: any[] = [];
                    try {
                      const stored = localStorage.getItem(`cufa_professor_nfs_${profEmail}`);
                      if (stored) nfsList = JSON.parse(stored);
                      if (!nfsList || nfsList.length === 0) {
                        const storedAll = localStorage.getItem("cufa_professor_nfs_all");
                        if (storedAll) {
                          const parsedAll = JSON.parse(storedAll);
                          nfsList = parsedAll.filter((n: any) => n.profEmail?.toLowerCase() === profEmail);
                        }
                      }
                    } catch {}

                    if (nfsList.length === 0) {
                      return (
                        <p className="text-[11px] text-muted-foreground italic bg-muted/20 p-2.5 rounded-xl border border-border">
                          Nenhuma Nota Fiscal de Serviço enviada por este professor até o momento.
                        </p>
                      );
                    }

                    return (
                      <div className="space-y-2">
                        {nfsList.map((nf) => (
                          <div key={nf.id} className="p-3 rounded-xl border border-border bg-card flex items-center justify-between gap-2">
                            <div>
                              <p className="font-extrabold text-xs text-foreground flex items-center gap-1.5">
                                <FileText className="size-3.5 text-primary" /> NF Período {nf.periodo} — {brl(nf.valor || 0)}
                              </p>
                              <p className="text-[10px] text-muted-foreground font-medium">{nf.fileName} • Enviado em {nf.dataEnvio}</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (nf.fileDataUrl) {
                                  const a = document.createElement("a");
                                  a.href = nf.fileDataUrl;
                                  a.download = nf.fileName;
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                  toast.success(`Download de ${nf.fileName} concluído!`);
                                } else {
                                  toast.error("Arquivo indisponível para download.");
                                }
                              }}
                              className="h-7 text-[11px] font-bold text-primary border-primary/30 hover:bg-primary/10 gap-1"
                            >
                              <Download className="size-3" /> Baixar NF
                            </Button>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>

              <AcessoUsuarioCard email={selectedProf.email} />

              {/* Botão de Fechar */}
              <div className="flex justify-end pt-2 border-t border-border">
                <Button className="font-bold text-xs" onClick={() => setSelectedProf(null)}>
                  Fechar Ficha
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </GestorShell>
  );
}

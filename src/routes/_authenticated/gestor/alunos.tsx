import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { zipSync, strToU8 } from "fflate";
import {
  Users,
  Building2,
  Search,
  Archive,
  Loader2,
  Eye,
  Trash2,
  CheckCircle2,
  School,
  HeartHandshake,
  Mail,
  Phone,
  FileText,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { GestorShell } from "@/components/admin/GestorShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { base64ToUint8Array } from "@/lib/zipHelper";
import {
  fetchAlunosCadastro,
  usePolosCadastrados,
  getAvatarLocal,
  type AlunoCadastro,
} from "@/lib/cadastros";


export const Route = createFileRoute("/_authenticated/gestor/alunos")({
  component: GestorAlunosDashboardPage,
});

export interface AlunoRecord {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  polo: string;
  modalidade: string;
  turma: string;
  dataNasc?: string;
  nomeEscola?: string;
  anoEscolar?: string;
  turnoEscolar?: string;
  qtdPessoasResidencia?: string | number;
  nomeResponsavel?: string;
  cpfResponsavel?: string;
  telResponsavel?: string;
  docIdName?: string | null;
  docIdData?: string | null;
  docResName?: string | null;
  docResData?: string | null;
  foto?: string | null;
  dataCriacao?: string;
  frequenciaGeral?: string;
  qtdAtividades?: number;
}

function cleanStr(str: string = "") {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function GestorAlunosDashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filtroPolo, setFiltroPolo] = useState("todos");
  const [filtroOficina, setFiltroOficina] = useState("todas");
  const [downloadingZipId, setDownloadingZipId] = useState<string | null>(null);
  const [selectedAluno, setSelectedAluno] = useState<AlunoRecord | null>(null);

  const [alunosList, setAlunosList] = useState<AlunoRecord[]>(() => {
    return loadMergedAlunos();
  });

  function loadMergedAlunos(): AlunoRecord[] {
    const list: AlunoRecord[] = [];
    const seenEmails = new Set<string>();

    try {
      const storedCad = localStorage.getItem("cufa_alunos_cadastrados");
      if (storedCad) {
        const parsed = JSON.parse(storedCad);
        if (Array.isArray(parsed)) {
          parsed.forEach((cad: any) => {
            const cEmail = String(cad.email || "").toLowerCase();
            const cNome = cad.nome || "Aluno";
            const fUser = localStorage.getItem(`cufa_perfil_foto_${cEmail}`) || localStorage.getItem("cufa_perfil_foto");

            let userPolo = cad.polo || "Complexo da Penha";
            let userMod = cad.modalidade || "Jiu Jitsu";
            let userTurma = cad.turma || "Turma 1 - Tarde";

            let totalInsc = 1;
            let freqCalc = "100% Presença";

            try {
              const inscStored = localStorage.getItem(`cufa_aluno_inscricoes_${cEmail}`);
              if (inscStored) {
                const inscList = JSON.parse(inscStored);
                if (Array.isArray(inscList) && inscList.length > 0) {
                  const activeList = inscList.filter((i: any) => i.status === "ativa");
                  totalInsc = Math.max(activeList.length, 1);
                  const activeInsc = activeList[0] || inscList[0];
                  if (activeInsc) {
                    userPolo = activeInsc.poloNome || userPolo;
                    userMod = activeInsc.atividadeNome || userMod;
                    userTurma = activeInsc.turmaNome || userTurma;
                  }
                }
              }
            } catch {}

            try {
              const freqStored = localStorage.getItem(`cufa_aluno_frequencia_${cEmail}`);
              if (freqStored) {
                const freqList = JSON.parse(freqStored);
                if (Array.isArray(freqList) && freqList.length > 0) {
                  const pres = freqList.filter((f: any) => f.presente).length;
                  freqCalc = `${Math.round((pres / freqList.length) * 100)}% Presença`;
                }
              }
            } catch {}

            if (cEmail && !seenEmails.has(cEmail)) {
              seenEmails.add(cEmail);
              list.push({
                id: cad.id || `aluno-${Date.now()}`,
                nome: cNome,
                email: cEmail,
                telefone: cad.telefone || "",
                polo: userPolo,
                modalidade: userMod,
                turma: userTurma,
                dataNasc: cad.dataNasc,
                nomeEscola: cad.nomeEscola || "Não informada",
                anoEscolar: cad.anoEscolar || "1º Ano - Ensino Fundamental",
                turnoEscolar: cad.turnoEscolar || "Manhã",
                qtdPessoasResidencia: cad.qtdPessoasResidencia || "1",
                nomeResponsavel: cad.nomeResponsavel || "Responsável Legal",
                cpfResponsavel: cad.cpfResponsavel || "",
                telResponsavel: cad.telResponsavel || "",
                docIdName: cad.docIdName,
                docIdData: cad.docIdData,
                docResName: cad.docResName,
                docResData: cad.docResData,
                foto: fUser || null,
                dataCriacao: cad.dataCriacao || new Date().toISOString().slice(0, 10),
                frequenciaGeral: freqCalc,
                qtdAtividades: totalInsc,
              });
            }
          });
        }
      }
    } catch {}

    // Also read cufa_alunos_polo
    try {
      const storedPolo = localStorage.getItem("cufa_alunos_polo");
      if (storedPolo) {
        const parsed = JSON.parse(storedPolo);
        if (Array.isArray(parsed)) {
          parsed.forEach((pAluno: any) => {
            const pEmail = String(pAluno.email || `${cleanStr(pAluno.nome)}@aluno.cufa.org`).toLowerCase();
            if (!seenEmails.has(pEmail)) {
              seenEmails.add(pEmail);
              list.push({
                id: pAluno.id || `aluno-polo-${Date.now()}`,
                nome: pAluno.nome,
                email: pEmail,
                telefone: pAluno.telefone || "(21) 98765-4321",
                polo: pAluno.polo || "Complexo da Penha",
                modalidade: pAluno.oficina || "Jiu Jitsu",
                turma: "Turma 1 - Tarde",
                nomeEscola: "E.M. Paulo Freire",
                anoEscolar: "1º Ano - Ensino Médio",
                turnoEscolar: "Manhã",
                qtdPessoasResidencia: "4",
                nomeResponsavel: "Responsável Legal",
                cpfResponsavel: "000.000.000-00",
                telResponsavel: "(21) 98765-4321",
                dataCriacao: "2026-08-16",
              });
            }
          });
        }
      }
    } catch {}

    return list;
  }

  const { polos: polosCadastrados } = usePolosCadastrados();

  function mergeBanco(base: AlunoRecord[], remotos: AlunoCadastro[]): AlunoRecord[] {
    const porEmail = new Map(base.map((a) => [a.email.toLowerCase(), a]));
    remotos.forEach((r) => {
      const email = String(r.email || "").toLowerCase();
      if (!email) return;
      const existente = porEmail.get(email);
      const registro: AlunoRecord = {
        id: existente?.id || r.id || email,
        nome: r.nome || existente?.nome || "Aluno",
        email,
        telefone: r.telefone || existente?.telefone || "",
        polo: r.polo_nome || existente?.polo || "—",
        modalidade: existente?.modalidade || "—",
        turma: existente?.turma || "—",
        dataNasc: r.data_nasc || existente?.dataNasc || "—",
        nomeEscola: r.nome_escola || existente?.nomeEscola || "Não informada",
        anoEscolar: r.ano_escolar || existente?.anoEscolar || "—",
        turnoEscolar: r.turno_escolar || existente?.turnoEscolar || "—",
        qtdPessoasResidencia: String(r.qtd_pessoas_residencia ?? existente?.qtdPessoasResidencia ?? "1"),
        nomeResponsavel: r.nome_responsavel || existente?.nomeResponsavel || "—",
        cpfResponsavel: r.cpf_responsavel || existente?.cpfResponsavel || "",
        telResponsavel: r.tel_responsavel || existente?.telResponsavel || "",
        docIdName: existente?.docIdName ?? null,
        docIdData: existente?.docIdData ?? null,
        docResName: existente?.docResName ?? null,
        docResData: existente?.docResData ?? null,
        foto: getAvatarLocal(email) || r.avatar_url || existente?.foto || null,
        dataCriacao: (r.created_at || "").slice(0, 10) || existente?.dataCriacao || "2026-08-01",
        frequenciaGeral: existente?.frequenciaGeral ?? "100%",
        qtdAtividades: existente?.qtdAtividades ?? 1,
      };
      porEmail.set(email, registro);
    });
    return Array.from(porEmail.values());
  }

  useEffect(() => {
    let ativo = true;

    async function syncAlunos() {
      const locais = loadMergedAlunos();
      const remotos = await fetchAlunosCadastro();
      if (ativo) setAlunosList(mergeBanco(locais, remotos));
    }

    void syncAlunos();
    window.addEventListener("cufa_alunos_updated", syncAlunos);
    window.addEventListener("cufa_perfil_foto_updated", syncAlunos);
    window.addEventListener("storage", syncAlunos);
    return () => {
      ativo = false;
      window.removeEventListener("cufa_alunos_updated", syncAlunos);
      window.removeEventListener("cufa_perfil_foto_updated", syncAlunos);
      window.removeEventListener("storage", syncAlunos);
    };
  }, []);


  function handleDownloadZip(aluno: AlunoRecord) {
    setDownloadingZipId(aluno.id);
    setTimeout(() => {
      try {
        const zipFiles: Record<string, Uint8Array> = {};

        const infoTxt = `PACOTE DE DOCUMENTOS E FICHA CADASTRAL DO ALUNO - CUFA
===========================================================
Nome do Aluno: ${aluno.nome}
E-mail: ${aluno.email}
Telefone / WhatsApp: ${aluno.telefone || "Não informado"}
Polo / Unidade: ${aluno.polo}
Modalidade / Atividade: ${aluno.modalidade}
Turma: ${aluno.turma}
Escola em que estuda: ${aluno.nomeEscola || "Não informado"}
Ano Escolar: ${aluno.anoEscolar || "Não informado"}
Turno Escolar: ${aluno.turnoEscolar || "Manhã"}
Residentes no domicílio: ${aluno.qtdPessoasResidencia || "1"}
Responsável Legal: ${aluno.nomeResponsavel || "Não informado"}
CPF do Responsável: ${aluno.cpfResponsavel || "Não informado"}
Telefone do Responsável: ${aluno.telResponsavel || "Não informado"}
Data de Cadastro: ${aluno.dataCriacao || "2026-08-16"}

DOCUMENTOS ANEXADOS:
1. ${aluno.docIdName || "Documento_Identificacao_Aluno.png"}
2. ${aluno.docResName || "Comprovante_Residencia.png"}
`;
        zipFiles["Ficha_Cadastral_Aluno.txt"] = strToU8(infoTxt);

        if (aluno.docIdData && aluno.docIdData.length > 20) {
          zipFiles[aluno.docIdName || "Documento_Identificacao.png"] = base64ToUint8Array(aluno.docIdData);
        } else {
          zipFiles[aluno.docIdName || "Documento_Identificacao.png"] = strToU8(`DOCUMENTO DE IDENTIFICAÇÃO DO ALUNO - ${aluno.nome}`);
        }

        if (aluno.docResData && aluno.docResData.length > 20) {
          zipFiles[aluno.docResName || "Comprovante_Residencia.png"] = base64ToUint8Array(aluno.docResData);
        } else {
          zipFiles[aluno.docResName || "Comprovante_Residencia.png"] = strToU8(`COMPROVANTE DE RESIDÊNCIA - ${aluno.nome}`);
        }

        const zipped = zipSync(zipFiles);
        const blob = new Blob([zipped], { type: "application/zip" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `documentos_aluno_${cleanStr(aluno.nome)}.zip`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`Download do arquivo ZIP de ${aluno.nome} concluído com sucesso!`);
      } catch (err) {
        toast.error("Erro ao gerar arquivo ZIP do aluno.");
      } finally {
        setDownloadingZipId(null);
      }
    }, 1000);
  }

  function handleDeleteAluno(id: string, nome: string) {
    if (!window.confirm(`Tem certeza que deseja excluir o cadastro do aluno ${nome}?`)) return;

    const filtered = alunosList.filter((a) => a.id !== id);
    setAlunosList(filtered);

    try {
      const storedCad = localStorage.getItem("cufa_alunos_cadastrados");
      if (storedCad) {
        const parsed = JSON.parse(storedCad);
        const upd = parsed.filter((c: any) => c.id !== id && cleanStr(c.nome) !== cleanStr(nome));
        localStorage.setItem("cufa_alunos_cadastrados", JSON.stringify(upd));
      }
      window.dispatchEvent(new Event("cufa_alunos_updated"));
    } catch {}

    toast.success(`Cadastro do aluno ${nome} excluído com sucesso.`);
  }

  // Derived metrics for KPIs
  const totalAlunos = alunosList.length;
  const totalPessoasImpactadas = alunosList.reduce((acc, a) => {
    const qtd = Number(a.qtdPessoasResidencia || 0);
    return acc + (qtd > 0 ? qtd : 1);
  }, 0);
  const uniquePolos = new Set(alunosList.map((a) => a.polo)).size;
  const uniqueEscolas = new Set(alunosList.map((a) => a.nomeEscola).filter(Boolean)).size;

  // Filtered List
  const alunosFiltrados = alunosList.filter((a) => {
    const matchSearch =
      !searchQuery ||
      cleanStr(a.nome).includes(cleanStr(searchQuery)) ||
      cleanStr(a.email).includes(cleanStr(searchQuery)) ||
      cleanStr(a.nomeEscola || "").includes(cleanStr(searchQuery)) ||
      cleanStr(a.nomeResponsavel || "").includes(cleanStr(searchQuery));

    const matchPolo = filtroPolo === "todos" || cleanStr(a.polo).includes(cleanStr(filtroPolo));
    const matchOficina = filtroOficina === "todas" || cleanStr(a.modalidade).includes(cleanStr(filtroOficina));

    return matchSearch && matchPolo && matchOficina;
  });

  return (
    <GestorShell
      title="Gestão Geral de Alunos"
      description="Painel de acompanhamento de alunos matriculados, composição familiar, impacto social na comunidade e documentação para download."
    >
      <div className="space-y-6">
        {/* Top KPI Cards (Indicadores Inteligentes) */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border shadow-xs bg-card">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Alunos Matriculados</p>
                <p className="text-2xl font-black text-foreground mt-0.5">{totalAlunos}</p>
                <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1 mt-1">
                  <CheckCircle2 className="size-3" /> Inscrições registradas
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
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Pessoas Impactadas</p>
                <p className="text-2xl font-black text-foreground mt-0.5">{totalPessoasImpactadas}</p>
                <span className="text-[10px] text-muted-foreground font-medium mt-1 block">Soma de residentes dos alunos</span>
              </div>
              <div className="size-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 font-black">
                <HeartHandshake className="size-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs bg-card">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Polos Atendidos</p>
                <p className="text-2xl font-black text-foreground mt-0.5">{uniquePolos}</p>
                <span className="text-[10px] text-muted-foreground font-medium mt-1 block">Unidades com matrículas</span>
              </div>
              <div className="size-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 font-black">
                <Building2 className="size-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs bg-card">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Escolas Representadas</p>
                <p className="text-2xl font-black text-primary mt-0.5">{uniqueEscolas}</p>
                <span className="text-[10px] text-muted-foreground font-medium mt-1 block">Instituições de ensino</span>
              </div>
              <div className="size-11 rounded-2xl bg-brand-gradient text-white flex items-center justify-center font-black shadow-brand">
                <School className="size-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Barra de Filtros: Busca, Polo e Oficina */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border shadow-xs">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por aluno, responsável ou escola..."
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
                className="h-9 rounded-md border border-input bg-background px-3 text-xs font-bold text-foreground w-full sm:w-56"
              >
                <option value="todos">Todos os Polos</option>
                <option value="penha">Complexo da Penha</option>
                <option value="madureira">Viaduto de Madureira</option>
                <option value="paraisopolis">Paraisópolis</option>
                <option value="heliopolis">Heliópolis</option>
                <option value="cidade-de-deus">Cidade de Deus</option>
                <option value="rocinha">Rocinha</option>
              </select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-muted-foreground uppercase whitespace-nowrap">Oficina:</span>
              <select
                value={filtroOficina}
                onChange={(e) => setFiltroOficina(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-xs font-bold text-foreground w-full sm:w-56"
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

        {/* Tabela Inteligente de Alunos */}
        <Card className="border-border shadow-xs overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/60 flex items-center justify-between">
            <CardTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
              <Users className="size-4 text-primary" />
              <span>Quadro de Alunos Cadastrados na Plataforma</span>
            </CardTitle>
            <Badge variant="secondary" className="text-xs font-extrabold">
              {alunosFiltrados.length} alunos listados
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            {alunosFiltrados.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground space-y-2">
                <Users className="size-10 text-muted-foreground/40 mx-auto" />
                <p className="font-bold text-foreground">Nenhum aluno cadastrado no momento.</p>
                <p className="text-xs">Assim que alunos efetuarem o cadastro ou matrículas, os registros aparecerão aqui.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 font-extrabold text-[11px] uppercase tracking-wider text-muted-foreground">
                      <th className="p-3.5">Aluno</th>
                      <th className="p-3.5">Polo / Unidade</th>
                      <th className="p-3.5">Oficina & Turma</th>
                      <th className="p-3.5">Responsável & Família</th>
                      <th className="p-3.5">Escola & Turno</th>
                      <th className="p-3.5">Frequência Geral</th>
                      <th className="p-3.5">Documentos (ZIP)</th>
                      <th className="p-3.5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {alunosFiltrados.map((aluno) => (
                      <tr key={aluno.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar className="size-10 border border-primary/30 shadow-xs">
                              {aluno.foto && <AvatarImage src={aluno.foto} alt={aluno.nome} className="object-cover" />}
                              <AvatarFallback className="bg-primary/10 text-primary font-black text-xs">
                                {aluno.nome.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-extrabold text-foreground text-sm">{aluno.nome}</p>
                              <p className="text-[11px] text-muted-foreground">{aluno.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <Badge variant="outline" className="font-bold text-xs border-primary/30 bg-primary/5 text-foreground">
                            <Building2 className="size-3 mr-1 text-primary" /> {aluno.polo}
                          </Badge>
                        </td>

                        <td className="p-3.5">
                          <div>
                            <Badge className="bg-primary/10 text-primary font-extrabold border-primary/20 text-xs">
                              {aluno.modalidade}
                            </Badge>
                            <p className="text-[11px] text-muted-foreground font-medium mt-1">{aluno.turma}</p>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <div>
                            <p className="font-bold text-foreground text-xs">{aluno.nomeResponsavel || "Próprio Aluno"}</p>
                            <p className="text-[10px] text-muted-foreground">{aluno.telResponsavel || aluno.telefone}</p>
                            <span className="text-[10px] text-emerald-600 font-extrabold block mt-0.5">
                              🏡 {aluno.qtdPessoasResidencia || 1} pessoas no lar
                            </span>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <div>
                            <p className="font-bold text-foreground text-xs">{aluno.nomeEscola || "Não informada"}</p>
                            <p className="text-[10px] text-muted-foreground">{aluno.anoEscolar} • {aluno.turnoEscolar}</p>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <div className="space-y-0.5">
                            <Badge className="bg-emerald-500/10 text-emerald-600 font-extrabold border-emerald-500/20 text-xs">
                              {aluno.frequenciaGeral || "100% Presença"}
                            </Badge>
                            {aluno.qtdAtividades && aluno.qtdAtividades > 1 ? (
                              <span className="text-[10px] text-muted-foreground font-semibold block">
                                Soma de {aluno.qtdAtividades} oficinas
                              </span>
                            ) : null}
                          </div>
                        </td>

                        <td className="p-3.5">
                          <Button
                            size="sm"
                            disabled={downloadingZipId === aluno.id}
                            onClick={() => handleDownloadZip(aluno)}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] h-8 shadow-xs"
                          >
                            {downloadingZipId === aluno.id ? (
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
                              onClick={() => setSelectedAluno(aluno)}
                              className="font-bold text-xs h-8"
                            >
                              <Eye className="size-3.5 mr-1" /> Analisar
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteAluno(aluno.id, aluno.nome)}
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 h-8"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Análise Detalhada do Aluno */}
      <Dialog open={!!selectedAluno} onOpenChange={(v) => !v && setSelectedAluno(null)}>
        <DialogContent className="sm:max-w-lg">
          {selectedAluno && (
            <>
              <DialogHeader className="text-left">
                <DialogTitle className="text-lg font-black flex items-center gap-2">
                  <User className="size-5 text-primary" />
                  <span>Ficha do Aluno — {selectedAluno.nome}</span>
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Dados de matrícula, composição familiar e documentação do aluno.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-2 text-xs">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40 border border-border">
                  <Avatar className="size-14 border-2 border-primary/40 shadow-xs">
                    {selectedAluno.foto && (
                      <AvatarImage src={selectedAluno.foto} alt={selectedAluno.nome} className="object-cover" />
                    )}
                    <AvatarFallback className="bg-primary/10 text-primary font-black text-sm">
                      {selectedAluno.nome.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-extrabold text-sm text-foreground">{selectedAluno.nome}</h4>
                    <p className="text-xs font-bold text-primary">{selectedAluno.modalidade} — {selectedAluno.turma}</p>
                    <Badge variant="outline" className="mt-1 text-[10px] border-primary/30 text-foreground font-semibold">
                      {selectedAluno.polo}
                    </Badge>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 p-3 rounded-xl border border-border bg-card">
                  <div>
                    <span className="text-muted-foreground block font-semibold">E-mail:</span>
                    <span className="font-bold text-foreground">{selectedAluno.email}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block font-semibold">Telefone:</span>
                    <span className="font-bold text-foreground">{selectedAluno.telefone || "Não informado"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block font-semibold">Escola:</span>
                    <span className="font-bold text-foreground">{selectedAluno.nomeEscola || "Não informada"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block font-semibold">Ano & Turno:</span>
                    <span className="font-bold text-foreground">{selectedAluno.anoEscolar} ({selectedAluno.turnoEscolar})</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-border bg-card space-y-1.5">
                  <span className="font-extrabold text-foreground block">Responsável Legal & Família:</span>
                  <div className="grid gap-2 sm:grid-cols-2 text-muted-foreground">
                    <p>Nome: <strong className="text-foreground">{selectedAluno.nomeResponsavel}</strong></p>
                    <p>CPF: <strong className="text-foreground">{selectedAluno.cpfResponsavel}</strong></p>
                    <p>Contato: <strong className="text-foreground">{selectedAluno.telResponsavel}</strong></p>
                    <p>Residentes no Lar: <strong className="text-emerald-600">{selectedAluno.qtdPessoasResidencia} pessoas</strong></p>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    onClick={() => handleDownloadZip(selectedAluno)}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-xs"
                  >
                    <Archive className="size-4 mr-1.5" /> Baixar Pacote ZIP dos Documentos
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </GestorShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { GraduationCap, Search, Award, Save, Calendar, Filter, Users, CheckCircle2, MessageSquare, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { ProfessorShell } from "@/components/professor/ProfessorShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/_authenticated/professor/diario-classe")({
  component: ProfessorDiarioClassePage,
});

export interface DiarioClasseLog {
  id: string;
  alunoEmail: string;
  alunoNome: string;
  polo: string;
  modalidade: string;
  nivelGraduacao: string; // e.g. "Faixa Branca", "Faixa Cinza", "Iniciante"
  relato: string;
  dataAvaliacao: string;
  professorEmail: string;
  professorNome: string;
}

const FAIXAS_ARTES_MARCIAIS = [
  "Faixa Branca",
  "Faixa Cinza",
  "Faixa Amarela",
  "Faixa Laranja",
  "Faixa Verde",
  "Faixa Azul",
  "Faixa Roxa",
  "Faixa Marrom",
  "Faixa Preta",
];

const NIVEIS_GERAIS = [
  "Iniciante",
  "Intermediário",
  "Avançado",
  "Destaque Técnico",
];

export function ProfessorDiarioClassePage() {
  const [profEmail] = useState(() => (localStorage.getItem("cufa_logged_user") || "santana@cufa.com.br").toLowerCase());
  const [profNome] = useState(() => localStorage.getItem("cufa_logged_name_santana@cufa.com.br") || "Prof.ª Santana Silva");
  const [profPolo] = useState(() => localStorage.getItem("cufa_polo_atribuido") || "Complexo da Penha");

  const [filtroOficina, setFiltroOficina] = useState("todas");
  const [searchAluno, setSearchAluno] = useState("");

  const [alunosList, setAlunosList] = useState<any[]>([]);
  const [diarioLogs, setDiarioLogs] = useState<Record<string, DiarioClasseLog>>({});

  // Editing state per student
  const [editingLevels, setEditingLevels] = useState<Record<string, string>>({});
  const [editingRelatos, setEditingRelatos] = useState<Record<string, string>>({});
  const [editingDatas, setEditingDatas] = useState<Record<string, string>>({});

  function loadAlunosAndLogs() {
    try {
      const storedAlunos = localStorage.getItem("cufa_alunos_cadastrados");
      let list: any[] = storedAlunos ? JSON.parse(storedAlunos) : [];

      // Default fallback students for Penha & Paraisópolis if empty
      if (list.length === 0) {
        list = [
          { id: "1", nome: "Enzo Junior", email: "enzojunior@gmail.com", polo: "Complexo da Penha", modalidade: "Jiu Jitsu", foto: null },
          { id: "2", nome: "Beatriz Santos", email: "beatrizsantos@gmail.com", polo: "Complexo da Penha", modalidade: "Jiu Jitsu", foto: null },
          { id: "3", nome: "Robson Nunes", email: "robsonnunes@gmail.com", polo: "Complexo da Penha", modalidade: "Jiu Jitsu", foto: null },
          { id: "4", nome: "Lucas Oliveira", email: "lucasoliveira@gmail.com", polo: "Paraisópolis", modalidade: "Karatê", foto: null },
        ];
      }

      setAlunosList(list);

      // Load saved logs from cufa_diario_classe
      const storedLogs = localStorage.getItem("cufa_diario_classe");
      const logsMap: Record<string, DiarioClasseLog> = storedLogs ? JSON.parse(storedLogs) : {};
      setDiarioLogs(logsMap);

      // Pre-fill edit inputs
      const initialLevels: Record<string, string> = {};
      const initialRelatos: Record<string, string> = {};
      const initialDatas: Record<string, string> = {};

      list.forEach((aluno) => {
        const key = aluno.email.toLowerCase();
        const existing = logsMap[key];
        const defaultLevel = aluno.modalidade?.toLowerCase().includes("jiu") || aluno.modalidade?.toLowerCase().includes("karat")
          ? "Faixa Branca"
          : "Iniciante";

        initialLevels[key] = existing?.nivelGraduacao || defaultLevel;
        initialRelatos[key] = existing?.relato || "";
        initialDatas[key] = existing?.dataAvaliacao || new Date().toISOString().slice(0, 10);
      });

      setEditingLevels(initialLevels);
      setEditingRelatos(initialRelatos);
      setEditingDatas(initialDatas);
    } catch {}
  }

  useEffect(() => {
    loadAlunosAndLogs();
  }, []);

  function handleSaveDiario(aluno: any) {
    const key = aluno.email.toLowerCase();
    const nivelGraduacao = editingLevels[key] || "Faixa Branca";
    const relato = editingRelatos[key] || "";
    const dataAvaliacao = editingDatas[key] || new Date().toISOString().slice(0, 10);

    if (!relato.trim()) {
      toast.error("Preencha um breve relato sobre a evolução do aluno antes de salvar.");
      return;
    }

    const updatedLog: DiarioClasseLog = {
      id: `log-${key}-${Date.now()}`,
      alunoEmail: key,
      alunoNome: aluno.nome,
      polo: aluno.polo || profPolo,
      modalidade: aluno.modalidade || "Jiu Jitsu",
      nivelGraduacao,
      relato,
      dataAvaliacao,
      professorEmail: profEmail,
      professorNome: profNome,
    };

    const currentMap = { ...diarioLogs, [key]: updatedLog };
    setDiarioLogs(currentMap);
    localStorage.setItem("cufa_diario_classe", JSON.stringify(currentMap));
    window.dispatchEvent(new Event("cufa_diario_updated"));

    toast.success(`Diário de classe salvo para ${aluno.nome}!`, {
      description: `Nível: ${nivelGraduacao} • Atualizado em ${dataAvaliacao}`,
    });
  }

  // Filter students by professor's assigned polo & office
  const alunosFiltrados = alunosList.filter((a) => {
    const matchPolo = !profPolo || a.polo?.toLowerCase().includes(profPolo.toLowerCase()) || profPolo.toLowerCase().includes(a.polo?.toLowerCase() || "");
    const matchOficina = filtroOficina === "todas" || a.modalidade?.toLowerCase() === filtroOficina.toLowerCase();
    const matchSearch = !searchAluno || a.nome.toLowerCase().includes(searchAluno.toLowerCase()) || a.email.toLowerCase().includes(searchAluno.toLowerCase());
    return matchPolo && matchOficina && matchSearch;
  });

  const avaliadosCount = Object.keys(diarioLogs).length;

  return (
    <ProfessorShell
      title="Diário de Classe & Evolução de Alunos"
      description="Relate o progresso pedagógico e defina a faixa/nível de graduação de cada aluno sob sua regência."
    >
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-border shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-muted-foreground">Alunos Sob Sua Regência</p>
                <p className="text-2xl font-black text-foreground mt-1">{alunosFiltrados.length}</p>
              </div>
              <Users className="size-8 text-primary opacity-80" />
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-muted-foreground">Relatos & Faixas Registradas</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">{avaliadosCount}</p>
              </div>
              <Award className="size-8 text-emerald-500 opacity-80" />
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-muted-foreground">Unidade / Polo Vinculado</p>
                <p className="text-lg font-extrabold text-foreground mt-1">{profPolo}</p>
              </div>
              <ShieldCheck className="size-8 text-amber-500 opacity-80" />
            </CardContent>
          </Card>
        </div>

        {/* Filter Toolbar */}
        <Card className="border-border shadow-xs bg-card">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar aluno por nome ou e-mail..."
                  value={searchAluno}
                  onChange={(e) => setSearchAluno(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>

              <div className="w-full sm:w-64">
                <select
                  value={filtroOficina}
                  onChange={(e) => setFiltroOficina(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs font-bold text-foreground"
                >
                  <option value="todas">Todas as Oficinas / Modalidades</option>
                  <option value="Jiu Jitsu">Jiu Jitsu</option>
                  <option value="Karatê">Karatê</option>
                  <option value="Corte e Costura">Corte e Costura</option>
                  <option value="Aula de Inglês">Aula de Inglês</option>
                  <option value="Futsal">Futsal</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Student Class Journal Cards */}
        <div className="space-y-4">
          {alunosFiltrados.length === 0 ? (
            <Card className="border-border p-8 text-center text-muted-foreground">
              Nenhum aluno encontrado para lançamento de diário de classe.
            </Card>
          ) : (
            alunosFiltrados.map((aluno) => {
              const key = aluno.email.toLowerCase();
              const isMartial = aluno.modalidade?.toLowerCase().includes("jiu") || aluno.modalidade?.toLowerCase().includes("karat");
              const levelOptions = isMartial ? FAIXAS_ARTES_MARCIAIS : NIVEIS_GERAIS;
              const hasSavedLog = Boolean(diarioLogs[key]);

              return (
                <Card key={aluno.id} className="border-border shadow-xs overflow-hidden">
                  <CardHeader className="bg-muted/40 pb-3 border-b border-border/60">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-11 border-2 border-primary/40 shadow-xs">
                          {aluno.foto && <AvatarImage src={aluno.foto} alt={aluno.nome} className="object-cover" />}
                          <AvatarFallback className="bg-primary/10 text-primary font-black text-sm">
                            {aluno.nome.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
                            <span>{aluno.nome}</span>
                            {hasSavedLog && (
                              <Badge className="bg-emerald-500/10 text-emerald-700 font-bold border-emerald-500/20 text-[10px] gap-1">
                                <CheckCircle2 className="size-3" /> Registrado
                              </Badge>
                            )}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground font-medium">
                            {aluno.email} • Polo: <b>{aluno.polo}</b>
                          </p>
                        </div>
                      </div>

                      <Badge className="bg-primary/10 text-primary font-black text-xs border-primary/20 shrink-0 self-start sm:self-auto">
                        {aluno.modalidade}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-4 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Award className="size-3.5 text-amber-500" /> Nível / Graduação do Aluno
                        </Label>
                        <select
                          value={editingLevels[key] || levelOptions[0]}
                          onChange={(e) => setEditingLevels({ ...editingLevels, [key]: e.target.value })}
                          className="h-10 w-full rounded-md border border-input bg-background px-3 text-xs font-black text-primary"
                        >
                          {levelOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-primary" /> Data da Avaliação
                        </Label>
                        <Input
                          type="date"
                          value={editingDatas[key] || new Date().toISOString().slice(0, 10)}
                          onChange={(e) => setEditingDatas({ ...editingDatas, [key]: e.target.value })}
                          className="text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <MessageSquare className="size-3.5 text-emerald-600" /> Relato de Desenvolvimento & Observações Pedagógicas
                      </Label>
                      <Textarea
                        rows={3}
                        placeholder="Escreva um breve relato sobre a dedicação, presença, técnica e evolução do aluno..."
                        value={editingRelatos[key] || ""}
                        onChange={(e) => setEditingRelatos({ ...editingRelatos, [key]: e.target.value })}
                        className="text-xs font-medium leading-relaxed"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button
                        onClick={() => handleSaveDiario(aluno)}
                        className="bg-brand-gradient text-white font-black text-xs h-9 px-5 shadow-brand gap-2"
                      >
                        <Save className="size-4" /> Salvar no Diário de Classe
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </ProfessorShell>
  );
}

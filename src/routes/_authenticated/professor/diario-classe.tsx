import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  GraduationCap,
  Search,
  Award,
  Save,
  Calendar,
  Users,
  CheckCircle2,
  MessageSquare,
  ShieldCheck,
  Pencil,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { ProfessorShell } from "@/components/professor/ProfessorShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  fetchDiarioEntriesDB,
  saveDiarioEntryDB,
  autoMigrateLocalDiario,
  DiarioEntryDB,
} from "@/lib/diarioService";

export const Route = createFileRoute("/_authenticated/professor/diario-classe")({
  component: ProfessorDiarioClassePage,
});

export function ProfessorDiarioClassePage() {
  const [profEmail] = useState(() => (localStorage.getItem("cufa_logged_user") || "santana@cufa.com.br").toLowerCase());
  const [profNome] = useState(() => localStorage.getItem(`cufa_logged_name_${profEmail}`) || "Prof.ª Santana Silva");
  const [profPolo] = useState(() => localStorage.getItem("cufa_polo_atribuido") || "Complexo da Penha");

  const [dataFiltro, setDataFiltro] = useState(() => new Date().toISOString().slice(0, 10));
  const [filtroOficina, setFiltroOficina] = useState("todas");
  const [searchAluno, setSearchAluno] = useState("");

  const [alunosList, setAlunosList] = useState<any[]>([]);
  const [diarioEntries, setDiarioEntries] = useState<DiarioEntryDB[]>([]);
  const [minhasOficinas, setMinhasOficinas] = useState<string[]>([]);

  // Accordion open state per student
  const [expandedAlunos, setExpandedAlunos] = useState<Record<string, boolean>>({});

  // Editing input state per student key (email)
  const [editingLevels, setEditingLevels] = useState<Record<string, string>>({});
  const [editingRelatos, setEditingRelatos] = useState<Record<string, string>>({});
  const [isEditingNivelToggle, setIsEditingNivelToggle] = useState<Record<string, boolean>>({});

  async function loadData() {
    await autoMigrateLocalDiario();

    // 1. Determine professor's approved modalities (only active/approved candidaturas)
    let oficinas: string[] = [];
    try {
      const storedCand = localStorage.getItem(`cufa_professor_candidaturas_${profEmail}`);
      if (storedCand) {
        const cList: any[] = JSON.parse(storedCand);
        cList.forEach((c) => {
          if (c.atividadeNome && (c.status === "aprovado" || c.status === "ativo")) {
            if (!oficinas.includes(c.atividadeNome)) oficinas.push(c.atividadeNome);
          }
        });
      }
    } catch {}

    if (oficinas.length === 0) {
      if (profEmail.includes("santana")) oficinas = ["Jiu Jitsu"];
      else if (profEmail.includes("anapaula")) oficinas = ["Corte e Costura"];
      else if (profEmail.includes("carlos")) oficinas = ["Karatê"];
      else oficinas = ["Jiu Jitsu"];
    }

    setMinhasOficinas(oficinas);

    // 2. Load registered students
    try {
      const storedAlunos = localStorage.getItem("cufa_alunos_cadastrados");
      let list: any[] = storedAlunos ? JSON.parse(storedAlunos) : [];

      if (list.length === 0) {
        list = [
          { id: "1", nome: "Enzo Junior", email: "enzojunior@gmail.com", polo: "Complexo da Penha", modalidade: "Jiu Jitsu", foto: null },
          { id: "2", nome: "Beatriz Santos", email: "beatrizsantos@gmail.com", polo: "Complexo da Penha", modalidade: "Jiu Jitsu", foto: null },
          { id: "3", nome: "Robson Nunes", email: "robsonnunes@gmail.com", polo: "Complexo da Penha", modalidade: "Jiu Jitsu", foto: null },
          { id: "4", nome: "Lucas Oliveira", email: "lucasoliveira@gmail.com", polo: "Paraisópolis", modalidade: "Karatê", foto: null },
        ];
      }
      setAlunosList(list);
    } catch {}

    // 3. Fetch diary entries for the selected date
    const dbLogs = await fetchDiarioEntriesDB({ data: dataFiltro });
    setDiarioEntries(dbLogs);

    // Pre-fill level & relato inputs for each student
    const initialLevels: Record<string, string> = {};
    const initialRelatos: Record<string, string> = {};

    alunosList.forEach((aluno) => {
      const key = aluno.email.toLowerCase();
      const existing = dbLogs.find((d) => d.aluno_email.toLowerCase() === key);
      const defaultLevel = aluno.modalidade?.toLowerCase().includes("jiu") || aluno.modalidade?.toLowerCase().includes("karat")
        ? "Faixa Branca"
        : "Iniciante";

      initialLevels[key] = existing?.nivel || defaultLevel;
      initialRelatos[key] = existing?.relato || "";
    });

    setEditingLevels((prev) => ({ ...initialLevels, ...prev }));
    setEditingRelatos((prev) => ({ ...initialRelatos, ...prev }));
  }

  useEffect(() => {
    loadData();
  }, [dataFiltro]);

  function toggleAccordion(key: string) {
    setExpandedAlunos((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSaveDiario(aluno: any) {
    const key = aluno.email.toLowerCase();
    const nivel = editingLevels[key] || "Iniciante";
    const relato = editingRelatos[key] || "";

    if (!relato.trim()) {
      toast.error("Preencha um breve relato sobre a evolução do aluno antes de salvar.");
      return;
    }

    const newEntry: DiarioEntryDB = {
      aluno_email: key,
      aluno_nome: aluno.nome,
      professor_nome: profNome,
      atividade_nome: aluno.modalidade || oficinasFallback(aluno),
      polo_nome: aluno.polo || profPolo,
      nivel: nivel.trim(),
      relato: relato.trim(),
      data: dataFiltro,
    };

    const saved = await saveDiarioEntryDB(newEntry);

    if (saved) {
      toast.success(`Diário de classe salvo para ${aluno.nome}!`, {
        description: `Nível: "${nivel}" • Registrado em ${dataFiltro}`,
      });
      loadData();
    }
  }

  function oficinasFallback(aluno: any) {
    return minhasOficinas[0] || aluno.modalidade || "Jiu Jitsu";
  }

  // Filter students by professor's assigned polo & office filter
  const alunosFiltrados = alunosList.filter((a) => {
    const matchPolo = !profPolo || a.polo?.toLowerCase().includes(profPolo.toLowerCase()) || profPolo.toLowerCase().includes(a.polo?.toLowerCase() || "");
    const matchOficina = filtroOficina === "todas" || a.modalidade?.toLowerCase() === filtroOficina.toLowerCase();
    const matchSearch = !searchAluno || a.nome.toLowerCase().includes(searchAluno.toLowerCase()) || a.email.toLowerCase().includes(searchAluno.toLowerCase());
    return matchPolo && matchOficina && matchSearch;
  });

  const avaliadosCount = diarioEntries.length;

  return (
    <ProfessorShell
      title="Diário de Classe & Evolução de Alunos"
      description="Relate o progresso diário e defina a nomenclatura do nível/faixa de cada aluno."
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
                <p className="text-xs font-bold uppercase text-muted-foreground">Registros</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">{avaliadosCount}</p>
              </div>
              <Award className="size-8 text-emerald-500 opacity-80" />
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-muted-foreground">Polo Frequente</p>
                <p className="text-lg font-extrabold text-foreground mt-1">{profPolo}</p>
              </div>
              <ShieldCheck className="size-8 text-amber-500 opacity-80" />
            </CardContent>
          </Card>
        </div>

        {/* Filter Toolbar with Date Selector */}
        <Card className="border-border shadow-xs bg-card">
          <CardContent className="p-4 space-y-3 sm:space-y-0">
            <div className="grid gap-3 sm:grid-cols-3 items-center">
              <div className="relative w-full">
                <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar aluno por nome ou e-mail..."
                  value={searchAluno}
                  onChange={(e) => setSearchAluno(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>

              <div>
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Data do Diário
                </Label>
                <Input
                  type="date"
                  value={dataFiltro}
                  onChange={(e) => setDataFiltro(e.target.value)}
                  className="text-xs font-bold h-9"
                />
              </div>

              <div>
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Oficina do Professor
                </Label>
                <select
                  value={filtroOficina}
                  onChange={(e) => setFiltroOficina(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs font-bold text-foreground"
                >
                  <option value="todas">Todas as Minhas Oficinas ({minhasOficinas.length})</option>
                  {minhasOficinas.map((oficina) => (
                    <option key={oficina} value={oficina}>
                      {oficina}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Student Class Journal Accordion List (Cascade Effect) */}
        <div className="space-y-3">
          {alunosFiltrados.length === 0 ? (
            <Card className="border-border p-8 text-center text-muted-foreground">
              Nenhum aluno encontrado para lançamento de diário de classe.
            </Card>
          ) : (
            alunosFiltrados.map((aluno) => {
              const key = aluno.email.toLowerCase();
              const isExpanded = Boolean(expandedAlunos[key]);
              const existingLog = diarioEntries.find((d) => d.aluno_email.toLowerCase() === key);
              const currentLevel = editingLevels[key] || existingLog?.nivel || "Faixa Branca / Iniciante";
              const isEditingNivel = Boolean(isEditingNivelToggle[key]);

              return (
                <Card key={aluno.id} className="border-border shadow-xs overflow-hidden transition-all duration-200">
                  {/* Accordion Header - Always Visible */}
                  <div
                    onClick={() => toggleAccordion(key)}
                    className="p-4 bg-card hover:bg-muted/40 cursor-pointer flex items-center justify-between gap-3 select-none"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10 border border-primary/30">
                        {aluno.foto && <AvatarImage src={aluno.foto} alt={aluno.nome} className="object-cover" />}
                        <AvatarFallback className="bg-primary/10 text-primary font-black text-xs">
                          {aluno.nome.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div>
                        <h4 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                          <span>{aluno.nome}</span>
                          {existingLog && (
                            <Badge className="bg-emerald-500/10 text-emerald-700 font-bold border-emerald-500/20 text-[10px] gap-1">
                              <CheckCircle2 className="size-3" /> Registrado ({dataFiltro})
                            </Badge>
                          )}
                        </h4>
                        <p className="text-xs text-muted-foreground font-medium">
                          {aluno.email} • Nível Atual: <b className="text-primary">{currentLevel}</b>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary/10 text-primary font-bold text-xs border-primary/20 hidden sm:inline-flex">
                        {aluno.modalidade || minhasOficinas[0]}
                      </Badge>
                      <Button variant="ghost" size="icon" className="size-8 text-muted-foreground">
                        {isExpanded ? <ChevronUp className="size-5" /> : <ChevronDown className="size-5" />}
                      </Button>
                    </div>
                  </div>

                  {/* Accordion Body - Collapsed / Expanded */}
                  {isExpanded && (
                    <CardContent className="pt-2 pb-5 px-4 space-y-4 border-t border-border/60 bg-muted/20">
                      <div className="grid gap-4 sm:grid-cols-2 pt-2">
                        {/* Free-form Editable Level / Graduation (Texto Livre Editável com Lápis) */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                              <Award className="size-3.5 text-amber-500" /> Nível / Graduação do Aluno (Editável)
                            </Label>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsEditingNivelToggle({ ...isEditingNivelToggle, [key]: !isEditingNivel });
                              }}
                              className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                            >
                              <Pencil className="size-3" /> {isEditingNivel ? "Concluir" : "Editar"}
                            </button>
                          </div>

                          {isEditingNivel ? (
                            <Input
                              value={editingLevels[key] ?? ""}
                              onChange={(e) => setEditingLevels({ ...editingLevels, [key]: e.target.value })}
                              placeholder="Digite a nomenclatura oficial (ex.: Faixa Branca 2º Grau, Nível Intermediário...)"
                              className="text-xs font-bold text-primary h-10 border-primary"
                              autoFocus
                            />
                          ) : (
                            <div className="h-10 px-3 rounded-md border border-input bg-background flex items-center justify-between text-xs font-bold text-primary">
                              <span>{currentLevel}</span>
                              <Badge variant="outline" className="text-[10px] text-muted-foreground font-normal">
                                Texto Livre Oficial
                              </Badge>
                            </div>
                          )}
                        </div>

                        {/* Date Field (Matches Selected Date) */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <Calendar className="size-3.5 text-primary" /> Data do Registro
                          </Label>
                          <Input
                            type="date"
                            value={dataFiltro}
                            disabled
                            className="text-xs font-bold bg-muted/60 h-10 cursor-not-allowed"
                          />
                        </div>
                      </div>

                      {/* Pedagogical Report Textarea */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <MessageSquare className="size-3.5 text-emerald-600" /> Relato Diário de Desenvolvimento
                        </Label>
                        <Textarea
                          rows={3}
                          placeholder={`Escreva o relato pedagógico de ${aluno.nome} referente ao dia ${dataFiltro}...`}
                          value={editingRelatos[key] ?? ""}
                          onChange={(e) => setEditingRelatos({ ...editingRelatos, [key]: e.target.value })}
                          className="text-xs font-medium leading-relaxed bg-background"
                        />
                      </div>

                      <div className="flex justify-end pt-1">
                        <Button
                          onClick={() => handleSaveDiario(aluno)}
                          className="bg-brand-gradient text-white font-black text-xs h-9 px-5 shadow-brand gap-2"
                        >
                          <Save className="size-4" /> Salvar Registro do Dia ({dataFiltro})
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>
    </ProfessorShell>
  );
}

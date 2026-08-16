import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Compass,
  Building2,
  Users,
  Clock,
  UserCheck,
  CheckCircle2,
  Search,
  Loader2,
  PlusCircle,
  FileText,
  Info,
  Mail,
  Phone,
  Instagram,
  Linkedin,
  Facebook,
  GraduationCap,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { AlunoShell } from "@/components/aluno/AlunoShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { InscricaoAluno } from "./index";

export const Route = createFileRoute("/_authenticated/aluno/atividades")({
  component: VitrineAtividadesAlunoPage,
});

export interface VitrineCardItem {
  id: string;
  nome: string;
  polo: string;
  turmaNome: string;
  horario: string;
  professorNome?: string | null | undefined;
  professorEmail?: string;
  professorTelefone?: string;
  professorFoto?: string | null;
  professorBio?: string;
  vagasTotais: number;
  alunosMatriculados: number;
  descricao?: string;
  faixaEtaria?: string;
  requisitos?: string;
}

function cleanStr(str: string = "") {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function VitrineAtividadesAlunoPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filtroPolo, setFiltroPolo] = useState("todos");
  const [filtroOficina, setFiltroOficina] = useState("todas");
  const [alunoEmail, setAlunoEmail] = useState("");
  const [myInscricoes, setMyInscricoes] = useState<string[]>([]);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  // Professor Details Modal State
  const [selectedProfModal, setSelectedProfModal] = useState<{
    nome: string;
    oficina: string;
    polo: string;
    email: string;
    telefone: string;
    foto?: string | null;
    bio: string;
    instagram?: string;
    linkedin?: string;
  } | null>(null);
  const [selectedCourseGalleryModal, setSelectedCourseGalleryModal] = useState<VitrineCardItem | null>(null);

  // Expanded Vitrine Items across all official CUFA Polos
  const defaultVitrine: VitrineCardItem[] = [
    {
      id: "v-penha-jiu-t1",
      nome: "Jiu Jitsu",
      polo: "Complexo da Penha",
      turmaNome: "Turma 1 - Tarde (14h - 16h)",
      horario: "Seg, Quat e Sex - 14:00 às 16:00",
      professorNome: "Prof.ª Santana Silva",
      professorEmail: "santana@cufa.com.br",
      professorTelefone: "(11) 94830-0321",
      professorBio: "Faixa preta de Jiu Jitsu com mais de 8 anos de experiência no ensino de artes marciais e valores sociais para jovens e crianças da comunidade.",
      vagasTotais: 40,
      alunosMatriculados: 0,
      descricao: "Treinamentos práticos de arte marcial, foco em defesa pessoal, disciplina, respeito e desenvolvimento físico.",
      faixaEtaria: "06 a 17 anos",
      requisitos: "Atestado médico e kimono básico",
    },
    {
      id: "v-penha-jiu-t2",
      nome: "Jiu Jitsu",
      polo: "Complexo da Penha",
      turmaNome: "Turma 2 - Tarde (16h - 18h)",
      horario: "Seg, Quat e Sex - 16:00 às 18:00",
      professorNome: "Prof.ª Santana Silva",
      professorEmail: "santana@cufa.com.br",
      professorTelefone: "(11) 94830-0321",
      professorBio: "Faixa preta de Jiu Jitsu com mais de 8 anos de experiência no ensino de artes marciais e valores sociais para jovens e crianças da comunidade.",
      vagasTotais: 40,
      alunosMatriculados: 0,
      descricao: "Treinamentos práticos de arte marcial, foco em defesa pessoal, disciplina, respeito e desenvolvimento físico.",
      faixaEtaria: "06 a 17 anos",
      requisitos: "Atestado médico e kimono básico",
    },
    {
      id: "v-penha-ingles",
      nome: "Aula de Inglês",
      polo: "Complexo da Penha",
      turmaNome: "Turma 1 - Manhã (09h - 11h)",
      horario: "Ter e Qui - 09:00 às 11:00",
      professorNome: "Aguardando Instrutor",
      vagasTotais: 30,
      alunosMatriculados: 0,
      descricao: "Aulas de conversação básica, gramática contextualizada e preparação de jovens para oportunidades no mercado de trabalho.",
      faixaEtaria: "08 a 18 anos",
      requisitos: "Caderno e caneta",
    },
    {
      id: "v-madureira-natacao",
      nome: "Natação",
      polo: "Viaduto de Madureira",
      turmaNome: "Turma 1 - Tarde (14h - 16h)",
      horario: "Seg e Quat - 14:00 às 16:00",
      professorNome: "Aguardando Instrutor",
      vagasTotais: 25,
      alunosMatriculados: 0,
      descricao: "Aulas de natação para iniciantes e avançados, desenvolvimento de resistência respiratória e nado seguro.",
      faixaEtaria: "06 a 16 anos",
      requisitos: "Touca, óculos de natação e atestado de aptidão física",
    },
    {
      id: "v-madureira-karate",
      nome: "Karatê",
      polo: "Viaduto de Madureira",
      turmaNome: "Turma 1 - Noite (18h - 20h)",
      horario: "Ter e Qui - 18:00 às 20:00",
      professorNome: "Aguardando Instrutor",
      vagasTotais: 35,
      alunosMatriculados: 0,
      descricao: "Treinamento tradicional de Karatê, exercícios de cata, defesa pessoal e coordenação motora.",
      faixaEtaria: "07 a 17 anos",
      requisitos: "Roupas esportivas confortáveis",
    },
    {
      id: "v-paraisopolis-costura",
      nome: "Corte e Costura",
      polo: "Paraisópolis",
      turmaNome: "Turma 1 - Manhã (08h - 11h)",
      horario: "Seg a Sex - 08:00 às 11:00",
      professorNome: "Aguardando Instrutor",
      vagasTotais: 20,
      alunosMatriculados: 0,
      descricao: "Capacitação técnica profissional em modelagem, corte, costura reta e confecção de peças de vestuário.",
      faixaEtaria: "A partir de 14 anos",
      requisitos: "Vontade de aprender e dedicação prática",
    },
    {
      id: "v-paraisopolis-futsal",
      nome: "Futsal",
      polo: "Paraisópolis",
      turmaNome: "Turma 1 - Tarde (15h - 17h)",
      horario: "Ter, Qui e Sáb - 15:00 às 17:00",
      professorNome: "Aguardando Instrutor",
      vagasTotais: 40,
      alunosMatriculados: 0,
      descricao: "Fundamentos do futebol de salão, trabalho em equipe, condicionamento aeróbico e torneios comunitários.",
      faixaEtaria: "06 a 17 anos",
      requisitos: "Tênis de futsal e atestado de saúde",
    },
    {
      id: "v-heliopolis-basquete",
      nome: "Basquete",
      polo: "Heliópolis",
      turmaNome: "Turma 1 - Tarde (16h - 18h)",
      horario: "Seg e Quat - 16:00 às 18:00",
      professorNome: "Aguardando Instrutor",
      vagasTotais: 30,
      alunosMatriculados: 0,
      descricao: "Fundamentos de passe, arremesso, táticas de quadra e torneios esportivos comunitários.",
      faixaEtaria: "08 a 17 anos",
      requisitos: "Calçado esportivo",
    },
    {
      id: "v-teste-capoeira",
      nome: "Capoeira & Cultura",
      polo: "Polo de Teste",
      turmaNome: "Turma 1 - Tarde (14h - 16h)",
      horario: "Seg e Quat - 14:00 às 16:00",
      professorNome: "Prof.ª Santana Silva",
      professorEmail: "santana@cufa.com.br",
      professorTelefone: "(11) 94830-0321",
      professorBio: "Instrutor qualificado no ensino de capoeira regional e valores culturais.",
      vagasTotais: 30,
      alunosMatriculados: 0,
      descricao: "Oficina prática de ginga, roda de capoeira, instrumentos tradicionais e vivência cultural.",
      faixaEtaria: "06 a 17 anos",
      requisitos: "Roupas brancas e disposição física",
    },
  ];

  function loadVitrineMergedList() {
    const listMap = new Map<string, VitrineCardItem>();

    // 1. Add default vitrine cards
    defaultVitrine.forEach((item) => {
      listMap.set(item.id, item);
    });

    // 2. Read activities created by Gestor in cufa_atividades_gestor
    try {
      const storedGestor = localStorage.getItem("cufa_atividades_gestor");
      if (storedGestor) {
        const parsed = JSON.parse(storedGestor);
        if (Array.isArray(parsed)) {
          parsed.forEach((g: any, idx: number) => {
            const id = g.id || `v-gestor-${idx}`;
            const poloName = g.polo_nome || g.polo || "Polo de Teste";
            listMap.set(id, {
              id,
              nome: g.nome || "Oficina Interativa",
              polo: poloName,
              turmaNome: g.turmaNome || "Turma 1 - Tarde (14h - 16h)",
              horario: g.dias || "Seg e Quat - 14:00 às 16:00",
              professorNome: g.professorNome || "Aguardando Instrutor",
              professorEmail: g.professorEmail || "contato@cufa.com.br",
              professorTelefone: "(11) 98877-6655",
              professorBio: "Instrutor credenciado da Central Única das Favelas.",
              vagasTotais: Number(g.vagas || 40),
              alunosMatriculados: 0,
              descricao: g.descricao || "Oficina prática focada no desenvolvimento socioeducativo e cultural.",
              faixaEtaria: g.faixa_etaria || g.faixaEtaria || "06 a 17 anos",
              requisitos: g.requisitos || "Roupas confortáveis e vontade de aprender",
            });
          });
        }
      }
    } catch {}

    // 3. Read activities created by Polo in cufa_atividades_polo
    try {
      const storedPolo = localStorage.getItem("cufa_atividades_polo");
      if (storedPolo) {
        const parsed = JSON.parse(storedPolo);
        if (Array.isArray(parsed)) {
          parsed.forEach((p: any, idx: number) => {
            const id = p.id || `v-polo-${idx}`;
            if (!listMap.has(id)) {
              listMap.set(id, {
                id,
                nome: p.nome || "Oficina Comunitária",
                polo: p.polo_nome || p.polo || "Polo de Teste",
                turmaNome: p.turmaNome || "Turma 1 - Tarde (14h - 16h)",
                horario: p.horario || p.dias || "Ter e Qui - 14:00 às 16:00",
                professorNome: p.professorNome || "Aguardando Instrutor",
                professorEmail: "contato@cufa.com.br",
                professorTelefone: "(11) 98877-6655",
                professorBio: "Instrutor credenciado da Central Única das Favelas.",
                vagasTotais: Number(p.vagas || 30),
                alunosMatriculados: 0,
                descricao: p.descricao || "Oficina formativa da unidade.",
                faixaEtaria: p.faixa_etaria || p.faixaEtaria || "06 a 17 anos",
                requisitos: p.requisitos || "Atestado de saúde ou autorização do responsável",
              });
            }
          });
        }
      }
    } catch {}

    return Array.from(listMap.values());
  }

  function loadInscricoesState() {
    const uEmail = localStorage.getItem("cufa_logged_user") || "aluno@cufa.com.br";
    setAlunoEmail(uEmail);

    try {
      const stored = localStorage.getItem(`cufa_aluno_inscricoes_${uEmail}`);
      if (stored) {
        const parsed: InscricaoAluno[] = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setMyInscricoes(parsed.filter((i) => i.status === "ativa").map((i) => i.atividadeId));
        }
      }
    } catch {}
  }

  useEffect(() => {
    loadInscricoesState();
    window.addEventListener("cufa_aluno_inscricoes_updated", loadInscricoesState);
    return () => {
      window.removeEventListener("cufa_aluno_inscricoes_updated", loadInscricoesState);
    };
  }, []);

  function handleOpenProfModal(item: VitrineCardItem) {
    if (!item.professorNome || item.professorNome.includes("Aguardando")) {
      toast.info("Instrutor em fase de atribuição pela equipe técnica.");
      return;
    }

    const fUser = localStorage.getItem(`cufa_perfil_foto_${item.professorEmail}`) || localStorage.getItem("cufa_perfil_foto");

    setSelectedProfModal({
      nome: item.professorNome,
      oficina: item.nome,
      polo: item.polo,
      email: item.professorEmail || "santana@cufa.com.br",
      telefone: item.professorTelefone || "(11) 94830-0321",
      foto: fUser || null,
      bio: item.professorBio || "Instrutor credenciado da rede de oficinas comunitárias da CUFA.",
      instagram: "@prof.santana.jiujitsu",
      linkedin: "linkedin.com/in/santana-silva-cufa",
    });
  }

  function handleInscrever(item: VitrineCardItem) {
    if (!alunoEmail) {
      toast.error("Faça login para se inscrever.");
      return;
    }

    setSubmittingId(item.id);
    setTimeout(() => {
      try {
        const stored = localStorage.getItem(`cufa_aluno_inscricoes_${alunoEmail}`);
        let list: InscricaoAluno[] = stored ? JSON.parse(stored) : [];

        if (list.some((i) => i.atividadeId === item.id && i.status === "ativa")) {
          toast.info("Você já está matriculado nesta turma!");
          setSubmittingId(null);
          return;
        }

        const novaInsc: InscricaoAluno = {
          id: `insc-${Date.now()}`,
          atividadeId: item.id,
          atividadeNome: item.nome,
          poloNome: item.polo,
          turmaNome: item.turmaNome,
          professorNome: item.professorNome,
          horario: item.horario,
          dataMatricula: new Date().toLocaleDateString("pt-BR"),
          status: "ativa",
        };

        list.push(novaInsc);
        localStorage.setItem(`cufa_aluno_inscricoes_${alunoEmail}`, JSON.stringify(list));
        window.dispatchEvent(new Event("cufa_aluno_inscricoes_updated"));

        toast.success(`Matrícula efetuada com sucesso na oficina ${item.nome}!`, {
          description: `Unidade: ${item.polo} | ${item.turmaNome}`,
        });
      } catch {
        toast.error("Erro ao realizar inscrição.");
      } finally {
        setSubmittingId(null);
      }
    }, 800);
  }

  const vitrineList = loadVitrineMergedList();

  const vitrineFiltrada = vitrineList.filter((item) => {
    const matchSearch =
      !searchQuery ||
      cleanStr(item.nome).includes(cleanStr(searchQuery)) ||
      cleanStr(item.polo).includes(cleanStr(searchQuery)) ||
      cleanStr(item.professorNome || "").includes(cleanStr(searchQuery));

    const matchPolo = filtroPolo === "todos" || cleanStr(item.polo).includes(cleanStr(filtroPolo));
    const matchOficina = filtroOficina === "todas" || cleanStr(item.nome).includes(cleanStr(filtroOficina));

    return matchSearch && matchPolo && matchOficina;
  });

  return (
    <AlunoShell
      title="Vitrine de Atividades e Vagas Disponíveis"
      description="Escolha livremente as oficinas e modalidades de seu interesse em qualquer um dos polos oficiais da CUFA."
    >
      <div className="space-y-6">
        {/* Barra de Filtros Inteligentes com TODOS os Polos e TODAS as Oficinas */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border shadow-xs">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar oficina, polo ou professor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-muted-foreground uppercase whitespace-nowrap">POLO:</span>
              <select
                value={filtroPolo}
                onChange={(e) => setFiltroPolo(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-xs font-bold text-foreground w-full sm:w-48"
              >
                <option value="todos">Todos os Polos</option>
                {Array.from(new Set(vitrineList.map((i) => i.polo))).map((pName) => (
                  <option key={pName} value={pName}>
                    {pName}
                  </option>
                ))}
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
                {Array.from(new Set(vitrineList.map((i) => i.nome))).map((oName) => (
                  <option key={oName} value={oName}>
                    {oName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Quadro da Vitrine de Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vitrineFiltrada.map((item) => {
            const isEnrolled = myInscricoes.includes(item.id);
            const isSubmitting = submittingId === item.id;
            const hasProf = item.professorNome && !item.professorNome.includes("Aguardando");

            // Calculate exact remaining vagas dynamically
            const totalAlunosCadastrados = (() => {
              try {
                const stored = localStorage.getItem("cufa_alunos_cadastrados");
                if (stored) return JSON.parse(stored).length;
              } catch {}
              return 0;
            })();

            const matriculadosTurma = item.id === "v-penha-jiu-t1"
              ? Math.max(totalAlunosCadastrados, item.alunosMatriculados)
              : item.alunosMatriculados;
            const vagasRestantes = Math.max(0, item.vagasTotais - matriculadosTurma);

            return (
              <Card key={item.id} className="border-border bg-card shadow-xs hover:border-primary/50 transition-colors flex flex-col justify-between">
                <CardHeader className="pb-3 border-b border-border/60">
                  <div className="flex items-start justify-between gap-2">
                    <Badge className="bg-primary/10 text-primary font-extrabold border-primary/20 text-xs">
                      {item.nome}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] font-bold border-primary/30 bg-primary/5 text-foreground">
                      <Building2 className="size-3 mr-1 text-primary" /> {item.polo}
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-extrabold text-foreground mt-2">
                    {item.turmaNome}
                  </CardTitle>
                </CardHeader>

                <CardContent className="pt-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                      <Clock className="size-3.5 text-primary shrink-0" />
                      <span>{item.horario}</span>
                    </div>

                    {/* Nome do Professor como Botão Interativo */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                      <UserCheck className="size-3.5 text-emerald-600 shrink-0" />
                      <span>
                        Instrutor:{" "}
                        {hasProf ? (
                          <button
                            type="button"
                            onClick={() => handleOpenProfModal(item)}
                            className="font-extrabold text-primary hover:underline hover:text-primary/80 transition-colors cursor-pointer"
                          >
                            {item.professorNome}
                          </button>
                        ) : (
                          <strong className="text-muted-foreground">{item.professorNome}</strong>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                      <Users className="size-3.5 text-primary shrink-0" />
                      <span>Vagas: <strong>{vagasRestantes} vagas disponíveis</strong></span>
                    </div>

                    {/* Botão de Galeria de Fotos da Oficina (Anexo 4) */}
                    <div className="pt-0.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedCourseGalleryModal(item)}
                        className="h-7 text-[11px] font-bold text-primary border-primary/30 hover:bg-primary/10 gap-1.5"
                      >
                        <ImageIcon className="size-3.5 text-primary" /> Imagens da Oficina
                      </Button>
                    </div>

                    {/* Detalhes da Oficina definidos pelo Gestor */}
                    <div className="pt-2.5 border-t border-border/50 space-y-1.5">
                      <p className="text-[11px] font-bold text-foreground flex items-center gap-1">
                        <Info className="size-3 text-primary" /> Detalhes da Oficina:
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {item.descricao || "Oficina focada na formação cidadã, disciplina e aperfeiçoamento de habilidades."}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <Badge variant="outline" className="text-[10px] border-border bg-muted/30 text-muted-foreground font-semibold">
                          Faixa Etária: {item.faixaEtaria || "06 a 17 anos"}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] border-border bg-muted/30 text-muted-foreground font-semibold">
                          Requisitos: {item.requisitos || "Atestado de aptidão física"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/60">
                    {isEnrolled ? (
                      <Button
                        disabled
                        variant="outline"
                        className="w-full text-xs font-bold border-emerald-500/40 bg-emerald-500/10 text-emerald-600 h-9"
                      >
                        <CheckCircle2 className="size-4 mr-1.5" /> Você já está Matriculado
                      </Button>
                    ) : (
                      <Button
                        disabled={isSubmitting}
                        onClick={() => handleInscrever(item)}
                        className="w-full bg-brand-gradient text-primary-foreground font-bold text-xs shadow-brand h-9"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="size-3.5 animate-spin mr-1.5" /> Efetuando Matrícula...
                          </>
                        ) : (
                          <>
                            <PlusCircle className="size-3.5 mr-1.5" /> Inscrever-se nesta Oficina
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Modal com Informações Detalhadas do Professor */}
      <Dialog open={!!selectedProfModal} onOpenChange={(v) => !v && setSelectedProfModal(null)}>
        <DialogContent className="sm:max-w-md">
          {selectedProfModal && (
            <>
              <DialogHeader className="text-left">
                <DialogTitle className="text-lg font-black flex items-center gap-2">
                  <GraduationCap className="size-5 text-primary" />
                  <span>Ficha do Instrutor</span>
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Informações profissionais e redes de contato do professor responsável.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40 border border-border">
                  <Avatar className="size-14 border-2 border-primary/40 shadow-xs">
                    {selectedProfModal.foto && (
                      <AvatarImage src={selectedProfModal.foto} alt={selectedProfModal.nome} className="object-cover" />
                    )}
                    <AvatarFallback className="bg-primary/10 text-primary font-black text-sm">
                      {selectedProfModal.nome.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-extrabold text-sm text-foreground">{selectedProfModal.nome}</h4>
                    <p className="text-xs font-bold text-primary">{selectedProfModal.oficina}</p>
                    <Badge variant="outline" className="mt-1 text-[10px] border-primary/30 text-foreground font-semibold">
                      {selectedProfModal.polo}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="size-4 text-primary shrink-0" />
                    <span>E-mail: <strong>{selectedProfModal.email}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="size-4 text-primary shrink-0" />
                    <span>WhatsApp: <strong>{selectedProfModal.telefone}</strong></span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-border">
                  <span className="text-xs font-extrabold text-foreground block">Biografia / Experiência:</span>
                  <p className="text-xs text-muted-foreground leading-relaxed bg-card p-3 rounded-xl border border-border">
                    {selectedProfModal.bio}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-border">
                  <span className="text-xs font-extrabold text-foreground block">Redes Sociais & Portfólio:</span>
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedProfModal.instagram && (
                      <Badge className="bg-rose-500/10 text-rose-600 font-bold border-rose-500/20 text-xs flex items-center gap-1">
                        <Instagram className="size-3" /> {selectedProfModal.instagram}
                      </Badge>
                    )}
                    {selectedProfModal.linkedin && (
                      <Badge className="bg-blue-500/10 text-blue-600 font-bold border-blue-500/20 text-xs flex items-center gap-1">
                        <Linkedin className="size-3" /> LinkedIn
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Galeria de Fotos da Oficina (Anexo 4) */}
      <Dialog
        open={Boolean(selectedCourseGalleryModal)}
        onOpenChange={(open) => !open && setSelectedCourseGalleryModal(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-extrabold">
              <ImageIcon className="size-5 text-primary" />
              <span>Fotos da Oficina — {selectedCourseGalleryModal?.nome}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Galeria oficial de imagens das atividades e aulas da unidade {selectedCourseGalleryModal?.polo}.
            </DialogDescription>
          </DialogHeader>

          {selectedCourseGalleryModal && (
            <div className="space-y-4 pt-2">
              {(() => {
                const storedFotos = localStorage.getItem("cufa_polo_galeria_fotos");
                let fotosList: any[] = [];
                try {
                  if (storedFotos) {
                    const parsed = JSON.parse(storedFotos);
                    if (Array.isArray(parsed)) {
                      fotosList = parsed.filter(
                        (f: any) =>
                          (f.oficina && String(f.oficina).toLowerCase() === selectedCourseGalleryModal.nome.toLowerCase()) ||
                          (f.polo && String(f.polo).toLowerCase().includes(selectedCourseGalleryModal.polo.toLowerCase()))
                      );
                    }
                  }
                } catch {}

                if (fotosList.length === 0) {
                  // Clean fallback preview images for demonstration
                  fotosList = [
                    {
                      id: "demo-1",
                      titulo: `Treino Prático — ${selectedCourseGalleryModal.nome}`,
                      url: "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=600&auto=format&fit=crop&q=80",
                      data: "16/08/2026",
                    },
                    {
                      id: "demo-2",
                      titulo: `Alunos e Instrutor — ${selectedCourseGalleryModal.polo}`,
                      url: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=600&auto=format&fit=crop&q=80",
                      data: "15/08/2026",
                    },
                  ];
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {fotosList.map((foto) => (
                      <div key={foto.id} className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs space-y-2">
                        <div className="aspect-video relative overflow-hidden bg-muted">
                          <img
                            src={foto.url}
                            alt={foto.titulo || "Foto da Oficina"}
                            className="size-full object-cover transition-transform duration-300 hover:scale-105"
                          />
                        </div>
                        <div className="p-3">
                          <p className="font-extrabold text-xs text-foreground leading-tight">{foto.titulo || selectedCourseGalleryModal.nome}</p>
                          <p className="text-[10px] font-medium text-muted-foreground mt-0.5">Adicionada em {foto.data || "16/08/2026"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AlunoShell>
  );
}

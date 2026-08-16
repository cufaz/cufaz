import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  BookOpen,
  Compass,
  CalendarCheck,
  Building2,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  User,
} from "lucide-react";
import { AlunoShell } from "@/components/aluno/AlunoShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/aluno/")({
  component: AlunoDashboardPage,
});

export interface InscricaoAluno {
  id: string;
  atividadeId: string;
  atividadeNome: string;
  poloNome: string;
  turmaNome: string;
  professorNome?: string | null | undefined;
  horario?: string | null | undefined;
  dataMatricula: string;
  status: "ativa" | "cancelada";
}

function AlunoDashboardPage() {
  const [alunoEmail, setAlunoEmail] = useState("");
  const [alunoNome, setAlunoNome] = useState("Aluno");
  const [inscricoes, setInscricoes] = useState<InscricaoAluno[]>([]);

  function loadAlunoData() {
    const userEmail = localStorage.getItem("cufa_logged_user") || "aluno@cufa.com.br";
    setAlunoEmail(userEmail);

    const storedNome = localStorage.getItem("cufa_aluno_nome");
    if (storedNome) setAlunoNome(storedNome);

    // Read real student enrollments from local storage
    try {
      const storedInsc = localStorage.getItem(`cufa_aluno_inscricoes_${userEmail}`);
      if (storedInsc) {
        const parsed = JSON.parse(storedInsc);
        if (Array.isArray(parsed)) {
          setInscricoes(parsed.filter((i) => i.status === "ativa"));
          return;
        }
      }
      setInscricoes([]);
    } catch {
      setInscricoes([]);
    }
  }

  useEffect(() => {
    loadAlunoData();
    window.addEventListener("cufa_aluno_inscricoes_updated", loadAlunoData);
    return () => {
      window.removeEventListener("cufa_aluno_inscricoes_updated", loadAlunoData);
    };
  }, []);

  const totalInscricoes = inscricoes.length;

  return (
    <AlunoShell
      title={`Olá, ${alunoNome}! 👋`}
      description="Bem-vindo ao seu Portal do Aluno CUFA. Acompanhe suas inscrições, escolha novas atividades na vitrine e verifique sua presença."
    >
      <div className="space-y-6">
        {/* KPI Cards (Indicadores Reais) */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border shadow-xs bg-card">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Matrículas Ativas</p>
                <p className="text-2xl font-black text-foreground mt-0.5">{totalInscricoes}</p>
                <span className="text-[10px] text-muted-foreground font-medium mt-1 block">
                  {totalInscricoes > 0 ? "Oficinas em andamento" : "Sem matrículas ativas"}
                </span>
              </div>
              <div className="size-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black">
                <BookOpen className="size-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs bg-card">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Frequência Geral</p>
                <p className="text-2xl font-black text-foreground mt-0.5">-</p>
                <span className="text-[10px] text-muted-foreground font-medium mt-1 block">Aguardando registro de chamadas</span>
              </div>
              <div className="size-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 font-black">
                <CalendarCheck className="size-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs bg-card">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Status do Perfil</p>
                <p className="text-sm font-black text-emerald-600 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="size-4" /> Completo
                </p>
                <span className="text-[10px] text-muted-foreground font-medium mt-1 block">Cadastro liberado</span>
              </div>
              <div className="size-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 font-black">
                <User className="size-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs bg-card">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Vitrine de Vagas</p>
                <p className="text-sm font-black text-primary mt-1">Inscreva-se Livremente</p>
                <span className="text-[10px] text-muted-foreground font-medium mt-1 block">Escolha suas oficinas</span>
              </div>
              <div className="size-11 rounded-2xl bg-brand-gradient text-white flex items-center justify-center font-black shadow-brand">
                <Compass className="size-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resumo de Atividades Em Andamento */}
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-3 border-b border-border/60 flex items-center justify-between">
            <CardTitle className="text-base font-extrabold flex items-center gap-2">
              <BookOpen className="size-4 text-primary" />
              <span>Minhas Oficinas e Turmas Ativas</span>
            </CardTitle>
            <Button variant="outline" size="sm" asChild className="text-xs font-bold h-8">
              <Link to="/aluno/atividades">
                Explorar Vitrine <ArrowRight className="size-3.5 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            {inscricoes.length === 0 ? (
              <div className="py-10 text-center space-y-3">
                <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <Compass className="size-6" />
                </div>
                <p className="text-sm font-bold text-foreground">Você ainda não se inscreveu em nenhuma atividade</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Navegue pela nossa vitrine de vagas e escolha as oficinas esportivas, culturais e educacionais disponíveis nos polos CUFA.
                </p>
                <Button asChild className="bg-brand-gradient font-bold text-xs shadow-brand mt-2">
                  <Link to="/aluno/atividades">Ver Atividades Disponíveis</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {inscricoes.map((item) => (
                  <Card key={item.id} className="border-border bg-card shadow-xs">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <Badge className="bg-primary/10 text-primary font-bold border-primary/20 text-xs">
                          {item.atividadeNome}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] border-emerald-500/30 bg-emerald-500/10 text-emerald-600 font-bold">
                          Matriculado
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-foreground flex items-center gap-1">
                          <Building2 className="size-3.5 text-muted-foreground" /> {item.poloNome}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{item.turmaNome}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AlunoShell>
  );
}

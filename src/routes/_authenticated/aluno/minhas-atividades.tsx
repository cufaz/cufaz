import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  BookOpen,
  Building2,
  Calendar,
  Clock,
  User,
  Trash2,
  Compass,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { AlunoShell } from "@/components/aluno/AlunoShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/aluno/minhas-atividades")({
  component: MinhasAtividadesAlunoPage,
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

function MinhasAtividadesAlunoPage() {
  const [alunoEmail, setAlunoEmail] = useState("");
  const [inscricoes, setInscricoes] = useState<InscricaoAluno[]>([]);

  function loadInscricoes() {
    const userEmail = localStorage.getItem("cufa_logged_user") || "aluno@cufa.com.br";
    setAlunoEmail(userEmail);

    try {
      const stored = localStorage.getItem(`cufa_aluno_inscricoes_${userEmail}`);
      if (stored) {
        const parsed = JSON.parse(stored);
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
    loadInscricoes();
    window.addEventListener("cufa_aluno_inscricoes_updated", loadInscricoes);
    return () => {
      window.removeEventListener("cufa_aluno_inscricoes_updated", loadInscricoes);
    };
  }, []);

  function handleCancelarInscricao(id: string, nomeAtiv: string) {
    if (!window.confirm(`Tem certeza que deseja cancelar sua inscrição na oficina ${nomeAtiv}?`)) return;

    try {
      const stored = localStorage.getItem(`cufa_aluno_inscricoes_${alunoEmail}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        const updated = parsed.filter((i: any) => i.id !== id);
        localStorage.setItem(`cufa_aluno_inscricoes_${alunoEmail}`, JSON.stringify(updated));
        window.dispatchEvent(new Event("cufa_aluno_inscricoes_updated"));
      }
      toast.success(`Inscrição na oficina ${nomeAtiv} cancelada com sucesso.`);
    } catch {
      toast.error("Erro ao cancelar inscrição.");
    }
  }

  return (
    <AlunoShell
      title="Minhas Atividades & Turmas"
      description="Gerencie todas as oficinas esportivas, culturais e educacionais nas quais você está matriculado."
    >
      <div className="space-y-6">
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-3 border-b border-border/60 flex items-center justify-between">
            <CardTitle className="text-base font-extrabold flex items-center gap-2">
              <BookOpen className="size-4 text-primary" />
              <span>Lista de Matriculas Ativas</span>
            </CardTitle>
            <Button variant="outline" size="sm" asChild className="text-xs font-bold h-8">
              <Link to="/aluno/atividades">
                <Compass className="size-3.5 mr-1" /> Explorar Vitrine de Vagas
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            {inscricoes.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <BookOpen className="size-6" />
                </div>
                <p className="text-sm font-bold text-foreground">Você ainda não se inscreveu em nenhuma turma</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Navegue pela Vitrine de Atividades e escolha o polo e horário que melhor atendem sua rotina!
                </p>
                <Button asChild className="bg-brand-gradient font-bold text-xs shadow-brand mt-2">
                  <Link to="/aluno/atividades">Ir para Vitrine de Atividades</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {inscricoes.map((item) => (
                  <Card key={item.id} className="border-border bg-card shadow-xs">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <Badge className="bg-primary/10 text-primary font-bold border-primary/20 text-xs">
                          {item.atividadeNome}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] border-emerald-500/30 bg-emerald-500/10 text-emerald-600 font-bold">
                          Ativa
                        </Badge>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <Building2 className="size-3.5 text-muted-foreground shrink-0" />
                          <span>{item.poloNome}</span>
                        </p>
                        <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                          <Clock className="size-3.5 text-muted-foreground shrink-0" />
                          <span>{item.turmaNome}</span>
                        </p>
                        {item.professorNome && (
                          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                            <User className="size-3.5 text-muted-foreground shrink-0" />
                            <span>{item.professorNome}</span>
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground/80 pt-1">
                          Matriculado em: {item.dataMatricula}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-border/60">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelarInscricao(item.id, item.atividadeNome)}
                          className="w-full text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 h-8"
                        >
                          <Trash2 className="size-3.5 mr-1" /> Cancelar Inscrição
                        </Button>
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

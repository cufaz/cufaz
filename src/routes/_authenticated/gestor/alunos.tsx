import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Search } from "lucide-react";

import { listAlunos } from "@/lib/gestao.functions";
import { GestorShell } from "@/components/admin/GestorShell";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/gestor/alunos")({ component: AlunosPage });

type Row = Record<string, any>;

function AlunosPage() {
  const fetchAlunos = useServerFn(listAlunos);
  const { data, isLoading } = useQuery({ queryKey: ["alunos"], queryFn: () => fetchAlunos({}) });
  const [busca, setBusca] = useState("");

  const alunos: Row[] = (data?.alunos ?? []).filter((a: Row) =>
    String(a['nome'] ?? "").toLowerCase().includes(busca.toLowerCase()),
  );
  const matriculas: Row[] = data?.matriculas ?? [];

  return (
    <GestorShell
      title="Alunos"
      description="Alunos cadastrados na plataforma e suas matrículas por turma."
    >
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar aluno" value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>

      {isLoading ? (
        <Loader2 className="size-6 animate-spin text-primary" />
      ) : alunos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Ainda não há alunos cadastrados. Assim que abrirmos a área do aluno, as matrículas aparecerão aqui.
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {alunos.map((a) => {
            const minhas = matriculas.filter((m) => m['aluno_id'] === a['id']);
            return (
              <article key={String(a['id'])} className="rounded-xl border border-border bg-card p-4">
                <h2 className="text-base font-bold">{String(a['nome'] ?? "Sem nome")}</h2>
                <p className="text-xs text-muted-foreground">{String(a['email'] ?? "")}</p>
                <p className="mt-1 text-xs text-muted-foreground">{String(a['telefone'] ?? "")}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {minhas.length === 0 ? (
                    <span className="text-xs text-muted-foreground">Sem matrícula ativa</span>
                  ) : (
                    minhas.map((m) => (
                      <Badge key={String(m['id'])} variant="secondary" className="text-[10px] font-bold">
                        {m['turmas']?.atividades?.nome} · {m['turmas']?.nome}
                      </Badge>
                    ))
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </GestorShell>
  );
}

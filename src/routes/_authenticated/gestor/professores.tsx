import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Star } from "lucide-react";

import { listProfessores } from "@/lib/gestao.functions";
import { GestorShell } from "@/components/admin/GestorShell";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/gestor/professores")({
  component: ProfessoresPage,
});

type Row = Record<string, any>;

function ProfessoresPage() {
  const fetchProfessores = useServerFn(listProfessores);
  const { data, isLoading } = useQuery({
    queryKey: ["professores"],
    queryFn: () => fetchProfessores({}),
  });

  const professores: Row[] = data?.professores ?? [];
  const vinculos: Row[] = data?.vinculos ?? [];
  const avaliacoes: Row[] = data?.avaliacoes ?? [];

  return (
    <GestorShell
      title="Professores"
      description="Professores cadastrados, turmas atribuídas e avaliações recebidas dos alunos."
    >
      {isLoading ? (
        <Loader2 className="size-6 animate-spin text-primary" />
      ) : professores.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Ainda não há professores cadastrados. Os cadastros feitos no site aparecerão aqui para aprovação e
          vínculo com as turmas.
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {professores.map((p) => {
            const suas = vinculos.filter((t) => t['professor_id'] === p['id']);
            const notas = avaliacoes.filter((a) => a['professor_id'] === p['id']).map((a) => Number(a['nota']));
            const media = notas.length ? notas.reduce((s2, n) => s2 + n, 0) / notas.length : null;
            return (
              <article key={String(p['id'])} className="rounded-xl border border-border bg-card p-4">
                <h2 className="text-base font-bold">{String(p['nome'] ?? "Sem nome")}</h2>
                <p className="text-xs text-muted-foreground">{String(p['email'] ?? "")}</p>
                <p className="mt-1 flex items-center gap-1 text-xs font-bold text-primary">
                  <Star className="size-3.5 fill-current" />
                  {media !== null ? `${media.toFixed(1)} (${notas.length})` : "Sem avaliações"}
                </p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {suas.length === 0 ? (
                    <span className="text-xs text-muted-foreground">Sem turma atribuída</span>
                  ) : (
                    suas.map((t) => (
                      <Badge key={String(t['id'])} variant="secondary" className="text-[10px] font-bold">
                        {t['atividades']?.nome}
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

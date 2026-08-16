import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ClipboardCheck, Check, X, Calendar, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { PoloResponsavelShell } from "@/components/polo/PoloResponsavelShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/polo/chamada")({
  component: PoloChamadaPage,
});

interface AlunoChamada {
  id: string;
  nome: string;
  presente: boolean;
}

export function PoloChamadaPage() {
  const [poloNome] = useState(() => localStorage.getItem("cufa_polo_atribuido") || "Complexo da Penha");

  // Dynamic Activity List per Polo (Anexo 1)
  const atividadesPolo = poloNome.toLowerCase().includes("madureira")
    ? ["Basquete", "Karatê", "Capoeira"]
    : poloNome.toLowerCase().includes("paraisopolis")
    ? ["Futsal"]
    : ["Jiu Jitsu", "Aula de Inglês", "Natação"];

  const [atividade, setAtividade] = useState(atividadesPolo[0]);
  const [dataChamada, setDataChamada] = useState("2026-08-16");

  // ZERO Mock Data by default for clean testing (Anexo 2 & 3)
  const [alunos, setAlunos] = useState<AlunoChamada[]>(() => {
    try {
      const stored = localStorage.getItem(`cufa_chamada_${poloNome}_${atividade}_${dataChamada}`);
      if (stored) return JSON.parse(stored);

      // If polo has enrolled students in cufa_alunos_polo, load them!
      const todosAlunos = localStorage.getItem("cufa_alunos_polo");
      if (todosAlunos) {
        const parsed = JSON.parse(todosAlunos);
        const filtrados = parsed.filter((a: any) => a.atividade === atividade);
        if (filtrados.length > 0) {
          return filtrados.map((a: any) => ({ id: a.id, nome: a.nome, presente: true }));
        }
      }
    } catch {}
    return [];
  });

  // Auto-Save presence to localStorage on every toggle (Anexo 3)
  function togglePresenca(id: string, novoStatus: boolean) {
    const atualizados = alunos.map((a) => (a.id === id ? { ...a, presente: novoStatus } : a));
    setAlunos(atualizados);
    try {
      localStorage.setItem(`cufa_chamada_${atividade}_${dataChamada}`, JSON.stringify(atualizados));
    } catch {}
    const aluno = alunos.find((a) => a.id === id);
    toast.success(`Frequência salva: ${aluno?.nome || "Aluno"}`, {
      description: novoStatus ? "Status: Presente" : "Status: Falta",
    });
  }

  const presentesTotal = alunos.filter((a) => a.presente).length;
  const faltasTotal = alunos.length - presentesTotal;
  const taxaPresenca = alunos.length > 0 ? ((presentesTotal / alunos.length) * 100).toFixed(1) : "0.0";

  return (
    <PoloResponsavelShell
      title="Chamada / Registro de Frequência"
      description={`Marcação de presença diária dos alunos por oficina — ${poloNome}. As alterações são salvas automaticamente ao clicar.`}
    >
      <div className="space-y-6">
        {/* Controles da Chamada */}
        <div className="grid gap-3 sm:grid-cols-3 bg-card p-4 rounded-2xl border border-border shadow-xs">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
              <BookOpen className="size-3.5 text-primary" /> Oficina / Atividade
            </label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground"
              value={atividade}
              onChange={(e) => setAtividade(e.target.value)}
            >
              {atividadesPolo.map((ativ) => (
                <option key={ativ} value={ativ}>
                  {ativ}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
              <Calendar className="size-3.5 text-primary" /> Data da Aula
            </label>
            <input
              type="date"
              value={dataChamada}
              onChange={(e) => setDataChamada(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 sm:pt-0">
            <div className="text-right">
              <span className="text-xs text-muted-foreground block">Taxa de Presença</span>
              <span className="text-xl font-extrabold text-emerald-600">{taxaPresenca}%</span>
            </div>
          </div>
        </div>

        {/* Resumo da Frequência */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-xl bg-card border border-border">
            <span className="text-xs text-muted-foreground block font-medium">Total de Alunos</span>
            <span className="text-2xl font-extrabold text-foreground">{alunos.length}</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900">
            <span className="text-xs block font-medium">Presentes</span>
            <span className="text-2xl font-extrabold text-emerald-600">{presentesTotal}</span>
          </div>
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive">
            <span className="text-xs block font-medium">Faltas</span>
            <span className="text-2xl font-extrabold text-destructive">{faltasTotal}</span>
          </div>
        </div>

        {/* Lista de Alunos para Marcação */}
        <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="border-b border-border bg-muted/40 p-4 flex items-center justify-between">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <ClipboardCheck className="size-4 text-primary" /> Lista de Chamada — Turma Tarde
            </h3>
            <span className="text-xs text-muted-foreground font-semibold">
              Clique no botão para alternar entre Presença e Falta
            </span>
          </div>

          <div className="divide-y divide-border/60">
            {alunos.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <ClipboardCheck className="size-10 mx-auto text-muted-foreground/40 mb-2" />
                <p className="font-bold text-sm text-foreground">Nenhum aluno inscrito nesta oficina no momento.</p>
                <p className="text-xs">Cadastre alunos na aba 'Alunos Matriculados' para realizar o registro diário de frequência.</p>
              </div>
            ) : (
              alunos.map((a) => (
                <div key={a.id} className="p-3.5 px-4 flex items-center justify-between hover:bg-muted/20">
                  <div className="flex items-center gap-3">
                    <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                      {a.nome.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="font-bold text-sm text-foreground">{a.nome}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={a.presente ? "default" : "outline"}
                      className={`font-bold text-xs ${
                        a.presente
                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={() => togglePresenca(a.id, true)}
                    >
                      <Check className="size-3.5 mr-1" /> Presente
                    </Button>
                    <Button
                      size="sm"
                      variant={!a.presente ? "destructive" : "outline"}
                      className={`font-bold text-xs ${
                        !a.presente
                          ? "bg-destructive text-white"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={() => togglePresenca(a.id, false)}
                    >
                      <X className="size-3.5 mr-1" /> Falta
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </PoloResponsavelShell>
  );
}

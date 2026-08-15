import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Plus, Pencil, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";

import {
  listAtividades,
  saveAtividade,
  deleteAtividade,
  saveTurma,
  deleteTurma,
  getOrcamentoAtividade,
  saveItemOrcamento,
  deleteItemOrcamento,
} from "@/lib/gestao.functions";
import { GestorShell } from "@/components/admin/GestorShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { brl } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/gestor/atividades")({
  component: AtividadesPage,
});

type Row = Record<string, any>;

function AtividadesPage() {
  const qc = useQueryClient();
  const fetchAtividades = useServerFn(listAtividades);
  const salvar = useServerFn(saveAtividade);
  const apagar = useServerFn(deleteAtividade);
  const salvarTurma = useServerFn(saveTurma);
  const apagarTurma = useServerFn(deleteTurma);
  const fetchOrcamento = useServerFn(getOrcamentoAtividade);
  const salvarItem = useServerFn(saveItemOrcamento);
  const apagarItem = useServerFn(deleteItemOrcamento);

  const [form, setForm] = useState<Row | null>(null);
  const [turmaForm, setTurmaForm] = useState<Row | null>(null);
  const [orcamentoDe, setOrcamentoDe] = useState<Row | null>(null);
  const [itemForm, setItemForm] = useState<Row | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["atividades"],
    queryFn: () => fetchAtividades({}),
  });

  const orcamento = useQuery({
    queryKey: ["orcamento", orcamentoDe?.['id']],
    queryFn: () => fetchOrcamento({ data: { atividadeId: String(orcamentoDe?.['id']) } }),
    enabled: Boolean(orcamentoDe),
  });

  const ok = (msg: string) => {
    toast.success(msg);
    qc.invalidateQueries();
  };
  const fail = (e: Error) => toast.error("Erro", { description: e.message });

  const mAtividade = useMutation({
    mutationFn: (v: Row) => salvar({ data: v }),
    onSuccess: () => {
      setForm(null);
      ok("Atividade salva");
    },
    onError: fail,
  });
  const mDelAtividade = useMutation({
    mutationFn: (id: string) => apagar({ data: { id } }),
    onSuccess: () => ok("Atividade removida"),
    onError: fail,
  });
  const mTurma = useMutation({
    mutationFn: (v: Row) => salvarTurma({ data: v }),
    onSuccess: () => {
      setTurmaForm(null);
      ok("Turma salva");
    },
    onError: fail,
  });
  const mDelTurma = useMutation({
    mutationFn: (id: string) => apagarTurma({ data: { id } }),
    onSuccess: () => ok("Turma removida"),
    onError: fail,
  });
  const mItem = useMutation({
    mutationFn: (v: Row) => salvarItem({ data: v }),
    onSuccess: () => {
      setItemForm(null);
      ok("Item salvo");
    },
    onError: fail,
  });
  const mDelItem = useMutation({
    mutationFn: (id: string) => apagarItem({ data: { id } }),
    onSuccess: () => ok("Item removido"),
    onError: fail,
  });

  const polos: Row[] = data?.polos ?? [];
  const atividades: Row[] = data?.atividades ?? [];

  return (
    <GestorShell
      title="Atividades e turmas"
      description="Modalidades ofertadas em cada polo, com vagas, turmas e itens de custo."
      actions={
        <Button
          className="bg-brand-gradient font-bold text-white shadow-brand"
          onClick={() =>
            setForm({
              nome: "",
              slug: "",
              polo_id: polos[0]?.['id'] ?? "",
              descricao: "",
              dias: "",
              vagas: 0,
              beneficiarios_projetados: 0,
              custo_mensal: 0,
              ativo: true,
            })
          }
        >
          <Plus className="mr-1 size-4" /> Nova atividade
        </Button>
      }
    >
      {isLoading ? (
        <Loader2 className="size-6 animate-spin text-primary" />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {atividades.map((a) => (
            <article key={String(a['id'])} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Badge variant="secondary" className="mb-1 text-[10px] font-bold">
                    {a['polos']?.nome}
                  </Badge>
                  <h2 className="text-base font-bold">{String(a['nome'])}</h2>
                  <p className="text-xs text-muted-foreground">{String(a['dias'] ?? "")}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => setOrcamentoDe(a)}>
                    <Wallet className="size-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setForm({ ...a, polos: undefined, turmas: undefined })}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => mDelAtividade.mutate(String(a['id']))}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                {String(a['descricao'] ?? "")}
              </p>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3 sm:text-sm">
                <div>
                  <p className="text-[11px] text-muted-foreground">Vagas</p>
                  <p className="font-bold">{String(a['vagas'])}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Beneficiários</p>
                  <p className="font-bold">{String(a['beneficiarios_projetados'])}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Custo/mês</p>
                  <p className="font-bold text-primary">{brl(a['custo_mensal'])}</p>
                </div>
              </div>

              <div className="mt-3 border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Turmas</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs font-bold text-primary"
                    onClick={() =>
                      setTurmaForm({ atividade_id: a['id'], nome: "", turno: "Tarde", horario: "", vagas: 0 })
                    }
                  >
                    <Plus className="mr-1 size-3" /> Turma
                  </Button>
                </div>
                <ul className="mt-1 grid gap-1">
                  {(a['turmas'] ?? []).map((t: Row) => (
                    <li key={String(t['id'])} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-1.5 text-xs">
                      <span className="font-semibold">
                        {String(t['nome'])} · {String(t['turno'])} {String(t['horario'] ?? "")} · {String(t['vagas'])} vagas
                      </span>
                      <span className="flex gap-1">
                        <button type="button" className="text-primary" onClick={() => setTurmaForm({ ...t })}>
                          <Pencil className="size-3.5" />
                        </button>
                        <button type="button" className="text-destructive" onClick={() => mDelTurma.mutate(String(t['id']))}>
                          <Trash2 className="size-3.5" />
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Atividade */}
      <Dialog open={Boolean(form)} onOpenChange={(v) => !v && setForm(null)}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{form?.['id'] ? "Editar atividade" : "Nova atividade"}</DialogTitle>
          </DialogHeader>
          {form ? (
            <form
              className="grid gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                mAtividade.mutate(form);
              }}
            >
              <div className="space-y-1.5">
                <Label>Polo</Label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={String(form['polo_id'] ?? "")}
                  onChange={(e) => setForm({ ...form, polo_id: e.target.value })}
                >
                  {polos.map((p) => (
                    <option key={String(p['id'])} value={String(p['id'])}>
                      {String(p['nome'])}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Nome</Label>
                  <Input required value={String(form['nome'] ?? "")} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Identificador (slug)</Label>
                  <Input required value={String(form['slug'] ?? "")} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Descrição</Label>
                <Textarea rows={4} value={String(form['descricao'] ?? "")} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Dias</Label>
                  <Input value={String(form['dias'] ?? "")} onChange={(e) => setForm({ ...form, dias: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Vagas</Label>
                  <Input type="number" value={Number(form['vagas'] ?? 0)} onChange={(e) => setForm({ ...form, vagas: Number(e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Beneficiários projetados</Label>
                  <Input type="number" value={Number(form['beneficiarios_projetados'] ?? 0)} onChange={(e) => setForm({ ...form, beneficiarios_projetados: Number(e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Custo mensal (R$)</Label>
                  <Input type="number" step="0.01" value={Number(form['custo_mensal'] ?? 0)} onChange={(e) => setForm({ ...form, custo_mensal: Number(e.target.value) })} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-brand-gradient font-bold text-white">
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Turma */}
      <Dialog open={Boolean(turmaForm)} onOpenChange={(v) => !v && setTurmaForm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{turmaForm?.['id'] ? "Editar turma" : "Nova turma"}</DialogTitle>
          </DialogHeader>
          {turmaForm ? (
            <form
              className="grid gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                mTurma.mutate(turmaForm);
              }}
            >
              <div className="space-y-1.5">
                <Label>Nome</Label>
                <Input required value={String(turmaForm['nome'] ?? "")} onChange={(e) => setTurmaForm({ ...turmaForm, nome: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Turno</Label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={String(turmaForm['turno'] ?? "Tarde")}
                    onChange={(e) => setTurmaForm({ ...turmaForm, turno: e.target.value })}
                  >
                    {["Manhã", "Tarde", "Noite"].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Horário</Label>
                  <Input value={String(turmaForm['horario'] ?? "")} onChange={(e) => setTurmaForm({ ...turmaForm, horario: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Limite de vagas</Label>
                <Input type="number" value={Number(turmaForm['vagas'] ?? 0)} onChange={(e) => setTurmaForm({ ...turmaForm, vagas: Number(e.target.value) })} />
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-brand-gradient font-bold text-white">
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Orçamento */}
      <Dialog open={Boolean(orcamentoDe)} onOpenChange={(v) => !v && setOrcamentoDe(null)}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Orçamento previsto — {String(orcamentoDe?.['nome'] ?? "")}</DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Total mensal:{" "}
              <span className="font-bold text-primary">
                {brl((orcamento.data?.itens ?? []).reduce((s: number, i: Row) => s + Number(i['custo_mensal']), 0))}
              </span>
            </p>
            <Button
              size="sm"
              variant="secondary"
              className="font-bold"
              onClick={() =>
                setItemForm({
                  atividade_id: orcamentoDe?.['id'],
                  item: "",
                  descricao: "",
                  quantidade: "",
                  custo_mensal: 0,
                  categoria_id: orcamento.data?.categorias?.[0]?.id ?? null,
                })
              }
            >
              <Plus className="mr-1 size-4" /> Item
            </Button>
          </div>

          <div className="mt-3 grid gap-1.5">
            {(orcamento.data?.itens ?? []).map((i: Row) => (
              <div key={String(i['id'])} className="flex items-start justify-between gap-2 rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-bold">{String(i['item'])}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {i['categorias_custo']?.nome} · {String(i['quantidade'] ?? "")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{String(i['descricao'] ?? "")}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-sm font-bold text-primary">{brl(i['custo_mensal'])}</span>
                  <button type="button" className="text-primary" onClick={() => setItemForm({ ...i, categorias_custo: undefined })}>
                    <Pencil className="size-4" />
                  </button>
                  <button type="button" className="text-destructive" onClick={() => mDelItem.mutate(String(i['id']))}>
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Item de orçamento */}
      <Dialog open={Boolean(itemForm)} onOpenChange={(v) => !v && setItemForm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{itemForm?.['id'] ? "Editar item" : "Novo item"}</DialogTitle>
          </DialogHeader>
          {itemForm ? (
            <form
              className="grid gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                mItem.mutate(itemForm);
              }}
            >
              <div className="space-y-1.5">
                <Label>Item ou serviço</Label>
                <Input required value={String(itemForm['item'] ?? "")} onChange={(e) => setItemForm({ ...itemForm, item: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={String(itemForm['categoria_id'] ?? "")}
                  onChange={(e) => setItemForm({ ...itemForm, categoria_id: e.target.value })}
                >
                  {(orcamento.data?.categorias ?? []).map((c: Row) => (
                    <option key={String(c['id'])} value={String(c['id'])}>
                      {String(c['nome'])}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Descrição</Label>
                <Textarea rows={2} value={String(itemForm['descricao'] ?? "")} onChange={(e) => setItemForm({ ...itemForm, descricao: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Quantidade</Label>
                  <Input value={String(itemForm['quantidade'] ?? "")} onChange={(e) => setItemForm({ ...itemForm, quantidade: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Custo mensal (R$)</Label>
                  <Input type="number" step="0.01" value={Number(itemForm['custo_mensal'] ?? 0)} onChange={(e) => setItemForm({ ...itemForm, custo_mensal: Number(e.target.value) })} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-brand-gradient font-bold text-white">
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </GestorShell>
  );
}

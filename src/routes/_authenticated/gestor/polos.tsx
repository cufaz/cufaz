import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { listPolos, savePolo, deletePolo } from "@/lib/gestao.functions";
import { GestorShell } from "@/components/admin/GestorShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { brl } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/gestor/polos")({ component: PolosPage });

type Polo = Record<string, string | number | boolean | null>;

const vazio: Polo = {
  nome: "",
  slug: "",
  cidade: "",
  uf: "RJ",
  endereco: "",
  perfil_tematico: "",
  ponto_focal: "",
  fotos_url: "",
  vagas_totais: 0,
  beneficiarios_projetados: 0,
  orcamento_mensal: 0,
  ativo: true,
};

function PolosPage() {
  const qc = useQueryClient();
  const fetchPolos = useServerFn(listPolos);
  const salvar = useServerFn(savePolo);
  const apagar = useServerFn(deletePolo);

  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState<Polo>(vazio);

  const { data, isLoading } = useQuery({ queryKey: ["polos"], queryFn: () => fetchPolos({}) });

  const mSalvar = useMutation({
    mutationFn: (values: Polo) => salvar({ data: values }),
    onSuccess: () => {
      toast.success("Polo salvo");
      setAberto(false);
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error("Erro ao salvar", { description: e.message }),
  });

  const mApagar = useMutation({
    mutationFn: (id: string) => apagar({ data: { id } }),
    onSuccess: () => {
      toast.success("Polo removido");
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error("Erro ao remover", { description: e.message }),
  });

  function novo() {
    setForm(vazio);
    setAberto(true);
  }

  function editar(p: Polo) {
    setForm({ ...p });
    setAberto(true);
  }

  function set(k: string, v: string | number | boolean) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  return (
    <GestorShell
      title="Polos CUFA"
      description="Cadastro das comunidades atendidas pelo projeto."
      actions={
        <Button onClick={novo} className="bg-brand-gradient font-bold text-white shadow-brand">
          <Plus className="mr-1 size-4" /> Novo polo
        </Button>
      }
    >
      {isLoading ? (
        <Loader2 className="size-6 animate-spin text-primary" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(data ?? []).map((p: Polo) => {
            const nome = String(p['nome'] ?? "Polo CUFA");
            const cidade = String(p['cidade'] ?? p['cidade_nome'] ?? "—");
            const uf = String(p['uf'] ?? p['estado'] ?? "RJ");
            const vagas = p['vagas_totais'] ?? p['vagas'] ?? 0;
            const beneficiarios = p['beneficiarios_projetados'] ?? p['beneficiarios'] ?? 0;
            const orcamento = Number(p['orcamento_mensal'] ?? 0);

            return (
              <article key={String(p['id'])} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold">{nome}</h2>
                    <p className="text-xs text-muted-foreground">
                      {cidade} / {uf} · {p['ativo'] !== false ? "Ativo" : "Inativo"}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => editar(p)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => mApagar.mutate(String(p['id']))}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{String(p['endereco'] ?? "")}</p>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3 sm:text-sm">
                  <div>
                    <dt className="text-[11px] text-muted-foreground">Vagas</dt>
                    <dd className="break-words font-bold tabular-nums">{String(vagas)}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-muted-foreground">Beneficiários</dt>
                    <dd className="break-words font-bold tabular-nums">{String(beneficiarios)}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-muted-foreground">Orçamento/mês</dt>
                    <dd className="break-words font-bold tabular-nums text-primary">{brl(orcamento)}</dd>
                  </div>
                </dl>
                <p className="mt-3 text-xs text-muted-foreground">
                  Ponto focal: <span className="font-semibold text-foreground">{String(p['ponto_focal'] ?? "—")}</span>
                </p>
              </article>
            );
          })}
        </div>
      )}

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{form['id'] ? "Editar polo" : "Novo polo"}</DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              mSalvar.mutate(form);
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Nome</Label>
                <Input required value={String(form['nome'] ?? "")} onChange={(e) => set("nome", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Identificador (slug)</Label>
                <Input required value={String(form['slug'] ?? "")} onChange={(e) => set("slug", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Cidade</Label>
                <Input required value={String(form['cidade'] ?? "")} onChange={(e) => set("cidade", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>UF</Label>
                <Input required maxLength={2} value={String(form['uf'] ?? "")} onChange={(e) => set("uf", e.target.value.toUpperCase())} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Endereço</Label>
              <Textarea rows={2} value={String(form['endereco'] ?? "")} onChange={(e) => set("endereco", e.target.value)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Perfil temático</Label>
                <Input value={String(form['perfil_tematico'] ?? "")} onChange={(e) => set("perfil_tematico", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Ponto focal</Label>
                <Input value={String(form['ponto_focal'] ?? "")} onChange={(e) => set("ponto_focal", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Fotos do espaço (link)</Label>
                <Input value={String(form['fotos_url'] ?? "")} onChange={(e) => set("fotos_url", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Vagas totais</Label>
                <Input type="number" value={Number(form['vagas_totais'] ?? 0)} onChange={(e) => set("vagas_totais", Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label>Beneficiários projetados</Label>
                <Input type="number" value={Number(form['beneficiarios_projetados'] ?? 0)} onChange={(e) => set("beneficiarios_projetados", Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label>Orçamento mensal (R$)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm font-bold text-muted-foreground">R$</span>
                  <Input
                    type="text"
                    required
                    value={
                      Number(form['orcamento_mensal'] ?? 0).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    }
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "");
                      const val = raw ? parseFloat(raw) / 100 : 0;
                      set("orcamento_mensal", val);
                    }}
                    className="pl-9 font-extrabold text-foreground"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label>Polo ativo</Label>
              <Switch checked={Boolean(form['ativo'])} onCheckedChange={(v) => set("ativo", v)} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={mSalvar.isPending} className="bg-brand-gradient font-bold text-white">
                {mSalvar.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null} Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </GestorShell>
  );
}

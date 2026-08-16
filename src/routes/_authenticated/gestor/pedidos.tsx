import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Check, X, Plus } from "lucide-react";
import { toast } from "sonner";

import { listPedidos, decidirPedido, criarPedido, listPolos, getFinanceiro } from "@/lib/gestao.functions";
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
import { brl, competenciaLabel, competenciaOptions } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/gestor/pedidos")({ component: PedidosPage });

type Row = Record<string, any>;

const cor: Record<string, string> = {
  pendente: "bg-amber-500/15 text-amber-600",
  aprovado: "bg-emerald-500/15 text-emerald-600",
  reprovado: "bg-destructive/15 text-destructive",
};

function PedidosPage() {
  const qc = useQueryClient();
  const fetchPedidos = useServerFn(listPedidos);
  const decidir = useServerFn(decidirPedido);
  const criar = useServerFn(criarPedido);
  const fetchPolos = useServerFn(listPolos);
  const fetchFin = useServerFn(getFinanceiro);

  const meses = competenciaOptions();
  const [form, setForm] = useState<Row | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["pedidos"], queryFn: () => fetchPedidos({}) });
  const polos = useQuery({ queryKey: ["polos"], queryFn: () => fetchPolos({}) });
  const fin = useQuery({ queryKey: ["financeiro-cats"], queryFn: () => fetchFin({ data: {} }) });

  const mDecidir = useMutation({
    mutationFn: (v: { id: string; status: "aprovado" | "reprovado" }) => decidir({ data: v }),
    onSuccess: () => {
      toast.success("Pedido atualizado");
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error("Erro", { description: e.message }),
  });

  const mCriar = useMutation({
    mutationFn: (v: Row) => criar({ data: v }),
    onSuccess: () => {
      setForm(null);
      toast.success("Pedido registrado");
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error("Erro", { description: e.message }),
  });

  const DEFAULT_CATEGORIAS = [
    "Pessoal",
    "Materiais esportivos",
    "Materiais / consumo",
    "Comunicação",
    "Evento pedagógico / esportivo",
    "Encargos",
    "Infraestrutura",
    "Administrativo / RH essencial",
    "Serviços técnicos essenciais",
    "Material didático e apostilas",
    "Uniformes e vestuário",
    "Insumos, lanche e apoio operacional",
    "Kit Lanche",
    "Custos Extras",
  ];

  const [categorias, setCategorias] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("cufa_categorias_pedidos");
      if (stored) return JSON.parse(stored);
    } catch {}
    return DEFAULT_CATEGORIAS;
  });

  const [novaCatModalOpen, setNovaCatModalOpen] = useState(false);
  const [novaCatNome, setNovaCatNome] = useState("");

  function handleCriarCategoria(e: React.FormEvent) {
    e.preventDefault();
    if (!novaCatNome.trim()) return;
    const itemLimpo = novaCatNome.trim();
    if (categorias.includes(itemLimpo)) {
      toast.error("Categoria já cadastrada.");
      return;
    }
    const atualizadas = [...categorias, itemLimpo];
    setCategorias(atualizadas);
    try {
      localStorage.setItem("cufa_categorias_pedidos", JSON.stringify(atualizadas));
    } catch {}
    toast.success(`Categoria "${itemLimpo}" criada com sucesso!`);
    setNovaCatNome("");
    setNovaCatModalOpen(false);
  }

  const pedidos: Row[] = data ?? [];

  return (
    <GestorShell
      title="Pedidos de compra"
      description="Solicitações dos responsáveis CUFA. Ao aprovar, o valor entra no financeiro como despesa realizada."
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="font-bold border-primary text-primary hover:bg-primary/10"
            onClick={() => setNovaCatModalOpen(true)}
          >
            <Plus className="mr-1 size-4" /> Nova categoria
          </Button>
          <Button
            className="bg-brand-gradient font-bold text-white shadow-brand"
            onClick={() =>
              setForm({
                item: "",
                descricao: "",
                quantidade: 1,
                valor_unitario: 0,
                valor_total: 0,
                competencia: meses[0],
                polo_id: (polos.data as Row[] | undefined)?.[0]?.['id'] ?? null,
                categoria_id: categorias[0] || "Materiais esportivos",
                status: "pendente",
              })
            }
          >
            <Plus className="mr-1 size-4" /> Novo pedido
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <Loader2 className="size-6 animate-spin text-primary" />
      ) : pedidos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nenhum pedido de compra registrado até o momento.
        </p>
      ) : (
        <div className="grid gap-3">
          {pedidos.map((p) => (
            <article key={String(p['id'])} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Badge className={`mb-1 text-[10px] font-bold ${cor[String(p['status'])]}`} variant="secondary">
                    {String(p['status']).toUpperCase()}
                  </Badge>
                  <h2 className="text-base font-bold">{String(p['item'])}</h2>
                  <p className="text-xs text-muted-foreground">
                    {p['polos']?.nome ?? "Geral"} · {p['categorias_custo']?.nome ?? "Sem categoria"} ·{" "}
                    {competenciaLabel(String(p['competencia']))}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">{String(p['descricao'] ?? "")}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{brl(p['valor_total'])}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {String(p['quantidade'])} × {brl(p['valor_unitario'])}
                  </p>
                  {p['status'] === "pendente" ? (
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        className="bg-emerald-600 font-bold text-white hover:bg-emerald-700"
                        onClick={() => mDecidir.mutate({ id: String(p['id']), status: "aprovado" })}
                      >
                        <Check className="mr-1 size-4" /> Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="font-bold text-destructive"
                        onClick={() => mDecidir.mutate({ id: String(p['id']), status: "reprovado" })}
                      >
                        <X className="mr-1 size-4" /> Reprovar
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={Boolean(form)} onOpenChange={(v) => !v && setForm(null)}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo pedido de compra</DialogTitle>
          </DialogHeader>
          {form ? (
            <form
              className="grid gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                mCriar.mutate({
                  ...form,
                  valor_total: Number(form['quantidade']) * Number(form['valor_unitario']),
                });
              }}
            >
              <div className="space-y-1.5">
                <Label>Item ou serviço</Label>
                <Input required value={String(form['item'] ?? "")} onChange={(e) => setForm({ ...form, item: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Descrição</Label>
                <Textarea rows={2} value={String(form['descricao'] ?? "")} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Quantidade</Label>
                  <Input type="number" min={1} value={Number(form['quantidade'] ?? 1)} onChange={(e) => setForm({ ...form, quantidade: Number(e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Valor unitário (R$)</Label>
                  <Input type="number" step="0.01" value={Number(form['valor_unitario'] ?? 0)} onChange={(e) => setForm({ ...form, valor_unitario: Number(e.target.value) })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Polo</Label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={String(form['polo_id'] ?? "")}
                  onChange={(e) => setForm({ ...form, polo_id: e.target.value || null })}
                >
                  <option value="">Geral</option>
                  {((polos.data ?? []) as Row[]).map((p) => (
                    <option key={String(p['id'])} value={String(p['id'])}>
                      {String(p['nome'])}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-medium"
                  value={String(form['categoria_id'] ?? categorias[0])}
                  onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}
                >
                  {categorias.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Competência</Label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-medium"
                  value={String(form['competencia'])}
                  onChange={(e) => setForm({ ...form, competencia: e.target.value })}
                >
                  {meses.map((m) => (
                    <option key={m} value={m}>
                      {competenciaLabel(m)}
                    </option>
                  ))}
                </select>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-brand-gradient font-bold text-white">
                  Registrar pedido
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Modal Criar Nova Categoria (Anexo 1) */}
      <Dialog open={novaCatModalOpen} onOpenChange={setNovaCatModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Criar Nova Categoria de Pedido</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCriarCategoria} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Nome da Categoria</Label>
              <Input
                required
                placeholder="ex.: Transporte e Logística, Premiação..."
                value={novaCatNome}
                onChange={(e) => setNovaCatNome(e.target.value)}
                className="font-medium"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="submit" className="bg-brand-gradient font-bold text-white w-full">
                Salvar Categoria
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </GestorShell>
  );
}

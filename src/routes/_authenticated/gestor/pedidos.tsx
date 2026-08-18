import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { Loader2, Check, X, Plus, Pencil, Trash2, Settings, Tag } from "lucide-react";
import { toast } from "sonner";

import { listPedidos, decidirPedido, criarPedido, deletePedido, listPolos, getFinanceiro } from "@/lib/gestao.functions";
import { formatBRLInput, parseBRLToNumber } from "@/lib/brl";
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

import { fetchPedidosDB, createPedidoDB, updatePedidoStatusDB, deletePedidoDB } from "@/lib/pedidosService";

function PedidosPage() {
  const qc = useQueryClient();
  const fetchPolos = useServerFn(listPolos);
  const fetchFin = useServerFn(getFinanceiro);

  const meses = competenciaOptions();
  const [form, setForm] = useState<Row | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["pedidos"], queryFn: () => fetchPedidosDB() });
  const polos = useQuery({ queryKey: ["polos"], queryFn: () => fetchPolos({}) });
  const fin = useQuery({ queryKey: ["financeiro-cats"], queryFn: () => fetchFin({ data: {} }) });

  const mDecidir = useMutation({
    mutationFn: (v: { id: string; status: "aprovado" | "reprovado"; observacao?: string }) => updatePedidoStatusDB(v.id, v.status, v.observacao),
    onSuccess: () => {
      toast.success("Status do pedido atualizado no banco!");
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error("Erro ao atualizar pedido", { description: e.message }),
  });

  const mCriar = useMutation({
    mutationFn: (v: Row) => createPedidoDB(v as any),
    onSuccess: () => {
      setForm(null);
      toast.success("Pedido registrado no banco!");
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error("Erro ao criar pedido", { description: e.message }),
  });

  const mExcluir = useMutation({
    mutationFn: (v: { id: string }) => deletePedidoDB(v.id),
    onSuccess: () => {
      toast.success("Pedido excluído de todo o sistema");
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error("Erro ao excluir", { description: e.message }),
  });



  const BASE_CATEGORIAS = [
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
    "Logística",
    "Transporte e Logística",
    "Custos Extras",
  ];

  function getCleanCategorias(): string[] {
    try {
      const deletedStored = localStorage.getItem("cufa_deleted_categorias");
      const deletedList: string[] = deletedStored ? JSON.parse(deletedStored) : [];
      const stored = localStorage.getItem("cufa_categorias_pedidos");
      const baseCombined: string[] = stored ? JSON.parse(stored) : BASE_CATEGORIAS;
      return Array.from(new Set(baseCombined)).filter((c) => !deletedList.includes(String(c)));
    } catch {
      return BASE_CATEGORIAS;
    }
  }

  const [categorias, setCategorias] = useState<string[]>(getCleanCategorias);

  useEffect(() => {
    function syncCats() {
      setCategorias(getCleanCategorias());
    }
    window.addEventListener("cufa_categorias_updated", syncCats);
    return () => window.removeEventListener("cufa_categorias_updated", syncCats);
  }, []);

  const [novaCatModalOpen, setNovaCatModalOpen] = useState(false);
  const [novaCatNome, setNovaCatNome] = useState("");
  const [manageCatModalOpen, setManageCatModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");

  function handleCriarCategoria(e: React.FormEvent) {
    e.preventDefault();
    if (!novaCatNome.trim()) return;
    const itemLimpo = novaCatNome.trim();
    if (categorias.some((c) => c.toLowerCase() === itemLimpo.toLowerCase())) {
      toast.error("Categoria já cadastrada.");
      return;
    }
    const atualizadas = Array.from(new Set([...categorias, itemLimpo]));
    setCategorias(atualizadas);
    try {
      localStorage.setItem("cufa_categorias_pedidos", JSON.stringify(atualizadas));
      window.dispatchEvent(new Event("cufa_categorias_updated"));
    } catch {}
    toast.success(`Categoria "${itemLimpo}" criada com sucesso!`);
    setNovaCatNome("");
    setNovaCatModalOpen(false);
  }

  function handleSalvarEdicaoCategoria(idx: number) {
    if (!editingText.trim()) return;
    const novoNome = editingText.trim();
    const atualizadas = [...categorias];
    atualizadas[idx] = novoNome;
    const deduplicadas = Array.from(new Set(atualizadas));
    setCategorias(deduplicadas);
    try {
      localStorage.setItem("cufa_categorias_pedidos", JSON.stringify(deduplicadas));
      window.dispatchEvent(new Event("cufa_categorias_updated"));
    } catch {}
    toast.success("Categoria atualizada com sucesso!");
    setEditingIndex(null);
    setEditingText("");
  }

  function handleExcluirCategoria(idx: number) {
    const catRemovida = categorias[idx] ?? "";
    if (categorias.length <= 1) {
      toast.error("É necessário manter ao menos uma categoria cadastrada.");
      return;
    }
    const atualizadas = categorias.filter((_, i) => i !== idx);
    setCategorias(atualizadas);
    try {
      localStorage.setItem("cufa_categorias_pedidos", JSON.stringify(atualizadas));
      const deletedStored = localStorage.getItem("cufa_deleted_categorias");
      const deletedList: string[] = deletedStored ? JSON.parse(deletedStored) : [];
      if (catRemovida && !deletedList.includes(catRemovida)) {
        localStorage.setItem("cufa_deleted_categorias", JSON.stringify([...deletedList, catRemovida]));
      }
      window.dispatchEvent(new Event("cufa_categorias_updated"));
    } catch {}
    toast.success(`Categoria "${catRemovida}" removida permanentemente!`);
  }

  const [localPedidos, setLocalPedidos] = useState<Row[]>(() => {
    try {
      const stored = localStorage.getItem("cufa_compras_polo");
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  });

  useEffect(() => {
    function syncLocal() {
      try {
        const stored = localStorage.getItem("cufa_compras_polo");
        if (stored) setLocalPedidos(JSON.parse(stored));
      } catch {}
    }
    window.addEventListener("cufa_pedidos_updated", syncLocal);
    window.addEventListener("storage", syncLocal);
    return () => {
      window.removeEventListener("cufa_pedidos_updated", syncLocal);
      window.removeEventListener("storage", syncLocal);
    };
  }, []);

  const [approveModalPedido, setApproveModalPedido] = useState<Row | null>(null);
  const [aprovPoloNome, setAprovPoloNome] = useState<string>("Complexo da Penha");
  const [aprovCategoria, setAprovCategoria] = useState<string>("Materiais / consumo");
  const [aprovValorTotal, setAprovValorTotal] = useState<string>("0");

  const [editModalPedido, setEditModalPedido] = useState<Row | null>(null);

  function openEditModal(p: Row) {
    setEditModalPedido({
      ...p,
      polo_nome: p['polo_nome'] || p['polos']?.nome || "Complexo da Penha",
      categoria: p['categoria'] || p['categorias_custo']?.nome || categorias[0] || "Materiais / consumo",
      valor_total: p['valor_total'] || p['valor'] || 0,
      quantidade: p['quantidade'] || 1,
    });
  }

  function handleSalvarEdicaoPedido(e: React.FormEvent) {
    e.preventDefault();
    if (!editModalPedido) return;

    const pId = String(editModalPedido['id']);
    let updated = localPedidos.map((p) => (String(p['id']) === pId ? editModalPedido : p));
    if (!localPedidos.some((p) => String(p['id']) === pId)) {
      updated = [editModalPedido, ...localPedidos];
    }

    setLocalPedidos(updated);
    try {
      localStorage.setItem("cufa_compras_polo", JSON.stringify(updated));
      window.dispatchEvent(new Event("cufa_pedidos_updated"));
    } catch {}

    if (editModalPedido['status'] === "aprovado") {
      const valNum = Number(editModalPedido['valor_total'] || editModalPedido['valor'] || 0);
      const poloNome = String(editModalPedido['polo_nome'] || "Complexo da Penha");
      const poloIdCode = poloNome.toLowerCase().includes("penha")
        ? "penha"
        : poloNome.toLowerCase().includes("madureira")
        ? "madureira"
        : poloNome.toLowerCase().includes("paraisopolis") || poloNome.toLowerCase().includes("paraisópolis")
        ? "paraisopolis"
        : "polo-teste";

      const novoLanc = {
        id: `lanc-ped-${pId}`,
        polo_id: poloIdCode,
        descricao: `[Compra Aprovada] ${editModalPedido['item'] || 'Pedido de Compra'}`,
        valor: valNum,
        tipo: "despesa",
        natureza: "realizado",
        categoria_id: editModalPedido['categoria'],
        categoria_nome: editModalPedido['categoria'],
        competencia: "2026-08-01",
        created_at: new Date().toISOString(),
      };

      try {
        const storedLanc = localStorage.getItem("cufa_lancamentos_custom");
        let listLanc: any[] = storedLanc ? JSON.parse(storedLanc) : [];
        listLanc = listLanc.filter((l) => l.id !== `lanc-ped-${pId}`);
        localStorage.setItem("cufa_lancamentos_custom", JSON.stringify([novoLanc, ...listLanc]));
      } catch {}
    }

    toast.success("Pedido de compra editado com sucesso!");
    setEditModalPedido(null);
  }

  function openApprovalModal(p: Row) {
    const currentPolo = p['polo_nome'] || p['polos']?.nome || "Complexo da Penha";
    const currentCat = p['categoria'] || p['categorias_custo']?.nome || categorias[0] || "Materiais / consumo";
    const currentVal = Number(p['valor_total'] || p['valor'] || 0);

    setApproveModalPedido(p);
    setAprovPoloNome(currentPolo);
    setAprovCategoria(currentCat);
    setAprovValorTotal(formatBRLInput(currentVal));
  }

  function handleConfirmarAprovacao(e: React.FormEvent) {
    e.preventDefault();
    if (!approveModalPedido) return;

    const pId = String(approveModalPedido['id']);
    const valNum = parseBRLToNumber(aprovValorTotal);
    const poloIdCode = aprovPoloNome.toLowerCase().includes("penha")
      ? "penha"
      : aprovPoloNome.toLowerCase().includes("madureira")
      ? "madureira"
      : aprovPoloNome.toLowerCase().includes("paraisopolis") || aprovPoloNome.toLowerCase().includes("paraisópolis")
      ? "paraisopolis"
      : "polo-teste";

    const updatedP = {
      ...approveModalPedido,
      polo_nome: aprovPoloNome,
      polo_id: poloIdCode,
      categoria: aprovCategoria,
      valor_total: valNum,
      status: "aprovado",
    };

    let updated = localPedidos.map((p) => (String(p['id']) === pId ? updatedP : p));
    if (!localPedidos.some((p) => String(p['id']) === pId)) {
      updated = [updatedP, ...localPedidos];
    }

    setLocalPedidos(updated);
    try {
      localStorage.setItem("cufa_compras_polo", JSON.stringify(updated));
      window.dispatchEvent(new Event("cufa_pedidos_updated"));
    } catch {}

    // Register expense in financeiro!
    const novoLanc = {
      id: `lanc-ped-${Date.now()}`,
      polo_id: poloIdCode,
      descricao: `[Compra Aprovada] ${approveModalPedido['item'] || approveModalPedido['descricao'] || 'Pedido de Compra'}`,
      valor: valNum,
      tipo: "despesa",
      natureza: "realizado",
      categoria_id: aprovCategoria,
      categoria_nome: aprovCategoria,
      competencia: "2026-08-01",
      created_at: new Date().toISOString(),
    };

    try {
      const storedLanc = localStorage.getItem("cufa_lancamentos_custom");
      const listLanc = storedLanc ? JSON.parse(storedLanc) : [];
      localStorage.setItem("cufa_lancamentos_custom", JSON.stringify([novoLanc, ...listLanc]));
    } catch {}

    mDecidir.mutate({ id: pId, status: "aprovado" });
    toast.success(`Pedido APROVADO! Lançado R$ ${valNum.toFixed(2)} no Polo ${aprovPoloNome}!`);
    setApproveModalPedido(null);
  }

  function handleDecidirLocal(id: string, novoStatus: "aprovado" | "reprovado", pObj: Row) {
    let updated = localPedidos.map((p) => {
      if (String(p['id']) === String(id)) {
        return { ...p, status: novoStatus };
      }
      return p;
    });

    if (!localPedidos.some((p) => String(p['id']) === String(id))) {
      updated = [{ ...pObj, status: novoStatus }, ...localPedidos];
    }

    setLocalPedidos(updated);
    try {
      localStorage.setItem("cufa_compras_polo", JSON.stringify(updated));
      window.dispatchEvent(new Event("cufa_pedidos_updated"));
    } catch {}

    mDecidir.mutate({ id, status: novoStatus });
    toast.success(novoStatus === "reprovado" ? "Pedido reprovado!" : "Pedido atualizado!");
  }

  const [pedidoExcluir, setPedidoExcluir] = useState<Row | null>(null);

  function handleExcluirPedido() {
    const p = pedidoExcluir;
    if (!p) return;
    const pId = String(p['id']);
    const itemNome = String(p['item'] ?? p['descricao'] ?? "");

    const updated = localPedidos.filter((l) => String(l['id']) !== pId);
    setLocalPedidos(updated);
    try {
      localStorage.setItem("cufa_compras_polo", JSON.stringify(updated));
      // remove lançamentos financeiros vinculados a este pedido
      const storedLanc = localStorage.getItem("cufa_lancamentos_custom");
      const listLanc: Row[] = storedLanc ? JSON.parse(storedLanc) : [];
      const limpos = listLanc.filter((l) => {
        if (String(l['id']) === `lanc-ped-${pId}`) return false;
        const desc = String(l['descricao'] ?? "");
        if (itemNome && desc === `[Compra Aprovada] ${itemNome}`) return false;
        return true;
      });
      localStorage.setItem("cufa_lancamentos_custom", JSON.stringify(limpos));
      window.dispatchEvent(new Event("cufa_pedidos_updated"));
      window.dispatchEvent(new Event("cufa_lancamentos_updated"));
    } catch {}

    mExcluir.mutate({ id: pId });
    setPedidoExcluir(null);
  }

  const serverPedidos: Row[] = data ?? [];
  const pedidos: Row[] = [
    ...localPedidos,
    ...serverPedidos.filter((s) => !localPedidos.some((l) => String(l['id']) === String(s['id']))),
  ];

  return (
    <GestorShell
      title="Pedidos de compra"
      description="Solicitações dos responsáveis CUFA. Ao aprovar, o valor entra no financeiro como despesa realizada."
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="font-bold border-primary text-primary hover:bg-primary/10"
            onClick={() => setManageCatModalOpen(true)}
          >
            <Settings className="mr-1 size-4" /> Gerenciar categorias
          </Button>
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
          {pedidos.map((p) => {
            const pNomeStr = p['polo_nome'] ?? p['polos']?.nome ?? "Complexo da Penha";
            const pCatStr = p['categoria'] ?? p['categorias_custo']?.nome ?? "Sem categoria";
            const compStr = p['competencia'] ? competenciaLabel(String(p['competencia'])) : "Agosto / 2026";
            const valNum = Number(p['valor_total'] || p['valor'] || 0);

            return (
              <article key={String(p['id'])} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`text-[10px] font-bold ${cor[String(p['status'])]}`} variant="secondary">
                        {String(p['status']).toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] font-bold border-primary/30 text-primary">
                        Polo: {pNomeStr}
                      </Badge>
                    </div>
                    <h2 className="text-base font-bold">{String(p['item'])}</h2>
                    <p className="text-xs text-muted-foreground font-medium">
                      Categoria: <span className="text-foreground font-bold">{pCatStr}</span> · Competência: {compStr}
                    </p>
                    {p['descricao'] || p['observacao'] ? (
                      <p className="mt-2 text-xs text-muted-foreground italic">"{String(p['descricao'] ?? p['observacao'])}"</p>
                    ) : null}
                  </div>
                    <div className="flex items-center gap-1.5 justify-end mt-1">
                      <p className="text-lg font-bold text-primary">{brl(valNum)}</p>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 text-muted-foreground hover:text-primary hover:bg-muted"
                        title="Editar Pedido"
                        onClick={() => openEditModal(p)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Excluir pedido"
                        onClick={() => setPedidoExcluir(p)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-medium">
                      Qtd: {String(p['quantidade'] || 1)}
                    </p>
                    {p['status'] === "pendente" ? (
                      <div className="mt-2 flex gap-2 justify-end">
                        <Button
                          size="sm"
                          className="bg-emerald-600 font-bold text-white hover:bg-emerald-700 shadow-sm"
                          onClick={() => openApprovalModal(p)}
                        >
                          <Check className="mr-1 size-4" /> Aprovar / Definir Valores
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="font-bold text-destructive hover:bg-destructive/10"
                          onClick={() => handleDecidirLocal(String(p['id']), "reprovado", p)}
                        >
                          <X className="mr-1 size-4" /> Reprovar
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
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
                  <Label>Valor unitário</Label>
                  <Input
                    type="text"
                    value={formatBRLInput(form['valor_unitario'])}
                    onChange={(e) => setForm({ ...form, valor_unitario: parseBRLToNumber(e.target.value) })}
                    className="font-bold text-primary"
                  />
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

      {/* Modal Administrar / Gerenciar Categorias (Anexo 1) */}
      <Dialog open={manageCatModalOpen} onOpenChange={setManageCatModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Settings className="size-5 text-primary" /> Administrar Categorias
            </DialogTitle>
          </DialogHeader>

          {/* Form para Adicionar rapidamente */}
          <form onSubmit={handleCriarCategoria} className="flex items-center gap-2 py-2 border-b border-border">
            <Input
              placeholder="Nome da nova categoria..."
              value={novaCatNome}
              onChange={(e) => setNovaCatNome(e.target.value)}
              className="font-medium h-9"
            />
            <Button type="submit" size="sm" className="bg-brand-gradient font-bold text-white shrink-0">
              <Plus className="mr-1 size-4" /> Adicionar
            </Button>
          </form>

          {/* Listagem de Categorias com Editar / Excluir */}
          <div className="space-y-2 py-2">
            <p className="text-xs font-bold uppercase text-muted-foreground">
              Categorias Cadastradas ({categorias.length})
            </p>

            <div className="grid gap-2 max-h-[50vh] overflow-y-auto pr-1">
              {categorias.map((cat, idx) => (
                <div
                  key={`${cat}-${idx}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card p-2.5 hover:border-primary/50 transition-colors"
                >
                  {editingIndex === idx ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="h-8 font-medium text-sm"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="size-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        onClick={() => handleSalvarEdicaoCategoria(idx)}
                      >
                        <Check className="size-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="size-8 p-0 text-muted-foreground hover:bg-muted"
                        onClick={() => setEditingIndex(null)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Tag className="size-3.5 text-primary/70" /> {cat}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="size-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                          title="Editar categoria"
                          onClick={() => {
                            setEditingIndex(idx);
                            setEditingText(cat);
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="size-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Excluir categoria"
                          onClick={() => handleExcluirCategoria(idx)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-2 border-t border-border">
            <Button
              variant="outline"
              className="w-full font-bold"
              onClick={() => setManageCatModalOpen(false)}
            >
              Concluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Dialog para Aprovar / Definir Polo, Categoria e Valor (Anexo 5) */}
      <Dialog open={Boolean(approveModalPedido)} onOpenChange={(v) => !v && setApproveModalPedido(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">Aprovar e Lançar Pedido no Financeiro</DialogTitle>
          </DialogHeader>
          {approveModalPedido && (
            <form onSubmit={handleConfirmarAprovacao} className="space-y-4 mt-2">
              <div className="rounded-lg bg-muted/40 p-3 text-xs space-y-1">
                <p className="font-bold text-foreground">Item Solicitado: {String(approveModalPedido['item'])}</p>
                <p className="text-muted-foreground">Qtd: {String(approveModalPedido['quantidade'] || 1)}</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Polo de Destino</Label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-medium"
                  value={aprovPoloNome}
                  onChange={(e) => setAprovPoloNome(e.target.value)}
                >
                  <option value="Complexo da Penha">Complexo da Penha</option>
                  <option value="Viaduto de Madureira">Viaduto de Madureira</option>
                  <option value="Paraisópolis">Paraisópolis</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Categoria do Custo</Label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-medium"
                  value={aprovCategoria}
                  onChange={(e) => setAprovCategoria(e.target.value)}
                >
                  {categorias.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Valor Total do Pedido</Label>
                <Input
                  type="text"
                  required
                  placeholder="R$ 0,00"
                  value={aprovValorTotal}
                  onChange={(e) => setAprovValorTotal(formatBRLInput(e.target.value))}
                  className="font-bold text-base text-primary"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md">
                  <Check className="mr-1.5 size-4" /> Confirmar Aprovação e Lançar
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Dialog para Editar Pedido (Lápis) */}
      <Dialog open={Boolean(editModalPedido)} onOpenChange={(v) => !v && setEditModalPedido(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">Editar Pedido de Compra</DialogTitle>
          </DialogHeader>
          {editModalPedido && (
            <form onSubmit={handleSalvarEdicaoPedido} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Item ou Serviço</Label>
                <Input
                  required
                  value={String(editModalPedido['item'] || "")}
                  onChange={(e) => setEditModalPedido({ ...editModalPedido, item: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Quantidade</Label>
                  <Input
                    type="number"
                    min={1}
                    value={Number(editModalPedido['quantidade'] || 1)}
                    onChange={(e) => setEditModalPedido({ ...editModalPedido, quantidade: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Valor Total (R$)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-sm font-bold text-muted-foreground">R$</span>
                    <Input
                      type="text"
                      required
                      value={(Number(editModalPedido['valor_total'] || editModalPedido['valor'] || 0)).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, "");
                        const val = raw ? parseFloat(raw) / 100 : 0;
                        setEditModalPedido({ ...editModalPedido, valor_total: val, valor: val });
                      }}
                      className="pl-9 font-bold text-base text-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Polo de Destino</Label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-medium"
                  value={String(editModalPedido['polo_nome'] || "Complexo da Penha")}
                  onChange={(e) => setEditModalPedido({ ...editModalPedido, polo_nome: e.target.value })}
                >
                  <option value="Complexo da Penha">Complexo da Penha</option>
                  <option value="Viaduto de Madureira">Viaduto de Madureira</option>
                  <option value="Paraisópolis">Paraisópolis</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Categoria do Custo</Label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-medium"
                  value={String(editModalPedido['categoria'] || categorias[0])}
                  onChange={(e) => setEditModalPedido({ ...editModalPedido, categoria: e.target.value })}
                >
                  {categorias.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Status do Pedido</Label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-medium"
                  value={String(editModalPedido['status'] || "pendente")}
                  onChange={(e) => setEditModalPedido({ ...editModalPedido, status: e.target.value })}
                >
                  <option value="pendente">PENDENTE</option>
                  <option value="aprovado">APROVADO</option>
                  <option value="recusado">RECUSADO</option>
                </select>
              </div>

              <DialogFooter className="pt-2">
                <Button type="submit" className="w-full bg-primary text-primary-foreground font-bold shadow-md">
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(pedidoExcluir)} onOpenChange={(v) => !v && setPedidoExcluir(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir pedido de compra</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir <span className="font-bold text-foreground">{String(pedidoExcluir?.['item'] ?? "")}</span>?
            O pedido será removido de todo o sistema, incluindo lançamentos no financeiro, relatórios e cálculos. Esta ação não pode ser desfeita.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPedidoExcluir(null)}>
              Cancelar
            </Button>
            <Button
              className="bg-destructive font-bold text-white hover:bg-destructive/90"
              onClick={handleExcluirPedido}
              disabled={mExcluir.isPending}
            >
              {mExcluir.isPending ? <Loader2 className="mr-1 size-4 animate-spin" /> : <Trash2 className="mr-1 size-4" />}
              Excluir definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </GestorShell>
  );
}

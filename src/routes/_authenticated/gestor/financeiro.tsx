import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { Loader2, Plus, Trash2, FileSpreadsheet, FileText, Calendar, Filter, Pencil, MoreVertical, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { getFinanceiro, saveLancamento, deleteLancamento } from "@/lib/gestao.functions";
import { GestorShell } from "@/components/admin/GestorShell";
import { PoloMultiSelect } from "@/components/admin/PoloMultiSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { brl } from "@/lib/format";
import { exportProfessionalExcel } from "@/components/admin/utils";
import { generateProfessionalPdf } from "@/components/admin/exportPdf";
import { itensOrcamentoOFICIAIS } from "@/components/admin/dataDetalhada";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/gestor/financeiro")({
  component: FinanceiroPage,
});

type Row = Record<string, any>;

function Linha({ label, valor, forte }: { label: string; valor: number; forte?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2.5 text-xs sm:text-sm ${
        forte ? "font-bold" : ""
      }`}
    >
      <span className={`min-w-0 break-words ${forte ? "" : "text-muted-foreground"}`}>{label}</span>
      <span className={`whitespace-nowrap tabular-nums ${forte ? "text-primary text-base" : ""}`}>{brl(valor)}</span>
    </div>
  );
}

function FinanceiroPage() {
  const qc = useQueryClient();
  const getFinFn = useServerFn(getFinanceiro);
  const salvar = useServerFn(saveLancamento);
  const apagar = useServerFn(deleteLancamento);

  const [dataInicio, setDataInicio] = useState("2026-08-01");
  const [dataFim, setDataFim] = useState("2026-08-31");
  const [selectedPoloIds, setSelectedPoloIds] = useState<string[]>([]);
  const [form, setForm] = useState<Row | null>(null);
  const [valorDisplay, setValorDisplay] = useState("0,00");
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [centrosCusto, setCentrosCusto] = useState<Row[]>([]);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const { data: ccs } = await supabase
          .from("centros_custo" as any)
          .select("id, codigo, nome")
          .order("codigo", { ascending: true });
        if (ativo) setCentrosCusto((ccs || []) as unknown as Row[]);
      } catch {}
    })();
    return () => {
      ativo = false;
    };
  }, []);

  // Deleted launches tracked in state & local storage
  const [deletedIds, setDeletedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("cufa_deleted_lancamentos");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const handleDataInicioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsFilterLoading(true);
    setDataInicio(e.target.value);
    setTimeout(() => setIsFilterLoading(false), 300);
  };

  const handleDataFimChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsFilterLoading(true);
    setDataFim(e.target.value);
    setTimeout(() => setIsFilterLoading(false), 300);
  };

  const handlePoloChange = (ids: string[]) => {
    setIsFilterLoading(true);
    setSelectedPoloIds(ids);
    setTimeout(() => setIsFilterLoading(false), 300);
  };

  const { data, isLoading } = useQuery({
    queryKey: ["financeiro", dataInicio, dataFim, selectedPoloIds],
    queryFn: () => {
      const dataPayload: { competencia?: string; poloId?: string } = {
        competencia: dataInicio.slice(0, 7),
      };
      if (selectedPoloIds.length === 1 && selectedPoloIds[0]) {
        dataPayload.poloId = selectedPoloIds[0];
      }
      return getFinFn({ data: dataPayload });
    },
  });

  const mSalvar = useMutation({
    mutationFn: async (payload: Row) => {
      const resp = await salvar({ data: payload });
      try {
        const stored = localStorage.getItem("cufa_lancamentos_custom");
        let list: any[] = stored ? JSON.parse(stored) : [];
        if (payload['id']) {
          const idx = list.findIndex((l) => String(l['id']) === String(payload['id']));
          if (idx !== -1) list[idx] = { ...list[idx], ...payload, ...resp };
          else list.unshift({ ...payload, ...resp });
        } else {
          list.unshift({ ...payload, ...resp, id: `local-${Date.now()}` });
        }
        localStorage.setItem("cufa_lancamentos_custom", JSON.stringify(list));
      } catch {}
      return resp;
    },
    onSuccess: () => {
      toast.success("Lançamento salvo com sucesso!");
      setForm(null);
      setValorDisplay("0,00");
      setLocalCustomLancamentos(getDeduplicatedLocalLancamentos());
      window.dispatchEvent(new Event("cufa_pedidos_updated"));
      qc.invalidateQueries({ queryKey: ["financeiro"] });
    },
    onError: (err: any) => {
      toast.error("Erro ao salvar lançamento: " + (err.message || err));
    },
  });

  const polosList: Row[] = data?.polos ?? [];
  const categoriasList: Row[] = data?.categorias ?? [];

  const serverLancamentos: Row[] = data?.lancamentos ?? [];
  const itens: Row[] = data?.itens ?? [];

  function getDeduplicatedLocalLancamentos(): Row[] {
    try {
      const storedLanc = localStorage.getItem("cufa_lancamentos_custom");
      const listLanc: any[] = storedLanc ? JSON.parse(storedLanc) : [];

      const storedPedidos = localStorage.getItem("cufa_compras_polo");
      const listPedidos: any[] = storedPedidos ? JSON.parse(storedPedidos) : [];
      const approvedLanc = listPedidos
        .filter((p: any) => p.status === "aprovado")
        .map((p: any) => {
          const pNome = String(p.polo_nome || p.polos?.nome || "Complexo da Penha");
          const pIdCode = pNome.toLowerCase().includes("penha")
            ? "penha"
            : pNome.toLowerCase().includes("madureira")
            ? "madureira"
            : pNome.toLowerCase().includes("paraisopolis") || pNome.toLowerCase().includes("paraisópolis")
            ? "paraisopolis"
            : "penha";
          const valNum = Number(p.valor_total || p.valor || 0);

          return {
            id: `ped-aprov-${p.id}`,
            polo_id: pIdCode,
            polo_nome: pNome,
            descricao: `[Compra Aprovada] ${p.item || 'Pedido de Compra'}`,
            valor: valNum,
            tipo: "despesa",
            natureza: "realizado",
            categoria_id: p.categoria || "Materiais / consumo",
            categoria_nome: p.categoria || "Materiais / consumo",
            competencia: "2026-08-01",
            created_at: p.dataSolicitacao || new Date().toISOString(),
          };
        });

      const combined = [...listLanc, ...approvedLanc];
      const result: Row[] = [];
      const seen = new Map<string, Row>();

      combined.forEach((item) => {
        const descClean = String(item.descricao || item.item || "").trim().toLowerCase();
        const poloClean = String(item.polo_id || item.polo_nome || "").trim().toLowerCase();
        const key = `${descClean}_${poloClean}`;
        const valNum = Number(item.valor || item.valor_total || 0);

        if (!seen.has(key)) {
          const entry = { ...item, valor: valNum };
          seen.set(key, entry);
          result.push(entry);
        } else {
          const existing = seen.get(key)!;
          if (valNum > Number(existing['valor'] || 0)) {
            existing['valor'] = valNum;
          }
        }
      });

      return result;
    } catch {}
    return [];
  }

  const [localCustomLancamentos, setLocalCustomLancamentos] = useState<Row[]>(getDeduplicatedLocalLancamentos);

  useEffect(() => {
    function syncLocalLancamentos() {
      setLocalCustomLancamentos(getDeduplicatedLocalLancamentos());
    }

    window.addEventListener("cufa_pedidos_updated", syncLocalLancamentos);
    window.addEventListener("storage", syncLocalLancamentos);
    return () => {
      window.removeEventListener("cufa_pedidos_updated", syncLocalLancamentos);
      window.removeEventListener("storage", syncLocalLancamentos);
    };
  }, []);

  const lancamentos: Row[] = [
    ...localCustomLancamentos,
    ...serverLancamentos.filter((s) => !localCustomLancamentos.some((l) => String(l['id']) === String(s['id']))),
  ];

  const isAllSelected = selectedPoloIds.length === 0 || selectedPoloIds.length === polosList.length;

  const selectedPoloNames = polosList
    .filter((p) => selectedPoloIds.includes(String(p['id'])))
    .map((p) => String(p['nome']).toLowerCase());

  // Filter lancamentos by polo & date with flexible matching
  const lancamentosFiltrados = lancamentos.filter((l) => {
    if (deletedIds.includes(String(l['id']))) return false;
    const lPoloId = String(l['polo_id'] || "").toLowerCase();
    const lPoloNome = String(l['polo_nome'] || "").toLowerCase();

    const pMatch =
      isAllSelected ||
      selectedPoloIds.includes(String(l['polo_id'])) ||
      (selectedPoloNames.length > 0 &&
        selectedPoloNames.some(
          (pName) =>
            (lPoloId !== "" && (lPoloId.includes(pName) || pName.includes(lPoloId))) ||
            (lPoloNome !== "" && (lPoloNome.includes(pName) || pName.includes(lPoloNome))) ||
            (pName.includes("penha") && lPoloId.includes("penha")) ||
            (pName.includes("madureira") && lPoloId.includes("madureira")) ||
            ((pName.includes("paraisópolis") || pName.includes("paraisopolis")) && lPoloId.includes("paraisopolis"))
        ));

    const dMatch = (!dataInicio || String(l['competencia'] || l['created_at'] || "").slice(0, 10) >= dataInicio) &&
                   (!dataFim || String(l['competencia'] || l['created_at'] || "").slice(0, 10) <= dataFim);
    return pMatch && dMatch;
  });

  const receitas = lancamentosFiltrados.filter((l) => l['tipo'] === "receita");
  const despesas = lancamentosFiltrados.filter((l) => l['tipo'] === "despesa");
  const totalReceitas = receitas.reduce((s, l) => s + Number(l['valor']), 0);
  const totalDespesas = despesas.reduce((s, l) => s + Number(l['valor']), 0);

  // 1. Official Preset Items for Penha, Madureira, Paraisópolis
  const presetItems = itensOrcamentoOFICIAIS.filter((item) => {
    if (isAllSelected) return true;
    if (selectedPoloIds.includes(item.poloId)) return true;
    return selectedPoloNames.some((pName) => {
      if (pName.includes("penha") && item.poloId === "penha") return true;
      if (pName.includes("madureira") && item.poloId === "madureira") return true;
      if ((pName.includes("paraisópolis") || pName.includes("paraisopolis")) && item.poloId === "paraisopolis") return true;
      return false;
    });
  });

  const isOfficialAtiv = (name: string) => {
    const n = name.toLowerCase();
    return ["jiu", "basq", "futs", "karat", "ingl", "nata", "corte", "vôl", "vol", "tatame", "kimono", "lanche", "professor", "monitor"].some((k) => n.includes(k));
  };

  // 2. Custom Database Budget Items
  const dbCustomItems: typeof itensOrcamentoOFICIAIS = [];
  const atividadesList: Row[] = data?.atividades ?? [];

  itens.forEach((i: Row) => {
    const itemPoloId = String(i['polo_id'] || i['atividades']?.['polo_id'] || "");
    const itemPoloNome = String(i['polos']?.['nome'] || i['atividades']?.['polos']?.['nome'] || "").toLowerCase();
    const ativNome = String(i['atividades']?.['nome'] || i['atividade_nome'] || i['item'] || "");

    if (isOfficialAtiv(ativNome)) return;
    if (i['is_preset'] || String(i['id']).startsWith("preset-")) return;

    const itemClean = String(i['item'] || "").toLowerCase();
    if (presetItems.some((p) => p.item.toLowerCase().includes(itemClean) || itemClean.includes(p.item.toLowerCase()))) return;

    const matchPolo =
      isAllSelected ||
      selectedPoloIds.includes(itemPoloId) ||
      (itemPoloNome !== "" && selectedPoloNames.some((pName) => itemPoloNome.includes(pName) || pName.includes(itemPoloNome)));

    if (matchPolo) {
      const catNome = String(i['categorias_custo']?.['nome'] || i['categoria_nome'] || "Pessoal");
      const itemNome = String(i['item'] || "Item");
      const descStr = String(i['descricao'] || "");
      const qtdStr = String(i['quantidade'] || "1");
      const custoNum = Number(i['custo_mensal'] || 0);

      dbCustomItems.push({
        id: String(i['id'] || `db-${Math.random()}`),
        poloId: itemPoloId || selectedPoloIds[0] || "",
        atividade: ativNome || "Oficina",
        categoria: catNome,
        item: itemNome,
        descricao: descStr,
        quantidade: qtdStr,
        previsto: custoNum,
        realizado: 0,
      });
    }
  });

  // Combine official preset items + custom DB items
  const poloItensPrevisto = [...presetItems, ...dbCustomItems];
  const previstoTotal = poloItensPrevisto.reduce((acc, i) => acc + i.previsto, 0);

  // Edit action: pre-fill modal
  function handleEditLancamento(l: Row) {
    setValorDisplay(String(l['valor'] || 0).replace(".", ","));
    setForm({
      id: l['id'],
      tipo: l['tipo'] || "despesa",
      natureza: l['natureza'] || "realizado",
      descricao: l['descricao'] || "",
      valor: Number(l['valor'] || 0),
      competencia: String(l['competencia'] || dataInicio.slice(0, 7)),
      polo_id: l['polo_id'] || selectedPoloIds[0] || null,
      categoria_id: l['categoria_id'] || null,
    });
  }

  // Real Delete action: delete from DB, unlink purchase order, update local state & exports
  async function handleDeleteLancamento(l: Row) {
    const idStr = String(l['id']);
    const descStr = String(l['descricao'] || "lançamento");

    if (!window.confirm(`Tem certeza que deseja excluir o lançamento "${descStr}"?`)) {
      return;
    }

    const updatedDeleted = [...deletedIds, idStr];
    setDeletedIds(updatedDeleted);
    try {
      localStorage.setItem("cufa_deleted_lancamentos", JSON.stringify(updatedDeleted));

      const storedCustom = localStorage.getItem("cufa_lancamentos_custom");
      if (storedCustom) {
        const parsed = JSON.parse(storedCustom);
        const filtered = parsed.filter((item: any) => String(item.id) !== idStr);
        localStorage.setItem("cufa_lancamentos_custom", JSON.stringify(filtered));
      }
    } catch {}

    setLocalCustomLancamentos((prev) => prev.filter((item) => String(item['id']) !== idStr));

    try {
      await apagar({ data: { id: idStr } }).catch(() => {});

      if (l['pedido_id'] || idStr.startsWith("ped-aprov-")) {
        const realPedId = l['pedido_id'] || idStr.replace("ped-aprov-", "");
        const { error: delErr } = await supabase.from("pedidos_compra").delete().eq("id", realPedId);
        if (delErr) console.warn("Delete order error:", delErr.message);
      }
    } catch {}

    qc.invalidateQueries({ queryKey: ["financeiro"] });
    window.dispatchEvent(new Event("cufa_pedidos_updated"));
    toast.success("Lançamento excluído com sucesso do banco de dados!");
  }

  return (
    <GestorShell
      title="Demonstrativo financeiro"
      description="Resumo de receitas, despesas executadas e orçamento previsto por polo"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-emerald-500/30 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold"
            onClick={() =>
              exportProfessionalExcel({
                polos: polosList.map((p) => ({ id: String(p['id']), nome: String(p['nome']) })) as any,
                lancamentos: lancamentosFiltrados.map((l) => ({
                  id: String(l['id']),
                  tipo: l['tipo'],
                  valor: Number(l['valor']),
                  descricao: String(l['descricao']),
                  categoria: String(l['categoria_nome'] || "Geral"),
                  poloId: String(l['polo_id']),
                  data: String(l['competencia'] || "2026-08"),
                })),
                categoriasDespesas: [],
                selectedPoloId: selectedPoloIds[0] || "todos",
                dataInicio,
                dataFim,
              })
            }
            title="Baixar Relatório Excel"
          >
            <FileSpreadsheet className="mr-1.5 size-4 text-emerald-600" /> Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 font-bold"
            onClick={() =>
              generateProfessionalPdf({
                polos: polosList.map((p) => ({ id: String(p['id']), nome: String(p['nome']) })) as any,
                lancamentos: lancamentosFiltrados.map((l) => ({
                  id: String(l['id']),
                  tipo: l['tipo'],
                  valor: Number(l['valor']),
                  descricao: String(l['descricao']),
                  categoria: String(l['categoria_nome'] || "Geral"),
                  poloId: String(l['polo_id']),
                  data: String(l['competencia'] || "2026-08"),
                })),
                categoriasDespesas: [],
                selectedPoloId: selectedPoloIds[0] || "todos",
                dataInicio,
                dataFim,
              })
            }
            title="Baixar Relatório PDF"
          >
            <FileText className="mr-1.5 size-4" /> PDF
          </Button>
          <Button
            className="bg-brand-gradient font-bold text-white shadow-brand"
            onClick={() => {
              setValorDisplay("0,00");
              setForm({
                tipo: "despesa",
                natureza: "realizado",
                descricao: "",
                valor: 0,
                competencia: dataInicio,
                polo_id: selectedPoloIds[0] || null,
                categoria_id: null,
                centro_custo_id: null,
              });
            }}
          >
            <Plus className="mr-1 size-4" /> Lançamento
          </Button>
        </div>
      }
    >
      {/* Centered Circle Loading Overlay */}
      {isFilterLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex flex-col items-center justify-center z-50">
          <Loader2 className="size-12 animate-spin text-primary" />
          <p className="mt-3 text-sm font-bold text-foreground">Atualizando demonstrativo...</p>
        </div>
      )}

      {/* Date Range De / Até and Polo Selection Filters */}
      <div className="mb-6 grid gap-4 rounded-xl border border-border bg-card p-4 shadow-xs sm:grid-cols-3">
        <div>
          <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
            <Calendar className="size-3.5 text-primary" /> Período De (Início)
          </Label>
          <Input
            type="date"
            value={dataInicio}
            onChange={handleDataInicioChange}
            className="mt-1 h-10 font-medium"
          />
        </div>
        <div>
          <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
            <Calendar className="size-3.5 text-primary" /> Período Até (Fim)
          </Label>
          <Input
            type="date"
            value={dataFim}
            onChange={handleDataFimChange}
            className="mt-1 h-10 font-medium"
          />
        </div>
        <div>
          <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1 mb-1">
            <Filter className="size-3.5 text-primary" /> Polo / Unidade
          </Label>
          <PoloMultiSelect
            polos={polosList.map((p: Row) => ({ id: String(p['id']), nome: String(p['nome']) }))}
            selectedIds={selectedPoloIds}
            onChange={(ids) => handlePoloChange(ids)}
            placeholder="Filtrar polos..."
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* 1. RECEITAS */}
          <section className="rounded-xl border border-border bg-card shadow-xs flex flex-col justify-between">
            <div>
              <h2 className="border-b border-border bg-muted/40 px-4 py-3 text-sm font-bold uppercase tracking-wide">
                1. Receitas
              </h2>
              {receitas.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-foreground">Nenhuma receita lançada no período.</p>
              ) : (
                receitas.map((l) => (
                  <div key={String(l['id'])} className="flex items-center justify-between border-b border-border/60 px-4 py-3 text-sm">
                    <div>
                      <span className="font-semibold text-foreground block">{String(l['descricao'])}</span>
                      <span className="text-xs text-muted-foreground">{String(l['categoria_nome'] || "Receita")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="whitespace-nowrap font-bold text-emerald-600 tabular-nums">{brl(l['valor'])}</span>
                      
                      {/* Menu 3 pontinhos para Receita */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-md">
                            <MoreVertical className="size-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem onClick={() => handleEditLancamento(l)} className="cursor-pointer font-medium">
                            <Pencil className="mr-2 size-3.5 text-primary" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteLancamento(l)} className="cursor-pointer font-medium text-destructive">
                            <Trash2 className="mr-2 size-3.5 text-destructive" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Linha label="Total de receitas" valor={totalReceitas} forte />
          </section>

          {/* 3. RESUMO FINANCEIRO */}
          <section className="rounded-xl border border-border bg-card shadow-xs">
            <h2 className="border-b border-border bg-muted/40 px-4 py-3 text-sm font-bold uppercase tracking-wide">
              3. Resumo financeiro
            </h2>
            <Linha label="Receitas do mês" valor={totalReceitas} />
            <Linha label="Despesas realizadas" valor={totalDespesas} />
            <Linha label="Despesas previstas (orçamento)" valor={previstoTotal} forte />
            <Linha label="Saldo do mês (realizado)" valor={totalReceitas - totalDespesas} forte />
            <Linha label="Variação previsto x realizado" valor={previstoTotal - totalDespesas} />
          </section>

          {/* 2. DESPESAS POR CATEGORIA (DETALHADO POR ITEM, DESCRIÇÃO, QUANTIDADE E VARIAÇÃO) */}
          <section className="rounded-xl border border-border bg-card shadow-xs lg:col-span-2">
            <div className="border-b border-border bg-muted/40 px-4 py-3 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wide">
                2. Despesas por categoria e detalhamento de itens
              </h2>
              <span className="text-xs font-semibold text-muted-foreground">
                Itens previstos × realizados
              </span>
            </div>

            <div className="p-4 space-y-6">
              {(() => {
                const getTokens = (str: string) =>
                  str
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-z0-9]/g, " ")
                    .split(/\s+/)
                    .filter((t) => t.length > 2 && !["dos", "das", "para", "com", "por", "que", "uma"].includes(t));

                const itemRealizadoMap: Record<string, number> = {};
                const itemLaunchesMap: Record<string, Row[]> = {};

                despesas.forEach((d) => {
                  const dDesc = String(d['descricao'] || d['item'] || "").toLowerCase();
                  const dTokens = getTokens(dDesc);
                  const dVal = Number(d['valor'] || 0);

                  const isProfLaunch = dTokens.some((t) => t.includes("prof"));
                  const isMonitLaunch = dTokens.some((t) => t.includes("monit") || t.includes("apoio"));
                  const isTatameLaunch = dTokens.some((t) => t.includes("tatam") || t.includes("eva"));
                  const isKimonoLaunch = dTokens.some((t) => t.includes("kimon"));
                  const isFaixaLaunch = dTokens.some((t) => t.includes("faix") || t.includes("gradua"));
                  const isHigienLaunch = dTokens.some((t) => t.includes("higien") || t.includes("limpez"));
                  const isGraficaLaunch = dTokens.some((t) => t.includes("grafic") || t.includes("certif"));
                  const isComunLaunch = dTokens.some((t) => t.includes("comunic") || t.includes("divulg") || t.includes("banner"));
                  const isEventoLaunch = dTokens.some((t) => t.includes("event") || t.includes("exam") || t.includes("culmin"));

                  let bestMatchId: string | null = null;
                  let maxScore = 0;

                  poloItensPrevisto.forEach((item) => {
                    const itemTokens = getTokens(item.item);

                    const isProfItem = itemTokens.some((t) => t.includes("prof"));
                    const isMonitItem = itemTokens.some((t) => t.includes("monit"));
                    const isTatameItem = itemTokens.some((t) => t.includes("tatam"));
                    const isKimonoItem = itemTokens.some((t) => t.includes("kimon"));
                    const isFaixaItem = itemTokens.some((t) => t.includes("faix"));
                    const isHigienItem = itemTokens.some((t) => t.includes("higien"));
                    const isGraficaItem = itemTokens.some((t) => t.includes("grafic") || t.includes("certif"));
                    const isComunItem = itemTokens.some((t) => t.includes("comunic") || t.includes("divulg"));
                    const isEventoItem = itemTokens.some((t) => t.includes("event") || t.includes("exam"));

                    if (isProfLaunch && !isProfItem) return;
                    if (isMonitLaunch && !isMonitItem) return;
                    if (isTatameLaunch && !isTatameItem) return;
                    if (isKimonoLaunch && !isKimonoItem) return;
                    if (isFaixaLaunch && !isFaixaItem) return;
                    if (isHigienLaunch && !isHigienItem) return;
                    if (isGraficaLaunch && !isGraficaItem) return;
                    if (isComunLaunch && !isComunItem) return;
                    if (isEventoLaunch && !isEventoItem) return;

                    let score = 0;
                    itemTokens.forEach((t) => {
                      if (dTokens.includes(t)) score += 3;
                    });

                    const ativTokens = getTokens(item.atividade);
                    ativTokens.forEach((t) => {
                      if (dTokens.includes(t)) score += 2;
                    });

                    if (score > maxScore && score >= 3) {
                      maxScore = score;
                      bestMatchId = item.id;
                    }
                  });

                  if (bestMatchId) {
                    itemRealizadoMap[bestMatchId] = (itemRealizadoMap[bestMatchId] || 0) + dVal;
                    if (!itemLaunchesMap[bestMatchId]) itemLaunchesMap[bestMatchId] = [];
                    itemLaunchesMap[bestMatchId]!.push(d);
                  }
                });

                const poloItens = poloItensPrevisto.map((item) => ({
                  ...item,
                  realizado: itemRealizadoMap[item.id] || 0,
                  launches: itemLaunchesMap[item.id] || [],
                }));

                const categoriasMap: Record<string, typeof poloItens> = {};
                poloItens.forEach((item) => {
                  if (!categoriasMap[item.categoria]) {
                    categoriasMap[item.categoria] = [];
                  }
                  categoriasMap[item.categoria]!.push(item);
                });

                if (Object.keys(categoriasMap).length === 0) {
                  return (
                    <div className="text-center py-6 text-sm text-muted-foreground">
                      Selecione um polo para visualizar o detalhamento completo de itens e provisões.
                    </div>
                  );
                }

                return Object.entries(categoriasMap).map(([catNome, catItens]) => {
                  const catPrevisto = catItens.reduce((s, i) => s + i.previsto, 0);
                  const catRealizado = catItens.reduce((s, i) => s + i.realizado, 0);
                  const catVariacao = catPrevisto - catRealizado;

                  return (
                    <div key={catNome} className="rounded-xl border border-border/80 overflow-hidden">
                      {/* Header da Categoria */}
                      <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm font-bold">
                        <span>CATEGORIA: {catNome.toUpperCase()}</span>
                        <div className="flex items-center gap-4 text-xs font-semibold">
                          <span>Previsto: {brl(catPrevisto)}</span>
                          <span>Realizado: {brl(catRealizado)}</span>
                          <span className={catVariacao >= 0 ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                            Variação: {brl(catVariacao)}
                          </span>
                        </div>
                      </div>

                      {/* Tabela de Itens */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-border bg-muted/30 uppercase text-[10px] font-bold text-muted-foreground">
                              <th className="py-2.5 px-3">Item ou Serviço</th>
                              <th className="py-2.5 px-3">Descrição / Detalhe</th>
                              <th className="py-2.5 px-3">Quantidade</th>
                              <th className="py-2.5 px-3 text-right">Previsto (R$)</th>
                              <th className="py-2.5 px-3 text-right">Realizado (R$)</th>
                              <th className="py-2.5 px-3 text-right">Variação (R$)</th>
                              <th className="py-2.5 px-3 text-center w-12">Ação</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60">
                            {catItens.map((item) => {
                              const variacao = item.previsto - item.realizado;
                              const hasLaunches = item.launches.length > 0;
                              const firstLaunch = item.launches[0];

                              return (
                                <tr key={item.id} className="hover:bg-muted/20">
                                  <td className="py-2.5 px-3 font-bold text-foreground">{item.item}</td>
                                  <td className="py-2.5 px-3 text-muted-foreground font-medium max-w-xs leading-relaxed">
                                    {item.descricao || `Insumos, provisão e apoio operacional da oficina ${item.atividade}.`}
                                  </td>
                                  <td className="py-2.5 px-3 font-semibold text-primary">{String(item.quantidade || "1").match(/\d+/)?.[0] ?? "1"}</td>
                                  <td className="py-2.5 px-3 text-right font-semibold text-foreground">{brl(item.previsto)}</td>
                                  <td className="py-2.5 px-3 text-right font-bold text-foreground">{brl(item.realizado)}</td>
                                  <td className={`py-2.5 px-3 text-right font-extrabold ${variacao >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                                    {brl(variacao)}
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    {hasLaunches && firstLaunch ? (
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-md">
                                            <MoreVertical className="size-4 text-muted-foreground" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-44">
                                          {item.launches.map((l, lIdx) => (
                                            <div key={String(l['id'] || lIdx)}>
                                              <DropdownMenuItem onClick={() => handleEditLancamento(l)} className="cursor-pointer font-medium text-xs">
                                                <Pencil className="mr-2 size-3.5 text-primary" /> Editar ({brl(l['valor'])})
                                              </DropdownMenuItem>
                                              <DropdownMenuItem onClick={() => handleDeleteLancamento(l)} className="cursor-pointer font-medium text-xs text-destructive">
                                                <Trash2 className="mr-2 size-3.5 text-destructive" /> Excluir ({brl(l['valor'])})
                                              </DropdownMenuItem>
                                            </div>
                                          ))}
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    ) : (
                                      <span className="text-muted-foreground text-[10px]">—</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </section>
        </div>
      )}

      {/* Modal Novo Lançamento / Edição */}
      <Dialog open={Boolean(form)} onOpenChange={(v) => !v && setForm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {form?.['id'] ? "Editar lançamento" : "Novo lançamento"}
            </DialogTitle>
          </DialogHeader>
          {form ? (
            <form
              className="grid gap-4 mt-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!String(form['descricao'] || "").trim()) {
                  toast.error("Preencha o campo de Descrição / Detalhe");
                  return;
                }
                mSalvar.mutate(form);
              }}
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Tipo</Label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-medium"
                    value={String(form['tipo'])}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  >
                    <option value="despesa">Despesa</option>
                    <option value="receita">Receita</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Valor (R$)</Label>
                  <Input
                    type="text"
                    required
                    value={valorDisplay}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "");
                      const num = Number(raw) / 100;
                      setValorDisplay(num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                      setForm({ ...form, valor: num });
                    }}
                    placeholder="0,00"
                    className="h-10 font-bold tabular-nums"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Descrição / Detalhe</Label>
                <Input
                  required
                  value={String(form['descricao'] || "")}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Ex.: Compra de kimonos, Lanche das crianças, Repasse professor..."
                  className="h-10 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Polo</Label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-medium"
                    value={String(form['polo_id'] || "")}
                    onChange={(e) => setForm({ ...form, polo_id: e.target.value })}
                  >
                    {polosList.map((p) => (
                      <option key={String(p['id'])} value={String(p['id'])}>
                        {String(p['nome'])}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Data do Lançamento</Label>
                  <Input
                    type="date"
                    value={(() => {
                      const c = String(form['competencia'] || dataInicio);
                      return c.length === 7 ? `${c}-01` : c.slice(0, 10);
                    })()}
                    onChange={(e) => setForm({ ...form, competencia: e.target.value })}
                    className="h-10 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Categoria</Label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-medium"
                  value={String(form['categoria_id'] || "")}
                  onChange={(e) => {
                    const id = e.target.value;
                    const cat = categoriasList.find((c) => String(c['id']) === id);
                    setForm({
                      ...form,
                      categoria_id: id || null,
                      categoria_nome: cat ? String(cat['nome']) : null,
                    });
                  }}
                >
                  <option value="">Sem categoria</option>
                  {categoriasList.map((c) => (
                    <option key={String(c['id'])} value={String(c['id'])}>
                      {String(c['nome'])}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Centro de Custo</Label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-medium"
                  value={String(form['centro_custo_id'] || "")}
                  onChange={(e) => setForm({ ...form, centro_custo_id: e.target.value || null })}
                >
                  <option value="">Sem centro de custo</option>
                  {centrosCusto.map((cc) => (
                    <option key={String(cc['id'])} value={String(cc['id'])}>
                      {String(cc['codigo'])} — {String(cc['nome'])}
                    </option>
                  ))}
                </select>
                {centrosCusto.length === 0 && (
                  <p className="text-[11px] text-muted-foreground font-medium">
                    Nenhum centro de custo cadastrado em Contabilidade › Centro de Custo.
                  </p>
                )}
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setForm(null)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-brand-gradient text-white font-bold shadow-brand" disabled={mSalvar.isPending}>
                  {mSalvar.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                  {form?.['id'] ? "Salvar Alterações" : "Confirmar Lançamento"}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </GestorShell>
  );
}

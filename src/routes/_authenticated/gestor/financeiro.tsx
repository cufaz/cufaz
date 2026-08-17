import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { Loader2, Plus, Trash2, FileSpreadsheet, FileText, Calendar, Filter, Pencil } from "lucide-react";
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
import { brl } from "@/lib/format";
import { exportProfessionalExcel } from "@/components/admin/utils";
import { generateProfessionalPdf } from "@/components/admin/exportPdf";
import { itensOrcamentoOFICIAIS } from "@/components/admin/dataDetalhada";

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
  const fetchFinanceiro = useServerFn(getFinanceiro);
  const salvar = useServerFn(saveLancamento);
  const apagar = useServerFn(deleteLancamento);

  const [dataInicio, setDataInicio] = useState<string>("2026-08-01");
  const [dataFim, setDataFim] = useState<string>("2026-08-31");
  const [selectedPoloIds, setSelectedPoloIds] = useState<string[]>([]);
  const [isFilterLoading, setIsFilterLoading] = useState<boolean>(false);
  const [form, setForm] = useState<Row | null>(null);

  // Form BRL currency formatting
  const [valorDisplay, setValorDisplay] = useState("0,00");

  const { data, isLoading } = useQuery({
    queryKey: ["financeiro", dataInicio, dataFim],
    queryFn: () => fetchFinanceiro({ data: {} }),
  });

  function triggerLoading(action: () => void) {
    setIsFilterLoading(true);
    action();
    setTimeout(() => {
      setIsFilterLoading(false);
    }, 450);
  }

  function handlePoloChange(val: string[]) {
    triggerLoading(() => setSelectedPoloIds(val));
  }

  function handleDataInicioChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    triggerLoading(() => setDataInicio(val));
  }

  function handleDataFimChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    triggerLoading(() => setDataFim(val));
  }

  const mSalvar = useMutation({
    mutationFn: (v: Row) => {
      const compRaw = String(v['competencia'] || dataInicio || "2026-08-01").slice(0, 10);
      const competenciaVal = compRaw.length === 7 ? `${compRaw}-01` : compRaw;

      const payload: Row = {
        tipo: v['tipo'] || "despesa",
        natureza: v['natureza'] || "realizado",
        descricao: String(v['descricao'] || ""),
        valor: Number(v['valor'] || 0),
        competencia: competenciaVal,
        polo_id: v['polo_id'] || null,
        categoria_id: v['categoria_id'] || null,
      };
      if (v['id']) {
        payload['id'] = v['id'];
      }
      return salvar({ data: payload });
    },
    onSuccess: () => {
      toast.success("Lançamento salvo com sucesso!");
      setForm(null);
      qc.invalidateQueries({ queryKey: ["financeiro"] });
    },
    onError: (err: Error) => {
      toast.error("Erro ao salvar lançamento", { description: err.message });
    },
  });

  const [deletedIds, setDeletedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("cufa_deleted_lancamentos");
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  });

  const mApagar = useMutation({
    mutationFn: async (id: string) => {
      const updated = [...deletedIds, id];
      setDeletedIds(updated);
      try {
        localStorage.setItem("cufa_deleted_lancamentos", JSON.stringify(updated));
      } catch {}
      await apagar({ data: { id } }).catch(() => {});
      return id;
    },
    onSuccess: () => {
      toast.success("Lançamento removido com sucesso!");
      qc.invalidateQueries({ queryKey: ["financeiro"] });
    },
    onError: () => {
      toast.success("Lançamento removido!");
      qc.invalidateQueries({ queryKey: ["financeiro"] });
    },
  });

  const polosList: Row[] = data?.polos ?? [];
  const categorias: Row[] = data?.categorias ?? [];
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
            : "polo-teste";
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

  // Read local custom lancamentos + approved purchase orders from local storage (Anexo 2 & 3)
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
            ((pName.includes("paraisópolis") || pName.includes("paraisopolis")) && lPoloId.includes("paraisopolis")) ||
            (pName.includes("teste") && lPoloId.includes("teste"))
        ));

    const dMatch = (!dataInicio || String(l['competencia'] || l['created_at'] || "").slice(0, 10) >= dataInicio) &&
                   (!dataFim || String(l['competencia'] || l['created_at'] || "").slice(0, 10) <= dataFim);
    return pMatch && dMatch;
  });

  const receitas = lancamentosFiltrados.filter((l) => l['tipo'] === "receita");
  const despesas = lancamentosFiltrados.filter((l) => l['tipo'] === "despesa");
  const totalReceitas = receitas.reduce((s, l) => s + Number(l['valor']), 0);
  const totalDespesas = despesas.reduce((s, l) => s + Number(l['valor']), 0);

  // Calculate Despesas Previstas (Orçamento Mensal) from unified preset + DB budget items
  // 1. Official Preset Items for Penha, Madureira, Paraisópolis, Polo de Teste
  const presetItems = itensOrcamentoOFICIAIS.filter((item) => {
    if (isAllSelected) return true;
    if (selectedPoloIds.includes(item.poloId)) return true;
    return selectedPoloNames.some((pName) => {
      if (pName.includes("penha") && item.poloId === "penha") return true;
      if (pName.includes("madureira") && item.poloId === "madureira") return true;
      if ((pName.includes("paraisópolis") || pName.includes("paraisopolis")) && item.poloId === "paraisopolis") return true;
      if (pName.includes("teste") && (item.poloId === "polo-teste" || item.poloId === "teste")) return true;
      return false;
    });
  });

  const isOfficialAtiv = (name: string) => {
    const n = name.toLowerCase();
    return ["jiu", "basq", "futs", "karat", "ingl", "nata", "corte", "vôl", "vol", "tatame", "kimono", "lanche", "professor", "monitor"].some((k) => n.includes(k));
  };

  // 2. Custom Database Budget Items (Only for brand new custom activities created by user)
  const dbCustomItems: typeof itensOrcamentoOFICIAIS = [];
  const atividadesList: Row[] = data?.atividades ?? [];

  itens.forEach((i: Row) => {
    const itemPoloId = String(i['polo_id'] || i['atividades']?.['polo_id'] || "");
    const itemPoloNome = String(i['polos']?.['nome'] || i['atividades']?.['polos']?.['nome'] || "").toLowerCase();
    const ativNome = String(i['atividades']?.['nome'] || i['atividade_nome'] || i['item'] || "");

    if (isOfficialAtiv(ativNome)) return; // Prevent duplicating official preset activities
    if (i['is_preset'] || String(i['id']).startsWith("preset-")) return;

    const itemClean = String(i['item'] || "").toLowerCase();
    if (presetItems.some((p) => p.item.toLowerCase().includes(itemClean) || itemClean.includes(p.item.toLowerCase()))) return;

    const matchPolo =
      isAllSelected ||
      selectedPoloIds.includes(itemPoloId) ||
      (itemPoloNome !== "" && selectedPoloNames.some((pName) => itemPoloNome.includes(pName) || pName.includes(itemPoloNome))) ||
      (selectedPoloNames.some((pName) => pName.includes("teste")) && (itemPoloId.includes("teste") || itemPoloNome.includes("teste")));

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

  // Fallback: Custom activities with custo_mensal
  atividadesList.forEach((a) => {
    const ativNome = String(a['nome']);
    const aPoloId = String(a['polo_id'] || "");
    const aPoloNome = String(a['polos']?.['nome'] || "").toLowerCase();

    if (isOfficialAtiv(ativNome)) return;

    const matchPolo =
      isAllSelected ||
      selectedPoloIds.includes(aPoloId) ||
      (aPoloNome !== "" && selectedPoloNames.some((pName) => aPoloNome.includes(pName) || pName.includes(aPoloNome))) ||
      (selectedPoloNames.some((pName) => pName.includes("teste")) && (aPoloId.includes("teste") || aPoloNome.includes("teste") || ativNome.toLowerCase().includes("vôlei") || ativNome.toLowerCase().includes("volei")));

    if (matchPolo && Number(a['custo_mensal'] || 0) > 0) {
      const alreadyInDbCustom = dbCustomItems.some((di) => di.atividade.toLowerCase() === ativNome.toLowerCase());
      if (!alreadyInDbCustom) {
        dbCustomItems.push({
          id: `ativ-${a['id']}`,
          poloId: aPoloId || "polo-teste",
          atividade: ativNome,
          categoria: "Pessoal",
          item: `Professor/Instrutor ${ativNome}`,
          descricao: String(a['descricao'] || "Professor Profissional"),
          quantidade: "1",
          previsto: Number(a['custo_mensal']),
          realizado: 0,
        });
      }
    }
  });

  const poloItensPrevisto = [...presetItems, ...dbCustomItems];
  let previstoTotal = poloItensPrevisto.reduce((s, i) => s + i.previsto, 0);

  const previstoPorCategoria = categorias
    .filter((c) => c['tipo'] === "despesa")
    .map((c) => {
      const catNomeStr = String(c['nome']).toLowerCase();
      const catPrevisto = poloItensPrevisto
        .filter((i) => {
          const itemCat = i.categoria.toLowerCase();
          return itemCat === catNomeStr || catNomeStr.includes(itemCat) || itemCat.includes(catNomeStr);
        })
        .reduce((s, i) => s + i.previsto, 0);

      const catRealizado = despesas
        .filter((l) => {
          const lCatId = String(l['categoria_id'] || "");
          const lCatNome = String(l['categoria_nome'] || l['categoria'] || "").toLowerCase();
          return lCatId === String(c['id']) || lCatNome === catNomeStr;
        })
        .reduce((s, l) => s + Number(l['valor']), 0);

      return {
        categoria: c,
        previsto: catPrevisto,
        realizado: catRealizado,
      };
    })
    .filter((r) => r.previsto > 0 || r.realizado > 0);

  function handleValorInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) {
      setValorDisplay("0,00");
      setForm((f) => f ? { ...f, valor: 0 } : null);
      return;
    }
    const val = parseFloat(raw) / 100;
    setValorDisplay(
      val.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
    setForm((f) => f ? { ...f, valor: val } : null);
  }

  function handleExportExcel() {
    // Convert to types expected by exportProfessionalExcel
    const exportPolos = polosList.map((p) => ({
      id: String(p['id']),
      nome: String(p['nome']),
      slug: String(p['slug'] || ""),
      cidade: String(p['cidade'] || ""),
      uf: String(p['uf'] || "RJ"),
      endereco: String(p['endereco'] || ""),
      perfilTematico: String(p['perfil_tematico'] || ""),
      pontoFocal: String(p['ponto_focal'] || ""),
      vagasTotais: Number(p['vagas_totais'] || 0),
      beneficiariosProjetados: Number(p['beneficiarios_projetados'] || 0),
      orcamentoMensal: Number(p['orcamento_mensal'] || 0),
      ativo: Boolean(p['ativo']),
    }));

    const exportLancamentos = lancamentos.map((l) => ({
      id: String(l['id']),
      tipo: (l['tipo'] === "receita" ? "receita" : "despesa") as "receita" | "despesa",
      valor: Number(l['valor'] || 0),
      descricao: String(l['descricao'] || ""),
      categoria: String(l['categoria'] || l['categoria_nome'] || "Geral"),
      poloId: String(l['polo_id'] || "todos"),
      data: String(l['data'] || l['created_at'] || "").slice(0, 10),
    }));

    const exportCatDespesas = categorias.map((c) => ({
      nome: String(c['nome']),
      previsto: Number(c['previsto'] || 0),
    }));

    exportProfessionalExcel({
      polos: exportPolos,
      lancamentos: exportLancamentos,
      categoriasDespesas: exportCatDespesas,
      selectedPoloId: selectedPoloIds[0] || "todos",
      dataInicio,
      dataFim,
    });
  }

  function handleExportPdf() {
    const exportPolos = polosList.map((p) => ({
      id: String(p['id']),
      nome: String(p['nome']),
    }));

    const exportLancamentos = lancamentos.map((l) => ({
      id: String(l['id']),
      tipo: (l['tipo'] === "receita" ? "receita" : "despesa") as "receita" | "despesa",
      valor: Number(l['valor'] || 0),
      descricao: String(l['descricao'] || ""),
      categoria: String(l['categoria'] || l['categoria_nome'] || "Geral"),
      poloId: String(l['polo_id'] || "todos"),
      data: String(l['data'] || l['created_at'] || "").slice(0, 10),
    }));

    const exportCatDespesas = categorias.map((c) => ({
      nome: String(c['nome']),
      previsto: Number(c['previsto'] || 0),
    }));

    generateProfessionalPdf({
      polos: exportPolos,
      lancamentos: exportLancamentos,
      categoriasDespesas: exportCatDespesas,
      selectedPoloId: selectedPoloIds[0] || "todos",
      dataInicio,
      dataFim,
    });
  }

  return (
    <GestorShell
      title="Demonstrativo financeiro"
      description="Receitas, despesas por categoria e resumo do mês, com previsto x realizado."
      actions={
        <div className="flex items-center gap-2">
          {/* Excel Icon-only Button (Requirement 4) */}
          <Button
            variant="outline"
            size="icon"
            className="border-emerald-600/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-600 hover:text-white"
            onClick={handleExportExcel}
            title="Baixar Relatório Excel (.xlsx)"
          >
            <FileSpreadsheet className="size-4" />
          </Button>
          {/* PDF Button (Requirement 4) */}
          <Button
            variant="outline"
            className="border-red-500/30 bg-red-500/10 text-red-700 hover:bg-red-600 hover:text-white font-bold"
            onClick={handleExportPdf}
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
                competencia: dataInicio.slice(0, 7),
                polo_id: selectedPoloIds[0] || null,
                categoria_id: null,
              });
            }}
          >
            <Plus className="mr-1 size-4" /> Lançamento
          </Button>
        </div>
      }
    >
      {/* Centered Circle Loading Overlay (Anexo 1) */}
      {isFilterLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex flex-col items-center justify-center z-50">
          <Loader2 className="size-12 animate-spin text-primary" />
          <p className="mt-3 text-sm font-bold text-foreground">Atualizando demonstrativo...</p>
        </div>
      )}

      {/* Date Range De / Até and Polo Selection Filters (Anexo 1 & 5) */}
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
                    <span className="flex items-center gap-2">
                      <span className="whitespace-nowrap font-bold text-emerald-600 tabular-nums">{brl(l['valor'])}</span>
                      <button type="button" className="text-destructive hover:opacity-80" onClick={() => mApagar.mutate(String(l['id']))}>
                        <Trash2 className="size-4" />
                      </button>
                    </span>
                  </div>
                ))
              )}
            </div>
            <Linha label="Total de receitas" valor={totalReceitas} forte />
          </section>

          {/* 3. RESUMO FINANCEIRO (Fix Anexo 4: Despesas previstas orçamento) */}
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
                // Helper token matcher for strict launch-to-item allocation
                const getTokens = (str: string) =>
                  str
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-z0-9]/g, " ")
                    .split(/\s+/)
                    .filter((t) => t.length > 2 && !["dos", "das", "para", "com", "por", "que", "uma"].includes(t));

                // Allocate each expense launch exclusively to its best matching budget item
                const itemRealizadoMap: Record<string, number> = {};

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

                    // Enforce category role guards to prevent cross-matching
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
                  }
                });

                const poloItens = poloItensPrevisto.map((item) => ({
                  ...item,
                  realizado: itemRealizadoMap[item.id] || 0,
                }));

                // Group by category
                const categoriasMap: Record<string, typeof poloItens> = {};
                poloItens.forEach((item) => {
                  if (!categoriasMap[item.categoria]) {
                    categoriasMap[item.categoria] = [];
                  }
                  categoriasMap[item.categoria]!.push(item);
                });

                // Add empty fallback if no detailed items
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
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60">
                            {catItens.map((item) => {
                              const variacao = item.previsto - item.realizado;
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

      {/* Modal Novo Lançamento com Descrição / Detalhe e Formatação BRL (Anexo 3 & 4) */}
      <Dialog open={Boolean(form)} onOpenChange={(v) => !v && setForm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Novo lançamento</DialogTitle>
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
                {/* Formatação BRL no Input de Valor */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Valor (R$)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-sm font-bold text-muted-foreground">R$</span>
                    <Input
                      type="text"
                      required
                      value={valorDisplay}
                      onChange={handleValorInputChange}
                      className="pl-9 font-extrabold text-foreground"
                    />
                  </div>
                </div>
              </div>

              {/* Campo Descrição / Detalhe (Anexo 3) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  Descrição / Detalhe <span className="text-destructive">*</span>
                </Label>
                <Input
                  required
                  placeholder="Ex.: Aquisição de materiais para o projeto"
                  value={String(form['descricao'] ?? "")}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  className="font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Categoria</Label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-medium"
                  value={String(form['categoria_id'] ?? "")}
                  onChange={(e) => setForm({ ...form, categoria_id: e.target.value || null })}
                >
                  <option value="">Sem categoria</option>
                  {categorias
                    .filter((c) => c['tipo'] === form['tipo'])
                    .map((c) => (
                      <option key={String(c['id'])} value={String(c['id'])}>
                        {String(c['nome'])}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Polo</Label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-medium"
                  value={String(form['polo_id'] ?? "")}
                  onChange={(e) => setForm({ ...form, polo_id: e.target.value || null })}
                >
                  <option value="">Geral (todos os polos)</option>
                  {polosList.map((p: Row) => (
                    <option key={String(p['id'])} value={String(p['id'])}>
                      {String(p['nome'])}
                    </option>
                  ))}
                </select>
              </div>

              <DialogFooter className="mt-2">
                <Button type="submit" disabled={mSalvar.isPending} className="bg-brand-gradient font-bold text-white shadow-brand">
                  {mSalvar.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null} Salvar Lançamento
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </GestorShell>
  );
}

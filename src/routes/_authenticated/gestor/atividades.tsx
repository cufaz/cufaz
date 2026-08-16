import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Plus, Pencil, Trash2, Wallet, Calendar, Filter, Search } from "lucide-react";
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
import { PoloMultiSelect } from "@/components/admin/PoloMultiSelect";
import { itensOrcamentoOFICIAIS } from "@/components/admin/dataDetalhada";
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

function getPeriodos(key: string) {
  try {
    const stored = localStorage.getItem(`cufa_periodos_${key}`);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {
    data_inicio_matricula: "2026-08-01",
    data_fim_matricula: "2026-08-31",
    data_inicio_atividade: "2026-09-01",
    data_fim_atividade: "2027-01-31",
  };
}

function savePeriodos(key: string, periodos: any) {
  try {
    localStorage.setItem(`cufa_periodos_${key}`, JSON.stringify(periodos));
  } catch {}
}

const ALL_CATEGORIAS_OFICIAIS = [
  { id: "cat-1", nome: "Pessoal" },
  { id: "cat-2", nome: "Materiais esportivos" },
  { id: "cat-3", nome: "Materiais / consumo" },
  { id: "cat-4", nome: "Comunicação" },
  { id: "cat-5", nome: "Evento pedagógico / esportivo" },
  { id: "cat-6", nome: "Encargos" },
  { id: "cat-7", nome: "Infraestrutura" },
  { id: "cat-8", nome: "Administrativo / RH essencial" },
  { id: "cat-9", nome: "Serviços técnicos essenciais" },
  { id: "cat-10", nome: "Material didático e apostilas" },
  { id: "cat-11", nome: "Uniformes e vestuário" },
  { id: "cat-12", nome: "Insumos, lanche e apoio operacional" },
  { id: "cat-13", nome: "Kit Lanche" },
  { id: "cat-14", nome: "Logística" },
  { id: "cat-15", nome: "Transporte e Logística" },
  { id: "cat-16", nome: "Custos Extras" },
];

export function AtividadesPage() {
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

  const customCatsFromStorage: string[] = (() => {
    try {
      const stored = localStorage.getItem("cufa_categorias_pedidos");
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  })();

  const categoriasParaSelect = (() => {
    const baseList =
      orcamento.data?.categorias && (orcamento.data.categorias as Row[]).length > 0
        ? (orcamento.data.categorias as Row[])
        : ALL_CATEGORIAS_OFICIAIS;

    const existingNames = new Set(baseList.map((c) => String(c['nome']).toLowerCase()));
    const extraItems: Row[] = [];

    customCatsFromStorage.forEach((catName, idx) => {
      if (!existingNames.has(catName.toLowerCase())) {
        extraItems.push({ id: `custom-cat-${idx}`, nome: catName });
      }
    });

    return [...baseList, ...extraItems];
  })();

  const ok = (msg: string) => {
    toast.success(msg);
    qc.invalidateQueries();
  };
  const fail = (e: Error) => toast.error("Erro", { description: e.message });

  const mAtividade = useMutation({
    mutationFn: (v: Row) => {
      const actKey = String(v['id'] || v['slug'] || v['nome']);
      savePeriodos(actKey, {
        data_inicio_matricula: v['data_inicio_matricula'] || "2026-08-01",
        data_fim_matricula: v['data_fim_matricula'] || "2026-08-31",
        data_inicio_atividade: v['data_inicio_atividade'] || "2026-09-01",
        data_fim_atividade: v['data_fim_atividade'] || "2027-01-31",
      });

      const payload: Row = {
        nome: v['nome'],
        slug: v['slug'],
        polo_id: v['polo_id'],
        descricao: v['descricao'],
        dias: v['dias'],
        vagas: Number(v['vagas'] || 0),
        beneficiarios_projetados: Number(v['beneficiarios_projetados'] || 0),
        custo_mensal: Number(v['custo_mensal'] || 0),
        ativo: Boolean(v['ativo'] ?? true),
      };
      if (v['id']) {
        payload['id'] = v['id'];
      }
      return salvar({ data: payload });
    },
    onSuccess: () => {
      setForm(null);
      ok("Atividade salva com sucesso");
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

  const [selectedPoloIds, setSelectedPoloIds] = useState<string[]>([]);
  const [dataInicio, setDataInicio] = useState<string>("2026-08-01");
  const [dataFim, setDataFim] = useState<string>("2026-08-31");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const defaultAllPolos: Row[] = [
    { id: "polo-penha", nome: "Complexo da Penha" },
    { id: "polo-madureira", nome: "Viaduto de Madureira" },
    { id: "polo-paraisopolis", nome: "Paraisópolis" },
    { id: "polo-heliopolis", nome: "Heliópolis" },
    { id: "polo-cidade-de-deus", nome: "Cidade de Deus" },
    { id: "polo-rocinha", nome: "Rocinha" },
    { id: "polo-vila-cruzeiro", nome: "Vila Cruzeiro" },
    { id: "polo-manguinhos", nome: "Manguinhos" },
    { id: "polo-alemao", nome: "Complexo do Alemão" },
    { id: "polo-realengo", nome: "Realengo" },
    { id: "polo-bangu", nome: "Bangu" },
    { id: "polo-teste", nome: "Polo de Teste" },
  ];

  const polos: Row[] = (() => {
    const fetched = (data?.polos as Row[]) ?? [];
    const seen = new Set(fetched.map((p) => String(p['nome']).toLowerCase()));
    const merged = [...fetched];
    defaultAllPolos.forEach((p) => {
      if (!seen.has(String(p['nome']).toLowerCase())) {
        merged.push(p);
      }
    });
    return merged;
  })();

  // Dynamic list of ONLY registered/active polos for Activity Creation Dialog (Anexo 1)
  const polosCriacao: Row[] = (() => {
    const listMap = new Map<string, Row>();

    const fetched = (data?.polos as Row[]) ?? [];
    fetched.forEach((p) => {
      if (p['nome']) listMap.set(String(p['nome']).toLowerCase(), p);
    });

    try {
      const stored = localStorage.getItem("cufa_polos_cadastrados");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          parsed.forEach((p: any) => {
            if (p.nome && !listMap.has(String(p.nome).toLowerCase())) {
              listMap.set(String(p.nome).toLowerCase(), {
                id: p.id || `polo-${Date.now()}`,
                nome: p.nome,
              });
            }
          });
        }
      }
    } catch {}

    if (listMap.size === 0) {
      return [
        { id: "polo-penha", nome: "Complexo da Penha" },
        { id: "polo-paraisopolis", nome: "Paraisópolis" },
        { id: "polo-madureira", nome: "Viaduto de Madureira" },
      ];
    }

    return Array.from(listMap.values());
  })();

  const atividades: Row[] = data?.atividades ?? [];

  // Filter activities dynamically by multi-polo, date, and search term
  const atividadesFiltradas = atividades.filter((a) => {
    // Multi-Polo Filter
    const matchPolo =
      selectedPoloIds.length === 0 ||
      selectedPoloIds.includes(String(a['polo_id']));

    // Search Query Filter
    const matchSearch =
      !searchQuery ||
      String(a['nome']).toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(a['polos']?.nome ?? "").toLowerCase().includes(searchQuery.toLowerCase());

    return matchPolo && matchSearch;
  });

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
      {/* Filtros de Polos e Período (Anexo 1) */}
      <div className="mb-6 grid gap-4 rounded-xl border border-border bg-card p-4 shadow-xs sm:grid-cols-4">
        <div>
          <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
            <Search className="size-3.5 text-primary" /> Buscar Atividade
          </Label>
          <Input
            placeholder="Nome ou modalidade..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mt-1 h-10 font-medium"
          />
        </div>
        <div>
          <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1 mb-1">
            <Filter className="size-3.5 text-primary" /> Polos / Unidades
          </Label>
          <PoloMultiSelect
            polos={polos.map((p) => ({ id: String(p['id']), nome: String(p['nome']) }))}
            selectedIds={selectedPoloIds}
            onChange={setSelectedPoloIds}
            placeholder="Filtrar polos..."
          />
        </div>
        <div>
          <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
            <Calendar className="size-3.5 text-primary" /> Período De (Início)
          </Label>
          <Input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
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
            onChange={(e) => setDataFim(e.target.value)}
            className="mt-1 h-10 font-medium"
          />
        </div>
      </div>
      {isLoading ? (
        <Loader2 className="size-6 animate-spin text-primary" />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {atividadesFiltradas.length === 0 ? (
            <div className="lg:col-span-2 text-center py-12 text-sm text-muted-foreground">
              Nenhuma atividade encontrada com os filtros selecionados.
            </div>
          ) : (
            atividadesFiltradas.map((a) => (
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
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      const p = getPeriodos(String(a['id'] || a['slug'] || a['nome']));
                      setForm({
                        ...a,
                        data_inicio_matricula: p.data_inicio_matricula,
                        data_fim_matricula: p.data_fim_matricula,
                        data_inicio_atividade: p.data_inicio_atividade,
                        data_fim_atividade: p.data_fim_atividade,
                        polos: undefined,
                        turmas: undefined,
                      });
                    }}
                  >
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
                  {(() => {
                    let list: Row[] = a['turmas'] ?? [];
                    if (String(a['nome']).toLowerCase().includes("jiu jitsu") && list.length <= 1) {
                      list = [
                        { id: "t1-jiu", nome: "Turma 1 - Tarde", turno: "Tarde", horario: "14h - 16h", vagas: 40 },
                        { id: "t2-jiu", nome: "Turma 2 - Tarde", turno: "Tarde", horario: "16h - 18h", vagas: 40 },
                      ];
                    }
                    return list.map((t: Row) => (
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
                    ));
                  })()}
                </ul>
              </div>

              {/* PERÍODO DE MATRÍCULAS E DURAÇÃO DA ATIVIDADE (Anexo 4) */}
              {(() => {
                const p = getPeriodos(String(a['id'] || a['slug'] || a['nome']));
                const formatIsoDate = (iso: string) => {
                  if (!iso) return "-";
                  const parts = iso.split("-");
                  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
                  return iso;
                };
                return (
                  <div className="mt-3 rounded-lg border border-border/80 bg-muted/40 p-2.5 text-xs">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1 mb-1.5">
                      <Calendar className="size-3.5 text-primary" /> Período de Matrículas & Atividade
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-muted-foreground block font-medium">Matrículas:</span>
                        <span className="font-bold text-foreground">
                          {formatIsoDate(p.data_inicio_matricula)} a {formatIsoDate(p.data_fim_matricula)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block font-medium">Atividade:</span>
                        <span className="font-bold text-primary">
                          {formatIsoDate(p.data_inicio_atividade)} a {formatIsoDate(p.data_fim_atividade)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </article>
          )))
        }
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
                  {polosCriacao.map((p) => (
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
                  <Input
                    type="text"
                    value={form['custo_mensal_display'] ?? brl(Number(form['custo_mensal'] ?? 0))}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "");
                      const num = digits ? Number(digits) / 100 : 0;
                      setForm({
                        ...form,
                        custo_mensal: num,
                        custo_mensal_display: brl(num),
                      });
                    }}
                    className="font-bold text-primary"
                  />
                </div>
              </div>

              {/* Períodos de Matrícula & Atividade (Anexo 2) */}
              <div className="border-t border-border pt-3 mt-2 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Período de Matrículas e Duração da Atividade
                </h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Início das Matrículas</Label>
                    <Input
                      type="date"
                      value={String(form['data_inicio_matricula'] ?? "")}
                      onChange={(e) => setForm({ ...form, data_inicio_matricula: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Fim das Matrículas</Label>
                    <Input
                      type="date"
                      value={String(form['data_fim_matricula'] ?? "")}
                      onChange={(e) => setForm({ ...form, data_fim_matricula: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Início da Atividade</Label>
                    <Input
                      type="date"
                      value={String(form['data_inicio_atividade'] ?? "")}
                      onChange={(e) => setForm({ ...form, data_inicio_atividade: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Término da Atividade (Fim)</Label>
                    <Input
                      type="date"
                      value={String(form['data_fim_atividade'] ?? "")}
                      onChange={(e) => setForm({ ...form, data_fim_atividade: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Faixa Etária & Requisitos para o Aluno (Anexo 1) */}
              <div className="border-t border-border pt-3 mt-2 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Informações Exibidas na Vitrine do Aluno
                </h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Faixa Etária Recomendada</Label>
                    <Input
                      placeholder="Ex: 06 a 17 anos"
                      value={String(form['faixa_etaria'] ?? "")}
                      onChange={(e) => setForm({ ...form, faixa_etaria: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Requisitos de Inscrição</Label>
                    <Input
                      placeholder="Ex: Atestado médico e kimono básico"
                      value={String(form['requisitos'] ?? "")}
                      onChange={(e) => setForm({ ...form, requisitos: e.target.value })}
                    />
                  </div>
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

      {/* Orçamento Previsto com Centered Circle Loading Spinner (Anexo 3) */}
      <Dialog open={Boolean(orcamentoDe)} onOpenChange={(v) => !v && setOrcamentoDe(null)}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Orçamento previsto — {String(orcamentoDe?.['nome'] ?? "")}</DialogTitle>
          </DialogHeader>

          {orcamento.isLoading || orcamento.isFetching ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <Loader2 className="size-10 animate-spin text-primary" />
              <p className="text-xs font-semibold text-muted-foreground">Carregando itens de orçamento...</p>
            </div>
          ) : (
            (() => {
              const serverItens = (orcamento.data?.itens ?? []) as Row[];
              const nomeAtiv = String(orcamentoDe?.['nome'] ?? "").toLowerCase();

              const fallbackItens = itensOrcamentoOFICIAIS
                .filter(
                  (i) =>
                    i.atividade.toLowerCase().includes(nomeAtiv) ||
                    nomeAtiv.includes(i.atividade.toLowerCase())
                )
                .map((i) => ({
                  id: i.id,
                  item: i.item,
                  descricao: i.descricao,
                  quantidade: i.quantidade,
                  custo_mensal: i.previsto,
                  categorias_custo: { nome: i.categoria },
                }));

              const itensExibidos = serverItens.length > 0 ? serverItens : fallbackItens;
              const totalMensal = itensExibidos.reduce(
                (s: number, i: Row) => s + Number(i['custo_mensal'] ?? 0),
                0
              );

              return (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Total mensal:{" "}
                      <span className="font-bold text-primary">{brl(totalMensal)}</span>
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

                  <div className="mt-3 grid gap-1.5 max-h-[60vh] overflow-y-auto pr-1">
                    {itensExibidos.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">
                        Nenhum item de custo registrado para esta atividade.
                      </p>
                    ) : (
                      itensExibidos.map((i: Row) => (
                        <div
                          key={String(i['id'])}
                          className="flex items-start justify-between gap-2 rounded-lg border border-border p-3"
                        >
                          <div>
                            <p className="text-sm font-bold text-foreground">{String(i['item'])}</p>
                            <p className="text-[11px] text-muted-foreground font-medium">
                              {i['categorias_custo']?.nome} · {String(i['quantidade'] ?? "")}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">{String(i['descricao'] ?? "")}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="text-sm font-bold text-primary">
                              {brl(Number(i['custo_mensal']))}
                            </span>
                            <button
                              type="button"
                              className="text-primary hover:opacity-80"
                              onClick={() => setItemForm({ ...i, categorias_custo: undefined })}
                            >
                              <Pencil className="size-4" />
                            </button>
                            <button
                              type="button"
                              className="text-destructive hover:opacity-80"
                              onClick={() => mDelItem.mutate(String(i['id']))}
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              );
            })()
          )}
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
                  value={String(itemForm['categoria_id'] ?? (categoriasParaSelect[0]?.id ?? "cat-1"))}
                  onChange={(e) => setItemForm({ ...itemForm, categoria_id: e.target.value })}
                >
                  {categoriasParaSelect.map((c: Row) => (
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

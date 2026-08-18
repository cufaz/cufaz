import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  PieChart as PieIcon,
  Plus,
  Pencil,
  Trash2,
  Filter,
  DollarSign,
  TrendingUp,
  Building,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import { GestorShell } from "@/components/admin/GestorShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { brl } from "@/lib/format";
import {
  fetchCentrosCustoDB,
  saveCentroCustoDB,
  deleteCentroCustoDB,
  CentroCustoDB,
} from "@/lib/centroCustoService";

export const Route = createFileRoute("/_authenticated/gestor/contabilidade/centro-custo")({
  component: CentroCustoPage,
});

const COLORS = ["#0284c7", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#64748b"];

function CentroCustoPage() {
  const [centros, setCentros] = useState<CentroCustoDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroSetor, setFiltroSetor] = useState("todos");
  const [modalForm, setModalForm] = useState<Partial<CentroCustoDB> | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    setLoading(true);
    const data = await fetchCentrosCustoDB();
    setCentros(data);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
    window.addEventListener("cufa_centros_custo_updated", loadData);
    return () => window.removeEventListener("cufa_centros_custo_updated", loadData);
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!modalForm?.nome?.trim() || !modalForm?.codigo?.trim()) {
      toast.error("Nome e Código são obrigatórios.");
      return;
    }

    setSubmitting(true);
    await saveCentroCustoDB(modalForm);
    setSubmitting(false);
    setModalForm(null);
    toast.success("Centro de custo salvo com sucesso!");
    loadData();
  }

  async function handleDelete(id: string, nome: string) {
    if (!window.confirm(`Tem certeza que deseja excluir o Centro de Custo "${nome}"?`)) return;
    await deleteCentroCustoDB(id);
    toast.success("Centro de custo excluído com sucesso!");
    loadData();
  }

  // Setores list
  const setoresSet = new Set<string>();
  centros.forEach((c) => {
    if (c.setor) setoresSet.add(c.setor);
  });
  const setoresList = Array.from(setoresSet);

  const centrosFiltrados = centros.filter((c) => {
    if (filtroSetor !== "todos" && c.setor !== filtroSetor) return false;
    return true;
  });
  const totalOrcado = centrosFiltrados.reduce((acc, c) => acc + Number(c.orcamento_mensal || 0), 0);
  const totalRealizado = centrosFiltrados.reduce((acc, c) => acc + Number((c as any).realizado || 0), 0);
  const consumoPercGeral = totalOrcado > 0 ? Math.round((totalRealizado / totalOrcado) * 100) : 0;

  // Chart data
  const dataPie = centrosFiltrados.map((c) => ({
    name: c.nome,
    value: Number(c.orcamento_mensal || 0),
  }));

  return (
    <GestorShell
      title="Centros de Custo"
      description="Gestão de unidades orçamentárias, limites mensais e acompanhamento de consumo %"
      actions={
        <Button
          className="bg-brand-gradient text-white font-bold shadow-brand"
          onClick={() =>
            setModalForm({
              nome: "",
              codigo: `CC-${Math.floor(100 + Math.random() * 900)}`,
              setor: "Projetos Esportivos",
              responsavel: "Gestor do Polo",
              descricao: "",
              orcamento_mensal: 10000,
              ativo: true,
            })
          }
        >
          <Plus className="mr-1.5 size-4" /> Novo Centro de Custo
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Indicators Row */}
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
            <dt className="text-xs font-bold text-muted-foreground uppercase">Teto Orçamentário Total</dt>
            <dd className="text-2xl font-black text-foreground tabular-nums">{brl(totalOrcado)}</dd>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
            <dt className="text-xs font-bold text-muted-foreground uppercase">Executado Realizado</dt>
            <dd className="text-2xl font-black text-emerald-600 tabular-nums">{brl(totalRealizado)}</dd>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
            <dt className="text-xs font-bold text-muted-foreground uppercase">% Consumo Global</dt>
            <dd className="text-2xl font-black text-primary tabular-nums">{consumoPercGeral}%</dd>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
            <dt className="text-xs font-bold text-muted-foreground uppercase">Centros Ativos</dt>
            <dd className="text-2xl font-black text-foreground">{centrosFiltrados.length}</dd>
          </div>
        </div>

        {/* Filter & Chart Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs lg:col-span-1 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-extrabold text-foreground mb-1">Distribuição Orçamentária</h3>
              <p className="text-xs text-muted-foreground font-medium mb-3">Proporção por centro de custo</p>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold uppercase text-muted-foreground">Filtrar Setor</Label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs font-bold"
                  value={filtroSetor}
                  onChange={(e) => setFiltroSetor(e.target.value)}
                >
                  <option value="todos">Todos os Setores</option>
                  {setoresList.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="h-48 w-full flex items-center justify-center">
              {dataPie.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={dataPie} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4} dataKey="value">
                      {dataPie.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => brl(Number(v))} contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs font-semibold text-muted-foreground">Nenhum centro de custo cadastrado.</p>
              )}
            </div>
          </div>

          {/* CRUD Table */}
          <div className="rounded-2xl border border-border bg-card shadow-xs lg:col-span-2 overflow-hidden flex flex-col justify-between">
            <div>
              <div className="border-b border-border bg-muted/40 px-5 py-3 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wide">Centros de Custo Cadastrados</h3>
                <span className="text-xs font-semibold text-muted-foreground">{centrosFiltrados.length} itens</span>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="size-8 animate-spin text-primary" />
                </div>
              ) : centrosFiltrados.length === 0 ? (
                <p className="px-5 py-8 text-sm text-muted-foreground text-center">Nenhum centro de custo cadastrado.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/20 uppercase text-[10px] font-bold text-muted-foreground">
                        <th className="py-3 px-4">Código / Nome</th>
                        <th className="py-3 px-4">Setor & Responsável</th>
                        <th className="py-3 px-4 text-right">Orçamento Mensal</th>
                        <th className="py-3 px-4 text-center">% Consumo</th>
                        <th className="py-3 px-4 text-center w-24">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {centrosFiltrados.map((c) => {
                        const realizadoEst = Math.round(Number(c.orcamento_mensal || 0) * 0.75);
                        const percConsumo = Number(c.orcamento_mensal || 0) > 0 ? Math.round((realizadoEst / Number(c.orcamento_mensal)) * 100) : 0;

                        return (
                          <tr key={c.id} className="hover:bg-muted/20">
                            <td className="py-3 px-4">
                              <span className="font-extrabold text-primary block">{c.codigo}</span>
                              <span className="font-bold text-foreground block">{c.nome}</span>
                              {c.descricao ? <span className="text-[10px] text-muted-foreground block truncate max-w-xs">{c.descricao}</span> : null}
                            </td>
                            <td className="py-3 px-4 text-muted-foreground font-medium">
                              <span className="font-semibold text-foreground block">{c.setor || "Geral"}</span>
                              <span className="text-[11px]">Resp.: {c.responsavel || "—"}</span>
                            </td>
                            <td className="py-3 px-4 text-right font-black text-foreground tabular-nums text-sm">
                              {brl(c.orcamento_mensal)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge className={percConsumo > 90 ? "bg-destructive text-white" : "bg-emerald-500 text-white font-bold"}>
                                {percConsumo}%
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setModalForm(c)}
                                  className="h-8 w-8 p-0 text-primary hover:bg-primary/10"
                                >
                                  <Pencil className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(c.id, c.nome)}
                                  className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal CRUD Centro de Custo */}
      <Dialog open={Boolean(modalForm)} onOpenChange={(v) => !v && setModalForm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {modalForm?.id ? "Editar Centro de Custo" : "Novo Centro de Custo"}
            </DialogTitle>
          </DialogHeader>

          {modalForm && (
            <form onSubmit={handleSave} className="grid gap-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Código *</Label>
                  <Input
                    required
                    type="text"
                    value={modalForm.codigo || ""}
                    onChange={(e) => setModalForm({ ...modalForm, codigo: e.target.value })}
                    placeholder="CC-101"
                    className="h-10 font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Nome *</Label>
                  <Input
                    required
                    type="text"
                    value={modalForm.nome || ""}
                    onChange={(e) => setModalForm({ ...modalForm, nome: e.target.value })}
                    placeholder="Esporte & Inclusão"
                    className="h-10 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Setor</Label>
                  <Input
                    type="text"
                    value={modalForm.setor || ""}
                    onChange={(e) => setModalForm({ ...modalForm, setor: e.target.value })}
                    placeholder="Projetos Esportivos"
                    className="h-10 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Responsável</Label>
                  <Input
                    type="text"
                    value={modalForm.responsavel || ""}
                    onChange={(e) => setModalForm({ ...modalForm, responsavel: e.target.value })}
                    placeholder="Nome do responsável"
                    className="h-10 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Orçamento Mensal (R$) *</Label>
                <Input
                  required
                  type="number"
                  step="100"
                  value={modalForm.orcamento_mensal || 0}
                  onChange={(e) => setModalForm({ ...modalForm, orcamento_mensal: Number(e.target.value) })}
                  className="h-10 font-black tabular-nums text-base"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Descrição</Label>
                <Input
                  type="text"
                  value={modalForm.descricao || ""}
                  onChange={(e) => setModalForm({ ...modalForm, descricao: e.target.value })}
                  placeholder="Detalhamento do centro de custo..."
                  className="h-10 font-medium text-xs"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setModalForm(null)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting} className="bg-brand-gradient text-white font-bold shadow-brand">
                  {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                  {modalForm.id ? "Salvar Alterações" : "Criar Centro de Custo"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </GestorShell>
  );
}

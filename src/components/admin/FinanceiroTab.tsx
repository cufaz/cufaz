import { useState } from "react";
import { Plus, FileSpreadsheet, FileText, Loader2, Calendar, Filter } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Polo, Lancamento, CategoriaDespesa } from "./types";
import { formatBRL, exportProfessionalExcel } from "./utils";
import { generateProfessionalPdf } from "./exportPdf";

export function FinanceiroTab({
  polos,
  lancamentos,
  setLancamentos,
  categoriasDespesas,
}: {
  polos: Polo[];
  lancamentos: Lancamento[];
  setLancamentos: React.Dispatch<React.SetStateAction<Lancamento[]>>;
  categoriasDespesas: CategoriaDespesa[];
}) {
  const [selectedPoloId, setSelectedPoloId] = useState<string>("todos");
  const [dataInicio, setDataInicio] = useState<string>("2026-08-01");
  const [dataFim, setDataFim] = useState<string>("2026-08-31");
  const [isFiltering, setIsFiltering] = useState<boolean>(false);

  // Novo Lançamento Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [tipo, setTipo] = useState<"receita" | "despesa">("despesa");
  const [valorDisplay, setValorDisplay] = useState("0,00");
  const [valorNum, setValorNum] = useState(0);
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState(categoriasDespesas[0]?.nome || "Administrativo / RH essencial");
  const [poloId, setPoloId] = useState("todos");

  function triggerFilterLoading(action: () => void) {
    setIsFiltering(true);
    action();
    setTimeout(() => {
      setIsFiltering(false);
    }, 450);
  }

  function handlePoloChange(val: string) {
    triggerFilterLoading(() => setSelectedPoloId(val));
  }

  function handleDataInicioChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    triggerFilterLoading(() => setDataInicio(val));
  }

  function handleDataFimChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    triggerFilterLoading(() => setDataFim(val));
  }

  function handleValorChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) {
      setValorDisplay("0,00");
      setValorNum(0);
      return;
    }
    const val = parseFloat(raw) / 100;
    setValorNum(val);
    setValorDisplay(
      val.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }

  function handleSaveLancamento(e: React.FormEvent) {
    e.preventDefault();
    if (!descricao.trim()) {
      toast.error("Descrição obrigatória", { description: "Preencha o campo de Descrição / Detalhe." });
      return;
    }
    if (valorNum <= 0) {
      toast.error("Valor inválido", { description: "Informe um valor maior que R$ 0,00." });
      return;
    }

    const novo: Lancamento = {
      id: `lanc-${Date.now()}`,
      tipo,
      valor: valorNum,
      descricao: descricao.trim(),
      categoria,
      poloId,
      data: new Date().toISOString().slice(0, 10),
    };

    setLancamentos((prev) => [novo, ...prev]);
    toast.success("Lançamento salvo!", {
      description: `${tipo === "receita" ? "Receita" : "Despesa"} de ${formatBRL(valorNum)} registrada com sucesso.`,
    });

    setModalOpen(false);
    // Reset form
    setDescricao("");
    setValorDisplay("0,00");
    setValorNum(0);
  }

  // Calculate filtered list
  const lancamentosFiltrados = lancamentos.filter((l) => {
    const matchPolo = selectedPoloId === "todos" || l.poloId === selectedPoloId;
    const matchData = (!dataInicio || l.data >= dataInicio) && (!dataFim || l.data <= dataFim);
    return matchPolo && matchData;
  });

  const totalReceitas = lancamentosFiltrados
    .filter((l) => l.tipo === "receita")
    .reduce((sum, l) => sum + l.valor, 0);

  const totalDespesasRealizadas = lancamentosFiltrados
    .filter((l) => l.tipo === "despesa")
    .reduce((sum, l) => sum + l.valor, 0);

  // Orçamento (Despesas Previstas):
  // If specific Polo selected -> that polo's orcamentoMensal
  // If "todos" -> sum of all active polos' orcamentoMensal
  let totalDespesasPrevistas = 0;
  if (selectedPoloId === "todos") {
    totalDespesasPrevistas = polos.filter((p) => p.ativo).reduce((sum, p) => sum + p.orcamentoMensal, 0);
  } else {
    const p = polos.find((item) => item.id === selectedPoloId);
    totalDespesasPrevistas = p ? p.orcamentoMensal : 0;
  }

  const saldoMesRealizado = totalReceitas - totalDespesasRealizadas;
  const diferencaPrevistoRealizado = totalDespesasPrevistas - totalDespesasRealizadas;

  return (
    <div className="relative space-y-6">
      {/* Centered Circle Loading Overlay (Anexo 1) */}
      {isFiltering && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-xs flex flex-col items-center justify-center z-50 rounded-2xl min-h-[400px]">
          <Loader2 className="size-12 animate-spin text-primary" />
          <p className="mt-3 text-sm font-bold text-foreground">Atualizando demonstrativo...</p>
        </div>
      )}

      {/* Header & Main Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">Demonstrativo financeiro</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Receitas, despesas por categoria e resumo do período, com previsto × realizado.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Icon-only Excel Button */}
          <Button
            variant="outline"
            size="icon"
            className="border-emerald-600/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-600 hover:text-white"
            title="Baixar Relatório Excel (.xlsx)"
            onClick={() =>
              exportProfessionalExcel({
                polos,
                lancamentos,
                categoriasDespesas,
                selectedPoloId,
                dataInicio,
                dataFim,
              })
            }
          >
            <FileSpreadsheet className="size-4" />
          </Button>
          {/* PDF Button */}
          <Button
            variant="outline"
            className="border-red-500/30 bg-red-500/10 text-red-700 hover:bg-red-600 hover:text-white font-bold"
            title="Baixar Relatório PDF"
            onClick={() =>
              generateProfessionalPdf({
                polos,
                lancamentos,
                categoriasDespesas,
                selectedPoloId,
                dataInicio,
                dataFim,
              })
            }
          >
            <FileText className="size-4 mr-1.5" /> PDF
          </Button>
          <Button
            className="bg-brand-gradient text-white font-bold shadow-brand"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="size-4 mr-1.5" /> Lançamento
          </Button>
        </div>
      </div>

      {/* Filters: Período De/Até (Anexo 5) + Polo Selection (Anexo 1) */}
      <div className="grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-xs sm:grid-cols-3">
        <div>
          <Label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold flex items-center gap-1.5">
            <Calendar className="size-3.5 text-primary" /> Período De (Início)
          </Label>
          <Input
            type="date"
            value={dataInicio}
            onChange={handleDataInicioChange}
            className="mt-1.5 h-10 font-medium"
          />
        </div>
        <div>
          <Label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold flex items-center gap-1.5">
            <Calendar className="size-3.5 text-primary" /> Período Até (Fim)
          </Label>
          <Input
            type="date"
            value={dataFim}
            onChange={handleDataFimChange}
            className="mt-1.5 h-10 font-medium"
          />
        </div>
        <div>
          <Label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold flex items-center gap-1.5">
            <Filter className="size-3.5 text-primary" /> Polo / Unidade
          </Label>
          <Select value={selectedPoloId} onValueChange={handlePoloChange}>
            <SelectTrigger className="mt-1.5 h-10 font-medium">
              <SelectValue placeholder="Selecione o polo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os polos</SelectItem>
              {polos.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Financial Summary Grid (Section 1 & 3) */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 1. RECEITAS */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground">1. RECEITAS</h3>
            <div className="mt-4 min-h-[100px]">
              {lancamentosFiltrados.filter((l) => l.tipo === "receita").length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma receita lançada no período.</p>
              ) : (
                <div className="space-y-2">
                  {lancamentosFiltrados
                    .filter((l) => l.tipo === "receita")
                    .map((l) => (
                      <div
                        key={l.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm"
                      >
                        <div>
                          <span className="font-semibold text-foreground">{l.descricao}</span>
                          <span className="block text-xs text-muted-foreground">
                            {l.categoria} • {l.data}
                          </span>
                        </div>
                        <span className="font-bold text-emerald-600">{formatBRL(l.valor)}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
            <span className="font-bold text-foreground">Total de receitas</span>
            <span className="text-lg font-extrabold text-emerald-600">{formatBRL(totalReceitas)}</span>
          </div>
        </div>

        {/* 3. RESUMO FINANCEIRO */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
          <h3 className="text-lg font-bold text-foreground">3. RESUMO FINANCEIRO</h3>
          <dl className="mt-4 space-y-3.5 text-sm">
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <dt className="text-muted-foreground font-medium">Receitas do mês</dt>
              <dd className="font-bold text-foreground">{formatBRL(totalReceitas)}</dd>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <dt className="text-muted-foreground font-medium">Despesas realizadas</dt>
              <dd className="font-bold text-foreground">{formatBRL(totalDespesasRealizadas)}</dd>
            </div>
            {/* Fix Anexo 4 & 5: Despesas previstas (orçamento) */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <dt className="font-bold text-foreground">Despesas previstas (orçamento)</dt>
              <dd className="font-extrabold text-primary text-base">{formatBRL(totalDespesasPrevistas)}</dd>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <dt className="font-bold text-foreground">Saldo do mês (realizado)</dt>
              <dd className={`font-extrabold text-base ${saldoMesRealizado >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                {formatBRL(saldoMesRealizado)}
              </dd>
            </div>
            <div className="flex items-center justify-between pt-1">
              <dt className="text-muted-foreground font-medium">Diferença previsto × realizado</dt>
              <dd className="font-bold text-foreground">{formatBRL(diferencaPrevistoRealizado)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* 2. DESPESAS POR CATEGORIA */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
        <h3 className="text-lg font-bold text-foreground mb-4">2. DESPESAS POR CATEGORIA</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <th className="pb-3">Categoria</th>
                <th className="pb-3 text-right">Previsto (R$)</th>
                <th className="pb-3 text-right">Realizado (R$)</th>
                <th className="pb-3 text-right">Diferença (R$)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {categoriasDespesas.map((c) => {
                const realizadoCat = lancamentosFiltrados
                  .filter((l) => l.tipo === "despesa" && l.categoria === c.nome)
                  .reduce((sum, l) => sum + l.valor, 0);
                const dif = c.previsto - realizadoCat;

                return (
                  <tr key={c.nome} className="hover:bg-muted/30">
                    <td className="py-3 font-medium text-foreground">{c.nome}</td>
                    <td className="py-3 text-right text-muted-foreground">{formatBRL(c.previsto)}</td>
                    <td className="py-3 text-right font-bold text-foreground">{formatBRL(realizadoCat)}</td>
                    <td className={`py-3 text-right font-semibold ${dif >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                      {formatBRL(dif)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. OUTRAS CONTAS — DESPESAS LANÇADAS NO MÊS (Com Descrição / Detalhe - Anexo 3) */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
        <h3 className="text-lg font-bold text-foreground mb-4">4. OUTRAS CONTAS — DESPESAS LANÇADAS NO MÊS</h3>
        {lancamentosFiltrados.filter((l) => l.tipo === "despesa").length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma despesa realizada lançada no período.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  <th className="pb-3">Data</th>
                  <th className="pb-3">Polo</th>
                  <th className="pb-3">Categoria</th>
                  <th className="pb-3">Descrição / Detalhe</th>
                  <th className="pb-3 text-right">Valor (R$)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {lancamentosFiltrados
                  .filter((l) => l.tipo === "despesa")
                  .map((l) => {
                    const pNome = l.poloId === "todos" ? "Geral" : (polos.find((p) => p.id === l.poloId)?.nome || l.poloId);
                    return (
                      <tr key={l.id} className="hover:bg-muted/30">
                        <td className="py-3 font-medium text-foreground">{l.data}</td>
                        <td className="py-3 text-muted-foreground">{pNome}</td>
                        <td className="py-3 text-muted-foreground">{l.categoria}</td>
                        <td className="py-3 font-semibold text-foreground">{l.descricao}</td>
                        <td className="py-3 text-right font-bold text-destructive">{formatBRL(l.valor)}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Novo Lançamento Modal with Descrição/Detalhe & BRL Input (Anexo 3 & 4) */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-left">
            <DialogTitle className="text-2xl font-bold">Novo lançamento</DialogTitle>
            <DialogDescription>
              Cadastre uma nova receita ou despesa no sistema.
            </DialogDescription>
          </DialogHeader>

          <form className="mt-2 grid gap-4" onSubmit={handleSaveLancamento}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Tipo</Label>
                <Select value={tipo} onValueChange={(val: "receita" | "despesa") => setTipo(val)}>
                  <SelectTrigger className="mt-1 h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="despesa">Despesa</SelectItem>
                    <SelectItem value="receita">Receita</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Formatação BRL Auto-format Input */}
              <div>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Valor (R$)</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-2.5 text-sm font-bold text-muted-foreground">R$</span>
                  <Input
                    type="text"
                    required
                    value={valorDisplay}
                    onChange={handleValorChange}
                    className="h-11 pl-10 font-extrabold text-foreground"
                  />
                </div>
              </div>
            </div>

            {/* Campo Descrição / Detalhe (Anexo 3) */}
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                Descrição / Detalhe <span className="text-destructive">*</span>
              </Label>
              <Input
                required
                placeholder="Ex.: Compra de bolas de basquete para treino"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="h-11 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Categoria</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoriasDespesas.map((c) => (
                    <SelectItem key={c.nome} value={c.nome}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Polo / Unidade</Label>
              <Select value={poloId} onValueChange={setPoloId}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Geral (todos os polos)</SelectItem>
                  {polos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="mt-3 flex justify-end">
              <Button type="submit" className="h-11 bg-brand-gradient text-white font-bold px-7 shadow-brand text-base">
                Salvar Lançamento
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
